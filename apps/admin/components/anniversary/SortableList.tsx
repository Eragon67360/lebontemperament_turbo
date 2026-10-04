"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";

/**
 * A vertical list whose rows can be dragged by their handle (pointer or
 * keyboard: Space, arrows, Space). `onReorder` receives the dragged id and
 * the id it was dropped on; the caller plans and saves the move.
 */
export function SortableList({
  ids,
  onReorder,
  disabled,
  className,
  children,
}: {
  ids: string[];
  onReorder: (activeId: string, overId: string) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={ids}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <ul className={className}>{children}</ul>
      </SortableContext>
    </DndContext>
  );
}

type HandleProps = React.HTMLAttributes<HTMLElement> & {
  ref: (node: HTMLElement | null) => void;
};

const SortableHandleContext = React.createContext<HandleProps | null>(null);

/** The drag-handle props of the enclosing `SortableRow`, if any. */
export function useSortableHandle() {
  return React.useContext(SortableHandleContext);
}

/** One sortable row; its `ContentRow` picks up the handle from context. */
export function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };

  const handle = React.useMemo<HandleProps>(
    () => ({ ...attributes, ...listeners, ref: setActivatorNodeRef }),
    [attributes, listeners, setActivatorNodeRef],
  );

  return (
    <li ref={setNodeRef} style={style} className="list-none">
      <SortableHandleContext.Provider value={handle}>
        {children}
      </SortableHandleContext.Provider>
    </li>
  );
}
