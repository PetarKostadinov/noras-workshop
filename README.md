# Nora's Workshop

Full-stack ecommerce application for handmade gifts, wedding and event decorations, and photography studio décor.

Nora's Workshop is a portfolio project demonstrating a complete shopping flow—from browsing and filtering products through account registration, delivery details, order review, order creation, and secure PayPal or card payment.

## Live application

Nora's Workshop is deployed as a single React and Express service on Render:

- **Application:** [https://noras-workshop.onrender.com](https://noras-workshop.onrender.com/)
- **API health check:** [https://noras-workshop.onrender.com/api/health](https://noras-workshop.onrender.com/api/health)

The free Render service may sleep when idle, so the first request can take approximately one minute while the server starts.

## Features

- Responsive boutique storefront and product catalog
- Product search, category, price, rating, and sorting filters
- Product details and inventory-aware cart controls
- Persistent cart, delivery address, and payment selection
- JWT-based registration, login, and protected account routes
- Multi-step checkout with delivery, payment, and order review
- Order creation, order history, and order-status pages
- PayPal checkout integration
- Stripe-hosted Visa and debit/credit card checkout
- Admin-facing product creation and editing screens
- MongoDB-backed products, users, and orders
- Responsive layouts for desktop, tablet, and mobile

## Technology

### Client

- React 18
- React Router
- React Bootstrap and Bootstrap
- React Context with useReducer
- Axios and Fetch API
- React Helmet
- React Toastify
- PayPal React SDK

### Server

- Node.js
- Express
- MongoDB and Mongoose
- JSON Web Tokens
- bcrypt
- Stripe Node.js SDK and Stripe-hosted Checkout

## Project structure

~~~text
shoppingCart/
├── client/
│   ├── public/              # Static images and browser metadata
│   └── src/
│       ├── components/      # Pages and reusable UI components
│       ├── helpersComponents/
│       ├── service/         # Client API and calculation helpers
│       └── styles/          # Design tokens and component/page styles
├── server/
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express API routes
│   └── server.js            # API and database entry point
└── README.md
~~~

## Local setup

### Prerequisites

- Node.js 18 or newer
- npm
- A local MongoDB server or MongoDB Atlas connection

### 1. Clone the repository

~~~bash
git clone https://github.com/PetarKostadinov/shoppingCart.git
cd shoppingCart
~~~

### 2. Configure the server

Create server/.env using server/.env.example:

~~~env
PORT=5000
NODE_ENV="development"
MONGODB_URI="mongodb://127.0.0.1:27017/shoppingcart"
JWT_SECRET="replace-with-a-long-random-secret"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_ENVIRONMENT="sandbox"
CLIENT_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_replace_me"
STRIPE_WEBHOOK_SECRET="whsec_replace_me"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
~~~

Generate a strong value for JWT_SECRET. Never commit server/.env.

Optionally create `client/.env` from `client/.env.example` to enable consent-gated Google Analytics 4 ecommerce measurement:

~~~env
REACT_APP_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
~~~

When this value is omitted, no analytics prompt or Google Analytics script is shown or loaded.

### 3. Install dependencies

~~~bash
cd server
npm install

cd ../client
npm install
~~~

### 4. Start the application

Run the API from one terminal:

~~~bash
cd server
npm start
~~~

Run the React client from a second terminal:

~~~bash
cd client
npm start
~~~

The client runs at http://localhost:3000 and proxies API requests to http://localhost:5000.

## Deploy to Render

The repository includes `render.yaml` for a single Render Web Service. During deployment, Render installs both applications, builds the React client, and starts Express. In production, Express serves the React build and the `/api` routes from the same origin.

1. Push the repository to GitHub.
2. Create a free MongoDB Atlas cluster and copy its connection string.
3. In Render, choose **New > Blueprint**, connect the repository, and apply `render.yaml`.
4. Enter the requested secret environment variables. Set `MONGODB_URI`, generate a long random `JWT_SECRET`, set `CLIENT_URL` to `https://noras-workshop.onrender.com`, and copy the Cloudinary cloud name, API key, and API secret from your Cloudinary dashboard. Add PayPal and Stripe secrets when those payment methods are enabled. To enable analytics, add the public build-time value `REACT_APP_GA_MEASUREMENT_ID` separately.
5. After deployment, update `CLIENT_URL` if you attach a custom domain. In Stripe, register `https://YOUR_DOMAIN/api/stripe/webhook` and save its signing secret as `STRIPE_WEBHOOK_SECRET`.

Render supplies `PORT` automatically. Do not set it manually. Admin uploads are stored in the `noras-workshop/products` folder in Cloudinary, and only the returned HTTPS URL is saved with the MongoDB product. Images already bundled in `client/public/images/` are unaffected.

The deployed application is available at [https://noras-workshop.onrender.com](https://noras-workshop.onrender.com/). Render's free service can sleep when idle, so the first request after an idle period may be slow. This deployment is appropriate for a portfolio/demo; use a paid always-on service for a customer-facing store.

## Available scripts

From client/:

~~~bash
npm start       # Start the React development server
npm run build   # Create an optimized production build
npm test        # Run the React test runner
~~~

From server/:

~~~bash
npm start       # Start the API
npm run dev     # Start the API with nodemon and automatic restarts
npm test        # Run server unit tests
~~~

## Main API routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /api/products | List products |
| GET | /api/products/search | Search, filter, sort, and paginate |
| GET | /api/products/categories | List product categories |
| GET | /api/products/:id | Fetch one product |
| POST | /api/users/register | Create an account |
| POST | /api/users/login | Authenticate a user |
| PUT | /api/users/profile | Update the signed-in user's profile |
| POST | /api/orders | Create an order |
| GET | /api/orders/mine | Fetch the signed-in user's orders |
| GET | /api/orders/:id | Fetch an owned order |
| POST | /api/orders/:id/paypal-order | Create a server-verified PayPal transaction |
| PUT | /api/orders/:id/capture-paypal | Capture and verify a PayPal payment |
| POST | /api/orders/:id/stripe-checkout | Create or resume Stripe-hosted card checkout |
| PUT | /api/orders/:id/sync-stripe | Verify the current Stripe Checkout Session |
| POST | /api/stripe/webhook | Receive signed Stripe payment events |

## Payment notes

PayPal and Stripe-hosted card checkout are supported. Configure both `PAYPAL_CLIENT_ID` and the server-only `PAYPAL_CLIENT_SECRET`, then set `PAYPAL_ENVIRONMENT` to `sandbox` or `live`. For card checkout, configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the public client origin in `CLIENT_URL`. Forward Stripe events to `/api/stripe/webhook`; payment completion is accepted only after server-side Stripe verification. Never expose PayPal or Stripe secret keys in client-side environment files.

### Test Stripe card checkout locally

Use Stripe test-mode credentials only. With the API and client running, authenticate the Stripe CLI and forward signed events to the local webhook:

~~~powershell
stripe login
stripe listen --forward-to http://localhost:5000/api/stripe/webhook
~~~

Copy the `whsec_...` secret printed by `stripe listen` into `STRIPE_WEBHOOK_SECRET`, then restart the API while leaving the listener running. In Stripe-hosted Checkout, use `4242 4242 4242 4242`, any future expiry date, any three-digit CVC, and any postal code for a successful test payment. Test-mode payments appear in the Stripe Dashboard and never move real money.

For production, register the public HTTPS endpoint `https://YOUR_API_DOMAIN/api/stripe/webhook` in Stripe and subscribe it to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Use that endpoint's signing secret; it is different from the local Stripe CLI secret.

## Production checklist

Before deploying:

- Use a strong production JWT_SECRET
- Configure a production MongoDB URI
- Configure the correct PayPal client ID, secret, and live environment
- Configure live Stripe keys, the signed webhook endpoint, and the production `CLIENT_URL`
- Set `NODE_ENV=production`
- Keep product-management API routes restricted to administrators
- Set the frontend/API deployment URLs and CORS policy as required
- Configure Cloudinary for durable admin-uploaded product images

## Author

Petar Kostadinov

- [GitHub](https://github.com/PetarKostadinov)
- [LinkedIn](https://www.linkedin.com/in/petar-kostadinov-759ba8213/)
