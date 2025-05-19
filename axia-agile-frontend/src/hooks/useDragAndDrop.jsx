import { useCallback, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { updateTaskPosition, updateKanbanColumn, updateTasksOrderOptimistically, fetchAllTasks } from '../store/slices/taskSlice';

export const useDragAndDrop = ({ columns, tasks, projectId, dispatch, createNotification, currentUser, project, setKanbanError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const handleDragStart = useCallback((event) => {
    setKanbanError('');
    setIsDragging(true);
    setActiveDragId(event.active.id);
    console.log('[useDragAndDrop] Drag Start:', {
      id: event.active.id,
      type: event.active.data.current?.type,
      data: event.active.data.current,
    });
    return event.active.id;
  }, [setKanbanError]);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setIsDragging(false);
      setActiveDragId(null);

      if (!active || !over || !active.id || !over.id) {
        console.warn('[useDragAndDrop] Drag End: Invalid drag event', { active, over });
        setKanbanError('Drag annulé : aucune cible valide détectée.');
        return;
      }

      try {
        const activeId = active.id.toString();
        const overId = over.id.toString();

        console.log('[useDragAndDrop] Drag End:', {
          activeId,
          overId,
          activeType: active.data.current?.type,
          overType: over.data.current?.type,
          activeData: active.data.current,
          overData: over.data.current,
        });

        if (activeId === overId) {
          console.log('[useDragAndDrop] Drag End: No change (same position)');
          return;
        }

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || !overData) {
          throw new Error('Données de drag manquantes (activeData ou overData null).');
        }

        let dragType = activeData.type;
        if (!dragType) {
          const isTask = tasks.some((task) => task.id.toString() === activeId);
          const isColumn = columns.some((col) => col.id.toString() === activeId);
          dragType = isTask ? 'task' : isColumn ? 'column' : null;
          if (!dragType) {
            throw new Error(`Type de drag non détecté pour activeId: ${activeId}`);
          }
        }

        // Utility to normalize displayOrder
        const normalizeTaskDisplayOrder = (tasks, columnName) => {
          const filteredTasks = tasks
            .filter((t) => t.status === columnName)
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          console.log('[normalizeTaskDisplayOrder] Input tasks:', {
            columnName,
            tasks: filteredTasks.map((t) => ({ id: t.id, title: t.title, displayOrder: t.displayOrder })),
          });
          const normalizedTasks = filteredTasks.map((task, index) => ({ ...task, displayOrder: index }));
          console.log('[normalizeTaskDisplayOrder] Normalized tasks:', {
            columnName,
            tasks: normalizedTasks.map((t) => ({ id: t.id, title: t.title, displayOrder: t.displayOrder })),
          });
          return normalizedTasks;
        };

        if (dragType === 'task') {
          const activeTask = tasks.find((task) => task.id.toString() === activeId);
          if (!activeTask) {
            throw new Error(`Tâche active non trouvée : id=${activeId}`);
          }

          const sourceColumn = columns.find((col) => col.name === activeTask.status);
          const destColumn = overData.type === 'column'
            ? columns.find((col) => col.id.toString() === overId)
            : columns.find((col) => col.name === tasks.find((t) => t.id.toString() === overId)?.status);

          if (!sourceColumn || !destColumn) {
            throw new Error(`Colonne source ou destination non trouvée : source=${sourceColumn?.name}, dest=${destColumn?.name}`);
          }

          if (sourceColumn.id === destColumn.id) {
            // Reorder within the same column
            const normalizedSourceTasks = normalizeTaskDisplayOrder(tasks, sourceColumn.name);
            const sourceIndex = normalizedSourceTasks.findIndex((t) => t.id.toString() === activeId);
            let destIndex = overData.type === 'task'
              ? normalizedSourceTasks.findIndex((t) => t.id.toString() === overId)
              : normalizedSourceTasks.length - 1;

            if (sourceIndex === -1) {
              throw new Error(`Tâche non trouvée dans la colonne source : id=${activeId}`);
            }

            if (destIndex === -1) {
              console.warn('[useDragAndDrop] Over task not found, setting destIndex to end of column');
              destIndex = normalizedSourceTasks.length - 1;
            }

            // Adjust destIndex for downward drag
            if (overData.type === 'task' && destIndex > sourceIndex) {
              destIndex -= 1;
            }

            if (sourceIndex === destIndex) {
              console.log('[useDragAndDrop] No reordering needed: same position', { sourceIndex, destIndex });
              return;
            }

            console.log('[useDragAndDrop] Reordering within column:', {
              column: sourceColumn.name,
              sourceIndex,
              destIndex,
              activeTask: { id: activeTask.id, title: activeTask.title },
              overTask: overData.type === 'task' ? tasks.find((t) => t.id.toString() === overId) : 'column',
            });

            const newTasks = arrayMove(normalizedSourceTasks, sourceIndex, destIndex);
            console.log('[useDragAndDrop] New task order:', {
              column: sourceColumn.name,
              tasks: newTasks.map((t) => ({ id: t.id, title: t.title, displayOrder: t.displayOrder })),
            });

            // Optimistic update
            dispatch(
              updateTasksOrderOptimistically({
                columnName: sourceColumn.name,
                newTasks,
              })
            );

            // Store original tasks for reversion
            const originalTasks = [...normalizedSourceTasks];

            // Server updates using updateTaskPosition
            const updates = newTasks
              .map((task, index) => {
                const originalTask = originalTasks.find((t) => t.id === task.id);
                if (index !== originalTask?.displayOrder || task.id.toString() === activeId) {
                  console.log('[useDragAndDrop] Updating task position:', {
                    id: task.id,
                    title: task.title,
                    oldDisplayOrder: originalTask?.displayOrder,
                    newDisplayOrder: index,
                  });
                  return dispatch(
                    updateTaskPosition({
                      taskId: task.id,
                      status: task.status,
                      displayOrder: index,
                    })
                  );
                }
                return null;
              })
              .filter(Boolean);

            if (updates.length === 0) {
              console.log('[useDragAndDrop] No tasks need updating');
              return;
            }

            Promise.all(updates.map((update) => update.unwrap()))
              .then(() => {
                console.log('[useDragAndDrop] All task position updates successful');
              })
              .catch((err) => {
                console.error('[useDragAndDrop] Task position update failed:', {
                  message: err.message,
                  response: err.response ? { status: err.response.status, data: err.response.data } : null,
                });
                setKanbanError(`Erreur lors de la mise à jour des positions des tâches : ${err.response?.data?.message || err.message || 'Erreur serveur'}`);
                // Revert optimistic update
                dispatch(
                  updateTasksOrderOptimistically({
                    columnName: sourceColumn.name,
                    newTasks: originalTasks,
                  })
                );
                // Refetch tasks
                dispatch(fetchAllTasks({ projectId: parseInt(projectId) }));
              });
          } else {
            // Move to a different column
            const sourceTasks = normalizeTaskDisplayOrder(tasks, sourceColumn.name);
            const destTasks = normalizeTaskDisplayOrder(tasks, destColumn.name);
            const sourceIndex = sourceTasks.findIndex((t) => t.id.toString() === activeId);
            let destIndex = overData.type === 'task'
              ? destTasks.findIndex((t) => t.id.toString() === overId)
              : destTasks.length;

            if (sourceIndex === -1) {
              throw new Error(`Tâche non trouvée dans la colonne source : id=${activeId}`);
            }

            const updatedSourceTasks = sourceTasks.filter((t) => t.id.toString() !== activeId);
            const sourceUpdates = updatedSourceTasks.map((task, index) => {
              if (task.displayOrder !== index) {
                return dispatch(
                  updateTaskPosition({
                    taskId: task.id,
                    status: task.status,
                    displayOrder: index,
                  })
                );
              }
              return null;
            }).filter(Boolean);

            const updatedDestTasks = [...destTasks];
            if (overData.type === 'task') {
              updatedDestTasks.splice(destIndex, 0, { ...activeTask, status: destColumn.name });
            } else {
              updatedDestTasks.push({ ...activeTask, status: destColumn.name });
              destIndex = updatedDestTasks.length - 1;
            }

            const destUpdates = updatedDestTasks.map((task, index) => {
              if (task.id.toString() === activeId) {
                return dispatch(
                  updateTaskPosition({
                    taskId: task.id,
                    status: destColumn.name,
                    displayOrder: index,
                  })
                );
              } else if (task.displayOrder !== index) {
                return dispatch(
                  updateTaskPosition({
                    taskId: task.id,
                    status: task.status,
                    displayOrder: index,
                  })
                );
              }
              return null;
            }).filter(Boolean);

            Promise.all([...sourceUpdates, ...destUpdates].map((update) => update.unwrap()))
              .then(() => {
                console.log('[useDragAndDrop] All cross-column position updates successful');
              })
              .catch((err) => {
                console.error('[useDragAndDrop] Cross-column position update failed:', {
                  message: err.message,
                  response: err.response ? { status: err.response.status, data: err.response.data } : null,
                });
                setKanbanError(`Erreur lors du déplacement de la tâche : ${err.response?.data?.message || err.message || 'Erreur serveur'}`);
                dispatch(fetchAllTasks({ projectId: parseInt(projectId) }));
              });

            if (activeTask.assignedUserEmails && Array.isArray(activeTask.assignedUserEmails)) {
              activeTask.assignedUserEmails.forEach((email) => {
                if (email && email !== currentUser?.email) {
                  createNotification({
                    recipient: email,
                    type: 'task',
                    message: `La tâche "${activeTask.title}" a été déplacée de "${sourceColumn.name}" à "${destColumn.name}" dans le projet "${project?.title || 'Projet inconnu'}".`,
                    sender: { name: currentUser?.name || currentUser?.email, avatar: null },
                    metadata: { taskId: activeTask.id },
                  });
                }
              });
            }
          }
        } else if (dragType === 'column') {
          const sortedColumns = [...columns].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          const oldIndex = sortedColumns.findIndex((col) => col.id.toString() === activeId);
          const newIndex = sortedColumns.findIndex((col) => col.id.toString() === overId);

          if (oldIndex === -1 || newIndex === -1) {
            throw new Error(`Colonnes non trouvées : oldIndex=${oldIndex}, newIndex=${newIndex}`);
          }

          if (oldIndex !== newIndex) {
            const newColumns = arrayMove(sortedColumns, oldIndex, newIndex);
            const updates = newColumns.map((col, index) => {
              if (col.displayOrder !== index) {
                console.log('[useDragAndDrop] Updating column:', { id: col.id, name: col.name, newDisplayOrder: index });
                return dispatch(
                  updateKanbanColumn({
                    columnId: col.id,
                    columnData: { ...col, displayOrder: index, projectId: parseInt(projectId) },
                  })
                );
              }
              return null;
            }).filter(Boolean);

            Promise.all(updates.map((update) => update.unwrap())).catch((err) => {
              console.error('[useDragAndDrop] Column update failed:', {
                message: err.message,
                response: err.response ? { status: err.response.status, data: err.response.data } : null,
              });
              setKanbanError(`Erreur lors de la mise à jour des colonnes : ${err.response?.data?.message || err.message || 'Erreur serveur'}`);
            });
          }
        } else {
          throw new Error(`Type de drag invalide : ${dragType}`);
        }
      } catch (err) {
        console.error('[useDragAndDrop] Error:', {
          message: err.message,
          stack: err.stack,
          activeId: active.id,
          overId: over?.id,
        });
        setKanbanError(`Erreur lors du déplacement : ${err.message || 'Erreur inconnue'}`);
      }
    },
    [columns, tasks, projectId, dispatch, createNotification, currentUser, project, setKanbanError]
  );

  const getActiveTask = useCallback(
    (activeId) => {
      const task = tasks.find((task) => task.id.toString() === activeId) || null;
      return task;
    },
    [tasks]
  );

  const getActiveColumn = useCallback(
    (activeId) => {
      const column = columns.find((col) => col.id.toString() === activeId) || null;
      return column;
    },
    [columns]
  );

  return {
    handleDragStart,
    handleDragEnd,
    getActiveTask,
    getActiveColumn,
    isDragging,
    activeDragId,
  };
};