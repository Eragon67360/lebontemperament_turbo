"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
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

  // Spoken in French by screen readers while dragging (dnd-kit defaults are English).
  const position = (id: UniqueIdentifier) => ids.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Élément ${position(active.id)} sur ${ids.length} saisi.`,
    onDragOver: ({ over }) =>
      over
        ? `Position ${position(over.id)} sur ${ids.length}.`
        : "Hors de la liste.",
    onDragEnd: ({ over }) =>
      over
        ? `Déposé en position ${position(over.id)} sur ${ids.length}.`
        : "Déposé hors de la liste : ordre inchangé.",
    onDragCancel: () => "Déplacement annulé : ordre inchangé.",
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Pour déplacer un élément, appuyez sur Espace ou Entrée, utilisez les flèches haut et bas, puis Espace ou Entrée pour le déposer, ou Échap pour annuler.",
        },
      }}
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
