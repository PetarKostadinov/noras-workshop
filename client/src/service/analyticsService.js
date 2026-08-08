const MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID?.trim();
const CONSENT_KEY = 'analyticsConsent';
const TRACKED_PURCHASES_KEY = 'analyticsTrackedPurchases';

export const isAnalyticsConfigured = /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID || '');

export const getAnalyticsConsent = () => {
  const consent = localStorage.getItem(CONSENT_KEY);
  return consent === 'granted' || consent === 'denied' ? consent : null;
};

const gtag = function () {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments);
};

let initialized = false;
export const initializeAnalytics = () => {
  if (!isAnalyticsConfigured || getAnalyticsConsent() !== 'granted') return false;

  window.gtag = window.gtag || gtag;
  if (initialized) {
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    return true;
  }
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });

  if (!document.querySelector(`script[data-google-tag="${MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    script.dataset.googleTag = MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
  initialized = true;
  return true;
};

export const setAnalyticsConsent = (consent) => {
  localStorage.setItem(CONSENT_KEY, consent);
  if (consent === 'granted') initializeAnalytics();
  else if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
  window.dispatchEvent(new CustomEvent('analytics-consent-changed', { detail: consent }));
};

const canTrack = () => isAnalyticsConfigured
  && getAnalyticsConsent() === 'granted'
  && initializeAnalytics();

export const trackEvent = (name, parameters = {}) => {
  if (!canTrack()) return;
  window.gtag('event', name, parameters);
};

let lastTrackedPage = '';
export const trackPageView = (path) => {
  if (!canTrack() || path === lastTrackedPage) return;
  lastTrackedPage = path;
  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_path: path,
    page_title: document.title,
  });
};

export const toAnalyticsItem = (item, quantity = item.quantity || 1) => ({
  item_id: String(item._id || item.product || ''),
  item_name: item.name,
  item_brand: item.brand || "Nora's Workshop",
  item_category: item.category,
  price: Number(item.price),
  quantity: Number(quantity),
});

export const trackCartEvent = (name, items, extra = {}) => {
  const analyticsItems = items.map((item) => toAnalyticsItem(item));
  const value = analyticsItems.reduce((total, item) => total + item.price * item.quantity, 0);
  trackEvent(name, { currency: 'USD', value, items: analyticsItems, ...extra });
};

export const trackCheckoutError = (checkoutStep, error, paymentType) => {
  const status = Number(error?.response?.status);
  trackEvent('checkout_error', {
    checkout_step: checkoutStep,
    error_type: Number.isInteger(status) ? `http_${status}` : 'client_or_network_error',
    ...(paymentType ? { payment_type: paymentType } : {}),
  });
};

export const trackPurchase = (order) => {
  if (!order?.isPaid || !order._id || !canTrack()) return;

  let trackedPurchases = [];
  try {
    trackedPurchases = JSON.parse(localStorage.getItem(TRACKED_PURCHASES_KEY) || '[]');
    if (!Array.isArray(trackedPurchases)) trackedPurchases = [];
  } catch {
    trackedPurchases = [];
  }
  if (trackedPurchases.includes(order._id)) return;

  window.gtag('event', 'purchase', {
    transaction_id: order._id,
    value: Number(order.totalPrice),
    tax: Number(order.taxPrice),
    shipping: Number(order.shippingPrice),
    currency: 'USD',
    items: order.orderItems.map((item) => toAnalyticsItem(item)),
  });

  localStorage.setItem(
    TRACKED_PURCHASES_KEY,
    JSON.stringify([...trackedPurchases.slice(-49), order._id])
  );
};
