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

  const visibleEmailIds = useMemo(
    () => emails.map((email) => email.id),
    [emails]
  );

  const visibleSelectedCount = useMemo(
    () => visibleEmailIds.filter((id) => selectedSet.has(id)).length,
    [visibleEmailIds, selectedSet]
  );

  const allSelected =
    visibleEmailIds.length > 0 && visibleSelectedCount === visibleEmailIds.length;

  const someSelected = visibleSelectedCount > 0 && !allSelected;

  const grouped = useMemo(() => {
    const groupsMap = {};

    emails.forEach((email) => {
      const groupName = email.group || "Other";

      if (!groupsMap[groupName]) {
        groupsMap[groupName] = [];
      }

      groupsMap[groupName].push(email);
    });

    const orderedNames = GROUP_ORDER.filter((groupName) => groupsMap[groupName]);

    const otherNames = Object.keys(groupsMap).filter(
      (groupName) => !GROUP_ORDER.includes(groupName)
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
      <label className="email-select-all">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(input) => {
            if (input) {
              input.indeterminate = someSelected;
            }
          }}
          onChange={() => {
            if (typeof onToggleSelectAll === "function") {
              onToggleSelectAll();
            }
          }}
          aria-label="Select all emails"
        />

        <span>
          {visibleSelectedCount > 0
            ? `${visibleSelectedCount} selected`
            : "Select all"}
        </span>
      </label>

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
                  if (typeof onSelectEmail === "function") {
                    onSelectEmail(email);
                  }
                }}
                onDoubleClick={() => {
                  if (email.folder === "Drafts" && typeof onOpenDraft === "function") {
                    onOpenDraft(email);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();

                    if (typeof onSelectEmail === "function") {
                      onSelectEmail(email);
                    }
                  }
                }}
              >
                <div className="email-avatar-column">
                  <div className="email-avatar" aria-hidden="true">
                    <span>
                      {getInitials(email.sender || email.toRecipients || "")}
                    </span>
                  </div>
                </div>

                <div className="email-checkbox-column">
                  <input
                    type="checkbox"
                    className="email-checkbox"
                    checked={isChecked}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    onChange={(event) => {
                      event.stopPropagation();

                      if (typeof onToggleSelectedEmail === "function") {
                        onToggleSelectedEmail(email);
                      }
                    }}
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