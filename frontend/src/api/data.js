export const normalizePlate = value => String(value ?? '').toUpperCase().replace(/[\s-]/g, '');
export function validPlate(value) { return /^[A-Z0-9]{1,20}$/.test(normalizePlate(value)); }
export function referenceId(value) {
  const id = typeof value === 'object' && value !== null ? value.id : value;
  if ((typeof id !== 'number' && typeof id !== 'string') || String(id).trim() === '') return null;
  return /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) ? Number(id) : null;
}
export function ownVehicles(records, userId) {
  const id = referenceId(userId);
  if (id === null) throw new Error('Je gebruikersnummer ontbreekt. Log opnieuw in.');
  return records.filter(vehicle => referenceId(vehicle.userId) === id);
}
export function uniqueUser(users, email) {
  const key = String(email ?? '').trim().toLowerCase();
  const matches = users.filter(u => typeof u.email === 'string' && u.email.trim().toLowerCase() === key);
  if (!key || matches.length !== 1 || referenceId(matches[0].id) === null) {
    throw new Error('Je account kon niet eenduidig aan een gebruikersnummer worden gekoppeld. Log opnieuw in of laat de gebruikerskoppeling controleren.');
  }
  return { id: referenceId(matches[0].id), email: matches[0].email };
}
export const demoVehicles = [
  { licensePlate: 'TESTA1', brand: 'Voorbeeldmerk', model: 'Stadsauto', year: 'Voorbeeldbouwjaar', fuel: 'Benzine', apk: null, source: 'demo' },
  { licensePlate: 'TESTA2', brand: 'Voorbeeldmerk', model: 'Weekendauto', year: 'Voorbeeldbouwjaar', fuel: 'Elektrisch', apk: null, source: 'demo' },
  { licensePlate: 'TESTB1', brand: 'Voorbeeldmerk', model: 'Familieauto', year: 'Voorbeeldbouwjaar', fuel: 'Benzine', apk: null, source: 'demo' },
];
export function demoVehicle(plate) { return demoVehicles.find(v => v.licensePlate === normalizePlate(plate)); }
export function formatRdwDate(value) {
  if (!/^\d{8}$/.test(value ?? '')) return 'Niet beschikbaar';
  const y = Number(value.slice(0, 4)), m = Number(value.slice(4, 6)), d = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    ? new Intl.DateTimeFormat('nl-NL', { timeZone: 'UTC' }).format(date) : 'Niet beschikbaar';
}
