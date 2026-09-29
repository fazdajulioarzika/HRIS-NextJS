export function getJakartaDateString(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    date
  );
}

export function getMonthRange(monthStr: string) {
  // monthStr format: "2026-09"
  const [year, month] = monthStr.split("-").map(Number);
  const start = `${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${monthStr}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function getCurrentMonthString() {
  const jakartaDate = getJakartaDateString();
  return jakartaDate.slice(0, 7); // "2026-09"
}
