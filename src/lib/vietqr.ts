export type VietQrBank = {
  bin: string;
  code: string;
  shortName: string;
  name: string;
  transferSupported?: number;
};

const COMMON_BANK_IDS: Record<string, string> = {
  vietinbank: "970415",
  icb: "970415",
  vietcombank: "970436",
  vcb: "970436",
  bidv: "970418",
  agribank: "970405",
  vba: "970405",
  ocb: "970448",
  mb: "970422",
  mbbank: "970422",
  techcombank: "970407",
  tcb: "970407",
  acb: "970416",
  vpbank: "970432",
  vpb: "970432",
  tpbank: "970423",
  tpb: "970423",
  sacombank: "970403",
  stb: "970403",
  hdbank: "970437",
  hdb: "970437",
  vib: "970441",
  shb: "970443",
  eximbank: "970431",
  eib: "970431",
  msb: "970426",
  seabank: "970440",
  lpbank: "970449",
  lpb: "970449",
  pvcombank: "970412",
  pvcombankpay: "971133",
  ncb: "970419",
  abb: "970425",
  abbank: "970425",
  vietabank: "970427",
  namabank: "970428",
  pgbank: "970430",
  vietbank: "970433",
  baovietbank: "970438",
  kienlongbank: "970452",
  saigonbank: "970400",
  scb: "970429",
  shinhanbank: "970424",
  woori: "970457",
  momo: "971025",
  vietcapitalbank: "970454",
  vccb: "970454",
  cake: "546034",
  ubank: "546035",
  timo: "963388",
  bacabank: "970409",
  bab: "970409",
  mbv: "970414",
  coopbank: "970446",
  kbank: "668888",
  cimb: "422589",
};

