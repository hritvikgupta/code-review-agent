import type { Metadata } from "next";

import { CopilotKit } from "@copilotkit/react-core";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";

export const metadata: Metadata = {
  title: "Code Review Agent",
  description: "AI-powered code review and explanation tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={"antialiased"}>
        <ToastProvider>
          <CopilotKit runtimeUrl="/api/copilotkit" agent="code_review_agent">
            {children}
          </CopilotKit>
        </ToastProvider>
      </body>
    </html>
  );
}
