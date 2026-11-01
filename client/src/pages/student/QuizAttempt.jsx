import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import quizService from '../../services/quizService';
import QuizTakingView from '../../components/quiz/QuizTakingView';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Thin container for a self-generated practice quiz — fetches the quiz,
// then delegates all taking-UI to the shared QuizTakingView.
export default function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    quizService
      .getQuiz(quizId)
      .then((data) => {
        if (mounted) setQuiz(data);
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
  }, [quizId]);

  const handleSubmit = async (answers) => {
    const result = await quizService.submitAttempt(quizId, answers);
    navigate(`/student/quizzes/results/${result._id}`, { replace: true });
  };

  if (isLoading) return <LoadingSpinner label="Loading your quiz…" />;

  if (error && !quiz) {
    return (
      <div>
        <div className="alert alert-error" role="alert">{error}</div>
        <Button variant="outline" onClick={() => navigate('/student/quizzes')}>
          Back to quizzes
        </Button>
      </div>
    );
  }

  if (!quiz) return null;

  return <QuizTakingView questions={quiz.questions} onSubmit={handleSubmit} />;
}
