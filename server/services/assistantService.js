import KnowledgeEntry from '../models/knowledgeEntryModel.js';
import { retrieveBasicKnowledge } from './basicKnowledgeService.js';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_CLIENT_ID = 'noras-workshop';
const DEFAULT_VECTOR_INDEX = 'assistant_knowledge_vector';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_RESPONSE_MODEL = 'gpt-5-mini';
const BASIC_CONFIDENCE_THRESHOLD = 0.72;

const openAiRequest = async (path, body, { fetchImpl = fetch, apiKey = process.env.OPENAI_API_KEY } = {}) => {
  if (!apiKey) throw Object.assign(new Error('OpenAI is not configured'), { status: 503 });

  const response = await fetchImpl(`${OPENAI_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'OpenAI request failed');
    error.status = response.status;
    throw error;
  }
  return payload;
};

export const embedText = async (text, options = {}) => {
  const payload = await openAiRequest('/embeddings', {
    model: process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    input: text,
    encoding_format: 'float',
  }, options);
  const embedding = payload?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw Object.assign(new Error('OpenAI returned no embedding'), { status: 503 });
  }
  return embedding;
};

export const buildVectorPipeline = ({ clientId, language, embedding, limit = 5, indexName }) => [{
  $vectorSearch: {
    index: indexName || process.env.ASSISTANT_VECTOR_INDEX || DEFAULT_VECTOR_INDEX,
    path: 'embedding',
    queryVector: embedding,
    numCandidates: Math.max(limit * 20, 100),
    limit,
    filter: { clientId, language, active: true },
  },
}, {
  $project: {
    _id: 0,
    key: 1,
    category: 1,
    title: 1,
    content: 1,
    href: 1,
    score: { $meta: 'vectorSearchScore' },
  },
}];

export const retrieveKnowledge = async ({
  clientId = process.env.ASSISTANT_CLIENT_ID || DEFAULT_CLIENT_ID,
  language,
  embedding,
  limit = 5,
  indexName,
  model = KnowledgeEntry,
}) => model.aggregate(buildVectorPipeline({ clientId, language, embedding, limit, indexName }));

export const buildAnswerInstructions = (language) => `You are the customer assistant for Nora's Workshop.
Reply in ${language === 'bg' ? 'Bulgarian' : 'English'}.
For Nora-specific facts such as products, prices, shipping, returns, payments, policies, availability, or workshop services, use only the retrieved knowledge supplied with the question. Do not invent Nora-specific facts.
You may provide general gift and decor advice from general knowledge when it is relevant, but clearly present it as general advice rather than a Nora's Workshop fact.
If the retrieved knowledge does not contain enough information for a Nora-specific question, say that you do not have enough confirmed information and suggest contacting Nora.
Never claim to have checked an order, payment, inventory, delivery status, or appointment unless a tool explicitly provided that live data.
Keep answers concise and helpful. Do not ask for card details, addresses, order numbers, or other sensitive information in this public assistant.`;

export const extractResponseText = (payload) => {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  return (payload?.output || [])
    .flatMap((item) => item?.content || [])
    .filter((part) => part?.type === 'output_text' && typeof part.text === 'string')
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
};

export const generateAssistantAnswer = async ({ message, language, knowledge, options = {} }) => {
  const context = knowledge.length
    ? knowledge.map((entry, index) => `[${index + 1}] ${entry.title}\n${entry.content}`).join('\n\n')
    : 'No Nora-specific knowledge was retrieved.';
  const payload = await openAiRequest('/responses', {
    model: process.env.OPENAI_MODEL || DEFAULT_RESPONSE_MODEL,
    instructions: buildAnswerInstructions(language),
    input: `Customer question:\n${message}\n\nRetrieved Nora's Workshop knowledge:\n${context}`,
  }, options);
  const answer = extractResponseText(payload);
  if (!answer) throw Object.assign(new Error('OpenAI returned no answer'), { status: 503 });
  return answer;
};

const sourceFromEntry = ({ key, title, href, score }) => ({ key, title, href, score });

const fallbackAnswer = (language) => language === 'bg'
  ? 'Не намерих достатъчно сигурен отговор в информацията на Nora’s Workshop. Можете да прегледате предложените теми или да се свържете с Нора за помощ.'
  : "I couldn't find a confident answer in Nora's Workshop knowledge. You can review the suggested topics or contact Nora for help.";

export const answerAssistantQuestion = async ({ message, language }, {
  basicRetriever = retrieveBasicKnowledge,
  answerGenerator = generateAssistantAnswer,
  apiKey = process.env.OPENAI_API_KEY,
} = {}) => {
  const knowledge = await basicRetriever({
    clientId: process.env.ASSISTANT_CLIENT_ID || DEFAULT_CLIENT_ID,
    language,
    message,
    limit: 5,
  });

  const bestMatch = knowledge[0];
  if (bestMatch && bestMatch.score >= BASIC_CONFIDENCE_THRESHOLD) {
    return {
      answer: bestMatch.content,
      mode: 'basic',
      sources: [sourceFromEntry(bestMatch)],
    };
  }

  if (apiKey) {
    try {
      const answer = await answerGenerator({
        message,
        language,
        knowledge,
        options: { apiKey },
      });
      return {
        answer,
        mode: 'ai',
        sources: knowledge.map(sourceFromEntry),
      };
    } catch (error) {
      // OpenAI is an optional enhancement. Quota, network, and model failures
      // must not make the public assistant unusable.
    }
  }

  return {
    answer: fallbackAnswer(language),
    mode: 'fallback',
    sources: knowledge.map(sourceFromEntry),
  };
};
