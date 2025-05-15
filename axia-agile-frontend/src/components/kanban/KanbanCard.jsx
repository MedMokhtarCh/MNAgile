import React, { useContext, useState } from 'react';
import { Box, Typography, IconButton, Card, CardContent, Avatar, Chip, Tooltip, Menu, MenuItem, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Flag from '@mui/icons-material/Flag';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDispatch } from 'react-redux';
import { deleteTask } from '../../store/slices/taskSlice';
import { KanbanContext } from '../../pages/Kanban';

// Styled components
const TaskCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'priority' && prop !== 'isOverlay',
})(({ theme, priority, isOverlay }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return theme.palette.error.main;
      case 'MEDIUM': return theme.palette.warning.main;
      case 'LOW': return theme.palette.success.main;
      default: return theme.palette.grey[400];
    }
  };

  return {
    marginBottom: theme.spacing(1.5),
    borderRadius: 10,
    position: 'relative',
    borderLeft: `4px solid ${getPriorityColor(priority)}`,
    background: theme.palette.background.paper,
    transition: 'all 0.3s ease',
    '&:hover': !isOverlay && {
      boxShadow: theme.shadows[4],
      transform: 'translateY(-2px)',
    },
    padding: theme.spacing(0.5),
    cursor: isOverlay ? 'grabbing' : 'pointer',
    ...(isOverlay && { boxShadow: theme.shadows[8] }),
    width: '100%',
    minHeight: 'fit-content',
    height: 'auto',
  };
});

const PriorityChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'priority',
})(({ theme, priority }) => {
  const getPriorityStyles = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return { bg: theme.palette.error.light, color: theme.palette.error.contrastText };
      case 'MEDIUM': return { bg: theme.palette.warning.light, color: theme.palette.warning.contrastText };
      case 'LOW': return { bg: theme.palette.success.light, color: theme.palette.success.contrastText };
      default: return { bg: theme.palette.grey[200], color: theme.palette.text.primary };
    }
  };

  const styles = getPriorityStyles(priority);
  return {
    backgroundColor: styles.bg,
    color: styles.color,
    fontSize: '0.7rem',
    height: 20,
    fontWeight: 500,
    '& .MuiChip-label': { padding: '0 8px' },
    '& .MuiChip-icon': { fontSize: '0.9rem', marginLeft: '5px' },
  };
});

function KanbanCard({ task, users, isOverlay = false, getPriorityLabel, getAvatarColor, generateInitials, handleEditTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id.toString() });
  const dispatch = useDispatch();
  const { setDialogOpen, setFormValues, setCurrentColumn, setIsEditing, setEditingTask, setDialogMode } = useContext(KanbanContext);
  
  // États pour le menu et la boîte de dialogue de confirmation
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const menuOpen = Boolean(menuAnchorEl);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const defaultGetPriorityLabel = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'Haute';
      case 'MEDIUM': return 'Moyenne';
      case 'LOW': return 'Basse';
      default: return 'Non définie';
    }
  };

  const defaultGetAvatarColor = (input) => {
    if (!input) return '#9e9e9e';
    const colors = ['#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722'];
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum += input.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const defaultGenerateInitials = (input) => {
    if (!input) return '?';
    const parts = input.split('@')[0].split('.');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : input.slice(0, 2).toUpperCase();
  };

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };

  const handleMenuClose = (e) => {
    if (e) e.stopPropagation();
    setMenuAnchorEl(null);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    handleMenuClose();
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    dispatch(deleteTask(task.id));
    setDeleteConfirmOpen(false);
  };

  const handleDeleteCancel = (e) => {
    if (e) e.stopPropagation();
    setDeleteConfirmOpen(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    handleMenuClose();
    if (handleEditTask) {
      handleEditTask(task);
    } else {
      setIsEditing(true);
      setDialogMode('edit');
      setEditingTask(task);
      setCurrentColumn(task.status);
      setFormValues({
        title: task.title || '',
        description: task.description || '',
        assignedUsers: users.filter((u) => task.assignedUserEmails?.includes(u.email)) || [],
        priority: task.priority?.toUpperCase() || 'MEDIUM',
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        endDate: task.endDate ? task.endDate.split('T')[0] : '',
        attachments: task.attachments || [],
        backlogIds: task.backlogIds || [],
      });
      setDialogOpen(true);
    }
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (isOverlay) return;
    setIsEditing(false);
    setDialogMode('view');
    setEditingTask(task);
    setCurrentColumn(task.status);
    setFormValues({
      title: task.title || '',
      description: task.description || '',
      assignedUsers: users.filter((u) => task.assignedUserEmails?.includes(u.email)) || [],
      priority: task.priority?.toUpperCase() || 'MEDIUM',
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      endDate: task.endDate ? task.endDate.split('T')[0] : '',
      attachments: task.attachments || [],
      backlogIds: task.backlogIds || [],
    });
    setDialogOpen(true);
  };

  const avatarColorFn = typeof getAvatarColor === 'function' ? getAvatarColor : defaultGetAvatarColor;
  const initialsFn = typeof generateInitials === 'function' ? generateInitials : defaultGenerateInitials;

  return (
    <>
      <TaskCard 
        ref={setNodeRef} 
        style={style} 
        priority={task.priority} 
        isOverlay={isOverlay} 
        onClick={handleCardClick}
      >
        <CardContent sx={{ p: '8px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '90%' }}>
              {!isOverlay && (
                <IconButton
                  size="small"
                  {...attributes}
                  {...listeners}
                  sx={{ mr: 0.5, p: 0.3, color: 'text.secondary', cursor: 'grab' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DragIndicatorIcon fontSize="small" />
                </IconButton>
              )}
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {task.title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {task.attachments?.length > 0 && (
                <Tooltip title="Pièces jointes">
                  <AttachFileIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                </Tooltip>
              )}
              {!isOverlay && (
                <IconButton 
                  size="small" 
                  onClick={handleMenuOpen}
                  sx={{ zIndex: 2 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1,
              fontSize: '0.75rem',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '2.3em',
            }}
          >
            {task.description}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {task.assignedUserEmails?.length > 0 ? (
                task.assignedUserEmails.map((email, index) => (
                  <Tooltip key={email || index} title={email || 'Non attribué'} placement="top">
                    <Avatar
                      sx={{
                        bgcolor: avatarColorFn(email),
                        width: 24,
                        height: 24,
                        fontSize: '0.7rem',
                      }}
                    >
                      {initialsFn(email)}
                    </Avatar>
                  </Tooltip>
                ))
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Aucun
                </Typography>
              )}
            </Box>
            <PriorityChip
              priority={task.priority}
              icon={<Flag />}
              label={getPriorityLabel ? getPriorityLabel(task.priority) : defaultGetPriorityLabel(task.priority)}
              size="small"
            />
          </Box>
        </CardContent>
      </TaskCard>
      
      {/* Menu d'options */}
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
          Supprimer
        </MenuItem>
      </Menu>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirmer la suppression"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer la tâche "{task.title}" ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default KanbanCard;