"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from "react";
import { formatCalendarDate, parseCalendarDateInput } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "min" | "max"> & {
  value?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  onValueChange?: (iso: string) => void;
  picker?: boolean;
};

/** The named hidden field submits ISO; people only enter and see DD/MM/YYYY. */
export function DateInput({ value, defaultValue = "", onValueChange, name, id, min, max, disabled, required, className, picker = true, inputMode = "numeric", ...props }: DateInputProps) {
  const t = useTranslations("dateInput");
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const input = useRef<HTMLInputElement>(null);
  const nativePicker = useRef<HTMLInputElement>(null);
  const [stored, setStored] = useState(defaultValue);
  const iso = value ?? stored;
  const [entry, setEntry] = useState({ source: iso, text: formatCalendarDate(iso) });
  if (entry.source !== iso) setEntry({ source: iso, text: formatCalendarDate(iso) });
  const text = entry.source === iso ? entry.text : formatCalendarDate(iso);
  const parsed = parseCalendarDateInput(text);
  const error = text && !parsed ? t("invalid")
    : parsed && min && parsed < min ? t("min", { date: formatCalendarDate(min) })
    : parsed && max && parsed > max ? t("max", { date: formatCalendarDate(max) }) : "";

  function change(nextIso: string, nextText: string) {
    setEntry({ source: nextIso, text: nextText });
    if (value === undefined) setStored(nextIso);
    onValueChange?.(nextIso);
  }

  useEffect(() => {
    const form = input.current?.form;
    if (!form || value !== undefined) return;
    const reset = () => {
      setStored(defaultValue);
      setEntry({ source: defaultValue, text: formatCalendarDate(defaultValue) });
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [value, defaultValue]);

  const fields = <>
    <input {...props} ref={element => { input.current = element; element?.setCustomValidity(error); }}
      id={inputId} name={name ? `${name}-display` : undefined} type="text" inputMode={inputMode} autoComplete="off"
      placeholder={t("placeholder")} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" maxLength={10}
      value={text} disabled={disabled} required={required} aria-invalid={Boolean(error) || undefined}
      className={cn(className, picker && "pr-10")}
      onChange={event => {
        const raw = event.target.value;
        const next = /^\d{8}$/.test(raw) ? `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}` : raw;
        change(parseCalendarDateInput(next) ?? "", next);
      }} />
    <input type="hidden" name={name} value={iso} disabled={disabled} />
  </>;
  if (!picker) return fields;
  return <span className="relative block w-full">
    {fields}
    <button type="button" disabled={disabled} aria-label={t("choose")} className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
      onClick={() => { if (nativePicker.current?.showPicker) nativePicker.current.showPicker(); else nativePicker.current?.click(); }}>
      <CalendarDays className="size-4" aria-hidden />
    </button>
    <input ref={nativePicker} type="date" value={iso} min={min} max={max} disabled={disabled} tabIndex={-1} aria-hidden="true"
      className="pointer-events-none absolute bottom-0 right-0 size-px opacity-0"
      onChange={event => change(event.target.value, formatCalendarDate(event.target.value))} />
  </span>;
}
