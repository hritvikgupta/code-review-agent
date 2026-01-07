"use client";

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Code Review" }: HeaderProps) {
  return (
    <div style={{ backgroundColor: "#f6f8fa", borderBottom: "1px solid #d0d7de" }}>
      <div style={{ padding: "16px 24px 8px 24px", display: "flex", alignItems: "center", gap: "8px" }}>
        <h1 style={{ fontSize: "14px", fontWeight: "600", color: "#0969da", cursor: "pointer", margin: 0 }}>
          {title}
        </h1>
      </div>
    </div>
  );
}

