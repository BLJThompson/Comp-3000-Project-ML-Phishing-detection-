import React, { useState } from "react";
import QuizOverlay from "./QuizOverlay.jsx";
import { getRandomQuestions } from "../data/quizQuestions.js";

function QuizLauncher() {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState(() => getRandomQuestions());
  const [answers, setAnswers] = useState({});

  function startQuiz() {
    setQuestions(getRandomQuestions());
    setAnswers({});
    setOpen(true);
  }

  function restartQuiz() {
    setQuestions(getRandomQuestions());
    setAnswers({});
  }

  function handleAnswer(questionIndex, optionIndex) {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: optionIndex,
    }));
  }

  return (
    <div className="quiz-launch-card">
      <div>
        <h3>Mini quiz</h3>
        <p>
          Start a short quiz with three random questions. The questions become
          more challenging as you progress, but the difficulty level is not shown.
        </p>
      </div>

      <button type="button" className="quiz-start-btn" onClick={startQuiz}>
        Start quiz
      </button>

      {open && (
        <QuizOverlay
          questions={questions}
          answers={answers}
          onAnswer={handleAnswer}
          onClose={() => setOpen(false)}
          onRestart={restartQuiz}
        />
      )}
    </div>
  );
}

export default QuizLauncher;
