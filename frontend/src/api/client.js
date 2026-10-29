import { demoVehicle, normalizePlate, ownVehicles, referenceId, uniqueUser, validPlate } from './data';

export class ApiError extends Error {
  constructor(message, status) { super(message); this.name = 'ApiError'; this.status = status; }
}
async function jsonRequest(url, options = {}) {
  const timeout = AbortSignal.timeout(15000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let response;
  try { response = await fetch(url, { ...options, signal }); }
  catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError('De verbinding is niet beschikbaar of duurt te lang. Probeer het opnieuw.');
  }
  if (!response.ok) {
    const messages = { 401: 'Je sessie is verlopen of je inloggegevens kloppen niet.', 403: 'NOVI geeft geen toegang tot deze handeling.', 400: 'NOVI accepteert deze invoer niet. Controleer je gegevens.', 409: 'Deze gegevens bestaan al.' };
    throw new ApiError(messages[response.status] ?? 'De gegevens konden niet worden verwerkt. Probeer het opnieuw.', response.status);
  }
  if (response.status === 204) return null;
  try { return await response.json(); } catch { throw new ApiError('De server gaf een onverwacht antwoord.'); }
}
function rows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  throw new ApiError('De server gaf een onbekend lijstformaat. Er wordt geen ongefilterde lijst getoond.');
}
export function createNoviApi({ baseUrl, projectId }) {
  const base = baseUrl.replace(/\/$/, '');
  function request(path, { token, body, ...options } = {}) {
    if (!base || !projectId) {
      return Promise.reject(new ApiError('De NOVI-configuratie ontbreekt. Maak een .env-bestand aan volgens de README en start de app opnieuw.'));
    }
    return jsonRequest(`${base}/api${path}`, {
      ...options, headers: { 'novi-education-project-id': projectId, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
  async function vehicles(session, signal) {
    const all = [], seen = new Set();
    // Bounded paging: never return an incomplete list as if it were complete.
    for (let offset = 0; offset < 10000; offset += 100) {
      const page = rows(await request(`/vehicles?limit=100&offset=${offset}&sort=id`, { token: session.token, signal }));
      for (const row of page) {
        const id = referenceId(row.id);
        if (id === null || seen.has(id)) throw new ApiError('De voertuiglijst kon niet volledig worden opgehaald. Controleer de paginering.');
        seen.add(id); all.push(row);
      }
      if (page.length < 100) return ownVehicles(all, session.user.id);
    }
    throw new ApiError('De voertuiglijst is te groot om volledig te verwerken.');
  }
  return {
    async register(email, password) {
      return request('/users', { method: 'POST', body: { email: email.trim(), password, roles: ['user'] } });
    },
    async login(email, password) {
      let result;
      try {
        result = await request('/login', { method: 'POST', body: { email: email.trim(), password } });
      } catch (error) {
        throw new ApiError(`Inloggen bij NOVI is niet gelukt. ${error.message}`, error.status);
      }
      if (!result?.token || typeof result.user?.email !== 'string') throw new ApiError('Het loginantwoord bevat niet alle vereiste gegevens.');
      // Swagger describes GET /users as a complete array. No unverified user-id/JWT fallback.
      let users;
      try { users = rows(await request('/users', { token: result.token })); }
      catch (error) {
        throw new ApiError(`NOVI heeft je login bevestigd, maar de gebruikerslijst kon niet worden opgehaald. ${error.message}`, error.status);
      }
      const user = uniqueUser(users, result.user.email);
      return { mode: 'novi', token: result.token, user };
    },
    vehicles,
    async addVehicle(session, plate, nickname) {
      const licensePlate = normalizePlate(plate);
      if (!demoVehicle(licensePlate)) throw new ApiError('Alleen fictieve demovoertuigen kunnen worden opgeslagen.');
      if (nickname.trim().length > 100) throw new ApiError('De bijnaam mag maximaal 100 tekens bevatten.');
      const current = await vehicles(session);
      if (current.some(v => normalizePlate(v.licensePlate) === licensePlate)) throw new ApiError('Dit voertuig staat al in je overzicht.');
      try {
        await request('/vehicles', { token: session.token, method: 'POST', body: { userId: session.user.id, licensePlate, nickname: nickname.trim() } });
      } catch (error) {
        if (error.status) throw error;
        throw new ApiError('De opslaguitkomst is onzeker. Open eerst Mijn auto\'s om te controleren of het voertuig al is toegevoegd, voordat je opnieuw opslaat.');
      }
    },
  };
}
export async function searchRdw(plate, signal) {
  const key = normalizePlate(plate);
  if (!validPlate(key)) throw new ApiError('Vul een kenteken met alleen letters en cijfers in.');
  const params = new URLSearchParams({ kenteken: key, $limit: '2' });
  const result = await jsonRequest(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?${params}`, { signal });
  if (!Array.isArray(result)) throw new ApiError('De RDW gaf een onbekend antwoord.');
  if (!result.length) return null;
  if (result.length !== 1 || result[0].kenteken !== key) throw new ApiError('De RDW-resultaten konden niet eenduidig worden gekoppeld.');
  const record = result[0];
  const fuelRows = await jsonRequest(`https://opendata.rdw.nl/resource/8ys7-d773.json?${new URLSearchParams({ kenteken: key, $limit: '20' })}`, { signal });
  if (!Array.isArray(fuelRows) || fuelRows.some(row => row.kenteken !== key)) throw new ApiError('De brandstofgegevens konden niet worden gekoppeld. Probeer het opnieuw.');
  return { licensePlate: key, brand: record.merk || 'Niet beschikbaar', model: record.handelsbenaming || 'Niet beschikbaar', year: record.datum_eerste_toelating?.slice(0, 4) || 'Niet beschikbaar', fuel: [...new Set(fuelRows.map(row => row.brandstof_omschrijving).filter(Boolean))].join(' / ') || 'Niet beschikbaar', apk: record.vervaldatum_apk, source: 'rdw' };
}
// De NOVI-instellingen komen uit .env (zie .env.example en README), niet uit de broncode.
export const novi = createNoviApi({
  baseUrl: import.meta.env.VITE_NOVI_URL || '',
  projectId: import.meta.env.VITE_NOVI_PROJECT_ID || '',
});
