import assert from 'node:assert/strict';
import test from 'node:test';
import { auth, createRateLimiter, escapeRegex, optionalAuth } from './utils.js';

const createResponse = () => ({
    headers: {},
    statusCode: 200,
    body: undefined,
    set(name, value) {
        this.headers[name] = value;
        return this;
    },
    status(code) {
        this.statusCode = code;
        return this;
    },
    send(body) {
        this.body = body;
        return this;
    },
});

test('escapeRegex treats user search text literally', () => {
    const input = 'box (large).* [gift]?';
    const expression = new RegExp(escapeRegex(input), 'i');

    assert.equal(expression.test(input), true);
    assert.equal(expression.test('box large anything'), false);
});

test('auth rejects headers that do not use the Bearer scheme', () => {
    const response = createResponse();
    let calledNext = false;

    auth({ headers: { authorization: 'Basic token' } }, response, () => { calledNext = true; });

    assert.equal(response.statusCode, 401);
    assert.equal(calledNext, false);
});

test('optionalAuth allows requests without an account token', () => {
    let calledNext = false;
    optionalAuth({ headers: {} }, createResponse(), () => { calledNext = true; });
    assert.equal(calledNext, true);
});

test('optionalAuth rejects malformed authorization headers', () => {
    const response = createResponse();
    let calledNext = false;
    optionalAuth({ headers: { authorization: 'Basic token' } }, response, () => { calledNext = true; });
    assert.equal(response.statusCode, 401);
    assert.equal(calledNext, false);
});

test('rate limiter rejects requests above the configured maximum', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2, message: 'Slow down' });
    const request = { ip: '127.0.0.1' };
    let allowed = 0;

    limiter(request, createResponse(), () => { allowed += 1; });
    limiter(request, createResponse(), () => { allowed += 1; });
    const rejectedResponse = createResponse();
    limiter(request, rejectedResponse, () => { allowed += 1; });

    assert.equal(allowed, 2);
    assert.equal(rejectedResponse.statusCode, 429);
    assert.deepEqual(rejectedResponse.body, { message: 'Slow down' });
    assert.ok(rejectedResponse.headers['Retry-After']);
});
