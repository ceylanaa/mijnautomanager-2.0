import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../auth/AuthContext';
import { formatAddress, searchCompanies } from '../api/garages';

function json(data) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
}
const company = (nr, name) => ({ volgnummer: String(nr), naam_bedrijf: name, straat: 'DORPSSTRAAT', huisnummer: String(nr), postcode_numeriek: '1234', postcode_alfanumeriek: 'AB', plaats: 'TESTDORP' });

// Fictieve RDW-antwoorden: 50 bedrijven, waarvan alleen de even nummers de erkenning hebben.
function fakeRdw(url) {
  if (url.includes('5k74-3jha')) return json(Array.from({ length: 50 }, (_, i) => company(i + 1, `Garage ${String(100 - i)}`)));
  if (url.includes('volgnummer=')) return json([{ volgnummer: '2', erkenning: 'APK Lichte voertuigen' }, { volgnummer: '2', erkenning: 'Tachografen' }]);
  return json(Array.from({ length: 50 }, (_, i) => i + 1).filter(n => n % 2 === 0).map(n => ({ volgnummer: String(n), erkenning: 'APK Lichte voertuigen' })));
}

describe('garages: API', () => {
  it('controleert de erkenning, ontdubbelt en sorteert op naam', async () => {
    vi.stubGlobal('fetch', vi.fn(url => (url.includes('5k74') ? json([company(3, 'bram'), company(1, 'Anton'), company(3, 'bram'), company(2, 'Zuid')]) : json([{ volgnummer: '3' }, { volgnummer: '1' }]))));
    const result = await searchCompanies('  testdorp ', 'APK Lichte voertuigen');
    expect(result.map(c => c.naam_bedrijf)).toEqual(['Anton', 'bram']);
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('$where')).toBe("upper(plaats) = 'TESTDORP'");
  });
  it('toont nooit undefined of null in een adres', () => {
    expect(formatAddress({ straat: 'KERKSTRAAT', plaats: 'GROU' })).toBe('KERKSTRAAT, GROU');
    expect(formatAddress({})).toBe('Adres niet beschikbaar');
  });
});

describe('S07 scherm', () => {
  it('zoekt, laadt meer en klapt erkenningen uit', async () => {
    vi.stubGlobal('fetch', vi.fn(fakeRdw));
    sessionStorage.setItem('mam-session', JSON.stringify({ mode: 'demo', user: { id: 1 } }));
    render(<MemoryRouter initialEntries={['/garages?erkenning=APK%20Lichte%20voertuigen']}><AuthProvider><App /></AuthProvider></MemoryRouter>);
    const user = userEvent.setup();
    expect(screen.getByLabelText('Erkenning')).toHaveValue('APK Lichte voertuigen');
    await user.click(screen.getByRole('button', { name: 'Zoek bedrijven' }));
    expect(screen.getByLabelText('Plaats')).toHaveFocus();
    await user.type(screen.getByLabelText('Plaats'), 'Testdorp');
    await user.click(screen.getByRole('button', { name: 'Zoek bedrijven' }));
    expect(await screen.findByText('25 bedrijven in Testdorp met APK Lichte voertuigen')).toBeInTheDocument();
    expect(screen.getByText('20 van 25 getoond.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Meer laden' }));
    expect(screen.getByText('25 van 25 getoond.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Meer laden' })).not.toBeInTheDocument();
    const names = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(new Set(names).size).toBe(25);
    expect(names[0]).toBe('Garage 51');
    const buttons = screen.getAllByRole('button', { name: 'Bekijk erkenningen' });
    await user.click(buttons[buttons.length - 1]);
    expect(await screen.findAllByText('Tachografen')).toHaveLength(2);
  });
  it('heeft een Garages-link in de navigatie', () => {
    sessionStorage.setItem('mam-session', JSON.stringify({ mode: 'demo', user: { id: 1 } }));
    render(<MemoryRouter initialEntries={['/garages']}><AuthProvider><App /></AuthProvider></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Garages' })).toHaveAttribute('href', '/garages');
  });
});
