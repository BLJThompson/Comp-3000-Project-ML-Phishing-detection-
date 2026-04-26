import React, { useState } from "react";

function WarningCard({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      className={
        "education-reveal-card" + (open ? " education-reveal-card--open" : "")
      }
      onClick={() => setOpen((current) => !current)}
    >
      <div className="education-reveal-top">
        <span>{item.title}</span>
        <strong>{open ? "Hide" : "Reveal"}</strong>
      </div>
      <p className="education-example">“{item.example}”</p>
      {open && <p className="education-explanation">{item.explanation}</p>}
    </button>
  );
}

export default WarningCard;
