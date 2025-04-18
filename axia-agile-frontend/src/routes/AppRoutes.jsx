// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ProjectLayout from "../layouts/ProjectLayout";
import Projects from "../pages/Projects";
import Calendar from "../pages/Calendar";
import Kanban from "../pages/Kanban";
import LandingPage from "../pages/LandingPage";
import BacklogPage from "../pages/BacklogPage";
import Dashboard from "../pages/ProjectsDashboard";
import AdminManagement from "../pages/AdminManagement";
import UserManagement from "../pages/UserManagement";
import ProjectDashboard from "../pages/ProjectOverview";
import AdminLayout from "../layouts/AdminLayout";
import UserStatisticsDashboard from "../pages/UserStatisticsDashboard";
import SuperAdminStatistics from "../pages/SuperAdminStatistics";
import GroupDiscussion from "../pages/GroupDiscussion";
import ProfileWithLayout from "../pages/ProfileWithLayout";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { ProtectedRoute, RoleProtectedRoute } from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes - accessible to everyone */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected profile route - any authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<ProfileWithLayout />}>
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin routes - only for admin and superadmin */}
      <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/" element={<AdminLayout />}>
          <Route path="/UserManagement" element={<UserManagement />} />
          <Route path="/UserStatisticsDashboard" element={<UserStatisticsDashboard />} />
        </Route>
      </Route>
      
      {/* Super Admin routes - only for superadmin */}
      <Route element={<RoleProtectedRoute allowedRoles={['superadmin']} />}>
        <Route path="/" element={<AdminLayout />}>
          <Route path="/AdminManagement" element={<AdminManagement />} />
          <Route path="/SuperAdminStatistics" element={<SuperAdminStatistics />} />
        </Route>
      </Route>

      {/* User routes - for authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
        </Route>
      </Route>

      {/* Project routes - for project members and managers */}
      <Route element={<ProtectedRoute />}>
        <Route path="/project/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectDashboard />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="GroupDiscussion" element={<GroupDiscussion />} />
        </Route>
      </Route>
      
      {/* Error routes */}
    
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;