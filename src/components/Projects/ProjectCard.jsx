import { Card } from "antd";
import "./Projects.css";

const ProjectCard = ({ title, description }) => {
  return (
    <Card title={title} bordered={false} className="project-card" hoverable>
      <p>{description}</p>
    </Card>
  );
};
export default ProjectCard;
