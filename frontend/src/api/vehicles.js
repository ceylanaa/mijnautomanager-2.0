import { duplicateError, novi } from './client';
import { demoVehicle, normalizePlate, ownVehicles } from './data';
const KEY = 'mam-demo-vehicles';
function localRows() {
  try { const data = JSON.parse(sessionStorage.getItem(KEY)); if (Array.isArray(data)) return data; } catch { /* Reset corrupt local demo data. */ }
  return [
    { id: 1, userId: 1, licensePlate: 'TESTA1', nickname: 'Mijn dagelijkse auto' },
    { id: 2, userId: 2, licensePlate: 'TESTB1', nickname: 'Niet van deze gebruiker' },
  ];
}
export async function loadVehicles(session, signal) {
  if (session.mode === 'novi') return novi.vehicles(session, signal);
  return ownVehicles(localRows(), session.user.id);
}
export async function saveVehicle(session, plate, nickname) {
  if (session.mode === 'novi') return novi.addVehicle(session, plate, nickname);
  const licensePlate = normalizePlate(plate);
  if (!demoVehicle(licensePlate)) throw new Error('Kies een fictief demovoertuig.');
  const records = localRows();
  const existing = ownVehicles(records, session.user.id).find(v => normalizePlate(v.licensePlate) === licensePlate);
  if (existing) throw duplicateError(existing.id);
  const created = { id: Math.max(0, ...records.map(v => v.id)) + 1, userId: session.user.id, licensePlate, nickname: nickname.trim() };
  records.push(created);
  sessionStorage.setItem(KEY, JSON.stringify(records));
  return created;
}
