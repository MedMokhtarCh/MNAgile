import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  ThemeProvider,
  CssBaseline,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  TableContainer,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarTodayIcon,
  Event as EventIcon,
  DateRange as DateRangeIcon,
  Today as TodayIcon,
  Autorenew as AutorenewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { userApi } from '../services/api';
import { setSnackbar, fetchUsers, renewSubscription } from '../store/slices/usersSlice';
import { theme } from '../components/users/themes';
import PageTitle from '../components/common/PageTitle';

const SuperAdminSubscriptionManagement = () => {
  const dispatch = useDispatch();
  const { snackbar, usersLoading, users } = useSelector((state) => state.users);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch pending subscriptions
  const fetchPendingSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await userApi.get('/Subscriptions/pending');
      setSubscriptions(response.data);
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Erreur lors de la récupération des abonnements.',
          severity: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users (including those with expired subscriptions)
  useEffect(() => {
    fetchPendingSubscriptions();
    dispatch(fetchUsers());
  }, [dispatch]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm(''); // Reset search term on tab change
    setFilterValues({ plan: '' }); // Reset filter on tab change
  };

  // Handle validation dialog
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
      await userApi.post(`/Subscriptions/${selectedSubscriptionId}/validate`);
      dispatch(
        setSnackbar({
          open: true,
          message: 'Abonnement validé avec succès.',
          severity: 'success',
        })
      );
      fetchPendingSubscriptions();
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Échec de la validation de l\'abonnement.',
          severity: 'error',
        })
      );
    } finally {
      setValidating(false);
      handleCloseDialog();
    }
  };

  // Handle renewal dialog
  const handleOpenRenewDialog = (subscriptionId) => {
    setSelectedRenewSubscriptionId(subscriptionId);
    setSelectedPlan('annual'); // Default plan
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
      dispatch(fetchUsers()); // Refresh users to reflect updated subscription status
      fetchPendingSubscriptions(); // Refresh pending subscriptions
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

  // Handle refresh
  const handleRefresh = () => {
    setSearchTerm('');
    setFilterValues({ plan: '' });
    fetchPendingSubscriptions();
    dispatch(fetchUsers());
  };

  // Filter users with expired subscriptions
  const expiredSubscriptions = users.filter(
    (user) => user.subscription && user.subscription.status === 'Expired'
  );

  // Filter subscriptions based on search term and plan
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

  // Helper function for plan labels, colors, and icons
  const getPlanLabel = (plan) => {
    const planStyles = {
      annual: {
        label: 'Annuel',
        color: '#C8E6C9', // Pastel green
        icon: <CalendarTodayIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
      semiannual: {
        label: 'Semestriel',
        color: '#D1C4E9', // Pastel purple
        icon: <EventIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
      quarterly: {
        label: 'Trimestriel',
        color: '#F8BBD0', // Pastel pink
        icon: <DateRangeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
      monthly: {
        label: 'Mensuel',
        color: '#FFF9C4', // Pastel yellow
        icon: <TodayIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
    };

    const planKey = plan?.toLowerCase();
    return (
      planStyles[planKey] || {
        label: 'N/A',
        color: '#E0E0E0', // Default light gray
        icon: null,
      }
    );
  };

  // Calculate plan statistics for pending subscriptions
  const getPlanStatistics = () => {
    const planCounts = {
      annual: 0,
      semiannual: 0,
      quarterly: 0,
      monthly: 0,
    };

    filteredPendingSubscriptions.forEach((sub) => {
      const planKey = sub.plan?.toLowerCase();
      if (planCounts.hasOwnProperty(planKey)) {
        planCounts[planKey]++;
      }
    });

    return Object.entries(planCounts).map(([planKey, count]) => {
      const { label, color, icon } = getPlanLabel(planKey);
      return {
        planKey,
        label,
        color,
        icon,
        count,
      };
    });
  };

  // Calculate plan statistics for expired subscriptions
  const getExpiredPlanStatistics = () => {
    const planCounts = {
      annual: 0,
      semiannual: 0,
      quarterly: 0,
      monthly: 0,
    };

    filteredExpiredSubscriptions.forEach((user) => {
      const planKey = user.subscription?.plan?.toLowerCase();
      if (planCounts.hasOwnProperty(planKey)) {
        planCounts[planKey]++;
      }
    });

    return Object.entries(planCounts).map(([planKey, count]) => {
      const { label, color, icon } = getPlanLabel(planKey);
      return {
        planKey,
        label,
        color,
        icon,
        count,
      };
    });
  };

  const totalPendingSubscriptions = filteredPendingSubscriptions.length;
  const totalExpiredSubscriptions = filteredExpiredSubscriptions.length;
  const planStats = getPlanStatistics();
  const expiredPlanStats = getExpiredPlanStatistics();

  // Define columns for both tables
  const subscriptionColumns = [
    { id: 'email', label: 'Email', width: '25%', minWidth: '140px' },
    { id: 'entreprise', label: 'Entreprise', width: '20%', minWidth: '100px' },
    { id: 'plan', label: 'Plan', width: '20%', minWidth: '100px' },
    { id: 'startDate', label: 'Date de début', width: '20%', minWidth: '100px' },
    { id: 'endDate', label: 'Date de fin', width: '15%', minWidth: '100px' },
    { id: 'actions', label: 'Actions', align: 'right', width: '10%', minWidth: '80px' },
  ];

  // Filter options for plan
  const filterOptions = [
    {
      id: 'plan',
      label: 'Plan',
      options: [
        { value: '', label: 'Tous les plans' },
        { value: 'annual', label: 'Annuel' },
        { value: 'semiannual', label: 'Semestriel' },
        { value: 'quarterly', label: 'Trimestriel' },
        { value: 'monthly', label: 'Mensuel' },
      ],
    },
  ];

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

        {/* Filter Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              placeholder="Rechercher..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              }}
              sx={{ width: { xs: '100%', sm: '300px' } }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              {filterOptions.map((filter) => (
                <FormControl key={filter.id} size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{filter.label}</InputLabel>
                  <Select
                    value={filterValues[filter.id]}
                    label={filter.label}
                    onChange={(e) => setFilterValues({ ...filterValues, [filter.id]: e.target.value })}
                  >
                    {filter.options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
              <Tooltip title="Rafraîchir">
                <IconButton onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Tabs for switching between Pending and Expired subscriptions */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="subscription tabs"
          sx={{ mb: 3 }}
        >
          <Tab label="Abonnements en Attente" />
          <Tab label="Abonnements Expirés" />
        </Tabs>

        {/* Dashboard Statistics */}
        {activeTab === 0 && (
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              {/* Total Pending Card */}
              <Grid item xs={12} sm={2.4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    height: 120,
                  }}
                >
                  <CardContent
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : totalPendingSubscriptions}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                      Total en Attente
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pending Plan Statistics Cards */}
              {planStats.map(({ planKey, label, color, icon, count }) => (
                <Grid item xs={12} sm={2.4} key={planKey}>
                  <Card
                    sx={{
                      height: 120,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      border: `1px solid ${color}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1,
                          p: 1,
                          backgroundColor: color,
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          margin: '0 auto 8px auto',
                        }}
                      >
                        {React.cloneElement(icon, { fontSize: 'small' })}
                      </Box>
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{ fontWeight: 'bold', mb: 0.5, color: 'text.primary' }}
                      >
                
                      </Typography>
                      <Chip
                        label={label}
                        size="small"
                        sx={{
                          backgroundColor: color,
                          color: '#000',
                          fontWeight: 'medium',
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              {/* Total Expired Card */}
              <Grid item xs={12} sm={2.4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    height: 120,
                  }}
                >
                  <CardContent
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {usersLoading ? <CircularProgress size={24} color="inherit" /> : totalExpiredSubscriptions}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                      Total Expirés
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Expired Plan Statistics Cards */}
              {expiredPlanStats.map(({ planKey, label, color, icon, count }) => (
                <Grid item xs={12} sm={2.4} key={planKey}>
                  <Card
                    sx={{
                      height: 120,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      border: `1px solid ${color}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1,
                          p: 1,
                          backgroundColor: color,
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          margin: '0 auto 8px auto',
                        }}
                      >
                        {React.cloneElement(icon, { fontSize: 'small' })}
                      </Box>
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{ fontWeight: 'bold', mb: 0.5, color: 'text.primary' }}
                      >
                        {usersLoading ? <CircularProgress size={20} /> : count}
                      </Typography>
                      <Chip
                        label={label}
                        size="small"
                        sx={{
                          backgroundColor: color,
                          color: '#000',
                          fontWeight: 'medium',
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Table for Pending or Expired Subscriptions */}
        <Paper sx={{ overflow: 'hidden', mb: 4 }}>
          <TableContainer
            sx={{
              maxWidth: '100%',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '-ms-overflow-style': 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            <Table
              sx={{
                minWidth: '100%',
                tableLayout: 'fixed',
                '& .MuiTableCell-root': {
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  {subscriptionColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align || 'left'}
                      sx={{
                        width: col.width || 'auto',
                        minWidth: col.minWidth || '100px',
                        padding: '6px 12px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading || usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={subscriptionColumns.length} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Chargement...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : activeTab === 0 && filteredPendingSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={subscriptionColumns.length} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1">Aucun abonnement en attente trouvé</Typography>
                    </TableCell>
                  </TableRow>
                ) : activeTab === 1 && filteredExpiredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={subscriptionColumns.length} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1">Aucun abonnement expiré trouvé</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  (activeTab === 0 ? filteredPendingSubscriptions : filteredExpiredSubscriptions).map((sub) => {
                    const { label, color, icon } = getPlanLabel(sub.plan || sub.subscription?.plan);
                    return (
                      <TableRow key={sub.id} hover>
                        <TableCell
                          sx={{
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {(activeTab === 0 ? sub.user?.email : sub.email) || 'N/A'}
                        </TableCell>
                        <TableCell
                          sx={{
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {(activeTab === 0 ? sub.user?.entreprise : sub.entreprise) || 'N/A'}
                        </TableCell>
                        <TableCell
                          sx={{
                            backgroundColor: color,
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {icon}
                          {label}
                        </TableCell>
                        <TableCell
                          sx={{
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {(activeTab === 0 ? sub.startDate : sub.subscription?.startDate)
                            ? new Date(
                                activeTab === 0 ? sub.startDate : sub.subscription.startDate
                              ).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell
                          sx={{
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {(activeTab === 0 ? sub.endDate : sub.subscription?.endDate)
                            ? new Date(
                                activeTab === 0 ? sub.endDate : sub.subscription.endDate
                              ).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {activeTab === 0 ? (
                            <Tooltip title="Valider l'abonnement">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenDialog(sub.id)}
                                  disabled={!sub.user || validating}
                                >
                                  {validating && selectedSubscriptionId === sub.id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <CheckCircleIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Renouveler l'abonnement">
                              <span>
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => handleOpenRenewDialog(sub.subscription.id)}
                                  disabled={renewing}
                                >
                                  {renewing && selectedRenewSubscriptionId === sub.subscription.id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <AutorenewIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Validation Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          aria-labelledby="validate-subscription-dialog-title"
          aria-describedby="validate-subscription-dialog-description"
        >
          <DialogTitle id="validate-subscription-dialog-title">
            Confirmer la validation
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="validate-subscription-dialog-description">
              Êtes-vous sûr de vouloir valider cet abonnement ? Cette action ne peut pas être annulée.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary" disabled={validating}>
              Annuler
            </Button>
            <Button
              onClick={handleValidateSubscription}
              color="primary"
              autoFocus
              disabled={validating}
            >
              {validating ? <CircularProgress size={24} /> : 'Valider'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Renewal Dialog */}
        <Dialog
          open={renewDialogOpen}
          onClose={handleCloseRenewDialog}
          aria-labelledby="renew-subscription-dialog-title"
          aria-describedby="renew-subscription-dialog-description"
        >
          <DialogTitle id="renew-subscription-dialog-title">
            Renouveler l'abonnement
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="renew-subscription-dialog-description" sx={{ mb: 2 }}>
              Sélectionnez un nouveau plan pour renouveler l'abonnement.
            </DialogContentText>
            <FormControl fullWidth>
              <InputLabel id="plan-select-label">Plan d'abonnement</InputLabel>
              <Select
                labelId="plan-select-label"
                id="plan-select"
                value={selectedPlan}
                label="Plan d'abonnement"
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <MenuItem value="monthly">Mensuel</MenuItem>
                <MenuItem value="quarterly">Trimestriel</MenuItem>
                <MenuItem value="semiannual">Semestriel</MenuItem>
                <MenuItem value="annual">Annuel</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRenewDialog} color="secondary" disabled={renewing}>
              Annuler
            </Button>
            <Button
              onClick={handleRenewSubscription}
              color="primary"
              autoFocus
              disabled={renewing}
            >
              {renewing ? <CircularProgress size={24} /> : 'Renouveler'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default SuperAdminSubscriptionManagement;