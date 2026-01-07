"use client";

import { Issue, IssueViewMode } from "@/types";
import IssuesList from "./IssuesList";
import CreateIssue from "./CreateIssue";
import IssueDetail from "./IssueDetail";

interface IssuesViewProps {
  issues: Issue[];
  issueViewMode: IssueViewMode;
  selectedIssueId: number | null;
  newIssueTitle: string;
  newIssueBody: string;
  newCommentBody: string;
  editingIssueId: number | null;
  tempIssueTitle: string;
  onCreateIssue: () => void;
  onSelectIssue: (issueId: number) => void;
  onSetViewMode: (mode: IssueViewMode) => void;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onCommentBodyChange: (body: string) => void;
  onAddComment: () => void;
  onStartEditing: (issue: Issue) => void;
  onSaveTitle: () => void;
  onCancelEditing: () => void;
  onTempTitleChange: (title: string) => void;
}

export default function IssuesView({
  issues,
  issueViewMode,
  selectedIssueId,
  newIssueTitle,
  newIssueBody,
  newCommentBody,
  editingIssueId,
  tempIssueTitle,
  onCreateIssue,
  onSelectIssue,
  onSetViewMode,
  onTitleChange,
  onBodyChange,
  onCommentBodyChange,
  onAddComment,
  onStartEditing,
  onSaveTitle,
  onCancelEditing,
  onTempTitleChange,
}: IssuesViewProps) {
  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  return (
    <div style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>
      {issueViewMode === "list" && (
        <IssuesList
          issues={issues}
          onCreateIssue={() => onSetViewMode("create")}
          onSelectIssue={(id) => {
            onSelectIssue(id);
            onSetViewMode("detail");
          }}
        />
      )}

      {issueViewMode === "create" && (
        <CreateIssue
          title={newIssueTitle}
          body={newIssueBody}
          onTitleChange={onTitleChange}
          onBodyChange={onBodyChange}
          onSubmit={onCreateIssue}
          onCancel={() => onSetViewMode("list")}
        />
      )}

      {issueViewMode === "detail" && selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          newCommentBody={newCommentBody}
          onCommentBodyChange={onCommentBodyChange}
          onAddComment={onAddComment}
          onBack={() => onSetViewMode("list")}
          editingIssueId={editingIssueId}
          tempTitle={tempIssueTitle}
          onTempTitleChange={onTempTitleChange}
          onStartEditing={onStartEditing}
          onSaveTitle={onSaveTitle}
          onCancelEditing={onCancelEditing}
        />
      )}
    </div>
  );
}

