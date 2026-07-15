import type { GuestImportRow, GuestRow } from "@/lib/guest-manager";

type GuestField = keyof GuestImportRow;

export type GuestCsvResult = {
  rows: GuestImportRow[];
  errors: string[];
};

const EXPORT_HEADERS: Array<[GuestField, string]> = [
  ["name", "Họ và tên"],
  ["role", "Vai trò"],
  ["side", "Nhà"],
  ["groupName", "Nhóm khách"],
  ["tableName", "Bàn"],
  ["phone", "Số điện thoại"],
  ["email", "Email"],
  ["greeting", "Lời chào riêng"],
  ["maxGuests", "Số khách tối đa"],
  ["giftAmount", "Tiền mừng"],
  ["note", "Ghi chú"],
];

const HEADER_ALIASES: Record<string, GuestField> = {
  name: "name",
  ten: "name",
  hoten: "name",
  hovaten: "name",
  fullname: "name",
  role: "role",
  vai: "role",
  vaitro: "role",
  danhxung: "role",
  side: "side",
  nha: "side",
  phia: "side",
  group: "groupName",
  groupname: "groupName",
  nhom: "groupName",
  nhomkhach: "groupName",
  table: "tableName",
  tablename: "tableName",
  ban: "tableName",
  soban: "tableName",
  phone: "phone",
  sodienthoai: "phone",
  dienthoai: "phone",
  sdt: "phone",
  email: "email",
  greeting: "greeting",
  loichao: "greeting",
  loichaorieng: "greeting",
  loichaoriengcuakhach: "greeting",
  maxguests: "maxGuests",
  sokhach: "maxGuests",
  sokhachtoida: "maxGuests",
  giftamount: "giftAmount",
  tienmung: "giftAmount",
  sotienmung: "giftAmount",
  note: "note",
  ghichu: "note",
};

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
}

function parseMatrix(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeSide(value: string) {
  const normalized = normalizeHeader(value);
  if (["nhatrai", "trai", "groom", "groomside"].includes(normalized)) return "Nhà trai";
  if (["nhagai", "gai", "bride", "brideside"].includes(normalized)) return "Nhà gái";
  return value.trim();
}

function parseInteger(value: string, fallback: number) {
  const normalized = value.replace(/[^0-9-]/g, "");
  if (!normalized) return fallback;
  const number = Number.parseInt(normalized, 10);
  return Number.isFinite(number) ? number : fallback;
}

export function parseGuestCsv(input: string): GuestCsvResult {
  const matrix = parseMatrix(input.replace(/^\uFEFF/, ""));
  if (matrix.length < 2) return { rows: [], errors: ["emptyImport"] };

  const headerMap = matrix[0].map((header) => HEADER_ALIASES[normalizeHeader(header)] ?? null);
  if (!headerMap.includes("name")) return { rows: [], errors: ["missingNameColumn"] };

  const rows: GuestImportRow[] = [];
  const errors: string[] = [];

  matrix.slice(1).forEach((cells, rowIndex) => {
    const source: Partial<Record<GuestField, string>> = {};
    headerMap.forEach((field, columnIndex) => {
      if (field) source[field] = cells[columnIndex]?.trim() ?? "";
    });

    const name = source.name?.trim() ?? "";
    if (!name) {
      errors.push(`missingName:${rowIndex + 2}`);
      return;
    }

    const maxGuests = Math.min(20, Math.max(1, parseInteger(source.maxGuests ?? "", 1)));
    const rawGiftAmount = source.giftAmount?.trim() ?? "";
    const giftAmount = rawGiftAmount ? Math.max(0, parseInteger(rawGiftAmount, 0)) : null;

    rows.push({
      name,
      role: source.role ?? "",
      side: normalizeSide(source.side ?? ""),
      groupName: source.groupName ?? "",
      tableName: source.tableName ?? "",
      phone: source.phone ?? "",
      email: source.email ?? "",
      greeting: source.greeting ?? "",
      maxGuests,
      giftAmount,
      note: source.note ?? "",
    });
  });

  return { rows, errors };
}

function escapeCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function guestsToCsv(guests: Array<GuestRow | GuestImportRow>) {
  const header = EXPORT_HEADERS.map(([, label]) => escapeCell(label)).join(",");
  const body = guests.map((guest) =>
    EXPORT_HEADERS.map(([field]) => escapeCell(guest[field])).join(","),
  );
  return `\uFEFF${[header, ...body].join("\r\n")}`;
}

export function guestCsvTemplate() {
  return guestsToCsv([
    {
      name: "Nguyễn Minh Anh",
      role: "Anh",
      side: "Nhà trai",
      groupName: "Bạn đại học",
      tableName: "Bàn 05",
      phone: "0901234567",
      email: "",
      greeting: "Thân mời anh Minh Anh",
      maxGuests: 2,
      giftAmount: null,
      note: "Ăn chay",
    },
  ]);
}
