"use client";

import { Issue } from "@/types";
import { CircleDot, Edit2 } from "lucide-react";

interface IssueDetailProps {
  issue: Issue;
  newCommentBody: string;
  onCommentBodyChange: (body: string) => void;
  onAddComment: () => void;
  onBack: () => void;
  editingIssueId: number | null;
  tempTitle: string;
  onTempTitleChange: (title: string) => void;
  onStartEditing: (issue: Issue) => void;
  onSaveTitle: () => void;
  onCancelEditing: () => void;
}

export default function IssueDetail({
  issue,
  newCommentBody,
  onCommentBodyChange,
  onAddComment,
  onBack,
  editingIssueId,
  tempTitle,
  onTempTitleChange,
  onStartEditing,
  onSaveTitle,
  onCancelEditing,
}: IssueDetailProps) {
  return (
    <div style={{ color: "#1f2328" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
          borderBottom: "1px solid #d0d7de",
          paddingBottom: "16px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            {editingIssueId === issue.id ? (
              <div style={{ display: "flex", gap: "8px", flex: 1, alignItems: "center" }}>
                <input
                  value={tempTitle}
                  onChange={(e) => onTempTitleChange(e.target.value)}
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #2563eb",
                    width: "100%",
                    color: "#1f2328",
                    backgroundColor: "#ffffff",
                  }}
                />
                <button
                  onClick={onSaveTitle}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#2da44e",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={onCancelEditing}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#f3f4f6",
                    color: "#1f2328",
                    border: "1px solid #d0d7de",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "400",
                  margin: 0,
                  color: "#1f2328",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {issue.title}
                <span style={{ color: "#636c76", fontWeight: "300" }}>#{issue.id}</span>
                <button
                  onClick={() => onStartEditing(issue)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    padding: "4px",
                  }}
                  title="Edit Title"
                >
                  <Edit2 size={20} />
                </button>
              </h1>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#636c76" }}>
            <span
              style={{
                backgroundColor: "#2da44e",
                color: "white",
                padding: "5px 12px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: "500",
              }}
            >
              <CircleDot size={14} fill="white" /> Open
            </span>
            <span>
              {issue.author} opened this bug just now · {issue.comments.length - 1} comments
            </span>
          </div>
        </div>
        <button
          onClick={onBack}
          style={{
            border: "1px solid #d0d7de",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            cursor: "pointer",
            color: "#1f2328",
          }}
        >
          Back to list
        </button>
      </div>

      {/* Comments */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {issue.comments.map((comment) => (
          <div key={comment.id} style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#e5e7eb",
                flexShrink: 0,
              }}
            ></div>
            <div style={{ flex: 1, border: "1px solid #d0d7de", borderRadius: "6px", backgroundColor: "#ffffff" }}>
              <div
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f6f8fa",
                  borderBottom: "1px solid #d0d7de",
                  borderTopLeftRadius: "6px",
                  borderTopRightRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#1f2328",
                }}
              >
                <span>
                  <strong>{comment.author}</strong> commented just now
                </span>
                {comment.isDescription && (
                  <span
                    style={{
                      border: "1px solid #d0d7de",
                      padding: "0 6px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      color: "#636c76",
                    }}
                  >
                    Owner
                  </span>
                )}
              </div>
              <div style={{ padding: "16px", fontSize: "14px", lineHeight: "1.5", color: "#1f2328" }}>
                {comment.content || <i>No description provided.</i>}
              </div>
            </div>
          </div>
        ))}

        {/* New Comment Box */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#e5e7eb",
              flexShrink: 0,
            }}
          ></div>
          <div style={{ flex: 1, border: "1px solid #d0d7de", borderRadius: "6px", backgroundColor: "#ffffff" }}>
            <div
              style={{
                padding: "8px",
                borderBottom: "1px solid #d0d7de",
                backgroundColor: "#f6f8fa",
                display: "flex",
                gap: "8px",
                borderTopLeftRadius: "6px",
                borderTopRightRadius: "6px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "600", padding: "4px 8px", cursor: "pointer", color: "#1f2328" }}>
                Write
              </span>
            </div>
            <textarea
              placeholder="Leave a comment"
              value={newCommentBody}
              onChange={(e) => onCommentBodyChange(e.target.value)}
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "8px",
                border: "none",
                resize: "vertical",
                outline: "none",
                fontSize: "14px",
                color: "#1f2328",
                backgroundColor: "#ffffff",
              }}
            />
            <div style={{ padding: "8px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #d0d7de" }}>
              <button
                onClick={onAddComment}
                style={{
                  padding: "5px 16px",
                  borderRadius: "6px",
                  backgroundColor: "#2da44e",
                  color: "white",
                  border: "1px solid rgba(27,31,36,0.15)",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

