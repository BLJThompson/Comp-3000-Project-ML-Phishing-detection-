import React from "react";

const navItems = [
  { href: "#basics", label: "Basics" },
  { href: "#system", label: "System" },
  { href: "#anatomy", label: "Anatomy" },
  { href: "#scenarios", label: "Scenarios" },
  { href: "#checks", label: "Checks" },
  { href: "#actions", label: "Actions" },
  { href: "#myths", label: "Myths" },
  { href: "#quiz", label: "Quiz" },
];

function EducationNav() {
  return (
    <nav className="education-nav" aria-label="Education sections">
      {navItems.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export default EducationNav;
