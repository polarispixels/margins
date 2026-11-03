// Days for the reading engine, as 'YYYY-MM-DD' strings in local time (so
// "a different day" means what a parent would expect).

export function dayString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// The day `n` days after `day`.
export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return dayString(new Date(y, m - 1, d + n));
}

// Is `day` on or before `other`? (The strings sort like dates.)
export function onOrBefore(day, other) {
  return day <= other;
}
