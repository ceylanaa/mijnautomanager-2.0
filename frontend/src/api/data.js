export function referenceId(value) {
  const id = typeof value === 'object' && value !== null ? value.id : value;
  if ((typeof id !== 'number' && typeof id !== 'string') || String(id).trim() === '') return null;
  return /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) ? Number(id) : null;
}
export function uniqueUser(users, email) {
  const key = String(email ?? '').trim().toLowerCase();
  const matches = users.filter(u => typeof u.email === 'string' && u.email.trim().toLowerCase() === key);
  if (!key || matches.length !== 1 || referenceId(matches[0].id) === null) {
    throw new Error('Je account kon niet eenduidig aan een gebruikersnummer worden gekoppeld. Log opnieuw in of laat de gebruikerskoppeling controleren.');
  }
  return { id: referenceId(matches[0].id), email: matches[0].email };
}
