export function isStale(hopeBy: string | null): boolean {
  if (!hopeBy) return false;
  const hopeDate = new Date(hopeBy);
  const today = new Date();
  // Reset time to compare dates only
  today.setHours(0, 0, 0, 0);
  return hopeDate < today;
}
