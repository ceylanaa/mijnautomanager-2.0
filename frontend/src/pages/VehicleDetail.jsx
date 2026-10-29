import { Link, useParams } from 'react-router';
import useVehicles from '../hooks/useVehicles';
import { demoVehicle } from '../api/data';
import { formatRdwDate } from '../helpers/format';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import './VehicleDetail.css';

// S05 Voertuig en onderhoud. De dynamische route /voertuigen/:id gebruikt dezelfde gefilterde lijst.
export default function VehicleDetail() {
  const { id } = useParams();
  const { records, loading, error, reload } = useVehicles();
  const vehicle = records.find(record => String(record.id) === id);
  const details = vehicle && demoVehicle(vehicle.licensePlate);

  return (
    <>
      <Link className="back-link" to="/voertuigen">← Mijn auto's</Link>
      {loading && <Notice>Voertuig ophalen...</Notice>}
      {!loading && error && <Notice error onRetry={reload}>{error}</Notice>}
      {!loading && !error && !vehicle && (
        <section className="card">
          <h1>Voertuig niet gevonden</h1>
          <p>Dit voertuig staat niet in jouw overzicht.</p>
        </section>
      )}
      {!loading && !error && vehicle && (
        <>
          <PageHeading
            eyebrow="VOERTUIGDETAILS"
            title={vehicle.nickname || vehicle.licensePlate}
            description="Fictieve voertuiggegevens voor deze demo."
          />
          <section className="card detail-card">
            <span className="plate">{vehicle.licensePlate}</span>
            <h2>{details ? `${details.brand} ${details.model}` : 'Opgeslagen voertuig'}</h2>
            <dl className="data-list">
              <div><dt>Bouwjaar</dt><dd>{details?.year || 'Niet beschikbaar'}</dd></div>
              <div><dt>Brandstof</dt><dd>{details?.fuel || 'Niet beschikbaar'}</dd></div>
              <div><dt>APK-datum</dt><dd>{formatRdwDate(details?.apk)}</dd></div>
            </dl>
            <p className="muted">Geen beschikbare APK-datum is geen keuringsgarantie.</p>
          </section>
        </>
      )}
    </>
  );
}
