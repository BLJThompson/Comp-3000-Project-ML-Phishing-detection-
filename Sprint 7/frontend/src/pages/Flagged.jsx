import React from "react";
import EmailList from "../components/EmailList";
import "./Flagged.css";

function Flagged({
  emails,
  onSelectEmail,
  selectedEmailId,
  onToggleFlag,
  onTogglePin,
  onMarkRead,
}) {
  return (
    <div className="flagged-page">
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

export default Flagged;
