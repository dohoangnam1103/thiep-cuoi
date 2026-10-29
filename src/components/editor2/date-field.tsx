"use client";

import { Dialog } from "@base-ui/react/dialog";
import { DayPicker } from "@daypicker/react";
import { vi } from "@daypicker/react/locale";
import { CalendarDays, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { DateInput } from "@/components/ui/date-input";

function parseDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}

function toValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function Editor2DateField({ name, label, value, onChange, required = false, disabled = false }: {
  name: string; label: string; value: string; onChange: (value: string) => void; required?: boolean; disabled?: boolean;
}) {
  const t = useTranslations("editor2");
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const [month, setMonth] = useState<Date>(selected ?? new Date());
  const restoringFocus = useRef(false);
  const inputId = `e2-date-${name}`;
  const showCalendar = () => {
    if (disabled) return;
    setMonth(parseDate(value) ?? new Date());
    setOpen(true);
  };
  return <div className="e2-field">
    <label htmlFor={inputId}>{label}</label>
    <div className="e2-date-control">
      <DateInput id={inputId} name={name} value={value} required={required} disabled={disabled} picker={false}
        inputMode="none" aria-haspopup="dialog" aria-expanded={open}
        onFocus={() => {
          if (restoringFocus.current) { restoringFocus.current = false; return; }
          showCalendar();
        }}
        onBlur={() => { restoringFocus.current = false; }}
        // Open pointer gestures on click, so opening on pointer focus cannot
        // make the same gesture dismiss the calendar.
        onPointerDown={event => { if (event.button === 0) event.preventDefault(); }}
        onClick={showCalendar} onValueChange={onChange} />
      <Dialog.Root open={open} onOpenChange={next => { if (next) setMonth(parseDate(value) ?? new Date()); setOpen(next); }}>
        <Dialog.Trigger className="e2-button e2-date-trigger" disabled={disabled} aria-label={t("chooseDate", { field: label })}><CalendarDays size={19} /></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="e2-date-backdrop" />
          <Dialog.Viewport className="e2-date-viewport">
            <Dialog.Popup className="e2-date-popup" finalFocus={() => {
              // Restoring focus after selection/dismissal must not reopen the calendar.
              restoringFocus.current = true;
              return document.getElementById(inputId);
            }}>
              <div className="e2-date-head"><Dialog.Title>{t("dateDialogTitle")}</Dialog.Title><Dialog.Close className="e2-button e2-icon-button" aria-label={t("close")}><X size={18} /></Dialog.Close></div>
              <DayPicker mode="single" required locale={vi} weekStartsOn={1} selected={selected} month={month} onMonthChange={setMonth}
                captionLayout="dropdown" startMonth={new Date(1900, 0)} endMonth={new Date(2100, 11)} autoFocus
                onSelect={date => { if (date) { onChange(toValue(date)); setOpen(false); } }} />
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  </div>;
}
