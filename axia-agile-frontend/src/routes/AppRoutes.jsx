import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ProjectLayout from "../layouts/ProjectLayout"; // New layout for project-specific pages
import Projects from "../pages/projects/Projects";
import Calendar from "../pages/Calendar";
import Kanban from "../pages/Kanban";
import LandingPage from "../pages/LandingPage";
import BacklogPage from "../pages/BacklogPage";
import Dashboard from "../pages/Dashboard";
import AuthForms from "../pages/AuthForms";
import SuperAdminDashboard from '../pages/SuperAdminDashboard';
import AdminDashboard from "../pages/AdminDashboard";
import ProjectDashboard from "../pages/ProjectDashboard"; // New component for project overview
import AdminLayout from "../layouts/AdminLayout";
import UserStatisticsDashboard from "../pages/UserStatisticsDashboard";
import SuperAdminStatistics from "../pages/SuperAdminStatistics";
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/AuthForms" element={<AuthForms />} />
      {/* Main admins layout  */}
      <Route path="/" element={<AdminLayout />}>
      <Route path="/AdminDashboard" element={<AdminDashboard />} />
      <Route path="/SuperAdminDashboard" element={<SuperAdminDashboard />} />
      <Route path="/UserStatisticsDashboard" element={<UserStatisticsDashboard />} />
      <Route path="/SuperAdminStatistics" element={<SuperAdminStatistics />} />
     
     
      </Route>
      {/* Main dashboard layout  */}
      <Route path="/" element={<DashboardLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        
      </Route>
      
      {/* Project-specific layout with Kanban, Backlog, etc. */}
      <Route path="/project/:projectId" element={<ProjectLayout />}>
        <Route index element={<ProjectDashboard />} /> 
        <Route path="kanban" element={<Kanban />} />
        <Route path="backlog" element={<BacklogPage />} />
       
        <Route path="calendar" element={<Calendar />} />
        <Route path="messages" element={<div>Messages</div>} /> {/* Placeholder for Messages page */}
      </Route>
    
    </Routes>
  );
};

export default AppRoutes;