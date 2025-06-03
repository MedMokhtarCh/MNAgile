import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Outlet, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ProjectSidebar from '../components/sidebar/ProjectSidebar';
import HeaderDashboard from '../components/header/HeaderDashboard';
import { projectApi } from '../services/api';
import { normalizeProject } from '../store/slices/projectsSlice';
import './ProjectLayout.css';

const ProjectLayout = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { projects } = useSelector((state) => state.projects);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        let foundProject = projects.find((p) => p.id === projectId);
        if (!foundProject) {
          const response = await projectApi.get(`/Projects/${projectId}`);
          foundProject = normalizeProject(response.data);
          dispatch({ type: 'projects/addProject', payload: foundProject });
        }
        setProject(foundProject);
      } catch (err) {
        console.error('Erreur lors du chargement du projet:', err);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    } else {
      setLoading(false);
      setProject(null);
    }
  }, [projectId, projects, dispatch]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <div className="project-layout">
      <ProjectSidebar
        collapsed={collapsed}
        projectId={projectId}
        projectTitle={project?.title || 'Projet inconnu'}
      />
      <div className="main-content">
        <HeaderDashboard collapsed={collapsed} toggleSidebar={toggleSidebar} />
        <div className="content">
          <Outlet context={{ project, projectId }} />
        </div>
      </div>
    </div>
  );
};

export default ProjectLayout;