# MongoDB-first assistant fallback design

## Goal
Keep Nora's Workshop customer assistant useful when OpenAI API credit is unavailable. MongoDB becomes the always-available source for basic FAQ answers. OpenAI remains an optional enhancement for questions that cannot be matched confidently.

## Architecture
1. Store each bilingual knowledge entry in MongoDB with clientId, language, category, question, keywords, content, href, active, and an optional embedding.
2. A new basic retrieval service searches active entries for the configured client and language without requiring embeddings. It normalizes the visitor question and scores exact question/phrase matches, keyword overlap, and content/title overlap.
3. `/api/assistant/message` tries basic MongoDB retrieval first.
4. When confidence is high, return the stored MongoDB answer directly with no OpenAI call.
5. When confidence is low and OpenAI is configured, use the existing vector/AI path. If OpenAI is unavailable, quota-limited, or errors, return a safe basic fallback containing relevant knowledge suggestions/contact guidance rather than an API error.
6. Existing FAQ suggestion buttons remain unchanged.

## Knowledge seeding
Add `npm run seed:assistant-basic`. It upserts the current English and Bulgarian FAQ knowledge into MongoDB without calling OpenAI and without requiring embeddings. The existing embedding seed remains available for users who enable paid AI/vector retrieval later.

## Data model
Extend knowledge entries with `question` and `keywords`. Make `embedding` optional. Existing vector-search documents remain compatible.

## Matching
Normalize case, punctuation, whitespace, and common stop words. Score deterministic signals only; no external inference is required. Exact/near-exact question and strong keyword overlap are high-confidence. Weak matches are suggestions, not asserted answers. Retrieval is always filtered by `clientId`, `language`, and `active`.

## Error handling
OpenAI is optional. Missing API key, quota errors, network errors, or model errors must not make the public assistant endpoint fail when MongoDB is available. The endpoint returns a useful MongoDB answer or a localized fallback telling the visitor which supported topics are available and how to contact Nora for questions requiring human help.

## Tests
Add unit tests for normalization/scoring, client/language isolation, high-confidence direct answers, low-confidence suggestions, no-OpenAI operation, and OpenAI failure fallback. Existing AI/vector tests remain valid. GitHub Actions must pass server tests, client tests, and the production client build before merge.

## Scope
No admin knowledge editor in this change. No new database provider. No automated MongoDB embeddings. No requirement for OpenAI billing for basic FAQ functionality.
