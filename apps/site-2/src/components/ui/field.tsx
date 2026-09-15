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
  autoComplete?: string;
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
  autoComplete,
}: S2FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-[var(--s2-ink)]"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-2.5 text-base text-[var(--s2-ink)] outline-none placeholder:text-[var(--s2-muted)] focus:border-[var(--s2-accent)] disabled:opacity-60 aria-[invalid=true]:border-[var(--s2-danger)]"
      />
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
