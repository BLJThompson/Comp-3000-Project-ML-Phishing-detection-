import React from "react";

function Section({ id, number, title, intro, children }) {
  return (
    <section id={id} className="education-section">
      <div className="education-section-heading">
        <span className="education-section-number">{number}</span>
        <div>
          <h2>{title}</h2>
          {intro && <p>{intro}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default Section;
