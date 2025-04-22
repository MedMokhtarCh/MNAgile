import React, { useState } from 'react';
import { Box, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUsers } from '../hooks/useUsers';
import UserForm from '../components/users/UserForm';
import TableUsers from '../components/users/TableUsers';
import PermissionsModal from '../components/permissions/PermissionsModal';
import AlertUser from '../components/common/AlertUser';
import FilterBar from '../components/users/FilterBarUsers';
import { permissionsGroups } from '../constants/permissions';
import { adminColumns } from '../components/users/tableColumnsUsers';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { useAvatar } from '../hooks/useAvatar';
import { useDispatch } from 'react-redux'; // Add this import
import { fetchUsers } from '../store/slices/usersSlice'; // Import fetchUsers

const AdminManagement = () => {
  const dispatch = useDispatch(); // Define dispatch
  const { currentUser } = useAuth();
  const { generateInitials, getAvatarColor } = useAvatar();
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
  } = useUsers('admins');

  const [openModal, setOpenModal] = useState(false);
  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewUser({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      entreprise: '',
      roleId: 2,
      claimIds: [],
      isActive: true,
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  const filteredAdmins = users.filter(
    (admin) =>
      admin.roleId === 2 &&
      (admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.entreprise?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === 'all' ||
        (filterStatus === 'active' && admin.isActive) ||
        (filterStatus === 'inactive' && !admin.isActive))
  );

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
              setNewUser({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                entreprise: '',
                roleId: 2,
                claimIds: [],
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
          onRefresh={() => dispatch(fetchUsers())} // Use defined dispatch
        />

        <TableUsers
          users={filteredAdmins}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleActive={handleToggleActive}
          onManagePermissions={(admin) => {
            setSelectedAdmin(admin);
            setOpenPermissionsModal(true);
          }}
          setOpenModal={setOpenModal}
          columns={adminColumns}
          generateInitials={generateInitials}
          getAvatarColor={(admin) => getAvatarColor(admin.email)}
        />

        <UserForm
          open={openModal}
          onClose={handleCloseModal}
          user={newUser}
          setUser={setNewUser}
          onSave={() => handleCreateUser(['email', 'firstName', 'lastName', 'entreprise'])}
          isEditMode={editMode}
          roles={availableRoles}
          permissionsGroups={{
            admin: {
              ...permissionsGroups.admin,
              permissions: permissionsGroups.admin.permissions.map((p) => ({
                ...p,
                id: p.id === 'create_users' ? 1 : p.id === 'create_project_managers' ? 2 : p.id,
              })),
            },
          }}
          requiredFields={['email', 'firstName', 'lastName', 'entreprise']}
          showFields={['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'entreprise', 'role', 'permissions']}
          disabledFields={editMode ? ['role'] : []}
        />

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => setOpenPermissionsModal(false)}
          user={selectedAdmin}
          permissionsGroups={{
            admin: {
              ...permissionsGroups.admin,
              permissions: permissionsGroups.admin.permissions.map((p) => ({
                ...p,
                id: p.id === 'create_users' ? 1 : p.id === 'create_project_managers' ? 2 : p.id,
              })),
            },
          }}
          onSave={async () => {
            if (!selectedAdmin) return;
            const adminData = {
              ...selectedAdmin,
              claimIds: selectedAdmin.permissions,
              firstName: selectedAdmin.prenom || selectedAdmin.firstName,
              lastName: selectedAdmin.nom || selectedAdmin.lastName,
              phoneNumber: selectedAdmin.telephone || selectedAdmin.phoneNumber,
              roleId: 2,
              entreprise: selectedAdmin.entreprise,
              isActive: selectedAdmin.isActive, // Ensure isActive is included
            };
            try {
              await dispatch(updateUser({ id: selectedAdmin.id, userData: adminData }));
              handleCloseSnackbar();
              setOpenPermissionsModal(false);
              setSelectedAdmin(null);
            } catch (error) {
              // Snackbar is handled by useUsers
            }
          }}
          onPermissionChange={(permissionId) => {
            if (!selectedAdmin) return;
            const claimIds = selectedAdmin.permissions.includes(permissionId)
              ? selectedAdmin.permissions.filter((id) => id !== permissionId)
              : [...selectedAdmin.permissions, permissionId];
            setSelectedAdmin({ ...selectedAdmin, permissions: claimIds });
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

export default AdminManagement;