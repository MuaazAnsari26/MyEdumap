import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

export default function QuizResultView({ heading, subheading, result, backLink }) {
  const isPass = result.percentage >= 60;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <span className="eyebrow">Quiz results</span>
      {heading && <h2>{heading}</h2>}
      {subheading && <p>{subheading}</p>}

      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
          background: isPass ? 'var(--route-light)' : 'var(--brick-light)',
          border: `1px solid ${isPass ? '#bcdac9' : '#e7bdb8'}`,
        }}
      >
        <div className="mono" style={{ fontSize: '2.5rem', fontWeight: 700, color: isPass ? 'var(--route-dark)' : 'var(--brick)' }}>
          {result.percentage}%
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>
            {result.score} out of {result.totalQuestions} correct
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>Submitted {new Date(result.submittedAt).toLocaleString()}</div>
        </div>
      </div>

      <h3>Question breakdown</h3>
      <div style={{ display: 'grid', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {result.answers.map((a, idx) => (
          <div key={a.questionId} className="card" style={{ borderLeft: `4px solid ${a.isCorrect ? 'var(--route)' : 'var(--brick)'}` }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)', marginBottom: 'var(--space-2)' }}>Question {idx + 1}</div>
            <h4 style={{ marginBottom: 'var(--space-4)' }}>{a.questionText}</h4>

            <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              {a.options.map((opt, optIdx) => {
                const isYourAnswer = a.selectedOptionIndex === optIdx;
                const isCorrectAnswer = a.correctAnswerIndex === optIdx;
                let style = { border: '1px solid var(--line-strong)', background: '#fff' };
                if (isCorrectAnswer) {
                  style = { border: '1px solid var(--route)', background: 'var(--route-light)' };
                } else if (isYourAnswer && !a.isCorrect) {
                  style = { border: '1px solid var(--brick)', background: 'var(--brick-light)' };
                }
                return (
                  <div
                    key={optIdx}
                    style={{ ...style, padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{opt}</span>
                    {isCorrectAnswer && <span style={{ fontSize: '0.75rem', color: 'var(--route-dark)', fontWeight: 600 }}>Correct answer</span>}
                    {isYourAnswer && !isCorrectAnswer && <span style={{ fontSize: '0.75rem', color: 'var(--brick)', fontWeight: 600 }}>Your answer</span>}
                  </div>
                );
              })}
              {a.selectedOptionIndex === null && (
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)', fontStyle: 'italic' }}>You left this question unanswered.</div>
              )}
            </div>

            {!a.isCorrect && (
              <div style={{ fontSize: '0.88rem', color: 'var(--slate)', background: 'var(--paper-alt)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: 'var(--ink-soft)' }}>Explanation: </strong>
                {a.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {backLink && (
        <Link to={backLink.to}>
          <Button variant="primary">{backLink.label}</Button>
        </Link>
      )}
    </div>
  );
}
