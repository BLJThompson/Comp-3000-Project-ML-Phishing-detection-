import React, { useMemo, useState, useEffect } from "react";
import { emails } from "./data/emails";
import Inbox from "./pages/Inbox";
import Sent from "./pages/Sent";
import Flagged from "./pages/Flagged";
import EmailDetail from "./components/EmailDetail";

const FOLDERS = ["Inbox", "Sent", "Flagged"];

function App() {
  // Load the saved theme once. If none saved, default to "light".
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("mail-theme");
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    }
    return "light"; // or "dark" if you prefer
  });

  const [currentFolder, setCurrentFolder] = useState("Inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);

  // When theme changes, update <html data-theme="..."> and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("mail-theme", theme);
  }, [theme]);

  const totalCounts = useMemo(() => {
    const result = { Inbox: 0, Sent: 0, Flagged: 0 };

    emails.forEach((email) => {
      if (email.folder === "Inbox") result.Inbox += 1;
      if (email.folder === "Sent") result.Sent += 1;
      if (email.isFlagged) result.Flagged += 1;
    });

    return result;
  }, []);

  // Clear selection when you change folder or search
  useEffect(() => {
    setSelectedEmail(null);
  }, [currentFolder, searchTerm]);

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
                {totalCounts[folder] ?? 0}
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
            <CurrentPage
              emails={emails}
              searchTerm={searchTerm}
              onSelectEmail={setSelectedEmail}
              selectedEmailId={selectedEmail ? selectedEmail.id : null}
            />
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
