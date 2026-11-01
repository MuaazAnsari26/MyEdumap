// Defensive validation of a single AI-returned question object. Nothing
// from the AI is trusted or stored until it passes every check here —
// this is what "Validate AI responses before storing" (spec section 15)
// actually means in code, not just a comment.
function validateAiQuestion(raw) {
  if (!raw || typeof raw !== 'object') return { valid: false, reason: 'not an object' };

  const { questionText, options, correctAnswerIndex, explanation } = raw;

  if (typeof questionText !== 'string' || questionText.trim().length < 5) {
    return { valid: false, reason: 'missing or too-short questionText' };
  }

  if (!Array.isArray(options) || options.length !== 4) {
    return { valid: false, reason: 'options must be an array of exactly 4 items' };
  }

  if (!options.every((opt) => typeof opt === 'string' && opt.trim().length > 0)) {
    return { valid: false, reason: 'one or more options is empty or not a string' };
  }

  const normalizedOptions = options.map((o) => o.trim().toLowerCase());
  if (new Set(normalizedOptions).size !== 4) {
    return { valid: false, reason: 'options must be unique' };
  }

  if (
    typeof correctAnswerIndex !== 'number' ||
    !Number.isInteger(correctAnswerIndex) ||
    correctAnswerIndex < 0 ||
    correctAnswerIndex > 3
  ) {
    return { valid: false, reason: 'correctAnswerIndex must be an integer 0-3' };
  }

  if (typeof explanation !== 'string' || explanation.trim().length < 3) {
    return { valid: false, reason: 'missing or too-short explanation' };
  }

  return {
    valid: true,
    question: {
      questionText: questionText.trim(),
      options: options.map((o) => o.trim()),
      correctAnswerIndex,
      explanation: explanation.trim(),
    },
  };
}

module.exports = { validateAiQuestion };
