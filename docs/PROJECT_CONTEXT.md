# Nora's Atelier project context

Last reviewed against the repository: 2026-08-02.

This file records durable facts that help future contributors make safe changes. It is not a backlog. Verify details in code when working in an affected area and keep this file synchronized with app-wide changes, as required by the root `AGENTS.md`.

## Product and main flows

Nora's Atelier is a responsive ecommerce portfolio application for handmade gifts, wedding/event decorations, and photography-studio decor. The primary user journey is:

1. Browse the home catalog or search/filter products.
2. View a product and add an inventory-limited quantity to the cart.
3. Continue to checkout; guests must register or sign in, retain their cart, and return to the checkout step they requested.
4. Enter shipping details and select PayPal or debit/credit card.
5. Review the order; the server reconstructs products and totals before saving it.
6. Complete payment; the server verifies PayPal captures or Stripe Checkout through a signed webhook/server lookup.
7. View the resulting order and order history.

Admin-facing screens allow product creation, editing, and deletion. See **Known risks** for the current server-side authorization gap.

## Runtime architecture

| Area | Current design |
| --- | --- |
| Browser | React 18, Create React App, React Router 6, React Bootstrap/Bootstrap |
| State | React Context + `useReducer`; selected auth/cart/checkout/product state persists in `localStorage` |
| Localization | `react-i18next` with English fallback, Bulgarian UI translations, and a persistent `language` local-storage preference |
| API access | A mix of Fetch API and Axios; client uses relative `/api/...` URLs |
| Development routing | CRA client on port 3000 proxies to Express on port 5000 |
| API | Node/Express using ES modules (`server/package.json` has `type: module`) |
| Database | MongoDB through Mongoose |
| Authentication | 30-day bearer JWT containing user id, username, email, and `isAdmin` |
| Payments | PayPal JS SDK plus Stripe-hosted card checkout; payment creation and verification remain server-side |

The client provider order in `client/src/index.js` is `StoreProvider` -> `HelmetProvider` -> deferred `PayPalScriptProvider` -> `App`. PayPal's browser script is loaded only on the payment/order flow after the public client ID is fetched.

Stripe uses hosted Checkout rather than a client provider. `server/server.js` mounts `/api/stripe/webhook` with `express.raw({ type: 'application/json' })` before `express.json()`. Preserve this middleware order: Stripe signature verification requires the untouched request body.

## Client structure and state

`client/src/App.js` owns browser routes. Public pages include home, search, cart, login, registration, and product details. Guests may build and persist a cart, but checkout and order pages require an account. `Protected` safely preserves the requested internal route through login/registration; malformed or external redirect targets fall back to `/`. `AdminRoute` guards the admin dashboard and product management screens in the browser.

`client/src/helpersComponents/Store.js` is the global store. Durable browser keys are:

- `userInfo`: signed-in user details and bearer token;
- `cartItems`: cart product snapshots and quantities;
- `shippingInfo`: checkout delivery address;
- `paymentMethod`: selected payment method;
- `currItem`: most recently fetched product detail.
- `language`: selected interface language (`en` or `bg`), owned by i18next rather than the global store.

Services in `client/src/service/` contain API calls and the client-side cart-total preview. Components still contain some direct Axios calls, notably the PayPal/order-final step. When changing API contracts, search both `service/` and components.

`client/src/index.css` is a single large global stylesheet. Reuse existing layout variables/classes where practical and check desktop, tablet, and mobile behavior after broad UI changes.

## Server structure and API

`server/server.js` loads environment configuration, JSON/form middleware, routers, the final error handler, MongoDB, and the HTTP listener.

Mounted route groups:

| Prefix | Responsibilities |
| --- | --- |
| `/api/products` | Catalog listing, search/filter/sort, categories, detail, product management, and admin image uploads |
| `/api/users` | Registration, login, and authenticated profile update |
| `/api/orders` | Server-priced order creation, owned order reads, PayPal capture, and Stripe Checkout creation/sync |
| `/api/admin` | Current-admin-only dashboard totals plus paginated product, order, and user management lists |
| `/api/stripe/webhook` | Signed Stripe Checkout completion events (raw request body) |
| `/api/seed` | Repeatable development product seeding |
| `/api/keys/paypal` | Returns only the public PayPal client ID when server credentials are configured |

