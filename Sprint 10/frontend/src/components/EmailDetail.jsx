import React, { useMemo, useState } from "react";
import "./EmailDetail.css";

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

  if (!validFindings.length) {
    return [{ text, highlight: false }];
  }

  const parts = [];
  let cursor = 0;

  for (const finding of validFindings) {
    const start = Math.max(0, finding.start);
    const end = Math.min(text.length, finding.end);

    if (start < cursor) continue;

    if (start > cursor) {
      parts.push({
        text: text.slice(cursor, start),
        highlight: false,
      });
    }

    parts.push({
      text: text.slice(start, end),
      highlight: true,
      type: finding.type,
      severity: finding.severity,
      reason: finding.reason,
    });

    cursor = end;
  }

  if (cursor < text.length) {
    parts.push({
      text: text.slice(cursor),
      highlight: false,
    });
  }

  return parts;
}

function renderHighlightedParts(parts) {
  return parts.map((part, index) =>
    part.highlight ? (
      <mark
        key={index}
        className={`email-highlight email-highlight--${part.severity || "medium"}`}
        title={`${part.type}: ${part.reason}`}
      >
        {part.text}
      </mark>
    ) : (
      <span key={index}>{part.text}</span>
    )
  );
}

function cleanText(value = "") {
  return String(value)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(value = "") {
  return cleanText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function splitSummaryAndExplanation(aiExplanation = "") {
  const value = String(aiExplanation || "").trim();

  if (!value) {
    return {
      summary: "",
      explanation: "",
    };
  }

  const summaryMatch = value.match(/Summary:\s*([\s\S]*?)(?:\n\s*Explanation:|$)/i);
  const explanationMatch = value.match(/Explanation:\s*([\s\S]*)/i);

  return {
    summary: summaryMatch ? summaryMatch[1].trim() : "",
    explanation: explanationMatch ? explanationMatch[1].trim() : value,
  };
}

function buildReadableSummary(email) {
  const body = cleanText(email?.body || "");
  const subject = cleanText(email?.subject || "");

  const lowerBody = body.toLowerCase();

  if (
    lowerBody.includes("unusual activity") &&
    (lowerBody.includes("verify") || lowerBody.includes("confirm")) &&
    lowerBody.includes("account")
  ) {
    return "The email claims there has been unusual account activity and asks the recipient to confirm or verify account details using a link.";
  }

  if (
    lowerBody.includes("tax refund") ||
    lowerBody.includes("refund") ||
    lowerBody.includes("hmrc")
  ) {
    return "The email claims the recipient may be owed a refund and asks them to follow instructions to claim or verify details.";
  }

  if (
    lowerBody.includes("invoice") ||
    lowerBody.includes("payment") ||
    lowerBody.includes("bank details")
  ) {
    return "The email discusses a payment or invoice and asks the recipient to review or act on financial details.";
  }

  if (
    lowerBody.includes("password") ||
    lowerBody.includes("login") ||
    lowerBody.includes("sign in") ||
    lowerBody.includes("security")
  ) {
    return "The email relates to account security or sign-in activity and asks the recipient to take action.";
  }

  const sentences = splitSentences(body);

  if (sentences.length >= 2) {
    return `${sentences[0]} ${sentences[1]}`;
  }

  if (sentences.length === 1) {
    return sentences[0];
  }

  if (subject) {
    return `The email appears to relate to: ${subject}.`;
  }

  return "This email has limited visible content to summarise.";
}

function renderThreadMessage(threadEmail, selectedId) {
  const isCurrent = threadEmail.id === selectedId;

  return (
    <div
      key={threadEmail.id}
      className={
        "email-thread-message" +
        (isCurrent ? " email-thread-message--current" : "")
      }
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

      <div className="email-thread-message-body">
        {threadEmail.body || ""}
      </div>
    </div>
  );
}

function EmailDetail({ email, threadEmails = [] }) {
  const [showBody, setShowBody] = useState(false);
  const [showDetectionDetails, setShowDetectionDetails] = useState(false);

  if (!email) {
    return (
      <div className="email-detail email-detail--empty">
        <p>Select a message to read.</p>
      </div>
    );
  }

  const isPhishing = email.aiLabel === "phishing";
  const isInboxEmail = email.folder === "Inbox";
  const useSafetyView =
    !isInboxEmail && (isPhishing || email.folder === "Flagged" || email.folder === "Junk");

  const shouldHighlight =
    email.folder === "Flagged" || email.folder === "Junk" || email.isFlagged;

  const findings =
    shouldHighlight && Array.isArray(email.findings) ? email.findings : [];

  const senderParts = buildHighlightedParts(
    email.sender || "",
    findings,
    "sender"
  );
  const subjectParts = buildHighlightedParts(
    email.subject || "",
    findings,
    "subject"
  );
  const bodyParts = buildHighlightedParts(email.body || "", findings, "body");

  const { summary: llmSummary, explanation } = splitSummaryAndExplanation(
    email.aiExplanation
  );

  const summary = llmSummary || email.aiSummary || buildReadableSummary(email);
  const explanationText = explanation || email.aiExplanation || "";

  const uniqueFindingTypes = [...new Set(findings.map((f) => f.type))];
  const uniqueFindingReasons = [...new Set(findings.map((f) => f.reason))];

  const distinctThreadEmails = Array.isArray(threadEmails)
    ? threadEmails.filter(
        (item, index, arr) =>
          index ===
          arr.findIndex(
            (other) =>
              other.subject === item.subject &&
              other.sender === item.sender &&
              other.body === item.body &&
              other.date === item.date
          )
      )
    : [];

  const showThreadBox =
    distinctThreadEmails.length > 1 && email.threadId;

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
            <span
              className={
                "email-ai-badge " +
                (isPhishing
                  ? "email-ai-badge--phishing"
                  : "email-ai-badge--benign")
              }
            >
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
            <div
              className={
                "email-body-hidden-frame" +
                (showBody ? " email-body-hidden-frame--revealed" : "")
              }
            >
              {!showBody && (
                <div className="email-body-overlay">
                  <span>Email body hidden for safety</span>
                  <small>
                    Reveal it when you are ready to review the full message.
                  </small>
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

      {useSafetyView && isPhishing && (uniqueFindingTypes.length > 0 || uniqueFindingReasons.length > 0) && (
        <section className="email-detection-details">
          <button
            type="button"
            className="email-reveal-btn email-reveal-btn--warning"
            onClick={() => setShowDetectionDetails((prev) => !prev)}
          >
            {showDetectionDetails
              ? "Hide why it was detected as phishing"
              : "Reveal why it was detected as phishing"}
          </button>

          {showDetectionDetails && (
            <div className="email-reveal-content email-reveal-content--grid">
              {uniqueFindingTypes.length > 0 && (
                <div className="email-findings-summary">
                  <strong>Suspicious indicators:</strong>
                  <ul>
                    {uniqueFindingTypes.map((type) => (
                      <li key={type}>{type.replaceAll("_", " ")}</li>
                    ))}
                  </ul>
                </div>
              )}

              {uniqueFindingReasons.length > 0 && (
                <div className="email-findings-summary">
                  <strong>Detected issues:</strong>
                  <ul>
                    {uniqueFindingReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
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
