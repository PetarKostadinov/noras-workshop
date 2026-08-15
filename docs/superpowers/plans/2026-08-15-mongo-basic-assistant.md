# MongoDB-First Assistant Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Nora's Workshop answer common FAQ questions from MongoDB without OpenAI, while preserving OpenAI as an optional fallback for harder questions.

**Architecture:** Extend `KnowledgeEntry` with question/keywords and optional embeddings. Add deterministic MongoDB retrieval/scoring for basic answers. Route assistant requests through basic retrieval first, then optional OpenAI, with safe MongoDB fallback on quota/network/model errors. Add a no-OpenAI seed command.

**Tech Stack:** Node.js, Express, Mongoose/MongoDB Atlas, Node test runner, React/Jest, OpenAI HTTP APIs as optional fallback.

## Global Constraints

- Basic FAQ functionality must not require OpenAI billing.
- Retrieval must always scope by `clientId`, `language`, and `active`.
- Existing vector/AI behavior remains available when configured.
- No admin editor or new database provider in scope.

---

### Task 1: Knowledge schema and seed data

**Files:**
- Modify: `server/models/knowledgeEntryModel.js`
- Modify: `server/data/assistantKnowledge.js`
- Test: `server/services/basicKnowledgeService.test.js`

**Interfaces:**
- Produces knowledge documents with `question`, `keywords`, optional `embedding`.

- [ ] Write failing tests that exercise scoring inputs from question/keywords.
- [ ] Run `npm test -- basicKnowledgeService.test.js` and confirm failure.
- [ ] Make `embedding` optional and add `question`/`keywords` fields.
- [ ] Add bilingual questions/keywords to seed data.
- [ ] Run the focused test and confirm pass.

### Task 2: Deterministic MongoDB basic retrieval

**Files:**
- Create: `server/services/basicKnowledgeService.js`
- Test: `server/services/basicKnowledgeService.test.js`

**Interfaces:**
- Produces `normalizeText(text)`, `scoreKnowledgeEntry(message, entry)`, and `retrieveBasicKnowledge({clientId, language, message, model, limit})`.

- [ ] Add tests for normalization, strong exact/keyword matching, weak suggestions, and client/language query filters.
- [ ] Run focused tests and confirm failure.
- [ ] Implement deterministic scoring and MongoDB retrieval with no external APIs.
- [ ] Run focused tests and confirm pass.

### Task 3: MongoDB-first assistant orchestration

**Files:**
- Modify: `server/services/assistantService.js`
- Modify: `server/services/assistantService.test.js`

**Interfaces:**
- `answerAssistantQuestion({message, language})` returns direct MongoDB answers at high confidence; otherwise optionally invokes OpenAI; OpenAI errors fall back to MongoDB suggestions/fallback.

- [ ] Add failing tests for direct answer without OpenAI, low-confidence fallback, and OpenAI quota failure fallback.
- [ ] Run focused tests and confirm failure.
- [ ] Implement orchestration with an explicit high-confidence threshold and localized fallback text.
- [ ] Run focused tests and confirm pass.

### Task 4: No-OpenAI basic seed command

**Files:**
- Create: `server/scripts/seedAssistantBasic.js`
- Modify: `server/package.json`
- Modify: `docs/AI_ASSISTANT_SETUP.md`

**Interfaces:**
- Produces `npm run seed:assistant-basic` which upserts bilingual knowledge without embeddings or OpenAI.

- [ ] Add script that connects using `MONGODB_URI`, upserts by client/language/key, and never reads `OPENAI_API_KEY`.
- [ ] Add npm script.
- [ ] Document free/basic mode and optional AI upgrade path.

### Task 5: Verification and integration

**Files:**
- Reuse: `.github/workflows/verify-ai-assistant.yml`

- [ ] Run full server tests in GitHub Actions.
- [ ] Run full client tests in GitHub Actions.
- [ ] Run production client build in GitHub Actions.
- [ ] Fix failures before merge.
- [ ] Open PR to `main` and merge only after fresh green CI evidence.
