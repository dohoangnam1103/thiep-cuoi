"use client";

import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import Select, { type ClassNamesConfig } from "react-select";

import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string };

type Variant = "default" | "neutral";

type ComboboxBaseProps = {
  options: ComboboxOption[];
  placeholder?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
  inputId?: string;
  "aria-label"?: string;
  variant?: Variant;
  className?: string;
  portal?: boolean;
  formatOptionLabel?: (option: ComboboxOption) => ReactNode;
};

type ComboboxFormProps = ComboboxBaseProps & {
  name: string;
  defaultValue?: string;
};

type ComboboxControlledProps = ComboboxBaseProps & {
  value: string;
  onChange: (value: string) => void;
};

export type ComboboxProps = ComboboxFormProps | ComboboxControlledProps;

function isControlled(props: ComboboxProps): props is ComboboxControlledProps {
  return "onChange" in props;
}

function classNamesFor(variant: Variant): ClassNamesConfig<ComboboxOption, false> {
  const neutral = variant === "neutral";
  return {
    container: () => "text-sm",
    control: ({ isFocused }) =>
      cn(
        "min-h-11 rounded-xl border shadow-sm transition-[border-color,box-shadow]",
        neutral ? "border-neutral-300 bg-white" : "border-input bg-background",
        isFocused &&
          (neutral
            ? "border-neutral-700 ring-2 ring-neutral-900/10"
            : "border-primary ring-2 ring-ring/25"),
      ),
    valueContainer: () => "gap-1 px-3 py-0.5",
    placeholder: () => cn("truncate", neutral ? "text-neutral-500" : "text-muted-foreground"),
    singleValue: () => cn("min-w-0", neutral ? "text-neutral-900" : "text-foreground"),
    input: () => cn("m-0 p-0", neutral ? "text-neutral-900" : "text-foreground"),
    indicatorsContainer: () =>
      cn("shrink-0 pr-1", neutral ? "text-neutral-500" : "text-muted-foreground"),
    clearIndicator: () =>
      "grid size-8 cursor-pointer place-items-center rounded-md transition hover:bg-black/5",
    dropdownIndicator: () =>
      "grid size-8 cursor-pointer place-items-center rounded-md transition hover:bg-black/5",
    indicatorSeparator: () => "hidden",
    menuPortal: () => "z-[150]",
    menu: () =>
      cn(
        "my-1 overflow-hidden rounded-xl border shadow-xl",
        neutral
          ? "border-neutral-200 bg-white text-neutral-900"
          : "border-border bg-popover text-popover-foreground",
      ),
    menuList: () => "max-h-72 overscroll-contain p-1.5",
    option: ({ isFocused, isSelected }) =>
      cn(
        "cursor-pointer rounded-lg px-2.5 py-2",
        neutral
          ? cn(
              "text-neutral-900",
              isFocused && "bg-neutral-100",
              isSelected && "bg-neutral-200",
            )
          : cn(
              "text-foreground",
              isFocused && "bg-primary/10",
              isSelected && "bg-primary/15 text-primary",
            ),
      ),
    noOptionsMessage: () => "px-4 py-6 text-sm text-muted-foreground",
  };
}

export function Combobox(props: ComboboxProps) {
  const {
    options,
    placeholder,
    isSearchable = false,
    isClearable = false,
    inputId,
    variant = "default",
    className,
    portal = true,
    formatOptionLabel,
  } = props;
  const ariaLabel = props["aria-label"];
  const controlled = isControlled(props);

  const generatedId = useId();
  const id = inputId ?? generatedId;

  const [internal, setInternal] = useState(controlled ? "" : props.defaultValue ?? "");
  const currentValue = controlled ? props.value : internal;

  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (controlled) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [internal, controlled]);

  const selected = useMemo(
    () => options.find((option) => option.value === currentValue) ?? null,
    [options, currentValue],
  );

  const portalTarget = !portal || typeof document === "undefined" ? null : document.body;

  return (
    <div className={className}>
      {controlled ? null : (
        <input ref={hiddenRef} type="hidden" name={props.name} value={currentValue} readOnly />
      )}
      <Select<ComboboxOption, false>
        unstyled
        inputId={id}
        instanceId={id}
        aria-label={ariaLabel}
        options={options}
        value={selected}
        onChange={(option) => {
          const next = option?.value ?? "";
          if (controlled) props.onChange(next);
          else setInternal(next);
        }}
        classNames={classNamesFor(variant)}
        formatOptionLabel={formatOptionLabel}
        placeholder={placeholder ?? ""}
        isSearchable={isSearchable}
        isClearable={isClearable}
        menuPlacement="auto"
        menuPosition="fixed"
        menuPortalTarget={portalTarget}
        menuShouldScrollIntoView={false}
        menuShouldBlockScroll={false}
        maxMenuHeight={288}
        noOptionsMessage={() => "Không có lựa chọn"}
      />
    </div>
  );
}
