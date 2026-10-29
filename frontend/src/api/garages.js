import { ApiError, jsonRequest } from './client';

const RDW = 'https://opendata.rdw.nl/resource';

// Erkenningen die bij autobedrijven passen. De teksten zijn exact gecontroleerd in RDW nmwb-dqkz (F43).
export const RECOGNITIONS = [
  'APK Lichte voertuigen',
  'APK Zware voertuigen',
  'APK Landbouw',
  'Gasinstallaties',
  'Tachografen',
  'Boordcomputer Taxi',
  'Demontage',
];

async function rdw(dataset, params, signal) {
  const result = await jsonRequest(`${RDW}/${dataset}.json?${new URLSearchParams(params)}`, { signal });
  if (!Array.isArray(result)) throw new ApiError('De RDW gaf een onbekend antwoord.');
  return result;
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

// Adres zonder "undefined" of "null": ontbrekende delen worden weggelaten (F45).
export function formatAddress(company) {
  const street = [company.straat, company.huisnummer, company.huisnummer_toevoeging].filter(Boolean).join(' ');
  const postcode = [company.postcode_numeriek, company.postcode_alfanumeriek].filter(Boolean).join(' ');
  const place = [postcode, company.plaats].filter(Boolean).join(' ');
  return [street, place].filter(Boolean).join(', ') || 'Adres niet beschikbaar';
}

// Zoekt bedrijven in een plaats (5k74-3jha) en houdt alleen bedrijven over
// die de gekozen erkenning hebben (nmwb-dqkz). Resultaat is alfabetisch op naam.
export async function searchCompanies(place, recognition, signal) {
  const city = place.trim().toUpperCase();
  if (!city) throw new ApiError('Vul een plaats in.');
  if (!RECOGNITIONS.includes(recognition)) throw new ApiError('Kies een erkenning.');

  const companies = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const page = await rdw('5k74-3jha', {
      $where: `upper(plaats) = ${quote(city)}`,
      $order: 'volgnummer',
      $limit: '1000',
      $offset: String(offset),
    }, signal);
    companies.push(...page);
    if (page.length < 1000) break;
  }

  // Erkenningen per 100 bedrijfsnummers controleren; alleen een bevestigde erkenning telt (F44, F50).
  const numbers = [...new Set(companies.map(company => company.volgnummer).filter(Boolean))];
  const confirmed = new Set();
  for (let i = 0; i < numbers.length; i += 100) {
    const part = numbers.slice(i, i + 100);
    const rows = await rdw('nmwb-dqkz', {
      $where: `erkenning = ${quote(recognition)} AND volgnummer in(${part.map(quote).join(',')})`,
      $limit: '1000',
    }, signal);
    rows.forEach(row => confirmed.add(row.volgnummer));
  }

  // Elk bedrijfsnummer één keer, alfabetisch en bij gelijke naam op nummer (vaste volgorde, F47/F48).
  const unique = new Map();
  companies.filter(company => confirmed.has(company.volgnummer)).forEach(company => unique.set(company.volgnummer, company));
  return [...unique.values()].sort((a, b) =>
    (a.naam_bedrijf ?? '').localeCompare(b.naam_bedrijf ?? '', 'nl', { sensitivity: 'base' }) || Number(a.volgnummer) - Number(b.volgnummer));
}

// Alle erkenningen van één bedrijf, voor de uitklapbare sectie (F46).
export async function fetchRecognitions(number, signal) {
  const rows = await rdw('nmwb-dqkz', { volgnummer: String(number), $limit: '100' }, signal);
  if (rows.some(row => row.volgnummer !== String(number))) throw new ApiError('De erkenningen hoorden niet bij dit bedrijf.');
  return [...new Set(rows.map(row => row.erkenning).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nl'));
}
