import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAnalyticsConsent,
  initializeAnalytics,
  isAnalyticsConfigured,
  setAnalyticsConsent,
  trackPageView,
} from '../service/analyticsService';

function AnalyticsConsent() {
  const { t } = useTranslation();
  const [consent, setConsent] = useState(getAnalyticsConsent);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    if (consent === 'granted') initializeAnalytics();

    const showPreferences = () => setPreferencesOpen(true);
    window.addEventListener('open-analytics-preferences', showPreferences);
    return () => window.removeEventListener('open-analytics-preferences', showPreferences);
  }, [consent]);

  if (!isAnalyticsConfigured || (consent && !preferencesOpen)) return null;

  const chooseConsent = (nextConsent) => {
    setAnalyticsConsent(nextConsent);
    setConsent(nextConsent);
    setPreferencesOpen(false);
    if (nextConsent === 'granted') {
      trackPageView(`${window.location.pathname}${window.location.search}`);
    }
  };

  return (
    <aside className="analytics-consent" role="dialog" aria-modal="true" aria-labelledby="analytics-consent-title">
      <div>
        <strong id="analytics-consent-title">{t('Help us improve the workshop')}</strong>
        <p>{t('With your permission, shopping analytics help us understand which products and pages are useful. Advertising cookies stay disabled.')}</p>
      </div>
      <div className="analytics-consent-actions">
        <button type="button" className="analytics-decline" onClick={() => chooseConsent('denied')}>{t('Decline analytics')}</button>
        <button type="button" className="analytics-accept" onClick={() => chooseConsent('granted')}>{t('Allow analytics')}</button>
      </div>
    </aside>
  );
}

export default AnalyticsConsent;
