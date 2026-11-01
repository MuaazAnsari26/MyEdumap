import React, { useEffect, useState } from 'react';
import curriculumService from '../../services/curriculumService';
import resourceService from '../../services/resourceService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FormField from '../../components/common/FormField';

const TYPE_LABELS = {
  pdf: 'PDF',
  document: 'Document',
  notes: 'Notes',
  video: 'Video',
  link: 'Link',
  assignment: 'Assignment',
};

export default function StudentResources() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [resources, setResources] = useState(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await curriculumService.getSubjects();
        setSubjects(data.subjects);
      } catch (err) {
        setError(err.friendlyMessage);
      } finally {
        setIsLoadingSubjects(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setChapters([]);
      setChapterId('');
      return;
    }
    (async () => {
      try {
        const data = await curriculumService.getChapters(subjectId);
        setChapters(data.chapters);
      } catch (err) {
        setError(err.friendlyMessage);
      }
    })();
  }, [subjectId]);

  useEffect(() => {
    let mounted = true;
    setIsLoadingResources(true);
    resourceService
      .listResources({ subjectId: subjectId || undefined, chapterId: chapterId || undefined })
      .then((data) => {
        if (mounted) setResources(data.resources);
      })
      .catch((err) => {
        if (mounted) setError(err.friendlyMessage);
      })
      .finally(() => {
        if (mounted) setIsLoadingResources(false);
      });
    return () => {
      mounted = false;
    };
  }, [subjectId, chapterId]);

  return (
    <div>
      <span className="eyebrow">Resources</span>
      <h2>Learning resources</h2>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {!isLoadingSubjects && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', maxWidth: 560 }}>
          <div style={{ flex: '1 1 220px' }}>
            <FormField
              label="Subject"
              id="subjectFilter"
              as="select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={[{ value: '', label: 'All subjects' }, ...subjects.map((s) => ({ value: s._id, label: s.name }))]}
            />
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <FormField
              label="Chapter"
              id="chapterFilter"
              as="select"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              disabled={!subjectId}
              options={[{ value: '', label: subjectId ? 'All chapters' : 'Select a subject first' }, ...chapters.map((c) => ({ value: c._id, label: c.name }))]}
            />
          </div>
        </div>
      )}

      {isLoadingResources ? (
        <LoadingSpinner label="Loading resources…" />
      ) : resources && resources.length === 0 ? (
        <div className="empty-state">
          <h4>No learning resources are available for this course yet</h4>
          <p style={{ margin: 0 }}>Try a different subject or chapter, or check back later.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {resources &&
            resources.map((r) => (
              <a
                key={r._id}
                href={r.fileUrl || r.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', textDecoration: 'none' }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-light)' }}>
                    {r.subject?.name}
                    {r.chapter ? ` · ${r.chapter.name}` : ''}
                  </div>
                  {r.description && <p style={{ fontSize: '0.85rem', margin: 'var(--space-2) 0 0' }}>{r.description}</p>}
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    color: 'var(--sky)',
                    border: '1px solid #bfd6e9',
                    background: 'var(--sky-light)',
                    borderRadius: 999,
                    padding: '0.2rem 0.6rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {TYPE_LABELS[r.type]}
                </span>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
