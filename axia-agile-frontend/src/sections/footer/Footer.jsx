import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import "./Footer.css";
import logo from "../../assets/logo.png";

const Footer = () => {
  return (
    <footer className="footer-landing">
      <div className="footer-container-landing">
        <div className="footer-logo">
           <img src={logo} alt="AxiaAgile Logo" />
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