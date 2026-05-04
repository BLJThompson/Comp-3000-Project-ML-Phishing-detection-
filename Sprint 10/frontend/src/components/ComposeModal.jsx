// frontend/src/components/ComposeModal.jsx

import React, { useEffect, useState } from "react";
import "./ComposeModal.css";

const DEFAULT_SENDER = "comp3000.phishing.detector@gmail.com";

const EMPTY_FORM = {
  sender: DEFAULT_SENDER,
  toRecipients: "",
  ccRecipients: "",
  bccRecipients: "",
  subject: "",
  body: "",
  replyToId: null,
  threadId: null,
};

function ComposeModal({ isOpen, mode = "new", initialData = null, onClose, onSaveDraft, onSend }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // isBusy prevents double-submission and disables inputs while an action is in flight.
  const isBusy = isSending || isSavingDraft;

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      sender:       initialData?.sender       || DEFAULT_SENDER,
      toRecipients: initialData?.toRecipients || "",
      ccRecipients: initialData?.ccRecipients || "",
      bccRecipients:initialData?.bccRecipients|| "",
      subject:      initialData?.subject      || "",
      body:         initialData?.body         || "",
      replyToId:    initialData?.replyToId    || null,
      threadId:     initialData?.threadId     || null,
    });

    setError("");
    setIsSending(false);
    setIsSavingDraft(false);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSendClick() {
    if (!form.toRecipients.trim()) {
      setError("A recipient is required before sending.");
      return;
    }

    if (!form.subject.trim()) {
      setError("A subject is required before sending.");
      return;
    }

    try {
      setError("");
      setIsSending(true);
      await onSend({ ...form, sender: DEFAULT_SENDER });
      onClose();
    } catch (err) {
      console.error("Send failed:", err);
      setError("Failed to send email.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleDraftClick() {
    try {
      setError("");
      setIsSavingDraft(true);
      await onSaveDraft(form);
      onClose();
    } catch (err) {
      console.error("Draft save failed:", err);
      setError("Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  const title =
    mode === "reply"   ? "Reply"      :
    mode === "forward" ? "Forward"    :
    mode === "draft"   ? "Edit Draft" : "New Email";

  return (
    <div className="compose-backdrop">
      <div className="compose-modal">
        <div className="compose-header">
          <h3>{title}</h3>
          <button onClick={onClose} disabled={isBusy}>Close</button>
        </div>

        <div className="compose-body">
          <input
            name="sender"
            placeholder="From"
            value={form.sender}
            readOnly
            disabled={isBusy}
            title="Emails are sent through the authenticated Gmail account."
          />
          <input name="toRecipients"  placeholder="To"      value={form.toRecipients}  onChange={handleChange} disabled={isBusy} />
          <input name="ccRecipients"  placeholder="CC"      value={form.ccRecipients}  onChange={handleChange} disabled={isBusy} />
          <input name="bccRecipients" placeholder="BCC"     value={form.bccRecipients} onChange={handleChange} disabled={isBusy} />
          <input name="subject"       placeholder="Subject" value={form.subject}        onChange={handleChange} disabled={isBusy} />
          <textarea
            name="body"
            placeholder="Write your email..."
            value={form.body}
            onChange={handleChange}
            rows={12}
            disabled={isBusy}
          />

          {error && <div className="compose-error">{error}</div>}
        </div>

        <div className="compose-footer">
          <button onClick={handleDraftClick} disabled={isBusy}>
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </button>
          <button onClick={handleSendClick} disabled={isBusy}>
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComposeModal;
