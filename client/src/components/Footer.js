import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAnalyticsConfigured } from '../service/analyticsService';

function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <div className="footer-accent" aria-hidden="true"></div>
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-brand-lockup">
              <img src="/images/noras-workshop-logo.png" alt="" />
              <span>
                <strong>Nora’s Workshop</strong>
                <small>{t('Handmade gifts & décor')}</small>
              </span>
            </Link>
            <p>
              {t('Handmade gifts and thoughtful décor created for weddings, celebrations, photography studios, and every meaningful moment.')}
            </p>
            <div className="footer-socials" aria-label="Social links">
              <a href="https://www.linkedin.com/in/petar-kostadinov-759ba8213/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in" aria-hidden="true"></i>
              </a>
              <a href="https://github.com/PetarKostadinov" target="_blank" rel="noreferrer" aria-label="GitHub">
                <i className="fab fa-github" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          <nav className="footer-column" aria-label="Shop">
            <h2>{t('Shop')}</h2>
            <Link to="/search">{t('All products')}</Link>
            <Link to="/search?category=Handmade%20Gifts">{t('Handmade gifts')}</Link>
            <Link to="/search?category=Wedding%20Decor">{t('Wedding décor')}</Link>
            <Link to="/search?category=Event%20Decor">{t('Event décor')}</Link>
            <Link to="/search?category=Studio%20Decor">{t('Studio backdrops')}</Link>
          </nav>

          <nav className="footer-column" aria-label="Your account">
            <h2>{t('Your account')}</h2>
            <Link to="/login">{t('Sign in')}</Link>
            <Link to="/register">{t('Create account')}</Link>
            <Link to="/cart">{t('Shopping cart')}</Link>
            <Link to="/profile">{t('Profile')}</Link>
            <Link to="/orderhistory">{t('Order history')}</Link>
          </nav>

          <div className="footer-column footer-contact">
            <h2>{t('Let’s create something')}</h2>
            <p>{t('Questions about a gift, event setup, or custom studio styling?')}</p>
            <a href="mailto:petar_vs@outlook.com">
              <i className="far fa-envelope" aria-hidden="true"></i>
              petar_vs@outlook.com
            </a>
            <span>
              <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
              {t('Burgas, Bulgaria')}
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Nora’s Workshop. {t('Portfolio ecommerce project.')}</p>
          <div>
            <span><i className="fas fa-lock" aria-hidden="true"></i> {t('Secure shopping')}</span>
            <span><i className="fas fa-leaf" aria-hidden="true"></i> {t('Thoughtfully made')}</span>
            {isAnalyticsConfigured && (
              <button type="button" className="footer-privacy-button" onClick={() => window.dispatchEvent(new Event('open-analytics-preferences'))}>
                {t('Analytics settings')}
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
