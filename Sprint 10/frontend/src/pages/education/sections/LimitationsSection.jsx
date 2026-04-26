import React from "react";
import Section from "../components/Section.jsx";

function LimitationsSection() {
  return (
    <Section
      id="limitations"
      number="12"
      title="System limitations"
      intro="The system supports judgement, but it does not replace it."
    >
      <div className="education-card">
        <p>
          This prototype can help identify suspicious emails, but it cannot
          guarantee perfect detection. Some phishing emails may avoid obvious
          warning signs, and some benign emails may still appear unusual.
        </p>
        <p>
          The machine learning model provides classification, while highlighted
          indicators support explanation. Users should still check suspicious
          messages carefully and follow safe reporting practices.
        </p>
      </div>
    </Section>
  );
}

export default LimitationsSection;
