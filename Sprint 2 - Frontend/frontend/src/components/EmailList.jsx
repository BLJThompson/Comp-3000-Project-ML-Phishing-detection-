import React, { useMemo, useState } from "react";
import "./EmailList.css";
import { FiMail, FiFlag, FiTrash2 } from "react-icons/fi";
import { FaThumbtack } from "react-icons/fa";

const GROUP_ORDER = ["Today", "This week", "Last week", "Older"];

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EmailList({ emails, onSelectEmail, selectedEmailId }) {
  const [pinnedIds, setPinnedIds] = useState([]);

  const togglePin = (id) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const grouped = useMemo(() => {
    const groupsMap = {};

    emails.forEach((email) => {
      const groupName = email.group || "Other";
      if (!groupsMap[groupName]) {
        groupsMap[groupName] = [];
      }
      groupsMap[groupName].push(email);
    });

    const orderedNames = GROUP_ORDER.filter((g) => groupsMap[g]);
    const otherNames = Object.keys(groupsMap).filter(
      (g) => !GROUP_ORDER.includes(g)
    );

    return [...orderedNames, ...otherNames].map((name) => ({
      name,
      emails: groupsMap[name],
    }));
  }, [emails]);

  if (!emails.length) {
    return <div className="empty-state">No messages found.</div>;
  }

  return (
    <section className="email-list">
      {grouped.map((group) => (
        <div key={group.name} className="email-group">
          <div className="email-group-header">{group.name}</div>

          {group.emails.map((email) => {
            const isPinned = pinnedIds.includes(email.id);
            const isSelected = selectedEmailId === email.id;

            return (
              <article
                key={email.id}
                className={
                  "email-row" +
                  (email.isUnread ? " email-row--unread" : "") +
                  (isSelected ? " email-row--selected" : "")
                }
                onClick={() => {
                  if (onSelectEmail) onSelectEmail(email);
                }}
              >
                <div className="email-avatar-column">
                  <div className="email-avatar">
                    <span>{getInitials(email.sender)}</span>
                  </div>
                </div>

                <div className="email-checkbox-column">
                  <div className="email-checkbox" />
                </div>

                <div className="email-row-main">
                  {/* line 1: sender */}
                  <div className="email-row-top">
                    <span className="email-sender">{email.sender}</span>
                  </div>

                  {/* line 2: subject + icons + date */}
                  <div className="email-subject-row">
                    <span className="email-subject-link">{email.subject}</span>

                    <div className="email-subject-meta">
                      <div className="email-actions">
                        <button
                          type="button"
                          className="email-action-btn"
                          title="Mark as read"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiMail className="email-icon" />
                        </button>
                        <button
                          type="button"
                          className="email-action-btn"
                          title="Flag"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiFlag className="email-icon" />
                        </button>
                        <button
                          type="button"
                          className={
                            "email-action-btn" +
                            (isPinned ? " email-action-btn--pin-active" : "")
                          }
                          title="Pin"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(email.id);
                          }}
                        >
                          <FaThumbtack className="email-icon" />
                        </button>
                        <button
                          type="button"
                          className="email-action-btn"
                          title="Delete"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiTrash2 className="email-icon" />
                        </button>
                      </div>

                      <span className="email-date">{email.date}</span>
                    </div>
                  </div>

                  {/* line 3: preview */}
                  <div className="email-row-preview">{email.body}</div>
                </div>
              </article>
            );
          })}
        </div>
      ))}
    </section>
  );
}

export default EmailList;
