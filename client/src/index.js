import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import { HelmetProvider } from "react-helmet-async";
import StoreProvider from './helpersComponents/Store';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StoreProvider>
      <HelmetProvider>
        <PayPalScriptProvider deferLoading={true}> 
        {/* Setting deferLoading={true} is to optimize the initial load time of the application 
        and only load the PayPal script when it is actually needed */}
          <App />
        </PayPalScriptProvider>
      </HelmetProvider>
    </StoreProvider>
  </React.StrictMode>
);
