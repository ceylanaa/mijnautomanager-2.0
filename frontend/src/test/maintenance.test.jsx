import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../auth/AuthContext';
import { novi } from '../api/client';
import { addMaintenance, deleteVehicleWithMaintenance, updateMaintenance } from '../api/maintenance';
import { formatEuro, mileageWarning, sortMaintenance, validateMaintenance } from '../helpers/maintenance';

function open(path) {
  sessionStorage.setItem('mam-session', JSON.stringify({ mode: 'demo', user: { id: 1 } }));
  render(<MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter>);
  return userEvent.setup();
}
const empty = { date: '2026-10-01', description: 'Kleine beurt', mileage: '1000', cost: '', garageName: '', notes: '' };

describe('onderhoud: regels', () => {
  it('valideert de velden volgens het ontwerp', () => {
    expect(validateMaintenance(empty, '20261029').data).toEqual({ maintenanceDate: '2026-10-01', description: 'Kleine beurt', mileage: 1000 });
    const result = validateMaintenance({ ...empty, date: '2026-10-30', description: '   ', mileage: '12,5', cost: '1,234' }, '20261029');
    expect(Object.keys(result.errors)).toEqual(['date', 'description', 'mileage', 'cost']);
    expect(validateMaintenance({ ...empty, garageName: 'x'.repeat(201), notes: 'x'.repeat(2001) }, '20261029').errors).toHaveProperty('notes');
    expect(validateMaintenance({ ...empty, cost: '0' }, '20261029').data.costEuro).toBe(0);
    expect(validateMaintenance({ ...empty, cost: '189,50' }, '20261029').data.costEuro).toBe(189.5);
  });
  it('maakt onderscheid tussen leeg bedrag en 0 euro', () => {
    expect(formatEuro(undefined)).toBe('Niet ingevuld');
    expect(formatEuro(0)).toMatch(/0,00/);
  });
  it('sorteert nieuw naar oud en daarna op id', () => {
    const sorted = sortMaintenance([
      { id: 1, maintenanceDate: '2026-01-01' }, { id: 3, maintenanceDate: '2025-05-05' }, { id: 2, maintenanceDate: '2026-01-01T00:00:00.000Z' },
    ]);
    expect(sorted.map(r => r.id)).toEqual([2, 1, 3]);
  });
  it('waarschuwt bij een lagere kilometerstand, zonder te blokkeren', () => {
    const records = [{ id: 1, maintenanceDate: '2026-01-01', mileage: 5000 }];
    expect(mileageWarning(records, { maintenanceDate: '2026-02-01', mileage: 4000 })).toMatch(/Let op/);
    expect(mileageWarning(records, { maintenanceDate: '2026-02-01', mileage: 6000 })).toBe('');
    expect(mileageWarning(records, { maintenanceDate: '2026-02-01', mileage: 4000 }, 1)).toBe('');
  });
});

describe('onderhoud: NOVI-verzoeken', () => {
  const session = { mode: 'novi', token: 'test-token', user: { id: 1 } };
  it('stuurt bij bewerken het id mee en houdt het voertuig vast', async () => {
    const request = vi.spyOn(novi, 'request').mockResolvedValue({});
    await updateMaintenance(session, { id: 4, vehicleId: 9 }, { maintenanceDate: '2026-10-01', description: 'x', mileage: 1, vehicleId: 99 });
    expect(request).toHaveBeenCalledWith('/maintenance/4', expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ id: 4, vehicleId: 9 }) }));
    request.mockRestore();
  });
  it('meldt een onzekere uitkomst bij een netwerkfout tijdens opslaan', async () => {
    const request = vi.spyOn(novi, 'request').mockRejectedValue(new Error('netwerk'));
    await expect(addMaintenance(session, 9, {})).rejects.toThrow(/onzeker/);
    request.mockRestore();
  });
  it('stopt bij een fout en verwijdert het voertuig dan niet', async () => {
    const request = vi.spyOn(novi, 'request').mockResolvedValueOnce(null).mockRejectedValueOnce(Object.assign(new Error('Fout.'), { status: 500 }));
    const remove = vi.spyOn(novi, 'deleteVehicle');
    await expect(deleteVehicleWithMaintenance(session, { id: 9 }, [{ id: 1 }, { id: 2 }, { id: 3 }])).rejects.toThrow('1 van de 3');
    expect(remove).not.toHaveBeenCalled();
    request.mockRestore(); remove.mockRestore();
  });
});

describe('onderhoud: schermen (demo)', () => {
  it('toont, voegt toe, bewerkt en verwijdert onderhoud', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user = open('/voertuigen/1');
    expect(await screen.findByText('Kleine beurt met olie en filter')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Onderhoud toevoegen' }));
    await user.click(await screen.findByRole('button', { name: 'Onderhoud opslaan' }));
    expect(screen.getByLabelText('Datum')).toHaveFocus();
    await user.type(screen.getByLabelText('Datum'), '2026-04-01');
    await user.type(screen.getByLabelText('Omschrijving'), 'Nieuwe banden');
    await user.type(screen.getByLabelText('Kilometerstand'), '40000');
    expect(screen.getByText(/Let op/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Onderhoud opslaan' }));
    expect(await screen.findByText('Het onderhoud is opgeslagen.')).toBeInTheDocument();
    const items = await screen.findAllByRole('listitem');
    expect(within(items[0]).getByText('Nieuwe banden')).toBeInTheDocument();

    await user.click(within(items[0]).getByRole('link', { name: /Bewerken/ }));
    const description = await screen.findByLabelText('Omschrijving');
    expect(description).toHaveValue('Nieuwe banden');
    await user.clear(description);
    await user.type(description, 'Winterbanden');
    await user.click(screen.getByRole('button', { name: 'Annuleren' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuleren' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Wijzigingen opslaan' }));
    expect(await screen.findByText('Winterbanden')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Verwijderen: Winterbanden/ }));
    await user.click(screen.getByRole('button', { name: 'Onderhoud verwijderen' }));
    expect(await screen.findByText('Het onderhoud is verwijderd.')).toBeInTheDocument();
    expect(screen.queryByText('Winterbanden')).not.toBeInTheDocument();
  });
  it('verwijdert een voertuig met het aantal onderhoudsrecords in de bevestiging', async () => {
    const user = open('/voertuigen/1');
    await screen.findByText('Kleine beurt met olie en filter');
    await user.click(screen.getByRole('button', { name: 'Voertuig verwijderen' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('TESTA1 en 1 onderhoudsrecord');
    await user.click(screen.getByRole('button', { name: 'Voertuig en onderhoud verwijderen' }));
    expect(await screen.findByText('TESTA1 en het bijbehorende onderhoud zijn verwijderd.')).toBeInTheDocument();
    expect(await screen.findByText('Je hebt nog geen voertuigen toegevoegd')).toBeInTheDocument();
  });
  it('toont een lege staat zonder onderhoud', async () => {
    sessionStorage.setItem('mam-demo-maintenance', '[]');
    open('/voertuigen/1');
    expect(await screen.findByText('Nog geen onderhoud vastgelegd')).toBeInTheDocument();
  });
});
