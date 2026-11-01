import React, { useState } from 'react';
import Button from '../common/Button';

// Presentational + self-contained interaction (progress, next/prev,
// answer selection) — the container page only needs to supply the
// questions and an onSubmit callback that does the actual API call and
// navigation. Keeps the practice-quiz and assigned-quiz pages from
// duplicating this entire UI.
export default function QuizTakingView({ title, questions, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = questions.map((q) => ({
        questionId: q._id,
        selectedOptionIndex: answers[q._id] ?? null,
      }));
      await onSubmit(payload);
    } catch (err) {
      setError(err.friendlyMessage || 'Something went wrong submitting your quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const question = questions[currentIndex];
  const totalAnswered = Object.keys(answers).length;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {title && <h3 style={{ marginBottom: 'var(--space-4)' }}>{title}</h3>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <span className="eyebrow" style={{ margin: 0 }}>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>{totalAnswered} answered</span>
      </div>

      <div style={{ height: 6, background: 'var(--line)', borderRadius: 999, marginBottom: 'var(--space-7)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
            background: 'var(--route)',
            transition: 'width 0.2s ease',
          }}
        />
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-5)' }}>{question.questionText}</h3>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {question.options.map((opt, idx) => {
            const isSelected = answers[question._id] === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(question._id, idx)}
                style={{
                  textAlign: 'left',
                  padding: 'var(--space-4) var(--space-5)',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--route)' : '1px solid var(--line-strong)',
                  background: isSelected ? 'var(--route-light)' : '#fff',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  color: 'var(--ink)',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
          Previous
        </Button>

        {isLast ? (
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Submit quiz
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>Next</Button>
        )}
      </div>
    </div>
  );
}
