import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
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
import { fetchRolesByUserId } from '../store/slices/rolesSlice';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { generateInitials, getAvatarColor } = useAvatar();

  // Access roles state from Redux store
  const rolesState = useSelector((state) => state.roles || { roles: [], usersLoading: false });
  const { roles, usersLoading: rolesLoading } = rolesState;

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
    claims,
    handleCreateUser,
    handleEditUser,
    handleDeleteUser,
    handleToggleActive,
    handleCloseModal,
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

  // Derive permissions from currentUser's claims
  const hasCreateUserClaim = currentUser?.claims?.includes('CanCreateUsers') || false;
  const hasUpdateUserClaim = currentUser?.claims?.includes('CanUpdateUsers') || false;
  const hasDeleteUserClaim = currentUser?.claims?.includes('CanDeleteUsers') || false;

  // Define available roles: default user roles (roleId 3 and 4) and roles created by the current user
  const filteredRoles = useMemo(() => {
    const defaultRoles = [
      { id: 3, label: 'Chef de projet', iconName: 'ManageAccounts' },
      { id: 4, label: 'Utilisateur', iconName: 'Person' },
    ];
    const userCreatedRoles = roles.filter((role) => role.createdByUserId === currentUser?.id);
    const combinedRoles = [...defaultRoles, ...userCreatedRoles].filter(Boolean);
    return combinedRoles.map((role) => ({
      id: role.id,
      label: role.label,
      iconName: role.iconName || 'Person',
      disabled: false,
    }));
  }, [roles, currentUser]);

  // Role filter options for FilterBar
  const roleFilterOptions = useMemo(() => {
    return [
      { value: 'all', label: 'Tous' },
      { value: 'user', label: 'Utilisateurs' },
      { value: 'chef_projet', label: 'Chefs de projet' },
      ...filteredRoles
        .filter((role) => role.id > 4)
        .map((role) => ({
          value: `role_${role.id}`,
          label: role.label,
        })),
    ];
  }, [filteredRoles]);

  // Fetch users and roles
  const fetchData = useCallback(async () => {
    try {
      if (currentUser?.id) {
        await Promise.all([
          dispatch(fetchUsersByCreatedById(currentUser.id)).unwrap(),
          dispatch(fetchRolesByUserId(currentUser.id)).unwrap(),
        ]);
      }
    } catch (error) {
      // Error handling is managed by useUsers hook
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDeleteDialog = (id) => {
    if (!hasDeleteUserClaim) return;
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
        await handleDeleteUser(userToDelete);
        dispatch(fetchUsersByCreatedById(currentUser.id));
      } catch (error) {
        // Error handled in useUsers
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
      (filterRole === 'chef_projet' && user.roleId === 3) ||
      (filterRole.startsWith('role_') && user.roleId === Number(filterRole.split('_')[1]));
    return matchesSearch && matchesFilter && matchesRole;
  });

  const getRequiredFields = () => {
    return ['email', 'firstName', 'lastName'];
  };

  const getShowFields = () => {
    return ['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'jobTitle', 'role', 'permissions', 'costPerHour', 'costPerDay'];
  };

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
                 jobTitle: '',
                  entreprise: currentUser?.entreprise || '',
                  roleId: 4,
                  claimIds: [],
                  isActive: true,
                  createdById: currentUser?.id || null,
                  costPerHour: '',
                  costPerDay: '',
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
              options: roleFilterOptions,
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
  loading={loading || rolesLoading}
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
    // Pass roles to the role column
    if (column.id === 'role') {
      return {
        ...column,
        render: (user, props) => column.render(user, { ...props, roles: filteredRoles }),
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