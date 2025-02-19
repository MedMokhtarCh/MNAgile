import { Link } from "react-router-dom";
import { Menu } from "antd";
import {
  BarChartOutlined,
  ProjectOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  MessageOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import logo from "../../assets/logo.png";
import { useState } from "react";
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
    <div className="logo-container">
    
      <img src={logo} alt="Axia Agile" className={`logo ${collapsed ? "collapsed-logo" : ""}`} />
    </div>
  
  
  
   
    <div className="menu-container">
  
      <Menu mode="inline" theme="light" defaultSelectedKeys={["1"]}>
      
        <Menu.Item key="1" icon={<BarChartOutlined />}><Link to="/dashboard">Tableau de bord</Link></Menu.Item>
        <Menu.Item key="2" icon={<ProjectOutlined />}><Link to="/dashboard/Projects">Projets</Link></Menu.Item>
        <Menu.Item key="3" icon={<ScheduleOutlined />}><Link to="/dashboard/Kanban">Kanban</Link></Menu.Item>
        <Menu.SubMenu key="4" icon={<UnorderedListOutlined />} title="Scrum">
          <Menu.Item key="4-1" icon={<UnorderedListOutlined />}><Link to="/scrum/backlog">Backlog</Link></Menu.Item>
          <Menu.Item key="4-2" icon={<ScheduleOutlined />}><Link to="/scrum/sprint">Sprints</Link></Menu.Item>
          <Menu.Item key="4-3" icon={<FileDoneOutlined />}><Link to="/scrum/rapport">Rapports</Link></Menu.Item>
        </Menu.SubMenu>
        <Menu.Item key="5" icon={<ClockCircleOutlined />}><Link to="/active-sprints">Actifs Sprints</Link></Menu.Item>
        <Menu.Item key="6" icon={<CalendarOutlined />}><Link to="/dashboard/Calendar">Calendrier</Link></Menu.Item>
        <Menu.Item key="7" icon={<MessageOutlined />}><Link to="/dashboard/Messages">Messages</Link></Menu.Item>

      </Menu>
    </div>
    <div className="toggle-icon" onClick={() => setCollapsed(!collapsed)}>
    {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
  </div>
  </aside>
  
  );
};

export default Sidebar;
