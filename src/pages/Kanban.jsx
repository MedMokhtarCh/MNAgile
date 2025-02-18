import React, { useState } from 'react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, Typography } from 'antd';
import { Paper, Grid } from '@mui/material';

const { Title } = Typography;

// Données initiales pour les colonnes Kanban
const initialColumns = {
  'column-1': {
    id: 'column-1',
    title: 'To Do',
    items: ['task-1', 'task-2'],
  },
  'column-2': {
    id: 'column-2',
    title: 'In Progress',
    items: ['task-3'],
  },
  'column-3': {
    id: 'column-3',
    title: 'Done',
    items: ['task-4', 'task-5'],
  },
};

const initialTasks = {
  'task-1': { id: 'task-1', content: 'Create a design system for a hero section' },
  'task-2': { id: 'task-2', content: 'Implement design screens' },
  'task-3': { id: 'task-3', content: 'Fix bugs in the CSS code' },
  'task-4': { id: 'task-4', content: 'Proofread final text' },
  'task-5': { id: 'task-5', content: 'Responsive design' },
};

const Kanban = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);

  // Configurer les capteurs pour le glisser-déposer
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Délai d'activation pour éviter des déclenchements accidentels
      },
    })
  );

  // Gérer la fin d'un glisser-déposer
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id === over.id) return; // Aucun changement si l'élément est déposé au même endroit

    // Trouver les colonnes source et destination
    const sourceColumn = Object.values(columns).find((col) => col.items.includes(active.id));
    const destinationColumn = Object.values(columns).find((col) => col.items.includes(over.id));

    if (!sourceColumn || !destinationColumn) return;

    // Déplacer l'élément dans la même colonne
    if (sourceColumn.id === destinationColumn.id) {
      const newItems = arrayMove(sourceColumn.items, sourceColumn.items.indexOf(active.id), sourceColumn.items.indexOf(over.id));

      setColumns({
        ...columns,
        [sourceColumn.id]: {
          ...sourceColumn,
          items: newItems,
        },
      });
    } else {
      // Déplacer l'élément entre deux colonnes
      const sourceItems = [...sourceColumn.items];
      const destinationItems = [...destinationColumn.items];

      sourceItems.splice(sourceColumn.items.indexOf(active.id), 1);
      destinationItems.splice(destinationColumn.items.indexOf(over.id), 0, active.id);

      setColumns({
        ...columns,
        [sourceColumn.id]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destinationColumn.id]: {
          ...destinationColumn,
          items: destinationItems,
        },
      });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Grid container spacing={2} style={{ padding: '20px', height: '100vh' }}>
        {Object.values(columns).map((column) => (
          <Grid item xs={4} key={column.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Paper elevation={3} style={{ padding: '16px', background: '#f0f2f5', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Title level={4} style={{ marginBottom: '16px' }}>{column.title}</Title>
              <SortableContext items={column.items} strategy={verticalListSortingStrategy}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {column.items.map((taskId) => {
                    const task = tasks[taskId];
                    return (
                      <Card
                        key={taskId}
                        id={taskId}
                        style={{ marginBottom: '8px', cursor: 'grab' }}
                        {...{
                          'data-draggable': true,
                        }}
                      >
                        <Typography.Text>{task.content}</Typography.Text>
                      </Card>
                    );
                  })}
                </div>
              </SortableContext>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </DndContext>
  );
};

export default Kanban;