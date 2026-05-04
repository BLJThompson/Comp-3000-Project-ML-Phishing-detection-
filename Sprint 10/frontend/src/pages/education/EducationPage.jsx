// frontend/src/pages/education/EducationPage.jsx

import React from "react";
import EducationHero from "./components/EducationHero.jsx";
import EducationNav  from "./components/EducationNav.jsx";
import BasicsSections       from "./sections/BasicsSections.jsx";
import AnatomySections      from "./sections/AnatomySections.jsx";
import SafetyChecksSections from "./sections/SafetyChecksSections.jsx";
import ActionSections       from "./sections/ActionSections.jsx";
import {
  PhishingTypesSection,
  ScenarioSections,
  ProtectionSection,
  MythSections,
  QuizSection,
  LimitationsSection,
  ResourcesSection,
} from "./sections/ContentSections.jsx";
import "./Education.css";

function EducationPage() {
  return (
    <div className="education-page">
      <EducationHero />
      <EducationNav />

      <PhishingTypesSection />
      <BasicsSections />
      <AnatomySections />
      <ScenarioSections />
      <ProtectionSection />
      <SafetyChecksSections />
      <ActionSections />
      <MythSections />
      <QuizSection />
      <LimitationsSection />
      <ResourcesSection />
    </div>
  );
}

export default EducationPage;
