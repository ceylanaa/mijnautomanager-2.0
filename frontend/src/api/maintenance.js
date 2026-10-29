import { ApiError, novi } from './client';
import { referenceId } from './data';
import { deleteVehicle } from './vehicles';

const KEY = 'mam-demo-maintenance';

// Lokale demo: onderhoud staat alleen in sessionStorage van dit tabblad.
function localRows() {
  try {
    const data = JSON.parse(sessionStorage.getItem(KEY));
    if (Array.isArray(data)) return data;
  } catch { /* Kapotte demodata wordt opnieuw opgebouwd. */ }
  return [
    { id: 1, vehicleId: 1, maintenanceDate: '2026-03-14', description: 'Kleine beurt met olie en filter', mileage: 48210, costEuro: 189.5, garageName: 'Voorbeeldgarage', notes: 'Fictieve onderhoudsbeurt' },
  ];
}

function saveLocal(records) {
  sessionStorage.setItem(KEY, JSON.stringify(records));
}

// Alleen records die echt bij dit voertuig horen, ook als de server meer teruggeeft.
function forVehicle(records, vehicleId) {
  return records.filter(record => referenceId(record.vehicleId) === referenceId(vehicleId));
}

export async function loadMaintenance(session, vehicleId, signal) {
  if (session.mode !== 'novi') return forVehicle(localRows(), vehicleId);
  return forVehicle(await novi.allPages(`/vehicles/${vehicleId}/maintenance`, session, signal), vehicleId);
}

export async function addMaintenance(session, vehicleId, data) {
  const body = { ...data, vehicleId };
  if (session.mode !== 'novi') {
    const records = localRows();
    const created = { ...body, id: Math.max(0, ...records.map(record => record.id)) + 1 };
    saveLocal([...records, created]);
    return created;
  }
  try {
    return await novi.request('/maintenance', { token: session.token, method: 'POST', body });
  } catch (error) {
    if (error.status) throw error;
    throw new ApiError('De opslaguitkomst is onzeker. Controleer eerst de onderhoudslijst voordat je opnieuw opslaat.');
  }
}

// Bij bewerken blijft de voertuigkoppeling vast (F29).
// NOVI vervangt bij PUT het hele record en eist het id in de body (live getest).
export async function updateMaintenance(session, record, data) {
  const body = { id: record.id, ...data, vehicleId: record.vehicleId };
  if (session.mode !== 'novi') {
    const records = localRows().map(item => (item.id === record.id ? body : item));
    saveLocal(records);
    return;
  }
  await novi.request(`/maintenance/${record.id}`, { token: session.token, method: 'PUT', body });
}

export async function deleteMaintenance(session, record) {
  if (session.mode !== 'novi') {
    saveLocal(localRows().filter(item => item.id !== record.id));
    return;
  }
  await novi.request(`/maintenance/${record.id}`, { token: session.token, method: 'DELETE' });
}

// Verwijdert eerst al het onderhoud en daarna pas het voertuig.
// Lukt een stap niet, dan stoppen we en melden we wat al wel verwijderd is.
export async function deleteVehicleWithMaintenance(session, vehicle, records) {
  let removed = 0;
  for (const record of records) {
    try {
      await deleteMaintenance(session, record);
      removed += 1;
    } catch (error) {
      error.message = `Verwijderen is gestopt. ${removed} van de ${records.length} onderhoudsrecords zijn verwijderd; het voertuig staat er nog. ${error.message}`;
      throw error;
    }
  }
  try {
    await deleteVehicle(session, vehicle.id);
  } catch (error) {
    error.message = `Het onderhoud is verwijderd, maar het voertuig zelf niet. ${error.message}`;
    throw error;
  }
}
