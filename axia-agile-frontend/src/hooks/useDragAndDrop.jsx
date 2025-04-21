import { useState } from 'react';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';

export default function useDragAndDrop(initialData, config = {}) {
  const {
    type = 'list', // 'list' ou 'kanban'
    onDragStart: externalOnDragStart,
    onDragEnd: externalOnDragEnd,
    onItemsChange,
  } = config;

  const [activeId, setActiveId] = useState(null);
  const [items, setItems] = useState(initialData);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    if (externalOnDragStart) externalOnDragStart(event);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!active || !over || active.id === over.id) {
      if (externalOnDragEnd) externalOnDragEnd(event);
      return;
    }

    if (type === 'list') {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);
        if (onItemsChange) onItemsChange(newItems);
      }
    } else if (type === 'kanban' && externalOnDragEnd) {
      externalOnDragEnd(event, { items, setItems });
    }

    if (externalOnDragEnd) externalOnDragEnd(event);
  };

  return {
    DndProvider: ({ children, sensors }) => (
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        {children}
      </DndContext>
    ),
    items,
    setItems,
    activeId,
    sortableProps: {
      items: items.map(item => item.id),
      strategy: type === 'kanban' ? horizontalListSortingStrategy : verticalListSortingStrategy,
    },
  };
}