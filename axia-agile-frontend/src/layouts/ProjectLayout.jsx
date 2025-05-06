import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProjectSidebar from '../components/sidebar/ProjectSidebar';

const ProjectLayout = () => {
  const { projectId } = useParams();
  const { projects } = useSelector((state) => state.projects);
  const project = projects.find((p) => p.id === projectId);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <ProjectSidebar
        collapsed={false}
        projectId={projectId}
        projectTitle={project?.title || 'Projet'}
      />
      <Box sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default' }}>
        <Outlet context={{ project }} />
      </Box>
    </Box>
  );
};

export default ProjectLayout;