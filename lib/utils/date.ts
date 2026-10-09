import { WeekRange } from "@/types";

/**
 * Returns YYYY-MM-DD string for a given Date object (local or UTC)
 */
export function formatDateISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date for friendly UI display, e.g. "25 Sep 2026"
 */
export function formatDateDisplay(dateStrOrObj: string | Date): string {
  if (!dateStrOrObj) return "-";
  const date = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return String(dateStrOrObj);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Returns Monday and Sunday boundaries for any given date
 * In textile factory wage systems, week starts on Monday and ends on Sunday.
 */
export function getWeekBounds(targetDate: Date = new Date()): {
  week_id: string;
  start_date: string;
  end_date: string;
  label: string;
} {
  const d = new Date(targetDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
  
  // Calculate difference to get Monday (day 1)
  // If today is Sunday (0), Monday was 6 days ago (-6)
  // If today is Monday (1), diff is 0
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Compute ISO Week number for week_id
  const weekNumber = getISOWeekNumber(monday);
  const weekYear = monday.getFullYear();
  const week_id = `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;

  const start_date = formatDateISO(monday);
  const end_date = formatDateISO(sunday);

  const label = `${formatShortDate(monday)} – ${formatShortDate(sunday)}, ${sunday.getFullYear()}`;

  return {
    week_id,
    start_date,
    end_date,
    label,
  };
}

/**
 * Get ISO week number (1-53)
 */
export function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function formatShortDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Generate a list of recent weekly ranges for selectors (default last 12 weeks or up to 52 weeks for 1-year history)
 */
export function getRecentWeeks(count: number = 12): WeekRange[] {
  const weeks: WeekRange[] = [];
  const today = new Date();
  const currentWeek = getWeekBounds(today);

  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i * 7);
    const bounds = getWeekBounds(d);
    
    // Avoid duplicates if two dates land on same week
    if (!weeks.some((w) => w.week_id === bounds.week_id)) {
      weeks.push({
        ...bounds,
        is_current: bounds.week_id === currentWeek.week_id,
      });
    }
  }

  return weeks;
}

/**
 * Returns last 12 months for 1-Year History view
 */
export function getLast12Months(): { month_id: string; month_name: string; year: number }[] {
  const months: { month_id: string; month_name: string; year: number }[] = [];
  const today = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStr = String(d.getMonth() + 1).padStart(2, "0");
    const month_id = `${d.getFullYear()}-${monthStr}`;
    const month_name = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(d);
    
    months.push({
      month_id,
      month_name,
      year: d.getFullYear(),
    });
  }

  return months;
}
