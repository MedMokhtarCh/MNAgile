import React from 'react';
import "./about.css";
import logo from "../../assets/logo.png";

const About = () => {
  return (
    <section id="about" className="about-section">
      <div className="about-container">
        <div className="logo-container-about">
          <div className="logo-wrapper">
            <img src={logo} alt="AxiaAgile Logo" className="logo-about" />
          </div>
        </div>
        <div className="about-content">
          <h2>À propos d'AxiaAgile</h2>
          <p>
            AxiaAgile est une plateforme innovante conçue pour simplifier la gestion 
            de projets Agile. Elle aide les équipes de développement à mieux 
            organiser leurs tâches, suivre l'avancement des projets en temps réel et 
            collaborer efficacement. Avec ses tableaux Kanban intéractifs, ses outils 
            de suivi visuel et ses notifications instantanées, AxiaAgile offre une 
            expérience fluide et intuitive pour optimiser la productivité et la réussite 
            des projets.
          </p>
          <div className="benefits">
            <div className="benefit-item">
              <span className="check-icon">✓</span>
              <span>Productivité accrue</span>
            </div>
            <div className="benefit-item">
              <span className="check-icon">✓</span>
              <span>Interface intuitive</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;