Relevant model vocabulary:

- Product inventory is named `countMany` (not `stock`). Product identity uses MongoDB `_id` plus a unique `slug`; names are also unique. Product mutations require a current admin account on the server, not merely an admin claim in an old token.
- Admin product images are uploaded as raw JPG, PNG, WebP, or GIF bodies (maximum 5 MB) through `POST /api/products/upload`. Files are stored in `server/uploads/` and served from `/uploads`; deployments must provide persistent writable storage for that directory or replace it with durable object storage.
- An order embeds product display snapshots but retains a `product` ObjectId reference.
- Order payment statuses: `pending`, `processing`, `paid`, `failed`, `refunded`.
- Order fulfillment statuses: `awaiting_payment`, `processing`, `shipped`, `delivered`, `cancelled`.
- Users have `isAdmin`; the JWT repeats this flag.

Authenticated requests use `Authorization: Bearer <token>`. The order lookup helper restricts normal users to their own orders and permits admins to retrieve any order.

## Commerce and payment invariants

These rules are security-sensitive and must remain aligned across UI, API, and documentation:

- The server ignores client-supplied prices/totals during order creation and reloads products from MongoDB.
- Quantities must be positive integers and must not exceed `countMany`.
- Creating an order atomically reserves each requested quantity by decrementing `countMany`. If any reservation or the order save fails, already reserved quantities are restored.
- Current pricing is USD: shipping is `$10` unless items exceed `$100`; tax is 15%; monetary results are rounded to two decimals.
- Newly created orders accept only `PayPal` or `Card` as the payment method, with `paymentStatus` set to `pending` and `fulfillmentStatus` set to `awaiting_payment`.
- A PayPal capture is accepted only when its currency is USD, its amount exactly matches the stored order total, and PayPal reports the expected completed state. Pending captures remain awaiting payment.
- Card details are collected only by Stripe-hosted Checkout. A card payment is accepted only when the signed event or server-retrieved Checkout Session matches the stored order, session ID, USD amount, and paid status.
- Stripe Checkout Sessions use an atomic attempt counter plus idempotency key. Reuse an open Session; create a new attempt only after the previous Session is no longer open.
- Client-reported payment completion is intentionally rejected (`PUT /api/orders/:id/pay` returns HTTP 410).
- PayPal live endpoints are used only when `PAYPAL_ENVIRONMENT=live`; every other value uses sandbox endpoints.

## Configuration and commands

Server configuration lives in uncommitted `server/.env`, documented by `server/.env.example`:

- `PORT` (normally 5000)
- `MONGODB_URI`
- `JWT_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET` (server-only)
- `PAYPAL_ENVIRONMENT` (`sandbox` or `live`)
- `NODE_ENV` (`production` disables the development seed endpoint)
- `CLIENT_URL` (public client origin used for Stripe return URLs)
- `STRIPE_SECRET_KEY` (server-only Stripe API key)
- `STRIPE_WEBHOOK_SECRET` (server-only endpoint signing secret)

Use Node.js 18 or newer because server code relies on the built-in `fetch` implementation.

Common commands:

```text
server: npm start
client: npm start
client production check: npm run build
client tests once: npm test -- --watchAll=false
local Stripe events: stripe listen --forward-to http://localhost:5000/api/stripe/webhook
```

There is no meaningful server test suite at present; its `npm test` script is a failing placeholder.

## Known risks and legacy constraints

- The development seed endpoint is intentionally available without authentication outside production and returns 404 when `NODE_ENV=production`. Do not broaden its production availability.
- `server/routes/userRuoter.js` contains the existing filename typo. Imports depend on it; rename it only as a deliberate coordinated change.
- Client API access is split between services, direct Fetch, and Axios. Avoid assuming a single data-access abstraction.
- Inventory is reserved when an order is created, but there is no automatic expiry/cancellation workflow to return inventory from abandoned unpaid orders. Add an explicit lifecycle before introducing order cancellation or payment timeouts.

## Definition of done for broad changes

For changes that cross layers, verify the complete path: component/route -> client state or service -> HTTP contract -> auth/ownership -> Mongoose model -> persistence/integration -> user-visible error and success states. Update this file when the resulting durable behavior differs from what is recorded above.
