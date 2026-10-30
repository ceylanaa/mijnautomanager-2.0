import { todayKey } from './apkStatus';
import { formatRdwDate } from './format';

// NOVI accepteert maintenanceDate live alleen als datumtekst (JJJJ-MM-DD), ondanks "number" in de Swagger.
// Oudere records kunnen een volledige ISO-tijd bevatten; daarom alleen de eerste 10 tekens gebruiken.
export function dateKey(value) {
  const text = String(value ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

export function formatMaintenanceDate(value) {
  const key = dateKey(value);
  return key ? formatRdwDate(key.replaceAll('-', '')) : 'Niet beschikbaar';
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
  return [...records].sort((a, b) =>
    dateKey(b.maintenanceDate).localeCompare(dateKey(a.maintenanceDate)) || (b.id - a.id));
}

// Lege formulierwaarden, of de waarden van een bestaand record bij bewerken.
export function formValues(record) {
  return {
    date: dateKey(record?.maintenanceDate),
    description: record?.description ?? '',
    mileage: record ? String(record.mileage ?? '') : '',
    cost: record?.costEuro === undefined || record?.costEuro === null ? '' : String(record.costEuro).replace('.', ','),
    garageName: record?.garageName ?? '',
    notes: record?.notes ?? '',
  };
}

// Controleert de formulierwaarden (ontwerp paragraaf 5.2).
// Geeft een object met foutmeldingen per veld en, als alles klopt, de gegevens voor NOVI.
export function validateMaintenance(values, today = todayKey()) {
  const errors = {};
  const description = values.description.trim();
  const garageName = values.garageName.trim();
  const notes = values.notes.trim();
  const costText = values.cost.trim().replace(',', '.');
  const todayText = `${today.slice(0, 4)}-${today.slice(4, 6)}-${today.slice(6, 8)}`;

  if (!dateKey(values.date) || formatMaintenanceDate(values.date) === 'Niet beschikbaar') {
    errors.date = 'Vul een geldige datum in.';
  } else if (values.date > todayText) {
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

  const data = { maintenanceDate: values.date, description, mileage: Number(values.mileage.trim()) };
  if (costText) data.costEuro = Number(costText);
  if (garageName) data.garageName = garageName;
  if (notes) data.notes = notes;
  return { errors, data };
}

// Waarschuwing (geen blokkade, F30) als een andere beurt een afwijkende kilometerstand heeft:
// een eerdere beurt met meer km, of een latere beurt met minder km.
export function mileageWarning(records, data, currentId) {
  const date = dateKey(data.maintenanceDate);
  const conflict = records.some(record => {
    if (record.id === currentId) return false;
    const other = dateKey(record.maintenanceDate);
    return (other <= date && record.mileage > data.mileage) || (other > date && record.mileage < data.mileage);
  });
  return conflict ? 'Let op: deze kilometerstand is lager dan bij een eerdere beurt (of hoger dan bij een latere). Controleer de invoer. Je kunt wel opslaan.' : '';
}
