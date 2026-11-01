import React, { useEffect, useState } from 'react';
import curriculumService from '../../services/curriculumService';
import resourceService from '../../services/resourceService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const GRADE_OPTIONS = [
  { value: '10th CBSE', label: '10th CBSE' },
  { value: '12th CBSE', label: '12th CBSE' },
];

const TYPE_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Document' },
  { value: 'notes', label: 'Notes' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'video', label: 'Video (link)' },
  { value: 'link', label: 'Link' },
];

const FILE_TYPES = new Set(['pdf', 'document', 'notes', 'assignment']);

export default function TeacherResources() {
  const [grade, setGrade] = useState('10th CBSE');
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [form, setForm] = useState({ subjectId: '', chapterId: '', type: 'pdf', title: '', description: '', externalUrl: '' });
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [myResources, setMyResources] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  useEffect(() => {
    curriculumService.getSubjects(grade).then((data) => setSubjects(data.subjects));
    setForm((f) => ({ ...f, subjectId: '', chapterId: '' }));
    setChapters([]);
  }, [grade]);

  useEffect(() => {
    if (!form.subjectId) {
      setChapters([]);
      return;
    }
    curriculumService.getChapters(form.subjectId).then((data) => setChapters(data.chapters));
  }, [form.subjectId]);

  const loadMyResources = () => {
    setIsLoadingList(true);
    resourceService
      .listResources()
      .then((data) => setMyResources(data.resources))
      .catch((err) => setListError(err.friendlyMessage))
      .finally(() => setIsLoadingList(false));
  };

  useEffect(() => {
    loadMyResources();
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const isFileType = FILE_TYPES.has(form.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.subjectId) return setFormError('Please select a subject.');
    if (!form.title.trim()) return setFormError('Title is required.');
    if (isFileType && !file) return setFormError('Please attach a file for this resource type.');
    if (!isFileType && !form.externalUrl.trim()) return setFormError('Please provide a link.');

    setIsSubmitting(true);
    try {
      await resourceService.uploadResource({ ...form, grade }, isFileType ? file : null);
      setForm((f) => ({ ...f, title: '', description: '', externalUrl: '' }));
      setFile(null);
      loadMyResources();
    } catch (err) {
      setFormError(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await resourceService.deleteResource(id);
      setMyResources((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setListError(err.friendlyMessage);
    }
  };

  return (
    <div>
      <span className="eyebrow">Resources</span>
      <h2>Add a learning resource</h2>
      <p>Resources you add here become visible to students in the matching grade, subject, and chapter.</p>

      <div className="card" style={{ maxWidth: 560, margin: '0 auto var(--space-8)' }}>
        {formError && <div className="alert alert-error" role="alert">{formError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Grade" id="grade" as="select" value={grade} onChange={(e) => setGrade(e.target.value)} options={GRADE_OPTIONS} />
          <FormField
            label="Subject"
            id="subjectId"
            as="select"
            value={form.subjectId}
            onChange={update('subjectId')}
            options={[{ value: '', label: 'Select a subject' }, ...subjects.map((s) => ({ value: s._id, label: s.name }))]}
          />
          <FormField
            label="Chapter (optional)"
            id="chapterId"
            as="select"
            value={form.chapterId}
            onChange={update('chapterId')}
            disabled={!form.subjectId}
            options={[{ value: '', label: 'Whole subject' }, ...chapters.map((c) => ({ value: c._id, label: c.name }))]}
          />
          <FormField label="Resource type" id="type" as="select" value={form.type} onChange={update('type')} options={TYPE_OPTIONS} />
          <FormField label="Title" id="title" value={form.title} onChange={update('title')} />
          <FormField label="Description (optional)" id="description" value={form.description} onChange={update('description')} />

          {isFileType ? (
            <div className="field">
              <label htmlFor="file">File (PDF, DOC, or DOCX — max 10MB)</label>
              <input id="file" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files[0] || null)} />
            </div>
          ) : (
            <FormField label="Link" id="externalUrl" value={form.externalUrl} onChange={update('externalUrl')} placeholder="https://…" />
          )}

          <Button type="submit" isLoading={isSubmitting}>
            Add resource
          </Button>
        </form>
      </div>

      <h3>Your uploaded resources</h3>
      {listError && <div className="alert alert-error" role="alert">{listError}</div>}
      {isLoadingList ? (
        <LoadingSpinner label="Loading your resources…" size={22} />
      ) : myResources && myResources.length === 0 ? (
        <div className="empty-state">
          <h4>You haven't added any resources yet</h4>
          <p style={{ margin: 0 }}>Use the form above to add your first one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {myResources &&
            myResources.map((r) => (
              <div key={r._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)' }}>
                    {r.subject?.grade} · {r.subject?.name}
                    {r.chapter ? ` · ${r.chapter.name}` : ''}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDelete(r._id)}>
                  Remove
                </Button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
