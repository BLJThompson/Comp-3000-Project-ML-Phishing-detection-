import React, { useMemo, useState, useEffect } from "react";
import Inbox from "./pages/Inbox";
import Sent from "./pages/Sent";
import Flagged from "./pages/Flagged";
import EmailDetail from "./components/EmailDetail";
import { fetchEmails, updateEmail, getEmailCounts } from "./api/mailApi";

const FOLDERS = ["Inbox", "Sent", "Flagged"];

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("mail-theme");
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    }
    return "light";
  });

  const [currentFolder, setCurrentFolder] = useState("Inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);

  const [emails, setEmails] = useState([]);
  const [counts, setCounts] = useState({ Inbox: 0, Sent: 0, Flagged: 0 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("mail-theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmails() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await fetchEmails({
          folder: currentFolder,
          searchTerm,
          flaggedOnly: currentFolder === "Flagged",
        });

        if (!cancelled) {
          setEmails(data);

          if (
            selectedEmail &&
            !data.some((email) => email.id === selectedEmail.id)
          ) {
            setSelectedEmail(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setLoadError(err.message || "Failed to load emails");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEmails();

    return () => {
      cancelled = true;
    };
  }, [currentFolder, searchTerm, selectedEmail]);

  async function refreshCounts() {
    try {
      const result = await getEmailCounts();
      setCounts(result);
    } catch (err) {
      console.error("Failed to load counts:", err);
    }
  }

  useEffect(() => {
    refreshCounts();
  }, []);

  const handleEmailUpdated = () => {
    refreshCounts();
  };

  async function handleToggleFlag(email) {
    try {
      const updated = await updateEmail(email.id, {
        isFlagged: !email.isFlagged,
      });

      setEmails((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );

      if (currentFolder === "Flagged" && !updated.isFlagged) {
        setEmails((prev) => prev.filter((e) => e.id !== updated.id));
        if (selectedEmail && selectedEmail.id === updated.id) {
          setSelectedEmail(null);
        }
      }

      handleEmailUpdated();
    } catch (err) {
      console.error("Failed to toggle flag:", err);
    }
  }

  async function handleTogglePin(email) {
    try {
      const updated = await updateEmail(email.id, {
        isPinned: !email.isPinned,
      });

      setEmails((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );

      handleEmailUpdated();
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  }

  async function handleMarkRead(email) {
    if (!email.isUnread) return;

    try {
      const updated = await updateEmail(email.id, { isUnread: false });
      setEmails((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
      handleEmailUpdated();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  };

  let CurrentPage = Inbox;
  if (currentFolder === "Sent") CurrentPage = Sent;
  if (currentFolder === "Flagged") CurrentPage = Flagged;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-app-name">Mail</span>
        </div>

        <nav className="sidebar-nav">
          {FOLDERS.map((folder) => (
            <button
              key={folder}
              className={
                "nav-item" +
                (currentFolder === folder ? " nav-item--active" : "")
              }
              onClick={() => setCurrentFolder(folder)}
            >
              <span className="nav-item-label">{folder}</span>
              <span className="nav-item-count">
                {counts[folder] ?? 0}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{currentFolder}</h1>
          </div>
          <div className="topbar-right">
            <div className="theme-toggle-group" aria-label="Theme selection">
              <button
                type="button"
                className={
                  "theme-toggle-btn" +
                  (theme === "light" ? " theme-toggle-btn--active" : "")
                }
                onClick={() => setTheme("light")}
              >
                Light
              </button>
              <button
                type="button"
                className={
                  "theme-toggle-btn" +
                  (theme === "dark" ? " theme-toggle-btn--active" : "")
                }
                onClick={() => setTheme("dark")}
              >
                Dark
              </button>
            </div>

            <input
              type="text"
              className="search-input"
              placeholder="Search mail"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* Content: list on left, reading pane on right */}
        <div className="content">
          <section className="list-pane">
            {loading ? (
              <div style={{ padding: "0.75rem" }}>Loading…</div>
            ) : loadError ? (
              <div style={{ padding: "0.75rem", color: "red" }}>
                {loadError}
              </div>
            ) : (
              <CurrentPage
                emails={emails}
                onSelectEmail={handleSelectEmail}
                selectedEmailId={selectedEmail ? selectedEmail.id : null}
                onToggleFlag={handleToggleFlag}
                onTogglePin={handleTogglePin}
                onMarkRead={handleMarkRead}
              />
            )}
          </section>

          <section className="reading-pane">
            <EmailDetail email={selectedEmail} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
