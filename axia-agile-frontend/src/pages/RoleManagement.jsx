import React, { useState, useEffect } from 'react';
import { Box, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRoles,
  fetchRolesByUserId,
  createRole,
  updateRole,
  deleteRole,
} from '../store/slices/rolesSlice';
import { setSnackbar } from '../store/slices/usersSlice';
import FilterBar from '../components/users/FilterBarUsers';
import TableRoles from '../components/roles/TableRoles';
import RoleForm from '../components/roles/RoleForm';
import AlertUser from '../components/common/AlertUser';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import { useAuth } from '../contexts/AuthContext';

const RoleManagement = () => {
  const dispatch = useDispatch();
  const { currentUser, hasRole } = useAuth();
  const rolesState = useSelector((state) => state.roles || { roles: [], usersLoading: false });
  const { roles, usersLoading: loading } = rolesState;
  const usersState = useSelector((state) => state.users || { snackbar: { open: false, message: '', severity: 'success' } });
  const { snackbar } = usersState;

  const [openModal, setOpenModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '' });
  const [editMode, setEditMode] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      if (hasRole('SuperAdmin')) {
        dispatch(fetchRoles());
      } else {
        dispatch(fetchRolesByUserId(currentUser.id));
      }
    }
  }, [dispatch, currentUser, hasRole]);

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewRole({ name: '' });
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
      const action = editMode
        ? updateRole({ id: currentRoleId, name: newRole.name })
        : createRole({ name: newRole.name, createdByUserId: currentUser.id });
      await dispatch(action).unwrap();
      await dispatch(hasRole('SuperAdmin') ? fetchRoles() : fetchRolesByUserId(currentUser.id));
      handleCloseModal();
    } catch (error) {
      // Errors are handled in rolesSlice
    }
  };

  const handleEditRole = (role) => {
    if (!role) {
      dispatch(setSnackbar({ open: true, message: 'Rôle non valide.', severity: 'error' }));
      return;
    }
    setNewRole({ name: role.label, id: role.id });
    setEditMode(true);
    setCurrentRoleId(role.id);
    setOpenModal(true);
  };

  const handleDeleteRole = async (id) => {
    try {
      await dispatch(deleteRole(id)).unwrap();
      await dispatch(hasRole('SuperAdmin') ? fetchRoles() : fetchRolesByUserId(currentUser.id));
    } catch (error) {
      // Errors are handled in rolesSlice
    }
  };

  const DEFAULT_ROLE_IDS = [1, 2, 3, 4];

  const filteredRoles = roles.filter((role) =>
    role.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (
      (hasRole('SuperAdmin') && (DEFAULT_ROLE_IDS.includes(role.id) || role.createdByUserId === currentUser.id)) ||
      (!hasRole('SuperAdmin') && role.createdByUserId === currentUser.id)
    )
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
          onRefresh={() => dispatch(hasRole('SuperAdmin') ? fetchRoles() : fetchRolesByUserId(currentUser.id))}
        />

        <TableRoles
          roles={filteredRoles}
          loading={loading}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          setOpenModal={setOpenModal}
          setEditMode={setEditMode}
          setNewRole={setNewRole}
        />

        <RoleForm
          open={openModal}
          onClose={handleCloseModal}
          role={newRole}
          setRole={setNewRole}
          onSave={handleCreateRole}
          isEditMode={editMode}
          existingRoles={roles}
          currentUserId={currentUser?.id}
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