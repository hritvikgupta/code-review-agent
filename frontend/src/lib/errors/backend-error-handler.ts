/**
 * Backend Error Response Handler
 * 
 * Handles error responses from the backend API and logs them appropriately.
 * Extracts request IDs and error details from backend error responses.
 */

import { ApiErrorResponse } from "@/types";

/**
 * Backend error response structure (matches backend format)
 */
export interface BackendErrorResponse {
  error: string;
  message: string;
  request_id?: string;
  timestamp?: string;
  details?: Record<string, unknown>;
}

/**
 * Logs backend error responses
 */
export function logBackendError(errorResponse: BackendErrorResponse, context?: Record<string, unknown>): void {
  const logData = {
    source: "backend",
    error: errorResponse.error,
    message: errorResponse.message,
    request_id: errorResponse.request_id,
    timestamp: errorResponse.timestamp,
    details: errorResponse.details,
    context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Backend Error:", logData);
  }

  // In production, you would send this to an error tracking service
  // Example: Sentry.captureException(new Error(errorResponse.message), { extra: logData });
}

/**
 * Parses backend error response from HTTP response
 */
export async function parseBackendErrorResponse(response: Response): Promise<BackendErrorResponse | null> {
  if (!response.ok) {
    try {
      const data = await response.json();
      
      // Check if it matches our backend error format
      if (data.error && data.message) {
        return {
          error: data.error,
          message: data.message,
          request_id: data.request_id,
          timestamp: data.timestamp,
          details: data.details,
        };
      }
    } catch {
      // If JSON parsing fails, return a generic error
      return {
        error: "Unknown Error",
        message: `HTTP ${response.status}: ${response.statusText}`,
        request_id: response.headers.get("X-Request-ID") || undefined,
      };
    }
  }
  
  return null;
}

/**
 * Handles backend error responses and logs them
 */
export async function handleBackendErrorResponse(
  response: Response,
  context?: Record<string, unknown>
): Promise<BackendErrorResponse | null> {
  const errorResponse = await parseBackendErrorResponse(response);
  
  if (errorResponse) {
    logBackendError(errorResponse, {
      ...context,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });
  }
  
  return errorResponse;
}

/**
 * Creates a client-side error from backend error response
 */
export function createClientErrorFromBackend(backendError: BackendErrorResponse): Error {
  const error = new Error(backendError.message);
  (error as any).backendError = backendError;
  (error as any).requestId = backendError.request_id;
  return error;
}

