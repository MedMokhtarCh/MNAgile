import { useCallback, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { updateTask, updateBacklogTaskIds, updateSprint } from '../store/slices/taskSlice';

export const useDragAndDrop = ({ backlogs, sprints, tasks, projectId, dispatch, createNotification, currentUser, project, setError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const handleDragStart = useCallback((event) => {
    setError('');
    setIsDragging(true);
    setActiveDragId(event.active.id);
    console.log('[useDragAndDrop] Drag Start:', event.active.id, 'Data:', event.active.data.current);
    return event.active.id;
  }, [setError]);

  const handleDragOver = useCallback((event) => {
    console.log('[useDragAndDrop] Drag Over:', {
      active: event.active.id,
      over: event.over?.id,
      activeData: event.active.data.current,
      overData: event.over?.data.current,
    });
    return;
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setIsDragging(false);
    setActiveDragId(null);

    if (!active || !over || !active.id || !over.id) {
      console.log('[useDragAndDrop] Drag End: Invalid drag event', { active, over });
      return;
    }

    try {
      const activeIdValue = active.id.toString();
      const overId = over.id.toString();

      if (activeIdValue === overId) {
        console.log('[useDragAndDrop] Drag End: No change (same position)');
        return;
      }

      // Find the active task
      const activeTask = tasks.find((task) => task.id.toString() === activeIdValue);
      if (!activeTask) {
        console.error('[useDragAndDrop] Active task not found:', activeIdValue);
        return;
      }

      // Determine source and destination containers (backlog or sprint)
      const sourceContainer = backlogs.find((b) => b.taskIds.includes(activeTask.id)) ||
                             sprints.find((s) => s.taskIds?.includes(activeTask.id));
      const overTask = tasks.find((t) => t.id.toString() === overId);
      const destContainer = overTask
        ? (backlogs.find((b) => b.taskIds.includes(overTask.id)) ||
           sprints.find((s) => s.taskIds?.includes(overTask.id)))
        : (backlogs.find((b) => b.id.toString() === overId) ||
           sprints.find((s) => s.id.toString() === overId));

      if (!sourceContainer || !destContainer) {
        console.error('[useDragAndDrop] Source or destination container not found');
        return;
      }

      const isSourceBacklog = 'description' in sourceContainer; // Backlogs have description, sprints may not
      const isDestBacklog = 'description' in destContainer;

      // Handle reordering within the same container
      if (sourceContainer.id === destContainer.id) {
        const taskIds = [...(sourceContainer.taskIds || [])];
        const sourceIndex = taskIds.findIndex((id) => id.toString() === activeIdValue);
        const destIndex = overTask
          ? taskIds.findIndex((id) => id.toString() === overId)
          : taskIds.length;

        if (sourceIndex === -1 || destIndex === -1) {
          console.error('[useDragAndDrop] Invalid indices:', { sourceIndex, destIndex });
          return;
        }

        if (sourceIndex !== destIndex) {
          const newTaskIds = arrayMove(taskIds, sourceIndex, destIndex);
          console.log('[useDragAndDrop] New task order:', newTaskIds);

          if (isSourceBacklog) {
            dispatch(updateBacklogTaskIds({
              backlogId: sourceContainer.id,
              taskIds: newTaskIds,
            }));
          } else {
            dispatch(updateSprint({
              sprintId: sourceContainer.id,
              sprintData: { ...sourceContainer, taskIds: newTaskIds },
            }));
          }

          // Update backend
          dispatch(updateTask({
            taskId: activeTask.id,
            taskData: { ...activeTask, displayOrder: destIndex },
            attachments: [],
          }));
        }
      } else {
        // Handle moving between containers
        const sourceTaskIds = [...(sourceContainer.taskIds || [])];
        const destTaskIds = [...(destContainer.taskIds || [])];
        const sourceIndex = sourceTaskIds.findIndex((id) => id.toString() === activeIdValue);
        const destIndex = overTask
          ? destTaskIds.findIndex((id) => id.toString() === overId)
          : destTaskIds.length;

        if (sourceIndex === -1) {
          console.error('[useDragAndDrop] Source task not found in source container');
          return;
        }

        // Remove from source
        sourceTaskIds.splice(sourceIndex, 1);
        // Add to destination
        destTaskIds.splice(destIndex, 0, activeTask.id);

        console.log('[useDragAndDrop] Moving task:', {
          taskId: activeTask.id,
          from: sourceContainer.name,
          to: destContainer.name,
        });

        // Update source container
        if (isSourceBacklog) {
          dispatch(updateBacklogTaskIds({
            backlogId: sourceContainer.id,
            taskIds: sourceTaskIds,
          }));
        } else {
          dispatch(updateSprint({
            sprintId: sourceContainer.id,
            sprintData: { ...sourceContainer, taskIds: sourceTaskIds },
          }));
        }

        // Update destination container
        if (isDestBacklog) {
          dispatch(updateBacklogTaskIds({
            backlogId: destContainer.id,
            taskIds: destTaskIds,
          }));
        } else {
          dispatch(updateSprint({
            sprintId: destContainer.id,
            sprintData: { ...destContainer, taskIds: destTaskIds },
          }));
        }

        // Update task
        const updatedTaskData = {
          ...activeTask,
          sprintId: isDestBacklog ? null : destContainer.id,
          backlogIds: isDestBacklog ? [destContainer.id] : activeTask.backlogIds.filter(id => id !== sourceContainer.id),
          displayOrder: destIndex,
          projectId: parseInt(projectId),
        };

        dispatch(updateTask({
          taskId: activeTask.id,
          taskData: updatedTaskData,
          attachments: [],
        }));

        // Create notifications
        if (activeTask.assignedUserEmails && Array.isArray(activeTask.assignedUserEmails)) {
          activeTask.assignedUserEmails.forEach((email) => {
            if (email && email !== currentUser?.email) {
              createNotification({
                recipient: email,
                type: 'task',
                message: `La tâche "${activeTask.title}" a été déplacée de "${sourceContainer.name}" à "${destContainer.name}" dans le projet "${project?.title || 'Projet inconnu'}".`,
                sender: { name: currentUser?.name || currentUser?.email, avatar: null },
                metadata: { taskId: activeTask.id },
              });
            }
          });
        }
      }
    } catch (err) {
      console.error('[useDragAndDrop] Error during drag-and-drop:', err);
      setError('Erreur lors du déplacement. Veuillez réessayer.');
    }
  }, [backlogs, sprints, tasks, projectId, dispatch, createNotification, currentUser, project, setError]);

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    setActiveDragId(null);
    console.log('[useDragAndDrop] Drag Cancelled');
  }, []);

  const getActiveTask = useCallback((activeId) => {
    if (!activeId) return null;
    return tasks.find((task) => task.id.toString() === activeId) || null;
  }, [tasks]);

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    getActiveTask,
    isDragging,
    activeDragId,
  };
};