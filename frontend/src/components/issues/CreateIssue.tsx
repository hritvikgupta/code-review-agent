"use client";

import { Bold, Italic, Quote, Code as CodeIcon } from "lucide-react";

interface CreateIssueProps {
  title: string;
  body: string;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function CreateIssue({
  title,
  body,
  onTitleChange,
  onBodyChange,
  onSubmit,
  onCancel,
}: CreateIssueProps) {
  return (
    <div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "400",
          marginBottom: "16px",
          paddingTop: "0px",
          color: "#1f2328",
        }}
      >
        New Bug
      </h2>
      <div style={{ display: "flex", gap: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#e5e7eb",
          }}
        ></div>
        <div
          style={{
            flex: 1,
            border: "1px solid #d0d7de",
            borderRadius: "6px",
            padding: "16px",
            backgroundColor: "white",
          }}
        >
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d0d7de",
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "16px",
              backgroundColor: "#f6f8fa",
              outline: "none",
              color: "#1f2328",
            }}
          />
          <div style={{ border: "1px solid #d0d7de", borderRadius: "6px" }}>
            <div
              style={{
                padding: "8px",
                borderBottom: "1px solid #d0d7de",
                backgroundColor: "#f6f8fa",
                display: "flex",
                gap: "8px",
              }}
            >
              <Bold size={16} color="#636c76" style={{ cursor: "pointer" }} />
              <Italic size={16} color="#636c76" style={{ cursor: "pointer" }} />
              <Quote size={16} color="#636c76" style={{ cursor: "pointer" }} />
              <CodeIcon size={16} color="#636c76" style={{ cursor: "pointer" }} />
            </div>
            <textarea
              placeholder="Leave a comment"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              style={{
                width: "100%",
                minHeight: "150px",
                padding: "8px",
                border: "none",
                resize: "vertical",
                outline: "none",
                fontSize: "14px",
                color: "#1f2328",
                backgroundColor: "#ffffff",
              }}
            />
            <div
              style={{
                padding: "8px",
                borderTop: "1px dashed #d0d7de",
                fontSize: "12px",
                color: "#636c76",
              }}
            >
              Attach files by dragging & dropping.
            </div>
          </div>
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "5px 16px",
                borderRadius: "6px",
                border: "none",
                background: "none",
                color: "#636c76",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
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
              Submit new bug
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

