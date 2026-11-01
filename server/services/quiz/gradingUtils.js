// Scoring always happens here, against the stored answer key — never
// trusted from the client, and never duplicated between the self-practice
// and assignment attempt flows.
function gradeAnswers(populatedQuestions, submittedAnswers) {
  const answerMap = new Map((submittedAnswers || []).map((a) => [String(a.questionId), a.selectedOptionIndex]));

  let score = 0;
  const gradedAnswers = populatedQuestions.map((question) => {
    const selectedOptionIndex = answerMap.has(String(question._id)) ? answerMap.get(String(question._id)) : null;
    const isCorrect = selectedOptionIndex === question.correctAnswerIndex;
    if (isCorrect) score += 1;
    return { question: question._id, selectedOptionIndex, isCorrect };
  });

  const percentage = populatedQuestions.length > 0 ? Math.round((score / populatedQuestions.length) * 100) : 0;

  return { gradedAnswers, score, percentage };
}

// Builds the per-question breakdown shape returned to the frontend after
// submission (or when reviewing a past result) — correct answers and
// explanations included, since the quiz is over at this point.
function buildDetailedResult(attemptLike, populatedQuestions) {
  const questionById = new Map(populatedQuestions.map((q) => [String(q._id), q]));

  return {
    _id: attemptLike._id,
    score: attemptLike.score,
    totalQuestions: attemptLike.totalQuestions,
    percentage: attemptLike.percentage,
    submittedAt: attemptLike.submittedAt,
    answers: attemptLike.answers.map((a) => {
      const q = questionById.get(String(a.question));
      return {
        questionId: a.question,
        questionText: q?.questionText,
        options: q?.options,
        selectedOptionIndex: a.selectedOptionIndex,
        correctAnswerIndex: q?.correctAnswerIndex,
        isCorrect: a.isCorrect,
        explanation: q?.explanation,
      };
    }),
  };
}

module.exports = { gradeAnswers, buildDetailedResult };
