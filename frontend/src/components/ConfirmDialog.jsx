import { useEffect, useRef } from 'react';
import Button from './Button';
import Notice from './Notice';
import './ConfirmDialog.css';

// Bevestigingsvenster voor verwijderen of wijzigingen weggooien.
// Annuleren krijgt de focus, zodat Enter nooit per ongeluk iets verwijdert. Escape annuleert ook.
export default function ConfirmDialog({ title, children, confirmLabel, busyLabel, busy = false, error, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  function handleKeyDown(event) {
    if (event.key === 'Escape' && !busy) onCancel();
  }

  return (
    <div className="dialog-backdrop" onKeyDown={handleKeyDown}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{title}</h2>
        <div className="dialog-text">{children}</div>
        <Notice error>{error}</Notice>
        <div className="form-actions">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy}>Annuleren</Button>
          <Button variant="danger" onClick={onConfirm} busy={busy}>{busy ? busyLabel : confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
