import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/navbar.css";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate(); 

 
  const handleNavigate = (route) => {
    navigate(route);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
      
        <div className="navbar-left">
          <div className="navbar-logo">
            <img src={logo} alt="Axia Agile" />
          </div>
          <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          
            <a href="#About">À propos</a>
            <a href="#Features">Fonctionnalités</a>
            <a href="#Services">Services</a>
          </div>
        </div>

     
        <div className="navbar-right">
          <button className="btn-create" onClick={() => handleNavigate("/dashboard")}>Créer un compte</button>
          <button className="btn-login" onClick={() => handleNavigate("/dashboard")}>Se connecter</button>
        </div>

        <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
