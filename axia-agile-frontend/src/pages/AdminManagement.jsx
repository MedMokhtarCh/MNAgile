import React, { useState, useEffect } from 'react';
import { Box, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUsers } from '../hooks/useUsers';
import UserForm from '../components/users/UserForm';
import TableUsers from '../components/users/TableUsers';
import PermissionsModal from '../components/permissions/PermissionsModal';
import AlertUser from '../components/common/AlertUser';
import FilterBar from '../components/users/FilterBarUsers';
import { adminColumns } from '../components/users/tableColumnsUsers';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { useAvatar } from '../hooks/useAvatar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUser, setSnackbar } from '../store/slices/usersSlice';

const AdminManagement = () => {
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
  } = useUsers('admins');

  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log('AdminManagement openModal state:', openModal);
  }, [openModal]);

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
          onRefresh={() => dispatch(fetchUsers())}
        />

        <TableUsers
          users={filteredAdmins}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleActive={handleToggleActive}
          onManagePermissions={(admin) => {
            setSelectedAdmin({
              ...admin,
              claimIds: admin.claimIds || [],
            });
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
          claims={claims} // Pass claims instead of permissionsGroups
          requiredFields={['email', 'firstName', 'lastName', 'entreprise']}
          showFields={['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'entreprise', 'role', 'permissions']}
          disabledFields={editMode ? ['role'] : []}
        />

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => {
            setOpenPermissionsModal(false);
            setSelectedAdmin(null);
          }}
          user={selectedAdmin}
          claims={claims} // Pass claims instead of permissionsGroups
          onSave={async () => {
            if (!selectedAdmin) return;
            setIsSaving(true);
            const adminData = {
              id: selectedAdmin.id,
              email: selectedAdmin.email,
              firstName: selectedAdmin.firstName,
              lastName: selectedAdmin.lastName,
              phoneNumber: selectedAdmin.phoneNumber || null,
              claimIds: selectedAdmin.claimIds || [],
              roleId: 2,
              entreprise: selectedAdmin.entreprise || '',
              isActive: selectedAdmin.isActive,
            };
            console.log('Dispatching updateUser with:', adminData);
            try {
              await dispatch(updateUser({ id: selectedAdmin.id, userData: adminData })).unwrap();
              setOpenPermissionsModal(false);
              setSelectedAdmin(null);
              dispatch(fetchUsers());
            } catch (error) {
              dispatch(setSnackbar({
                open: true,
                message: `Échec de la mise à jour des autorisations: ${error}`,
                severity: 'error',
              }));
            } finally {
              setIsSaving(false);
            }
          }}
          onPermissionChange={(permissionId) => {
            if (!selectedAdmin) return;
            console.log('Permission toggled:', permissionId);
            const updatedClaimIds = selectedAdmin.claimIds.includes(permissionId)
              ? selectedAdmin.claimIds.filter((id) => id !== permissionId)
              : [...selectedAdmin.claimIds, permissionId];
            console.log('Updated claimIds:', updatedClaimIds);
            setSelectedAdmin({ ...selectedAdmin, claimIds: updatedClaimIds });
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