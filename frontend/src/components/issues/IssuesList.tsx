"use client";

import { Issue } from "@/types";
import { CircleDot, MessageSquare } from "lucide-react";

interface IssuesListProps {
  issues: Issue[];
  onCreateIssue: () => void;
  onSelectIssue: (issueId: number) => void;
}

export default function IssuesList({ issues, onCreateIssue, onSelectIssue }: IssuesListProps) {
  const openIssues = issues.filter((i) => i.status === "open");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button
          onClick={onCreateIssue}
          style={{
            backgroundColor: "#2da44e",
            color: "white",
            border: "1px solid rgba(27,31,36,0.15)",
            borderRadius: "6px",
            padding: "5px 16px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          New bug
        </button>
      </div>
      <div style={{ border: "1px solid #d0d7de", borderRadius: "6px", overflow: "hidden" }}>
        <div
          style={{
            backgroundColor: "#f6f8fa",
            padding: "16px",
            borderBottom: "1px solid #d0d7de",
            display: "flex",
            gap: "10px",
            fontSize: "14px",
            fontWeight: "600",
            color: "#1f2328",
          }}
        >
          <CircleDot size={16} /> {openIssues.length} Open
        </div>
        {issues.map((issue) => (
          <div
            key={issue.id}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #d0d7de",
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
            }}
          >
            <CircleDot size={16} color="green" style={{ marginTop: "2px" }} />
            <div>
              <div
                onClick={() => onSelectIssue(issue.id)}
                style={{
                  fontWeight: "600",
                  fontSize: "16px",
                  color: "#1f2328",
                  cursor: "pointer",
                  marginBottom: "4px",
                }}
              >
                {issue.title}
              </div>
              <div style={{ fontSize: "12px", color: "#636c76" }}>
                #{issue.id} opened just now by {issue.author}
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#636c76",
                fontSize: "12px",
              }}
            >
              <MessageSquare size={14} /> {issue.comments.length - 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

