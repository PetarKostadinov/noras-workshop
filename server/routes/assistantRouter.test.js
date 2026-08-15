import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAssistantRequest } from './assistantRouter.js';

test('rejects blank assistant messages', () => {
  assert.throws(() => validateAssistantRequest({ message: '   ', language: 'en' }), /question/i);
});

test('rejects assistant messages longer than 500 characters', () => {
  assert.throws(() => validateAssistantRequest({ message: 'a'.repeat(501), language: 'en' }), /500/);
});

test('rejects unsupported assistant languages', () => {
  assert.throws(() => validateAssistantRequest({ message: 'Hello', language: 'de' }), /language/i);
});

test('normalizes a valid assistant request', () => {
  assert.deepEqual(validateAssistantRequest({ message: '  Hello  ', language: 'bg' }), {
    message: 'Hello',
    language: 'bg',
  });
});
