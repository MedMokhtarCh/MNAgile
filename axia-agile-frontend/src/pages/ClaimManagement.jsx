// ClaimManagement.jsx
import React, { useEffect } from 'react';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClaims } from '../store/slices/usersSlice';
import TableClaims from '../components/claims/TableClaims';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import { useAuth } from '../contexts/AuthContext';

const ClaimManagement = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { claims, loading } = useSelector((state) => state.users);

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchClaims());
    }
  }, [dispatch, currentUser]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <PageTitle>Droits d'accès disponibles dans Axia Agile</PageTitle>
        <TableClaims claims={claims} loading={loading} />
      </Box>
    </ThemeProvider>
  );
};

export default ClaimManagement;