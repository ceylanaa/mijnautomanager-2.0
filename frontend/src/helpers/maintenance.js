import { todayKey } from './apkStatus';
import { formatRdwDate } from './format';

// NOVI bewaart maintenanceDate als getal. Ik gebruik JJJJMMDD, net als de RDW-datums.
export function dateInputToNumber(value) {
  return Number(value.replaceAll('-', ''));
}

export function numberToDateInput(value) {
  const text = String(value ?? '');
  return /^\d{8}$/.test(text) ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : '';
}

export function formatMaintenanceDate(value) {
  return formatRdwDate(String(value ?? ''));
}

// Leeg bedrag = onbekend, 0 = gratis (F27).
export function formatEuro(value) {
  if (value === null || value === undefined || value === '') return 'Niet ingevuld';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

export function formatMileage(value) {
  return `${new Intl.NumberFormat('nl-NL').format(value)} km`;
}

// Nieuw naar oud; bij dezelfde datum beslist het recordnummer (F28).
export function sortMaintenance(records) {
  return [...records].sort((a, b) => (b.maintenanceDate - a.maintenanceDate) || (b.id - a.id));
}

// Controleert de formulierwaarden (ontwerp paragraaf 5.2).
// Geeft een object met foutmeldingen per veld en, als alles klopt, de gegevens voor NOVI.
export function validateMaintenance(values, today = todayKey()) {
  const errors = {};
  const description = values.description.trim();
  const garageName = values.garageName.trim();
  const notes = values.notes.trim();
  const costText = values.cost.trim().replace(',', '.');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || formatMaintenanceDate(dateInputToNumber(values.date)) === 'Niet beschikbaar') {
    errors.date = 'Vul een geldige datum in.';
  } else if (dateInputToNumber(values.date) > Number(today)) {
    errors.date = 'De datum mag niet in de toekomst liggen. Leg alleen uitgevoerd onderhoud vast.';
  }

  if (!description) errors.description = 'Vul een omschrijving in.';
  else if (description.length > 1000) errors.description = 'De omschrijving mag maximaal 1000 tekens bevatten.';

  if (!/^\d+$/.test(values.mileage.trim())) errors.mileage = 'Vul een hele kilometerstand in van 0 of hoger, zonder punt of komma.';
  else if (Number(values.mileage) > 9999999) errors.mileage = 'Deze kilometerstand is te hoog.';

  if (costText && !/^\d+(\.\d{1,2})?$/.test(costText)) errors.cost = 'Vul een bedrag van 0 of hoger in met maximaal twee decimalen.';
  if (garageName.length > 200) errors.garageName = 'De garagenaam mag maximaal 200 tekens bevatten.';
  if (notes.length > 2000) errors.notes = 'De notities mogen maximaal 2000 tekens bevatten.';

  if (Object.keys(errors).length > 0) return { errors, data: null };

  const data = {
    maintenanceDate: dateInputToNumber(values.date),
    description,
    mileage: Number(values.mileage),
  };
  if (costText) data.costEuro = Number(costText);
  if (garageName) data.garageName = garageName;
  if (notes) data.notes = notes;
  return { errors, data };
}

// Waarschuwing (geen blokkade) als een eerdere beurt een hogere kilometerstand heeft.
export function mileageWarning(records, data, currentId) {
  const conflict = records.some(record =>
    record.id !== currentId && record.maintenanceDate <= data.maintenanceDate && record.mileage > data.mileage);
  return conflict ? 'Let op: een eerdere beurt heeft een hogere kilometerstand. Controleer de invoer.' : '';
}
