import React from 'react';
import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Autorenew as AutorenewIcon,
  CalendarToday as CalendarTodayIcon,
  Event as EventIcon,
  DateRange as DateRangeIcon,
  Today as TodayIcon,
} from '@mui/icons-material';

const SubscriptionTable = ({
  activeTab,
  subscriptionLoading,
  usersLoading,
  filteredPendingSubscriptions,
  filteredExpiredSubscriptions,
  validating,
  selectedSubscriptionId,
  renewing,
  selectedRenewSubscriptionId,
  handleOpenDialog,
  handleOpenRenewDialog,
}) => {
  const subscriptionColumns = [
    { id: 'email', label: 'Email', width: '25%', minWidth: '140px' },
    { id: 'entreprise', label: 'Entreprise', width: '20%', minWidth: '100px' },
    { id: 'plan', label: 'Plan', width: '20%', minWidth: '100px' },
    { id: 'startDate', label: 'Date de début', width: '20%', minWidth: '100px' },
    { id: 'endDate', label: 'Date de fin', width: '15%', minWidth: '100px' },
    { id: 'actions', label: 'Actions', align: 'right', width: '10%', minWidth: '80px' },
  ];

  const getPlanLabel = (plan) => {
    const planStyles = {
      annual: {
        label: 'Annuel',
        color: '#C8E6C9',
        icon: <CalendarTodayIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
      semiannual: {
        label: 'Semestriel',
        color: '#D1C4E9',
        icon: <EventIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
      quarterly: {
        label: 'Trimestriel',
        color: '#F8BBD0',
        icon: <DateRangeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
      monthly: {
        label: 'Mensuel',
        color: '#FFF9C4',
        icon: <TodayIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />,
      },
    };

    const planKey = plan?.toLowerCase();
    return (
      planStyles[planKey] || {
        label: 'N/A',
        color: '#E0E0E0',
        icon: null,
      }
    );
  };

  return (
    <Paper sx={{ overflow: 'hidden', mb: 4 }}>
      <TableContainer
        sx={{
          maxWidth: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '-ms-overflow-style': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Table
          sx={{
            minWidth: '100%',
            tableLayout: 'fixed',
            '& .MuiTableCell-root': { padding: '8px 12px', fontSize: '0.85rem' },
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
            {subscriptionLoading || usersLoading ? (
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
                              disabled={validating}
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
  );
};

export default SubscriptionTable;