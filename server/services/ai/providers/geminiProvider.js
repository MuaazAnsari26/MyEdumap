const { env } = require('../../../config/env');

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 25000;

function buildQuizPrompt({ grade, subjectName, chapterName, count }) {
  const scope = chapterName ? `the chapter "${chapterName}" (subject: ${subjectName})` : `the subject "${subjectName}"`;

  return `You are an expert CBSE curriculum question writer. Generate exactly ${count} multiple-choice quiz questions for a ${grade} student, strictly scoped to ${scope}.

Rules:
- Each question must have exactly 4 answer options.
- Exactly one option must be correct.
- Options must be distinct from each other and plausible (no joke or obviously-wrong filler answers).
- Include a short explanation (1-3 sentences) of why the correct answer is right.
- Questions must be factually accurate and appropriate for the stated grade level.
- Do not include the subject, chapter, or grade name inside the question text itself.

Return ONLY a JSON array (no markdown, no commentary) where each element has exactly this shape:
{
  "questionText": string,
  "options": [string, string, string, string],
  "correctAnswerIndex": number (0-3),
  "explanation": string
}`;
}

// Low-level call to Gemini's generateContent endpoint. Accepts a full
// multi-turn `contents` array and an optional system instruction, so
// every higher-level function (quiz generation, teaching insights, the
// doubt solver) shares one place that actually talks to Gemini. Throws
// on any network/HTTP-level failure — this file has no fallback logic
// of its own, that lives in the callers.
async function callGeminiContents(contents, { jsonMode = false, systemInstruction = null, temperature = 0.7 } = {}) {
  if (!env.ai.geminiApiKey) {
    const err = new Error('GEMINI_API_KEY is not configured.');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const url = `${GEMINI_BASE_URL}/${env.ai.geminiModel}:generateContent?key=${env.ai.geminiApiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const body = {
    contents,
    generationConfig: {
      temperature,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { role: 'system', parts: [{ text: systemInstruction }] };
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
  } catch (err) {
    const wrapped = new Error(`Gemini request failed: ${err.message}`);
    wrapped.code = 'AI_NETWORK_ERROR';
    throw wrapped;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    const err = new Error(`Gemini API returned ${response.status}: ${bodyText.slice(0, 300)}`);
    err.code = 'AI_HTTP_ERROR';
    err.status = response.status;
    throw err;
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const err = new Error('Gemini response did not contain any text content.');
    err.code = 'AI_EMPTY_RESPONSE';
    throw err;
  }

  return text;
}

// Single-turn convenience wrapper used by quiz generation.
async function callGemini(prompt, options = {}) {
  return callGeminiContents([{ role: 'user', parts: [{ text: prompt }] }], options);
}

// ---------- Quiz generation ----------
// Returns raw parsed JSON (unvalidated) or throws. Validation against our
// own question schema happens one layer up in quizGenerationService, so
// this provider stays swappable for any future AI vendor without
// carrying app-specific validation rules.
async function generateQuizQuestions({ grade, subjectName, chapterName, count }) {
  const prompt = buildQuizPrompt({ grade, subjectName, chapterName, count });
  const rawText = await callGemini(prompt, { jsonMode: true });

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    const wrapped = new Error('Gemini response was not valid JSON.');
    wrapped.code = 'AI_MALFORMED_JSON';
    throw wrapped;
  }

  if (!Array.isArray(parsed)) {
    const err = new Error('Gemini response JSON was not an array.');
    err.code = 'AI_MALFORMED_SHAPE';
    throw err;
  }

  return parsed;
}

// ---------- Teaching insights ----------
// Plain-text response (no JSON mode) — this is a short natural-language
// interpretation of stats the backend already calculated, not structured
// data the app needs to parse.
async function generateTeachingInsight(promptText) {
  const text = await callGemini(promptText, { jsonMode: false, temperature: 0.6 });
  return text.trim();
}

// ---------- AI Doubt Solver ----------
// Multi-turn conversational call. `history` is an array of
// { role: 'user' | 'assistant', content: string } in chronological
// order; Gemini's roles are 'user' and 'model', so assistant maps to
// 'model' here. Goes through callGeminiContents directly since it needs
// a full multi-turn contents array, not a single prompt string.
async function generateDoubtSolverReply(history, systemInstruction) {
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const text = await callGeminiContents(contents, { jsonMode: false, systemInstruction, temperature: 0.6 });
  return text.trim();
}

module.exports = {
  generateQuizQuestions,
  generateTeachingInsight,
  generateDoubtSolverReply,
};
