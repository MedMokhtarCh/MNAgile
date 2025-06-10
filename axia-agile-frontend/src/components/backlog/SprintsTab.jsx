import React from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Pagination, IconButton,Divider,Chip   } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TimelineIcon from '@mui/icons-material/Timeline';
import PageTitle from '../common/PageTitle';
import { StyledPaper, ScrollableContainer } from './theme';
import BacklogItem from './BacklogItem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function SprintsTab({
  project,
  sprints,
  tasks,
  columns,
  taskStatus,
  columnStatus,
  sprintStatus,
  error,
  currentUser,
  sprintPage,
  sprintsPerPage,
  handleSprintPageChange,
  handleOpenSprintDialog,
  handleOpenDeleteSprintDialog,
  handleOpenTaskDetailsDialog,
  handleUpdateSprintItemStatus,
  clearErrors,
  handleOpenItemDialog, // Add this
  handleOpenDeleteItemDialog, // Add this
  handleOpenAddToSprintDialog, // Add this
}) {
  const userTasks = tasks.filter(
    (task) =>
      task.createdByUserId === currentUser?.id ||
      task.assignedUserIds?.includes(currentUser?.id)
  );
  const startIndex = (sprintPage - 1) * sprintsPerPage;
  const endIndex = startIndex + sprintsPerPage;
  const paginatedSprints = (sprints || []).slice(startIndex, endIndex);
  const totalSprintPages = Math.ceil((sprints?.length || 0) / sprintsPerPage);

  const isSprintOverdue = (sprint) => {
    if (!sprint?.endDate) return false;
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    return endDate < today;
  };

  return (
    <ScrollableContainer sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle>Tableau Kanban pour le projet {project.title}</PageTitle>
        {currentUser?.claims?.includes('CanCreateSprints') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSprintDialog()}
          >
            Nouveau Sprint
          </Button>
        )}
      </Box>
      {(taskStatus === 'loading' || columnStatus === 'loading' || sprintStatus === 'loading') && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress size={40} />
        </Box>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={clearErrors}
            >
              Réessayer
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {paginatedSprints.length === 0 && taskStatus !== 'loading' && !error ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
            borderRadius: 2,
            py: 8,
            px: 4,
          }}
        >
          <TimelineIcon
            sx={{
              fontSize: 80,
              color: 'primary.main',
              mb: 2,
              opacity: 0.8,
            }}
          />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
            Aucun sprint dans ce projet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', maxWidth: 400 }}>
            Lancez votre projet en créant votre premier sprint.
          </Typography>
          {currentUser?.claims?.includes('CanCreateSprints') && (
            <IconButton
              onClick={() => handleOpenSprintDialog()}
              sx={{
                mb: 2,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 60,
                height: 60,
              }}
              title="Créer un nouveau sprint"
            >
              <AddIcon sx={{ fontSize: 40 }} />
            </IconButton>
          )}
        </Box>
      ) : (
        <>
          {paginatedSprints.map((sprint) => {
            const sprintUserTasks = userTasks.filter((task) => task.sprintId === sprint.id);
            const isOverdue = isSprintOverdue(sprint);

            return (
              <StyledPaper key={sprint.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{sprint.name}</Typography>
                      {isOverdue && (
                        <Chip
                          label="Sprint terminé"
                          size="small"
                          color="error"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {sprint.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sprint.startDate} à {sprint.endDate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 2 }}>
                      {sprintUserTasks.length} tâches • {sprintUserTasks.filter((t) => t.status === 'Terminé').length} terminées
                    </Typography>
                    {currentUser?.claims?.includes('CanUpdateSprints') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenSprintDialog(sprint)}
                        title="Modifier le sprint"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {currentUser?.claims?.includes('CanDeleteSprints') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteSprintDialog(sprint.id)}
                        title="Supprimer le sprint"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {sprintUserTasks.length > 0 ? (
                  sprintUserTasks.map((task) => (
                    <BacklogItem
                      key={task.id}
                      task={task}
                      backlogId={null}
                      isSprint={true}
                      currentUser={currentUser}
                      handleOpenTaskDetailsDialog={handleOpenTaskDetailsDialog}
                      handleOpenItemDialog={handleOpenItemDialog}
                      handleOpenDeleteItemDialog={handleOpenDeleteItemDialog}
                      handleOpenAddToSprintDialog={handleOpenAddToSprintDialog}
                      handleUpdateSprintItemStatus={handleUpdateSprintItemStatus}
                    />
                  ))
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Aucune tâche créée ou assignée à vous dans ce sprint.
                  </Typography>
                )}
              </StyledPaper>
            );
          })}
          {totalSprintPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalSprintPages}
                page={sprintPage}
                onChange={handleSprintPageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </ScrollableContainer>
  );
}

export default SprintsTab;