const PI = Math.PI;
const VIETNAM_TIME_ZONE = 7;

const HEAVENLY_STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const EARTHLY_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;

export type VietnameseLunarDate = {
  day: number;
  month: number;
  year: number;
  leap: boolean;
};

function integer(value: number): number {
  return Math.floor(value);
}

function julianDayFromDate(day: number, month: number, year: number): number {
  const a = integer((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let julianDay = day + integer((153 * m + 2) / 5) + 365 * y + integer(y / 4) - integer(y / 100) + integer(y / 400) - 32045;
  if (julianDay < 2299161) {
    julianDay = day + integer((153 * m + 2) / 5) + 365 * y + integer(y / 4) - 32083;
  }
  return julianDay;
}

function newMoon(k: number): number {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const radians = PI / 180;
  let julianDay = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
  julianDay += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * radians);

  const sunAnomaly = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const moonAnomaly = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const moonLatitude = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;

  let correction = (0.1734 - 0.000393 * t) * Math.sin(sunAnomaly * radians);
  correction += 0.0021 * Math.sin(2 * sunAnomaly * radians);
  correction -= 0.4068 * Math.sin(moonAnomaly * radians);
  correction += 0.0161 * Math.sin(2 * moonAnomaly * radians);
  correction -= 0.0004 * Math.sin(3 * moonAnomaly * radians);
  correction += 0.0104 * Math.sin(2 * moonLatitude * radians);
  correction -= 0.0051 * Math.sin((sunAnomaly + moonAnomaly) * radians);
  correction -= 0.0074 * Math.sin((sunAnomaly - moonAnomaly) * radians);
  correction += 0.0004 * Math.sin((2 * moonLatitude + sunAnomaly) * radians);
  correction -= 0.0004 * Math.sin((2 * moonLatitude - sunAnomaly) * radians);
  correction -= 0.0006 * Math.sin((2 * moonLatitude + moonAnomaly) * radians);
  correction += 0.0010 * Math.sin((2 * moonLatitude - moonAnomaly) * radians);
  correction += 0.0005 * Math.sin((2 * moonAnomaly + sunAnomaly) * radians);

  const deltaT = t < -11
    ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
    : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return julianDay + correction - deltaT;
}

function sunLongitude(julianDay: number): number {
  const t = (julianDay - 2451545.0) / 36525;
  const t2 = t * t;
  const radians = PI / 180;
  const meanAnomaly = 357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const meanLongitude = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  let deltaLongitude = (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(radians * meanAnomaly);
  deltaLongitude += (0.019993 - 0.000101 * t) * Math.sin(2 * radians * meanAnomaly);
  deltaLongitude += 0.00029 * Math.sin(3 * radians * meanAnomaly);
  const longitude = (meanLongitude + deltaLongitude) * radians;
  return longitude - PI * 2 * integer(longitude / (PI * 2));
}

function newMoonDay(k: number, timeZone: number): number {
  return integer(newMoon(k) + 0.5 + timeZone / 24);
}

function sunLongitudeSector(dayNumber: number, timeZone: number): number {
  return integer((sunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 6);
}

function lunarMonth11(year: number, timeZone: number): number {
  const offset = julianDayFromDate(31, 12, year) - 2415021;
  const k = integer(offset / 29.530588853);
  let newMoonDate = newMoonDay(k, timeZone);
  if (sunLongitudeSector(newMoonDate, timeZone) >= 9) {
    newMoonDate = newMoonDay(k - 1, timeZone);
  }
  return newMoonDate;
}

function leapMonthOffset(month11: number, timeZone: number): number {
  const k = integer(0.5 + (month11 - 2415021.076998695) / 29.530588853);
  let previousSector = -1;
  let currentSector = sunLongitudeSector(newMoonDay(k + 1, timeZone), timeZone);
  let index = 1;
  do {
    previousSector = currentSector;
    index += 1;
    currentSector = sunLongitudeSector(newMoonDay(k + index, timeZone), timeZone);
  } while (currentSector !== previousSector && index < 14);
  return index - 1;
}

function parseIsoDate(value: string): { day: number; month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { day, month, year };
}

export function toVietnameseLunarDate(isoDate: string): VietnameseLunarDate | null {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;

  const dayNumber = julianDayFromDate(parsed.day, parsed.month, parsed.year);
  const k = integer((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1, VIETNAM_TIME_ZONE);
  if (monthStart > dayNumber) monthStart = newMoonDay(k, VIETNAM_TIME_ZONE);

  let month11A = lunarMonth11(parsed.year, VIETNAM_TIME_ZONE);
  let month11B = month11A;
  let lunarYear: number;
  if (month11A >= monthStart) {
    lunarYear = parsed.year;
    month11A = lunarMonth11(parsed.year - 1, VIETNAM_TIME_ZONE);
  } else {
    lunarYear = parsed.year + 1;
    month11B = lunarMonth11(parsed.year + 1, VIETNAM_TIME_ZONE);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const monthDifference = integer((monthStart - month11A) / 29);
  let lunarMonth = monthDifference + 11;
  let leap = false;
  if (month11B - month11A > 365) {
    const leapOffset = leapMonthOffset(month11A, VIETNAM_TIME_ZONE);
    if (monthDifference >= leapOffset) {
      lunarMonth = monthDifference + 10;
      if (monthDifference === leapOffset) leap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && monthDifference < 4) lunarYear -= 1;

  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap };
}

export function vietnameseLunarYearName(year: number): string {
  return `${HEAVENLY_STEMS[(year + 6) % 10]} ${EARTHLY_BRANCHES[(year + 8) % 12]}`;
}

export function formatVietnameseLunarDate(isoDate: string): string {
  const lunar = toVietnameseLunarDate(isoDate);
  if (!lunar) return "";
  const day = String(lunar.day).padStart(2, "0");
  const month = String(lunar.month).padStart(2, "0");
  const leap = lunar.leap ? " nhuận" : "";
  return `(Tức ngày ${day}/${month}${leap} năm ${vietnameseLunarYearName(lunar.year)} âm lịch)`;
}
