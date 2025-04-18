import React, { useState } from 'react';
import { Box, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUsers } from '../hooks/useUsers';
import { usePermissions } from '../hooks/usePermissions';
import UserForm from '../components/users/UserForm';
import TableUsers from '../components/users/TableUsers';
import PermissionsModal from '../components/permissions/PermissionsModal';
import AlertUser from '../components/common/AlertUser';
import FilterBar from '../components/users/FilterBarUsers';
import { permissionsGroups } from '../constants/permissions';
import { userColumns } from '../components/users/tableColumnsUsers';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';

const UserManagement = () => {
  const {
    users,
    setUsers,
    loading,
    newUser,
    setNewUser,
    editMode,
    setEditMode,
    availableRoles,
    handleCreateUser,
    handleEditUser,
    handleDeleteUser,
    handleToggleActive,
    snackbar,
    handleCloseSnackbar,
  } = useUsers('users');

  const {
    openPermissionsModal,
    setOpenPermissionsModal,
    selectedUser,
    handleOpenPermissionsModal,
    handlePermissionChange,
    handleSavePermissions,
  } = usePermissions(users, setUsers, 'users');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openModal, setOpenModal] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesFilter && matchesRole;
  });

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewUser({
      email: '',
      password: '',
      nom: '',
      prenom: '',
      telephone: '',
      role: 'user',
      jobTitle: '',
      permissions: [],
      isActive: true,
    });
    setEditMode(false);
  };

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
                nom: '',
                prenom: '',
                telephone: '',
                role: 'user',
                jobTitle: '',
                permissions: [],
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
        />

        <TableUsers
          users={filteredUsers}
          loading={loading}
          onEdit={(id) => {
            handleEditUser(id);
            setOpenModal(true);
          }}
          onDelete={handleDeleteUser}
          onToggleActive={handleToggleActive}
          onManagePermissions={handleOpenPermissionsModal}
          columns={userColumns}
          getAvatarColor={(user) => (user.role === 'chef_projet' ? 'secondary.main' : 'primary.main')}
        />

        <UserForm
          open={openModal}
          onClose={handleCloseModal}
          user={newUser}
          setUser={setNewUser}
          onSave={() => handleCreateUser(['email', 'nom', 'prenom', 'jobTitle'])}
          isEditMode={editMode}
          roles={availableRoles}
          permissionsGroups={{
            projects: permissionsGroups.projects,
            tasks: permissionsGroups.tasks,
            reports: permissionsGroups.reports,
          }}
          requiredFields={['email', 'nom', 'prenom', 'jobTitle']}
          showFields={['email', 'password', 'nom', 'prenom', 'telephone', 'jobTitle', 'role', 'permissions']}
        />

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => setOpenPermissionsModal(false)}
          user={selectedUser}
          permissionsGroups={{
            projects: permissionsGroups.projects,
            tasks: permissionsGroups.tasks,
            reports: permissionsGroups.reports,
          }}
          onSave={handleSavePermissions}
          onPermissionChange={handlePermissionChange}
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