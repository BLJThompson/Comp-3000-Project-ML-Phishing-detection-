import React, { useMemo } from "react";
import "./EmailList.css";

const GROUP_ORDER = ["Today", "This week", "Last week", "Older"];

function getInitials(name = "") {
  return name
    .replace(/<[^>]+>/g, "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EmailList({
  emails = [],
  onSelectEmail,
  selectedEmailId,
  selectedEmailIds = [],
  onToggleSelectedEmail,
  onToggleSelectAll,
  onOpenDraft,
}) {
  const selectedSet = useMemo(
    () => new Set(selectedEmailIds),
    [selectedEmailIds]
  );

  const allSelected = emails.length > 0 && selectedEmailIds.length === emails.length;
  const someSelected = selectedEmailIds.length > 0 && !allSelected;

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
      <div className="email-select-all">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(input) => {
            if (input) input.indeterminate = someSelected;
          }}
          onChange={() => {
            if (onToggleSelectAll) onToggleSelectAll();
          }}
          aria-label="Select all emails"
        />
        <span>Select all</span>
      </div>

      {grouped.map((group) => (
        <div key={group.name} className="email-group">
          <div className="email-group-header">{group.name}</div>

          {group.emails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const isChecked = selectedSet.has(email.id);

            return (
              <article
                key={email.id}
                tabIndex={0}
                className={
                  "email-row" +
                  (email.isUnread ? " email-row--unread" : " email-row--read") +
                  (isSelected ? " email-row--selected" : "") +
                  (isChecked ? " email-row--checked" : "")
                }
                onClick={() => {
                  if (onSelectEmail) onSelectEmail(email);
                }}
                onDoubleClick={() => {
                  if (email.folder === "Drafts" && onOpenDraft) {
                    onOpenDraft(email);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (onSelectEmail) onSelectEmail(email);
                  }
                }}
              >
                <div className="email-avatar-column">
                  <div className="email-avatar" aria-hidden="true">
                    <span>{getInitials(email.sender || email.toRecipients || "")}</span>
                  </div>
                </div>

                <div className="email-checkbox-column">
                  <input
                    type="checkbox"
                    className="email-checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (onToggleSelectedEmail) onToggleSelectedEmail(email);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${email.subject || "email"}`}
                  />
                </div>

                <div className="email-row-main">
                  <div className="email-row-top">
                    <span className="email-sender">
                      {email.sender || email.toRecipients || "Unknown"}
                    </span>

                    {email.isUnread && (
                      <span className="email-unread-pill">Unread</span>
                    )}
                  </div>

                  <div className="email-subject-row">
                    <span className="email-subject-link">
                      {email.subject || "(No subject)"}
                    </span>

                    <span className="email-date">{email.date}</span>
                  </div>

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
