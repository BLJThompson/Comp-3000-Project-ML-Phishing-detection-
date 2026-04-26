import React from "react";

function EducationHero() {
  return (
    <header className="education-hero">
      <div>
        <span className="education-pill">Phishing awareness</span>
        <h1>Learn how to review suspicious emails safely</h1>
        <p>
          A short guide to phishing warning signs, safe checking habits, UK
          reporting routes, and what to do if a mistake has already happened.
        </p>
      </div>

      <div className="education-hero-card">
        <strong>Golden rule</strong>
        <p>
          Do not trust pressure. Check the sender, link, request, and context
          before clicking, replying, downloading, or sharing details.
        </p>
      </div>
    </header>
  );
}

export default EducationHero;
