// RDW levert datums als tekst "JJJJMMDD". Deze helper maakt er een Nederlandse datum van.
export function formatRdwDate(value) {
  if (!/^\d{8}$/.test(value ?? '')) return 'Niet beschikbaar';
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));

  // Een datum als 31 februari wordt door Date verschoven; die keuren we af.
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!valid) return 'Niet beschikbaar';
  return new Intl.DateTimeFormat('nl-NL', { timeZone: 'UTC' }).format(date);
}
