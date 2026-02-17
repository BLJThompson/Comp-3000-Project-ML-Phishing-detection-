import React from "react";
import "./EmailDetail.css";

function EmailDetail({ email }) {
  if (!email) {
    return (
      <div className="email-detail email-detail--empty">
        <p>Select a message to read.</p>
      </div>
    );
  }

  return (
    <div className="email-detail">
      <header className="email-detail-header">
        <h2 className="email-detail-subject">{email.subject}</h2>

        <div className="email-detail-meta">
          <span className="email-detail-from">{email.sender}</span>
          <span className="email-detail-date">{email.date}</span>
        </div>
      </header>

      <div className="email-detail-body">
        {/* For now your dummy body is just 1 line; later you can store full content */}
        <p>{email.body}</p>
      </div>
    </div>
  );
}

export default EmailDetail;
