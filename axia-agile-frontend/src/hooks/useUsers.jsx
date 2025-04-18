import { useState, useEffect } from 'react';
import { getStoredData, setStoredData, getCurrentUser } from '../utils/storage';
import { validateUser } from '../utils/validators';
import { getAvailableRoles } from '../utils/roles';

export const useUsers = (storageKey) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    telephone: '',
    role: storageKey === 'admins' ? 'admin' : 'user',
    jobTitle: '',
    entreprise: '',
    adresse: '',
    permissions: [],
    isActive: true,
  });
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const currentUser = getCurrentUser();
  const availableRoles = getAvailableRoles(currentUser);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const storedUsers = getStoredData(storageKey) || [];
      setUsers(storedUsers.map((user) => ({
        ...user,
        permissions: user.permissions || [],
        isActive: user.isActive !== undefined ? user.isActive : true,
        jobTitle: user.jobTitle || '',
        entreprise: user.entreprise || '',
        adresse: user.adresse || '',
      })));
      setLoading(false);
    }, 500);
  }, [storageKey]);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCreateUser = (requiredFields) => {
    const errors = validateUser(newUser, requiredFields, editMode);
    if (errors.length > 0) {
      showSnackbar(errors[0], 'error');
      return;
    }

    if (!editMode && users.some(user => user.email === newUser.email)) {
      showSnackbar('Cet email est déjà utilisé', 'error');
      return;
    }

    const userData = {
      ...newUser,
      role: storageKey === 'admins' ? 'admin' : newUser.role,
      isActive: true,
      permissions: newUser.permissions || []
    };

    if (editMode) {
      const updatedUsers = users.map(user => 
        user.id === currentUserId ? { ...user, ...userData } : user
      );
      setUsers(updatedUsers);
      setStoredData(storageKey, updatedUsers);
      showSnackbar('Utilisateur modifié avec succès!', 'success');
    } else {
      const updatedUsers = [
        ...users,
        {
          ...userData,
          id: Date.now(),
          dateCreated: new Date().toISOString(),
          lastLogin: null,
          createdBy: currentUser.email,
        }
      ];
      setUsers(updatedUsers);
      setStoredData(storageKey, updatedUsers);
      showSnackbar(
        storageKey === 'admins' ? 'Admin créé avec succès!' : 
        newUser.role === 'chef_projet' ? 'Chef de projet créé avec succès!' : 'Utilisateur créé avec succès!',
        'success'
      );
    }

    // Reset form
    setNewUser({
      email: '',
      password: '',
      nom: '',
      prenom: '',
      telephone: '',
      role: storageKey === 'admins' ? 'admin' : 'user',
      jobTitle: '',
      entreprise: '',
      adresse: '',
      permissions: [],
      isActive: true,
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  const handleEditUser = (id) => {
    const userToEdit = users.find(user => user.id === id);
    if (userToEdit) {
      setNewUser({ ...userToEdit, password: '' });
      setEditMode(true);
      setCurrentUserId(id);
    }
  };

  const handleDeleteUser = (id) => {
    const user = users.find(u => u.id === id);
    const updatedUsers = users.filter(user => user.id !== id);
    setUsers(updatedUsers);
    setStoredData(storageKey, updatedUsers);
    showSnackbar(`Compte supprimé pour ${user.email}`, 'success');
  };

  const handleToggleActive = (id) => {
    const updatedUsers = users.map(user =>
      user.id === id ? { ...user, isActive: !user.isActive } : user
    );
    setUsers(updatedUsers);
    setStoredData(storageKey, updatedUsers);
    const user = updatedUsers.find(u => u.id === id);
    showSnackbar(`Compte ${user.isActive ? 'activé' : 'désactivé'} pour ${user.email}`, 'info');
  };
  const getUserByEmail = (email) => {
    const storedUsers = getStoredData(storageKey) || [];
    return storedUsers.find((user) => user.email === email);
  };

  return {
    users,
    setUsers,
    loading,
    setLoading,
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
    getUserByEmail,
  };
};