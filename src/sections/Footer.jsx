import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">
          <a href="/">
            <span className="logo-text">Axia-Agile</span>
          </a>
        </div>
        
        <div className="footer-copyright">
          <p>© 2025 All rights reserved</p>
        </div>

        <div className="footer-social">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
            <FaFacebookF />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
            <FaTwitter />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">
            <FaInstagram />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">
            <FaLinkedinIn />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
