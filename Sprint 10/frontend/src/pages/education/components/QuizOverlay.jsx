import React, { useMemo } from "react";

function QuizOverlay({ questions, answers, onAnswer, onClose, onRestart }) {
  const score = useMemo(() => {
    return questions.reduce((total, question, index) => {
      return total + (answers[index] === question.answer ? 1 : 0);
    }, 0);
  }, [answers, questions]);

  const answeredCount = Object.keys(answers).length;
  const complete = answeredCount === questions.length;

  return (
    <div
      className="quiz-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Phishing quiz"
    >
      <div className="quiz-toast">
        <div className="quiz-toast-header">
          <div>
            <span className="education-pill">Mini quiz</span>
            <h3>Spot the phishing risk</h3>
            <p>Answer three questions. They become harder as you progress.</p>
          </div>

          <button
            type="button"
            className="quiz-close-btn"
            onClick={onClose}
            aria-label="Close quiz"
          >
            ×
          </button>
        </div>

        <div className="quiz-progress-row">
          <span>
            Answered {answeredCount}/{questions.length}
          </span>
          <strong>
            Score {score}/{questions.length}
          </strong>
        </div>

        <div className="quiz-questions">
          {questions.map((question, index) => {
            const selected = answers[index];
            const answered = selected !== undefined;
            const isCorrect = selected === question.answer;

            return (
              <div key={question.question} className="quiz-question">
                <h4>
                  {index + 1}. {question.question}
                </h4>

                <div className="quiz-options">
                  {question.options.map((option, optionIndex) => {
                    const selectedOption = selected === optionIndex;

                    return (
                      <button
                        type="button"
                        key={option.text}
                        className={
                          "quiz-option" +
                          (selectedOption ? " quiz-option--selected" : "") +
                          (answered && optionIndex === question.answer
                            ? " quiz-option--correct"
                            : "") +
                          (answered && selectedOption && !isCorrect
                            ? " quiz-option--incorrect"
                            : "")
                        }
                        onClick={() => onAnswer(index, optionIndex)}
                      >
                        {option.text}
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <p
                    className={
                      "quiz-feedback" +
                      (isCorrect
                        ? " quiz-feedback--correct"
                        : " quiz-feedback--incorrect")
                    }
                  >
                    {question.options[selected]?.feedback}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {complete && (
          <div className="quiz-complete">
            <strong>
              {score === questions.length ? "Excellent result." : "Quiz complete."}
            </strong>
            <span>
              {" "}
              You scored {score}/{questions.length}. You can restart to get a
              new set.
            </span>
          </div>
        )}

        <div className="quiz-toast-actions">
          <button type="button" className="quiz-secondary-btn" onClick={onRestart}>
            Restart
          </button>
          <button type="button" className="quiz-primary-btn" onClick={onClose}>
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizOverlay;
