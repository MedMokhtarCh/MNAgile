import { Outlet } from "react-router-dom"; // Importez Outlet de react-router-dom
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/HeaderDashboard";
import "./DashboardLayout.css";

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="content">
          <Outlet /> {/* Cet Outlet rendra le contenu des sous-routes */}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
