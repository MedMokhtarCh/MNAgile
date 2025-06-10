import React from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Pagination, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PageTitle from '../common/PageTitle';
import { BacklogContainer, BacklogHeader, BacklogContent, ScrollableContainer } from './theme';
import BacklogItem from './BacklogItem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function BacklogTab({
  project,
  backlogs,
  tasks,
  status,
  error,
  currentUser,
  backlogPage,
  backlogsPerPage,
  handleBacklogPageChange,
  handleOpenBacklogDialog,
  handleOpenItemDialog,
  handleOpenDeleteBacklogDialog,
  handleOpenTaskDetailsDialog,
  handleUpdateSprintItemStatus,
  clearErrors,
  handleOpenDeleteItemDialog,
  handleOpenAddToSprintDialog,
  projectUsers,
  sprints,
  hasUpcomingSprint,
}) {
  const userTasks = tasks.filter(
    (task) =>
      task.createdByUserId === currentUser?.id ||
      task.assignedUserIds?.includes(currentUser?.id)
  );
  const startIndex = (backlogPage - 1) * backlogsPerPage;
  const endIndex = startIndex + backlogsPerPage;
  const paginatedBacklogs = (backlogs || []).slice(startIndex, endIndex);
  const totalBacklogPages = Math.ceil((backlogs?.length || 0) / backlogsPerPage);

  return (
    <ScrollableContainer sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle>Backlogs pour le projet {project.title}</PageTitle>
        {currentUser?.claims?.includes('CanCreateBacklogs') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenBacklogDialog()}
          >
            Nouveau Backlog
          </Button>
        )}
      </Box>
      {status === 'loading' && (
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
      {paginatedBacklogs.length === 0 && status !== 'loading' && !error ? (
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
          <ListAltIcon
            sx={{
              fontSize: 80,
              color: 'primary.main',
              mb: 2,
              opacity: 0.8,
            }}
          />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
            Aucun backlog dans ce projet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', maxWidth: 400 }}>
            Commencez à organiser votre projet en créant votre premier backlog.
          </Typography>
          {currentUser?.claims?.includes('CanCreateBacklogs') && (
            <IconButton
              onClick={() => handleOpenBacklogDialog()}
              sx={{
                mb: 2,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 60,
                height: 60,
              }}
              title="Créer un nouveau backlog"
            >
              <AddIcon sx={{ fontSize: 40 }} />
            </IconButton>
          )}
        </Box>
      ) : (
        <>
          {paginatedBacklogs.map((backlog) => {
            const backlogUserTasks = userTasks.filter((task) =>
              backlog.taskIds.includes(task.id)
            );

            return (
              <BacklogContainer key={backlog.id}>
                <BacklogHeader>
                  <Box>
                    <Typography variant="h6">{backlog.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {backlog.description}
                    </Typography>
                  </Box>
                  <Box>
                    {currentUser?.claims?.includes('CanUpdateBacklogs') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenBacklogDialog(backlog)}
                        title="Modifier le backlog"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {currentUser?.claims?.includes('CanDeleteBacklogs') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteBacklogDialog(backlog.id)}
                        title="Supprimer le backlog"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    {currentUser?.claims?.includes('CanCreateTasks') && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenItemDialog(backlog.id)}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        Ajouter Item
                      </Button>
                    )}
                  </Box>
                </BacklogHeader>
                <BacklogContent>
                  {backlogUserTasks.length > 0 ? (
                    backlogUserTasks.map((task) => (
                      <BacklogItem
                        key={task.id}
                        task={task}
                        backlogId={backlog.id}
                        isSprint={false}
                        currentUser={currentUser}
                        handleOpenTaskDetailsDialog={handleOpenTaskDetailsDialog}
                        handleOpenItemDialog={handleOpenItemDialog}
                        handleOpenDeleteItemDialog={handleOpenDeleteItemDialog}
                        handleOpenAddToSprintDialog={handleOpenAddToSprintDialog}
                        handleUpdateSprintItemStatus={handleUpdateSprintItemStatus}
                        projectUsers={projectUsers}
                        sprints={sprints}
                        hasUpcomingSprint={hasUpcomingSprint}
                      />
                    ))
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      Aucune tâche créée ou assignée à vous dans ce backlog.
                      {currentUser?.claims?.includes('CanCreateTasks') ? ' Cliquez sur "Ajouter Item" pour commencer.' : ''}
                    </Typography>
                  )}
                </BacklogContent>
              </BacklogContainer>
            );
          })}
          {totalBacklogPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalBacklogPages}
                page={backlogPage}
                onChange={handleBacklogPageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </ScrollableContainer>
  );
}

export default BacklogTab;