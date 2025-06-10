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
import { fetchUsers, deleteUser, toggleUserActive, setSnackbar, updateUser } from '../store/slices/usersSlice';
import { fetchClaims, clearSelectedClaim } from '../store/slices/claimsSlice';
import { signup } from '../store/slices/signupSlice';
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

  // Access state from Redux store
  const usersState = useSelector((state) => state.users || { users: [], usersLoading: false, snackbar: { open: false, message: '', severity: 'success' } });
  const { users, usersLoading, snackbar } = usersState;
  const claimsState = useSelector((state) => state.claims || { claims: [], loading: false, error: null });
  const { claims, loading: claimsLoading, error: claimsError } = claimsState;
  const { signupLoading } = useSelector((state) => state.signup);

  // State for modals, dialogs, and form
  const [openModal, setOpenModal] = useState(false);
  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [localAlert, setLocalAlert] = useState({ open: false, message: '', severity: 'info', title: '' });

  // Initialize newUser state
  const resetNewUser = () => ({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    entreprise: '',
    roleId: 2, // Fixed admin role
    claimIds: [],
    isActive: true,
    subscription: {
      plan: 'annual',
      status: 'Pending',
      startDate: new Date().toISOString(),
      endDate: '',
    },
  });

  const [newUser, setNewUser] = useState(resetNewUser());

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
        (admin?.email?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
         admin?.entreprise?.toLowerCase()?.includes(searchTerm.toLowerCase())) &&
        (filterStatus === 'all' ||
          (filterStatus === 'active' && admin.isActive) ||
          (filterStatus === 'inactive' && !admin.isActive)) &&
        (filterPlan === 'all' ||
          (filterPlan === 'none' ? !admin.subscription : admin.subscription?.plan === filterPlan)) &&
        (filterSubscriptionStatus === 'all' ||
          (filterSubscriptionStatus === 'none'
            ? !admin.subscription
            : admin.subscription?.status === filterSubscriptionStatus))
    );
  }, [users, searchTerm, filterStatus, filterPlan, filterSubscriptionStatus]);

  // Fetch users and claims
  const fetchAdmins = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchUsers()).unwrap(),
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
    return () => {
      dispatch(clearSelectedClaim());
    };
  }, [fetchAdmins, dispatch]);

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
          roleId: 2, // Fixed admin role
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
            roleId: 2, // Fixed admin role
            plan: newUser.subscription.plan,
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
      fetchAdmins();
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error.message || 'Erreur lors de la création ou modification de l\'administrateur',
          severity: 'error',
        })
      );
    }
  };

  const handleEditUser = (user) => {
    if (!user?.email) {
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
            message: error.message || 'Erreur lors de la suppression de l\'administrateur',
            severity: 'error',
          })
        );
      }
    }
    handleCloseDeleteDialog();
  };

  const handleToggleActive = async (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    try {
      await dispatch(toggleUserActive({ id, isActive: !user.isActive })).unwrap();
      dispatch(
        setSnackbar({
          open: true,
          message: `Administrateur ${user.isActive ? 'désactivé' : 'activé'} avec succès`,
          severity: 'success',
        })
      );
      fetchAdmins();
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error.message || 'Erreur lors de la mise à jour du statut de l\'administrateur',
          severity: 'error',
        })
      );
    }
  };

  const handlePermissionChange = async (permissionId) => {
    if (!selectedAdmin) return;
    const updatedClaimIds = selectedAdmin.claimIds.includes(permissionId)
      ? selectedAdmin.claimIds.filter((id) => id !== permissionId)
      : [...selectedAdmin.claimIds, permissionId];
    try {
      await dispatch(updateUser({ id: selectedAdmin.id, userData: { claimIds: updatedClaimIds } })).unwrap();
      setSelectedAdmin({ ...selectedAdmin, claimIds: updatedClaimIds });
      dispatch(
        setSnackbar({
          open: true,
          message: 'Permissions mises à jour avec succès',
          severity: 'success',
        })
      );
      fetchAdmins();
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error.message || 'Erreur lors de la mise à jour des permissions',
          severity: 'error',
        })
      );
    }
  };

  // Modal and dialog handlers
  const handleCloseModal = () => {
    setOpenModal(false);
    setNewUser(resetNewUser());
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

  useEffect(() => {
    if (claimsError) {
      dispatch(
        setSnackbar({
          open: true,
          message: claimsError,
          severity: 'error',
        })
      );
    }
  }, [claimsError, dispatch]);

  // Define admin role (roleId === 2)
  const availableRoles = useMemo(() => [
    {
      id: 2,
      label: 'Administrateur',
      iconName: 'SupervisorAccount',
      disabled: false,
    },
  ], []);

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
              setNewUser(resetNewUser());
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
                { value: 'none', label: 'Aucun' },
                { value: 'monthly', label: 'Mensuel' },
                { value: 'quarterly', label: 'Trimestriel' },
                { value: 'semiannual', label: 'Semestriel' },
                { value: 'annual', label: 'Annuel' },
              ],
            },
            {
              id: 'subscriptionStatus',
              label: 'Statut Abonnement',
              options: [
                { value: 'all', label: 'Tous' },
                { value: 'none', label: 'Aucun' },
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
          loading={usersLoading || signupLoading || claimsLoading}
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
          getAvatarColor={(admin) => getAvatarColor(admin?.email || '')}
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
  disabledFields={editMode ? ['role', 'subscription.plan'] : ['role']} 
  loading={editMode ? usersLoading : signupLoading}
  setLocalAlert={setLocalAlert}
/>

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => {
            setOpenPermissionsModal(false);
            setSelectedAdmin(null);
            dispatch(clearSelectedClaim());
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