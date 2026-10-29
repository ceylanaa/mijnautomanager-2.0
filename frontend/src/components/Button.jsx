import './Button.css';

// Knop met een vaste stijl. Tijdens een verzoek (busy) is de knop uitgeschakeld.
export default function Button({ children, variant = 'primary', busy = false, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`button ${variant}`}
      aria-busy={busy || undefined}
      {...props}
      disabled={props.disabled || busy}
    >
      {children}
    </button>
  );
}
