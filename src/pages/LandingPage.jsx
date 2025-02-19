import React, { useState, useEffect } from "react";
import { AiOutlineArrowUp } from "react-icons/ai"; // Icône de flèche
import Navbar from "../sections/Navbar";
import Hero from "../sections/Hero";
import Features from "../sections/Features";
import Services from "../sections/Services";
import FAQ from "../sections/FAQ";
import About from "../sections/About";
import Values from "../sections/Values";
import Footer from "../sections/Footer";
import "../styles/LandingPage.css";

const LandingPage = () => {
  const [showScroll, setShowScroll] = useState(false);

  // Afficher le bouton quand on scrolle vers le bas
  useEffect(() => {
    const checkScrollTop = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, []);

  // Fonction pour remonter en haut de la page
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Values />
      <About id="About" /> {/* Ajout de l'id pour la section "About" */}
      <Features id="Features" /> {/* Ajout de l'id pour la section "Features" */}
      <Services id="Services" /> {/* Ajout de l'id pour la section "Services" */}
      <FAQ />
      <Footer />

      {/* Bouton de retour en haut */}
      {showScroll && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          <AiOutlineArrowUp size={30} />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
