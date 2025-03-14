import React from "react";
import { AiOutlineTeam, AiOutlineEye, AiOutlineBulb } from "react-icons/ai";
import "./Values.css";

const ValueCard = ({ Icon, title, description }) => (
  <div className="value-card">
    <div className="value-icon">
      <Icon size={50} color="white" />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const Values = () => {
  const values = [
    {
      Icon: AiOutlineTeam,
      title: "Collaborez",
      description:
        "Travaillez ensemble en temps réel avec votre équipe grâce à des outils interactifs. Améliorez la communication et la coordination pour une gestion de projet efficace."
    },
    {
      Icon: AiOutlineEye,
      title: "Suivez",
      description:
        "Gardez une vue d'ensemble sur l'évolution de vos projets avec des tableaux dynamiques. Analysez les performances et ajustez votre stratégie en toute simplicité."
    },
    {
      Icon: AiOutlineBulb,
      title: "Innovez",
      description:
        "Optimisez vos processus et accélérez le développement de vos idées. Expérimentez de nouvelles approches pour une productivité accrue."
    }
  ];

  return (
    <section className="values-section">
      <div className="values-container">
        {values.map((value, index) => (
          <ValueCard key={index} {...value} />
        ))}
      </div>
    </section>
  );
};

export default Values;
