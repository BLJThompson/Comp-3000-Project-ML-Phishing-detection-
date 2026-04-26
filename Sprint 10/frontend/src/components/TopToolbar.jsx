import React from "react";
import "./TopToolbar.css";

const MOVE_FOLDERS = ["Inbox", "Flagged", "Junk"];

function TopToolbar({
  selectedEmail,
  currentSection,
  onNewEmail,
  onDelete,
  onRestore,
  onMove,
  onReply,
  onForward,
  onPrint,
  onRefresh,
  onImportGmail,
  gmailImporting = false,
}) {
  const hasSelection = !!selectedEmail;
  const inDeleted = currentSection === "Deleted";
  const inDrafts = currentSection === "Drafts";
  const canReplyOrForward = hasSelection && !inDrafts && !inDeleted;
  const canMove = hasSelection && !inDeleted;
  const deleteLabel = inDeleted ? "Delete Permanently" : "Delete";

  function handleMoveChange(e) {
    const value = e.target.value;
    if (!value) return;

    if (typeof onMove === "function") {
      onMove(value);
    }

    e.target.value = "";
  }

  return (
    <div className="top-toolbar" role="toolbar" aria-label="Email actions">
      <div className="top-toolbar-group">
        <button
          type="button"
          className="top-toolbar-btn top-toolbar-btn--primary"
          onClick={onNewEmail}
          title="Compose a new email"
        >
          New Email
        </button>

        <button
          type="button"
          className="top-toolbar-btn"
          onClick={onImportGmail}
          disabled={typeof onImportGmail !== "function" || gmailImporting}
          title="Import unread emails from Gmail"
        >
          {gmailImporting ? "Importing…" : "Import Gmail"}
        </button>

        <button
          type="button"
          className="top-toolbar-btn"
          onClick={onReply}
          disabled={!canReplyOrForward}
          title="Reply to selected email"
        >
          Reply
        </button>

        <button
          type="button"
          className="top-toolbar-btn"
          onClick={onForward}
          disabled={!canReplyOrForward}
          title="Forward selected email"
        >
          Forward
        </button>
      </div>

      <div className="top-toolbar-group">
        <button
          type="button"
          className="top-toolbar-btn top-toolbar-btn--danger"
          onClick={onDelete}
          disabled={!hasSelection}
          title={deleteLabel}
        >
          {deleteLabel}
        </button>

        <button
          type="button"
          className="top-toolbar-btn"
          onClick={onRestore}
          disabled={!hasSelection || !inDeleted}
          title="Restore selected email"
        >
          Restore
        </button>

        <select
          className="top-toolbar-select"
          disabled={!canMove}
          defaultValue=""
          onChange={handleMoveChange}
          title="Move selected email"
          aria-label="Move selected email"
        >
          <option value="">Move To</option>
          {MOVE_FOLDERS.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
      </div>

      <div className="top-toolbar-group top-toolbar-group--right">
        {onRefresh && (
          <button
            type="button"
            className="top-toolbar-btn"
            onClick={onRefresh}
            title="Refresh current folder"
          >
            Refresh
          </button>
        )}

        <button
          type="button"
          className="top-toolbar-btn"
          onClick={onPrint}
          disabled={!hasSelection}
          title="Print selected email only"
        >
          Print
        </button>
      </div>
    </div>
  );
}

export default TopToolbar;
