import React, { useState, useEffect } from 'react';
import { Box, Button, ThemeProvider, CssBaseline, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
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
import AdminTabs from './AdminTabs';
import { useAuth } from '../contexts/AuthContext';
import { useAvatar } from '../hooks/useAvatar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsersByCreatedById } from '../store/slices/usersSlice';

const AdminManagement = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { claims } = useSelector((state) => state.users);

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
    isCreating,
  } = useUsers('admins');

  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

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
      createdById: currentUser?.id || null,
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  const handleOpenDeleteDialog = (id) => {
    setUserToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await dispatch(handleDeleteUser(userToDelete)).unwrap();
        dispatch(fetchUsersByCreatedById(currentUser.id));
      } catch (error) {
        // Error handled in usersSlice
      }
    }
    handleCloseDeleteDialog();
  };

  const filteredAdmins = users.filter(
    (admin) =>
      admin.roleId === 2 &&
      admin.createdById === currentUser?.id &&
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
        <AdminTabs />
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
                createdById: currentUser?.id || null,
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
          onRefresh={() => dispatch(fetchUsersByCreatedById(currentUser?.id))}
        />

        <TableUsers
          users={filteredAdmins}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={handleOpenDeleteDialog}
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
          claims={claims}
          requiredFields={['email', 'firstName', 'lastName', 'entreprise']}
          showFields={['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'entreprise', 'role', 'permissions']}
          disabledFields={editMode ? ['role'] : []}
          loading={isCreating}
        />

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => {
            setOpenPermissionsModal(false);
            setSelectedAdmin(null);
            dispatch(fetchUsersByCreatedById(currentUser?.id));
          }}
          user={selectedAdmin}
          claims={claims}
          onPermissionChange={(permissionId) => {
            if (!selectedAdmin) return;
            console.log('AdminManagement - Permission toggled:', permissionId);
            const updatedClaimIds = selectedAdmin.claimIds.includes(permissionId)
              ? selectedAdmin.claimIds.filter((id) => id !== permissionId)
              : [...selectedAdmin.claimIds, permissionId];
            console.log('AdminManagement - Updated claimIds:', updatedClaimIds);
            setSelectedAdmin({ ...selectedAdmin, claimIds: updatedClaimIds });
          }}
        />

        <AlertUser
          open={snackbar.open}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
          severity={snackbar.severity}
        />

        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Confirmer la suppression</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Êtes-vous sûr de vouloir supprimer cet administrateur ? Cette action est irréversible.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
            <Button onClick={handleConfirmDelete} color="error" autoFocus>
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AdminManagement;