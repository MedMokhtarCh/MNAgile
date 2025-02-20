import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Projects from "../pages/Projects";
import Calendar from "../pages/Calendar";
import Kanban from "../pages/Kanban";
import LandingPage from "../pages/LandingPage";
import BacklogPage from "../pages/BacklogPage";
import Dashboard from "../pages/Dashboard";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Route pour la Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Routes pour le Dashboard et ses pages */}
      <Route path="/" element={<DashboardLayout />}>
      <Route path="dashboard" element={<Dashboard />} />
        <Route path="Projects" element={<Projects />} />
        <Route path="Calendar" element={<Calendar />} />
        <Route path="Kanban" element={<Kanban />} />
        <Route path="Scrum" element={<BacklogPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
