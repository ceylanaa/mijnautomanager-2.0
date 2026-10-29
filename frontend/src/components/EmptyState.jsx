import { Link } from 'react-router';
import './EmptyState.css';

// Lege toestand met een duidelijke eerste actie, bijvoorbeeld bij nul voertuigen of nul onderhoudsbeurten.
export default function EmptyState({ title, text, actionLabel, actionTo }) {
  return (
    <section className="card empty">
      <span className="empty-symbol" aria-hidden="true">＋</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {actionTo && <Link className="button primary" to={actionTo}>{actionLabel}</Link>}
    </section>
  );
}
