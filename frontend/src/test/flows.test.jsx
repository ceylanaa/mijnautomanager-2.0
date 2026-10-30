import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { novi } from '../api/client';
function open(path = '/inloggen') { render(<MemoryRouter initialEntries={[path]}><AuthProvider><App/></AuthProvider></MemoryRouter>); return userEvent.setup(); }
describe('eerste bouwstap', () => {
  it('negeert een oud loginantwoord na wisselen naar de demo en uitloggen', async () => {
    let finishLogin;
    const pending = new Promise(resolve => { finishLogin = resolve; });
    const loginMock = vi.spyOn(novi, 'login').mockReturnValueOnce(pending);
    try {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      let attempt;
      act(() => { attempt = result.current.login('a@example.com', 'fictief-testinvoer'); });
      act(() => result.current.startDemo());
      act(() => result.current.logout());
      await act(async () => {
        finishLogin({ mode: 'novi', token: 'mock-token', user: { id: 7 } });
        await attempt;
      });
      expect(result.current.session).toBeNull();
      expect(sessionStorage.getItem('mam-session')).toBeNull();
      expect(await attempt).toBe(false);
    } finally { loginMock.mockRestore(); }
  });
  it('toont een 404-pagina bij een onbekend adres', () => {
    open('/bestaat-niet');
    expect(screen.getByRole('heading', { name: 'Deze pagina bestaat niet.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Naar Inloggen' })).toBeInTheDocument();
  });
  it('stuurt een directe privélink naar inloggen zonder verzoek', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); open('/voertuigen/2');
    expect(screen.getByRole('heading', { name: 'Fijn dat je er bent.' })).toBeInTheDocument(); expect(fetch).not.toHaveBeenCalled();
  });
  it('kan lokaal bekijken, toevoegen, details openen en uitloggen zonder netwerk', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); const user = open();
    await user.click(screen.getByRole('button', { name: 'Bekijk de lokale demo' }));
    expect(await screen.findByRole('heading', { name: 'Mijn dagelijkse auto' })).toBeInTheDocument();
    expect(screen.queryByText('Niet van deze gebruiker')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Auto toevoegen/ }));
    await user.click(screen.getByRole('button', { name: 'TESTA2' }));
    await user.click(screen.getByRole('button', { name: /Zoeken/ }));
    await user.type(screen.getByLabelText('Bijnaam (optioneel)'), 'Mijn weekendauto');
    await user.click(screen.getByRole('button', { name: 'Auto toevoegen' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Mijn weekendauto' })).toBeInTheDocument();
    expect(screen.getByText('Het voertuig is toegevoegd aan je overzicht.')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: "← Mijn auto's" }));
    expect(await screen.findByRole('heading', { name: 'Mijn weekendauto' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Uitloggen' }));
    expect(await screen.findByRole('heading', { name: 'Fijn dat je er bent.' })).toBeInTheDocument();
    expect(sessionStorage.getItem('mam-session')).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });
  it('toont andermans voertuig niet via een directe detailroute', async () => {
    sessionStorage.setItem('mam-session', JSON.stringify({ mode: 'demo', user: { id: 1 } })); open('/voertuigen/2');
    expect(await screen.findByRole('heading', { name: 'Voertuig niet gevonden' })).toBeInTheDocument();
  });
  it('wist een oud zoekresultaat zodra het kenteken wordt gewijzigd', async () => {
    sessionStorage.setItem('mam-session', JSON.stringify({ mode: 'demo', user: { id: 1 } })); const user = open('/kenteken');
    await user.type(screen.getByLabelText('Kenteken'), 'TESTA2'); await user.click(screen.getByRole('button', { name: /Zoeken/ }));
    expect(screen.getByRole('button', { name: 'Auto toevoegen' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Kenteken'), 'X');
    expect(screen.queryByRole('button', { name: 'Auto toevoegen' })).not.toBeInTheDocument();
  });
  it('weigert verschillende registratie-wachtwoorden zonder account aan te maken', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); const user = open('/registreren');
    await user.type(screen.getByLabelText('E-mailadres'), 'new@example.com');
    await user.type(screen.getByLabelText('Wachtwoord', { exact: true }), 'fictief-testinvoer');
    await user.type(screen.getByLabelText('Herhaal wachtwoord'), 'andere-testinvoer');
    await user.click(screen.getByRole('button', { name: /Account aanmaken/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('niet gelijk'); expect(fetch).not.toHaveBeenCalled();
  });
  it('opent het overzicht pas na login en unieke gebruikerskoppeling', async () => {
    const responses = [{ token: 'mock-token', user: { email: 'a@example.com' } }, [{ id: 7, email: 'a@example.com' }], [{ id: 4, userId: 7, licensePlate: 'TESTA1', nickname: 'Mijn NOVI-testauto' }, { id: 5, userId: 8, licensePlate: 'TESTB1' }]];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => ({ ok: true, status: 200, json: async () => responses.shift() })));
    const user = open(); await user.type(screen.getByLabelText('E-mailadres'), 'a@example.com'); await user.type(screen.getByLabelText('Wachtwoord'), 'fictief-testinvoer'); await user.click(screen.getByRole('button', { name: /Inloggen/ }));
    expect(await screen.findByRole('heading', { name: 'Mijn NOVI-testauto' })).toBeInTheDocument();
    expect(screen.queryByText('TESTB1')).not.toBeInTheDocument();
  });
  it('beëindigt de sessie na een 401 tijdens voertuigen ophalen', async () => {
    sessionStorage.setItem('mam-session', JSON.stringify({ mode: 'novi', token: 'mock-token', user: { id: 7 } }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 })); open('/voertuigen');
    expect(await screen.findByRole('heading', { name: 'Fijn dat je er bent.' })).toBeInTheDocument();
    await waitFor(() => expect(sessionStorage.getItem('mam-session')).toBeNull());
  });
});
