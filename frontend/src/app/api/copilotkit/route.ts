import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, BadGatewayError, ServiceUnavailableError, InternalServerError } from "@/lib/errors";
import { handleBackendErrorResponse, createClientErrorFromBackend } from "@/lib/errors/backend-error-handler";

// 1. You can use any service adapter here for multi-agent support. We use
//    the empty adapter since we're only using one agent.
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime instance and utilize the LangGraph AG-UI
//    integration to setup the connection.
const runtime = new CopilotRuntime({
  agents: {
    code_review_agent: new LangGraphHttpAgent({
      // Original: url: process.env.AGENT_URL || "http://localhost:8123",
      url: process.env.AGENT_URL || "http://localhost:8123/explain",
    }),
  },
});

// 3. Build a Next.js API route that handles the CopilotKit runtime requests.
export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    const response = await handleRequest(req);

    // handleRequest from CopilotKit returns NextResponse in Next.js context
    // Return it directly - errors from backend will be thrown as exceptions
    return response as NextResponse;
  } catch (error) {
    // Handle specific CopilotKit/network errors
    if (error instanceof Error) {
      // Check if it's already a backend error we created
      if ((error as any).backendError) {
        throw error; // Re-throw as-is
      }

      if (error.message.includes("ECONNREFUSED") || error.message.includes("connect")) {
        throw new ServiceUnavailableError(
          "Unable to connect to the code review agent. Please ensure the backend service is running.",
          { agentUrl: process.env.AGENT_URL || "http://localhost:8123" }
        );
      }
      if (error.message.includes("timeout")) {
        throw new BadGatewayError(
          "Request to code review agent timed out. Please try again.",
          { timeout: true }
        );
      }

      // Check for backend error patterns in error messages
      // LangGraphHttpAgent throws errors like: "HTTP 500: {...json...}"
      if (error.message.includes("HTTP 500") || error.message.includes("Internal server error") || error.message.includes("HTTP")) {
        // Try to extract JSON from error message (format: "HTTP 500: {...json...}")
        const jsonMatch = error.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const backendError = JSON.parse(jsonMatch[0]);
            // Log the backend error
            console.error("Backend Error Detected:", {
              requestId: backendError.request_id,
              error: backendError.error,
              message: backendError.message,
              fullError: backendError,
            });

            throw new InternalServerError(
              backendError.message || "Backend service error occurred",
              {
                backendError: backendError.error,
                requestId: backendError.request_id,
                details: backendError.details,
                originalError: error.message,
              }
            );
          } catch (parseError) {
            // If JSON parsing fails, extract request_id manually
            const requestIdMatch = error.message.match(/request_id["']?\s*:\s*["']?([^"'\s}]+)/i);
            throw new InternalServerError(
              "Backend service error. Please check backend logs for details.",
              {
                originalError: error.message,
                requestId: requestIdMatch ? requestIdMatch[1] : undefined,
              }
            );
          }
        } else {
          // Try to extract request_id from error message if present
          const requestIdMatch = error.message.match(/request_id["']?\s*:\s*["']?([^"'\s}]+)/i);
          throw new InternalServerError(
            "Backend service error. Please check backend logs for details.",
            {
              originalError: error.message,
              requestId: requestIdMatch ? requestIdMatch[1] : undefined,
            }
          );
        }
      }
    }
    throw error;
  }
});
