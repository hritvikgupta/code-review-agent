/**
 * TypeScript Type Definitions
 * 
 * Centralized type definitions for the application.
 * This follows professional practices by keeping all types in one place.
 */

// File System Types
export type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
};

// Issue Tracker Types
export type Comment = {
  id: string;
  author: string;
  content: string; // Markdown supported
  createdAt: Date;
  isDescription?: boolean; // To distinguish the main post
};

export type Issue = {
  id: number;
  title: string;
  status: "open" | "closed";
  comments: Comment[];
  createdAt: Date;
  author: string;
};

// Project Types
export type Project = {
  id: string;
  name: string;
};

// View Mode Types
export type ViewMode = "editor" | "readme" | "issues";
export type IssueViewMode = "list" | "create" | "detail";

// Component Props Types
export interface CodeExplainerProps {
  code: string;
  onCodeChange: (code: string) => void;
  language?: string;
}

// API Response Types
export interface ApiErrorResponse {
  error: string;
  message: string;
  request_id?: string;
  status_code: number;
  timestamp?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  data: T;
  message?: string;
  request_id?: string;
}

// HTTP Error Types
export type HttpStatusCode = 
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 405 // Method Not Allowed
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504; // Gateway Timeout

export interface HttpError {
  statusCode: HttpStatusCode;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

