import React, { useState, useEffect } from 'react';
import { Box, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  setSnackbar,
} from '../store/slices/usersSlice';
import FilterBar from '../components/users/FilterBarUsers';
import TableRoles from '../components/roles/TableRoles';
import RoleForm from '../components/roles/RoleForm';
import AlertUser from '../components/common/AlertUser';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import { useAuth } from '../contexts/AuthContext';

const RoleManagement = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { roles, loading, snackbar } = useSelector((state) => state.users);

  const [openModal, setOpenModal] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchRoles());
    }
  }, [dispatch, currentUser]);

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewRole({
      name: '',
    });
    setEditMode(false);
    setCurrentRoleId(null);
  };

  const handleCloseSnackbar = () => {
    dispatch(setSnackbar({ open: false, message: '', severity: 'success' }));
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      dispatch(setSnackbar({ open: true, message: 'Le nom du rôle est requis.', severity: 'error' }));
      return;
    }

    try {
      const action = editMode ? updateRole({ id: currentRoleId, name: newRole.name }) : createRole({ name: newRole.name });
      await dispatch(action).unwrap();
      await dispatch(fetchRoles()); // Refetch roles to sync state
      handleCloseModal();
    } catch (error) {
      // Error is already handled in usersSlice
    }
  };

  const handleEditRole = (role) => {
    if (!role) {
      dispatch(setSnackbar({ open: true, message: 'Rôle non valide.', severity: 'error' }));
      return;
    }
    setNewRole({
      name: role.label,
    });
    setEditMode(true);
    setCurrentRoleId(role.id);
    setOpenModal(true);
  };

  const handleDeleteRole = async (id) => {
    try {
      await dispatch(deleteRole(id)).unwrap();
      await dispatch(fetchRoles()); // Refetch roles after deletion
    } catch (error) {
      // Error is already handled in usersSlice
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <PageTitle>Gestion des Rôles</PageTitle>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditMode(false);
              setNewRole({ name: '' });
              setOpenModal(true);
            }}
            sx={{ px: 3 }}
          >
            Nouveau Rôle
          </Button>
        </Box>

        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterOptions={[]}
          filterValues={{}}
          setFilterValues={() => {}}
          onRefresh={() => dispatch(fetchRoles())}
        />

        <TableRoles
          roles={filteredRoles}
          loading={loading}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          setOpenModal={setOpenModal}
        />

        <RoleForm
          open={openModal}
          onClose={handleCloseModal}
          role={newRole}
          setRole={setNewRole}
          onSave={handleCreateRole}
          isEditMode={editMode}
        />

        <AlertUser
          open={snackbar.open}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
          severity={snackbar.severity}
        />
      </Box>
    </ThemeProvider>
  );
};

export default RoleManagement;