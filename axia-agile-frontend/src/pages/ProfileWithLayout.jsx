import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Profile from './Profile';
import { useSelector } from 'react-redux';

const ProfileWithLayout = () => {
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/Login" replace />;
  }

  const role = currentUser?.roleId === 1 || currentUser?.roleId === 2 ? 'admin' : 'user';

  if (role === 'admin') {
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