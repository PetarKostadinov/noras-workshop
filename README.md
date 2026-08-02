# Nora's Atelier

Full-stack ecommerce application for handmade gifts, wedding and event decorations, and photography studio décor.

Nora's Atelier is a portfolio project demonstrating a complete shopping flow—from browsing and filtering products through account registration, delivery details, order review, order creation, and PayPal payment.

## Features

- Responsive boutique storefront and product catalog
- Product search, category, price, rating, and sorting filters
- Product details and inventory-aware cart controls
- Persistent cart, delivery address, and payment selection
- JWT-based registration, login, and protected account routes
- Multi-step checkout with delivery, payment, and order review
- Order creation, order history, and order-status pages
- PayPal checkout integration
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

## Project structure

~~~text
shoppingCart/
├── client/
│   ├── public/              # Static images and browser metadata
│   └── src/
│       ├── components/      # Pages and reusable UI components
│       ├── helpersComponents/
│       └── service/         # Client API and calculation helpers
├── server/
│   ├── data/                # Development seed products
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
MONGODB_URI="mongodb://127.0.0.1:27017/shoppingcart"
JWT_SECRET="replace-with-a-long-random-secret"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_ENVIRONMENT="sandbox"
~~~

Generate a strong value for JWT_SECRET. Never commit server/.env.

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

## Add development products

With the server running, seed the sample Nora's Atelier products:

~~~bash
curl -X POST http://localhost:5000/api/seed/products
~~~

PowerShell:

~~~powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/seed/products
~~~

The operation is repeatable: products are updated by slug instead of duplicated. The seed endpoint is intended for local development and should be disabled or protected before production deployment.
The server returns 404 for this endpoint when `NODE_ENV=production`.

## Available scripts

From client/:

~~~bash
npm start       # Start the React development server
npm run build   # Create an optimized production build
npm test        # Run the React test runner
~~~

From server/:

~~~bash
npm start       # Start the API with nodemon
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
| POST | /api/seed/products | Add or update development products |

## Payment notes

PayPal is the currently implemented payment provider. Configure both `PAYPAL_CLIENT_ID` and the server-only `PAYPAL_CLIENT_SECRET`, then set `PAYPAL_ENVIRONMENT` to `sandbox` or `live`. Orders remain in an awaiting-payment state until the server captures and verifies the PayPal transaction. Never expose the client secret in client-side environment files. The card-payment option is intentionally marked as coming soon.

## Production checklist

Before deploying:

- Use a strong production JWT_SECRET
- Configure a production MongoDB URI
- Configure the correct PayPal client ID, secret, and live environment
- Set `NODE_ENV=production` so the development seed endpoint is disabled
- Keep product-management API routes restricted to administrators
- Set the frontend/API deployment URLs and CORS policy as required

## Author

Petar Kostadinov

- [GitHub](https://github.com/PetarKostadinov)
- [LinkedIn](https://www.linkedin.com/in/petar-kostadinov-759ba8213/)
