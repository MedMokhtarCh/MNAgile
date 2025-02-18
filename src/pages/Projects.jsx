import { Button, Row, Col } from "antd";
import ProjectCard from "../components/Projects/ProjectCard";

const Projects = () => {
  return (
    <div className="projects">
      <h1>Projets</h1>
      <Button type="primary" className="add-project" size="large">+ Créer un nouveau projet</Button>
      <Row gutter={[24, 24]} className="project-list">
        <Col xs={24} sm={12} md={8} lg={6}><ProjectCard title="app mobile shopy" description="app ecommerce mobile" /></Col>
        <Col xs={24} sm={12} md={8} lg={6}><ProjectCard title="Projet devops" description="Test and integration" /></Col>
      </Row>
    </div>
  );
};
export default Projects;