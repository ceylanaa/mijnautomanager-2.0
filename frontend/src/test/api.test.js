import { describe, it, expect, vi } from 'vitest';
import { createNoviApi, searchRdw } from '../api/client';
import { ownVehicles, uniqueUser } from '../api/data';
import { formatRdwDate } from '../helpers/format';
const api = createNoviApi({ baseUrl: 'https://novi.test', projectId: 'test-project' });
const ok = body => ({ ok: true, status: 200, json: async () => body });
function mockFetch(...responses) { const fn = vi.fn(); responses.forEach(r => fn.mockResolvedValueOnce(r)); vi.stubGlobal('fetch', fn); return fn; }
const session = { token: 'mock-token', user: { id: 7 }, mode: 'novi' };
describe('gebruikersfilters en contracten', () => {
  it('onderscheidt een netwerkfout bij login van een mislukte gebruikerslookup', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('blocked'));
    vi.stubGlobal('fetch', fetch);
    await expect(api.login('a@example.com', 'fictief-testinvoer')).rejects.toThrow('Inloggen bij NOVI is niet gelukt');
    fetch.mockResolvedValueOnce(ok({ token: 'mock-token', user: { email: 'a@example.com' } })).mockRejectedValueOnce(new TypeError('blocked'));
    await expect(api.login('a@example.com', 'fictief-testinvoer')).rejects.toThrow('login bevestigd, maar de gebruikerslijst');
  });
  it('verbergt andere gebruikers en ongeldige referenties, ook met string/object ids', () => {
    expect(ownVehicles([{ id: 1, userId: 7 }, { id: 2, userId: 8 }, { id: 3, userId: '7' }, { id: 4, userId: { id: 7 } }, { id: 5, userId: null }], 7).map(v => v.id)).toEqual([1, 3, 4]);
    expect(() => ownVehicles([], null)).toThrow();
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
  it('haalt alle voertuigpagina’s op vóór filtering', async () => {
    const first = Array.from({ length: 100 }, (_, id) => ({ id, userId: 8 }));
    const fetch = mockFetch(ok(first), ok([{ id: 100, userId: 7, licensePlate: 'TESTA1' }]));
    expect(await api.vehicles(session)).toEqual([{ id: 100, userId: 7, licensePlate: 'TESTA1' }]);
    expect(fetch.mock.calls[1][0]).toContain('offset=100');
  });
  it('stopt bij een server die pagina’s herhaalt', async () => {
    const first = Array.from({ length: 100 }, (_, id) => ({ id, userId: 7 }));
    mockFetch(ok(first), ok(first));
    await expect(api.vehicles(session)).rejects.toThrow('paginering');
  });
  it('doet geen POST bij een duplicaat of echt kenteken', async () => {
    const fetch = mockFetch(ok([{ id: 1, userId: 7, licensePlate: 'TEST-A1' }]));
    await expect(api.addVehicle(session, 'test a1', '')).rejects.toThrow('al in');
    await expect(api.addVehicle(session, 'AB123C', '')).rejects.toThrow('fictieve');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('stuurt alleen de gebruikerskoppeling en fictieve voertuigvelden naar NOVI', async () => {
    const fetch = mockFetch(ok([]), ok({ id: 9 }));
    await api.addVehicle(session, 'TEST-A2', ' Weekendauto ');
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ userId: 7, licensePlate: 'TESTA2', nickname: 'Weekendauto' });
    expect(fetch.mock.calls[1][1].method).toBe('POST');
  });
  it('meldt onzekere opslag zonder automatisch opnieuw te posten', async () => {
    const fetch = mockFetch(ok([])); fetch.mockRejectedValueOnce(new TypeError('offline'));
    await expect(api.addVehicle(session, 'TESTA2', '')).rejects.toThrow('onzeker');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('registreert uitsluitend de gewone user-rol', async () => {
    const fetch = mockFetch(ok({ id: 4 })); await api.register('new@example.com', 'fictief-testinvoer');
    expect(JSON.parse(fetch.mock.calls[0][1].body).roles).toEqual(['user']);
  });
});
describe('RDW alleen-lezen', () => {
  it('normaliseert kenteken en koppelt brandstof zonder NOVI-verzoek', async () => {
    const fetch = mockFetch(ok([{ kenteken: 'AB123C', merk: 'Merk', handelsbenaming: 'Model', datum_eerste_toelating: '20200101' }]), ok([{ kenteken: 'AB123C', brandstof_omschrijving: 'Benzine' }]));
    const result = await searchRdw('ab-123-c');
    expect(result).toMatchObject({ licensePlate: 'AB123C', brand: 'Merk', fuel: 'Benzine', source: 'rdw' });
    expect(fetch.mock.calls.every(([url]) => url.startsWith('https://opendata.rdw.nl/'))).toBe(true);
  });
  it('onderscheidt geen resultaat van bronfout', async () => {
    mockFetch(ok([]), { ok: false, status: 500 });
    expect(await searchRdw('AB123C')).toBeNull();
    await expect(searchRdw('AB123C')).rejects.toThrow();
  });
  it('weigert een resultaat van een ander kenteken', async () => {
    mockFetch(ok([{ kenteken: 'ANDERS' }])); await expect(searchRdw('AB123C')).rejects.toThrow('gekoppeld');
  });
  it('maakt een ongeldige datum niet vanzelf geldig', () => { expect(formatRdwDate('20260231')).toBe('Niet beschikbaar'); expect(formatRdwDate(null)).toBe('Niet beschikbaar'); });
});
