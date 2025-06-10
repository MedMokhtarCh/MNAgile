// pages/BacklogPage.js
import React from 'react';
import { Box, Tabs, Tab, CircularProgress, Alert, Button } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useBacklog } from '../hooks/useBacklog';
import BacklogTab from '../components/backlog/BacklogTab';
import SprintsTab from '../components/backlog/SprintsTab';
import SprintReviewTab from './SprintReviewTab';
import BacklogDialog from '../components/backlog/BacklogDialog';
import ItemDialog from '../components/backlog/ItemDialog';
import SprintDialog from '../components/backlog/SprintDialog';
import AddToSprintDialog from '../components/backlog/AddToSprintDialog';
import TaskDetailsDialog from '../components/backlog/TaskDetailsDialog';
import DeleteConfirmationDialog from '../components/backlog/DeleteConfirmationDialog';

export default function BacklogPage() {
  const {
    project,
    projectUsers,
    loading,
    error,
    activeTab,
    handleTabChange,
    backlogDialogOpen,
    setBacklogDialogOpen,
    itemDialogOpen,
    setItemDialogOpen,
    sprintDialogOpen,
    setSprintDialogOpen,
    addToSprintDialogOpen,
    setAddToSprintDialogOpen,
    deleteBacklogDialogOpen,
    setDeleteBacklogDialogOpen,
    deleteItemDialogOpen,
    setDeleteItemDialogOpen,
    deleteSprintDialogOpen,
    setDeleteSprintDialogOpen,
    taskDetailsDialogOpen,
    setTaskDetailsDialogOpen,
    currentBacklog,
    currentItem,
    currentSprint,
    selectedItemForSprint,
    backlogToDelete,
    itemToDelete,
    sprintToDelete,
    selectedTask,
    formValues,
    isSubmitting,
    backlogPage,
    setBacklogPage,
    sprintPage,
    setSprintPage,
    sprintReviewPage,
    setSprintReviewPage,
    backlogsPerPage,
    sprintsPerPage,
    tasks,
    taskStatus,
    taskError,
    columns,
    columnStatus,
    columnError,
    backlogs,
    sprints,
    currentUser,
    generateInitials,
    getAvatarColor,
    handleOpenBacklogDialog,
    handleOpenItemDialog,
    handleOpenSprintDialog,
    handleOpenAddToSprintDialog,
    handleOpenDeleteBacklogDialog,
    handleOpenDeleteItemDialog,
    handleOpenDeleteSprintDialog,
    handleOpenTaskDetailsDialog,
    handleAddBacklog,
    handleUpdateBacklog,
    handleDeleteBacklog,
    handleAddItem,
    handleUpdateItem,
    handleCreateSprint,
    handleUpdateSprint,
    handleDeleteSprint,
    handleAddToSprint,
    handleUpdateSprintItemStatus,
    handleFormChange,
    handleAddSubtask,
    handleSubtaskChange,
    handleRemoveSubtask,
    handleDeleteItem,
    clearErrors,
  } = useBacklog('backlog');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Alert
          severity="error"
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
          {error || 'Projet introuvable.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: '1px solid #e0e0e0',
          '& .MuiTab-root': { textTransform: 'none', minWidth: 120 },
        }}
      >
        <Tab label="Backlog" icon={<ListAltIcon />} iconPosition="start" value="backlog" />
        <Tab label="Sprints" icon={<TimelineIcon />} iconPosition="start" value="sprints" />
        <Tab label="Révision Sprint" icon={<ArrowForwardIcon />} iconPosition="start" value="sprintReview" />
      </Tabs>
      {activeTab === 'backlog' && (
        <BacklogTab
          project={project}
          backlogs={backlogs}
          tasks={tasks}
          status={taskStatus}
          error={error || taskError}
          currentUser={currentUser}
          backlogPage={backlogPage}
          backlogsPerPage={backlogsPerPage}
          handleBacklogPageChange={(e, value) => setBacklogPage(value)}
          handleOpenBacklogDialog={handleOpenBacklogDialog}
          handleOpenItemDialog={handleOpenItemDialog}
          handleOpenDeleteBacklogDialog={handleOpenDeleteBacklogDialog}
          handleOpenTaskDetailsDialog={handleOpenTaskDetailsDialog}
          handleUpdateSprintItemStatus={handleUpdateSprintItemStatus}
          clearErrors={clearErrors}
          handleOpenDeleteItemDialog={handleOpenDeleteItemDialog}
          handleOpenAddToSprintDialog={handleOpenAddToSprintDialog}
          projectUsers={projectUsers}
          sprints={sprints}
        />
      )}
      {activeTab === 'sprints' && (
        <SprintsTab
          project={project}
          sprints={sprints}
          tasks={tasks}
          columns={columns}
          taskStatus={taskStatus}
          columnStatus={columnStatus}
          sprintStatus={sprints.status}
          error={error || taskError || columnError || sprints.error}
          currentUser={currentUser}
          sprintPage={sprintPage}
          sprintsPerPage={sprintsPerPage}
          handleSprintPageChange={(e, value) => setSprintPage(value)}
          handleOpenSprintDialog={handleOpenSprintDialog}
          handleOpenDeleteSprintDialog={handleOpenDeleteSprintDialog}
          handleOpenTaskDetailsDialog={handleOpenTaskDetailsDialog}
          handleUpdateSprintItemStatus={handleUpdateSprintItemStatus}
          clearErrors={clearErrors}
          handleOpenItemDialog={handleOpenItemDialog}
          handleOpenDeleteItemDialog={handleOpenDeleteItemDialog}
          handleOpenAddToSprintDialog={handleOpenAddToSprintDialog}
        />
      )}
      {activeTab === 'sprintReview' && (
        <SprintReviewTab
          project={project}
          backlogs={backlogs}
          tasks={tasks}
          status={taskStatus}
          error={error || taskError}
          currentUser={currentUser}
          sprintReviewPage={sprintReviewPage}
          backlogsPerPage={backlogsPerPage}
          handleSprintReviewPageChange={(e, value) => setSprintReviewPage(value)}
          handleOpenBacklogDialog={handleOpenBacklogDialog}
          handleOpenItemDialog={handleOpenItemDialog}
          handleOpenDeleteBacklogDialog={handleOpenDeleteBacklogDialog}
          handleOpenTaskDetailsDialog={handleOpenTaskDetailsDialog}
          handleUpdateSprintItemStatus={handleUpdateSprintItemStatus}
          clearErrors={clearErrors}
          handleOpenDeleteItemDialog={handleOpenDeleteItemDialog}
          handleOpenAddToSprintDialog={handleOpenAddToSprintDialog}
          projectUsers={projectUsers}
          sprints={sprints}
        />
      )}
      <BacklogDialog
        open={backlogDialogOpen}
        onClose={() => setBacklogDialogOpen(false)}
        currentBacklog={currentBacklog}
        formValues={formValues}
        isSubmitting={isSubmitting}
        error={error}
        handleFormChange={handleFormChange}
        handleAddBacklog={handleAddBacklog}
        handleUpdateBacklog={handleUpdateBacklog}
      />
      <ItemDialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        currentItem={currentItem}
        currentBacklog={currentBacklog}
        formValues={formValues}
        isSubmitting={isSubmitting}
        error={error}
        projectUsers={projectUsers}
        sprints={sprints}
        handleFormChange={handleFormChange}
        handleAddSubtask={handleAddSubtask}
        handleSubtaskChange={handleSubtaskChange}
        handleRemoveSubtask={handleRemoveSubtask}
        handleAddItem={handleAddItem}
        handleUpdateItem={handleUpdateItem}
        getAvatarColor={getAvatarColor}
        generateInitials={generateInitials}
      />
      <SprintDialog
        open={sprintDialogOpen}
        onClose={() => setSprintDialogOpen(false)}
        currentSprint={currentSprint}
        formValues={formValues}
        isSubmitting={isSubmitting}
        error={error}
        handleFormChange={handleFormChange}
        handleCreateSprint={handleCreateSprint}
        handleUpdateSprint={handleUpdateSprint}
      />
      <AddToSprintDialog
        open={addToSprintDialogOpen}
        onClose={() => setAddToSprintDialogOpen(false)}
        sprints={sprints}
        isSubmitting={isSubmitting}
        error={error}
        handleAddToSprint={handleAddToSprint}
      />
      <TaskDetailsDialog
        open={taskDetailsDialogOpen}
        onClose={() => setTaskDetailsDialogOpen(false)}
        selectedTask={selectedTask}
        projectUsers={projectUsers}
        sprints={sprints}
        getAvatarColor={getAvatarColor}
        generateInitials={generateInitials}
        handleOpenItemDialog={handleOpenItemDialog}
        currentUser={currentUser}
      />
      <DeleteConfirmationDialog
        open={deleteBacklogDialogOpen}
        onClose={() => setDeleteBacklogDialogOpen(false)}
        title="Confirmer la suppression du backlog"
        message="Êtes-vous sûr de vouloir supprimer ce backlog ? Cette action est irréversible et supprimera également tous les items associés."
        onConfirm={handleDeleteBacklog}
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmationDialog
        open={deleteItemDialogOpen}
        onClose={() => setDeleteItemDialogOpen(false)}
        title="Supprimer l'item"
        message="Êtes-vous sûr de vouloir supprimer cet item ? Cette action est irréversible."
        onConfirm={handleDeleteItem}
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmationDialog
        open={deleteSprintDialogOpen}
        onClose={() => setDeleteSprintDialogOpen(false)}
        title="Confirmer la suppression du sprint"
        message="Êtes-vous sûr de vouloir supprimer ce sprint ? Cette action est irréversible et retirera les tâches associées de ce sprint."
        onConfirm={handleDeleteSprint}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
}