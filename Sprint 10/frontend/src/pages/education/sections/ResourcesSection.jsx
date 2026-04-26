import React from "react";

function ResourcesSection() {
  return (
    <section className="education-section">
      <div className="education-section-heading">
        <span className="education-section-number">13</span>
        <div>
          <h2>Trusted resources</h2>
          <p>Useful official guidance for further reading.</p>
        </div>
      </div>

      <div className="resource-grid">
        <a
          href="https://www.ncsc.gov.uk/collection/phishing-scams"
          target="_blank"
          rel="noreferrer"
        >
          NCSC phishing guidance
        </a>
        <a
          href="https://www.gov.uk/report-suspicious-emails-websites-phishing"
          target="_blank"
          rel="noreferrer"
        >
          GOV.UK report phishing
        </a>
        <a
          href="https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams"
          target="_blank"
          rel="noreferrer"
        >
          FTC phishing advice
        </a>
        <a
          href="https://www.cisa.gov/secure-our-world/recognize-and-report-phishing"
          target="_blank"
          rel="noreferrer"
        >
          CISA recognise and report phishing
        </a>
      </div>
    </section>
  );
}

export default ResourcesSection;
