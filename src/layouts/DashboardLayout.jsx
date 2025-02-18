import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/Header";
import "./DashboardLayout.css";

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="content">{children}</div>
      </div>
    </div>
  );
};
export default DashboardLayout;