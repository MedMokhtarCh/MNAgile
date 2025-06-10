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
      <TableContainer
        sx={{
          maxWidth: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none', // Firefox
          '-ms-overflow-style': 'none', // IE and Edge
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome, Safari, and other WebKit browsers
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
              {columns.map((col) => (
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" sx={{ mt: 1, fontSize: '0.85rem' }}>
                    Chargement...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                    Aucun utilisateur trouvé
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenModal(true)}
                    sx={{ mt: 1, fontSize: '0.85rem', padding: '4px 8px' }}
                  >
                    Ajouter un utilisateur
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  {columns.map((column) => (
                    <TableCell
                      key={`${user.id}-${column.id}`}
                      align={column.align || 'left'}
                      sx={{
                        padding: '6px 12px',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
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