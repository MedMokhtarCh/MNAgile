import { Input, Avatar, Badge } from "antd";
import { BellOutlined, UserOutlined } from "@ant-design/icons";
import "./HeaderDashboard.css";

const HeaderDahboard = () => {
  return (
    <header className="header">
      <Input placeholder="Rechercher" className="search" />
      <div className="icons">
        <Badge count={5}>
          <BellOutlined style={{ fontSize: "18px" }} />
        </Badge>
        <Avatar icon={<UserOutlined />} className="avatar" />
      </div>
    </header>
  );
};

export default HeaderDahboard;

