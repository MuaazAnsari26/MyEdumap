import React, { useCallback, useEffect, useState } from 'react';
import classService from '../../services/classService';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import KeyBadge from '../../components/common/KeyBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function ClassRow({ classItem, isExpanded, onToggle }) {
  const [detail, setDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    if (!isExpanded || detail) return;
    let mounted = true;
    setIsLoadingDetail(true);
    classService
      .getClassDetail(classItem._id)
      .then((data) => {
        if (mounted) setDetail(data);
      })
      .catch((err) => {
        if (mounted) setDetailError(err.friendlyMessage);
      })
      .finally(() => {
        if (mounted) setIsLoadingDetail(false);
      });
    return () => {
      mounted = false;
    };
  }, [isExpanded, detail, classItem._id]);

  return (
    <div className="card" style={{ padding: 'var(--space-5)' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: 'var(--space-3)' }}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${classItem.name}, ${isExpanded ? 'expanded' : 'collapsed'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{classItem.name}</div>
          <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--route-dark)' }}>
            {classItem.classKey}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>
            {classItem.studentCount} {classItem.studentCount === 1 ? 'student' : 'students'}
          </span>
          <span aria-hidden="true">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--line)', paddingTop: 'var(--space-5)' }}>
          {detailError && <div className="alert alert-error" role="alert">{detailError}</div>}
          {isLoadingDetail ? (
            <LoadingSpinner label="Loading roster…" size={22} />
          ) : detail && detail.students.length === 0 ? (
            <div className="empty-state">
              <h4>No students in this class yet</h4>
              <p style={{ margin: 0 }}>Share the class key above so students can join.</p>
            </div>
          ) : (
            detail && (
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {detail.students.map((s) => (
                  <div
                    key={s._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) 0',
                      borderBottom: '1px solid var(--line)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>{s.name}</span>
                    <span style={{ color: 'var(--slate-light)' }}>{s.email}</span>
                  </div>
                ))}
              </div>
            )
          )}
          <div className="empty-state" style={{ marginTop: 'var(--space-4)' }}>
            <h4>No performance data available</h4>
            <p style={{ margin: 0 }}>Class performance will appear once students complete quizzes.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [newClassName, setNewClassName] = useState('');
  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const data = await classService.listMyClasses();
      setClasses(data);
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    if (!newClassName.trim()) {
      setCreateError('Class name is required.');
      return;
    }
    setIsCreating(true);
    try {
      const created = await classService.createClass(newClassName.trim());
      setClasses((prev) => [created, ...prev]);
      setNewClassName('');
    } catch (err) {
      setCreateError(err.friendlyMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <span className="eyebrow">Classes</span>
      <h2>Your classes</h2>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="card" style={{ maxWidth: 480, margin: '0 auto var(--space-8)' }}>
        <h4>Create a new class</h4>
        <form onSubmit={handleCreate} noValidate>
          <FormField
            label="Class name"
            id="className"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            error={createError}
            placeholder="e.g. Class 10A"
          />
          <Button type="submit" isLoading={isCreating}>
            Create class
          </Button>
        </form>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading your classes…" />
      ) : classes.length === 0 ? (
        <div className="empty-state">
          <h4>You haven't created a class yet</h4>
          <p style={{ margin: 0 }}>Create your first class above to start organizing students.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {classes.map((c) => (
            <ClassRow
              key={c._id}
              classItem={c}
              isExpanded={expandedId === c._id}
              onToggle={() => setExpandedId(expandedId === c._id ? null : c._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
