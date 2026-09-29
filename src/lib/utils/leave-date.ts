export function countBusinessDays(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++; // exclude Sabtu/Minggu
    current.setDate(current.getDate() + 1);
  }
  return count;
}
