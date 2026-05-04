// frontend/src/App.jsx

import React, { useEffect, useMemo, useState } from "react";
import Inbox     from "./pages/Inbox";
import Drafts    from "./pages/Drafts";
import Sent      from "./pages/Sent";
import Deleted   from "./pages/Deleted";
import Flagged   from "./pages/Flagged";
import Junk      from "./pages/Junk";
import Dashboard from "./pages/Dashboard";
import Education from "./pages/Education";
import EmailDetail   from "./components/EmailDetail";
import TopToolbar    from "./components/TopToolbar";
import ComposeModal  from "./components/ComposeModal";
import HelpModal     from "./components/HelpModal";
import Toast         from "./components/Toast";
import {
  fetchEmails,
  fetchFolderCounts,
  updateEmail,
  moveEmail,
  deleteEmail    as deleteEmailApi,
  restoreEmail   as restoreEmailApi,
  createDraft,
  updateDraft,
  sendGmailEmail,
  importUnreadGmailEmails,
  getEmailThread,
} from "./api/mailApi";
import "./App.css";

const GMAIL_SENDER    = "comp3000.phishing.detector@gmail.com";
const MAIL_FOLDERS    = ["Inbox", "Drafts", "Sent", "Deleted", "Flagged", "Junk"];
const EXTRA_SECTIONS  = ["Dashboard", "Education"];
const SECTIONS        = [...MAIL_FOLDERS, ...EXTRA_SECTIONS];

