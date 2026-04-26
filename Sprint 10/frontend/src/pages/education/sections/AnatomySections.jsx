import React from "react";
import Section from "../components/Section.jsx";
import WarningCard from "../components/WarningCard.jsx";
import { warningSigns } from "../data/warningSigns.js";

function AnatomySections() {
  return (
    <>
      <Section
        id="anatomy"
        number="3"
        title="Anatomy of a phishing email"
        intro="These are the parts of an email users should inspect before trusting it."
      >
        <div className="education-check-grid">
          <div>
            <strong>Sender address</strong>
            <span>Check the real address, not only the display name.</span>
          </div>
          <div>
            <strong>Reply-to address</strong>
            <span>Check whether replies go somewhere unexpected.</span>
          </div>
          <div>
            <strong>Links</strong>
            <span>Check the real destination before clicking.</span>
          </div>
          <div>
            <strong>Attachments</strong>
            <span>Be careful with unexpected documents, invoices, or forms.</span>
          </div>
          <div>
            <strong>Urgency</strong>
            <span>Pressure is often used to stop careful checking.</span>
          </div>
          <div>
            <strong>Sensitive requests</strong>
            <span>Passwords, codes, payment changes, and bank details are high risk.</span>
          </div>
        </div>
      </Section>

      <Section
        id="warning-signs"
        number="4"
        title="Common warning signs"
        intro="Click each card to reveal why the example is suspicious."
      >
        <div className="warning-grid">
          {warningSigns.map((item) => (
            <WarningCard key={item.title} item={item} />
          ))}
        </div>
      </Section>
    </>
  );
}

export default AnatomySections;
