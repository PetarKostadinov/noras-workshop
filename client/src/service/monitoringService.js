import * as Sentry from '@sentry/react';

const dsn = process.env.REACT_APP_SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      delete event.request.data;
      delete event.request.headers;
    }
    return event;
  },
});

export { Sentry };
