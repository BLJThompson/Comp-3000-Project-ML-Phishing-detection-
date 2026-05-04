// frontend/src/pages/education/sections/BasicsSections.jsx

import React from "react";
import Section from "../components/Section.jsx";

function BasicsSections() {
  return (
    <>
      <Section
        id="basics"
        number="2"
        title="How phishing works"
        intro="Phishing messages try to make users act quickly without checking."
      >
        <div className="education-grid education-grid--two">
          <div className="education-card">
            <h3>What attackers want</h3>
            <p>
              Attackers usually want passwords, MFA codes, payment details,
              personal information, or access to a device or account.
            </p>
          </div>

          <div className="education-card">
            <h3>How they persuade users</h3>
            <p>
              They impersonate trusted organisations, create urgency, use
              familiar branding, and make the request seem routine or important.
              AI tools now help attackers produce flawless, personalised messages
              at scale.
            </p>
          </div>
        </div>
      </Section>

      <Section
        id="system"
        number="3"
        title="How this system helps"
        intro="The prototype supports user judgement by combining classification, routing, and explanation."
      >
        <div className="process-grid">
          <div className="process-step">
            <span>1</span>
            <strong>Email received</strong>
            <p>The email enters the local mailbox.</p>
          </div>
          <div className="process-step">
            <span>2</span>
            <strong>ML prediction</strong>
            <p>The model predicts benign or phishing.</p>
          </div>
          <div className="process-step">
            <span>3</span>
            <strong>Routing</strong>
            <p>Riskier emails are moved to Flagged or Junk.</p>
          </div>
          <div className="process-step">
            <span>4</span>
            <strong>Explanation</strong>
            <p>Highlights and explanations support review.</p>
          </div>
        </div>

        <div className="label-grid">
          <div className="label-card label-card--green">
            <h3>Benign</h3>
            <p>Score below 70%. Appears low risk, but unusual messages should still be checked.</p>
          </div>
          <div className="label-card label-card--amber">
            <h3>Flagged</h3>
            <p>Score 70–89%. Has suspicious characteristics and should be reviewed carefully.</p>
          </div>
          <div className="label-card label-card--red">
            <h3>Junk</h3>
            <p>Score 90% or above. Treated as high risk and moved away from the normal inbox.</p>
          </div>
        </div>
      </Section>
    </>
  );
}

export default BasicsSections;
