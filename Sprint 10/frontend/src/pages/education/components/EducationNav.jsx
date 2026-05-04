// frontend/src/pages/education/components/EducationNav.jsx

import React, { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "#types",       label: "Types"       },
  { href: "#basics",      label: "Basics"      },
  { href: "#system",      label: "System"      },
  { href: "#anatomy",     label: "Anatomy"     },
  { href: "#warning-signs", label: "Warnings"  },
  { href: "#scenarios",   label: "Scenarios"   },
  { href: "#protection",  label: "Protection"  },
  { href: "#checks",      label: "Checks"      },
  { href: "#comparison",  label: "Comparison"  },
  { href: "#actions",     label: "Actions"     },
  { href: "#report",      label: "Report"      },
  { href: "#myths",       label: "Myths"       },
  { href: "#quiz",        label: "Quiz"        },
  { href: "#limitations", label: "Limitations" },
  { href: "#resources",   label: "Resources"   },
];

function EducationNav() {
  const [activeId, setActiveId] = useState("");

  // Highlights the nav link for whichever section is currently in view.
  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.href.slice(1));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      // Trigger when a section crosses the upper third of the viewport.
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="education-nav" aria-label="Education sections">
      {NAV_ITEMS.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          className={activeId === href.slice(1) ? "education-nav-link--active" : ""}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

export default EducationNav;
