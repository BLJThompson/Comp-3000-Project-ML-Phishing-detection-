import React from "react";
import Section from "../components/Section.jsx";
import QuizLauncher from "../components/QuizLauncher.jsx";

function QuizSection() {
  return (
    <Section
      id="quiz"
      number="11"
      title="Mini quiz"
      intro="A short interactive quiz to practise applying the guidance."
    >
      <QuizLauncher />
    </Section>
  );
}

export default QuizSection;
