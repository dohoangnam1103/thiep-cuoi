import type { ChangeEvent } from "react";

type S2FieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (
    event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
};

/* Labeled form field. The visible label is always rendered above the input,
 * never replaced by a placeholder. Input text stays at 16px so mobile Safari
 * never zooms the viewport on focus. */
export function S2Field({
  id,
  name,
  label,
  type = "text",
  error,
  hint,
  required,
  disabled,
  placeholder,
  defaultValue,
  value,
  onChange,
  autoComplete,
  multiline = false,
  rows = 2,
}: S2FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const controlClass =
    "w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-2.5 text-base text-[var(--s2-ink)] outline-none transition-colors duration-200 placeholder:text-[var(--s2-muted)] focus:border-[var(--s2-accent)] focus:ring-2 focus:ring-[var(--s2-accent-soft)] disabled:opacity-60 aria-[invalid=true]:border-[var(--s2-danger)]";
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-[var(--s2-ink)]"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${controlClass} resize-y`}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClass}
        />
      )}
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-[13px] text-[var(--s2-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-[13px] text-[var(--s2-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
