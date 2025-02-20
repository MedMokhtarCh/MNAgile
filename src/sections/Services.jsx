import React from "react";
import { AiOutlineProject, AiOutlineUnorderedList, AiOutlineFundProjectionScreen, AiOutlineFileText, AiOutlineThunderbolt, AiOutlineUser } from "react-icons/ai";
import "../styles/services.css";

const ServiceCard = ({ Icon, title, description }) => (
  <div className="service-card">
    <div className="service-icon">
      <Icon size={24} color="#007bff" />
    </div>
    <div className="service-content">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </div>
);

const Services = () => {
  const services = [
    {
      Icon: AiOutlineProject,
      title: "Projets",
      description: "Planification et développement de projets structurés"
    },
    {
      Icon: AiOutlineUnorderedList,
      title: "Tâches",
      description: "Suivi et gestion efficaces des tâches quotidiennes"
    },
    {
      Icon: AiOutlineFundProjectionScreen,
      title: "Kanban",
      description: "Organisation visuelle des tâches avec un tableau Kanban"
    },
    {
      Icon: AiOutlineFileText,
      title: "Rapports",
      description: "Génération de rapports détaillés pour un meilleur suivi"
    },
    {
      Icon: AiOutlineThunderbolt,
      title: "Sprints",
      description: "Gestion agile avec des sprints optimisés"
    },
    {
      Icon: AiOutlineUser,
      title: "UserStory",
      description: "Définition claire des besoins utilisateurs pour un meilleur développement"
    }
  ];

  return (
    <section id="services" className="services-section">
      <div className="wave-background">
        <div className="services-container">
          <h2>Services</h2>
          <div className="services-grid">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;