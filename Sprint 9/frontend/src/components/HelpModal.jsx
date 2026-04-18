import React from "react";
import "./HelpModal.css";

function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="help-backdrop" onClick={onClose}>
      <div
        className="help-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        <div className="help-header">
          <h3 id="help-modal-title">How to use this mail client</h3>
          <button onClick={onClose}>Close</button>
        </div>

        <div className="help-body">
          <section className="help-section">
            <h4>Folders</h4>
            <ul>
              <li>
                <strong>Inbox:</strong> Emails assessed as safe or low-risk.
              </li>
              <li>
                <strong>Drafts:</strong> Emails saved for later editing and sending.
              </li>
              <li>
                <strong>Sent:</strong> Emails you have sent from this client.
              </li>
              <li>
                <strong>Deleted:</strong> Emails removed from folders. Deleting again
                here removes them permanently.
              </li>
              <li>
                <strong>Flagged:</strong> Suspicious emails that may require review.
              </li>
              <li>
                <strong>Junk:</strong> High-confidence suspicious emails considered
                more dangerous.
              </li>
            </ul>
          </section>

          <section className="help-section">
            <h4>Sending, drafts, delete and restore</h4>
            <ul>
              <li>
                <strong>New Email:</strong> Opens the compose window to create a new
                message.
              </li>
              <li>
                <strong>Save Draft:</strong> Stores the message in Drafts so you can
                edit it later.
              </li>
              <li>
                <strong>Send:</strong> Sends the message, stores a copy in Sent, and
                creates a local received copy that is routed to Inbox, Flagged, or
                Junk depending on the AI result.
              </li>
              <li>
                <strong>Delete:</strong> Moves the email to Deleted.
              </li>
              <li>
                <strong>Restore:</strong> Returns a deleted email back to its previous
                folder.
              </li>
              <li>
                <strong>Delete Permanently:</strong> If an email is already in Deleted,
                deleting it again removes it from the system.
              </li>
            </ul>
          </section>

          <section className="help-section">
            <h4>Flagged vs Junk</h4>
            <ul>
              <li>
                <strong>Flagged:</strong> The AI thinks the email is suspicious, but
                not severe enough for Junk.
              </li>
              <li>
                <strong>Junk:</strong> The AI has a higher confidence that the email is
                malicious or strongly phishing-related.
              </li>
            </ul>
          </section>

          <section className="help-section">
            <h4>Phishing detection</h4>
            <ul>
              <li>
                Each email can be analysed by the phishing detection pipeline.
              </li>
              <li>
                The system uses a machine learning model to classify the email as
                benign or phishing.
              </li>
              <li>
                Suspicious phrases, links, sender issues, and other findings can be
                highlighted in the email detail view.
              </li>
              <li>
                Phishing emails may also show a short explanation of why they were
                flagged.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;