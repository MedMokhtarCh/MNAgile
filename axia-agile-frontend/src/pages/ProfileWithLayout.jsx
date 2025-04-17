
import React from "react";
import { Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import Profile from "./Profile";

const ProfileWithLayout = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    return <Navigate to="/Login" replace />;
  }

  const role = currentUser?.role;

  if (role === "superadmin" || role === "admin") {
    return (
      <AdminLayout>
        <Profile />
      </AdminLayout>
    );
  }

  return (
    <DashboardLayout>
      <Profile />
    </DashboardLayout>
  );
};

export default ProfileWithLayout;