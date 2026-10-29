import { Link } from 'react-router';
import { demoVehicle } from '../api/data';
import { formatRdwDate } from '../helpers/format';
import './VehicleCard.css';

// Kaart in het voertuigoverzicht met bijnaam, kenteken en datumstatus.
export default function VehicleCard({ vehicle }) {
  const details = demoVehicle(vehicle.licensePlate);

  return (
    <article className="card vehicle-card">
      <div className="car-mark" aria-hidden="true">
        <svg viewBox="0 0 180 75">
          <path d="M20 46h140l-8-24H47L28 46v12h128V46M47 22l12-13h67l20 13M66 12v30m58-30 9 30" />
          <circle cx="52" cy="59" r="10" />
          <circle cx="135" cy="59" r="10" />
        </svg>
      </div>
      <h2>{vehicle.nickname || 'Mijn auto'}</h2>
      <p className="muted">{details ? `${details.brand} · ${details.model}` : 'Opgeslagen voertuig'}</p>
      <span className="plate">{vehicle.licensePlate}</span>
      <div className="vehicle-meta">
        <span className="badge">Fictief demovoertuig</span>
        <p>APK-datum: {formatRdwDate(details?.apk)}</p>
      </div>
      <Link className="button secondary" to={`/voertuigen/${vehicle.id}`}>
        Details <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
