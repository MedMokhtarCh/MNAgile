import React, { useState } from 'react';
import { Box, Typography, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUsers } from '../hooks/useUsers';
import { usePermissions } from '../hooks/usePermissions';
import UserForm from '../components/users/UserForm';
import TableUsers from '../components/users/TableUsers';
import PermissionsModal from '../components/permissions/PermissionsModal';
import AlertUser from '../components/common/AlertUser';
import FilterBar from '../components/users/FilterBarUsers';
import { permissionsGroups } from '../constants/permissions';
import { adminColumns } from '../components/users/tableColumnsUsers';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';

const AdminManagement = () => {
  const {
    users: admins,
    setUsers: setAdmins,
    loading,
    setLoading,
    newUser: newAdmin,
    setNewUser: setNewAdmin,
    editMode,
    setEditMode,
    availableRoles,
    handleCreateUser, // This is the correct function name from the hook
    handleEditUser,
    handleDeleteUser,
    handleToggleActive,
    snackbar,
    handleCloseSnackbar,
  } = useUsers('admins');

  const {
    openPermissionsModal,
    setOpenPermissionsModal,
    selectedUser,
    handleOpenPermissionsModal,
    handlePermissionChange,
    handleSavePermissions,
  } = usePermissions(admins, setAdmins, 'admins');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openModal, setOpenModal] = useState(false);

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.entreprise?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && admin.isActive) ||
      (filterStatus === 'inactive' && !admin.isActive);
    return matchesSearch && matchesFilter;
  });

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewAdmin({
      email: '',
      password: '',
      entreprise: '',
      adresse: '',
      telephone: '',
      role: 'admin',
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
       
          <PageTitle>Gestion des Comptes Admin</PageTitle>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditMode(false);
              setNewAdmin({
                email: '',
                password: '',
                entreprise: '',
                adresse: '',
                telephone: '',
                role: 'admin',
                permissions: [],
                isActive: true,
              });
              setOpenModal(true);
            }}
            sx={{ px: 3 }}
          >
            Nouvel Admin
          </Button>
        </Box>

        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterOptions={[
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
          filterValues={{ status: filterStatus }}
          setFilterValues={(values) => setFilterStatus(values.status)}
          onRefresh={() => setLoading(true)}
        />

        <TableUsers
          users={filteredAdmins}
          loading={loading}
          onEdit={(id) => {
            handleEditUser(id);
            setOpenModal(true);
          }}
          onDelete={handleDeleteUser}
          onToggleActive={handleToggleActive}
          onManagePermissions={handleOpenPermissionsModal}
          setOpenModal={setOpenModal}
          columns={adminColumns}
          getAvatarColor={(admin) => (admin.isActive ? 'primary.main' : 'grey.400')}
        />

        <UserForm
          open={openModal}
          onClose={handleCloseModal}
          user={newAdmin}
          setUser={setNewAdmin}
          onSave={() => handleCreateUser(['email', 'entreprise', 'adresse', 'telephone'])} // Change handleSaveUser to handleCreateUser
          isEditMode={editMode}
          roles={availableRoles}
          permissionsGroups={{ admin: permissionsGroups.admin }}
          requiredFields={['email', 'entreprise', 'adresse', 'telephone']}
          showFields={['email', 'password', 'entreprise', 'adresse', 'telephone', 'role', 'permissions']}
          disabledFields={editMode ? ['role'] : []}
        />

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => setOpenPermissionsModal(false)}
          user={selectedUser}
          permissionsGroups={{ admin: permissionsGroups.admin }}
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

export default AdminManagement;