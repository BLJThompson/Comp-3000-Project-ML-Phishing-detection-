import React from "react";
import EmailList from "../components/EmailList";
import "./Inbox.css";

function Inbox({
  emails,
  onSelectEmail,
  selectedEmailId,
  onToggleFlag,
  onTogglePin,
  onMarkRead,
}) {
  return (
    <div className="inbox-page">
      <EmailList
        emails={emails}
        onSelectEmail={onSelectEmail}
        selectedEmailId={selectedEmailId}
        onToggleFlag={onToggleFlag}
        onTogglePin={onTogglePin}
        onMarkRead={onMarkRead}
      />
    </div>
  );
}

export default Inbox;
