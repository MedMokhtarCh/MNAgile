import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsersByCreatedById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  checkUserExists,
  clearUserExists,
  setSnackbar,
} from '../store/slices/usersSlice';
import { fetchRoles } from '../store/slices/rolesSlice';
import { fetchClaims } from '../store/slices/claimsSlice';
import { validateUser } from '../utils/validators';
import { useAuth } from '../contexts/AuthContext';
import { Security as SecurityIcon, SupervisorAccount as SupervisorAccountIcon, Person as PersonIcon } from '@mui/icons-material';

// Default role IDs that are system-defined
const DEFAULT_ROLE_IDS = [1, 2, 3, 4];

export const useUsers = (userType) => {
  const dispatch = useDispatch();
  const { users, loading: usersLoading, snackbar, userExists } = useSelector((state) => state.users);
  const { roles, usersLoading: rolesLoading } = useSelector((state) => state.roles);
  const { claims, loading: claimsLoading } = useSelector((state) => state.claims);
  const { currentUser } = useAuth();

  const [openModal, setOpenModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roleId: userType === 'superadmins' ? 1 : userType === 'admins' ? 2 : 3,
    jobTitle: '',
    entreprise: '',
    claimIds: userType === 'superadmins' ? [] : [],
    isActive: true,
    createdById: currentUser?.id || null,
    costPerHour: null,
    costPerDay: null,
    subscription: userType === 'admins' ? { plan: 'annual', status: 'Pending', startDate: new Date().toISOString(), endDate: '' } : null,
  });
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Derive available roles based on userType and currentUser role
  const availableRoles = roles
    .filter((role) => {
      if (userType === 'superadmins' && currentUser?.roleId === 1) {
        return role.id === 1; // Superadmins can only assign superadmin role
      }
      if (userType === 'admins' && currentUser?.roleId === 1) {
        return role.id === 2 || !DEFAULT_ROLE_IDS.includes(role.id); // Superadmin can assign admin or custom roles
      }
      if (userType === 'users' && currentUser?.roleId === 1) {
        return [3, 4].includes(role.id) || !DEFAULT_ROLE_IDS.includes(role.id); // Superadmin can assign user roles or custom
      }
      if (currentUser?.roleId === 2) {
        return [3, 4].includes(role.id) || !DEFAULT_ROLE_IDS.includes(role.id); // Admins can assign user roles or custom
      }
      return false;
    })
    .map((role) => ({
      id: role.id,
      label: role.label,
      icon:
        role.iconName === 'Security' ? <SecurityIcon /> :
        role.iconName === 'SupervisorAccount' ? <SupervisorAccountIcon /> : <PersonIcon />,
    }));

  // Fetch initial data when currentUser is available
  useEffect(() => {
    if (currentUser) {
      setNewUser((prev) => ({
        ...prev,
        createdById: currentUser.id,
      }));
      dispatch(fetchUsersByCreatedById(currentUser.id));
      dispatch(fetchRoles());
      dispatch(fetchClaims());
    }
  }, [dispatch, currentUser]);

  // Handle closing the snackbar
  const handleCloseSnackbar = () => {
    dispatch(setSnackbar({ open: false, message: '', severity: 'success' }));
  };

  // Check if email is valid and available
  const handleCheckEmail = async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailChecked(false);
      dispatch(setSnackbar({ open: true, message: 'Veuillez entrer un email valide.', severity: 'error' }));
      return;
    }
    try {
      await dispatch(checkUserExists(email)).unwrap();
      setEmailChecked(true);
    } catch (error) {
      setEmailChecked(false);
      dispatch(setSnackbar({ open: true, message: error || 'Erreur lors de la vérification de l\'email.', severity: 'error' }));
    }
  };

  // Create or update a user
  const handleCreateUser = async (requiredFields) => {
    const errors = validateUser(newUser, requiredFields, editMode);
    if (errors.length > 0) {
      dispatch(setSnackbar({ open: true, message: errors[0], severity: 'error' }));
      return;
    }

    if (!editMode && userExists[newUser.email] === true) {
      dispatch(setSnackbar({ open: true, message: 'Cet email est déjà utilisé.', severity: 'error' }));
      return;
    }

    if (
      editMode &&
      newUser.email !== users.find((u) => u.id === currentUserId)?.email &&
      userExists[newUser.email] === true
    ) {
      dispatch(setSnackbar({
        open: true,
        message: 'Cet email est déjà utilisé par un autre utilisateur.',
        severity: 'error',
      }));
      return;
    }

    const userData = {
      email: newUser.email,
      password: editMode ? newUser.password || undefined : newUser.password,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phoneNumber: newUser.phoneNumber,
      roleId: userType === 'superadmins' ? 1 : userType === 'admins' ? 2 : newUser.roleId,
      jobTitle:newUser.jobTitle || null,
      entreprise: newUser.roleId === 2 ? newUser.entreprise : null,
      claimIds: userType === 'superadmins' ? [] : (newUser.claimIds || []),
      isActive: newUser.isActive,
      createdById: newUser.createdById || currentUser?.id || null,
      costPerHour:newUser.costPerHour|| null,
      costPerDay:newUser.costPerDay|| null,
      subscription: newUser.roleId === 2 ? newUser.subscription : null,
    };

    try {
      setIsCreating(true);
      const action = editMode ? updateUser({ id: currentUserId, userData }) : createUser(userData);
      const result = await dispatch(action).unwrap();
      resetUserForm();
      dispatch(clearUserExists(newUser.email));

      dispatch(setSnackbar({
        open: true,
        message: editMode ? 'Utilisateur mis à jour avec succès.' : 'Utilisateur créé avec succès.',
        severity: 'success',
      }));
      return result;
    } catch (error) {
      dispatch(setSnackbar({
        open: true,
        message: error || (editMode ? 'Échec de la mise à jour de l\'utilisateur.' : 'Échec de la création de l\'utilisateur.'),
        severity: 'error',
      }));
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Reset the user form
  const resetUserForm = () => {
    setNewUser({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      roleId: userType === 'superadmins' ? 1 : userType === 'admins' ? 2 : 3,
      jobTitle: '',
      entreprise: '',
      claimIds: userType === 'superadmins' ? [] : [],
      isActive: true,
      createdById: currentUser?.id || null,
      costPerHour: null,
      costPerDay: null,
      subscription: userType === 'admins' ? { plan: 'annual', status: 'Pending', startDate: new Date().toISOString(), endDate: '' } : null,
    });
    setEditMode(false);
    setCurrentUserId(null);
    setOpenModal(false);
    setEmailChecked(false);
    dispatch(clearUserExists());
  };

  // Edit an existing user
  const handleEditUser = (user) => {
    if (!user) {
      dispatch(setSnackbar({ open: true, message: 'Utilisateur non valide.', severity: 'error' }));
      return;
    }
    setNewUser({
      ...user,
      password: '',
      claimIds: user.roleId === 1 ? [] : (user.claimIds || []),
      createdById: user.createdById || currentUser?.id || null,
      costPerHour: user.costPerHour || null,
      costPerDay: user.costPerDay || null,
      subscription: user.roleId === 2 ? (user.subscription || { plan: 'annual', status: 'Pending', startDate: new Date().toISOString(), endDate: '' }) : null,
    });
    setEditMode(true);
    setCurrentUserId(user.id);
    setOpenModal(true);
    setEmailChecked(true);
  };

  // Delete a user
  const handleDeleteUser = async (id) => {
    try {
      await dispatch(deleteUser(id)).unwrap();
      dispatch(setSnackbar({ open: true, message: 'Utilisateur supprimé avec succès.', severity: 'success' }));
    } catch (error) {
      dispatch(setSnackbar({
        open: true,
        message: error || 'Échec de la suppression de l\'utilisateur.',
        severity: 'error',
      }));
    }
  };

  // Toggle user active status
  const handleToggleActive = async (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    try {
      await dispatch(toggleUserActive({ id, isActive: !user.isActive })).unwrap();
      dispatch(setSnackbar({
        open: true,
        message: `Utilisateur ${user.isActive ? 'désactivé' : 'activé'} avec succès.`,
        severity: 'success',
      }));
    } catch (error) {
      dispatch(setSnackbar({
        open: true,
        message: error || 'Échec de la mise à jour du statut de l\'utilisateur.',
        severity: 'error',
      }));
    }
  };

  // Get user by email
  const getUserByEmail = (email) => {
    return users.find((user) => user.email === email);
  };

  // Handle modal close
  const handleCloseModal = () => {
    resetUserForm();
  };

  return {
    users,
    loading: usersLoading || rolesLoading || claimsLoading,
    newUser,
    setNewUser,
    editMode,
    setEditMode,
    currentUserId,
    setCurrentUserId,
    availableRoles,
    claims,
    openModal,
    setOpenModal,
    handleCreateUser,
    handleEditUser,
    handleDeleteUser,
    handleToggleActive,
    handleCloseModal,
    snackbar,
    handleCloseSnackbar,
    getUserByEmail,
    handleCheckEmail,
    emailChecked,
    userExists,
    isCreating,
  };
};