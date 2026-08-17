export type AuditDisplayDetails = {
  beforePrice: number | null;
  afterPrice: number | null;
  beforeComplimentary: boolean | null;
  afterComplimentary: boolean | null;
  supersededPaymentCount: number | null;
};

export function parseAuditDetailsForDisplay(
  raw: string | null,
): AuditDisplayDetails | null {
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const before = isRecord(parsed.before) ? parsed.before : null;
  const after = isRecord(parsed.after) ? parsed.after : null;
  const beforePrice = nullablePrice(before?.adminPriceOverride);
  const afterPrice = nullablePrice(after?.adminPriceOverride);
  const beforeComplimentary = nullableBoolean(before?.complimentary);
  const afterComplimentary = nullableBoolean(after?.complimentary);
  const supersededPaymentCount = nullableCount(parsed.supersededPaymentCount);
  if (
    !beforePrice.valid &&
    !afterPrice.valid &&
    !beforeComplimentary.valid &&
    !afterComplimentary.valid &&
    !supersededPaymentCount.valid
  ) {
    return null;
  }

  return {
    beforePrice: beforePrice.value,
    afterPrice: afterPrice.value,
    beforeComplimentary: beforeComplimentary.value,
    afterComplimentary: afterComplimentary.value,
    supersededPaymentCount: supersededPaymentCount.value,
  };
}

type ParsedField<T> = { valid: boolean; value: T | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nullablePrice(value: unknown): ParsedField<number> {
  if (value === null) return { valid: true, value: null };
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? { valid: true, value }
    : { valid: false, value: null };
}

function nullableBoolean(value: unknown): ParsedField<boolean> {
  return typeof value === "boolean"
    ? { valid: true, value }
    : { valid: false, value: null };
}

function nullableCount(value: unknown): ParsedField<number> {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? { valid: true, value }
    : { valid: false, value: null };
}
