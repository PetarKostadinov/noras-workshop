import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnswerInstructions, buildVectorPipeline, extractResponseText } from './assistantService.js';

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
