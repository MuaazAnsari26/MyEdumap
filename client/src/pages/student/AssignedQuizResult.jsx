import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import QuizResultView from '../../components/quiz/QuizResultView';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AssignedQuizResult() {
  const { assignmentId } = useParams();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    assignmentService
      .getAssignmentResult(assignmentId)
      .then((data) => {
        if (mounted) setResult(data);
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

  if (isLoading) return <LoadingSpinner label="Loading your results…" />;
  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!result) return null;

  return (
    <QuizResultView
      heading={result.title}
      subheading={`${result.subject?.name || ''}${result.chapter ? ` · ${result.chapter.name}` : ''}`}
      result={result}
      backLink={{ to: '/student/quizzes', label: 'Back to quizzes' }}
    />
  );
}
