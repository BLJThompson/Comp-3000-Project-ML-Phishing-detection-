import React, { useState, useEffect } from "react";
import Inbox from "./pages/Inbox";
import Sent from "./pages/Sent";
import Flagged from "./pages/Flagged";
import Dashboard from "./pages/Dashboard";
import Education from "./pages/Education";
import EmailDetail from "./components/EmailDetail";
import { fetchEmails, updateEmail, getEmailCounts } from "./api/mailApi";

const SECTIONS = ["Inbox", "Sent", "Flagged", "Dashboard", "Education"];

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("mail-theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "light";
  });

  const [currentSection, setCurrentSection] = useState("Inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [emails, setEmails] = useState([]);
  const [counts, setCounts] = useState({ Inbox: 0, Sent: 0, Flagged: 0 });
  const [dashboardData, setDashboardData] = useState({
    inboxEmails: [],
    sentEmails: [],
    flaggedEmails: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || null;
  const isMailSection = ["Inbox", "Sent", "Flagged"].includes(currentSection);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("mail-theme", theme);
  }, [theme]);

  async function refreshCounts() {
    try {
      const result = await getEmailCounts();
      setCounts(result);
    } catch (err) {
      console.error("Failed to load counts:", err);
    }
  }

  async function loadDashboardData() {
    try {
      const [inboxEmails, sentEmails, flaggedEmails] = await Promise.all([
        fetchEmails({ folder: "Inbox" }),
        fetchEmails({ folder: "Sent" }),
        fetchEmails({ folder: "Flagged", flaggedOnly: true }),
      ]);

      setDashboardData({
        inboxEmails,
        sentEmails,
        flaggedEmails,
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSectionData() {
      setLoading(true);
      setLoadError("");

      try {
        if (currentSection === "Dashboard") {
          await Promise.all([refreshCounts(), loadDashboardData()]);
          if (!cancelled) {
            setEmails([]);
            setSelectedEmailId(null);
          }
        } else if (currentSection === "Education") {
          if (!cancelled) {
            setEmails([]);
            setSelectedEmailId(null);
          }
        } else {
          const data = await fetchEmails({
            folder: currentSection,
            searchTerm,
            flaggedOnly: currentSection === "Flagged",
          });

          if (!cancelled) {
            setEmails(data);

            if (
              selectedEmailId !== null &&
              !data.some((email) => email.id === selectedEmailId)
            ) {
              setSelectedEmailId(null);
            }
          }

          await refreshCounts();
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setLoadError(err.message || "Failed to load data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSectionData();

    return () => {
      cancelled = true;
    };
  }, [currentSection, searchTerm, selectedEmailId]);

  const handleEmailUpdated = async () => {
    await refreshCounts();
    if (currentSection === "Dashboard") {
      await loadDashboardData();
    }
  };

  const handleSelectEmail = (email) => {
    setSelectedEmailId(email.id);

    if (email.isUnread) {
      handleMarkRead(email);
    }
  };

  async function handleToggleFlag(email) {
    try {
      const updated = await updateEmail(email.id, {
        isFlagged: !email.isFlagged,
      });

      setEmails((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));

      if (currentSection === "Flagged" && !updated.isFlagged) {
        setEmails((prev) => prev.filter((e) => e.id !== updated.id));

        if (selectedEmailId === updated.id) {
          setSelectedEmailId(null);
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

      setEmails((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      handleEmailUpdated();
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  }

  async function handleMarkRead(email) {
    if (!email.isUnread) return;

    try {
      const updated = await updateEmail(email.id, { isUnread: false });
      setEmails((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      handleEmailUpdated();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  let CurrentPage = Inbox;
  if (currentSection === "Sent") CurrentPage = Sent;
  if (currentSection === "Flagged") CurrentPage = Flagged;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-app-name">Mail</span>
        </div>

        <nav className="sidebar-nav">
          {SECTIONS.map((section) => {
            const countValue =
              section === "Inbox" || section === "Sent" || section === "Flagged"
                ? counts[section] ?? 0
                : null;

            return (
              <button
                key={section}
                className={
                  "nav-item" +
                  (currentSection === section ? " nav-item--active" : "")
                }
                onClick={() => {
                  setCurrentSection(section);
                  setSelectedEmailId(null);
                  setSearchTerm("");
                }}
              >
                <span className="nav-item-label">{section}</span>
                {countValue !== null && (
                  <span className="nav-item-count">{countValue}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{currentSection}</h1>
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

        {loading ? (
          <div style={{ padding: "1rem" }}>Loading…</div>
        ) : loadError ? (
          <div style={{ padding: "1rem", color: "red" }}>{loadError}</div>
        ) : currentSection === "Dashboard" ? (
          <Dashboard counts={counts} dashboardData={dashboardData} />
        ) : currentSection === "Education" ? (
          <Education />
        ) : (
          <div className="content">
            <section className="list-pane">
              <CurrentPage
                emails={emails}
                onSelectEmail={handleSelectEmail}
                selectedEmailId={selectedEmailId}
                onToggleFlag={handleToggleFlag}
                onTogglePin={handleTogglePin}
                onMarkRead={handleMarkRead}
              />
            </section>

            <section className="reading-pane">
              <EmailDetail email={selectedEmail} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;