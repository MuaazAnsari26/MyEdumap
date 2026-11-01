import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import curriculumService from '../../services/curriculumService';
import quizService from '../../services/quizService';
import assignmentService from '../../services/assignmentService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COUNT_OPTIONS = [5, 10, 15].map((n) => ({ value: String(n), label: `${n} questions` }));

export default function StudentQuizzes() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState('5');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const [attempts, setAttempts] = useState(null);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);

  const [assignments, setAssignments] = useState(null);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    curriculumService
      .getSubjects()
      .then((data) => setSubjects(data.subjects))
      .catch((err) => setGenerateError(err.friendlyMessage))
      .finally(() => setIsLoadingSubjects(false));

    quizService
      .listAttempts()
      .then(setAttempts)
      .catch(() => setAttempts([]))
      .finally(() => setIsLoadingAttempts(false));

    assignmentService
      .listMyAssignments()
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setIsLoadingAssignments(false));
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setChapters([]);
      setChapterId('');
      return;
    }
    curriculumService.getChapters(subjectId).then((data) => setChapters(data.chapters));
  }, [subjectId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerateError(null);

    if (!subjectId) {
      setGenerateError('Please select a subject.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await quizService.generateQuiz({
        subjectId,
        chapterId: chapterId || undefined,
        numberOfQuestions: Number(numberOfQuestions),
      });
      navigate(`/student/quizzes/${res.data.quizId}/attempt`);
    } catch (err) {
      setGenerateError(err.friendlyMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <span className="eyebrow">Quizzes</span>
      <h2>Assigned by your teacher</h2>
      {isLoadingAssignments ? (
        <LoadingSpinner label="Loading assigned quizzes…" size={22} />
      ) : assignments && assignments.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 'var(--space-8)' }}>
          <h4>No quizzes assigned yet</h4>
          <p style={{ margin: 0 }}>Quizzes your teacher assigns to you will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          {assignments &&
            assignments.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() =>
                  navigate(
                    a.status === 'completed'
                      ? `/student/quizzes/assigned/${a._id}/result`
                      : `/student/quizzes/assigned/${a._id}/attempt`
                  )
                }
                className="card"
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{a.quizTitle}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)' }}>
                    From {a.teacher?.name} · {a.totalQuestions} questions
                  </div>
                </div>
                {a.status === 'completed' ? (
                  <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: a.result?.percentage >= 60 ? 'var(--route-dark)' : 'var(--brick)' }}>
                    {a.result?.percentage}%
                  </div>
                ) : (
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      color: 'var(--marigold-dark)',
                      border: '1px solid #e8d29b',
                      background: 'var(--marigold-light)',
                      borderRadius: 999,
                      padding: '0.2rem 0.6rem',
                    }}
                  >
                    Pending
                  </span>
                )}
              </button>
            ))}
        </div>
      )}

      <h2>Practice quizzes</h2>

      <div className="card" style={{ maxWidth: 520, margin: '0 auto var(--space-8)' }}>
        <h4>Generate a new quiz</h4>
        {generateError && (
          <div className="alert alert-error" role="alert">
            {generateError}
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Button size="sm" variant="outline" onClick={handleGenerate} isLoading={isGenerating}>
                Retry
              </Button>
            </div>
          </div>
        )}
        {isLoadingSubjects ? (
          <LoadingSpinner label="Loading subjects…" size={22} />
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <h4>No curriculum available for your grade yet</h4>
            <p style={{ margin: 0 }}>
              Subjects haven't been added for your grade yet, so quizzes can't be generated right now. Check back
              soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleGenerate} noValidate>
            <FormField
              label="Subject"
              id="subjectId"
              as="select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={[{ value: '', label: 'Select a subject' }, ...subjects.map((s) => ({ value: s._id, label: s.name }))]}
            />
            <FormField
              label="Chapter (optional)"
              id="chapterId"
              as="select"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              disabled={!subjectId}
              options={[{ value: '', label: 'Whole subject' }, ...chapters.map((c) => ({ value: c._id, label: c.name }))]}
            />
            <FormField
              label="Number of questions"
              id="numberOfQuestions"
              as="select"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(e.target.value)}
              options={COUNT_OPTIONS}
            />
            <Button type="submit" isLoading={isGenerating} block>
              Generate quiz
            </Button>
          </form>
        )}
      </div>

      <h3>Your quiz history</h3>
      {isLoadingAttempts ? (
        <LoadingSpinner label="Loading history…" size={22} />
      ) : attempts && attempts.length === 0 ? (
        <div className="empty-state">
          <h4>No quizzes attempted yet</h4>
          <p style={{ margin: 0 }}>Generate your first quiz above to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {attempts &&
            attempts.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => navigate(`/student/quizzes/results/${a._id}`)}
                className="card"
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {a.subject?.name}
                    {a.chapter ? ` · ${a.chapter.name}` : ''}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)' }}>
                    {new Date(a.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: a.percentage >= 60 ? 'var(--route-dark)' : 'var(--brick)',
                  }}
                >
                  {a.percentage}%
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
