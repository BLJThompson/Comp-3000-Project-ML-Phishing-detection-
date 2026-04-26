import React from "react";
import EducationHero from "./components/EducationHero.jsx";
import EducationNav from "./components/EducationNav.jsx";
import BasicsSections from "./sections/BasicsSections.jsx";
import AnatomySections from "./sections/AnatomySections.jsx";
import ScenarioSections from "./sections/ScenarioSections.jsx";
import SafetyChecksSections from "./sections/SafetyChecksSections.jsx";
import ActionSections from "./sections/ActionSections.jsx";
import MythSections from "./sections/MythSections.jsx";
import QuizSection from "./sections/QuizSection.jsx";
import LimitationsSection from "./sections/LimitationsSection.jsx";
import ResourcesSection from "./sections/ResourcesSection.jsx";
import "./Education.css";

function EducationPage() {
  return (
    <div className="education-page">
      <EducationHero />
      <EducationNav />

      <BasicsSections />
      <AnatomySections />
      <ScenarioSections />
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
