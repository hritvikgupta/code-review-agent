"use client";

import { useState } from "react";
import {
    Folder,
    FileCode,
    ChevronRight,
    ChevronDown,
    Plus,
    FolderPlus,
    FilePlus,
    GitBranch,
    PanelLeftClose,
    PanelLeftOpen,
    Edit2,
    Trash2,
    Check,
    X,
    ChevronDown as ChevronDownIcon
} from "lucide-react";

import { FileNode, Project } from "@/types";

interface FileExplorerProps {
    files: FileNode[];
    selectedFileId: string | null;
    onSelectFile: (file: FileNode, isDoubleClick?: boolean) => void;
    onCreateFile: () => void; // Global create
    onCreateFolder: () => void; // Global create
    onCloneRepo: () => void;
    // Contextual actions
    onRenameNode: (id: string, newName: string) => void;
    onCreateNode: (parentId: string, type: "file" | "folder") => void;
    onDeleteNode: (id: string) => void;

    // Project Props
    projects: Project[];
    activeProjectId: string;
    onSwitchProject: (id: string) => void;
    onCreateProject: () => void;
    onRenameProject: (id: string, newName: string) => void;
}

export default function FileExplorer({
    files,
    selectedFileId,
    onSelectFile,
    onCreateFile,
    onCreateFolder,
    onCloneRepo,
    onRenameNode,
    onCreateNode,
    onDeleteNode,
    projects,
    activeProjectId,
    onSwitchProject,
    onCreateProject,
    onRenameProject
}: FileExplorerProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Renaming State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    // Project Renaming State
    const [isRenamingProject, setIsRenamingProject] = useState(false);
    const [projectRenameName, setProjectRenameName] = useState("");

    // Hover State for Actions
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    const toggleFolder = (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const startEditing = (node: FileNode, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(node.id);
        setEditName(node.name);
    };

    const submitRename = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (editingId && editName.trim()) {
            onRenameNode(editingId, editName.trim());
            setEditingId(null);
        }
    };

    const cancelRename = () => {
        setEditingId(null);
        setEditName("");
    };

    // Project Rename Logic
    const startRenamingProject = () => {
        const currentProject = projects.find(p => p.id === activeProjectId);
        if (currentProject) {
            setProjectRenameName(currentProject.name);
            setIsRenamingProject(true);
        }
    };

    const submitProjectRename = () => {
        if (projectRenameName.trim()) {
            onRenameProject(activeProjectId, projectRenameName.trim());
            setIsRenamingProject(false);
        }
    };

    const renderTree = (nodes: FileNode[], depth = 0) => {
        return nodes.map((node) => {
            const isExpanded = expandedFolders.has(node.id);
            const isSelected = selectedFileId === node.id;
            const isEditing = editingId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const paddingLeft = isCollapsed ? "12px" : `${depth * 12 + 12}px`;

            return (
                <div key={node.id}>
                    <div
                        onClick={(e) => {
                            if (!isEditing) {
                                if (node.type === "folder") {
                                    toggleFolder(node.id, e);
                                } else {
                                    onSelectFile(node);
                                }
                            }
                        }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        style={{
                            paddingLeft,
                            paddingRight: "12px",
                            paddingTop: "6px",
                            paddingBottom: "6px",
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            backgroundColor: isSelected ? "#eff6ff" : (isHovered ? "#f9fafb" : "transparent"),
                            color: isSelected ? "#2563eb" : "#4b5563",
                            fontSize: "13px",
                            justifyContent: isCollapsed ? "center" : "flex-start",
                            transition: "all 0.1s ease",
                            position: "relative",
                            minHeight: "32px",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {isCollapsed ? (
                            node.type === "folder" ? (
                                <Folder size={18} fill={isExpanded ? "#bae6fd" : "none"} color={isExpanded ? "#0ea5e9" : "#6b7280"} />
                            ) : (
                                <FileCode size={18} />
                            )
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", flex: 1, overflow: "hidden" }}>
                                <span style={{ marginRight: "6px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                                    {node.type === "folder" && (
                                        <span
                                            onClick={(e) => toggleFolder(node.id, e)}
                                            style={{ marginRight: "4px", color: "#9ca3af" }}
                                        >
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </span>
                                    )}
                                    {node.type === "folder" ? (
                                        <Folder size={14} fill={isExpanded ? "#bae6fd" : "none"} color={isExpanded ? "#0ea5e9" : "#6b7280"} />
                                    ) : (
                                        <FileCode size={14} />
                                    )}
                                </span>

                                {isEditing ? (
                                    <form onSubmit={submitRename} onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                                        <input
                                            autoFocus
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Escape") cancelRename();
                                            }}
                                            onBlur={submitRename}
                                            style={{
                                                fontSize: "13px",
                                                padding: "2px 4px",
                                                borderRadius: "4px",
                                                border: "1px solid #2563eb",
                                                outline: "none",
                                                width: "100%",
                                                color: "#1f2328",
                                                backgroundColor: "#ffffff"
                                            }}
                                        />
                                    </form>
                                ) : (
                                    <span style={{ fontWeight: isSelected ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {node.name}
                                    </span>
                                )}

                                {/* Hover Actions - Using State Logic */}
                                {isHovered && !isEditing && !isCollapsed && (
                                    <div
                                        style={{
                                            marginLeft: "auto",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            paddingLeft: "8px",
                                            backgroundColor: isSelected ? "#eff6ff" : (isHovered ? "#f9fafb" : "transparent")
                                        }}
                                    >
                                        {node.type === "folder" && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onCreateNode(node.id, "file"); }}
                                                    title="New File inside"
                                                    style={{ border: "none", background: "none", cursor: "pointer", padding: "2px", color: "#6b7280" }}
                                                >
                                                    <FilePlus size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onCreateNode(node.id, "folder"); }}
                                                    title="New Folder inside"
                                                    style={{ border: "none", background: "none", cursor: "pointer", padding: "2px", color: "#6b7280" }}
                                                >
                                                    <FolderPlus size={14} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={(e) => startEditing(node, e)}
                                            title="Rename"
                                            style={{ border: "none", background: "none", cursor: "pointer", padding: "2px", color: "#6b7280" }}
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                                            title="Delete"
                                            style={{ border: "none", background: "none", cursor: "pointer", padding: "2px", color: "#ef4444" }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {node.type === "folder" && isExpanded && !isCollapsed && node.children && (
                        <div>{renderTree(node.children, depth + 1)}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div
            style={{
                width: isCollapsed ? "60px" : "260px",
                height: "100%",
                backgroundColor: "#ffffff",
                borderRight: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
                transition: "width 0.3s ease",
            }}
        >

            {/* Header / Toolbar */}
            <div style={{ padding: isCollapsed ? "16px 8px" : "16px", borderBottom: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: isCollapsed ? "center" : "space-between", alignItems: "center" }}>
                    {!isCollapsed && (
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Explorer
                        </span>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex" }}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                {!isCollapsed && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* Clone Button (Full Width) */}
                        <button
                            onClick={onCloneRepo}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                backgroundColor: "#111827",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                                width: "100%"
                            }}
                        >
                            <GitBranch size={14} />
                            <span>Clone Repository</span>
                        </button>

                        {/* Row 2: Project Dropdown/Rename Input and Actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                            {/* Project Selector or Rename Input */}
                            <div style={{ flex: 1, position: "relative" }}>
                                {isRenamingProject ? (
                                    <input
                                        autoFocus
                                        value={projectRenameName}
                                        onChange={(e) => setProjectRenameName(e.target.value)}
                                        onBlur={submitProjectRename}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") submitProjectRename();
                                            if (e.key === "Escape") setIsRenamingProject(false);
                                        }}
                                        style={{
                                            width: "100%",
                                            backgroundColor: "#ffffff",
                                            border: "1px solid #2563eb",
                                            borderRadius: "6px",
                                            padding: "5px 8px",
                                            fontSize: "12px",
                                            color: "#1f2328",
                                            outline: "none"
                                        }}
                                    />
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <div style={{ position: "relative", flex: 1 }}>
                                            <select
                                                value={activeProjectId}
                                                onChange={(e) => {
                                                    if (e.target.value === "NEW_PROJECT") {
                                                        onCreateProject();
                                                    } else {
                                                        onSwitchProject(e.target.value);
                                                    }
                                                }}
                                                style={{
                                                    width: "100%",
                                                    appearance: "none",
                                                    backgroundColor: "#f9fafb",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "6px",
                                                    padding: "6px 24px 6px 8px",
                                                    fontSize: "12px",
                                                    color: "#374151",
                                                    cursor: "pointer",
                                                    outline: "none",
                                                    fontWeight: 500,
                                                    height: "29px" // Fixed height for alignment
                                                }}
                                            >
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                                <option disabled>──────────</option>
                                                <option value="NEW_PROJECT">+ New Project</option>
                                            </select>
                                            <ChevronDownIcon
                                                size={12}
                                                style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}
                                            />
                                        </div>
                                        <button
                                            onClick={startRenamingProject}
                                            title="Rename Project"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280', display: "flex", alignItems: "center" }}
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* File/Folder Actions */}
                            <div style={{ display: "flex", gap: "2px" }}>
                                <button
                                    onClick={onCreateFile}
                                    title="New File (Root)"
                                    style={{ background: 'none', border: '1px solid transparent', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    <FilePlus size={16} />
                                </button>
                                <button
                                    onClick={onCreateFolder}
                                    title="New Folder (Root)"
                                    style={{ background: 'none', border: '1px solid transparent', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    <FolderPlus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* File Tree */}
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: "16px", overflowX: "hidden" }}>
                {renderTree(files)}
            </div>
        </div>
    );
}
