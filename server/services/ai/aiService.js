const { env } = require('../../config/env');
const geminiProvider = require('./providers/geminiProvider');

// Registry pattern: adding a new provider later means writing one new
// file matching this same interface and adding one line here — nothing
// in any caller needs to change.
const PROVIDERS = {
  gemini: geminiProvider,
};

function getActiveProvider() {
  const provider = PROVIDERS[env.ai.provider];
  if (!provider) {
    throw new Error(`Unknown AI provider configured: "${env.ai.provider}"`);
  }
  return provider;
}

async function generateQuizQuestions(params) {
  return getActiveProvider().generateQuizQuestions(params);
}

async function generateTeachingInsight(promptText) {
  return getActiveProvider().generateTeachingInsight(promptText);
}

async function generateDoubtSolverReply(history, systemInstruction) {
  return getActiveProvider().generateDoubtSolverReply(history, systemInstruction);
}

module.exports = { generateQuizQuestions, generateTeachingInsight, generateDoubtSolverReply };
