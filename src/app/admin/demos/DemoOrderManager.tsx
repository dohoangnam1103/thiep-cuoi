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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  CheckCircle2,
  GripVertical,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";

import {
  saveTemplateDisplayOrder,
  saveTemplateVisibility,
  type TemplateVisibilityState,
} from "./actions";
import { TemplateNameForm } from "./TemplateNameForm";

export type DemoOrderItem = {
  id: string;
  templateId: string;
  name: string;
  defaultName: string;
  isRenamed: boolean;
  isVisible: boolean;
  couple: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function DemoOrderManager({
  initialItems,
}: {
  initialItems: DemoOrderItem[];
}) {
  const t = useTranslations("adminDemos");
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorCode, setErrorCode] = useState<"invalidData" | "saveFailed">();
  const [pending, startTransition] = useTransition();
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (pending || !over || active.id === over.id) return;

    const from = items.findIndex((item) => item.templateId === active.id);
    const to = items.findIndex((item) => item.templateId === over.id);
    if (from === -1 || to === -1) return;

    const previous = items;
    const next = arrayMove(items, from, to);
    setItems(next);
    setStatus("saving");
    setErrorCode(undefined);

    startTransition(async () => {
      const result = await saveTemplateDisplayOrder(
        next.map((item) => item.templateId),
      );
      if (!result.ok) {
        setItems(previous);
        setErrorCode(result.errorCode);
        setStatus("error");
        return;
      }

      setStatus("saved");
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setStatus("idle"), 2500);
    });
  }

  return (
    <section aria-labelledby="demo-order-heading" className="space-y-3">
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-3">
        <p id="demo-order-heading" className="text-sm text-muted-foreground">
          {t("orderHelp")}
        </p>
        <OrderSaveStatus status={status} errorCode={errorCode} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.templateId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="overflow-x-auto rounded-2xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="w-20 px-4 py-3 font-medium">
                    {t("orderColumn")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("templateColumn")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("coupleColumn")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("actionsColumn")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("visibilityColumn")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <SortableDemoRow
                    key={item.id}
                    item={item}
                    position={index + 1}
                    disabled={pending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableDemoRow({
  item,
  position,
  disabled,
}: {
  item: DemoOrderItem;
  position: number;
  disabled: boolean;
}) {
  const t = useTranslations("adminDemos");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.templateId, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-border last:border-0 align-top ${
        isDragging ? "bg-primary/5 shadow-lg" : "bg-background"
      }`}
    >
      <td className="px-4 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          className="flex touch-none cursor-grab items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-1.5 font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t("dragHandle", { name: item.name })}
        >
          <GripVertical className="size-4" aria-hidden />
          <span className="min-w-5 text-center tabular-nums">{position}</span>
        </button>
      </td>
      <td className="px-4 py-3">
        <TemplateNameForm
          templateId={item.templateId}
          name={item.name}
          defaultName={item.defaultName}
          isRenamed={item.isRenamed}
        />
      </td>
      <td className="px-4 py-3">{item.couple}</td>
      <td className="px-4 py-3">
        <Link
          href={`/admin/demos/${item.id}`}
          className="text-sm text-primary hover:underline"
        >
          {t("edit")}
        </Link>
      </td>
      <td className="px-4 py-3">
        <TemplateVisibilitySwitch
          templateId={item.templateId}
          name={item.name}
          initialVisible={item.isVisible}
        />
      </td>
    </tr>
  );
}

type VisibilityErrorCode = Extract<
  TemplateVisibilityState,
  { ok: false }
>["errorCode"];

function TemplateVisibilitySwitch({
  templateId,
  name,
  initialVisible,
}: {
  templateId: string;
  name: string;
  initialVisible: boolean;
}) {
  const t = useTranslations("adminDemos");
  const [visible, setVisible] = useState(initialVisible);
  const [errorCode, setErrorCode] = useState<VisibilityErrorCode>();
  const [pending, startTransition] = useTransition();

  function toggleVisibility() {
    if (pending) return;
    const nextVisible = !visible;
    setErrorCode(undefined);

    startTransition(async () => {
      const result = await saveTemplateVisibility({
        templateId,
        isVisible: nextVisible,
      });
      if (!result.ok) {
        setErrorCode(result.errorCode);
        return;
      }
      setVisible(result.isVisible);
    });
  }

  return (
    <div className="flex min-w-32 flex-col items-start gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={visible}
          aria-label={t("visibilitySwitch", { name })}
          disabled={pending}
          onClick={toggleVisibility}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 ${
            visible ? "bg-primary" : "bg-muted-foreground/35"
          }`}
        >
          <span
            aria-hidden
            className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
              visible ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`text-xs font-semibold ${
            visible ? "text-emerald-700" : "text-muted-foreground"
          }`}
        >
          {pending
            ? t("visibilitySaving")
            : visible
              ? t("visibilityOn")
              : t("visibilityOff")}
        </span>
      </div>
      {errorCode ? (
        <span className="text-xs text-destructive">
          {t(`visibilityErrors.${errorCode}`)}
        </span>
      ) : null}
    </div>
  );
}

function OrderSaveStatus({
  status,
  errorCode,
}: {
  status: SaveStatus;
  errorCode: "invalidData" | "saveFailed" | undefined;
}) {
  const t = useTranslations("adminDemos");

  if (status === "idle") return null;

  return (
    <p
      aria-live="polite"
      className={`flex items-center gap-1.5 text-xs font-medium ${
        status === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {status === "saving" ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : status === "saved" ? (
        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
      ) : (
        <AlertCircle className="size-4" aria-hidden />
      )}
      {status === "saving"
        ? t("orderSaving")
        : status === "saved"
          ? t("orderSaved")
          : t(`orderErrors.${errorCode ?? "saveFailed"}`)}
    </p>
  );
}
