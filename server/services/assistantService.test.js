import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerAssistantQuestion,
  buildAnswerInstructions,
  buildVectorPipeline,
  extractResponseText,
} from './assistantService.js';

test('vector pipeline scopes retrieval to client, language, and active knowledge', () => {
  const pipeline = buildVectorPipeline({
    clientId: 'noras-workshop',
    language: 'bg',
    embedding: [0.1, 0.2],
    limit: 4,
    indexName: 'assistant_knowledge_vector',
  });

  assert.equal(pipeline[0].$vectorSearch.index, 'assistant_knowledge_vector');
  assert.deepEqual(pipeline[0].$vectorSearch.filter, {
    clientId: 'noras-workshop',
    language: 'bg',
    active: true,
  });
  assert.equal(pipeline[0].$vectorSearch.limit, 4);
  assert.deepEqual(pipeline[0].$vectorSearch.queryVector, [0.1, 0.2]);
});

test('answer instructions ground Nora facts while allowing general related advice', () => {
  const instructions = buildAnswerInstructions('en');

  assert.match(instructions, /Nora-specific facts/i);
  assert.match(instructions, /retrieved knowledge/i);
  assert.match(instructions, /general.*gift.*decor/i);
  assert.match(instructions, /do not invent/i);
});

test('extractResponseText reads Responses API output text safely', () => {
  const text = extractResponseText({
    output: [{ type: 'message', content: [{ type: 'output_text', text: 'Hello from Nora' }] }],
  });

  assert.equal(text, 'Hello from Nora');
});

test('high-confidence MongoDB knowledge answers directly without OpenAI', async () => {
  let openAiCalled = false;
  const result = await answerAssistantQuestion({ message: 'How much is shipping?', language: 'en' }, {
    basicRetriever: async () => [{ key: 'shipping-cost', title: 'Shipping cost', content: 'Standard shipping is $10.', href: '/help/shipping', score: 1 }],
    embedder: async () => { openAiCalled = true; throw new Error('should not run'); },
  });

  assert.equal(result.answer, 'Standard shipping is $10.');
  assert.equal(result.mode, 'basic');
  assert.equal(openAiCalled, false);
});

test('without OpenAI configuration low-confidence matches return a safe MongoDB fallback', async () => {
  const result = await answerAssistantQuestion({ message: 'Do you sell bicycles?', language: 'en' }, {
    basicRetriever: async () => [{ key: 'shipping-cost', title: 'Shipping cost', content: 'Standard shipping is $10.', href: '/help/shipping', score: 0.2 }],
    apiKey: '',
  });

  assert.match(result.answer, /couldn't find a confident answer/i);
  assert.equal(result.mode, 'fallback');
  assert.equal(result.sources.length, 1);
});

test('OpenAI quota failure falls back to MongoDB suggestions instead of throwing', async () => {
  const result = await answerAssistantQuestion({ message: 'Can you recommend a wedding gift?', language: 'en' }, {
    basicRetriever: async () => [{ key: 'custom-orders', title: 'Personalized products', content: 'Custom products are available.', href: '/about', score: 0.4 }],
    apiKey: 'test-key',
    embedder: async () => { const error = new Error('quota exceeded'); error.status = 429; throw error; },
  });

  assert.equal(result.mode, 'fallback');
  assert.match(result.answer, /contact Nora|couldn't find a confident answer/i);
});
