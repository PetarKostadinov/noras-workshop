import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function CarouselComponent() {
  const { t } = useTranslation();
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img
        className="hero-image"
        src="/images/noras-workshop-hero.jpg"
        alt={t('Handmade gifts and artisan event decorations')}
        loading="eager"
        decoding="async"
      />
      <div className="hero-overlay">
        <div className="hero-content">
          <span className="hero-eyebrow">{t('Made for meaningful moments')}</span>
          <h1 id="hero-title">{t('Handmade details.')}<br />{t('Unforgettable celebrations.')}</h1>
          <p>
            {t('Thoughtful gifts, event styling, and handcrafted studio décor designed to make every story feel personal.')}
          </p>
          <div className="hero-actions">
            <Link to="/search" className="hero-primary-action">{t('Explore the collection')}</Link>
            <Link to="/search?category=Studio%20Decor" className="hero-secondary-action">{t('Studio backdrops')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CarouselComponent;
