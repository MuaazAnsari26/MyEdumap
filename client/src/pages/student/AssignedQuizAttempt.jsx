import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import QuizTakingView from '../../components/quiz/QuizTakingView';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AssignedQuizAttempt() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    assignmentService
      .getAssignmentForAttempt(assignmentId)
      .then((data) => {
        if (mounted) setAssignment(data);
      })
      .catch((err) => {
        if (mounted) setError(err.friendlyMessage);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [assignmentId]);

  const handleSubmit = async (answers) => {
    await assignmentService.submitAssignmentAttempt(assignmentId, answers);
    navigate(`/student/quizzes/assigned/${assignmentId}/result`, { replace: true });
  };

  if (isLoading) return <LoadingSpinner label="Loading your assigned quiz…" />;

  if (error && !assignment) {
    return (
      <div>
        <div className="alert alert-error" role="alert">{error}</div>
        <Button variant="outline" onClick={() => navigate('/student/quizzes')}>
          Back to quizzes
        </Button>
      </div>
    );
  }

  if (!assignment) return null;

  return <QuizTakingView title={assignment.title} questions={assignment.questions} onSubmit={handleSubmit} />;
}
