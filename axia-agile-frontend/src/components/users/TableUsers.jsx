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
            minWidth: '100%', // Use 100% width instead of max-content to fit screen
            tableLayout: 'fixed', // Ensure columns adhere to specified widths
            '& .MuiTableCell-root': {
              padding: '8px 12px', // Reduce padding for compactness
              fontSize: '0.85rem', // Smaller font size
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
                    width: col.width || 'auto', // Use provided width or auto
                    minWidth: col.minWidth || '100px', // Ensure minimum width for readability
                    padding: '6px 12px', // Reduced padding for header
                    fontSize: '0.9rem', // Slightly smaller header font
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap', // Prevent text wrapping
                    overflow: 'hidden',
                    textOverflow: 'ellipsis', // Truncate long text
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
                        padding: '6px 12px', // Reduced padding for body cells
                        fontSize: '0.85rem', // Smaller font size
                        whiteSpace: 'nowrap', // Prevent text wrapping
                        overflow: 'hidden',
                        textOverflow: 'ellipsis', // Truncate long text
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