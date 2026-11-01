import React, { useEffect, useState } from 'react';
import curriculumService from '../../services/curriculumService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function StudentCurriculum() {
  const [grade, setGrade] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState(null); // null = not loaded, [] = loaded empty
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await curriculumService.getSubjects();
        if (mounted) {
          setGrade(data.grade);
          setSubjects(data.subjects);
        }
      } catch (err) {
        if (mounted) setError(err.friendlyMessage);
      } finally {
        if (mounted) setIsLoadingSubjects(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openSubject = async (subject) => {
    setSelectedSubject(subject);
    setChapters(null);
    setIsLoadingChapters(true);
    setError(null);
    try {
      const data = await curriculumService.getChapters(subject._id);
      setChapters(data.chapters);
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  return (
    <div>
      <span className="eyebrow">Curriculum</span>
      <h2>{grade ? `${grade} curriculum` : 'Your curriculum'}</h2>
      <p>Pick a subject to see its chapters.</p>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {isLoadingSubjects ? (
        <LoadingSpinner label="Loading your subjects…" />
      ) : subjects.length === 0 ? (
        <div className="empty-state">
          <h4>No curriculum available yet</h4>
          <p style={{ margin: 0 }}>Your grade's curriculum hasn't been added yet. Check back soon.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {subjects.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => openSubject(s)}
              className="card"
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                border: selectedSubject?._id === s._id ? '2px solid var(--route)' : '1px solid var(--line)',
              }}
            >
              <h4 style={{ marginBottom: 0 }}>{s.name}</h4>
            </button>
          ))}
        </div>
      )}

      {selectedSubject && (
        <section>
          <h3>{selectedSubject.name} — chapters</h3>
          {isLoadingChapters ? (
            <LoadingSpinner label="Loading chapters…" size={22} />
          ) : chapters && chapters.length === 0 ? (
            <div className="empty-state">
              <h4>No chapters listed yet</h4>
              <p style={{ margin: 0 }}>Chapters for this subject haven't been added yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {chapters &&
                chapters.map((c) => (
                  <div
                    key={c._id}
                    className="card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-4) var(--space-5)',
                      opacity: c.hasContent ? 1 : 0.75,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    {c.hasContent ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--route-dark)', fontWeight: 600 }}>Available</span>
                    ) : (
                      <span
                        className="mono"
                        style={{
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: 'var(--slate-light)',
                          border: '1px solid var(--line-strong)',
                          borderRadius: 999,
                          padding: '0.2rem 0.6rem',
                        }}
                      >
                        Coming soon
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
