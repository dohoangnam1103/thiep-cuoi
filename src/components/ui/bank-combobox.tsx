"use client";

import Select, { type ClassNamesConfig, type FormatOptionLabelMeta } from "react-select";
import { useId, useState } from "react";

import {
  resolveVietQrBankId,
  VIETQR_BANKS,
  type VietQrBank,
} from "@/lib/vietqr";
import { cn } from "@/lib/utils";

const BANKS = [...VIETQR_BANKS].sort((left, right) =>
  left.shortName.localeCompare(right.shortName, "vi"),
);

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchesBank(bank: VietQrBank, query: string): boolean {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  return [bank.shortName, bank.code, bank.bin, bank.name]
    .map(normalizeSearch)
    .some((value) => value.includes(normalizedQuery));
}

function findBank(value: string): VietQrBank | null {
  const bankId = resolveVietQrBankId(value, BANKS);
  return BANKS.find((bank) => bank.bin === bankId) ?? null;
}

function formatBankOption(
  bank: VietQrBank,
  meta: FormatOptionLabelMeta<VietQrBank>,
) {
  if (meta.context === "value") {
    return <span className="truncate font-medium">{bank.shortName}</span>;
  }

  return (
    <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 text-left">
      <span className="grid h-8 min-w-11 place-items-center rounded-md border border-border bg-secondary px-1.5 font-mono text-[10px] font-semibold text-secondary-foreground">
        {bank.code.toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{bank.shortName}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {bank.name} · {bank.bin}
        </span>
      </span>
    </span>
  );
}

const classNames: ClassNamesConfig<VietQrBank, false> = {
  container: () => "text-sm",
  control: ({ isFocused }) =>
    cn(
      "min-h-10 rounded-lg border border-input bg-background shadow-sm transition-[border-color,box-shadow]",
      isFocused && "border-primary ring-2 ring-ring/25",
    ),
  valueContainer: () => "min-w-0 gap-1 px-3 py-0",
  placeholder: () => "truncate text-muted-foreground",
  singleValue: () => "min-w-0 text-foreground",
  input: () => "m-0 p-0 text-foreground",
  indicatorsContainer: () => "shrink-0 pr-1 text-muted-foreground",
  clearIndicator: () =>
    "grid size-8 cursor-pointer place-items-center rounded-md transition hover:bg-muted hover:text-foreground",
  dropdownIndicator: () =>
    "grid size-8 cursor-pointer place-items-center rounded-md transition hover:bg-muted hover:text-foreground",
  indicatorSeparator: () => "hidden",
  menuPortal: () => "z-[150]",
  menu: () =>
    "my-1 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl",
  menuList: () => "max-h-72 overscroll-contain p-1.5",
  option: ({ isFocused, isSelected }) =>
    cn(
      "cursor-pointer rounded-lg px-2 py-2 text-foreground",
      isFocused && "bg-primary/10",
      isSelected && "bg-primary/15 text-primary",
    ),
  noOptionsMessage: () => "px-4 py-8 text-sm text-muted-foreground",
};

export function BankCombobox({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  const inputId = useId();
  const [selectedBank, setSelectedBank] = useState<VietQrBank | null>(() => findBank(defaultValue));
  const portalTarget = typeof document === "undefined" ? null : document.body;

  return (
    <div data-testid={`bank-select-${name}`}>
      <label
        htmlFor={inputId}
        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <Select<VietQrBank, false>
        unstyled
        inputId={inputId}
        instanceId={inputId}
        name={name}
        options={BANKS}
        value={selectedBank}
        onChange={setSelectedBank}
        getOptionLabel={(bank) => bank.shortName}
        getOptionValue={(bank) => bank.shortName}
        filterOption={({ data }, query) => matchesBank(data, query)}
        formatOptionLabel={formatBankOption}
        classNames={classNames}
        placeholder="Chọn hoặc tìm ngân hàng"
        noOptionsMessage={() => "Không tìm thấy ngân hàng phù hợp"}
        isSearchable
        isClearable
        menuPlacement="auto"
        menuPosition="fixed"
        menuPortalTarget={portalTarget}
        menuShouldScrollIntoView={false}
        menuShouldBlockScroll={false}
        maxMenuHeight={288}
      />
    </div>
  );
}
