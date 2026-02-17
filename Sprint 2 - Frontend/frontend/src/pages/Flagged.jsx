import React, { useMemo } from "react";
import EmailList from "../components/EmailList";
import "./Flagged.css";

function Flagged({ emails, searchTerm, onSelectEmail, selectedEmailId }) {
  const filteredEmails = useMemo(() => {
    const baseList = emails.filter((email) => email.isFlagged);
    const term = searchTerm.trim().toLowerCase();
    if (!term) return baseList;

    return baseList.filter((email) => {
      const subject = email.subject.toLowerCase();
      const sender = email.sender.toLowerCase();
      const preview = email.body.toLowerCase();

      return (
        subject.includes(term) ||
        sender.includes(term) ||
        preview.includes(term)
      );
    });
  }, [emails, searchTerm]);

  return (
    <div className="flagged-page">
      <EmailList
        emails={filteredEmails}
        onSelectEmail={onSelectEmail}
        selectedEmailId={selectedEmailId}
      />
    </div>
  );
}

export default Flagged;
