/**
 * API Error Handler
 * 
 * Handles errors in API routes and provides proper HTTP responses.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  HttpException,
  toHttpException,
  isHttpException,
  InternalServerError,
} from "./http-errors";
import { ApiErrorResponse } from "@/types";

/**
 * Error handler middleware for API routes
 */
export function handleApiError(
  error: unknown,
  request?: NextRequest
): NextResponse<ApiErrorResponse> {
  const httpError = toHttpException(error);
  
  // Extract backend request ID from error details if present
  const backendRequestId = httpError.details?.requestId || httpError.details?.request_id;
  
  // Log error for monitoring (in production, send to error tracking service)
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", {
      statusCode: httpError.statusCode,
      message: httpError.message,
      error: httpError.error,
      details: httpError.details,
      backendRequestId,
      url: request?.url,
      method: request?.method,
      stack: httpError.stack,
    });
    
    // If this is a backend error, log it separately for visibility
    if (backendRequestId || httpError.details?.backendError) {
      console.error("Backend Error Detected:", {
        requestId: backendRequestId,
        backendError: httpError.details?.backendError,
        message: httpError.message,
        fullDetails: httpError.details,
      });
    }
  }

  // Include backend request ID in response if available
  const baseResponse = httpError.toJSON();
  const errorResponse: ApiErrorResponse = backendRequestId
    ? { ...baseResponse, request_id: String(backendRequestId) }
    : baseResponse;

  return NextResponse.json(
    errorResponse,
    { status: httpError.statusCode }
  );
}

/**
 * Async error wrapper for API route handlers
 * Catches errors and converts them to proper HTTP responses
 */
export function withErrorHandler<T = unknown>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest): Promise<NextResponse<T | ApiErrorResponse>> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error, req);
    }
  };
}

/**
 * Validates request and throws appropriate errors
 */
export function validateRequest(
  req: NextRequest,
  options?: {
    requiredMethod?: string;
    requiredBody?: boolean;
    requiredHeaders?: string[];
  }
): void {
  if (options?.requiredMethod && req.method !== options.requiredMethod) {
    throw new HttpException(
      405,
      `Method ${req.method} not allowed. Expected ${options.requiredMethod}`,
      "Method Not Allowed"
    );
  }

  // Additional validations can be added here
}

