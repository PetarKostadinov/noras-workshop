import { Link } from 'react-router-dom';

function CarouselComponent() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img
        className="hero-image"
        src="/images/noras-atelier-hero.jpg"
        alt="Handmade gifts and artisan event decorations"
      />
      <div className="hero-overlay">
        <div className="hero-content">
          <span className="hero-eyebrow">Made for meaningful moments</span>
          <h1 id="hero-title">Handmade details.<br />Unforgettable celebrations.</h1>
          <p>
            Thoughtful gifts, event styling, and handcrafted studio décor
            designed to make every story feel personal.
          </p>
          <div className="hero-actions">
            <Link to="/search" className="hero-primary-action">Explore the collection</Link>
            <Link to="/search?category=Studio%20Decor" className="hero-secondary-action">Studio backdrops</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CarouselComponent;
