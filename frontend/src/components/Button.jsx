import { forwardRef } from 'react';
import './Button.css';

// Knop met een vaste stijl. Tijdens een verzoek (busy) is de knop uitgeschakeld.
const Button = forwardRef(function Button({ children, variant = 'primary', busy = false, type = 'button', ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={`button ${variant}`}
      aria-busy={busy || undefined}
      {...props}
      disabled={props.disabled || busy}
    >
      {children}
    </button>
  );
});

export default Button;