// Snapshot of banks that currently advertise transferSupported=1. Keeping this
// directory in the app makes QR generation independent from VietQR availability.
export const VIETQR_BANKS: VietQrBank[] = [
  { bin: "970415", code: "ICB", shortName: "VietinBank", name: "Ngân hàng TMCP Công thương Việt Nam" },
  { bin: "970436", code: "VCB", shortName: "Vietcombank", name: "Ngân hàng TMCP Ngoại Thương Việt Nam" },
  { bin: "970418", code: "BIDV", shortName: "BIDV", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam" },
  { bin: "970405", code: "VBA", shortName: "Agribank", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam" },
  { bin: "970448", code: "OCB", shortName: "OCB", name: "Ngân hàng TMCP Phương Đông" },
  { bin: "970422", code: "MB", shortName: "MBBank", name: "Ngân hàng TMCP Quân đội" },
  { bin: "970407", code: "TCB", shortName: "Techcombank", name: "Ngân hàng TMCP Kỹ thương Việt Nam" },
  { bin: "970416", code: "ACB", shortName: "ACB", name: "Ngân hàng TMCP Á Châu" },
  { bin: "970432", code: "VPB", shortName: "VPBank", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng" },
  { bin: "970423", code: "TPB", shortName: "TPBank", name: "Ngân hàng TMCP Tiên Phong" },
  { bin: "970403", code: "STB", shortName: "Sacombank", name: "Ngân hàng TMCP Sài Gòn Thương Tín" },
  { bin: "970437", code: "HDB", shortName: "HDBank", name: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh" },
  { bin: "970454", code: "VCCB", shortName: "VietCapitalBank", name: "Ngân hàng TMCP Bản Việt" },
  { bin: "970429", code: "SCB", shortName: "SCB", name: "Ngân hàng TMCP Sài Gòn" },
  { bin: "970441", code: "VIB", shortName: "VIB", name: "Ngân hàng TMCP Quốc tế Việt Nam" },
  { bin: "970443", code: "SHB", shortName: "SHB", name: "Ngân hàng TMCP Sài Gòn - Hà Nội" },
  { bin: "970431", code: "EIB", shortName: "Eximbank", name: "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam" },
  { bin: "970426", code: "MSB", shortName: "MSB", name: "Ngân hàng TMCP Hàng Hải Việt Nam" },
  { bin: "546034", code: "CAKE", shortName: "CAKE", name: "Ngân hàng số CAKE by VPBank" },
  { bin: "546035", code: "Ubank", shortName: "Ubank", name: "Ngân hàng số Ubank by VPBank" },
  { bin: "963388", code: "TIMO", shortName: "Timo", name: "Ngân hàng số Timo by Ban Viet Bank" },
  { bin: "970400", code: "SGICB", shortName: "SaigonBank", name: "Ngân hàng TMCP Sài Gòn Công Thương" },
  { bin: "970409", code: "BAB", shortName: "BacABank", name: "Ngân hàng TMCP Bắc Á" },
  { bin: "971025", code: "momo", shortName: "MoMo", name: "Công ty Cổ phần Dịch vụ Di động Trực tuyến" },
  { bin: "971133", code: "PVDB", shortName: "PVcomBank Pay", name: "Ngân hàng số PVcomBank Pay" },
  { bin: "970412", code: "PVCB", shortName: "PVcomBank", name: "Ngân hàng TMCP Đại Chúng Việt Nam" },
  { bin: "970414", code: "MBV", shortName: "MBV", name: "Ngân hàng TNHH MTV Việt Nam Hiện Đại" },
  { bin: "970419", code: "NCB", shortName: "NCB", name: "Ngân hàng TMCP Quốc Dân" },
  { bin: "970424", code: "SHBVN", shortName: "ShinhanBank", name: "Ngân hàng TNHH MTV Shinhan Việt Nam" },
  { bin: "970425", code: "ABB", shortName: "ABBANK", name: "Ngân hàng TMCP An Bình" },
  { bin: "970427", code: "VAB", shortName: "VietABank", name: "Ngân hàng TMCP Việt Á" },
  { bin: "970428", code: "NAB", shortName: "NamABank", name: "Ngân hàng TMCP Nam Á" },
  { bin: "970430", code: "PGB", shortName: "PGBank", name: "Ngân hàng TMCP Thịnh vượng và Phát triển" },
  { bin: "970433", code: "VIETBANK", shortName: "VietBank", name: "Ngân hàng TMCP Việt Nam Thương Tín" },
  { bin: "970438", code: "BVB", shortName: "BaoVietBank", name: "Ngân hàng TMCP Bảo Việt" },
  { bin: "970440", code: "SEAB", shortName: "SeABank", name: "Ngân hàng TMCP Đông Nam Á" },
  { bin: "970446", code: "COOPBANK", shortName: "COOPBANK", name: "Ngân hàng Hợp tác xã Việt Nam" },
  { bin: "970449", code: "LPB", shortName: "LPBank", name: "Ngân hàng TMCP Lộc Phát Việt Nam" },
  { bin: "970452", code: "KLB", shortName: "KienLongBank", name: "Ngân hàng TMCP Kiên Long" },
  { bin: "668888", code: "KBank", shortName: "KBank", name: "Ngân hàng Đại chúng TNHH Kasikornbank" },
  { bin: "422589", code: "CIMB", shortName: "CIMB", name: "Ngân hàng TNHH MTV CIMB Việt Nam" },
  { bin: "970457", code: "WVN", shortName: "Woori", name: "Ngân hàng TNHH MTV Woori Việt Nam" },
];

function normalizeBankName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isSingleEditAway(left: string, right: string): boolean {
  if (left === right || Math.abs(left.length - right.length) > 1) return false;

  let leftIndex = 0;
  let rightIndex = 0;
  let edits = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) return false;

    if (left.length >= right.length) leftIndex += 1;
    if (right.length >= left.length) rightIndex += 1;
  }

  if (leftIndex < left.length || rightIndex < right.length) edits += 1;
  return edits === 1;
}

function resolveUniqueTypoMatch(normalized: string, banks: VietQrBank[]): string | null {
  // Short aliases such as MB/ACB are too easy to confuse. Only recover a typo
  // when a reasonably descriptive name points to exactly one bank BIN.
  if (normalized.length < 5) return null;

  const matchedBankIds = new Set<string>();
  for (const [alias, bankId] of Object.entries(COMMON_BANK_IDS)) {
    if (alias.length >= 5 && isSingleEditAway(normalized, alias)) matchedBankIds.add(bankId);
  }

  for (const bank of banks) {
    if (bank.transferSupported === 0) continue;
    const aliases = [bank.code, bank.shortName, bank.name]
      .map(normalizeBankName)
      .filter((alias) => alias.length >= 5);
    if (aliases.some((alias) => isSingleEditAway(normalized, alias))) matchedBankIds.add(bank.bin);
  }

  return matchedBankIds.size === 1 ? [...matchedBankIds][0] : null;
}

export function normalizeVietQrAccountNumber(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 19);
}

export function resolveVietQrBankId(bankName: string, banks: VietQrBank[] = []): string | null {
  const normalized = normalizeBankName(bankName);
  if (/^\d{6}$/.test(normalized)) return normalized;
  if (COMMON_BANK_IDS[normalized]) return COMMON_BANK_IDS[normalized];

  const matched = banks.find((bank) => {
    if (bank.transferSupported === 0) return false;
    const keys = [bank.bin, bank.code, bank.shortName, bank.name].map(normalizeBankName);
    return keys.includes(normalized) || keys.some((key) => key.length >= 3 && normalized.includes(key));
  });

  return matched?.bin ?? resolveUniqueTypoMatch(normalized, banks);
}

export function buildVietQrImageUrl({
  bank,
  accountNumber,
  accountName,
  amount,
  addInfo,
}: {
  bank: string;
  accountNumber: string;
  accountName: string;
  amount?: number;
  addInfo?: string;
}): string {
  const params = new URLSearchParams({ bank, account: accountNumber, name: accountName });
  if (amount && amount > 0) params.set("amount", String(Math.trunc(amount)));
  if (addInfo?.trim()) params.set("addInfo", addInfo.trim());
  return `/api/vietqr?${params.toString()}`;
}

function encodeTlv(id: string, value: string): string {
  if (!/^\d{2}$/.test(id)) throw new Error("VietQR TLV ID must contain two digits");
  const length = new TextEncoder().encode(value).length;
  if (length > 99) throw new Error(`VietQR TLV ${id} is too long`);
  return `${id}${String(length).padStart(2, "0")}${value}`;
}

function crc16Ccitt(value: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function normalizeVietQrAddInfo(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 25);
}

export function buildVietQrPayload({
  bankId,
  accountNumber,
  amount,
  addInfo = "Mung cuoi",
}: {
  bankId: string;
  accountNumber: string;
  amount?: number;
  addInfo?: string;
}): string {
  const account = normalizeVietQrAccountNumber(accountNumber);
  if (!/^\d{6}$/.test(bankId)) throw new Error("Mã BIN ngân hàng không hợp lệ");
  if (account.length < 6) throw new Error("Số tài khoản không hợp lệ");

  const normalizedAmount = amount && Number.isSafeInteger(amount) && amount > 0 ? String(amount) : "";
  if (normalizedAmount.length > 13) throw new Error("Số tiền vượt giới hạn VietQR");

  const consumerAccount = encodeTlv("00", bankId) + encodeTlv("01", account);
  const merchantAccount =
    encodeTlv("00", "A000000727") +
    encodeTlv("01", consumerAccount) +
    encodeTlv("02", "QRIBFTTA");
  const purpose = normalizeVietQrAddInfo(addInfo);

  let payload =
    encodeTlv("00", "01") +
    encodeTlv("01", normalizedAmount ? "12" : "11") +
    encodeTlv("38", merchantAccount) +
    encodeTlv("53", "704");
  if (normalizedAmount) payload += encodeTlv("54", normalizedAmount);
  payload += encodeTlv("58", "VN");
  if (purpose) payload += encodeTlv("62", encodeTlv("08", purpose));

  const crcInput = payload + "6304";
  return crcInput + crc16Ccitt(crcInput);
}
