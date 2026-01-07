/**
 * HTTP Error Handling Utilities
 * 
 * Professional error handling for API requests and responses.
 * Provides standardized error responses with proper HTTP status codes.
 */

import { HttpStatusCode, HttpError, ApiErrorResponse } from "@/types";

/**
 * Custom HTTP Error Class
 */
export class HttpException extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly error: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: HttpStatusCode,
    message: string,
    error?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "HttpException";
    this.statusCode = statusCode;
    this.error = error || this.getDefaultErrorName(statusCode);
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpException);
    }
  }

  private getDefaultErrorName(statusCode: HttpStatusCode): string {
    const errorNames: Record<HttpStatusCode, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      409: "Conflict",
      422: "Unprocessable Entity",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
    };
    return errorNames[statusCode] || "Unknown Error";
  }

  toJSON(): ApiErrorResponse {
    return {
      error: this.error,
      message: this.message,
      status_code: this.statusCode,
      timestamp: new Date().toISOString(),
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Predefined HTTP Error Classes
 */
export class BadRequestError extends HttpException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, message, "Bad Request", details);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends HttpException {
  constructor(message: string = "Unauthorized", details?: Record<string, unknown>) {
    super(401, message, "Unauthorized", details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends HttpException {
  constructor(message: string = "Forbidden", details?: Record<string, unknown>) {
    super(403, message, "Forbidden", details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends HttpException {
  constructor(message: string = "Resource not found", details?: Record<string, unknown>) {
    super(404, message, "Not Found", details);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends HttpException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(409, message, "Conflict", details);
    this.name = "ConflictError";
  }
}

export class UnprocessableEntityError extends HttpException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(422, message, "Unprocessable Entity", details);
    this.name = "UnprocessableEntityError";
  }
}

export class TooManyRequestsError extends HttpException {
  constructor(message: string = "Too many requests", details?: Record<string, unknown>) {
    super(429, message, "Too Many Requests", details);
    this.name = "TooManyRequestsError";
  }
}

export class InternalServerError extends HttpException {
  constructor(message: string = "Internal server error", details?: Record<string, unknown>) {
    super(500, message, "Internal Server Error", details);
    this.name = "InternalServerError";
  }
}

export class BadGatewayError extends HttpException {
  constructor(message: string = "Bad gateway", details?: Record<string, unknown>) {
    super(502, message, "Bad Gateway", details);
    this.name = "BadGatewayError";
  }
}

export class ServiceUnavailableError extends HttpException {
  constructor(message: string = "Service unavailable", details?: Record<string, unknown>) {
    super(503, message, "Service Unavailable", details);
    this.name = "ServiceUnavailableError";
  }
}

export class GatewayTimeoutError extends HttpException {
  constructor(message: string = "Gateway timeout", details?: Record<string, unknown>) {
    super(504, message, "Gateway Timeout", details);
    this.name = "GatewayTimeoutError";
  }
}

/**
 * Error Handler Utility Functions
 */

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  statusCode: HttpStatusCode,
  message: string,
  error?: string,
  details?: Record<string, unknown>
): ApiErrorResponse {
  return {
    error: error || getDefaultErrorName(statusCode),
    message,
    status_code: statusCode,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };
}

/**
 * Gets default error name for status code
 */
function getDefaultErrorName(statusCode: HttpStatusCode): string {
  const errorNames: Record<HttpStatusCode, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return errorNames[statusCode] || "Unknown Error";
}

/**
 * Checks if error is an HttpException
 */
export function isHttpException(error: unknown): error is HttpException {
  return error instanceof HttpException;
}

/**
 * Converts unknown error to HttpException
 */
export function toHttpException(error: unknown): HttpException {
  if (isHttpException(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new InternalServerError(error.message, { originalError: error.name });
  }
  
  return new InternalServerError("An unknown error occurred", { originalError: String(error) });
}

