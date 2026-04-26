import React from "react";
import Section from "../components/Section.jsx";

function SafetyChecksSections() {
  return (
    <>
      <Section
        id="checks"
        number="6"
        title="Beginner, intermediate, and expert checks"
        intro="Use these checks before trusting an email."
      >
        <div className="level-grid">
          <div className="level-card">
            <h3>Beginner checks</h3>
            <ul>
              <li>Do I recognise the sender?</li>
              <li>Was I expecting this email?</li>
              <li>Is it asking me to click, download, or reply?</li>
            </ul>
          </div>
          <div className="level-card">
            <h3>Intermediate checks</h3>
            <ul>
              <li>Does the sender domain match the organisation?</li>
              <li>Does the link destination match the visible text?</li>
              <li>Is the message creating urgency?</li>
            </ul>
          </div>
          <div className="level-card">
            <h3>Expert checks</h3>
            <ul>
              <li>Has the reply-to address changed?</li>
              <li>Are payment details different from previous invoices?</li>
              <li>Is a real thread being used for an unusual request?</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section
        id="comparison"
        number="7"
        title="Safe email vs phishing email"
        intro="No single sign proves an email is safe, but these patterns are useful."
      >
        <div className="comparison-table">
          <div className="comparison-column comparison-column--safe">
            <h3>Usually safer</h3>
            <ul>
              <li>Sender domain matches the organisation.</li>
              <li>The message gives clear context.</li>
              <li>No pressure to act immediately.</li>
              <li>No request for passwords, codes, or payment details.</li>
            </ul>
          </div>

          <div className="comparison-column comparison-column--risk">
            <h3>Higher risk</h3>
            <ul>
              <li>Sender domain is unrelated or misspelled.</li>
              <li>The email uses fear, urgency, or rewards.</li>
              <li>It asks for passwords, codes, or bank details.</li>
              <li>Links use odd domains, shorteners, or login bait.</li>
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}

export default SafetyChecksSections;
