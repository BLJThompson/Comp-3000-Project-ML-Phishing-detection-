import React, { useMemo } from "react";
import "./Dashboard.css";

const INDICATOR_LABELS = {
  urgency: "Urgency",
  credential_request: "Credential request",
  suspicious_link: "Suspicious link",
  suspicious_subject: "Suspicious subject",
  threat_language: "Threat language",
  financial_request: "Financial request",
  sensitive_info_request: "Sensitive information request",
  sender_mismatch: "Sender/domain mismatch",
  suspicious_sender_domain: "Suspicious sender domain",
  brand_reference: "Brand reference",
  prize_scam: "Prize scam",
  reward_bait: "Reward bait",
  promotional_bait: "Promotional bait",
  spam_offer: "Spam-style offer",
  scam_subject: "Scam-style subject",
  bulk_mail_marker: "Bulk-mail marker",
  bulk_mail_subject: "Newsletter-style subject",
  forwarded_bait: "Forwarded-style subject",
  hype_punctuation: "Excessive punctuation",
};

function formatIndicatorName(type = "") {
  return (
    INDICATOR_LABELS[type] ||
    String(type)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getIndicatorCounts(emails = []) {
  const counts = new Map();

  for (const email of emails) {
    const findings = Array.isArray(email?.findings) ? email.findings : [];

    for (const finding of findings) {
      const type = finding?.type;
      if (!type) continue;
      counts.set(type, (counts.get(type) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([type, count]) => ({ type, label: formatIndicatorName(type), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function Dashboard({ counts = {}, dashboardData = {} }) {
  const total = counts.Total || 0;
  const phishing = counts.Phishing || 0;
  const benign = counts.Benign || 0;
  const rate = total ? ((phishing / total) * 100).toFixed(1) : "0.0";

  const recentFlagged = dashboardData.flaggedEmails || [];
  const suspiciousEmails = dashboardData.suspiciousEmails || recentFlagged;

  const indicatorCounts = useMemo(
    () => getIndicatorCounts(suspiciousEmails),
    [suspiciousEmails]
  );

  return (
    <div className="dashboard-page">
      <section className="dashboard-grid">
        <div className="dashboard-card dashboard-card--blue">
          <h3>Total Emails</h3>
          <p className="dashboard-stat">{total}</p>
        </div>

        <div className="dashboard-card dashboard-card--green">
          <h3>Benign Emails</h3>
          <p className="dashboard-stat">{benign}</p>
        </div>

        <div className="dashboard-card dashboard-card--red">
          <h3>Phishing Emails</h3>
          <p className="dashboard-stat">{phishing}</p>
        </div>

        <div className="dashboard-card dashboard-card--amber">
          <h3>Phishing Rate</h3>
          <p className="dashboard-stat">{rate}%</p>
        </div>
      </section>

      <section className="dashboard-main-layout">
        <div className="dashboard-left-column">
          <article className="dashboard-card dashboard-card--settings">
            <div className="dashboard-settings-header">
              <div>
                <h3>Detection Settings</h3>
                <p className="dashboard-settings-subtitle">
                  Current protection mode used by the prototype.
                </p>
              </div>
              <span className="dashboard-settings-badge">Standard protection</span>
            </div>

            <div className="dashboard-settings-rules">
              <div className="dashboard-settings-rule">
                <div>
                  <strong>Junk folder</strong>
                  <span>Emails are sent directly to Junk when the phishing score is very high.</span>
                </div>
                <span className="dashboard-settings-threshold">≥ 90%</span>
              </div>

              <div className="dashboard-settings-rule">
                <div>
                  <strong>Flagged folder</strong>
                  <span>Emails are flagged for review when the phishing score is suspicious but lower confidence.</span>
                </div>
                <span className="dashboard-settings-threshold">≥ 70%</span>
              </div>

              <div className="dashboard-settings-rule">
                <div>
                  <strong>Inbox</strong>
                  <span>Emails below the flagged threshold remain in the inbox.</span>
                </div>
                <span className="dashboard-settings-threshold">&lt; 70%</span>
              </div>
            </div>

            <p className="dashboard-settings-note">
              Standard protection reflects the current routing logic used by the system.
              The machine learning model still performs the classification; these
              thresholds describe how the result is handled afterwards.
            </p>
          </article>

          <article className="dashboard-card dashboard-card--large">
            <h3>Recent Flagged Emails</h3>
            <div className="dashboard-scroll-area dashboard-scroll-area--flagged">
              {recentFlagged.length === 0 ? (
                <p className="dashboard-empty-text">No flagged emails yet.</p>
              ) : (
                <ul className="dashboard-list">
                  {recentFlagged.map((email) => (
                    <li key={email.id} className="dashboard-list-item dashboard-list-item--flagged">
                      <strong>{email.subject || "(No subject)"}</strong>
                      <span>{email.sender || "Unknown sender"}</span>
                      <span>
                        {typeof email.aiScore === "number"
                          ? `${(email.aiScore * 100).toFixed(1)}% confidence`
                          : "No score"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </div>

        <div className="dashboard-right-column">
          <article className="dashboard-card dashboard-card--folders">
            <h3>Folder Counts</h3>
            <ul className="dashboard-list">
              {["Inbox", "Drafts", "Sent", "Deleted", "Flagged", "Junk"].map((folder) => (
                <li key={folder} className="dashboard-list-item">
                  <strong>{folder}</strong>
                  <span>{counts[folder] || 0}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="dashboard-card dashboard-card--indicators">
            <h3>Suspicious Indicators</h3>
            <p className="dashboard-card-subtitle">
              Count of rule-based indicators found during classification.
            </p>

            <div className="dashboard-scroll-area dashboard-scroll-area--indicators">
              {indicatorCounts.length === 0 ? (
                <p className="dashboard-empty-text">
                  No suspicious indicators have been recorded yet.
                </p>
              ) : (
                <ul className="dashboard-indicator-list">
                  {indicatorCounts.map((item) => (
                    <li key={item.type} className="dashboard-indicator-item">
                      <span>{item.label}</span>
                      <strong>{item.count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
