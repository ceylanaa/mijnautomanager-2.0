import { useState } from 'react';
import Button from './Button';
import FormField from './FormField';
import Notice from './Notice';

// Klein formulier om de bijnaam te wijzigen. De ouder bepaalt via onSave wat er met de waarde gebeurt.
export default function NicknameForm({ initialValue, onSave, onCancel }) {
  const [nickname, setNickname] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(nickname);
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  }

  return (
    <form className="nickname-form" onSubmit={handleSubmit}>
      <FormField
        id="edit-nickname"
        label="Bijnaam"
        maxLength={100}
        value={nickname}
        onChange={event => setNickname(event.target.value)}
        disabled={saving}
        hint="Laat leeg om het kenteken als titel te tonen."
      />
      <Notice error>{error}</Notice>
      <div className="form-actions">
        <Button type="submit" busy={saving}>{saving ? 'Opslaan...' : 'Bijnaam opslaan'}</Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>Annuleren</Button>
      </div>
    </form>
  );
}
