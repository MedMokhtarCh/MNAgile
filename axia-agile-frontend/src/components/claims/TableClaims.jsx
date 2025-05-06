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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, VerifiedUser as VerifiedUserIcon } from '@mui/icons-material';

const TableClaims = ({ claims, loading, onEdit, onDelete, setOpenModal }) => {
  const columns = [
    {
      id: 'name',
      label: 'Nom du Claim',
      render: (claim) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <VerifiedUserIcon />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {claim.label}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (claim) => (
        <Typography variant="body2">
          {claim.description || 'Aucune description'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (claim) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Modifier">
            <IconButton
              size="small"
              sx={{ mr: 1 }}
              onClick={() => onEdit(claim)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(claim.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const renderCell = (column, claim) => {
    if (typeof column.render === 'function') {
      return column.render(claim, { onEdit, onDelete });
    }
    return claim[column.id];
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
            ) : claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1">Aucun claim trouvé</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenModal(true)}
                    sx={{ mt: 2 }}
                  >
                    Ajouter un claim
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow key={claim.id} hover>
                  {columns.map((column) => (
                    <TableCell key={`${claim.id}-${column.id}`} align={column.align || 'left'}>
                      {renderCell(column, claim)}
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

export default TableClaims;