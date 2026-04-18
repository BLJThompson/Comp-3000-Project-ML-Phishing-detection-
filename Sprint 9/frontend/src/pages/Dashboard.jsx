import React from "react";
import "./Dashboard.css";

function Dashboard({ counts = {}, dashboardData = {} }) {
  const total = counts.Total || 0;
  const phishing = counts.Phishing || 0;
  const benign = counts.Benign || 0;
  const rate = total ? ((phishing / total) * 100).toFixed(1) : "0.0";

  const recentFlagged = dashboardData.flaggedEmails || [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-grid">
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
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-card dashboard-card--large">
          <h3>Folder Counts</h3>
          <ul className="dashboard-list">
            {["Inbox", "Drafts", "Sent", "Deleted", "Flagged", "Junk"].map(
              (folder) => (
                <li key={folder} className="dashboard-list-item">
                  <strong>{folder}</strong>
                  <span>{counts[folder] || 0}</span>
                </li>
              )
            )}
          </ul>
        </div>

        <div className="dashboard-card dashboard-card--large">
          <h3>Recent Flagged Emails</h3>
          <div className="dashboard-scroll-area">
            {recentFlagged.length === 0 ? (
              <p>No flagged emails yet.</p>
            ) : (
              <ul className="dashboard-list">
                {recentFlagged.map((email) => (
                  <li key={email.id} className="dashboard-list-item">
                    <strong>{email.subject}</strong>
                    <span>{email.sender}</span>
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
        </div>
      </div>
    </div>
  );
}

export default Dashboard;