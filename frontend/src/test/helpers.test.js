import { describe, expect, it } from 'vitest';
import { addDays, apkStatus, todayKey } from '../helpers/apkStatus';

describe('APK-status', () => {
  const today = '20261029';
  it('geeft de juiste labels rond de grens van dertig dagen', () => {
    expect(apkStatus('20261028', today).label).toBe('Vervaldatum verstreken');
    expect(apkStatus('20261029', today).label).toBe('Verloopt vandaag');
    expect(apkStatus(addDays(today, 30), today).label).toBe('Verloopt binnenkort');
    expect(apkStatus(addDays(today, 31), today).label).toBe('Vervaldatum over meer dan dertig dagen');
  });
  it('zegt nooit goedgekeurd bij een ontbrekende datum', () => {
    expect(apkStatus(null, today).label).toBe('APK-datum niet beschikbaar');
    expect(apkStatus('', today).level).toBe('unknown');
  });
  it('rekent vandaag in de Nederlandse tijdzone', () => {
    // 23:30 UTC op 31 december is in Nederland al 1 januari.
    expect(todayKey(new Date('2026-12-31T23:30:00Z'))).toBe('20270101');
  });
});
