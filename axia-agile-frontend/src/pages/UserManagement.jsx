import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  ThemeProvider,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip, // Added for actions column
  IconButton, // Added for actions column
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon, // Added for actions column
  Delete as DeleteIcon, // Added for actions column
} from '@mui/icons-material';
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
import { fetchUsersByCreatedById } from '../store/slices/usersSlice';

const UserManagement = () => {
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
  } = useUsers('users');

  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Check for specific claims
  const hasCreateUserClaim = currentUser?.claims?.includes('CanCreateUsers');
  const hasUpdateUserClaim = currentUser?.claims?.includes('CanUpdateUsers');
  const hasDeleteUserClaim = currentUser?.claims?.includes('CanDeleteUsers');

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

  const filteredUsers = users.filter((user) => {
    if (user.roleId === 1 || user.roleId === 2) return false;
    if (user.createdById !== currentUser?.id) return false;
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
          {hasCreateUserClaim && (
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
                  createdById: currentUser?.id || null,
                });
                setOpenModal(true);
              }}
            >
              Nouvel Utilisateur
            </Button>
          )}
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
          onRefresh={() => dispatch(fetchUsersByCreatedById(currentUser?.id))}
        />

        <TableUsers
          users={filteredUsers}
          loading={loading}
          onEdit={hasUpdateUserClaim ? handleEditUser : () => {}}
          onDelete={hasDeleteUserClaim ? handleOpenDeleteDialog : () => {}}
          onToggleActive={handleToggleActive}
          onManagePermissions={(user) => {
            setSelectedUser({
              ...user,
              claimIds: user.claimIds || [],
            });
            setOpenPermissionsModal(true);
          }}
          setOpenModal={setOpenModal}
          columns={userColumns.map((column) => {
            if (column.id === 'actions') {
              return {
                ...column,
                render: (user, { onEdit, onDelete }) => (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {hasUpdateUserClaim && (
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          sx={{ mr: 1 }}
                          onClick={() => {
                            console.log('Edit icon clicked for user:', user);
                            onEdit(user);
                          }}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {hasDeleteUserClaim && (
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(user.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                ),
              };
            }
            return column;
          })}
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
          claims={claims}
          requiredFields={getRequiredFields()}
          showFields={getShowFields()}
          disabledFields={editMode ? ['role'] : []}
          loading={isCreating}
        />

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => {
            setOpenPermissionsModal(false);
            setSelectedUser(null);
            dispatch(fetchUsersByCreatedById(currentUser?.id));
          }}
          user={selectedUser}
          claims={claims}
          onPermissionChange={(permissionId) => {
            if (!selectedUser) return;
            const updatedClaimIds = selectedUser.claimIds.includes(permissionId)
              ? selectedUser.claimIds.filter((id) => id !== permissionId)
              : [...selectedUser.claimIds, permissionId];
            setSelectedUser({ ...selectedUser, claimIds: updatedClaimIds });
          }}
        />

        <AlertUser
          open={snackbar.open}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
          severity={snackbar.severity}
        />

        {hasDeleteUserClaim && (
          <Dialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">Confirmer la suppression</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
              <Button onClick={handleConfirmDelete} color="error" autoFocus>
                Supprimer
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default UserManagement;