# Nora's Workshop project context

Last reviewed against the repository: 2026-08-08.

This file records durable facts that help future contributors make safe changes. It is not a backlog. Verify details in code when working in an affected area and keep this file synchronized with app-wide changes, as required by the root `AGENTS.md`.

## Product and main flows

Nora's Workshop is a responsive ecommerce portfolio application for handmade gifts, wedding/event decorations, and photography-studio decor. The primary user journey is:

1. Browse the home catalog or search/filter products.
2. View a product and add an inventory-limited quantity to the cart.
3. Continue to checkout as a guest or signed-in customer and provide contact and delivery details.
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
| Analytics | Optional consent-gated Google Analytics 4 ecommerce funnel events configured at client build time |

For a single-service production deployment, `render.yaml` builds the CRA client and starts Express. When `NODE_ENV=production`, Express serves `client/build`, uses the same origin for browser and API traffic, and falls back to `index.html` for client-side routes. `/api/health` is the deployment health-check endpoint.

Production HTML responses receive server-injected canonical, Open Graph, and Twitter metadata. Product routes use the stored cover image and product copy; private, checkout, search, and unknown routes receive `noindex, nofollow`. `/sitemap.xml` is generated from public static routes and current products using `CLIENT_URL` (or the request origin), while `/robots.txt` links to it and excludes account, admin, and order paths.

`/google-products.xml` generates a Google Merchant RSS/XML feed from current products. It publishes USD prices, current inventory availability, canonical product URLs, the cover and additional images, `new` condition, stored brand, the stable product ID as the workshop-assigned MPN, and the catalog category as product type. Merchant Center owns target-country, shipping, returns, and refresh settings.

When `GOOGLE_SITE_VERIFICATION` is configured, production HTML also receives an escaped Google Search Console ownership meta tag. Store only the HTML tag's `content` value in the environment variable and keep it configured so ownership remains verifiable.

The client provider order in `client/src/index.js` is `StoreProvider` -> `HelmetProvider` -> deferred `PayPalScriptProvider` -> `App`. PayPal's browser script is loaded only on the payment/order flow after the public client ID is fetched.

Stripe uses hosted Checkout rather than a client provider. `server/server.js` mounts `/api/stripe/webhook` with `express.raw({ type: 'application/json' })` before `express.json()`. Preserve this middleware order: Stripe signature verification requires the untouched request body.

## Client structure and state

`client/src/App.js` owns browser routes. Public pages include home, search, cart, login, registration, checkout, product and order details, the bilingual workshop story at `/about`, `/legal/privacy`, `/legal/cookies`, and the customer-care routes `/help/shipping`, `/help/returns`, and `/help/faq`. Guests may build a cart and complete checkout; accounts remain optional for order history and profile management. `Protected` safely preserves requested internal account routes through login/registration; malformed or external redirect targets fall back to `/`. `AdminRoute` guards the admin dashboard and product management screens in the browser.

The home shell remains in the initial client bundle; product detail, search, cart, checkout, account, informational, and admin route components are loaded through `React.lazy` under a shared `Suspense` loading status to reduce initial JavaScript work.

Product-detail pages expose the stored product name, gallery images, description, brand, category, price, availability, optional materials/dimensions, and optional aggregate rating as schema.org `Product` structured data. Optional materials, dimensions, and preparation time are managed in the admin product forms and displayed when present. Up to three highly rated, recent products from the same category are recommended below the product content, excluding the current product. Product pages also link customers to the existing shipping/returns guidance and to a pre-addressed custom-product email enquiry; these presentation features do not change inventory or checkout behavior.

`client/src/helpersComponents/Store.js` is the global store. Durable browser keys are:

- `userInfo`: signed-in user details and bearer token;
- `cartItems`: cart product snapshots and quantities;
- `shippingInfo`: checkout delivery address;
- `paymentMethod`: selected payment method;
- `language`: selected interface language (`en` or `bg`), owned by i18next rather than the global store.
- `analyticsConsent`: the visitor's explicit `granted` or `denied` analytics choice, owned by the analytics integration.
- `analyticsTrackedPurchases`: a bounded list used to prevent duplicate GA4 purchase events after refreshes.
- `guestOrderAccess`: per-order guest access tokens retained in the browser so a guest can return from Stripe or revisit an order without gaining access to any other order.

