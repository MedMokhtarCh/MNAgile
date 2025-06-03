import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { signup, fetchUsers, deleteUser, toggleUserActive, setSnackbar, fetchRoles, fetchClaims, updateUser } from '../store/slices/usersSlice';
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

const AdminManagement = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { users, roles, claims, usersLoading, snackbar } = useSelector((state) => state.users);

  // State for modals, dialogs, and form
  const [openModal, setOpenModal] = useState(false);
  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [localAlert, setLocalAlert] = useState({ open: false, message: '', severity: 'info', title: '' });
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    entreprise: '',
    roleId: 2,
    claimIds: [],
    isActive: true,
    subscription: {
      plan: 'annual',
      status: 'Pending',
      startDate: new Date().toISOString(),
      endDate: '',
    },
  });

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterSubscriptionStatus, setFilterSubscriptionStatus] = useState('all');

  // Filter admins (roleId === 2)
  const filteredAdmins = useMemo(() => {
    return users.filter(
      (admin) =>
        admin &&
        admin.roleId === 2 &&
        (admin.email
          ? admin.email.toLowerCase().includes(searchTerm.toLowerCase())
          : false || admin.entreprise
          ? admin.entreprise.toLowerCase().includes(searchTerm.toLowerCase())
          : false) &&
        (filterStatus === 'all' ||
          (filterStatus === 'active' && admin.isActive) ||
          (filterStatus === 'inactive' && !admin.isActive)) &&
        (filterPlan === 'all' ||
          (admin.subscription && admin.subscription.plan === filterPlan)) &&
        (filterSubscriptionStatus === 'all' ||
          (admin.subscription && admin.subscription.status === filterSubscriptionStatus))
    );
  }, [users, searchTerm, filterStatus, filterPlan, filterSubscriptionStatus]);

  // Fetch users, roles, and claims
  const fetchAdmins = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchUsers()).unwrap(),
        dispatch(fetchRoles()).unwrap(),
        dispatch(fetchClaims()).unwrap(),
      ]);
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error.message || 'Erreur lors de la récupération des données',
          severity: 'error',
        })
      );
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Handle create or update admin
  const handleSaveUser = async () => {
    try {
      if (editMode) {
        const userData = {
          email: newUser.email,
          password: newUser.password || undefined,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phoneNumber: newUser.phoneNumber,
          entreprise: newUser.entreprise,
          roleId: 2,
          claimIds: newUser.claimIds,
          isActive: newUser.isActive,
          subscription: {
            ...newUser.subscription,
            status: newUser.subscription.status || 'Pending',
          },
        };
        await dispatch(updateUser({ id: currentUserId, userData })).unwrap();
        dispatch(
          setSnackbar({
            open: true,
            message: 'Administrateur modifié avec succès',
            severity: 'success',
          })
        );
      } else {
        await dispatch(
          signup({
            email: newUser.email,
            password: newUser.password,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phoneNumber: newUser.phoneNumber,
            entreprise: newUser.entreprise,
            plan: newUser.subscription.plan,
            roleId: 2,
            claimIds: newUser.claimIds,
            autoValidate: false,
          })
        ).unwrap();
        dispatch(
          setSnackbar({
            open: true,
            message: 'Administrateur créé avec succès',
            severity: 'success',
          })
        );
      }
      handleCloseModal();
      // Keep fetchAdmins to ensure backend sync
      fetchAdmins();
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error.message || 'Erreur lors de la sauvegarde de l’administrateur',
          severity: 'error',
        })
      );
    }
  };

  // Handle edit admin
  const handleEditUser = (user) => {
    if (!user || !user.email) {
      dispatch(
        setSnackbar({
          open: true,
          message: 'Utilisateur non valide',
          severity: 'error',
        })
      );
      return;
    }
    setNewUser({
      ...user,
      password: '',
      claimIds: user.claimIds || [],
      subscription: user.subscription || {
        plan: 'annual',
        status: 'Pending',
        startDate: new Date().toISOString(),
        endDate: '',
      },
    });
    setEditMode(true);
    setCurrentUserId(user.id);
    setOpenModal(true);
  };

  // Handle delete admin
  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await dispatch(deleteUser(userToDelete)).unwrap();
        dispatch(
          setSnackbar({
            open: true,
            message: 'Administrateur supprimé avec succès',
            severity: 'success',
          })
        );
        fetchAdmins();
      } catch (error) {
        dispatch(
          setSnackbar({
            open: true,
            message: error.message || 'Erreur lors de la suppression de l’administrateur',
            severity: 'error',
          })
        );
      }
    }
    handleCloseDeleteDialog();
  };

  // Handle toggle active status
  const handleToggleActive = async (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    try {
      await dispatch(toggleUserActive({ id, isActive: !user.isActive })).unwrap();
      fetchAdmins();
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error.message || 'Erreur lors de la mise à jour du statut',
          severity: 'error',
        })
      );
    }
  };

  // Handle permissions change (update local state only)
  const handlePermissionChange = (permissionId) => {
    if (!selectedAdmin) return;
    const updatedClaimIds = selectedAdmin.claimIds.includes(permissionId)
      ? selectedAdmin.claimIds.filter((id) => id !== permissionId)
      : [...selectedAdmin.claimIds, permissionId];
    setSelectedAdmin({ ...selectedAdmin, claimIds: updatedClaimIds });
  };

  // Modal and dialog handlers
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
      subscription: {
        plan: 'annual',
        status: 'Pending',
        startDate: new Date().toISOString(),
        endDate: '',
      },
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

  const handleCloseSnackbar = () => {
    dispatch(setSnackbar({ open: false, message: '', severity: 'success' }));
  };

  const availableRoles = roles
    .filter((role) => role.id === 2)
    .map((role) => ({
      id: role.id,
      label: role.label,
      iconName: role.iconName,
      disabled: false,
    }));

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
                subscription: {
                  plan: 'annual',
                  status: 'Pending',
                  startDate: new Date().toISOString(),
                  endDate: '',
                },
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
            {
              id: 'plan',
              label: 'Plan',
              options: [
                { value: 'all', label: 'Tous' },
                { value: 'annual', label: 'Annuel' },
                { value: 'quarterly', label: 'Trimestriel' },
                { value: 'monthly', label: 'Mensuel' },
              ],
            },
            {
              id: 'subscriptionStatus',
              label: 'Statut Abonnement',
              options: [
                { value: 'all', label: 'Tous' },
                { value: 'Active', label: 'Validé' },
                { value: 'Pending', label: 'En attente' },
              ],
            },
          ]}
          filterValues={{ status: filterStatus, plan: filterPlan, subscriptionStatus: filterSubscriptionStatus }}
          setFilterValues={(values) => {
            setFilterStatus(values.status);
            setFilterPlan(values.plan);
            setFilterSubscriptionStatus(values.subscriptionStatus);
          }}
          onRefresh={fetchAdmins}
        />

        <TableUsers
          users={filteredAdmins}
          loading={usersLoading}
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
          getAvatarColor={(admin) => getAvatarColor(admin.email || '')}
        />

        <UserForm
          open={openModal}
          onClose={handleCloseModal}
          user={newUser}
          setUser={setNewUser}
          onSave={handleSaveUser}
          isEditMode={editMode}
          roles={availableRoles}
          claims={claims}
          requiredFields={['email', 'firstName', 'lastName', 'entreprise', 'subscription.plan']}
          showFields={['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'entreprise', 'role', 'permissions', 'subscription']}
          disabledFields={editMode ? ['role', 'subscription.plan'] : []}
          loading={usersLoading}
          setLocalAlert={setLocalAlert}
        />

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => {
            setOpenPermissionsModal(false);
            setSelectedAdmin(null);
            fetchAdmins();
          }}
          user={selectedAdmin}
          claims={claims}
          onPermissionChange={handlePermissionChange}
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