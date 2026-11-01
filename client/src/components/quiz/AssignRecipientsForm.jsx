import React, { useEffect, useState } from 'react';
import connectionService from '../../services/connectionService';
import classService from '../../services/classService';
import assignmentService from '../../services/assignmentService';
import Button from '../common/Button';
import FormField from '../common/FormField';

const VIA_OPTIONS = [
  { value: 'single', label: 'One student' },
  { value: 'selected', label: 'Selected students' },
  { value: 'class', label: 'Entire class' },
  { value: 'all', label: 'All my students' },
];

export default function AssignRecipientsForm({ teacherQuizId, quizGrade, onAssigned }) {
  const [connections, setConnections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignedVia, setAssignedVia] = useState('single');
  const [studentId, setStudentId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [classId, setClassId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    connectionService.getConnections().then(setConnections).catch(() => setConnections([]));
    classService.listMyClasses().then(setClasses).catch(() => setClasses([]));
  }, []);

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const payload = { assignedVia };
    if (assignedVia === 'single') payload.studentId = studentId;
    if (assignedVia === 'selected') payload.studentIds = selectedIds;
    if (assignedVia === 'class') payload.classId = classId;

    if (assignedVia === 'single' && !studentId) return setError('Please select a student.');
    if (assignedVia === 'selected' && selectedIds.length === 0) return setError('Select at least one student.');
    if (assignedVia === 'class' && !classId) return setError('Please select a class.');

    setIsSubmitting(true);
    try {
      const res = await assignmentService.assignQuiz(teacherQuizId, payload);
      setSuccessMessage(res.message);
      if (onAssigned) onAssigned(res.data);
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (connections.length === 0 && classes.length === 0) {
    return (
      <div className="empty-state">
        <h4>No students connected yet</h4>
        <p style={{ margin: 0 }}>Connect with students or create a class before assigning quizzes.</p>
      </div>
    );
  }

  // This quiz was built for one specific grade — a student in a
  // different grade simply isn't a valid recipient. Filtering these
  // pickers to matching-grade students prevents the mismatch before the
  // request is ever sent, rather than only rejecting it server-side.
  // "Entire class"/"All my students" stay unfiltered here since those
  // are broader, intentional bulk actions — the backend still silently
  // excludes any mismatched students from those and reports the count.
  const eligibleConnections = quizGrade ? connections.filter((c) => c.student.grade === quizGrade) : connections;
  const hiddenForGradeCount = connections.length - eligibleConnections.length;

  return (
    <form onSubmit={handleAssign} noValidate>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {successMessage && <div className="alert alert-success" role="status">{successMessage}</div>}

      <FormField
        label="Assign to"
        id="assignedVia"
        as="select"
        value={assignedVia}
        onChange={(e) => setAssignedVia(e.target.value)}
        options={VIA_OPTIONS}
      />

      {assignedVia === 'single' && (
        <>
          <FormField
            label="Student"
            id="studentId"
            as="select"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            options={[
              { value: '', label: 'Select a student' },
              ...eligibleConnections.map((c) => ({ value: c.student._id, label: c.student.name })),
            ]}
          />
          {quizGrade && hiddenForGradeCount > 0 && (
            <p className="field-hint" style={{ marginTop: -8 }}>
              {hiddenForGradeCount} connected student(s) aren't shown — this quiz is for {quizGrade}.
            </p>
          )}
        </>
      )}

      {assignedVia === 'selected' && (
        <div className="field">
          <label>Students</label>
          <div style={{ display: 'grid', gap: 'var(--space-2)', maxHeight: 200, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
            {eligibleConnections.map((c) => (
              <label key={c.student._id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={selectedIds.includes(c.student._id)} onChange={() => toggleSelected(c.student._id)} />
                {c.student.name}
              </label>
            ))}
          </div>
          {quizGrade && hiddenForGradeCount > 0 && (
            <p className="field-hint">
              {hiddenForGradeCount} connected student(s) aren't shown — this quiz is for {quizGrade}.
            </p>
          )}
        </div>
      )}

      {assignedVia === 'class' && (
        <FormField
          label="Class"
          id="classId"
          as="select"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          options={[{ value: '', label: 'Select a class' }, ...classes.map((c) => ({ value: c._id, label: `${c.name} (${c.studentCount} students)` }))]}
        />
      )}

      {assignedVia === 'all' && (
        <p style={{ fontSize: '0.88rem' }}>
          This will assign the quiz to all connected students in {quizGrade || 'the matching grade'} — anyone in a
          different grade will be skipped automatically.
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Assign quiz
      </Button>
    </form>
  );
}
