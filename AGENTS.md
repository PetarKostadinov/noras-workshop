# Repository instructions

## Start here

This repository is **Nora's Workshop**, a full-stack ecommerce portfolio application. Before making a non-trivial change, read [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md). Treat the code as the source of truth if documentation and implementation differ.

## Working rules

- Preserve the existing architecture unless the task explicitly calls for a migration: React 18/Create React App in `client/`, Express/Mongoose ES modules in `server/`, and MongoDB for persistence.
- Keep browser/API contracts synchronized. When a route, request field, response shape, model field, authentication rule, price calculation, or status value changes, update every caller and update `docs/PROJECT_CONTEXT.md` in the same change.
- Keep `README.md` user-facing. Update it when setup, environment variables, scripts, supported features, or deployment requirements change.
- Never commit secrets or expose `PAYPAL_CLIENT_SECRET` to the browser. Use `server/.env.example` for documented configuration.
- Treat all prices and payment results from the client as untrusted. Product availability, prices, totals, order ownership, PayPal captures, and Stripe Checkout Sessions must continue to be verified on the server.
- Never collect or store raw card numbers, expiry dates, or CVC values. Card entry belongs on Stripe-hosted Checkout. Keep `/api/stripe/webhook` mounted with `express.raw(...)` before global JSON parsing or Stripe signature verification will fail.
- Preserve ownership checks on order routes. Admin UI guards are not server authorization.
- Follow existing naming and file placement unless improving them is part of the requested work. Do not perform unrelated cleanup.
- Do not edit generated/dependency folders (`node_modules/`, `client/build/`) or lockfiles unless dependencies actually change.
- The working tree may contain user changes. Inspect `git status`, preserve unrelated edits, and never discard them.

## Implementation map

- Client route composition: `client/src/App.js`
- Global client state and local-storage persistence: `client/src/helpersComponents/Store.js`
- API calls and calculations: `client/src/service/`
- Shared styling: `client/src/index.css` (large global stylesheet)
- API entry point and mounted routers: `server/server.js`
- HTTP handlers: `server/routes/`
- Database schemas: `server/models/`
- JWT helpers: `server/utils.js`
- Development seed data: `server/data/testProducts.js`

## Validation

Run the narrowest useful checks first, then broader checks when warranted.

- Client production build: `cd client && npm run build`
- Client tests, non-watch mode: `cd client && npm test -- --watchAll=false`
- Server: there is currently no real automated test suite; inspect affected routes and perform a focused API smoke test when MongoDB/configuration are available.
- For a full manual run, start `server/` and `client/` in separate terminals as described in `README.md`.

Do not claim server tests passed when only the placeholder `server` test script exists. Report skipped checks and their reason.

## Documentation maintenance (required)

At the end of every change, decide whether the repository's durable context changed. Update `docs/PROJECT_CONTEXT.md` when any of these change:

- architecture, directories, entry points, or state ownership;
- routes, API contracts, schemas, authentication/authorization, or integrations;
- checkout, pricing, inventory, payment, or order-status behavior;
- commands, environment variables, runtime prerequisites, or testing strategy;
- project-wide conventions, invariants, or known high-impact limitations.

Update this `AGENTS.md` only when agent workflow or repository-wide contribution rules change. Do not add transient task notes, debugging history, speculative plans, or exhaustive file listings to either file.
