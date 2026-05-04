// frontend/src/components/EmailDetail.jsx

import React, { useMemo, useState } from "react";
import "./EmailDetail.css";

// Human-readable labels for finding types — kept in sync with ai_rules.js and Dashboard.jsx.
const INDICATOR_LABELS = {
  urgency:                  "Urgency language",
  credential_request:       "Credential request",
  suspicious_link:          "Suspicious link",
  suspicious_subject:       "Suspicious subject",
  threat_language:          "Threat language",
  financial_request:        "Financial request",
  sensitive_info_request:   "Sensitive information request",
  sender_mismatch:          "Sender / domain mismatch",
  suspicious_sender_domain: "Suspicious sender domain",
  brand_reference:          "Brand impersonation reference",
  prize_scam:               "Prize scam language",
  reward_bait:              "Reward or bonus bait",
  promotional_bait:         "Promotional bait",
  spam_offer:               "Spam-style offer",
  scam_subject:             "Scam-style subject",
  bulk_mail_marker:         "Bulk-mail marker",
  bulk_mail_subject:        "Newsletter-style subject",
  forwarded_bait:           "Forwarded-style subject",
  hype_punctuation:         "Excessive punctuation",
};

const SEVERITY_RANK = { high: 3, medium: 2, low: 1 };
const SEVERITY_LABEL = { high: "High risk", medium: "Medium risk", low: "Low risk" };

// ─── Finding utilities ────────────────────────────────────────────────────────

// Deduplicates findings by type, keeping the highest-severity entry per type,
// then sorts high → medium → low.
function getTopFindings(findings = []) {
  const byType = new Map();

  for (const f of findings) {
    if (!f?.type) continue;
    const existing = byType.get(f.type);
    if (!existing || (SEVERITY_RANK[f.severity] || 0) > (SEVERITY_RANK[existing.severity] || 0)) {
      byType.set(f.type, f);
    }
  }

  return [...byType.values()].sort(
    (a, b) => (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0)
  );
}

function labelForType(type) {
  return INDICATOR_LABELS[type] || String(type).replaceAll("_", " ");
}

// ─── Highlighting ─────────────────────────────────────────────────────────────

function buildHighlightedParts(text, findings = [], field = "body") {
  if (!text) return [{ text: "", highlight: false }];

  const validFindings = findings
    .filter(
      (f) =>
        f &&
        f.field === field &&
        typeof f.start === "number" &&
        typeof f.end === "number" &&
        f.end > f.start
    )
    .sort((a, b) => a.start - b.start);

  if (!validFindings.length) return [{ text, highlight: false }];

  const parts = [];
  let cursor = 0;

  for (const finding of validFindings) {
    const start = Math.max(0, finding.start);
    const end   = Math.min(text.length, finding.end);

    if (start < cursor) continue;
    if (start > cursor) parts.push({ text: text.slice(cursor, start), highlight: false });

    parts.push({
      text:      text.slice(start, end),
      highlight: true,
      type:      finding.type,
      severity:  finding.severity,
      reason:    finding.reason,
    });

    cursor = end;
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor), highlight: false });

  return parts;
}

function renderHighlightedParts(parts) {
  return parts.map((part, index) =>
    part.highlight ? (
      <mark
        key={index}
        className={`email-highlight email-highlight--${part.severity || "medium"}`}
        title={`${labelForType(part.type)}: ${part.reason}`}
      >
        {part.text}
      </mark>
    ) : (
      <span key={index}>{part.text}</span>
    )
  );
}

// ─── Summary building ─────────────────────────────────────────────────────────

function cleanText(value = "") {
  return String(value).replace(/https?:\/\/\S+/gi, " ").replace(/\s+/g, " ").trim();
}

