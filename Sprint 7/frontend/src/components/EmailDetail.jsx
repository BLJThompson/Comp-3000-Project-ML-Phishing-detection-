import React from "react";
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

function EmailDetail({ email }) {
  if (!email) {
    return (
      <div className="email-detail email-detail--empty">
        <p>Select a message to read.</p>
      </div>
    );
  }

  const isPhishing = email.aiLabel === "phishing";
  const shouldHighlight = email.folder === "Flagged" || email.isFlagged;

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

  const uniqueFindingTypes = [...new Set(findings.map((f) => f.type))];
  const uniqueFindingReasons = [...new Set(findings.map((f) => f.reason))];

  return (
    <div className="email-detail">
      <header className="email-detail-header">
        <h2 className="email-detail-subject">
          {renderHighlightedParts(subjectParts)}
        </h2>

        <div className="email-detail-meta">
          <span className="email-detail-from">
            {renderHighlightedParts(senderParts)}
          </span>
          <span className="email-detail-date">{email.date}</span>
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

          {isPhishing && typeof email.aiScore === "number" && (
            <span className="email-ai-score">
              Confidence: {(email.aiScore * 100).toFixed(1)}%
            </span>
          )}
        </div>

        {isPhishing && email.aiExplanation && (
          <div className="email-ai-explanation">
            <strong>Why this was flagged:</strong>
            <p>{email.aiExplanation}</p>
          </div>
        )}

        {isPhishing && uniqueFindingTypes.length > 0 && (
          <div className="email-findings-summary">
            <strong>Suspicious indicators:</strong>
            <ul>
              {uniqueFindingTypes.map((type) => (
                <li key={type}>{type.replaceAll("_", " ")}</li>
              ))}
            </ul>
          </div>
        )}

        {isPhishing && uniqueFindingReasons.length > 0 && (
          <div className="email-findings-summary">
            <strong>Detected issues:</strong>
            <ul>
              {uniqueFindingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <div className="email-detail-body">
        <p>{renderHighlightedParts(bodyParts)}</p>
      </div>
    </div>
  );
}

export default EmailDetail;