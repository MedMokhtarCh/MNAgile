// UserManagement.js
import React, { useState, useEffect } from 'react';
import { Box, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUsers } from '../hooks/useUsers';
import UserForm from '../components/users/UserForm';
import TableUsers from '../components/users/TableUsers';
import PermissionsModal from '../components/permissions/PermissionsModal';
import AlertUser from '../components/common/AlertUser';
import FilterBar from '../components/users/FilterBarUsers';
import { userColumns } from '../components/users/tableColumnsUsers';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { useAvatar } from '../hooks/useAvatar';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, fetchUsers } from '../store/slices/usersSlice';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { claims } = useSelector((state) => state.users); // Fetch claims from Redux

  const {
    users,
    loading,
    newUser,
    setNewUser,
    editMode,
    setEditMode,
    currentUserId,
    setCurrentUserId,
    availableRoles,
    handleCreateUser,
    handleEditUser,
    handleDeleteUser,
    handleToggleActive,
    snackbar,
    handleCloseSnackbar,
    openModal,
    setOpenModal,
  } = useUsers('users');

  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    console.log('UserManagement openModal state:', openModal);
  }, [openModal]);

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewUser({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      roleId: 4,
      jobTitle: '',
      entreprise: '',
      claimIds: [],
      isActive: true,
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  const filteredUsers = users.filter((user) => {
    if (user.roleId === 1 || user.roleId === 2) return false;
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'user' && user.roleId === 4) ||
      (filterRole === 'chef_projet' && user.roleId === 3);
    return matchesSearch && matchesFilter && matchesRole;
  });

  const getRequiredFields = () => {
    return ['email', 'firstName', 'lastName', 'jobTitle'];
  };

  const getShowFields = () => {
    return ['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'jobTitle', 'role', 'permissions'];
  };

  const filteredRoles = availableRoles.filter((role) => [3, 4].includes(role.id));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <PageTitle>Gestion des Utilisateurs</PageTitle>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditMode(false);
              setNewUser({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                roleId: 4,
                jobTitle: '',
                entreprise: '',
                claimIds: [],
                isActive: true,
              });
              setOpenModal(true);
            }}
          >
            Nouvel Utilisateur
          </Button>
        </Box>

        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterOptions={[
            {
              id: 'role',
              label: 'Rôle',
              options: [
                { value: 'all', label: 'Tous' },
                { value: 'user', label: 'Utilisateurs' },
                { value: 'chef_projet', label: 'Chefs de projet' },
              ],
            },
            {
              id: 'status',
              label: 'Statut',
              options: [
                { value: 'all', label: 'Tous' },
                { value: 'active', label: 'Actifs' },
                { value: 'inactive', label: 'Inactifs' },
              ],
            },
          ]}
          filterValues={{ role: filterRole, status: filterStatus }}
          setFilterValues={(values) => {
            setFilterRole(values.role);
            setFilterStatus(values.status);
          }}
          onRefresh={() => dispatch(fetchUsers())}
        />

        <TableUsers
          users={filteredUsers}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleActive={handleToggleActive}
          onManagePermissions={(user) => {
            setSelectedUser({
              ...user,
              claimIds: user.claimIds || [],
            });
            setOpenPermissionsModal(true);
          }}
          setOpenModal={setOpenModal}
          columns={userColumns}
          generateInitials={generateInitials}
          getAvatarColor={(user) => getAvatarColor(user.email)}
        />

        <UserForm
          open={openModal}
          onClose={handleCloseModal}
          user={newUser}
          setUser={setNewUser}
          onSave={() => handleCreateUser(getRequiredFields())}
          isEditMode={editMode}
          roles={filteredRoles}
          claims={claims} // Pass claims instead of permissionsGroups
          requiredFields={getRequiredFields()}
          showFields={getShowFields()}
          disabledFields={editMode ? ['role'] : []}
        />

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => {
            setOpenPermissionsModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          claims={claims} // Pass claims instead of permissionsGroups
          onSave={async () => {
            if (!selectedUser) return;
            const userData = {
              id: selectedUser.id,
              email: selectedUser.email,
              firstName: selectedUser.firstName,
              lastName: selectedUser.lastName,
              phoneNumber: selectedUser.phoneNumber || null,
              claimIds: selectedUser.claimIds || [],
              roleId: selectedUser.roleId,
              jobTitle: selectedUser.jobTitle || '',
              isActive: selectedUser.isActive,
            };
            console.log('Dispatching updateUser with:', userData);
            try {
              await dispatch(updateUser({ id: selectedUser.id, userData })).unwrap();
              setOpenPermissionsModal(false);
              setSelectedUser(null);
              dispatch(fetchUsers());
            } catch (error) {
              // Snackbar is handled by useUsers
            }
          }}
          onPermissionChange={(permissionId) => {
            if (!selectedUser) return;
            console.log('Permission toggled:', permissionId);
            const updatedClaimIds = selectedUser.claimIds.includes(permissionId)
              ? selectedUser.claimIds.filter((id) => id !== permissionId)
              : [...selectedUser.claimIds, permissionId];
            console.log('Updated claimIds:', updatedClaimIds);
            setSelectedUser({ ...selectedUser, claimIds: updatedClaimIds });
          }}
        />

        <AlertUser
          open={snackbar.open}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
          severity={snackbar.severity}
        />
      </Box>
    </ThemeProvider>
  );
};

export default UserManagement;