Services in `client/src/service/` contain API calls and the client-side cart-total preview. Components still contain some direct Axios calls, notably the PayPal/order-final step. The home catalog uses the server-paginated search endpoint with six products per page. When changing API contracts, search both `service/` and components.

Consent-gated GA4 measurement covers `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, and deduplicated paid `purchase` events. A custom `checkout_error` event reports only the checkout stage, broad error type, and payment method; it must not include personal details, payment data, or raw error messages.

`client/src/index.css` is the ordered stylesheet entry point. It imports global design tokens/foundations from `client/src/styles/base.css`, reusable component styles from `client/src/styles/components/`, and route-oriented styles from `client/src/styles/pages/`. Preserve the import order when rules depend on later overrides, reuse the shared custom properties in `:root`, and check desktop, tablet, and mobile behavior after broad UI changes.

Global accessibility foundations include a keyboard skip link, consistent `:focus-visible` treatment, a polite route-change announcer, and reduced-motion overrides. The mobile catalog filter returns focus to its trigger and closes with Escape. Keep meaningful image alternatives, mark decorative icons/images appropriately, and lazy-load below-the-fold imagery while keeping likely largest-contentful images eager.

## Server structure and API

`server/server.js` loads environment configuration, JSON/form middleware, routers, the final error handler, MongoDB, and the HTTP listener.

Mounted route groups:

| Prefix | Responsibilities |
| --- | --- |
| `/api/products` | Catalog listing, search/filter/sort, categories, detail, customer reviews, product management, and admin image uploads |
| `/api/users` | Registration, login, and authenticated profile update |
| `/api/orders` | Server-priced order creation, owned order reads, PayPal capture, and Stripe Checkout creation/sync |
| `/api/admin` | Current-admin-only dashboard totals plus paginated product, order, and user management lists |
| `/api/stripe/webhook` | Signed Stripe Checkout completion events (raw request body) |
| `/api/keys/paypal` | Returns only the public PayPal client ID when server credentials are configured |

Relevant model vocabulary:

- Product inventory is named `countMany` (not `stock`). Product identity uses MongoDB `_id` plus a unique `slug`; names are also unique. A product keeps the required `image` cover URL for compatibility and up to six ordered URLs in `images`; older records without `images` render their cover as a one-image gallery. `materials`, `dimensions`, and `preparationTime` are optional trimmed display strings, allowing existing products to remain valid. Product mutations require a current admin account on the server, not merely an admin claim in an old token.
- Product edits submit the complete editable product record. Required text fields are trimmed and cannot be blank; numeric price, inventory, rating, and review constraints are enforced by the product schema.
- Public product-detail endpoints reject malformed MongoDB identifiers with HTTP 400 and return HTTP 404 for valid identifiers that do not match a product.
- Admin product images are uploaded individually as raw JPG, PNG, WebP, or GIF bodies (maximum 5 MB each) through `POST /api/products/upload`. The server uploads them to the `noras-workshop/products` Cloudinary folder and returns `{ image: <secure URL> }`; the ordered secure URLs are stored with the product and the first is synchronized to the compatibility `image` cover field. Product image values must be HTTP(S) URLs; the server has no local product-image storage or serving route.
- Gallery changes for an existing product are persisted immediately through the admin-only `PATCH /api/products/:id/images` endpoint, preventing successful Cloudinary uploads from remaining unsaved when the editor is refreshed. New-product galleries are persisted with product creation.
- Reviews use a dedicated collection with a unique product/user pair. Submission requires an account, accepts an integer 1–5 rating and 10–1000 character comment, and derives `verifiedPurchase` from a paid account order containing the product. Public product details include reviews but not reviewer account IDs. Administrators may remove reviews; product `rating` and `numReviews` are server-derived from review records and synchronized at startup, so the admin product editor cannot set them.
- An order embeds product display snapshots but retains a `product` ObjectId reference. Its `user` reference is optional for guest orders; every new order stores a validated contact email. Guest access uses a random 256-bit token returned once to the browser while only its SHA-256 hash is stored with the order.
- Order payment statuses: `pending`, `processing`, `paid`, `failed`, `refunded`, `expired`.
- Order fulfillment statuses: `awaiting_payment`, `processing`, `shipped`, `delivered`, `cancelled`.
- Users have `isAdmin`; the JWT repeats this flag. Password hashes are excluded from ordinary user queries and requested explicitly only during login.

Authenticated requests use `Authorization: Bearer <token>`. The order lookup helper restricts normal users to their own orders and permits admins to retrieve any order only after confirming their current database role, so revoking administrator access takes effect even for an existing token. Guest order reads and payment actions require `X-Guest-Order-Token`; its hash must match that specific guest order. Account order history remains authenticated. Login and registration share a per-client, in-memory request limit of 20 attempts per 15 minutes; order creation is limited to 10 attempts per client per 15 minutes.

## Commerce and payment invariants

These rules are security-sensitive and must remain aligned across UI, API, and documentation:

- The server ignores client-supplied prices/totals during order creation and reloads products from MongoDB.
- Quantities must be positive integers and must not exceed `countMany`.
- Creating an order atomically reserves each requested quantity by decrementing `countMany`. If any reservation or the order save fails, already reserved quantities are restored.
- New unpaid orders receive an `expiresAt` reservation deadline (60 minutes by default, configurable with `ORDER_RESERVATION_MINUTES`, clamped to 31 minutes–24 hours). A background pass and lazy order access expire due `pending`/`failed` reservations, restore every item within the same MongoDB transaction, and record `inventoryRestoredAt` so restoration cannot happen twice. Orders already under provider review remain reserved. Stripe Checkout Sessions use the same deadline, and expired orders cannot start or complete payment. The MongoDB deployment must support transactions (MongoDB Atlas does); this is required for atomic multi-product restoration.
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
- `NODE_ENV`
- `CLIENT_URL` (public client origin used for Stripe return URLs)
- `ORDER_RESERVATION_MINUTES` (optional unpaid inventory reservation duration; defaults to 60)
- `GOOGLE_SITE_VERIFICATION` (optional Search Console HTML-tag content value)
- `STRIPE_SECRET_KEY` (server-only Stripe API key)
- `STRIPE_WEBHOOK_SECRET` (server-only endpoint signing secret)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET` (server-only)

