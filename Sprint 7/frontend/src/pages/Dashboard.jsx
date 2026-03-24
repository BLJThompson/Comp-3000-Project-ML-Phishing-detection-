import React from "react";
import "./Dashboard.css";

function formatIndicatorName(type) {
  return type.replaceAll("_", " ");
}

function Dashboard({ counts, dashboardData }) {
  const inboxCount = counts.Inbox || 0;
  const sentCount = counts.Sent || 0;
  const flaggedCount = counts.Flagged || 0;
  const totalCount = inboxCount + sentCount + flaggedCount;

  const phishingRate =
    totalCount > 0 ? ((flaggedCount / totalCount) * 100).toFixed(1) : "0.0";

  const recentFlagged = [...(dashboardData.flaggedEmails || [])]
    .sort((a, b) => b.id - a.id)
    .slice(0, 12);

  const allFindings = (dashboardData.flaggedEmails || []).flatMap(
    (email) => email.findings || []
  );

  const findingCounts = allFindings.reduce((acc, finding) => {
    const key = finding.type || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topIndicators = Object.entries(findingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxIndicatorCount =
    topIndicators.length > 0 ? Math.max(...topIndicators.map(([, count]) => count)) : 1;

  return (
    <div className="dashboard-page">
      <div className="dashboard-grid">
        <div className="dashboard-card dashboard-card--stat dashboard-card--blue">
          <h3>Total Emails</h3>
          <p className="dashboard-stat">{totalCount}</p>
          <span className="dashboard-subtext">All processed messages</span>
        </div>

        <div className="dashboard-card dashboard-card--stat dashboard-card--green">
          <h3>Inbox</h3>
          <p className="dashboard-stat">{inboxCount}</p>
          <span className="dashboard-subtext">Benign emails</span>
        </div>

        <div className="dashboard-card dashboard-card--stat dashboard-card--red">
          <h3>Flagged</h3>
          <p className="dashboard-stat">{flaggedCount}</p>
          <span className="dashboard-subtext">Phishing detections</span>
        </div>

        <div className="dashboard-card dashboard-card--stat dashboard-card--amber">
          <h3>Phishing Rate</h3>
          <p className="dashboard-stat">{phishingRate}%</p>
          <span className="dashboard-subtext">Of all emails processed</span>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-card dashboard-card--large">
          <div className="dashboard-card-header">
            <h3>Recent Flagged Emails</h3>
            <span className="dashboard-badge">{flaggedCount} flagged</span>
          </div>

          {recentFlagged.length === 0 ? (
            <p>No flagged emails yet.</p>
          ) : (
            <div className="dashboard-scroll-area">
              <ul className="dashboard-list">
                {recentFlagged.map((email) => (
                  <li key={email.id} className="dashboard-list-item">
                    <strong>{email.subject}</strong>
                    <span>{email.sender}</span>
                    <span className="dashboard-confidence">
                      {(typeof email.aiScore === "number"
                        ? email.aiScore * 100
                        : 0
                      ).toFixed(1)}
                      % confidence
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="dashboard-card dashboard-card--large">
          <div className="dashboard-card-header">
            <h3>Top Suspicious Indicators</h3>
            <span className="dashboard-badge">Ranked</span>
          </div>

          {topIndicators.length === 0 ? (
            <p>No suspicious indicators recorded yet.</p>
          ) : (
            <div className="indicator-list">
              {topIndicators.map(([type, count], index) => {
                const widthPercent = (count / maxIndicatorCount) * 100;

                return (
                  <div key={type} className="indicator-item">
                    <div className="indicator-top-row">
                      <span className="indicator-rank">#{index + 1}</span>
                      <span className="indicator-name">
                        {formatIndicatorName(type)}
                      </span>
                      <span className="indicator-count">{count}</span>
                    </div>

                    <div className="indicator-bar-track">
                      <div
                        className="indicator-bar-fill"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-card dashboard-card--large">
        <div className="dashboard-card-header">
          <h3>System Summary</h3>
          <span className="dashboard-badge dashboard-badge--neutral">
            Overview
          </span>
        </div>
        <p>
          The dashboard provides an overview of mailbox activity and phishing
          detections. Inbox contains benign emails, while the Flagged folder
          contains emails classified as phishing by the system. The indicator
          panel highlights the most common suspicious patterns detected across
          flagged messages.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;