import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom'; // Importer useNavigate
import "./hero.css"; 
import HeroImage from "../../assets/Hero.png"; 

const Hero = () => {
  const navigate = useNavigate(); // Hook pour gérer la navigation

  const handleDiscoverClick = () => {
    navigate('/login'); // Rediriger vers la page de connexion
  };

  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <h1>Révolutionnez Votre Gestion de Projets Agile</h1>
          <p>
            Axia Agile est une plateforme innovante conçue pour simplifier la gestion
            de projets agile. Elle aide les équipes de développement à mieux
            organiser leur travail et à atteindre leurs objectifs efficacement.
          </p>
       
          <Button className="btn-pro" onClick={handleDiscoverClick}>
            Découvrez Axia-Agile
          </Button>
        </div>
    
        <div className="hero-image">
          <div className="image-wrapper">
            <img 
              src={HeroImage} 
              alt="Image Description" 
            />
          </div>
          <div className="geometric-shapes">
            <div className="circle" style={{ top: '20%', left: '10%' }}></div>
            <div className="circle" style={{ top: '30%', left: '70%' }}></div>
            <div className="circle" style={{ top: '60%', left: '50%' }}></div>
            <div className="circle" style={{ top: '80%', left: '20%' }}></div>
            <div className="circle" style={{ top: '10%', left: '80%' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;