function splitSentences(value = "") {
  return cleanText(value)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitSummaryAndExplanation(aiExplanation = "") {
  const value = String(aiExplanation || "").trim();
  if (!value) return { summary: "", explanation: "" };

  const summaryMatch     = value.match(/Summary:\s*([\s\S]*?)(?:\n\s*Explanation:|$)/i);
  const explanationMatch = value.match(/Explanation:\s*([\s\S]*)/i);

  return {
    summary:     summaryMatch     ? summaryMatch[1].trim()     : "",
    explanation: explanationMatch ? explanationMatch[1].trim() : value,
  };
}

// Client-side fallback summary when Gemini is unavailable.
function buildReadableSummary(email) {
  const body      = cleanText(email?.body    || "");
  const subject   = cleanText(email?.subject || "");
  const lowerBody = body.toLowerCase();

  if (lowerBody.includes("unusual activity") && (lowerBody.includes("verify") || lowerBody.includes("confirm")) && lowerBody.includes("account"))
    return "The email claims there has been unusual account activity and asks the recipient to confirm or verify account details using a link.";
  if (lowerBody.includes("tax refund") || lowerBody.includes("refund") || lowerBody.includes("hmrc"))
    return "The email claims the recipient may be owed a refund and asks them to follow instructions to claim or verify details.";
  if (lowerBody.includes("invoice") || lowerBody.includes("payment") || lowerBody.includes("bank details"))
    return "The email discusses a payment or invoice and asks the recipient to review or act on financial details.";
  if (lowerBody.includes("password") || lowerBody.includes("login") || lowerBody.includes("sign in") || lowerBody.includes("security"))
    return "The email relates to account security or sign-in activity and asks the recipient to take action.";

  const sentences = splitSentences(body);
  if (sentences.length >= 2) return `${sentences[0]} ${sentences[1]}`;
  if (sentences.length === 1) return sentences[0];
  if (subject) return `The email appears to relate to: ${subject}.`;
  return "This email has limited visible content to summarise.";
}

// ─── Thread rendering ─────────────────────────────────────────────────────────

function renderThreadMessage(threadEmail, selectedId) {
  const isCurrent = threadEmail.id === selectedId;

  return (
    <div
      key={threadEmail.id}
      className={"email-thread-message" + (isCurrent ? " email-thread-message--current" : "")}
    >
      <div className="email-thread-message-header">
        <div>
          <strong className="email-thread-message-subject">
            {threadEmail.subject || "(No subject)"}
          </strong>
          <div className="email-thread-message-from">
            {threadEmail.sender || threadEmail.toRecipients || "Unknown sender"}
          </div>
        </div>
        <div className="email-thread-message-date">{threadEmail.date}</div>
      </div>

      {!!threadEmail.toRecipients && (
        <div className="email-thread-message-recipient">
          <strong>To:</strong> {threadEmail.toRecipients}
        </div>
      )}

      <div className="email-thread-message-body">{threadEmail.body || ""}</div>
    </div>
  );
}

// ─── Detection details panel ──────────────────────────────────────────────────

function DetectionDetails({ findings }) {
  const [open, setOpen] = useState(false);
  const topFindings = useMemo(() => getTopFindings(findings), [findings]);

  if (!topFindings.length) return null;

  const highCount   = topFindings.filter((f) => f.severity === "high").length;
  const mediumCount = topFindings.filter((f) => f.severity === "medium").length;

  const summary =
    highCount > 0
      ? `${highCount} high-risk indicator${highCount > 1 ? "s" : ""} detected`
      : mediumCount > 0
      ? `${mediumCount} medium-risk indicator${mediumCount > 1 ? "s" : ""} detected`
      : `${topFindings.length} low-risk indicator${topFindings.length > 1 ? "s" : ""} detected`;

  return (
    <section className="email-detection-details">
      <button
        type="button"
        className="email-reveal-btn email-reveal-btn--warning"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "Hide detection details" : `Why was this flagged? — ${summary}`}
      </button>

      {open && (
        <div className="email-findings-breakdown">
          {["high", "medium", "low"].map((severity) => {
            const items = topFindings.filter((f) => f.severity === severity);
            if (!items.length) return null;

            return (
              <div key={severity} className={`email-findings-group email-findings-group--${severity}`}>
                <div className={`email-findings-severity-label email-findings-severity-label--${severity}`}>
                  {SEVERITY_LABEL[severity]}
                </div>

                <ul className="email-findings-list">
                  {items.map((f) => (
                    <li key={f.type} className="email-finding-item">
                      <strong className="email-finding-name">{labelForType(f.type)}</strong>
                      <span className="email-finding-reason">{f.reason}</span>
                      {f.text && f.text.length <= 80 && (
                        <span className="email-finding-text">
                          Flagged: <em>"{f.text}"</em>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function EmailDetail({ email, threadEmails = [] }) {
  const [showBody, setShowBody] = useState(false);

  if (!email) {
    return (
      <div className="email-detail email-detail--empty">
        <p>Select a message to read.</p>
      </div>
    );
  }

  const isPhishing   = email.aiLabel === "phishing";
  const isInboxEmail = email.folder === "Inbox";

  // Safety view hides the body behind a reveal button for suspicious non-inbox emails.
  const useSafetyView =
    !isInboxEmail && (isPhishing || email.folder === "Flagged" || email.folder === "Junk");

  const shouldHighlight =
    email.folder === "Flagged" || email.folder === "Junk" || email.isFlagged;

  const findings = shouldHighlight && Array.isArray(email.findings) ? email.findings : [];

  const senderParts  = buildHighlightedParts(email.sender  || "", findings, "sender");
  const subjectParts = buildHighlightedParts(email.subject || "", findings, "subject");
  const bodyParts    = buildHighlightedParts(email.body    || "", findings, "body");

  const { summary: llmSummary, explanation } = splitSummaryAndExplanation(email.aiExplanation);

  const summary         = llmSummary || email.aiSummary || buildReadableSummary(email);
  const explanationText = explanation || email.aiExplanation || "";

  const distinctThreadEmails = Array.isArray(threadEmails)
    ? threadEmails.filter(
        (item, index, arr) =>
          index === arr.findIndex(
            (other) =>
              other.subject === item.subject &&
              other.sender  === item.sender  &&
              other.body    === item.body    &&
              other.date    === item.date
          )
      )
    : [];

  const showThreadBox = distinctThreadEmails.length > 1 && email.threadId;

  return (
    <div className="email-detail">
      <article className="email-print-style-card">
        <header className="email-detail-header">
          <h2 className="email-detail-subject">
            {renderHighlightedParts(subjectParts)}
          </h2>

          <div className="email-detail-divider" />

          <div className="email-detail-meta-table">
            <div className="email-detail-meta-row">
              <span className="email-detail-meta-label">From:</span>
              <span className="email-detail-meta-value">
                {renderHighlightedParts(senderParts)}
              </span>
            </div>

            {!!email.toRecipients && (
              <div className="email-detail-meta-row">
                <span className="email-detail-meta-label">To:</span>
                <span className="email-detail-meta-value">{email.toRecipients}</span>
              </div>
            )}

            {!!email.ccRecipients && (
              <div className="email-detail-meta-row">
                <span className="email-detail-meta-label">CC:</span>
                <span className="email-detail-meta-value">{email.ccRecipients}</span>
              </div>
            )}

            <div className="email-detail-meta-row">
              <span className="email-detail-meta-label">Date:</span>
              <span className="email-detail-meta-value">{email.date}</span>
            </div>
          </div>

          <div className="email-ai-panel">
            <span className={"email-ai-badge " + (isPhishing ? "email-ai-badge--phishing" : "email-ai-badge--benign")}>
              {email.aiLabel || "unknown"}
            </span>

            {typeof email.aiScore === "number" && (
              <span className="email-ai-score">
                Confidence: {(email.aiScore * 100).toFixed(1)}%
              </span>
            )}
          </div>

          {useSafetyView && (
            <section className="email-summary-panel">
              <strong>Email summary:</strong>
              <p>{summary}</p>
            </section>
          )}

          {isPhishing && explanationText && (
            <section className="email-ai-explanation">
              <strong>AI explanation:</strong>
              <p>{explanationText}</p>
            </section>
          )}
        </header>

        <section className="email-detail-body-section">
          <div className="email-body-header-row">
            <h3>Email body</h3>

            {useSafetyView && (
              <button
                type="button"
                className="email-reveal-btn"
                onClick={() => setShowBody((prev) => !prev)}
              >
                {showBody ? "Hide email body" : "Reveal email body"}
              </button>
            )}
          </div>

          {useSafetyView ? (
            <div className={"email-body-hidden-frame" + (showBody ? " email-body-hidden-frame--revealed" : "")}>
              {!showBody && (
                <div className="email-body-overlay">
                  <span>Email body hidden for safety</span>
                  <small>Reveal it when you are ready to review the full message.</small>
                </div>
              )}
              <div className="email-detail-body">
                {renderHighlightedParts(bodyParts)}
              </div>
            </div>
          ) : (
            <div className="email-detail-body email-detail-body--normal">
              {renderHighlightedParts(bodyParts)}
            </div>
          )}
        </section>
      </article>

      {/* Show detection details for all phishing emails, not just non-inbox ones. */}
      {isPhishing && Array.isArray(email.findings) && email.findings.length > 0 && (
        <DetectionDetails findings={email.findings} />
      )}

      {showThreadBox && (
        <section className="email-thread-section">
          <h3 className="email-thread-title">Conversation</h3>
          <div className="email-thread-stack">
            {distinctThreadEmails.map((threadEmail) =>
              renderThreadMessage(threadEmail, email.id)
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default EmailDetail;
