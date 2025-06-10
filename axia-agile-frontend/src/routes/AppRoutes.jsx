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
import ProjectOverview from "../pages/ProjectOverview";
import UserStatisticsDashboard from "../pages/UserStatisticsDashboard";
import SuperAdminStatistics from "../pages/SuperAdminStatistics";
import GroupDiscussion from "../pages/GroupDiscussion";
import ProfileWithLayout from "../pages/ProfileWithLayout";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import ActiveSprintPage from "../pages/ActiveSprintPage";
import { ProtectedRoute, RoleProtectedRoute, RoleOrClaimProtectedRoute, ClaimProtectedRoute } from "./ProtectedRoute";
import RoleManagement from "../pages/RoleManagement";
import ClaimManagement from "../pages/ClaimManagement";
import LoadingPage from "../pages/LoadingPage";
import SuperadminManagement from "../pages/SuperadminManagement";
import MeetingScheduler from "../pages/MeetingScheduler";
import Subscribe from "../pages/Subscribe";
import SuperAdminSubscriptionManagement from "../pages/SuperAdminSubscriptionManagement";
import SprintPage from "../pages/SprintPage";



const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes - accessible to everyone */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Subscribe" element={<Subscribe />} />
      
      
  

      {/* Protected profile route - any authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<ProfileWithLayout />}>
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin routes - only for admin */}
        <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/UserStatisticsDashboard" element={<UserStatisticsDashboard />} />
        </Route>
      </Route>

      {/* Super Admin routes - only for superadmin */}
     <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/AdminManagement" element={<AdminManagement />} />
          <Route path="/SuperAdminStatistics" element={<SuperAdminStatistics />} />
           <Route path="/SuperAdminSubscriptionManagement" element={<SuperAdminSubscriptionManagement />} />
          
          <Route path="/SuperadminManagement" element={<SuperadminManagement />} />
          <Route path="/ClaimManagement" element={<ClaimManagement />} />
        </Route>
      </Route>
      {/* Admin and superadmin routes - for RoleManagement */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/RoleManagement" element={<RoleManagement />} />
        </Route>
      </Route>
         <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/meetings" element={<MeetingScheduler />} />
        </Route>
      </Route>

      {/* User routes - for authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
   
          {/* Messages route - accessible to users with discussion claims */}
          <Route
            element={
              <ClaimProtectedRoute
                requiredClaims={['CanCommunicate', 'CanCreateChannel']}
              />
            }
          >
            <Route path="/messages" element={<GroupDiscussion />} />
          </Route>
        </Route>
      </Route>

      {/* Project routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/project/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectOverview />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="backlog" element={<BacklogPage />} />
              <Route path="sprints" element={<SprintPage />} />
          <Route path="ActiveSprintPage" element={<ActiveSprintPage />} />
          <Route path="calendar" element={<Calendar />} />
              
        </Route>
      </Route>

      {/* Projects route - accessible to users with CanViewProjects */}
      <Route
        element={
          <ProtectedRoute>
            <ClaimProtectedRoute
              requiredClaims={['CanViewProjects', 'CanAddProjects', 'CanEditProjects', 'CanDeleteProjects']}
            />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/projects" element={<Projects />} />
      
        </Route>
      </Route>
 

      {/* UserManagement route - accessible to specific roles or users with user management claims */}
      <Route
        element={
          <ProtectedRoute>
            <RoleOrClaimProtectedRoute
          
              requiredClaims={['CanViewUsers', 'CanCreateUsers', 'CanUpdateUsers', 'CanDeleteUsers']}
            />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/UserManagement" element={<UserManagement />} />
        </Route>
      </Route>

      {/* Error routes */}
      <Route path="*" element={<NotFound />} />
      <Route path="/no-access" element={<NotFound />} />
      <Route path="/LoadingPage" element={<LoadingPage />} />
    </Routes>
  );
};

export default AppRoutes;