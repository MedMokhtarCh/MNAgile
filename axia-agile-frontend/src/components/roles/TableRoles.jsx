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
  Button,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Security as SecurityIcon, SupervisorAccount as SupervisorAccountIcon, Person as PersonIcon } from '@mui/icons-material';

// Default roles that cannot be modified
const DEFAULT_ROLE_IDS = [1, 2, 3, 4];

const getIconComponent = (iconName) => {
  switch (iconName) {
    case 'Security':
      return <SecurityIcon />;
    case 'SupervisorAccount':
      return <SupervisorAccountIcon />;
    case 'Person':
      return <PersonIcon />;
    default:
      return <PersonIcon />;
  }
};

const isDefaultRole = (roleId) => DEFAULT_ROLE_IDS.includes(roleId);

const TableRoles = ({ roles, loading, onEdit, onDelete, setOpenModal }) => {
  const columns = [
    {
      id: 'name',
      label: 'Nom du Rôle',
      render: (role) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getIconComponent(role.iconName)}
          <Typography variant="body2" sx={{ ml: 1 }}>
            {role.label}
          </Typography>
          {isDefaultRole(role.id) && (
            <Chip 
              size="small" 
              label="Par défaut" 
              color="primary" 
              variant="outlined" 
              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (role) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {isDefaultRole(role.id) ? (
            <Tooltip title="Les rôles par défaut ne peuvent pas être modifiés">
              <span>
                <IconButton
                  size="small"
                  sx={{ mr: 1 }}
                  disabled
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="Modifier">
              <IconButton
                size="small"
                sx={{ mr: 1 }}
                onClick={() => onEdit(role)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {isDefaultRole(role.id) ? (
            <Tooltip title="Les rôles par défaut ne peuvent pas être supprimés">
              <span>
                <IconButton
                  size="small"
                  disabled
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(role.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const renderCell = (column, role) => {
    if (typeof column.render === 'function') {
      return column.render(role, { onEdit, onDelete });
    }
    return role[column.id];
  };

  return (
    <Paper sx={{ overflow: 'hidden', mb: 4 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align || 'left'}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Chargement...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1">Aucun rôle trouvé</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenModal(true)}
                    sx={{ mt: 2 }}
                  >
                    Ajouter un rôle
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id} hover>
                  {columns.map((column) => (
                    <TableCell key={`${role.id}-${column.id}`} align={column.align || 'left'}>
                      {renderCell(column, role)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TableRoles;