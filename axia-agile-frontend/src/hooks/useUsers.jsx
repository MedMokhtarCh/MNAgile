import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers,
  fetchRoles,
  fetchClaims,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  setSnackbar,
} from '../store/slices/usersSlice';
import { validateUser } from '../utils/validators';
import { useAuth } from '../contexts/AuthContext';
import { Security as SecurityIcon, SupervisorAccount as SupervisorAccountIcon, Person as PersonIcon } from '@mui/icons-material';

export const useUsers = (storageKey) => {
  const dispatch = useDispatch();
  const { users, roles, claims, loading, error, snackbar } = useSelector((state) => state.users);
  const { currentUser } = useAuth();

  const [openModal, setOpenModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roleId: currentUser?.roleId === 1 ? 2 : 4,
    jobTitle: '',
    entreprise: '',
    claimIds: [],
    isActive: true,
  });

  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const availableRoles = roles
    .filter((role) => {
      if (currentUser?.roleId === 1) return role.id === 2;
      if (currentUser?.roleId === 2) return [3, 4].includes(role.id);
      return false;
    })
    .map((role) => ({
      id: role.id,
      label: role.label,
      icon: role.iconName === 'Security' ? <SecurityIcon /> :
            role.iconName === 'SupervisorAccount' ? <SupervisorAccountIcon /> : <PersonIcon />,
    }));

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRoles());
    dispatch(fetchClaims());
  }, [dispatch]);

  useEffect(() => {
    console.log('openModal state:', openModal);
  }, [openModal]);

  const handleCloseSnackbar = () => {
    dispatch(setSnackbar({ open: false, message: '', severity: 'success' }));
  };

  const handleCreateUser = async (requiredFields) => {
    const errors = validateUser(newUser, requiredFields, editMode);
    if (errors.length > 0) {
      dispatch(setSnackbar({ open: true, message: errors[0], severity: 'error' }));
      return;
    }

    const userData = {
      email: newUser.email,
      password: newUser.password,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phoneNumber: newUser.phoneNumber,
      roleId: storageKey === 'admins' ? 2 : newUser.roleId,
      jobTitle: [3, 4].includes(newUser.roleId) ? newUser.jobTitle : null,
      entreprise: newUser.roleId === 2 ? newUser.entreprise : null,
      claimIds: newUser.claimIds || [],
      isActive: newUser.isActive,
    };

    try {
      const action = editMode
        ? updateUser({ id: currentUserId, userData })
        : createUser(userData);

      const result = await dispatch(action).unwrap();
      resetUserForm();
      return result;
    } catch (error) {
      dispatch(setSnackbar({
        open: true,
        message: error.message || 'Une erreur est survenue',
        severity: 'error',
      }));
      throw error;
    }
  };

  const resetUserForm = () => {
    setNewUser({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      roleId: currentUser?.roleId === 1 ? 2 : 4,
      jobTitle: '',
      entreprise: '',
      claimIds: [],
      isActive: true,
    });
    setEditMode(false);
    setCurrentUserId(null);
    setOpenModal(false);
  };

  const handleEditUser = (user) => {
    if (!user) {
      console.error('No user provided for editing');
      dispatch(setSnackbar({
        open: true,
        message: 'Utilisateur non valide',
        severity: 'error',
      }));
      return;
    }
    console.log('Édition de l\'utilisateur:', user);
    setNewUser({
      ...user,
      password: '',
    });
    setEditMode(true);
    setCurrentUserId(user.id);
    setOpenModal((prev) => {
      console.log('Setting openModal to true, previous state:', prev);
      return true;
    });
  };

  const handleDeleteUser = async (id) => {
    try {
      await dispatch(deleteUser(id)).unwrap();
      dispatch(setSnackbar({
        open: true,
        message: 'Utilisateur supprimé avec succès',
        severity: 'success',
      }));
    } catch (error) {
      dispatch(setSnackbar({
        open: true,
        message: error.message || 'Échec de la suppression',
        severity: 'error',
      }));
    }
  };

  const handleToggleActive = async (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    try {
      await dispatch(toggleUserActive({
        id,
        isActive: !user.isActive,
      })).unwrap();
    } catch (error) {
      dispatch(setSnackbar({
        open: true,
        message: error.message || 'Échec du changement de statut',
        severity: 'error',
      }));
    }
  };

  const getUserByEmail = (email) => {
    return users.find((user) => user.email === email);
  };

  const handleCloseModal = () => {
    resetUserForm();
  };

  return {
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
  };
};