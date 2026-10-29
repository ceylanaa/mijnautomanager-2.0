import { describe, it, expect, vi } from 'vitest';
import { createNoviApi } from '../api/client';
import { uniqueUser } from '../api/data';
const api = createNoviApi({ baseUrl: 'https://novi.test', projectId: 'test-project' });
const ok = body => ({ ok: true, status: 200, json: async () => body });
function mockFetch(...responses) { const fn = vi.fn(); responses.forEach(r => fn.mockResolvedValueOnce(r)); vi.stubGlobal('fetch', fn); return fn; }
describe('gebruikersfilters en contracten', () => {
  it('onderscheidt een netwerkfout bij login van een mislukte gebruikerslookup', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('blocked'));
    vi.stubGlobal('fetch', fetch);
    await expect(api.login('a@example.com', 'fictief-testinvoer')).rejects.toThrow('Inloggen bij NOVI is niet gelukt');
    fetch.mockResolvedValueOnce(ok({ token: 'mock-token', user: { email: 'a@example.com' } })).mockRejectedValueOnce(new TypeError('blocked'));
    await expect(api.login('a@example.com', 'fictief-testinvoer')).rejects.toThrow('login bevestigd, maar de gebruikerslijst');
  });
  it('weigert nul en meerdere emailmatches zonder fallback', () => {
    expect(() => uniqueUser([], 'a@example.com')).toThrow();
    expect(() => uniqueUser([{ id: 1, email: 'a@example.com' }, { id: 2, email: 'A@example.com' }], 'a@example.com')).toThrow();
  });
  it('koppelt de login-email aan precies één gebruikersnummer', async () => {
    const fetch = mockFetch(ok({ token: 'mock-token', user: { email: 'a@example.com' } }), ok([{ id: 7, email: 'a@example.com' }]));
    expect((await api.login('a@example.com', 'fictief-testinvoer')).user.id).toBe(7);
    expect(fetch.mock.calls[1][0]).toBe('https://novi.test/api/users');
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer mock-token');
  });
  it('opent geen sessie bij ontbrekende gebruikerskoppeling', async () => {
    mockFetch(ok({ token: 'mock-token', user: { email: 'a@example.com' } }), ok([]));
    await expect(api.login('a@example.com', 'fictief-testinvoer')).rejects.toThrow('eenduidig');
  });
  it('registreert uitsluitend de gewone user-rol', async () => {
    const fetch = mockFetch(ok({ id: 4 })); await api.register('new@example.com', 'fictief-testinvoer');
    expect(JSON.parse(fetch.mock.calls[0][1].body).roles).toEqual(['user']);
  });
});
