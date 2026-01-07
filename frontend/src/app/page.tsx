"use client";

import { useState, useEffect } from "react";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotChat } from "@copilotkit/react-core";
import CodeExplainer from "@/components/CodeExplainer";
import FileExplorer from "@/components/FileExplorer";
import Header from "@/components/layout/Header";
import Tabs from "@/components/layout/Tabs";
import FileTabs from "@/components/editor/FileTabs";
import IssuesView from "@/components/issues";
import { useToast } from "@/components/Toast";
import { FileNode, Project, Issue, ViewMode, IssueViewMode } from "@/types";

export default function CopilotKitPage() {
  // --- Projects State ---
  const [projects, setProjects] = useState<Project[]>([
    { id: "p1", name: "langgraph-fastapi" },
    { id: "p2", name: "react-agent-ui" },
    { id: "p3", name: "python-backend-service" },
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string>("p1");

  // --- File System State ---
  const initialFilesP1: FileNode[] = [
    {
      id: "root",
      name: "src",
      type: "folder",
      children: [
        { id: "1", name: "main.py", type: "file", content: "print('Hello World')\n\ndef main():\n    pass" },
        { id: "2", name: "utils.py", type: "file", content: "import os\n\ndef get_path():\n    return os.getcwd()" },
        {
          id: "folder-1",
          name: "components",
          type: "folder",
          children: [
            { id: "3", name: "Button.tsx", type: "file", content: "export default function Button() {\n  return <button>Click me</button>\n}" },
          ],
        },
      ],
    },
    { id: "4", name: "README.md", type: "file", content: "# Project Title\n\nThis is a readme file." },
  ];

  const initialFilesP2: FileNode[] = [
    {
      id: "p2-root",
      name: "app",
      type: "folder",
      children: [
        { id: "p2-1", name: "App.tsx", type: "file", content: "export default function App() { return <div>Hello</div> }" },
        { id: "p2-2", name: "index.css", type: "file", content: "body { margin: 0; }" },
      ],
    },
    { id: "p2-readme", name: "README.md", type: "file", content: "# React Agent UI\n\nFrontend for the agent." },
  ];

  const initialFilesP3: FileNode[] = [
    {
      id: "p3-root",
      name: "backend",
      type: "folder",
      children: [
        { id: "p3-1", name: "server.py", type: "file", content: "# Flask Server\nfrom flask import Flask\napp = Flask(__name__)" },
      ],
    },
    { id: "p3-readme", name: "README.md", type: "file", content: "# Python Backend\n\nBackend service." },
  ];

  const [projectFilesMap, setProjectFilesMap] = useState<Record<string, FileNode[]>>({
    p1: initialFilesP1,
    p2: initialFilesP2,
    p3: initialFilesP3,
  });

  const [files, setFiles] = useState<FileNode[]>(initialFilesP1);
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("1");
  const [viewMode, setViewMode] = useState<ViewMode>("editor");

  // --- Issue Tracker State ---
  const [issueViewMode, setIssueViewMode] = useState<IssueViewMode>("list");
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [tempIssueTitle, setTempIssueTitle] = useState("");

  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 1,
      title: "First Empty Bug",
      status: "open",
      author: "user",
      createdAt: new Date(),
      comments: [{ id: "c1", author: "user", content: "This is an example bug.", createdAt: new Date(), isDescription: true }],
    },
  ]);

  // Form States
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueBody, setNewIssueBody] = useState("");
  const [newCommentBody, setNewCommentBody] = useState("");

  // --- Helper Functions ---
  const findFile = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFile(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    if (openFiles.length === 0 && files.length > 0) {
      // Try to open readme or first file
      const readme = findFile(files, "4") || findFile(files, "p2-readme") || findFile(files, "p3-readme");
      if (readme) {
        // Auto-open logic can be added here if needed
      }
    }
  }, []);

  const selectedFile = findFile(files, selectedFileId);
  const readmeFile =
    files.find((f) => f.name.toLowerCase() === "readme.md") ||
    findFile(files, "4") ||
    ({ id: "readme", name: "README.md", type: "file" as const, content: "# Readme" } as FileNode);

  // Recursive Updates
  const updateFileContent = (nodes: FileNode[], id: string, newContent: string): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === id) {
        return { ...node, content: newContent };
      }
      if (node.children) {
        return { ...node, children: updateFileContent(node.children, id, newContent) };
      }
      return node;
    });
  };

  const renameNode = (nodes: FileNode[], id: string, newName: string): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === id) return { ...node, name: newName };
      if (node.children) return { ...node, children: renameNode(node.children, id, newName) };
      return node;
    });
  };

  const addChildNode = (nodes: FileNode[], parentId: string, newNode: FileNode): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === parentId && node.type === "folder") {
        return { ...node, children: [...(node.children || []), newNode] };
      }
      if (node.children) {
        return { ...node, children: addChildNode(node.children, parentId, newNode) };
      }
      return node;
    });
  };

  const deleteNode = (nodes: FileNode[], id: string): FileNode[] => {
    return nodes.filter((node) => node.id !== id).map((node) => ({
      ...node,
      children: node.children ? deleteNode(node.children, id) : undefined,
    }));
  };

  // --- Project Management Functions ---
  const handleSwitchProject = (projectId: string) => {
    if (projectId === activeProjectId) return;

    // 1. Save current project files
    const newMap = { ...projectFilesMap, [activeProjectId]: files };
    setProjectFilesMap(newMap);

    // 2. Load new project files
    const nextFiles = newMap[projectId] || [];
    setFiles(nextFiles);
    setActiveProjectId(projectId);

    // 3. Reset View State
    setOpenFiles([]);
    setSelectedFileId("");
    setViewMode("editor");
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p)));
  };

  const updateFiles = (newFiles: FileNode[]) => {
    setFiles(newFiles);
    setProjectFilesMap((prev) => ({ ...prev, [activeProjectId]: newFiles }));
  };

  // Handlers for File Actions
  const handleRenameNode = (id: string, newName: string) => {
    updateFiles(renameNode(files, id, newName));
  };

  const handleCreateNode = (parentId: string, type: "file" | "folder") => {
    const newNode: FileNode = {
      id: Date.now().toString(),
      name: type === "file" ? "new_file.py" : "new_folder",
      type,
      content: type === "file" ? "" : undefined,
      children: type === "folder" ? [] : undefined,
    };
    updateFiles(addChildNode(files, parentId, newNode));
  };

  const handleDeleteNode = (id: string) => {
    const newFiles = deleteNode(files, id);
    setFiles(newFiles);
    setProjectFilesMap((prev) => ({ ...prev, [activeProjectId]: newFiles }));

    if (selectedFileId === id) setSelectedFileId("");
    setOpenFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const activeCode = viewMode === "editor" ? selectedFile?.content || "" : viewMode === "readme" ? readmeFile.content || "" : "";
  const activeLanguage = viewMode === "editor" ? "python" : "markdown";

  const handleActiveCodeChange = (newCode: string) => {
    if (viewMode === "editor") {
      updateFiles(updateFileContent(files, selectedFileId, newCode));
    } else if (viewMode === "readme") {
      updateFiles(updateFileContent(files, readmeFile.id, newCode));
    }
  };

  const handleSelectFile = (file: FileNode) => {
    if (file.name.toLowerCase() === "readme.md") {
      setViewMode("readme");
      return;
    }
    setViewMode("editor");
    if (!openFiles.find((f) => f.id === file.id)) {
      setOpenFiles((prev) => [...prev, file]);
    }
    setSelectedFileId(file.id);
  };

  const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter((f) => f.id !== fileId);
    setOpenFiles(newOpenFiles);

    if (selectedFileId === fileId) {
      if (newOpenFiles.length > 0) {
        setSelectedFileId(newOpenFiles[newOpenFiles.length - 1].id);
      } else {
        setSelectedFileId("");
      }
    }
  };

  const handleCreateFile = () => {
    const newFile: FileNode = { id: Date.now().toString(), name: "new_file.py", type: "file", content: "# New file\n" };
    updateFiles([...files, newFile]);
    handleSelectFile(newFile);
  };

  const handleCreateFolder = () => {
    const newFolder: FileNode = { id: Date.now().toString(), name: "New Folder", type: "folder", children: [] };
    updateFiles([...files, newFolder]);
  };

  const handleCloneRepo = () => alert("Coming soon!");

  // --- Issue Handlers ---
  const handleCreateIssue = () => {
    if (!newIssueTitle.trim()) return;
    const newId = issues.length + 1;
    const newIssue: Issue = {
      id: newId,
      title: newIssueTitle,
      status: "open",
      author: "user",
      createdAt: new Date(),
      comments: [{ id: Date.now().toString(), author: "user", content: newIssueBody, createdAt: new Date(), isDescription: true }],
    };
    setIssues([newIssue, ...issues]);
    setNewIssueTitle("");
    setNewIssueBody("");
    setIssueViewMode("list");
  };

  const handleAddComment = () => {
    if (!newCommentBody.trim() || selectedIssueId === null) return;
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === selectedIssueId) {
          return {
            ...issue,
            comments: [...issue.comments, { id: Date.now().toString(), author: "user", content: newCommentBody, createdAt: new Date() }],
          };
        }
        return issue;
      })
    );
    setNewCommentBody("");
  };

  const startEditingIssueTitle = (issue: Issue) => {
    setEditingIssueId(issue.id);
    setTempIssueTitle(issue.title);
  };

  const saveIssueTitle = () => {
    if (editingIssueId && tempIssueTitle.trim()) {
      setIssues((prev) => prev.map((i) => (i.id === editingIssueId ? { ...i, title: tempIssueTitle } : i)));
      setEditingIssueId(null);
    }
  };

  const cancelEditingIssueTitle = () => {
    setEditingIssueId(null);
    setTempIssueTitle("");
  };

  return (
    <main
      style={
        {
          "--copilot-kit-primary-color": "#202020",
          "--copilot-kit-shadow-sm": "none",
          "--copilot-kit-shadow-md": "none",
          "--copilot-kit-shadow-lg": "none",
          "--copilot-kit-shadow-xl": "none",
        } as CopilotKitCSSProperties
      }
    >
      <CopilotSidebar
        disableSystemMessage={true}
        clickOutsideToClose={false}
        defaultOpen
        className="custom-copilot-sidebar"
        labels={{ title: "Code Review Agent", initial: "👋 Hi! Ready to review your code." }}
        suggestions={[
          { title: "Explain Code", message: "Explain the code in the active tab." },
          { title: "Find Bugs", message: "Find bugs in the code in the active tab." },
        ]}
      >
        <div style={{ display: "flex", height: "100vh", width: "100%", backgroundColor: "#ffffff", color: "#1f2328" }}>
          {/* Left Sidebar */}
          <FileExplorer
            files={files}
            selectedFileId={selectedFileId}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onCloneRepo={handleCloneRepo}
            onRenameNode={handleRenameNode}
            onCreateNode={handleCreateNode}
            onDeleteNode={handleDeleteNode}
            projects={projects}
            activeProjectId={activeProjectId}
            onSwitchProject={handleSwitchProject}
            onRenameProject={handleRenameProject}
            onCreateProject={() => {
              const newId = Date.now().toString();
              const newProject = { id: newId, name: `Project ${projects.length + 1}` };
              setProjects([...projects, newProject]);
              setProjectFilesMap((prev) => ({ ...prev, [newId]: [] }));
              handleSwitchProject(newId);
            }}
          />

          {/* Right Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", color: "#1f2328" }}>
            {/* Header */}
            <Header />

            {/* Tabs */}
            <Tabs viewMode={viewMode} onViewModeChange={setViewMode} issuesCount={issues.length} />

            {/* File Tabs (only in editor mode) */}
            {viewMode === "editor" && (
              <FileTabs openFiles={openFiles} selectedFileId={selectedFileId} onSelectFile={setSelectedFileId} onCloseTab={handleCloseTab} />
            )}

            {/* Content */}
            <div style={{ flex: 1, position: "relative", backgroundColor: "#ffffff", overflowY: "auto", color: "#1f2328" }}>
              {/* ISSUES VIEW */}
              {viewMode === "issues" && (
                <IssuesView
                  issues={issues}
                  issueViewMode={issueViewMode}
                  selectedIssueId={selectedIssueId}
                  newIssueTitle={newIssueTitle}
                  newIssueBody={newIssueBody}
                  newCommentBody={newCommentBody}
                  editingIssueId={editingIssueId}
                  tempIssueTitle={tempIssueTitle}
                  onCreateIssue={handleCreateIssue}
                  onSelectIssue={setSelectedIssueId}
                  onSetViewMode={setIssueViewMode}
                  onTitleChange={setNewIssueTitle}
                  onBodyChange={setNewIssueBody}
                  onCommentBodyChange={setNewCommentBody}
                  onAddComment={handleAddComment}
                  onStartEditing={startEditingIssueTitle}
                  onSaveTitle={saveIssueTitle}
                  onCancelEditing={cancelEditingIssueTitle}
                  onTempTitleChange={setTempIssueTitle}
                />
              )}

              {/* EDITOR/README VIEW */}
              {(viewMode === "readme" || (viewMode === "editor" && selectedFile)) ? (
                <CodeExplainer
                  key={viewMode === "editor" ? selectedFileId : "readme"}
                  code={activeCode}
                  onCodeChange={handleActiveCodeChange}
                  language={activeLanguage}
                />
              ) : (
                viewMode === "editor" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: "14px" }}>
                    Select a file to edit
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </CopilotSidebar>
    </main>
  );
}
