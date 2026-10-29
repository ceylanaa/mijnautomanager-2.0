// Vandaag als "JJJJMMDD" in de Nederlandse tijdzone, zodat de datumstatus niet afhangt van UTC.
export function todayKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  return parts.replaceAll('-', '');
}

function keyToUtc(key) {
  return Date.UTC(Number(key.slice(0, 4)), Number(key.slice(4, 6)) - 1, Number(key.slice(6, 8)));
}

// Telt dagen bij een datum op; gebruikt voor de fictieve demodatums.
export function addDays(key, days) {
  const date = new Date(keyToUtc(key) + days * 86400000);
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

// Bepaalt het statuslabel van een APK-vervaldatum (ontwerp paragraaf 5.4).
// Er wordt nooit "goedgekeurd" of "veilig" getoond.
export function apkStatus(expiryKey, today = todayKey()) {
  if (!/^\d{8}$/.test(expiryKey ?? '')) {
    return { level: 'unknown', label: 'APK-datum niet beschikbaar' };
  }
  const days = Math.round((keyToUtc(expiryKey) - keyToUtc(today)) / 86400000);
  if (days < 0) return { level: 'expired', label: 'Vervaldatum verstreken' };
  if (days === 0) return { level: 'soon', label: 'Verloopt vandaag' };
  if (days <= 30) return { level: 'soon', label: 'Verloopt binnenkort' };
  return { level: 'ok', label: 'Vervaldatum over meer dan dertig dagen' };
}
