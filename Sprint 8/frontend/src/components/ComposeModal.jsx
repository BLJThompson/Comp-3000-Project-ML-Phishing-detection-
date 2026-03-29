import React, { useEffect, useState } from "react";
import "./ComposeModal.css";

function ComposeModal({
  isOpen,
  mode = "new",
  initialData = null,
  onClose,
  onSaveDraft,
  onSend,
}) {
  const [form, setForm] = useState({
    sender: "ben@example.com",
    toRecipients: "",
    ccRecipients: "",
    bccRecipients: "",
    subject: "",
    body: "",
    replyToId: null,
    threadId: null,
  });

  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      sender: initialData?.sender || "ben@example.com",
      toRecipients: initialData?.toRecipients || "",
      ccRecipients: initialData?.ccRecipients || "",
      bccRecipients: initialData?.bccRecipients || "",
      subject: initialData?.subject || "",
      body: initialData?.body || "",
      replyToId: initialData?.replyToId || null,
      threadId: initialData?.threadId || null,
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

      await onSend(form);

      // force close from modal side too
      onClose();
    } catch (err) {
      console.error("Send failed in modal:", err);
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
      console.error("Draft save failed in modal:", err);
      setError("Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  return (
    <div className="compose-backdrop">
      <div className="compose-modal">
        <div className="compose-header">
          <h3>
            {mode === "reply"
              ? "Reply"
              : mode === "forward"
              ? "Forward"
              : mode === "draft"
              ? "Edit Draft"
              : "New Email"}
          </h3>
          <button onClick={onClose} disabled={isSending || isSavingDraft}>
            Close
          </button>
        </div>

        <div className="compose-body">
          <input
            name="sender"
            placeholder="From"
            value={form.sender}
            onChange={handleChange}
            disabled={isSending || isSavingDraft}
          />
          <input
            name="toRecipients"
            placeholder="To"
            value={form.toRecipients}
            onChange={handleChange}
            disabled={isSending || isSavingDraft}
          />
          <input
            name="ccRecipients"
            placeholder="CC"
            value={form.ccRecipients}
            onChange={handleChange}
            disabled={isSending || isSavingDraft}
          />
          <input
            name="bccRecipients"
            placeholder="BCC"
            value={form.bccRecipients}
            onChange={handleChange}
            disabled={isSending || isSavingDraft}
          />
          <input
            name="subject"
            placeholder="Subject"
            value={form.subject}
            onChange={handleChange}
            disabled={isSending || isSavingDraft}
          />
          <textarea
            name="body"
            placeholder="Write your email..."
            value={form.body}
            onChange={handleChange}
            rows={12}
            disabled={isSending || isSavingDraft}
          />

          {error && <div className="compose-error">{error}</div>}
        </div>

        <div className="compose-footer">
          <button onClick={handleDraftClick} disabled={isSending || isSavingDraft}>
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </button>
          <button onClick={handleSendClick} disabled={isSending || isSavingDraft}>
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComposeModal;