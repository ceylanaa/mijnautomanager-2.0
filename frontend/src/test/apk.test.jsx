import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../auth/AuthContext';
import { describe as describeCode, fetchApkDate, fetchDefects, topDefects } from '../api/rdw';

function json(data) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
}
function defect(i, code = 'AC1') {
  return { kenteken: 'AB12CD', gebrek_identificatie: code, meld_datum_door_keuringsinstantie: `2025${String((i % 12) + 1).padStart(2, '0')}01`, meld_tijd_door_keuringsinstantie: '900', aantal_gebreken_geconstateerd: '1' };
}

describe('RDW: APK en gebreken', () => {
  it('leest de APK-datum uit vervaldatum_apk_dt', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json([{ kenteken: 'AB12CD', vervaldatum_apk_dt: '2027-01-15T00:00:00.000' }])));
    expect(await fetchApkDate('ab-12-cd')).toEqual({ found: true, expiry: '20270115', demo: false });
    expect(fetch.mock.calls[0][0]).toContain('m9d7-ebf2');
  });
  it('haalt alle pagina\'s op en koppelt omschrijvingen', async () => {
    const first = Array.from({ length: 1000 }, (_, i) => defect(i));
    const fetchMock = vi.fn()
      .mockReturnValueOnce(json(first))
      .mockReturnValueOnce(json([defect(1, '289')]))
      .mockReturnValueOnce(json([{ gebrek_identificatie: 'AC1', gebrek_omschrijving: 'Banden' }, { gebrek_identificatie: '289', gebrek_omschrijving: 'Rem' }]));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchDefects('AB12CD');
    expect(result.rows).toHaveLength(1001);
    expect(fetchMock.mock.calls[1][0]).toContain('%24offset=1000');
    expect(fetchMock.mock.calls[2][0]).toContain('hx2c-gt7k');
    expect(result.rows.find(row => row.code === '289').description).toBe('Rem');
    expect(topDefects(result.rows)[0]).toMatchObject({ code: 'AC1', count: 1000 });
  });
  it('houdt de codes als de codetabel faalt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(json([defect(1)])).mockReturnValueOnce(Promise.resolve({ ok: false, status: 500 })));
    const result = await fetchDefects('AB12CD');
    expect(result.rows[0]).toMatchObject({ code: 'AC1', description: '' });
    expect(result.codebookError).toMatch(/codes zelf staan er wel/);
  });
  it('weigert registraties van een ander kenteken', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json([{ ...defect(1), kenteken: 'ZZ99ZZ' }])));
    await expect(fetchDefects('AB12CD')).rejects.toThrow(/ander kenteken/);
  });
  it('kiest de omschrijving die geldig was op de melddatum', () => {
    const book = [
      { gebrek_identificatie: 'X', gebrek_omschrijving: 'Oud', ingangsdatum_gebrek: '20100101', einddatum_gebrek: '20191231' },
      { gebrek_identificatie: 'X', gebrek_omschrijving: 'Nieuw', ingangsdatum_gebrek: '20200101' },
    ];
    expect(describeCode(book, 'X', '20150101')).toBe('Oud');
    expect(describeCode(book, 'X', '20250101')).toBe('Nieuw');
  });
});

describe('S06 scherm', () => {
  it('toont fictieve APK-status, gebreken en telling voor een demovoertuig', async () => {
    vi.stubGlobal('fetch', vi.fn());
    sessionStorage.setItem('mam-session', JSON.stringify({ mode: 'demo', user: { id: 1 } }));
    render(<MemoryRouter initialEntries={['/voertuigen/1/apk']}><AuthProvider><App /></AuthProvider></MemoryRouter>);
    expect(await screen.findByText('Verloopt binnenkort')).toBeInTheDocument();
    expect(screen.getByText(/Telling over alle 3 opgehaalde registraties van TESTA1/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zoek een APK-keuringsbedrijf' })).toHaveAttribute('href', '/garages?erkenning=APK%20Lichte%20voertuigen');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('toont alleen bij het mislukte blok een fout', async () => {
    vi.stubGlobal('fetch', vi.fn(url => (url.includes('m9d7') ? json([{ kenteken: 'AB12CD', vervaldatum_apk_dt: '2020-01-01T00:00:00.000' }]) : Promise.resolve({ ok: false, status: 500 }))));
    sessionStorage.setItem('mam-session', JSON.stringify({ mode: 'demo', user: { id: 1 } }));
    render(<MemoryRouter initialEntries={['/apk/AB12CD']}><AuthProvider><App /></AuthProvider></MemoryRouter>);
    expect(await screen.findByText('Vervaldatum verstreken')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Opnieuw proberen');
  });
});
