import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./features.css";
import kanbanImage from "../../assets/Kanban.png";
import rapportsImage from "../../assets/rapports.jpg";
import messagerieImage from "../../assets/messages.jpg";

const Features = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    { title: "Notifications instantanées", description: "Restez informé en temps réel de l'avancement de vos projets." },
    { title: "Tableaux Kanban dynamiques", description: "Organisez et suivez vos tâches efficacement." },
    { title: "Rapports et dashboard", description: "Analysez vos données avec des visualisations claires." },
    { title: "Calendrier interactif", description: "Planifiez et gérez vos échéances facilement." }
  ];

  const slides = [
    { title: "KANBAN", description: "Organisez et suivez vos tâches visuellement.", image: kanbanImage },
    { title: "RAPPORTS", description: "Visualisez des rapports détaillés en temps réel.", image: rapportsImage },
    { title: "MESSAGERIE", description: "Échangez avec votre équipe instantanément.", image: messagerieImage }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="features-container">
      <section id="features" className="features-header">
        <div className="blue-shapes"></div>
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          Fonctionnalités Clés - Pourquoi choisir AxiaAgile ?
        </motion.h1>
        <motion.p className="subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          Axia Agile met à votre disposition des outils collaboratifs pour optimiser la gestion de vos projets.
        </motion.p>
        <div className="features-list">
          {features.map((feature, index) => (
            <motion.div key={index} className="feature-item" whileHover={{ scale: 1.05 }}>
              <span className="checkmark">✓</span>
              <span className="feature-text">{feature.title}</span>
            </motion.div>
          ))}
        </div>
        <motion.button className="start-button" whileHover={{ scale: 1.1 }}>
          Commencer
        </motion.button>
      </section>

      <section className="features-slider">
        <button className="slider-button prev" onClick={prevSlide}>‹</button>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="slide"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <h2>{slides[currentSlide].title}</h2>
            <div className="slide-content">
              <img src={slides[currentSlide].image} alt={slides[currentSlide].title} />
              <p>{slides[currentSlide].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        <button className="slider-button next" onClick={nextSlide}>›</button>
        <div className="slider-dots">
          {slides.map((_, index) => (
            <span key={index} className={`dot ${currentSlide === index ? "active" : ""}`} onClick={() => setCurrentSlide(index)} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Features;
