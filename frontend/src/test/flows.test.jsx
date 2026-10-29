import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../auth/AuthContext';
function open(path = '/inloggen') { render(<MemoryRouter initialEntries={[path]}><AuthProvider><App/></AuthProvider></MemoryRouter>); return userEvent.setup(); }
describe('eerste bouwstap', () => {
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
