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
  checkUserExists,
  clearUserExists,
  setSnackbar,
} from '../store/slices/usersSlice';
import { validateUser } from '../utils/validators';
import { useAuth } from '../contexts/AuthContext';
import { Security as SecurityIcon, SupervisorAccount as SupervisorAccountIcon, Person as PersonIcon } from '@mui/icons-material';

// Default role IDs that are system-defined
const DEFAULT_ROLE_IDS = [1, 2, 3, 4];

export const useUsers = (storageKey) => {
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
    roleId: currentUser?.roleId === 1 ? 2 : 4,
    jobTitle: '',
    entreprise: '',
    claimIds: [],
    isActive: true,
  });
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [emailChecked, setEmailChecked] = useState(false);

  const availableRoles = roles
  .filter((role) => {
    if (currentUser?.roleId === 1) {
      // Super admin: can assign role ID 2 and any non-default roles
      return role.id === 2 || !DEFAULT_ROLE_IDS.includes(role.id);
    }
    if (currentUser?.roleId === 2) {
      // Admin: can assign role IDs 3, 4, and any non-default roles
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
      dispatch(fetchUsers());
      dispatch(fetchRoles());
      dispatch(fetchClaims());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    // Placeholder for any modal-related side effects
  }, [openModal]);

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
      roleId: storageKey === 'admins' ? 2 : newUser.roleId,
      jobTitle: [3, 4].includes(newUser.roleId) ? newUser.jobTitle : null,
      entreprise: newUser.roleId === 2 ? newUser.entreprise : null,
      claimIds: newUser.claimIds || [],
      isActive: newUser.isActive,
    };

    try {
      const action = editMode ? updateUser({ id: currentUserId, userData }) : createUser(userData);
      const result = await dispatch(action).unwrap();
      resetUserForm();
      dispatch(clearUserExists(newUser.email));
      return result;
    } catch (error) {
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
    setEmailChecked(false);
    dispatch(clearUserExists());
  };

  const handleEditUser = (user) => {
    if (!user) {
      console.error('No user provided for editing');
      dispatch(setSnackbar({ open: true, message: 'Utilisateur non valide.', severity: 'error' }));
      return;
    }
    console.log('Édition de l\'utilisateur:', user);
    setNewUser({
      ...user,
      password: '',
    });
    setEditMode(true);
    setCurrentUserId(user.id);
    setOpenModal(true);
    setEmailChecked(true);
  };

  const handleDeleteUser = async (id) => {
    try {
      await dispatch(deleteUser(id)).unwrap();
    } catch (error) {
      // Error handled in usersSlice
    }
  };

  const handleToggleActive = async (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    try {
      await dispatch(toggleUserActive({ id, isActive: !user.isActive })).unwrap();
    } catch (error) {
      // Error handled in usersSlice
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
    handleCheckEmail,
    emailChecked,
    userExists,
  };
};