import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Projects from "../pages/Projects";
import Calendar from "../pages/Calendar";
import Kanban from "../pages/Kanban";
import LandingPage from "../pages/LandingPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Route pour la Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Routes pour le Dashboard et ses pages */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route path="Projects" element={<Projects />} />
        <Route path="Calendar" element={<Calendar />} />
        <Route path="Kanban" element={<Kanban />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
