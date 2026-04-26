import React from "react";
import Section from "../components/Section.jsx";
import { scenarios } from "../data/scenarios.js";

function ScenarioSections() {
  return (
    <Section
      id="scenarios"
      number="5"
      title="Common phishing scenarios"
      intro="Phishing often appears in familiar forms. These are examples users may recognise."
    >
      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <div key={scenario.title} className="scenario-card">
            <h3>{scenario.title}</h3>
            <p>{scenario.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default ScenarioSections;
