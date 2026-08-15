# AI Knowledge Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace deterministic typed FAQ matching with a server-side, retrieval-grounded AI assistant backed by Nora's Workshop knowledge stored in MongoDB Atlas.

**Architecture:** MongoDB remains the source of truth for assistant knowledge. Knowledge entries store text plus OpenAI embeddings; Atlas Vector Search retrieves Nora-specific context, and the OpenAI Responses API generates a bilingual answer constrained by that context. The React FAQ widget keeps its existing suggested-question UX but sends questions to `/api/assistant/message`.

**Tech Stack:** React 18, Express 4, Mongoose 7, MongoDB Atlas Vector Search, Node 18 built-in `fetch`, OpenAI Embeddings API and Responses API, Node test runner, React Testing Library.

## Global Constraints

- Keep `OPENAI_API_KEY` server-only.
- Nora-specific facts must be grounded in retrieved MongoDB knowledge; do not let the model invent prices, policies, availability, or business facts.
- Allow general gift/decor advice, but clearly distinguish it from Nora-specific information.
- Preserve English and Bulgarian UI behavior.
- Keep MongoDB as the canonical knowledge store; embeddings are regenerated when knowledge changes.
- Filter vector retrieval by `clientId` and `active` at query time.
- Do not store visitor chat text in MongoDB in this version.
- Update `README.md`, `server/.env.example`, and `docs/PROJECT_CONTEXT.md` for the new integration.

---

### Task 1: Retrieval and OpenAI service

**Files:**
- Create: `server/models/knowledgeEntryModel.js`
- Create: `server/services/assistantService.js`
- Test: `server/services/assistantService.test.js`

**Interfaces:**
- Produces: `embedText(text, options)`, `retrieveKnowledge({ clientId, language, embedding, limit })`, `generateAssistantAnswer({ message, language, knowledge, options })`, `answerAssistantQuestion({ message, language })`.

- [ ] Write failing tests proving retrieval is client/language scoped and answer prompts separate Nora facts from general advice.
- [ ] Verify tests fail because the service does not exist.
- [ ] Implement the knowledge schema, OpenAI HTTP helpers, Atlas `$vectorSearch`, and answer orchestration.
- [ ] Run the focused server tests and verify they pass.

### Task 2: Assistant HTTP endpoint

**Files:**
- Create: `server/routes/assistantRouter.js`
- Modify: `server/server.js`
- Test: `server/routes/assistantRouter.test.js`

**Interfaces:**
- Consumes: `answerAssistantQuestion({ message, language })`.
- Produces: `POST /api/assistant/message` accepting `{ message, language }` and returning `{ answer, sources }`.

- [ ] Write failing route/validation tests for blank, oversized, and unsupported-language input.
- [ ] Verify tests fail before route implementation.
- [ ] Implement the router with a 500-character limit and `en`/`bg` language allow-list.
- [ ] Mount it at `/api/assistant` before the API 404 handler.
- [ ] Run focused tests.

### Task 3: Seed Nora knowledge in MongoDB

**Files:**
- Create: `server/data/assistantKnowledge.js`
- Create: `server/scripts/seedAssistantKnowledge.js`
- Modify: `server/package.json`

**Interfaces:**
- Produces: `npm run seed:assistant-knowledge` which embeds and upserts Nora knowledge records.

- [ ] Add the bilingual FAQ/policy records as initial seed input.
- [ ] Implement idempotent upsert keyed by `clientId + language + key`.
- [ ] Generate embeddings only during seed/update and store them with each knowledge entry.
- [ ] Document the required Atlas vector index name and dimensions.

### Task 4: Connect React FAQ assistant

**Files:**
- Modify: `client/src/components/faq/FaqAssistant.js`
- Modify: `client/src/components/faq/FaqAssistant.test.js`
- Modify: `client/src/components/faq/faqContent.js`

**Interfaces:**
- Consumes: `POST /api/assistant/message`.

- [ ] Replace deterministic typed-question matching with the assistant API.
- [ ] Keep popular FAQ buttons as prompts, not local answers.
- [ ] Add loading/error UI strings in English and Bulgarian.
- [ ] Keep conversation only in React memory and clear it on language change.
- [ ] Test successful AI response, API failure fallback, and disabled submit while waiting.

### Task 5: Configuration and durable documentation

**Files:**
- Modify: `server/.env.example`
- Modify: `README.md`
- Modify: `docs/PROJECT_CONTEXT.md`

- [ ] Document `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`, `ASSISTANT_CLIENT_ID`, and `ASSISTANT_VECTOR_INDEX`.
- [ ] Document MongoDB Atlas Vector Search as a runtime requirement for the assistant.
- [ ] Document the seed command and the no-chat-persistence privacy behavior.
- [ ] Run the narrowest available server/client checks, then broader checks if the environment permits them.
