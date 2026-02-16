// German public holidays (bundesweit) — NRW-Feiertage included
// For production: calculate Easter dynamically via Gauss algorithm
export const GERMAN_HOLIDAYS: Record<string, string> = {
  // 2026
  "2026-01-01": "Neujahr",
  "2026-04-03": "Karfreitag",
  "2026-04-06": "Ostermontag",
  "2026-05-01": "Tag der Arbeit",
  "2026-05-14": "Christi Himmelfahrt",
  "2026-05-25": "Pfingstmontag",
  "2026-06-04": "Fronleichnam",
  "2026-10-03": "Tag der Dt. Einheit",
  "2026-11-01": "Allerheiligen",
  "2026-12-25": "1. Weihnachtstag",
  "2026-12-26": "2. Weihnachtstag",
  // 2027
  "2027-01-01": "Neujahr",
  "2027-03-26": "Karfreitag",
  "2027-03-29": "Ostermontag",
  "2027-05-01": "Tag der Arbeit",
  "2027-05-06": "Christi Himmelfahrt",
  "2027-05-17": "Pfingstmontag",
  "2027-05-27": "Fronleichnam",
  "2027-10-03": "Tag der Dt. Einheit",
  "2027-11-01": "Allerheiligen",
  "2027-12-25": "1. Weihnachtstag",
  "2027-12-26": "2. Weihnachtstag",
};

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Calculate working days between two dates,
 * excluding weekends (Sa/So) and German public holidays.
 */
export function calculateWorkingDays(startDate: string, endDate: string): number {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const key = formatDateKey(current);
    // Skip weekends and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !GERMAN_HOLIDAYS[key]) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Check if a specific date is a holiday.
 */
export function isHoliday(dateStr: string): string | undefined {
  return GERMAN_HOLIDAYS[dateStr];
}

/**
 * Check if a date is a weekend (Saturday or Sunday).
 */
export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}