// Deduplicates a thread array by subject + sender + body + date.
function dedupeThread(thread) {
  return thread.filter((item, index, arr) =>
    index === arr.findIndex(
      (other) =>
        other.subject === item.subject &&
        other.sender  === item.sender  &&
        other.body    === item.body    &&
        other.date    === item.date
    )
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = window.localStorage.getItem("mail-theme");
    return saved === "light" || saved === "dark" ? saved : "light";
  });

  const [currentSection,   setCurrentSection]   = useState("Inbox");
  const [searchTerm,       setSearchTerm]        = useState("");
  const [selectedEmailId,  setSelectedEmailId]   = useState(null);
  const [selectedEmailIds, setSelectedEmailIds]  = useState([]);
  const [selectedThread,   setSelectedThread]    = useState([]);
  const [emails,           setEmails]            = useState([]);
  const [counts,           setCounts]            = useState({});
  const [dashboardData,    setDashboardData]     = useState({ flaggedEmails: [] });
  const [loading,          setLoading]           = useState(false);
  const [loadError,        setLoadError]         = useState("");
  const [composeOpen,      setComposeOpen]       = useState(false);
  const [composeMode,      setComposeMode]       = useState("new");
  const [composeInitialData, setComposeInitialData] = useState(null);
  const [toastMessage,     setToastMessage]      = useState("");
  const [helpOpen,         setHelpOpen]          = useState(false);
  const [gmailImporting,   setGmailImporting]    = useState(false);
  const [lastGmailImport,  setLastGmailImport]   = useState(null);

  const isMailSection = MAIL_FOLDERS.includes(currentSection);

  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedEmailId) || null,
    [emails, selectedEmailId]
  );

  const selectedEmails = useMemo(
    () => emails.filter((e) => selectedEmailIds.includes(e.id)),
    [emails, selectedEmailIds]
  );

  // The emails that toolbar actions (delete, move, etc.) apply to.
  const actionEmails = selectedEmails.length > 0
    ? selectedEmails
    : selectedEmail ? [selectedEmail] : [];

  const toolbarSelectedEmail = actionEmails[0] || null;

  // ─── Side effects ─────────────────────────────────────────────────────────

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("mail-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 2200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Delete" && actionEmails.length > 0 && currentSection !== "Deleted") {
        handleDelete();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionEmails, currentSection]);

  // Clear selections for emails that are no longer visible.
  useEffect(() => {
    const visibleIds = new Set(emails.map((e) => e.id));
    setSelectedEmailIds((prev) => prev.filter((id) => visibleIds.has(id)));
    if (selectedEmailId !== null && !visibleIds.has(selectedEmailId)) {
      setSelectedEmailId(null);
      setSelectedThread([]);
    }
  }, [emails, selectedEmailId]);

  // Load emails and counts when the section or search term changes.
  useEffect(() => {
    let cancelled = false;

    async function loadSectionData() {
      setLoading(true);
      setLoadError("");

      try {
        if (currentSection === "Dashboard") {
          await Promise.all([refreshCounts(), loadDashboardData()]);
          if (!cancelled) { clearSelection(); setEmails([]); }
          return;
        }

        if (currentSection === "Education") {
          if (!cancelled) { clearSelection(); setEmails([]); }
          return;
        }

        const data = await fetchEmails({ folder: currentSection, searchTerm });
        if (!cancelled) setEmails(data);
        await refreshCounts();
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setLoadError(err.message || "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSectionData();
    return () => { cancelled = true; };
  }, [currentSection, searchTerm]);

  // Auto-refresh emails every 5 seconds while a mail folder is open.
  useEffect(() => {
    if (!MAIL_FOLDERS.includes(currentSection) || composeOpen) return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchEmails({ folder: currentSection, searchTerm });
        setEmails(data);
        await refreshCounts();
      } catch (err) {
        console.error("Auto-refresh failed:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSection, searchTerm, composeOpen]);

  // Auto-import Gmail emails every 60 seconds.
  useEffect(() => {
    if (composeOpen) return;

    const interval = setInterval(async () => {
      try {
        await handleImportUnreadGmail({ silent: true });
      } catch (err) {
        console.error("Automatic Gmail import failed:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentSection, searchTerm, composeOpen, gmailImporting]);

  // Load the conversation thread when an email is selected.
  useEffect(() => {
    let cancelled = false;

    async function loadThread() {
      if (!selectedEmailId) { setSelectedThread([]); return; }

      try {
        const thread = await getEmailThread(selectedEmailId);
        if (!cancelled) setSelectedThread(dedupeThread(thread));
      } catch (err) {
        console.error("Failed to load thread:", err);
        if (!cancelled) setSelectedThread([]);
      }
    }

    loadThread();
    return () => { cancelled = true; };
  }, [selectedEmailId]);

  // ─── Selection ────────────────────────────────────────────────────────────

  function clearSelection() {
    setSelectedEmailId(null);
    setSelectedEmailIds([]);
    setSelectedThread([]);
  }

  function handleToggleSelectedEmail(email) {
    setSelectedEmailIds((prev) =>
      prev.includes(email.id)
        ? prev.filter((id) => id !== email.id)
        : [...prev, email.id]
    );
  }

  function handleToggleSelectAll() {
    const visibleIds = emails.map((e) => e.id);
    if (visibleIds.length === 0) return;

    const allSelected = visibleIds.every((id) => selectedEmailIds.includes(id));

    setSelectedEmailIds((prev) =>
      allSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]))
    );
  }

  // ─── Data fetching ────────────────────────────────────────────────────────

  async function refreshCounts() {
    try {
      const result = await fetchFolderCounts();
      setCounts(result);
      return result;
    } catch (err) {
      console.error("Failed to load counts:", err);
      return {};
    }
  }

  async function loadDashboardData() {
    try {
      const [flaggedEmails, junkEmails] = await Promise.all([
        fetchEmails({ folder: "Flagged" }),
        fetchEmails({ folder: "Junk" }),
      ]);
      setDashboardData({ flaggedEmails, junkEmails, suspiciousEmails: [...flaggedEmails, ...junkEmails] });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  }

  async function refreshCurrentFolder() {
    if (!MAIL_FOLDERS.includes(currentSection)) return;
    const [emailData] = await Promise.all([
      fetchEmails({ folder: currentSection, searchTerm }),
      refreshCounts(),
    ]);
    setEmails(emailData);
  }

  // ─── Email state updates ──────────────────────────────────────────────────

  // Shared pattern for updateEmail + optimistic local state replacement.
  async function updateEmailField(email, patch) {
    try {
      const updated = await updateEmail(email.id, patch);
      setEmails((prev) => prev.map((e) => e.id === updated.id ? updated : e));
    } catch (err) {
      console.error("Failed to update email:", err);
    }
  }

  const handleToggleFlag = (email) => updateEmailField(email, { isFlagged: !email.isFlagged });
  const handleTogglePin  = (email) => updateEmailField(email, { isPinned:  !email.isPinned  });

  async function handleMarkRead(email) {
    if (!email.isUnread) return;
    await updateEmailField(email, { isUnread: false });
  }

  // ─── Compose ──────────────────────────────────────────────────────────────

  function openNewEmail() {
    setComposeMode("new");
    setComposeInitialData(null);
    setComposeOpen(true);
  }

  function openDraftEditor(email) {
    setComposeMode("draft");
    setComposeInitialData(email);
    setComposeOpen(true);
  }

  function openReply() {
    if (!toolbarSelectedEmail) return;
    setComposeMode("reply");
    setComposeInitialData({
      sender:       GMAIL_SENDER,
      toRecipients: toolbarSelectedEmail.sender || "",
      subject:      toolbarSelectedEmail.subject?.startsWith("Re:")
        ? toolbarSelectedEmail.subject
        : `Re: ${toolbarSelectedEmail.subject || ""}`,
      body:         `\n\n--- Original Message ---\n${toolbarSelectedEmail.body || ""}`,
      replyToId:    toolbarSelectedEmail.id,
      threadId:     toolbarSelectedEmail.threadId || `thread-${toolbarSelectedEmail.id}`,
    });
    setComposeOpen(true);
  }

  function openForward() {
    if (!toolbarSelectedEmail) return;
    setComposeMode("forward");
    setComposeInitialData({
      sender:       GMAIL_SENDER,
      toRecipients: "",
      subject:      toolbarSelectedEmail.subject?.startsWith("Fw:")
        ? toolbarSelectedEmail.subject
        : `Fw: ${toolbarSelectedEmail.subject || ""}`,
      body:         `\n\n--- Forwarded Message ---\nFrom: ${toolbarSelectedEmail.sender || ""}\nSubject: ${toolbarSelectedEmail.subject || ""}\n\n${toolbarSelectedEmail.body || ""}`,
      threadId:     toolbarSelectedEmail.threadId || `thread-${toolbarSelectedEmail.id}`,
    });
    setComposeOpen(true);
  }

  async function handleSaveDraft(form) {
    try {
      if (composeMode === "draft" && composeInitialData?.id) {
        await updateDraft(composeInitialData.id, form);
        setToastMessage("Draft updated");
      } else {
        await createDraft(form);
        setToastMessage("Draft saved");
      }
      setCurrentSection("Drafts");
      clearSelection();
      return true;
    } catch (err) {
      console.error("Failed to save draft:", err);
      setToastMessage("Failed to save draft");
      throw err;
    }
  }

  async function handleSend(form) {
    try {
      await sendGmailEmail({ ...form, sender: GMAIL_SENDER, bccRecipients: "" });
      setCurrentSection("Sent");
      clearSelection();
      await refreshCurrentFolder();
      await refreshCounts();
      setTimeout(() => setToastMessage("Message sent through Gmail"), 250);
      return true;
    } catch (err) {
      console.error("Failed to send Gmail email:", err);
      setToastMessage("Failed to send email through Gmail");
      throw err;
    }
  }

  // ─── Gmail import ─────────────────────────────────────────────────────────

  async function handleImportUnreadGmail({ silent = false } = {}) {
    if (gmailImporting) return;

    try {
      setGmailImporting(true);
      const result = await importUnreadGmailEmails(10);

      setLastGmailImport(new Date());
      await refreshCurrentFolder();
      await refreshCounts();

      const imported = result?.importedCount || 0;
      const skipped  = result?.skippedCount  || 0;

      if (!silent) {
        if (imported === 0 && skipped === 0) {
          setToastMessage("No unread Gmail emails to import");
        } else if (skipped > 0) {
          setToastMessage(`Imported ${imported} Gmail email(s), skipped ${skipped}`);
        } else {
          setToastMessage(`Imported ${imported} Gmail email(s)`);
        }
      } else if (imported > 0) {
        setToastMessage(`Imported ${imported} new Gmail email(s)`);
      }
    } catch (err) {
      console.error("Failed to import Gmail emails:", err);
      if (!silent) setToastMessage("Failed to import Gmail emails");
    } finally {
      setGmailImporting(false);
    }
  }

  // ─── Delete / restore / move ──────────────────────────────────────────────

  async function handleDelete() {
    if (actionEmails.length === 0) return;

    if (currentSection === "Deleted") {
      const msg = actionEmails.length === 1
        ? "Permanently delete this email?"
        : `Permanently delete ${actionEmails.length} emails?`;
      if (!window.confirm(msg)) return;
    }

    try {
      await Promise.all(actionEmails.map((e) => deleteEmailApi(e.id)));

      const isPermanent = currentSection === "Deleted";
      const count = actionEmails.length;
      setToastMessage(
        isPermanent
          ? count === 1 ? "Email permanently deleted" : `${count} emails permanently deleted`
          : count === 1 ? "Email deleted"             : `${count} emails deleted`
      );

      clearSelection();
      await refreshCurrentFolder();
    } catch (err) {
      console.error("Failed to delete email:", err);
      setToastMessage("Failed to delete email");
    }
  }

  async function handleRestore() {
    if (actionEmails.length === 0) return;

    try {
      await Promise.all(actionEmails.map((e) => restoreEmailApi(e.id)));
      setToastMessage(
        actionEmails.length === 1 ? "Email restored" : `${actionEmails.length} emails restored`
      );
      clearSelection();
      await refreshCurrentFolder();
    } catch (err) {
      console.error("Failed to restore email:", err);
      setToastMessage("Failed to restore email");
    }
  }

  async function handleDeleteFromList(email) {
    try {
      await deleteEmailApi(email.id);
      setToastMessage(currentSection === "Deleted" ? "Email permanently deleted" : "Email deleted");

      if (selectedEmailId === email.id) {
        clearSelection();
      } else {
        setSelectedEmailIds((prev) => prev.filter((id) => id !== email.id));
      }

      await refreshCurrentFolder();
    } catch (err) {
      console.error("Failed to delete email:", err);
      setToastMessage("Failed to delete email");
    }
  }

  async function handleMove(folder) {
    if (!["Inbox", "Flagged", "Junk"].includes(folder)) {
      setToastMessage("Emails can only be moved to Inbox, Flagged, or Junk");
      return;
    }

    if (actionEmails.length === 0) return;

    try {
      await Promise.all(actionEmails.map((e) => moveEmail(e.id, folder)));
      setToastMessage(
        actionEmails.length === 1
          ? `Moved to ${folder}`
          : `${actionEmails.length} emails moved to ${folder}`
      );
      clearSelection();
      await refreshCurrentFolder();
    } catch (err) {
      console.error("Failed to move email:", err);
      setToastMessage("Failed to move email");
    }
  }

  // ─── Print ────────────────────────────────────────────────────────────────

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&",  "&amp;")
      .replaceAll("<",  "&lt;")
      .replaceAll(">",  "&gt;")
      .replaceAll('"',  "&quot;")
      .replaceAll("'",  "&#039;");
  }

  function handlePrint() {
    if (!toolbarSelectedEmail) {
      setToastMessage("Select an email before printing");
      return;
    }

    const verdict =
      toolbarSelectedEmail.aiLabel && toolbarSelectedEmail.aiLabel !== "unknown"
        ? `${toolbarSelectedEmail.aiLabel} ${typeof toolbarSelectedEmail.aiScore === "number" ? `(${Math.round(toolbarSelectedEmail.aiScore * 100)}%)` : ""}`
        : "Not analysed";

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) { window.print(); return; }

    printWindow.document.write(`<!doctype html>
<html>
<head>
  <title>${escapeHtml(toolbarSelectedEmail.subject || "Email")}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 40px auto; max-width: 760px; line-height: 1.5; }
    h1 { font-size: 24px; margin: 0 0 14px; border-bottom: 1px solid #d1d5db; padding-bottom: 12px; }
    .meta { margin-bottom: 18px; font-size: 14px; }
    .meta div { margin: 4px 0; }
    .label { display: inline-block; border: 1px solid #d1d5db; border-radius: 999px; padding: 4px 9px; font-size: 13px; margin: 8px 0 18px; }
    h2 { font-size: 16px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 18px; }
    pre { white-space: pre-wrap; word-break: break-word; font-family: Arial, sans-serif; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(toolbarSelectedEmail.subject || "(No subject)")}</h1>
  <div class="meta">
    <div><strong>From:</strong> ${escapeHtml(toolbarSelectedEmail.sender || "")}</div>
    <div><strong>To:</strong> ${escapeHtml(toolbarSelectedEmail.toRecipients || "")}</div>
    <div><strong>Date:</strong> ${escapeHtml(toolbarSelectedEmail.date || "")}</div>
  </div>
  <div class="label"><strong>AI result:</strong> ${escapeHtml(verdict)}</div>
  <h2>Email body</h2>
  <pre>${escapeHtml(toolbarSelectedEmail.body || "")}</pre>
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const commonProps = {
    emails,
    selectedEmailId,
    selectedEmailIds,
    onToggleSelectedEmail: handleToggleSelectedEmail,
    onToggleSelectAll:     handleToggleSelectAll,
    onSelectEmail: (email) => {
      if (currentSection === "Drafts") { openDraftEditor(email); return; }
      setSelectedEmailId(email.id);
      handleMarkRead(email);
    },
    onToggleFlag:  handleToggleFlag,
    onTogglePin:   handleTogglePin,
    onMarkRead:    handleMarkRead,
    onDeleteEmail: handleDeleteFromList,
    onOpenDraft:   openDraftEditor,
  };

  function renderPage() {
    switch (currentSection) {
      case "Dashboard":  return <Dashboard counts={counts} dashboardData={dashboardData} />;
      case "Education":  return <Education />;
      case "Drafts":     return <Drafts   {...commonProps} />;
      case "Sent":       return <Sent     {...commonProps} />;
      case "Deleted":    return <Deleted  {...commonProps} />;
      case "Flagged":    return <Flagged  {...commonProps} />;
      case "Junk":       return <Junk     {...commonProps} />;
      default:           return <Inbox    {...commonProps} />;
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-app-name">Mail</span>
        </div>

        <nav className="sidebar-nav">
          {SECTIONS.map((section) => (
            <button
              key={section}
              className={"nav-item" + (currentSection === section ? " nav-item--active" : "")}
              onClick={() => { setCurrentSection(section); setSearchTerm(""); clearSelection(); }}
            >
              <span className="nav-item-label">{section}</span>
              {MAIL_FOLDERS.includes(section) && (
                <span className="nav-item-count">{counts[section] || 0}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{currentSection}</h1>
          </div>

          <div className="topbar-right">
            <div className="topbar-controls">
              <button type="button" className="help-btn" onClick={() => setHelpOpen(true)}>
                Help
              </button>

              <div className="theme-toggle-group" aria-label="Theme selection">
                <button
                  type="button"
                  className={"theme-toggle-btn" + (theme === "light" ? " theme-toggle-btn--active" : "")}
                  onClick={() => setTheme("light")}
                >Light</button>
                <button
                  type="button"
                  className={"theme-toggle-btn" + (theme === "dark" ? " theme-toggle-btn--active" : "")}
                  onClick={() => setTheme("dark")}
                >Dark</button>
              </div>
            </div>

            {isMailSection && (
              <input
                type="text"
                className="search-input"
                placeholder="Search mail"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            )}
          </div>
        </header>

        {isMailSection && (
          <TopToolbar
            selectedEmail={toolbarSelectedEmail}
            selectedCount={actionEmails.length}
            currentSection={currentSection}
            onNewEmail={openNewEmail}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onMove={handleMove}
            onReply={openReply}
            onForward={openForward}
            onPrint={handlePrint}
            onRefresh={refreshCurrentFolder}
            onImportGmail={() => handleImportUnreadGmail()}
            gmailImporting={gmailImporting}
          />
        )}

        {isMailSection && (
          <div className="gmail-status-strip">
            <span>Gmail connected: {GMAIL_SENDER}</span>
            <span>Auto-import: every 60 seconds</span>
            <span>
              Last import:{" "}
              {lastGmailImport
                ? lastGmailImport.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "not yet"}
            </span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: "1rem" }}>Loading…</div>
        ) : loadError ? (
          <div style={{ padding: "1rem", color: "red" }}>{loadError}</div>
        ) : currentSection === "Dashboard" || currentSection === "Education" ? (
          renderPage()
        ) : (
          <div className="content">
            <section className="list-pane">{renderPage()}</section>
            <section className="reading-pane">
              <EmailDetail email={selectedEmail} threadEmails={selectedThread} />
            </section>
          </div>
        )}

        <ComposeModal
          isOpen={composeOpen}
          mode={composeMode}
          initialData={composeInitialData}
          onClose={() => setComposeOpen(false)}
          onSaveDraft={handleSaveDraft}
          onSend={handleSend}
        />

        <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
        <Toast message={toastMessage} />
      </main>
    </div>
  );
}

export default App;
