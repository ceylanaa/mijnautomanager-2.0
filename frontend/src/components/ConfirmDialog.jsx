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

  // Escape annuleert; Tab blijft binnen het venster zodat de pagina erachter niet bereikbaar is.
  function handleKeyDown(event) {
    if (event.key === 'Escape' && !busy) onCancel();
    if (event.key === 'Tab') {
      const buttons = [...event.currentTarget.querySelectorAll('button:not([disabled])')];
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
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
