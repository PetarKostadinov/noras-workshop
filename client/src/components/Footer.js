import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-accent" aria-hidden="true"></div>
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-brand-lockup">
              <img src="/images/noras-atelier-logo.png" alt="" />
              <span>
                <strong>Nora’s Atelier</strong>
                <small>Handmade gifts &amp; décor</small>
              </span>
            </Link>
            <p>
              Handmade gifts and thoughtful décor created for weddings,
              celebrations, photography studios, and every meaningful moment.
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
            <h2>Shop</h2>
            <Link to="/search">All products</Link>
            <Link to="/search?category=Handmade%20Gifts">Handmade gifts</Link>
            <Link to="/search?category=Wedding%20Decor">Wedding décor</Link>
            <Link to="/search?category=Event%20Decor">Event décor</Link>
            <Link to="/search?category=Studio%20Decor">Studio backdrops</Link>
          </nav>

          <nav className="footer-column" aria-label="Your account">
            <h2>Your account</h2>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
            <Link to="/cart">Shopping cart</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/orderhistory">Order history</Link>
          </nav>

          <div className="footer-column footer-contact">
            <h2>Let’s create something</h2>
            <p>Questions about a gift, event setup, or custom studio styling?</p>
            <a href="mailto:petar_vs@outlook.com">
              <i className="far fa-envelope" aria-hidden="true"></i>
              petar_vs@outlook.com
            </a>
            <span>
              <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
              Burgas, Bulgaria
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Nora’s Atelier. Portfolio ecommerce project.</p>
          <div>
            <span><i className="fas fa-lock" aria-hidden="true"></i> Secure shopping</span>
            <span><i className="fas fa-leaf" aria-hidden="true"></i> Thoughtfully made</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
