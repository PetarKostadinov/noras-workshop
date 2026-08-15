# Assistant setup

Nora's Workshop stores assistant knowledge in MongoDB. Basic FAQ answering works without OpenAI. OpenAI is an optional enhancement for harder questions.

## Required server configuration for free/basic mode

```env
MONGODB_URI="your-mongodb-atlas-uri"
ASSISTANT_CLIENT_ID="noras-workshop"
```

Seed the bilingual knowledge from `server/`:

```bash
npm run seed:assistant-basic
```

This command does not call OpenAI. It upserts records by `clientId + language + key`, so it is safe to rerun.

## How basic mode works

1. `POST /api/assistant/message` validates and rate-limits the question.
2. The server loads active MongoDB knowledge for the configured client and language.
3. Exact question, keyword, and text overlap are scored deterministically.
4. High-confidence matches return the stored MongoDB answer directly with no OpenAI request.
5. Low-confidence questions return suggestions/contact guidance when OpenAI is unavailable.

The endpoint accepts at most 500 characters and supports `en` and `bg`.

## Optional OpenAI enhancement

To let GPT compose answers for lower-confidence questions, add:

```env
OPENAI_API_KEY="your-server-only-openai-api-key"
OPENAI_MODEL="gpt-5-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
ASSISTANT_VECTOR_INDEX="assistant_knowledge_vector"
```

`OPENAI_API_KEY` must never be exposed through a `REACT_APP_` variable or committed to the repository. If OpenAI has no quota, is unavailable, or returns an error, the public assistant falls back to MongoDB instead of failing.

The paid fallback sends only the current question and the best MongoDB knowledge matches to the Responses API. Common high-confidence FAQ questions do not incur OpenAI usage.

## Optional embeddings / Atlas Vector Search

The existing embedding seed remains available:

```bash
npm run seed:assistant-knowledge
```

It generates OpenAI embeddings and stores them on the same `knowledgeentries` records. If you use the vector index, create `assistant_knowledge_vector` on `knowledgeentries` with 1536 dimensions for `text-embedding-3-small`:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    { "type": "filter", "path": "clientId" },
    { "type": "filter", "path": "language" },
    { "type": "filter", "path": "active" }
  ]
}
```

Embeddings are optional; basic MongoDB FAQ functionality does not depend on this index.

MongoDB is the source of truth. Future admin editing should update the text/question/keywords in MongoDB and only regenerate embeddings when the embedding-based feature is enabled.
