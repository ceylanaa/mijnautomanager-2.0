import { act, render, renderHook, screen } from '@testing-library/react';
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
  it('stuurt een directe privélink naar inloggen zonder verzoek', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); open('/voertuigen');
    expect(screen.getByRole('heading', { name: 'Fijn dat je er bent.' })).toBeInTheDocument(); expect(fetch).not.toHaveBeenCalled();
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
    const responses = [{ token: 'mock-token', user: { email: 'a@example.com' } }, [{ id: 7, email: 'a@example.com' }]];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => ({ ok: true, status: 200, json: async () => responses.shift() })));
    const user = open(); await user.type(screen.getByLabelText('E-mailadres'), 'a@example.com'); await user.type(screen.getByLabelText('Wachtwoord'), 'fictief-testinvoer'); await user.click(screen.getByRole('button', { name: /Inloggen/ }));
    expect(await screen.findByRole('heading', { name: "Mijn auto's" })).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem('mam-session')).user.id).toBe(7);
  });
});
