import { useState } from 'react';
import { setStoredData } from '../utils/storage';

export const usePermissions = (users, setUsers, storageKey) => {
  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleOpenPermissionsModal = (user) => {
    setSelectedUser(user);
    setOpenPermissionsModal(true);
  };

  const handlePermissionChange = (permissionId) => {
    if (!selectedUser) return;

    const permissions = selectedUser.permissions.includes(permissionId)
      ? selectedUser.permissions.filter((id) => id !== permissionId)
      : [...selectedUser.permissions, permissionId];

    setSelectedUser({ ...selectedUser, permissions });
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;

    const updatedUsers = users.map((user) =>
      user.id === selectedUser.id ? { ...user, permissions: selectedUser.permissions } : user
    );
    setUsers(updatedUsers);
    setStoredData(storageKey, updatedUsers);
    setOpenPermissionsModal(false);
    setSelectedUser(null);
  };

  return {
    openPermissionsModal,
    setOpenPermissionsModal,
    selectedUser,
    handleOpenPermissionsModal,
    handlePermissionChange,
    handleSavePermissions,
  };
};