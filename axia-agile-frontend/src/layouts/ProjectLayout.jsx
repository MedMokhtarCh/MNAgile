import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Outlet, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ProjectSidebar from '../components/sidebar/ProjectSidebar';
import { projectApi } from '../services/api';
import { normalizeProject } from '../utils/projectUtils';

const ProjectLayout = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { projects } = useSelector((state) => state.projects);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        // Vérifier d'abord dans le store Redux
        let foundProject = projects.find((p) => p.id === projectId);
        if (!foundProject) {
          // Si non trouvé, faire une requête API
          const response = await projectApi.get(`/Projects/${projectId}`);
          foundProject = normalizeProject(response.data);
          // Optionnel : Mettre à jour le store Redux si nécessaire
          dispatch({ type: 'projects/addProject', payload: foundProject });
        }
        setProject(foundProject);
      } catch (err) {
        console.error('Erreur lors du chargement du projet:', err);
        setProject(null); // S'assurer que project est null en cas d'erreur
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <ProjectSidebar
        collapsed={false}
        projectId={projectId}
        projectTitle={project?.title || 'Projet inconnu'}
      />
      <Box sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default' }}>
        <Outlet context={{ project, projectId }} />
      </Box>
    </Box>
  );
};

export default ProjectLayout;