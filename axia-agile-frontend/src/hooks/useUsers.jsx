import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers,
  fetchUsersByCreatedById,
  fetchRoles,
  fetchClaims,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  checkUserExists,
  clearUserExists,
  setSnackbar,
} from '../store/slices/usersSlice';
import { validateUser } from '../utils/validators';
import { useAuth } from '../contexts/AuthContext';
import { Security as SecurityIcon, SupervisorAccount as SupervisorAccountIcon, Person as PersonIcon } from '@mui/icons-material';

// Default role IDs that are system-defined
const DEFAULT_ROLE_IDS = [1, 2, 3, 4];

export const useUsers = (userType) => {
  const dispatch = useDispatch();
  const { users, roles, claims, loading, snackbar, userExists } = useSelector((state) => state.users);
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
  });
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const availableRoles = roles
    .filter((role) => {
      if (userType === 'superadmins' && currentUser?.roleId === 1) {
        return role.id === 1;
      }
      if (userType === 'admins' && currentUser?.roleId === 1) {
        return role.id === 2 || !DEFAULT_ROLE_IDS.includes(role.id);
      }
      if (userType === 'users' && currentUser?.roleId === 1) {
        return [3, 4].includes(role.id) || !DEFAULT_ROLE_IDS.includes(role.id);
      }
      if (currentUser?.roleId === 2) {
        return [3, 4].includes(role.id) || !DEFAULT_ROLE_IDS.includes(role.id);
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

  useEffect(() => {
    console.log('useUsers - openModal changed:', openModal, 'Stack:', new Error().stack);
  }, [openModal]);

  const closeModal = () => {
    console.log('useUsers - closeModal called, Stack:', new Error().stack);
    setOpenModal(false);
  };

  const handleCloseSnackbar = () => {
    dispatch(setSnackbar({ open: false, message: '', severity: 'success' }));
  };

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
    }
  };

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
      jobTitle: [3, 4].includes(newUser.roleId) ? newUser.jobTitle : null,
      entreprise: newUser.roleId === 2 ? newUser.entreprise : null,
      claimIds: userType === 'superadmins' ? [] : (newUser.claimIds || []),
      isActive: newUser.isActive,
      createdById: newUser.createdById || currentUser?.id || null,
    };

    try {
      setIsCreating(true);
      const action = editMode ? updateUser({ id: currentUserId, userData }) : createUser(userData);
      const result = await dispatch(action).unwrap();
      resetUserForm();
      dispatch(clearUserExists(newUser.email));

      setTimeout(() => {
        dispatch(fetchUsersByCreatedById(currentUser.id));
      }, 1000);

      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

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
    });
    setEditMode(false);
    setCurrentUserId(null);
    closeModal();
    setEmailChecked(false);
    dispatch(clearUserExists());
  };

  const handleEditUser = (user) => {
    if (!user) {
      console.error('No user provided for editing');
      dispatch(setSnackbar({ open: true, message: 'Utilisateur non valide.', severity: 'error' }));
      return;
    }
    console.log('useUsers - Editing user:', user);
    setNewUser({
      ...user,
      password: '',
      claimIds: user.roleId === 1 ? [] : (user.claimIds || []),
      createdById: user.createdById || currentUser?.id || null,
    });
    setEditMode(true);
    setCurrentUserId(user.id);
    setOpenModal(true);
    setEmailChecked(true);
  };

  const handleDeleteUser = async (id) => {
    try {
      await dispatch(deleteUser(id)).unwrap();
      dispatch(fetchUsersByCreatedById(currentUser.id));
    } catch (error) {
      // Error handled in usersSlice
    }
  };

  const handleToggleActive = async (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    try {
      await dispatch(toggleUserActive({ id, isActive: !user.isActive })).unwrap();
      dispatch(fetchUsersByCreatedById(currentUser.id));
    } catch (error) {
      // Error handled in usersSlice
    }
  };

  const getUserByEmail = (email) => {
    return users.find((user) => user.email === email);
  };

  const handleCloseModal = () => {
    console.log('useUsers - handleCloseModal called, Stack:', new Error().stack);
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
    handleCheckEmail,
    emailChecked,
    userExists,
    isCreating,
  };
};