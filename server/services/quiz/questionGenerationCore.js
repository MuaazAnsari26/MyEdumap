const Question = require('../../models/Question');
const aiService = require('../ai/aiService');
const { validateAiQuestion } = require('./questionValidator');

async function fetchRandomBankQuestions({ grade, subjectId, chapterId, count, excludeIds = [] }) {
  const match = { grade, subject: subjectId };
  if (chapterId) match.chapter = chapterId;
  if (excludeIds.length > 0) match._id = { $nin: excludeIds };

  return Question.aggregate([{ $match: match }, { $sample: { size: count } }]);
}

// Attempts AI generation, validates every returned item, and discards
// (rather than repairs or fakes) anything that fails validation. Never
// throws for "some invalid items" — only throws if the AI call itself
// fails outright, so the caller can distinguish "AI is down" from
// "AI answered but some items were junk".
async function tryGenerateFromAI({ grade, subjectName, chapterName, count }) {
  const rawItems = await aiService.generateQuizQuestions({ grade, subjectName, chapterName, count });

  const validQuestions = [];
  for (const raw of rawItems) {
    const result = validateAiQuestion(raw);
    if (result.valid) {
      validQuestions.push(result.question);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Discarded malformed AI question: ${result.reason}`);
    }
  }

  return validQuestions;
}

// The core pipeline shared by student self-practice quizzes and teacher
// bulk-generated quizzes: AI first -> validate -> save -> two-tier bank
// fallback (exact chapter, then whole subject) -> never fabricate.
// `source` controls how persisted questions are attributed (AI-authored
// questions are always source='ai' regardless of caller — a teacher's
// bulk "Generate Quiz" still produces AI-sourced bank entries, distinct
// from Mode B's individually curated, teacher-attributed questions).
async function generateQuestionSet({ grade, subject, chapter, count }) {
  let savedAiQuestions = [];

  try {
    const validated = await tryGenerateFromAI({
      grade,
      subjectName: subject.name,
      chapterName: chapter?.name,
      count,
    });

    if (validated.length > 0) {
      const docs = validated.map((q) => ({
        grade,
        subject: subject._id,
        chapter: chapter?._id || null,
        topic: chapter?.name || null,
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        source: 'ai',
        createdBy: null,
      }));
      savedAiQuestions = await Question.insertMany(docs);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`AI question generation failed (${err.code || 'UNKNOWN'}): ${err.message}`);
  }

  let finalQuestions = [...savedAiQuestions];
  let usedBroaderFallback = false;

  // Tier 1: exact chapter match from the existing bank.
  if (finalQuestions.length < count && chapter) {
    const stillNeeded = count - finalQuestions.length;
    const chapterBankQuestions = await fetchRandomBankQuestions({
      grade,
      subjectId: subject._id,
      chapterId: chapter._id,
      count: stillNeeded,
      excludeIds: finalQuestions.map((q) => q._id),
    });
    finalQuestions = [...finalQuestions, ...chapterBankQuestions];
  }

  // Tier 2: broaden to the whole subject rather than failing outright —
  // real, previously-validated questions, just less precisely targeted.
  if (finalQuestions.length < count) {
    const stillNeeded = count - finalQuestions.length;
    const bankQuestions = await fetchRandomBankQuestions({
      grade,
      subjectId: subject._id,
      count: stillNeeded,
      excludeIds: finalQuestions.map((q) => q._id),
    });

    if (bankQuestions.length > 0 && chapter) {
      usedBroaderFallback = true;
    }
    finalQuestions = [...finalQuestions, ...bankQuestions];
  }

  const aiCount = savedAiQuestions.length;
  const bankCount = finalQuestions.length - aiCount;
  let generationSource;
  if (aiCount > 0 && bankCount > 0) {
    generationSource = 'mixed';
  } else if (aiCount > 0) {
    generationSource = 'ai';
  } else {
    generationSource = 'database_fallback';
  }

  return {
    questions: finalQuestions,
    generationSource,
    usedBroaderFallback,
    requestedCount: count,
    actualCount: finalQuestions.length,
  };
}

module.exports = { fetchRandomBankQuestions, tryGenerateFromAI, generateQuestionSet };
