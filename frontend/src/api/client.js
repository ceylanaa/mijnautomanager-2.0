import { uniqueUser } from './data';

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
    return jsonRequest(`${base}/api${path}`, {
      ...options, headers: { 'novi-education-project-id': projectId, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
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
  };
}
export const novi = createNoviApi({
  baseUrl: import.meta.env.VITE_NOVI_URL || 'https://novi-backend-api-wgsgz.ondigitalocean.app',
  projectId: import.meta.env.VITE_NOVI_PROJECT_ID || 'd153089f-ba2d-4564-912c-4204900eec14',
});
