import { useState, useEffect, useMemo } from 'react';
import { Box, Button, ThemeProvider, CssBaseline, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUsers } from '../hooks/useUsers';
import UserForm from '../components/users/UserForm';
import TableUsers from '../components/users/TableUsers';
import PermissionsModal from '../components/permissions/PermissionsModal';
import AlertUser from '../components/common/AlertUser';
import FilterBar from '../components/users/FilterBarUsers';
import { superadminColumns } from '../components/users/tableColumnsUsers';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import AdminTabs from './AdminTabs';
import { useAuth } from '../contexts/AuthContext';
import { useAvatar } from '../hooks/useAvatar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsersByCreatedById } from '../store/slices/usersSlice';

const SuperadminManagement = () => {
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
  } = useUsers('superadmins');

  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Memoize filteredSuperadmins with createdById filter
  const filteredSuperadmins = useMemo(() => {
    return users.filter(
      (admin) =>
        admin.roleId === 1 &&
        admin.createdById === currentUser?.id &&
        (admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.entreprise?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterStatus === 'all' ||
          (filterStatus === 'active' && admin.isActive) ||
          (filterStatus === 'inactive' && !admin.isActive))
    );
  }, [users, searchTerm, filterStatus, currentUser]);

  useEffect(() => {
    console.log('SuperadminManagement openModal state:', openModal);
    console.log('SuperadminManagement - Users state updated:', users);
    console.log('SuperadminManagement - Filtered superadmins:', filteredSuperadmins);
  }, [openModal, users, filteredSuperadmins]);

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewUser({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      entreprise: '',
      roleId: 1,
      claimIds: [],
      isActive: true,
      createdById: currentUser?.id || null,
    });
    setEditMode(false);
    setCurrentUserId(null);
    setSearchTerm('');
    setFilterStatus('all');
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <AdminTabs />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <PageTitle>Gestion des Comptes Superadmin</PageTitle>
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
                roleId: 1,
                claimIds: [],
                isActive: true,
                createdById: currentUser?.id || null,
              });
              setOpenModal(true);
            }}
            sx={{ px: 3 }}
          >
            Nouveau Superadmin
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
          users={filteredSuperadmins}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={handleOpenDeleteDialog}
          onToggleActive={handleToggleActive}
          onManagePermissions={(admin) => {
            setSelectedAdmin({
              ...admin,
              claimIds: [], // Superadmins have no explicit permissions
            });
            setOpenPermissionsModal(true);
          }}
          setOpenModal={setOpenModal}
          columns={superadminColumns}
          generateInitials={generateInitials}
          getAvatarColor={(admin) => getAvatarColor(admin.email)}
        />

        <UserForm
          open={openModal}
          onClose={handleCloseModal}
          user={newUser}
          setUser={setNewUser}
          onSave={() => handleCreateUser(['email', 'firstName', 'lastName'])}
          isEditMode={editMode}
          roles={availableRoles}
          claims={claims}
          requiredFields={['email', 'firstName', 'lastName']}
          showFields={['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'role']}
          disabledFields={['role']}
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
          onPermissionChange={() => {
            // No-op: Superadmins have all permissions implicitly
          }}
          onSave={() => {
            setOpenPermissionsModal(false);
            setSelectedAdmin(null);
            dispatch(fetchUsersByCreatedById(currentUser?.id));
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
              Êtes-vous sûr de vouloir supprimer ce superadministrateur ? Cette action est irréversible.
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

export default SuperadminManagement;