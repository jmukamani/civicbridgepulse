export function formatDateTime(dateInput, {
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale = navigator?.language || "en-US",
  dateStyle = "medium",
  timeStyle = "short",
} = {}) {
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date?.getTime?.())) return "Invalid date";
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    timeZone,
  });
  return formatter.format(date);
}

export function getCountdownParts(targetDate) {
  const date = typeof targetDate === "string" || typeof targetDate === "number" ? new Date(targetDate) : targetDate;
  if (Number.isNaN(date?.getTime?.())) return null;
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
} 