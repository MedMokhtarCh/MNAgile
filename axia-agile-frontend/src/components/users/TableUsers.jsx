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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const TableUsers = ({
  users,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onManagePermissions,
  setOpenModal,
  columns,
  getAvatarColor,
}) => {
  const renderCell = (column, user) => {
    if (typeof column.render === 'function') {
      return column.render(user, {
        onEdit: () => onEdit(user),
        onDelete: () => onDelete(user.id),
        onToggleActive: () => onToggleActive(user.id),
        onManagePermissions: () => onManagePermissions(user),
        getAvatarColor: () => getAvatarColor(user),
      });
    }
    return user[column.id];
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1">Aucun utilisateur trouvé</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenModal(true)}
                    sx={{ mt: 2 }}
                  >
                    Ajouter un utilisateur
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  {columns.map((column) => (
                    <TableCell key={`${user.id}-${column.id}`} align={column.align || 'left'}>
                      {renderCell(column, user)}
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

export default TableUsers;