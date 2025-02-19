import React, { useState } from 'react';
import "../styles/faq.css";

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className={`faq-item ${isOpen ? 'open' : ''}`}>
    <button className="faq-question" onClick={onClick}>
      {question}
      <span className="faq-icon">{isOpen ? '-' : '+'}</span>
    </button>
    <div className={`faq-answer ${isOpen ? 'show' : ''}`}>
      <p>{answer}</p>
    </div>
  </div>
);

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      question: "Quel est le but de votre application ?",
      answer: "Notre application vise à simplifier la gestion de projets Agile en fournissant des outils collaboratifs efficaces pour les équipes de développement."
    },
    {
      question: "Est-ce que votre service est gratuit ?",
      answer: "Nous proposons une version gratuite avec des fonctionnalités de base et des plans premium pour les fonctionnalités avancées."
    },
    {
      question: "Comment puis-je contacter le support technique ?",
      answer: "Notre équipe de support est disponible 24/7 via chat en direct, email ou téléphone. Vous pouvez également consulter notre base de connaissances."
    },
    {
      question: "Comment puis-je m'inscrire sur la plateforme ?",
      answer: "L'inscription est simple et rapide. Cliquez sur le bouton 'Commencer' en haut de la page et suivez les étapes d'inscription."
    },
    {
      question: "Quelles mesures de sécurité sont prises pour protéger mes données ?",
      answer: "Nous utilisons le chiffrement de bout en bout, l'authentification à deux facteurs et des sauvegardes régulières pour garantir la sécurité de vos données."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        <h2>Réponses à vos questions</h2>
        <div className="faq-list">
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </div>
      </div>
      <div className="cta-container">
        <h3>Commencez maintenant et profitez des meilleurs services.</h3>
        <p>Lancez-vous dès maintenant</p>
        <p>et profitez de services exceptionnels !</p>
        <button className="cta-button">Commencer</button>
        
      
        <div className="cta-deco one"></div>
        <div className="cta-deco two"></div>
        <div className="cta-line top"></div>
        <div className="cta-line bottom"></div>
      </div>
    </section>
  );
};

export default FAQ;
