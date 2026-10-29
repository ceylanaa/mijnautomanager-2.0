import { forwardRef } from 'react';
import './FormField.css';

// Invoerveld met een blijvend label, optionele hulptekst en foutmelding.
// Met as="select" of as="textarea" wordt hetzelfde component voor andere velden gebruikt.
const FormField = forwardRef(function FormField({ label, id, hint, error, as = 'input', children, ...props }, ref) {
  const Element = as;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');

  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Element
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      >
        {children}
      </Element>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
});

export default FormField;
