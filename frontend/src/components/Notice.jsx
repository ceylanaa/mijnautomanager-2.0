import Button from './Button';
import './Notice.css';

// Statusmelding voor laden, succes of fouten. Met onRetry verschijnt een herstelknop.
export default function Notice({ children, error = false, onRetry }) {
  if (!children) return null;

  return (
    <div className={`notice${error ? ' error' : ''}`} role={error ? 'alert' : 'status'}>
      <span>{children}</span>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Opnieuw proberen</Button>}
    </div>
  );
}
