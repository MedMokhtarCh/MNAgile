import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Projects from "../pages/Projects";
import Calendar from "../pages/Calendar";
import Kanban from "../pages/Kanban";

const AppRoutes = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/projects" element={<Projects />} />
        <Route path="/Calendar" element={<Calendar />} />
        <Route path="/Kanban" element={<Kanban />} />
      </Routes>
    </DashboardLayout>
  );
};
export default AppRoutes;