import React from "react";
import EmailList from "../components/EmailList";
import "./Sent.css";

function Sent({
  emails,
  onSelectEmail,
  selectedEmailId,
  onToggleFlag,
  onTogglePin,
  onMarkRead,
}) {
  return (
    <div className="sent-page">
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

export default Sent;
