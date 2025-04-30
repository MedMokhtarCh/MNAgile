import React, { useEffect } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import ProjectSidebar from "../components/sidebar/ProjectSidebar";
import HeaderDashboard from "../components/header/HeaderDashboard";
import { Typography, Box, CircularProgress } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import { fetchProjects } from "../store/slices/projectsSlice";
import "./ProjectLayout.css";

const ProjectLayout = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { projects, status, error } = useSelector((state) => state.projects);
  const currentProject = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProjects());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (status === 'succeeded' && !currentProject) {
      navigate('/projects');
    }
  }, [status, currentProject, navigate]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">Erreur: {error}</Typography>
      </Box>
    );
  }

  if (!currentProject) {
    return null;
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <HeaderDashboard 
        title={currentProject.title}
        icon={<FolderIcon />}
        isProjectView={true}
      />
      <Box display="flex" flexGrow={1}>
        <ProjectSidebar
          projectId={projectId}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
        />
        <Box component="main" flexGrow={1} p={3}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectLayout;