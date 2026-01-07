"use client";

import { Code, CircleDot, BookOpen } from "lucide-react";
import { ViewMode } from "@/types";

interface TabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  issuesCount?: number;
}

export default function Tabs({ viewMode, onViewModeChange, issuesCount = 0 }: TabsProps) {
  return (
    <div style={{ padding: "0 24px", display: "flex", gap: "8px", overflowX: "auto" }}>
      <div
        onClick={() => onViewModeChange("editor")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          cursor: "pointer",
          borderBottom: viewMode === "editor" ? "2px solid #fd8c73" : "2px solid transparent",
          color: viewMode === "editor" ? "#1f2328" : "#636c76",
          fontWeight: viewMode === "editor" ? 600 : 400,
          fontSize: "14px",
        }}
      >
        <Code size={16} /> <span>Code</span>
      </div>
      <div
        onClick={() => onViewModeChange("issues")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          cursor: "pointer",
          borderBottom: viewMode === "issues" ? "2px solid #fd8c73" : "2px solid transparent",
          color: viewMode === "issues" ? "#1f2328" : "#636c76",
          fontWeight: viewMode === "issues" ? 600 : 400,
          fontSize: "14px",
        }}
      >
        <CircleDot size={16} /> <span>Bugs</span>{" "}
        <span
          style={{
            backgroundColor: "rgba(175, 184, 193, 0.2)",
            color: "#1f2328",
            borderRadius: "10px",
            padding: "0 6px",
            fontSize: "12px",
            minWidth: "20px",
            textAlign: "center",
          }}
        >
          {issuesCount}
        </span>
      </div>
      <div
        onClick={() => onViewModeChange("readme")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          cursor: "pointer",
          borderBottom: viewMode === "readme" ? "2px solid #fd8c73" : "2px solid transparent",
          color: viewMode === "readme" ? "#1f2328" : "#636c76",
          fontWeight: viewMode === "readme" ? 600 : 400,
          fontSize: "14px",
        }}
      >
        <BookOpen size={16} /> <span>Readme</span>
      </div>
    </div>
  );
}

