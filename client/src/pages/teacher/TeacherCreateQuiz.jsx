import React, { useEffect, useState } from 'react';
import curriculumService from '../../services/curriculumService';
import teacherQuizService from '../../services/teacherQuizService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AssignRecipientsForm from '../../components/quiz/AssignRecipientsForm';

const GRADE_OPTIONS = [
  { value: '10th CBSE', label: '10th CBSE' },
  { value: '12th CBSE', label: '12th CBSE' },
];

function ModeTabs({ mode, setMode }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--line)' }}>
      {[
        { key: 'generate', label: 'Generate quiz' },
        { key: 'custom', label: 'Build custom quiz' },
      ].map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setMode(t.key)}
          style={{
            padding: '0.7rem 1.1rem',
            background: 'none',
            border: 'none',
            borderBottom: mode === t.key ? '2px solid var(--route)' : '2px solid transparent',
            color: mode === t.key ? 'var(--route-dark)' : 'var(--slate)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Mode A: bulk generation ----------
function GenerateQuizMode({ onCreated }) {
  const [grade, setGrade] = useState('10th CBSE');
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState('10');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { teacherQuiz, questions }

  useEffect(() => {
    curriculumService.getSubjects(grade).then((data) => setSubjects(data.subjects));
    setSubjectId('');
    setChapters([]);
  }, [grade]);

  useEffect(() => {
    if (!subjectId) {
      setChapters([]);
      return;
    }
    curriculumService.getChapters(subjectId).then((data) => setChapters(data.chapters));
  }, [subjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError('Quiz title is required.');
    if (!subjectId) return setError('Please select a subject.');

    setIsGenerating(true);
    try {
      const res = await teacherQuizService.generateQuiz({
        title: title.trim(),
        subjectId,
        chapterId: chapterId || undefined,
        numberOfQuestions: Number(numberOfQuestions),
      });
      setResult(res.data);
      if (onCreated) onCreated();
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (result) {
    return (
      <div>
        <div className="alert alert-success" role="status">
          "{result.teacherQuiz.title}" created with {result.teacherQuiz.totalQuestions} question(s).
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {result.questions.map((q, idx) => (
            <div key={q._id} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)' }}>Question {idx + 1}</div>
              <div style={{ fontWeight: 500 }}>{q.questionText}</div>
            </div>
          ))}
        </div>
        <h4>Assign this quiz</h4>
        <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <AssignRecipientsForm
            teacherQuizId={result.teacherQuiz._id}
            quizGrade={result.teacherQuiz.grade}
            onAssigned={() => {
              // Give the success message inside AssignRecipientsForm a
              // moment to be seen before returning to a blank form —
              // an immediate reset would yank the confirmation away.
              setTimeout(() => setResult(null), 1500);
            }}
          />
        </div>
        <Button variant="outline" style={{ marginTop: 'var(--space-5)' }} onClick={() => setResult(null)}>
          Create another quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Quiz title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Electrostatics Chapter Test" />
        <FormField label="Grade" id="grade" as="select" value={grade} onChange={(e) => setGrade(e.target.value)} options={GRADE_OPTIONS} />
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
          label="Number of questions (max 30)"
          id="numberOfQuestions"
          type="number"
          min="1"
          max="30"
          value={numberOfQuestions}
          onChange={(e) => setNumberOfQuestions(e.target.value)}
        />
        <Button type="submit" isLoading={isGenerating} block>
          Generate quiz
        </Button>
      </form>
    </div>
  );
}

// ---------- Mode B: setup once, then build questions ----------
const ALL = '__ALL__';
let rowIdCounter = 0;
const nextRowId = () => {
  rowIdCounter += 1;
  return rowIdCounter;
};

function makeEmptyRow() {
  return {
    id: nextRowId(),
    subjectId: '', // only used when top-level subject is ALL
    chapterId: '', // only used when a per-row chapter choice is needed
    rowChapters: [], // chapters for this row's own subject choice (ALL-subject case)
    topic: '',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: null,
    explanation: '',
    isGenerating: false,
    genError: null,
  };
}

function CustomQuizMode({ onCreated }) {
  const [step, setStep] = useState('setup'); // 'setup' | 'build'

  // ---- Setup step state ----
  const [grade, setGrade] = useState('10th CBSE');
  const [subjects, setSubjects] = useState([]);
  const [topSubjectId, setTopSubjectId] = useState(''); // '', a real id, or ALL
  const [topChapters, setTopChapters] = useState([]); // chapters of topSubjectId, when it's a real id
  const [topChapterId, setTopChapterId] = useState(''); // '', a real id, or ALL
  const [setupError, setSetupError] = useState(null);

  // ---- Build step state ----
  const [rows, setRows] = useState([]);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedQuiz, setSavedQuiz] = useState(null);

  useEffect(() => {
    curriculumService.getSubjects(grade).then((data) => setSubjects(data.subjects));
    setTopSubjectId('');
    setTopChapters([]);
    setTopChapterId('');
  }, [grade]);

  useEffect(() => {
    if (!topSubjectId || topSubjectId === ALL) {
      setTopChapters([]);
      setTopChapterId('');
      return;
    }
    curriculumService.getChapters(topSubjectId).then((data) => setTopChapters(data.chapters));
    setTopChapterId('');
  }, [topSubjectId]);

  // Whether each question needs its own subject/chapter pickers, based on
  // what was chosen once at setup time. This is the core of "don't ask
  // the same thing on every question" — only ambiguity that setup left
  // unresolved gets asked again per question.
  const needsRowSubject = topSubjectId === ALL;
  const needsRowChapter = topSubjectId === ALL || topChapterId === ALL;

  const handleStartBuilding = () => {
    setSetupError(null);
    if (!topSubjectId) return setSetupError('Please select a subject, or choose "All subjects".');
    if (topSubjectId !== ALL && !topChapterId) {
      return setSetupError('Please select a chapter, or choose "All chapters".');
    }
    setRows([makeEmptyRow()]);
    setStep('build');
  };

  const updateRow = (id, patch) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleRowSubjectChange = async (id, subjectId) => {
    updateRow(id, { subjectId, chapterId: '', rowChapters: [] });
    if (subjectId) {
      const data = await curriculumService.getChapters(subjectId);
      updateRow(id, { rowChapters: data.chapters });
    }
  };

  const updateRowOption = (id, idx, value) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, options: r.options.map((o, i) => (i === idx ? value : o)) } : r)));

  // Resolves the actual subject/chapter that will be saved for a given
  // row — either fixed from setup, or whatever the row itself chose.
  const resolveRowSubjectId = (row) => (needsRowSubject ? row.subjectId : topSubjectId);
  const resolveRowChapterId = (row) => (needsRowChapter ? row.chapterId : topChapterId === ALL ? '' : topChapterId);

  const handleAddRow = () => setRows((prev) => [...prev, makeEmptyRow()]);
  const handleRemoveRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const handleGenerateRow = async (row) => {
    const subjectId = resolveRowSubjectId(row);
    if (!subjectId) {
      updateRow(row.id, { genError: 'Select a subject for this question first.' });
      return;
    }
    const chapterId = resolveRowChapterId(row);
    if (needsRowChapter && !chapterId) {
      updateRow(row.id, { genError: 'Select a chapter for this question first.' });
      return;
    }

    updateRow(row.id, { isGenerating: true, genError: null });
    try {
      const question = await teacherQuizService.generateSingleQuestion({
        subjectId,
        chapterId: chapterId || undefined,
        topic: row.topic || undefined,
      });
      updateRow(row.id, {
        questionText: question.questionText,
        options: question.options,
        correctAnswerIndex: question.correctAnswerIndex,
        explanation: question.explanation,
        isGenerating: false,
      });
    } catch (err) {
      updateRow(row.id, { isGenerating: false, genError: err.friendlyMessage });
    }
  };

  const validateRows = () => {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const subjectId = resolveRowSubjectId(row);
      if (!subjectId) return `Question ${i + 1} needs a subject.`;
      if (needsRowChapter && !resolveRowChapterId(row)) return `Question ${i + 1} needs a chapter.`;
      if (!row.questionText.trim()) return `Question ${i + 1} needs question text.`;
      if (row.options.some((o) => !o.trim())) return `Question ${i + 1} needs all 4 options filled in.`;
      if (new Set(row.options.map((o) => o.trim().toLowerCase())).size !== 4) return `Question ${i + 1}'s options must be unique.`;
      if (row.correctAnswerIndex === null) return `Question ${i + 1} needs a correct answer selected.`;
      if (!row.explanation.trim()) return `Question ${i + 1} needs an explanation.`;
    }
    return null;
  };

  const handleSaveQuiz = async () => {
    setSaveError(null);
    if (!title.trim()) return setSaveError('Quiz title is required.');
    if (rows.length === 0) return setSaveError('Add at least one question before saving.');
    const rowError = validateRows();
    if (rowError) return setSaveError(rowError);

    setIsSaving(true);
    try {
      const quiz = await teacherQuizService.createCustomQuiz({
        title: title.trim(),
        grade,
        questions: rows.map((row) => ({
          subjectId: resolveRowSubjectId(row),
          chapterId: resolveRowChapterId(row) || undefined,
          topic: row.topic || undefined,
          questionText: row.questionText.trim(),
          options: row.options.map((o) => o.trim()),
          correctAnswerIndex: row.correctAnswerIndex,
          explanation: row.explanation.trim(),
        })),
      });
      setSavedQuiz(quiz);
      if (onCreated) onCreated();
    } catch (err) {
      setSaveError(err.friendlyMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToSetup = () => {
    setStep('setup');
    setGrade('10th CBSE');
    setTopSubjectId('');
    setTopChapters([]);
    setTopChapterId('');
    setRows([]);
    setTitle('');
    setSaveError(null);
    setSavedQuiz(null);
  };

  if (savedQuiz) {
    return (
      <div>
        <div className="alert alert-success" role="status">
          "{savedQuiz.title}" saved with {savedQuiz.totalQuestions} question(s).
        </div>
        <h4>Assign this quiz</h4>
        <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <AssignRecipientsForm
            teacherQuizId={savedQuiz._id}
            quizGrade={savedQuiz.grade}
            onAssigned={() => {
              // Same reasoning as Generate Quiz mode — let the confirmation
              // be seen, then return all the way to the setup step, since
              // that's "the start" of custom quiz building.
              setTimeout(resetToSetup, 1500);
            }}
          />
        </div>
        <Button variant="outline" style={{ marginTop: 'var(--space-5)' }} onClick={resetToSetup}>
          Build another quiz
        </Button>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h4>Set up your custom quiz</h4>
        <p style={{ fontSize: '0.88rem' }}>
          Choose the scope once here. If you pick a specific subject and chapter, every question uses that
          automatically — you'll only be asked again per question if you leave something open-ended.
        </p>
        {setupError && <div className="alert alert-error" role="alert">{setupError}</div>}
        <FormField label="Grade" id="setupGrade" as="select" value={grade} onChange={(e) => setGrade(e.target.value)} options={GRADE_OPTIONS} />
        <FormField
          label="Subject"
          id="setupSubject"
          as="select"
          value={topSubjectId}
          onChange={(e) => setTopSubjectId(e.target.value)}
          options={[
            { value: '', label: 'Select a subject' },
            { value: ALL, label: 'All subjects (choose per question)' },
            ...subjects.map((s) => ({ value: s._id, label: s.name })),
          ]}
        />
        {topSubjectId && topSubjectId !== ALL && (
          <FormField
            label="Chapter"
            id="setupChapter"
            as="select"
            value={topChapterId}
            onChange={(e) => setTopChapterId(e.target.value)}
            options={[
              { value: '', label: 'Select a chapter' },
              { value: ALL, label: 'All chapters (choose per question)' },
              ...topChapters.map((c) => ({ value: c._id, label: c.name })),
            ]}
          />
        )}
        <Button onClick={handleStartBuilding} block>
          Start building questions
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div className="card" style={{ background: 'var(--paper-alt)', fontSize: '0.85rem', margin: 0, flex: 1 }}>
          <strong>{grade}</strong> · {topSubjectId === ALL ? 'All subjects' : subjects.find((s) => s._id === topSubjectId)?.name}
          {topSubjectId !== ALL && topChapterId !== ALL && topChapters.find((c) => c._id === topChapterId)
            ? ` · ${topChapters.find((c) => c._id === topChapterId).name}`
            : topSubjectId !== ALL && topChapterId === ALL
            ? ' · All chapters'
            : ''}
        </div>
        <Button variant="outline" size="sm" onClick={() => setStep('setup')}>
          ← Back to setup
        </Button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {rows.map((row, idx) => (
          <div key={row.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <span className="eyebrow" style={{ margin: 0 }}>
                Question {idx + 1}
              </span>
              <Button size="sm" variant="outline" onClick={() => handleRemoveRow(row.id)}>
                Remove
              </Button>
            </div>

            {row.genError && <div className="alert alert-error" role="alert">{row.genError}</div>}

            {needsRowSubject && (
              <FormField
                label="Subject"
                id={`row-subject-${row.id}`}
                as="select"
                value={row.subjectId}
                onChange={(e) => handleRowSubjectChange(row.id, e.target.value)}
                options={[{ value: '', label: 'Select a subject' }, ...subjects.map((s) => ({ value: s._id, label: s.name }))]}
              />
            )}
            {needsRowChapter && (
              <FormField
                label="Chapter"
                id={`row-chapter-${row.id}`}
                as="select"
                value={row.chapterId}
                onChange={(e) => updateRow(row.id, { chapterId: e.target.value })}
                disabled={needsRowSubject && !row.subjectId}
                options={[
                  { value: '', label: 'Select a chapter' },
                  ...(needsRowSubject ? row.rowChapters : topChapters).map((c) => ({ value: c._id, label: c.name })),
                ]}
              />
            )}
            {!needsRowSubject && !needsRowChapter && (
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-light)', marginBottom: 'var(--space-4)' }}>
                Tagged automatically from your quiz setup above.
              </p>
            )}

            <FormField
              label="Topic (optional)"
              id={`row-topic-${row.id}`}
              value={row.topic}
              onChange={(e) => updateRow(row.id, { topic: e.target.value })}
              placeholder="e.g. Ohm's Law"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateRow(row)}
              isLoading={row.isGenerating}
              style={{ marginBottom: 'var(--space-5)' }}
            >
              Generate with AI
            </Button>

            <div className="field">
              <label htmlFor={`row-text-${row.id}`}>Question</label>
              <input
                id={`row-text-${row.id}`}
                value={row.questionText}
                onChange={(e) => updateRow(row.id, { questionText: e.target.value })}
                placeholder="Type the question, or generate one with AI above"
              />
            </div>

            {row.options.map((opt, optIdx) => (
              <div className="field" key={optIdx}>
                <label htmlFor={`row-${row.id}-opt-${optIdx}`}>Option {optIdx + 1}</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    id={`row-${row.id}-opt-${optIdx}`}
                    value={opt}
                    onChange={(e) => updateRowOption(row.id, optIdx, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    <input
                      type="radio"
                      name={`correct-${row.id}`}
                      checked={row.correctAnswerIndex === optIdx}
                      onChange={() => updateRow(row.id, { correctAnswerIndex: optIdx })}
                    />
                    Correct
                  </label>
                </div>
              </div>
            ))}

            <div className="field">
              <label htmlFor={`row-explanation-${row.id}`}>Explanation</label>
              <input
                id={`row-explanation-${row.id}`}
                value={row.explanation}
                onChange={(e) => updateRow(row.id, { explanation: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={handleAddRow} style={{ marginBottom: 'var(--space-6)' }}>
        Add another question
      </Button>

      <div className="card" style={{ maxWidth: 480 }}>
        <h4>Save quiz</h4>
        {saveError && <div className="alert alert-error" role="alert">{saveError}</div>}
        <FormField label="Quiz title" id="customTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mixed Revision Quiz" />
        <Button onClick={handleSaveQuiz} isLoading={isSaving} disabled={rows.length === 0} block>
          Save quiz ({rows.length} question{rows.length === 1 ? '' : 's'})
        </Button>
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function TeacherCreateQuiz() {
  const [mode, setMode] = useState('generate');
  const [myQuizzes, setMyQuizzes] = useState(null);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState(null);

  const loadQuizzes = () => {
    setIsLoadingQuizzes(true);
    teacherQuizService
      .listMyQuizzes()
      .then(setMyQuizzes)
      .catch(() => setMyQuizzes([]))
      .finally(() => setIsLoadingQuizzes(false));
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  return (
    <div>
      <span className="eyebrow">Create quiz</span>
      <h2>Build a quiz for your students</h2>

      <ModeTabs mode={mode} setMode={setMode} />

      {mode === 'generate' ? <GenerateQuizMode onCreated={loadQuizzes} /> : <CustomQuizMode onCreated={loadQuizzes} />}

      <h3 style={{ marginTop: 'var(--space-9)' }}>Your quizzes</h3>
      {isLoadingQuizzes ? (
        <LoadingSpinner label="Loading your quizzes…" size={22} />
      ) : myQuizzes && myQuizzes.length === 0 ? (
        <div className="empty-state">
          <h4>You haven't created a quiz yet</h4>
          <p style={{ margin: 0 }}>Use the form above to create your first one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {myQuizzes &&
            myQuizzes.map((q) => (
              <div key={q._id} className="card">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: 'var(--space-3)' }}
                  onClick={() => setExpandedQuizId(expandedQuizId === q._id ? null : q._id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedQuizId === q._id}
                  aria-label={`${q.title}, ${expandedQuizId === q._id ? 'expanded' : 'collapsed'}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedQuizId(expandedQuizId === q._id ? null : q._id);
                    }
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{q.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)' }}>
                      {q.grade} · {q.mode === 'generated' ? q.subject?.name : 'Custom mix'}
                      {q.chapter ? ` · ${q.chapter.name}` : ''} · {q.totalQuestions} questions
                    </div>
                  </div>
                  <span aria-hidden="true">{expandedQuizId === q._id ? '▲' : '▼'}</span>
                </div>
                {expandedQuizId === q._id && (
                  <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--line)', paddingTop: 'var(--space-5)' }}>
                    <AssignRecipientsForm
                      teacherQuizId={q._id}
                      quizGrade={q.grade}
                      onAssigned={() => setTimeout(() => setExpandedQuizId(null), 1500)}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
