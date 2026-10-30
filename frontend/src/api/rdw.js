import { ApiError, jsonRequest } from './client';
import { demoVehicle, normalizePlate, validPlate } from './data';
import { addDays, todayKey } from '../helpers/apkStatus';

const RDW = 'https://opendata.rdw.nl/resource';
const PAGE = 1000;

// Eén RDW-verzoek; de RDW geeft altijd een lijst terug.
async function rdw(dataset, params, signal) {
  const result = await jsonRequest(`${RDW}/${dataset}.json?${new URLSearchParams(params)}`, { signal });
  if (!Array.isArray(result)) throw new ApiError('De RDW gaf een onbekend antwoord.');
  return result;
}

// Tekst veilig in een SoQL-query zetten: enkele aanhalingstekens verdubbelen.
function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function checkPlate(plate) {
  const key = normalizePlate(plate);
  if (!validPlate(key)) throw new ApiError('Dit kenteken is niet geldig.');
  return key;
}

// RDW-datum "2027-01-15T00:00:00.000" of "20270115" -> "20270115".
function rdwDateKey(value) {
  const text = String(value ?? '').replaceAll('-', '').slice(0, 8);
  return /^\d{8}$/.test(text) ? text : null;
}

// Fictieve gegevens voor de demovoertuigen; die kentekens bestaan niet bij de RDW.
function demoDefects(plate) {
  if (plate !== 'TESTA1') return [];
  return [
    { date: addDays(todayKey(), -300), code: 'AC1', description: 'Band(en) aanwezig met een profieldiepte van 1,6 t/m 2,5 mm', count: 2 },
    { date: addDays(todayKey(), -300), code: '289', description: 'Schijf-, trommelrem loopt niet vrij', count: 1 },
    { date: addDays(todayKey(), -665), code: 'AC1', description: 'Band(en) aanwezig met een profieldiepte van 1,6 t/m 2,5 mm', count: 1 },
  ];
}

// APK-vervaldatum uit het RDW-voertuigregister (m9d7-ebf2).
export async function fetchApkDate(plate, signal) {
  const key = checkPlate(plate);
  const demo = demoVehicle(key);
  if (demo) return { found: true, expiry: demo.apk, demo: true };
  const result = await rdw('m9d7-ebf2', { kenteken: key, $select: 'kenteken,vervaldatum_apk,vervaldatum_apk_dt', $limit: '2' }, signal);
  if (result.length === 0) return { found: false, expiry: null, demo: false };
  if (result.length !== 1 || result[0].kenteken !== key) throw new ApiError('De APK-gegevens konden niet eenduidig aan dit kenteken worden gekoppeld.');
  return { found: true, expiry: rdwDateKey(result[0].vervaldatum_apk_dt ?? result[0].vervaldatum_apk), demo: false };
}

// Kiest de omschrijving die geldig was op de melddatum (codes kunnen meerdere versies hebben).
export function describe(codebook, code, date) {
  const versions = codebook.filter(row => row.gebrek_identificatie === code);
  const valid = versions.filter(row => {
    const from = rdwDateKey(row.ingangsdatum_gebrek);
    const until = rdwDateKey(row.einddatum_gebrek);
    return (!from || from <= date) && (!until || until >= date);
  });
  return (valid[0] ?? versions[0])?.gebrek_omschrijving ?? '';
}

// Alle gebrekregistraties van één kenteken (a34c-vvps), pagina voor pagina,
// aangevuld met omschrijvingen uit de codetabel (hx2c-gt7k).
export async function fetchDefects(plate, signal) {
  const key = checkPlate(plate);
  if (demoVehicle(key)) return { rows: demoDefects(key), codebookError: '' };

  const all = [];
  for (let offset = 0; offset < 50000; offset += PAGE) {
    const page = await rdw('a34c-vvps', {
      kenteken: key,
      $select: 'kenteken,gebrek_identificatie,meld_datum_door_keuringsinstantie,meld_tijd_door_keuringsinstantie,aantal_gebreken_geconstateerd',
      $order: 'meld_datum_door_keuringsinstantie DESC, meld_tijd_door_keuringsinstantie DESC, gebrek_identificatie',
      $limit: String(PAGE),
      $offset: String(offset),
    }, signal);
    if (page.some(row => row.kenteken !== key)) throw new ApiError('De RDW gaf registraties van een ander kenteken terug.');
    all.push(...page);
    if (page.length < PAGE) break;
  }

  const rows = all.map(row => ({
    date: rdwDateKey(row.meld_datum_door_keuringsinstantie),
    time: Number(row.meld_tijd_door_keuringsinstantie) || 0,
    code: row.gebrek_identificatie || 'Onbekend',
    description: '',
    count: Number(row.aantal_gebreken_geconstateerd) || 1,
  }));

  // De codetabel is een apart verzoek. Mislukt dat, dan tonen we de codes en een aparte melding.
  const codes = [...new Set(rows.map(row => row.code))];
  let codebookError = '';
  try {
    const codebook = [];
    for (let i = 0; i < codes.length; i += 50) {
      const part = codes.slice(i, i + 50);
      codebook.push(...await rdw('hx2c-gt7k', {
        $select: 'gebrek_identificatie,gebrek_omschrijving,ingangsdatum_gebrek,einddatum_gebrek',
        $where: `gebrek_identificatie in(${part.map(quote).join(',')})`,
        $limit: '1000',
      }, signal));
    }
    rows.forEach(row => { row.description = describe(codebook, row.code, row.date ?? '00000000'); });
  } catch (error) {
    if (signal?.aborted) throw error;
    codebookError = 'De omschrijvingen van de gebrekcodes konden niet worden opgehaald. De codes zelf staan er wel.';
  }

  rows.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.time - a.time);
  return { rows, codebookError };
}

// Telt per code het aantal geconstateerde gebreken; alleen zinvol na volledige paginering.
export function topDefects(rows, max = 5) {
  const totals = new Map();
  for (const row of rows) {
    const current = totals.get(row.code) ?? { code: row.code, description: row.description, count: 0 };
    current.count += row.count;
    totals.set(row.code, current);
  }
  return [...totals.values()].sort((a, b) => b.count - a.count || a.code.localeCompare(b.code)).slice(0, max);
}
