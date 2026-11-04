"use client";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CanIcon, IconChevronDown, IconChevronUp, IconGrip } from "../icons";
import type { Letter } from "@/lib/types";
import { fmt, type Messages } from "@/lib/i18n";

type Item = { letter: Letter; subtitle: string; score?: number };

export function Ranking({
  order,
  items,
  onChange,
  m,
}: {
  order: Letter[];
  items: Record<Letter, Item>;
  onChange: (o: Letter[]) => void;
  m: Messages;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    onChange(arrayMove(order, order.indexOf(e.active.id as Letter), order.indexOf(e.over.id as Letter)));
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    onChange(arrayMove(order, i, j));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2">
          {order.map((l, i) => (
            <Row key={l} item={items[l]} index={i} last={i === order.length - 1} move={move} m={m} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function Row({
  item,
  index,
  last,
  move,
  m,
}: {
  item: Item;
  index: number;
  last: boolean;
  move: (i: number, d: -1 | 1) => void;
  m: Messages;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.letter });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex items-center gap-2 rounded-2xl border bg-white p-2 pr-1.5 transition-shadow sm:gap-3 sm:p-3 ${
        isDragging
          ? "z-10 border-rose/40 shadow-xl"
          : index === 0
            ? "border-rose/35 shadow-[0_10px_24px_-14px_rgb(232_69_122/0.6)]"
            : "border-line"
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={fmt(m.final.drag, { letter: item.letter })}
        className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-faint hover:text-ink active:cursor-grabbing"
      >
        <IconGrip />
      </button>
      <span
        className={`w-9 shrink-0 text-center text-sm font-semibold tabular-nums ${index === 0 ? "text-rose" : "text-muted"}`}
      >
        {m.final.rank[index]}
      </span>
      <CanIcon letter={item.letter} size={22} filled={index === 0} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium leading-tight text-ink">
          {fmt(m.can.title, { letter: item.letter })}
          {index === 0 && (
            <span className="bg-brand rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
              {m.final.favourite}
            </span>
          )}
        </p>
        {item.subtitle && <p className="truncate text-xs text-muted">{item.subtitle}</p>}
      </div>
      {item.score != null && (
        <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
          {item.score}/9
        </span>
      )}
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={() => move(index, -1)}
          disabled={index === 0}
          aria-label={fmt(m.final.moveUp, { letter: item.letter })}
          className="flex h-6 w-9 items-center justify-center rounded-md text-muted hover:bg-paper hover:text-ink disabled:opacity-25"
        >
          <IconChevronUp width={18} height={18} />
        </button>
        <button
          type="button"
          onClick={() => move(index, 1)}
          disabled={last}
          aria-label={fmt(m.final.moveDown, { letter: item.letter })}
          className="flex h-6 w-9 items-center justify-center rounded-md text-muted hover:bg-paper hover:text-ink disabled:opacity-25"
        >
          <IconChevronDown width={18} height={18} />
        </button>
      </div>
    </li>
  );
}
