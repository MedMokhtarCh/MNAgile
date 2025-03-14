import React, { useState, useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import ProjectSidebar from "../components/sidebar/ProjectSidebar";
import HeaderDashboard from "../components/header/HeaderDashboard";
import { Typography, Box } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import "./ProjectLayout.css";

const ProjectLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const { projectId } = useParams();

  useEffect(() => {
    // Load project details from localStorage
    const storedProjects = JSON.parse(localStorage.getItem('projects')) || [];
    const project = storedProjects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      // Set document title to include project name
      document.title = `${project.title} | Axia Agile`;
    }
  }, [projectId]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="project-layout">
      <ProjectSidebar
        collapsed={collapsed}
        projectId={projectId}
        projectTitle={currentProject?.title}
      />
      <div className="main-content">
        <HeaderDashboard
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
          title={
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                py: 0.5
              }}
            >
              <FolderIcon 
                color="primary" 
                sx={{ 
                  fontSize: 28,
                  filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1))'
                }} 
              />
              <Typography 
                variant="h6" 
                component="span" 
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: '0.015em',
                  background: 'linear-gradient(45deg, #3a8ef6, #6f42c1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0px 1px 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                {currentProject?.title || "Project"}
              </Typography>
            </Box>
          }
          isProjectView={true}
        />
        <div className="content">
          <Outlet context={[currentProject, setCurrentProject]} />
        </div>
      </div>
    </div>
  );
};

export default ProjectLayout;