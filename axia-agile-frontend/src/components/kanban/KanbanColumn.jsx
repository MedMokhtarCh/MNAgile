import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Menu,
  MenuItem,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanCard from './KanbanCard';
import { Tooltip, Fade } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Styled components
const StyledKanbanColumn = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  width: '280px',
  minHeight: '100vh',
  margin: theme.spacing(1),
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 6px 25px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)',
  },
}));

const ColumnHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1, 2),
  background: theme.palette.grey[100],
  borderRadius: 8,
  cursor: 'move',
}));

const EmptyTaskCard = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: 8,
  background: theme.palette.grey[50],
  padding: theme.spacing(1),
  textAlign: 'center',
  minHeight: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'none',
  border: `1px dashed ${theme.palette.grey[300]}`,
}));

function KanbanColumn({
  column,
  columns,
  filteredColumns,
  users,
  handleAddTask,
  handleEditColumn,
  handleDeleteColumn,
  handleEditTask,
  getAvatarColor,
  generateInitials,
  getPriorityLabel,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id.toString(),
    data: {
      type: 'column',
      column,
    },
  });

  const theme = useTheme();
  const { currentUser } = useAuth(); // Access currentUser and claims
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleEditColumn(column);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    const hasTasks = filteredColumns[column.name]?.length > 0;
    if (hasTasks) {
      setDeleteConfirmOpen(true);
    } else {
      handleDelete();
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    handleDeleteColumn(column.id);
    setDeleteConfirmOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <>
      <StyledKanbanColumn ref={setNodeRef} style={style} id={column.id}>
        <ColumnHeader {...attributes} {...listeners}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DragIndicatorIcon sx={{ color: 'text.secondary', cursor: 'move' }} fontSize="small" />
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {column.name}
            </Typography>
            <Chip
              label={filteredColumns[column.name]?.length || 0}
              size="small"
              sx={{ height: 20, fontSize: '0.7rem', bgcolor: theme.palette.grey[200] }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentUser?.claims?.includes('CanCreateTasks') && (
              <Tooltip title={`Ajouter une tâche à ${column.name}`} TransitionComponent={Fade} arrow>
                <IconButton
                  size="small"
                  onClick={() => handleAddTask(column.name)}
                  sx={{
                    bgcolor: theme.palette.primary.light,
                    color: 'white',
                    '&:hover': { bgcolor: theme.palette.primary.main },
                    mr: 1,
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={`Options pour ${column.name}`} TransitionComponent={Fade} arrow>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { borderRadius: 2, boxShadow: theme.shadows[3] },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleEdit} sx={{ fontSize: '0.875rem', gap: 1 }}>
                <EditIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                Modifier
              </MenuItem>
              <MenuItem onClick={handleDeleteClick} sx={{ fontSize: '0.875rem', gap: 1, color: theme.palette.error.main }}>
                <DeleteIcon fontSize="small" />
                Supprimer
              </MenuItem>
            </Menu>
          </Box>
        </ColumnHeader>
        <Box sx={{ flexGrow: 1, p: 1 }}>
          {(!filteredColumns[column.name] || filteredColumns[column.name].length === 0) ? (
            <EmptyTaskCard>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                Aucune tâche
              </Typography>
            </EmptyTaskCard>
          ) : (
            <SortableContext
              id={column.name}
              items={filteredColumns[column.name]?.map((task) => task.id.toString()) || []}
              strategy={verticalListSortingStrategy}
            >
              {filteredColumns[column.name].map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  users={users}
                  handleEditTask={handleEditTask}
                  getAvatarColor={getAvatarColor}
                  generateInitials={generateInitials}
                  getPriorityLabel={getPriorityLabel}
                />
              ))}
            </SortableContext>
          )}
        </Box>
      </StyledKanbanColumn>

      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-column-dialog-title"
        aria-describedby="delete-column-dialog-description"
      >
        <DialogTitle id="delete-column-dialog-title">Confirmer la suppression de la colonne</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-column-dialog-description">
            Êtes-vous sûr de vouloir supprimer la colonne "{column.name}" ? Cette colonne contient {filteredColumns[column.name]?.length || 0} tâche(s) qui seront également supprimées. Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default KanbanColumn;