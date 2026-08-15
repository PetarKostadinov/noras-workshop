# AI assistant setup

Nora's Workshop stores assistant knowledge and embeddings in MongoDB. The public FAQ widget sends only the current question and language to the Express API; chat messages are not persisted by this feature.

## Required server configuration

Add these values to `server/.env`:

```env
OPENAI_API_KEY="your-server-only-openai-api-key"
OPENAI_MODEL="gpt-5-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
ASSISTANT_CLIENT_ID="noras-workshop"
ASSISTANT_VECTOR_INDEX="assistant_knowledge_vector"
```

`OPENAI_API_KEY` must never be exposed through a `REACT_APP_` variable or committed to the repository.

## MongoDB Atlas Vector Search index

The assistant requires MongoDB Atlas Vector Search. Create an index named `assistant_knowledge_vector` on the collection MongoDB creates for the `KnowledgeEntry` model (`knowledgeentries` by default).

For the default `text-embedding-3-small` model, use 1536 dimensions:

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

If the embedding model or its dimensions change, recreate the vector index with matching dimensions and reseed every knowledge entry before serving assistant traffic.

## Seed initial knowledge

From `server/` run:

```bash
npm run seed:assistant-knowledge
```

The command embeds and upserts the bilingual Nora FAQ records by `clientId + language + key`. Re-running it updates existing records instead of creating duplicates.

MongoDB is the source of truth after seeding. Future admin knowledge editing should update the knowledge record and regenerate that record's embedding in the same server-side operation.

## Request flow

1. `POST /api/assistant/message` validates and rate-limits the public question.
2. The server creates one embedding for the question.
3. Atlas Vector Search retrieves up to five active records filtered to the configured client and requested language.
4. The server sends only the retrieved Nora context plus the question to the OpenAI Responses API.
5. The model must use retrieved knowledge for Nora-specific facts. It may give general gift/decor advice, but must not present general knowledge as a Nora-specific fact.

The endpoint accepts at most 500 characters and supports `en` and `bg`.
