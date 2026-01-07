"use client";

import { FileNode } from "@/types";

interface FileTabsProps {
  openFiles: FileNode[];
  selectedFileId: string;
  onSelectFile: (fileId: string) => void;
  onCloseTab: (e: React.MouseEvent, fileId: string) => void;
}

export default function FileTabs({
  openFiles,
  selectedFileId,
  onSelectFile,
  onCloseTab,
}: FileTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "#f6f8fa",
        borderBottom: "1px solid #d0d7de",
        overflowX: "auto",
        paddingLeft: "16px",
      }}
    >
      {openFiles.map((file) => (
        <div
          key={file.id}
          onClick={() => onSelectFile(file.id)}
          style={{
            padding: "8px 12px",
            fontSize: "12px",
            cursor: "pointer",
            backgroundColor: selectedFileId === file.id ? "#ffffff" : "transparent",
            color: selectedFileId === file.id ? "#2563eb" : "#6b7280",
            borderRight: "1px solid #d0d7de",
            borderLeft: "1px solid #d0d7de",
            borderTop: selectedFileId === file.id ? "2px solid #fd8c73" : "1px solid transparent",
            borderBottom: selectedFileId === file.id ? "1px solid transparent" : "1px solid #d0d7de",
            marginBottom: "-1px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: "100px",
            justifyContent: "space-between",
            fontWeight: selectedFileId === file.id ? 500 : 400,
            borderTopLeftRadius: "6px",
            borderTopRightRadius: "6px",
            marginTop: "4px",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>{file.name}</span>
          <button
            onClick={(e) => onCloseTab(e, file.id)}
            style={{
              borderRadius: "50%",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

