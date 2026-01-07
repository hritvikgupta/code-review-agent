"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "error" | "success" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showSuccess: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

const toastStyles: Record<ToastType, React.CSSProperties> = {
    error: {
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        color: "#dc2626",
    },
    success: {
        backgroundColor: "#f0fdf4",
        borderColor: "#bbf7d0",
        color: "#16a34a",
    },
    warning: {
        backgroundColor: "#fffbeb",
        borderColor: "#fde68a",
        color: "#d97706",
    },
    info: {
        backgroundColor: "#eff6ff",
        borderColor: "#bfdbfe",
        color: "#2563eb",
    },
};

const icons: Record<ToastType, string> = {
    error: "✕",
    success: "✓",
    warning: "⚠",
    info: "ℹ",
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType = "info", duration: number = 2000) => {
            const id = Date.now().toString();
            const toast: Toast = { id, message, type, duration };

            setToasts((prev) => [...prev.slice(-4), toast]); // Keep max 5 toasts

            setTimeout(() => {
                removeToast(id);
            }, duration);
        },
        [removeToast]
    );

    const showError = useCallback(
        (message: string, duration: number = 2000) => {
            showToast(message, "error", duration);
        },
        [showToast]
    );

    const showSuccess = useCallback(
        (message: string, duration: number = 2000) => {
            showToast(message, "success", duration);
        },
        [showToast]
    );

    return (
        <ToastContext.Provider value={{ showToast, showError, showSuccess }}>
            {children}

            {/* Toast Container - Fixed in top right */}
            <div
                style={{
                    position: "fixed",
                    top: "16px",
                    right: "16px",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxWidth: "400px",
                }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "1px solid",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            animation: "slideIn 0.2s ease-out",
                            fontSize: "14px",
                            fontWeight: 500,
                            fontFamily: "Inter, system-ui, sans-serif",
                            ...toastStyles[toast.type],
                        }}
                    >
                        <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                            {icons[toast.type]}
                        </span>
                        <span style={{ flex: 1 }}>{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                opacity: 0.6,
                                fontSize: "16px",
                                padding: 0,
                                color: "inherit",
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </ToastContext.Provider>
    );
}
