"use client";

import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { CodeExplainerProps } from "@/types";

export default function CodeExplainer({ code, onCodeChange, language = "python" }: CodeExplainerProps) {
    const [analysisStatus, setAnalysisStatus] = useState<string>("");

    // Share the code with the agent so it can access it
    useCopilotReadable({
        description: "The user's code to analyze and review",
        value: code,
    });

    // Action that the agent can call to trigger analysis
    useCopilotAction({
        name: "explainCode",
        description: "Analyze and explain the provided code",
        parameters: [
            {
                name: "code",
                type: "string",
                description: "The code to analyze",
                required: true,
            },
        ],
        handler: async ({ code }) => {
            setAnalysisStatus("Analyzing code...");
            // The actual analysis happens on the backend
            setTimeout(() => setAnalysisStatus(""), 2000);
            return { success: true };
        },
    });

    return (
        <div
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#ffffff",
                color: "#1f2937",
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            }}
        >
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden" // Ensure editor doesn't overflow
                }}
            >
                <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                    <Editor
                        height="100%"
                        defaultLanguage="python"
                        language={language}
                        value={code}
                        onChange={(value) => onCodeChange(value || "")}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 24, bottom: 24 },
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                            renderLineHighlight: "all",
                            scrollbar: {
                                vertical: "visible",
                                horizontal: "visible"
                            }
                        }}
                        theme="light"
                    />
                </div>

                {analysisStatus && (
                    <div
                        style={{
                            marginTop: "16px",
                            padding: "12px 16px",
                            backgroundColor: "#eff6ff",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                width: "16px",
                                height: "16px",
                                border: "2px solid #3b82f6",
                                borderTopColor: "transparent",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                            }}
                        />
                        <span style={{ fontWeight: "500" }}>{analysisStatus}</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
