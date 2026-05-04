// frontend/src/pages/education/sections/ActionSections.jsx

import React from "react";
import Section from "../components/Section.jsx";

function ActionSections() {
  return (
    <>
      <Section
        id="actions"
        number="11"
        title="What to do if you are unsure"
        intro="When in doubt, slow down and verify through a trusted route."
      >
        <div className="action-grid">
          <div className="education-card">
            <h3>Before clicking</h3>
            <ul>
              <li>Do not click links in unexpected messages.</li>
              <li>Go directly to the official website or app.</li>
              <li>Check the sender address and link destination.</li>
              <li>Ask the sender through another trusted channel.</li>
              <li>Scan QR codes with caution — check the URL before opening.</li>
            </ul>
          </div>

          <div className="education-card">
            <h3>If you already clicked</h3>
            <ul>
              <li>Do not enter any more information.</li>
              <li>Close the page and report the message.</li>
              <li>Run a security scan if something downloaded.</li>
              <li>Contact IT support if using a work or university device.</li>
            </ul>
          </div>

          <div className="education-card">
            <h3>If you entered details</h3>
            <ul>
              <li>Change the password immediately on that account and any others using it.</li>
              <li>Enable multi-factor authentication if not already active.</li>
              <li>Contact the real organisation through an official route.</li>
              <li>Contact your bank immediately if payment details were shared.</li>
              <li>Report the incident to Action Fraud at actionfraud.police.uk.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section
        id="report"
        number="12"
        title="Report phishing in the UK"
        intro="Reporting helps suspicious emails, texts, calls, and websites be investigated and removed."
      >
        <div className="report-grid">
          <div className="report-card">
            <strong>Suspicious emails</strong>
            <p>Forward to report@phishing.gov.uk — handled by the NCSC.</p>
          </div>
          <div className="report-card">
            <strong>Suspicious texts</strong>
            <p>Forward to 7726 — free on most networks.</p>
          </div>
          <div className="report-card">
            <strong>Suspicious calls</strong>
            <p>Report to Action Fraud at actionfraud.police.uk or call 0300 123 2040.</p>
          </div>
          <div className="report-card">
            <strong>Bank or payment scams</strong>
            <p>Contact your bank using the official app or number on your card.</p>
          </div>
          <div className="report-card">
            <strong>Financial fraud or cybercrime</strong>
            <p>Report to Action Fraud at actionfraud.police.uk — the UK's national reporting centre.</p>
          </div>
        </div>
      </Section>
    </>
  );
}

export default ActionSections;
