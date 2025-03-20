import React, { useState, useEffect } from "react";
import { AiOutlineArrowUp } from "react-icons/ai";
import Navbar from "../sections/navbar/Navbar";
import Hero from "../sections/hero/Hero";
import Features from "../sections/features/Features";
import Services from "../sections/services/Services";
import FAQ from "../sections/faq/FAQ";
import About from "../sections/about/About";
import Values from "../sections/values/Values";
import "../styles/global.css";
import "../styles/variable.css";
import "../styles/LandingPage.css";
import Footer from "../sections/footer/Footer";
const LandingPage = () => {
  const [showScroll, setShowScroll] = useState(false);

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Values />
      <About id="About" />
      <Features id="Features" />
      <Services id="Services" />
      <FAQ />
      <Footer/>
      

      {showScroll && (
        <div className="scroll-to-top" onClick={scrollToTop}>
          <AiOutlineArrowUp size={10} />
        </div>
      )}
    </div>
  );
};

export default LandingPage;