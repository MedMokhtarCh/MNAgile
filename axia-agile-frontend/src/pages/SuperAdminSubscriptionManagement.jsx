import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, ThemeProvider, CssBaseline, Alert, Paper } from '@mui/material';
import { fetchPendingSubscriptions, validateSubscription, setSnackbar } from '../store/slices/abonementSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { renewSubscription } from '../store/slices/signupSlice';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';
import SubscriptionFilters from '../components/subscriptions/SubscriptionFilters';
import SubscriptionTabs from '../components/subscriptions/SubscriptionTabs';
import PendingStats from '../components/subscriptions/PendingStats';
import ExpiredStats from '../components/subscriptions/ExpiredStats';
import SubscriptionTable from '../components/subscriptions/SubscriptionTable';
import ValidationDialog from '../components/subscriptions/ValidationDialog';
import RenewalDialog from '../components/subscriptions/RenewalDialog';

const SuperAdminSubscriptionManagement = () => {
  const dispatch = useDispatch();
  const { snackbar, loading: subscriptionsLoading, subscriptions } = useSelector((state) => state.abonement);
  const { usersLoading, users } = useSelector((state) => state.users);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [validating, setValidating] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedRenewSubscriptionId, setSelectedRenewSubscriptionId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [renewing, setRenewing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({ plan: '' });

  useEffect(() => {
    dispatch(fetchPendingSubscriptions());
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm('');
    setFilterValues({ plan: '' });
  };

  const handleOpenDialog = (subscriptionId) => {
    setSelectedSubscriptionId(subscriptionId);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSubscriptionId(null);
  };

  const handleValidateSubscription = async () => {
    if (!selectedSubscriptionId) return;
    setValidating(true);
    try {
      await dispatch(validateSubscription(selectedSubscriptionId)).unwrap();
      dispatch(
        setSnackbar({
          open: true,
          message: 'Abonnement validé avec succès.',
          severity: 'success',
        })
      );
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error || 'Échec de la validation de l\'abonnement.',
          severity: 'error',
        })
      );
    } finally {
      setValidating(false);
      handleCloseDialog();
    }
  };

  const handleOpenRenewDialog = (subscriptionId) => {
    setSelectedRenewSubscriptionId(subscriptionId);
    setSelectedPlan('annual');
    setRenewDialogOpen(true);
  };

  const handleCloseRenewDialog = () => {
    setRenewDialogOpen(false);
    setSelectedRenewSubscriptionId(null);
    setSelectedPlan('annual');
  };

  const handleRenewSubscription = async () => {
    if (!selectedRenewSubscriptionId) return;
    setRenewing(true);
    try {
      await dispatch(
        renewSubscription({ subscriptionId: selectedRenewSubscriptionId, plan: selectedPlan })
      ).unwrap();
      dispatch(
        setSnackbar({
          open: true,
          message: 'Demande de renouvellement envoyée avec succès.',
          severity: 'success',
        })
      );
      dispatch(fetchUsers());
      dispatch(fetchPendingSubscriptions());
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error || 'Échec du renouvellement de l\'abonnement.',
          severity: 'error',
        })
      );
    } finally {
      setRenewing(false);
      handleCloseRenewDialog();
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setFilterValues({ plan: '' });
    dispatch(fetchPendingSubscriptions());
    dispatch(fetchUsers());
  };

  const expiredSubscriptions = users.filter(
    (user) => user.subscription && user.subscription.status === 'Expired'
  );

  const filterSubscriptions = (subscriptionsList) => {
    return subscriptionsList.filter((sub) => {
      const email = activeTab === 0 ? sub.user?.email || '' : sub.email || '';
      const entreprise = activeTab === 0 ? sub.user?.entreprise || '' : sub.entreprise || '';
      const plan = activeTab === 0 ? sub.plan?.toLowerCase() || '' : sub.subscription?.plan?.toLowerCase() || '';

      const matchesSearch = searchTerm
        ? email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entreprise.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesPlan = filterValues.plan ? plan === filterValues.plan.toLowerCase() : true;

      return matchesSearch && matchesPlan;
    });
  };

  const filteredPendingSubscriptions = filterSubscriptions(subscriptions);
  const filteredExpiredSubscriptions = filterSubscriptions(expiredSubscriptions);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <PageTitle>Gestion des Abonnements</PageTitle>

        {snackbar.open && (
          <Alert
            severity={snackbar.severity}
            sx={{ mb: 2 }}
            onClose={() => dispatch(setSnackbar({ open: false }))}
          >
            {snackbar.message}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <SubscriptionFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValues={filterValues}
            setFilterValues={setFilterValues}
            handleRefresh={handleRefresh}
          />
        </Paper>

        <SubscriptionTabs activeTab={activeTab} handleTabChange={handleTabChange} />

        {activeTab === 0 && (
          <PendingStats
            subscriptionsLoading={subscriptionsLoading}
            filteredPendingSubscriptions={filteredPendingSubscriptions}
          />
        )}

        {activeTab === 1 && (
          <ExpiredStats
            usersLoading={usersLoading}
            filteredExpiredSubscriptions={filteredExpiredSubscriptions}
          />
        )}

        <SubscriptionTable
          activeTab={activeTab}
          subscriptionsLoading={subscriptionsLoading}
          usersLoading={usersLoading}
          filteredPendingSubscriptions={filteredPendingSubscriptions}
          filteredExpiredSubscriptions={filteredExpiredSubscriptions}
          validating={validating}
          selectedSubscriptionId={selectedSubscriptionId}
          renewing={renewing}
          selectedRenewSubscriptionId={selectedRenewSubscriptionId}
          handleOpenDialog={handleOpenDialog}
          handleOpenRenewDialog={handleOpenRenewDialog}
        />

        <ValidationDialog
          openDialog={openDialog}
          handleCloseDialog={handleCloseDialog}
          handleValidateSubscription={handleValidateSubscription}
          validating={validating}
        />

        <RenewalDialog
          renewDialogOpen={renewDialogOpen}
          handleCloseRenewDialog={handleCloseRenewDialog}
          handleRenewSubscription={handleRenewSubscription}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          renewing={renewing}
        />
      </Box>
    </ThemeProvider>
  );
};

export default SuperAdminSubscriptionManagement;