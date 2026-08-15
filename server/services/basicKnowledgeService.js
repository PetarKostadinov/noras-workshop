import KnowledgeEntry from '../models/knowledgeEntryModel.js';

const DEFAULT_CLIENT_ID = 'noras-workshop';
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'how', 'i', 'in', 'is', 'it', 'my', 'of', 'on', 'the', 'to', 'what', 'which', 'with',
  'аз', 'в', 'за', 'и', 'как', 'каква', 'какви', 'какво', 'ли', 'на', 'с', 'се', 'това', 'е',
]);

export const normalizeText = (value = '') => String(value)
  .toLocaleLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokensFor = (value) => normalizeText(value)
  .split(' ')
  .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const overlapRatio = (messageTokens, candidateTokens) => {
  if (!messageTokens.length || !candidateTokens.length) return 0;
  const candidateSet = new Set(candidateTokens);
  const hits = messageTokens.filter((token) => candidateSet.has(token)).length;
  return hits / messageTokens.length;
};

export const scoreKnowledgeEntry = (message, entry = {}) => {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage) return 0;

  const normalizedQuestion = normalizeText(entry.question || '');
  if (normalizedQuestion && normalizedMessage === normalizedQuestion) return 1;

  const messageTokens = tokensFor(normalizedMessage);
  let score = 0;

  if (normalizedQuestion) {
    if (normalizedQuestion.includes(normalizedMessage) || normalizedMessage.includes(normalizedQuestion)) score = Math.max(score, 0.88);
    score = Math.max(score, overlapRatio(messageTokens, tokensFor(normalizedQuestion)) * 0.78);
  }

  for (const keyword of entry.keywords || []) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;
    if (normalizedMessage === normalizedKeyword) score = Math.max(score, 0.92);
    if (normalizedMessage.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedMessage)) score = Math.max(score, 0.82);
    score = Math.max(score, overlapRatio(messageTokens, tokensFor(normalizedKeyword)) * 0.75);
  }

  const supportingText = `${entry.title || ''} ${entry.content || ''}`;
  score = Math.max(score, overlapRatio(messageTokens, tokensFor(supportingText)) * 0.45);
  return Math.min(score, 1);
};

export const retrieveBasicKnowledge = async ({
  clientId = process.env.ASSISTANT_CLIENT_ID || DEFAULT_CLIENT_ID,
  language,
  message,
  limit = 5,
  model = KnowledgeEntry,
}) => {
  const entries = await model.find({ clientId, language, active: true }).lean();
  return entries
    .map((entry) => ({ ...entry, score: scoreKnowledgeEntry(message, entry) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
