import { useState, useEffect } from 'react';
import { Box, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUsers } from '../hooks/useUsers';
import UserForm from '../components/users/UserForm';
import TableUsers from '../components/users/TableUsers';
import PermissionsModal from '../components/permissions/PermissionsModal';
import AlertUser from '../components/common/AlertUser';
import FilterBar from '../components/users/FilterBarUsers';
import { superadminColumns } from '../components/users/tableColumnsUsers';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import AdminTabs from './AdminTabs';
import { useAuth } from '../contexts/AuthContext';
import { useAvatar } from '../hooks/useAvatar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsersByCreatedById, updateUser, setSnackbar } from '../store/slices/usersSlice';

const SuperadminManagement = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { generateInitials, getAvatarColor } = useAvatar();
  const { claims } = useSelector((state) => state.users);

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
    handleCreateUser,
    handleEditUser,
    handleDeleteUser,
    handleToggleActive,
    snackbar,
    handleCloseSnackbar,
    openModal,
    setOpenModal,
  } = useUsers('superadmins');

  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log('SuperadminManagement openModal state:', openModal);
  }, [openModal]);

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewUser({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      entreprise: '',
      roleId: 1,
      claimIds: [],
      isActive: true,
      createdById: currentUser?.id || null,
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  const filteredSuperadmins = users.filter(
    (admin) =>
      admin.roleId === 1 &&
      (admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.entreprise?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === 'all' ||
        (filterStatus === 'active' && admin.isActive) ||
        (filterStatus === 'inactive' && !admin.isActive))
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <AdminTabs />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <PageTitle>Gestion des Comptes Superadmin</PageTitle>
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
                roleId: 1,
                claimIds: [],
                isActive: true,
                createdById: currentUser?.id || null,
              });
              setOpenModal(true);
            }}
            sx={{ px: 3 }}
          >
            Nouveau Superadmin
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
          ]}
          filterValues={{ status: filterStatus }}
          setFilterValues={(values) => setFilterStatus(values.status)}
          onRefresh={() => dispatch(fetchUsersByCreatedById(currentUser?.id))}
        />

        <TableUsers
          users={filteredSuperadmins}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleActive={handleToggleActive}
          onManagePermissions={(admin) => {
            setSelectedAdmin({
              ...admin,
              claimIds: [],
            });
            setOpenPermissionsModal(true);
          }}
          setOpenModal={setOpenModal}
          columns={superadminColumns}
          generateInitials={generateInitials}
          getAvatarColor={(admin) => getAvatarColor(admin.email)}
        />

        <UserForm
          open={openModal}
          onClose={handleCloseModal}
          user={newUser}
          setUser={setNewUser}
          onSave={() => handleCreateUser(['email', 'firstName', 'lastName'])}
          isEditMode={editMode}
          roles={availableRoles}
          claims={claims}
          requiredFields={['email', 'firstName', 'lastName']}
          showFields={['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'role']}
          disabledFields={['role']}
        />

        <PermissionsModal
          open={openPermissionsModal}
          onClose={() => {
            setOpenPermissionsModal(false);
            setSelectedAdmin(null);
          }}
          user={selectedAdmin}
          claims={claims}
          onSave={async () => {
            if (!selectedAdmin) return;
            setIsSaving(true);
            const adminData = {
              id: selectedAdmin.id,
              email: selectedAdmin.email,
              firstName: selectedAdmin.firstName,
              lastName: selectedAdmin.lastName,
              phoneNumber: selectedAdmin.phoneNumber || null,
              claimIds: [],
              roleId: 1,
              entreprise: selectedAdmin.entreprise || '',
              isActive: selectedAdmin.isActive,
              createdById: selectedAdmin.createdById || currentUser?.id || null,
            };
            console.log('Dispatching updateUser with:', adminData);
            try {
              await dispatch(updateUser({ id: selectedAdmin.id, userData: adminData })).unwrap();
              setOpenPermissionsModal(false);
              setSelectedAdmin(null);
              dispatch(fetchUsersByCreatedById(currentUser?.id));
            } catch (error) {
              dispatch(setSnackbar({
                open: true,
                message: `Échec de la mise à jour: ${error}`,
                severity: 'error',
              }));
            } finally {
              setIsSaving(false);
            }
          }}
          onPermissionChange={() => {
            // No-op: Superadmins have all permissions implicitly
          }}
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

export default SuperadminManagement;