Optional client build configuration in `client/.env`:

- `REACT_APP_GA_MEASUREMENT_ID` enables Google Analytics 4 only after visitor consent. If omitted, the consent interface and Google script remain disabled.

Use Node.js 18 or newer because server code relies on the built-in `fetch` implementation.

Common commands:

```text
server: npm start
server development watch mode: npm run dev
client: npm start
client production check: npm run build
client tests once: npm test -- --watchAll=false
local Stripe events: stripe listen --forward-to http://localhost:5000/api/stripe/webhook
```

Render deployment uses `npm install --prefix server && npm install --prefix client && npm run build --prefix client` followed by `node server/server.js`. Render supplies `PORT`; the Blueprint requests the remaining production secrets. `CLIENT_URL` must be the final public origin used for Stripe return URLs.

The server uses Node's built-in test runner (`npm test`) for focused unit tests. Database-backed route coverage remains limited, so perform focused API smoke tests when MongoDB and integration credentials are available.

## Known risks and legacy constraints

- Client API access is split between services, direct Fetch, and Axios. Avoid assuming a single data-access abstraction.

## Definition of done for broad changes

For changes that cross layers, verify the complete path: component/route -> client state or service -> HTTP contract -> auth/ownership -> Mongoose model -> persistence/integration -> user-visible error and success states. Update this file when the resulting durable behavior differs from what is recorded above.
