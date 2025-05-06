import React, { useState, useEffect } from 'react';
import { Box, Button, ThemeProvider, CssBaseline } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchClaims,
  createClaim,
  updateClaim,
  deleteClaim,
  setSnackbar,
} from '../store/slices/usersSlice';
import FilterBar from '../components/users/FilterBarUsers';
import TableClaims from '../components/claims/TableClaims';
import ClaimForm from '../components/claims/ClaimForm';
import AlertUser from '../components/common/AlertUser';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import { useAuth } from '../contexts/AuthContext';

const ClaimManagement = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { claims, loading, snackbar } = useSelector((state) => state.users);

  const [openModal, setOpenModal] = useState(false);
  const [newClaim, setNewClaim] = useState({
    name: '',
    description: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [currentClaimId, setCurrentClaimId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchClaims());
    }
  }, [dispatch, currentUser]);

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewClaim({
      name: '',
      description: '',
    });
    setEditMode(false);
    setCurrentClaimId(null);
  };

  const handleCloseSnackbar = () => {
    dispatch(setSnackbar({ open: false, message: '', severity: 'success' }));
  };

  const handleCreateClaim = async () => {
    if (!newClaim.name.trim()) {
      dispatch(setSnackbar({ open: true, message: 'Le nom du claim est requis.', severity: 'error' }));
      return;
    }
    if (!newClaim.description.trim()) {
      dispatch(setSnackbar({ open: true, message: 'La description du claim est requise.', severity: 'error' }));
      return;
    }
    // Prevent duplicate claim names
    if (!editMode && claims.some((claim) => claim.label.toLowerCase() === newClaim.name.toLowerCase())) {
      dispatch(setSnackbar({ open: true, message: 'Ce nom de claim existe déjà.', severity: 'error' }));
      return;
    }

    try {
      console.log('Dispatching claim action with:', { editMode, newClaim });
      const action = editMode
        ? updateClaim({ id: currentClaimId, name: newClaim.name, description: newClaim.description })
        : createClaim({ name: newClaim.name, description: newClaim.description });
      const result = await dispatch(action).unwrap();
      console.log('Claim action result:', result);
      dispatch(fetchClaims());
      handleCloseModal();
    } catch (error) {
      console.error('Error in handleCreateClaim:', error);
      dispatch(setSnackbar({
        open: true,
        message: error || 'Erreur lors de l\'opération',
        severity: 'error',
      }));
      // Fetch claims to sync with database in case it was saved
      dispatch(fetchClaims());
    }
  };

  const handleEditClaim = (claim) => {
    if (!claim) {
      dispatch(setSnackbar({ open: true, message: 'Claim non valide.', severity: 'error' }));
      return;
    }
    setNewClaim({
      name: claim.label,
      description: claim.description,
    });
    setEditMode(true);
    setCurrentClaimId(claim.id);
    setOpenModal(true);
  };

  const handleDeleteClaim = async (id) => {
    try {
      await dispatch(deleteClaim(id)).unwrap();
      dispatch(fetchClaims());
    } catch (error) {
      // Error is already handled in usersSlice
    }
  };

  const filteredClaims = claims.filter((claim) =>
    claim.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <PageTitle>Gestion des Claims</PageTitle>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditMode(false);
              setNewClaim({ name: '', description: '' });
              setOpenModal(true);
            }}
            sx={{ px: 3 }}
          >
            Nouveau Claim
          </Button>
        </Box>

        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterOptions={[]}
          filterValues={{}}
          setFilterValues={() => {}}
          onRefresh={() => dispatch(fetchClaims())}
        />

        <TableClaims
          claims={filteredClaims}
          loading={loading}
          onEdit={handleEditClaim}
          onDelete={handleDeleteClaim}
          setOpenModal={setOpenModal}
        />

        <ClaimForm
          open={openModal}
          onClose={handleCloseModal}
          claim={newClaim}
          setClaim={setNewClaim}
          onSave={handleCreateClaim}
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

export default ClaimManagement;