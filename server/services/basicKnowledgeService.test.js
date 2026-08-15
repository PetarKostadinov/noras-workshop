import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, scoreKnowledgeEntry, retrieveBasicKnowledge } from './basicKnowledgeService.js';

test('normalizeText folds case, punctuation, and extra whitespace', () => {
  assert.equal(normalizeText('  How MUCH is shipping?!  '), 'how much is shipping');
});

test('scoreKnowledgeEntry gives high confidence to exact question matches', () => {
  const score = scoreKnowledgeEntry('How much is shipping?', {
    question: 'How much is shipping?',
    keywords: ['shipping cost', 'free shipping'],
    title: 'Shipping cost',
    content: 'Standard shipping is $10.',
  });
  assert.ok(score >= 0.9);
});

test('scoreKnowledgeEntry recognizes strong keyword overlap', () => {
  const score = scoreKnowledgeEntry('What is the delivery cost?', {
    question: 'How much is shipping?',
    keywords: ['shipping cost', 'delivery cost', 'free shipping'],
    title: 'Shipping cost',
    content: 'Standard shipping is $10.',
  });
  assert.ok(score >= 0.65);
});

test('scoreKnowledgeEntry keeps unrelated questions low confidence', () => {
  const score = scoreKnowledgeEntry('Do you sell bicycles?', {
    question: 'How much is shipping?',
    keywords: ['shipping cost', 'delivery cost'],
    title: 'Shipping cost',
    content: 'Standard shipping is $10.',
  });
  assert.ok(score < 0.35);
});

test('retrieveBasicKnowledge scopes database query by client, language, and active', async () => {
  let seenQuery;
  const docs = [{ key: 'shipping-cost', question: 'How much is shipping?', keywords: ['shipping'], title: 'Shipping cost', content: 'Standard shipping is $10.' }];
  const model = {
    find(query) {
      seenQuery = query;
      return { lean: async () => docs };
    },
  };

  const result = await retrieveBasicKnowledge({
    clientId: 'noras-workshop',
    language: 'en',
    message: 'shipping',
    model,
  });

  assert.deepEqual(seenQuery, { clientId: 'noras-workshop', language: 'en', active: true });
  assert.equal(result[0].key, 'shipping-cost');
  assert.ok(result[0].score > 0);
});
