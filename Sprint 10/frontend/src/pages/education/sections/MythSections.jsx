import React from "react";
import Section from "../components/Section.jsx";
import { myths } from "../data/myths.js";

function MythSections() {
  return (
    <Section
      id="myths"
      number="10"
      title="Myths about phishing"
      intro="These misconceptions can make users overconfident."
    >
      <div className="myth-grid">
        {myths.map((item) => (
          <div key={item.myth} className="myth-card">
            <h3>Myth: {item.myth}</h3>
            <p>Reality: {item.reality}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default MythSections;
