import { Link } from 'react-router';
import useVehicles from '../hooks/useVehicles';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import VehicleCard from '../components/VehicleCard';

// S03 Mijn voertuigen.
export default function VehicleList() {
  const { records, loading, error, reload } = useVehicles();

  return (
    <>
      <PageHeading eyebrow="JOUW OVERZICHT" title="Goed op weg." description="Je auto's overzichtelijk bij elkaar.">
        <Link className="button primary" to="/kenteken"><span aria-hidden="true">＋</span> Auto toevoegen</Link>
      </PageHeading>

      <div className="section-title">
        <h2>Mijn auto's</h2>
        {!loading && !error && (
          <span className="count">{records.length} {records.length === 1 ? 'voertuig' : 'voertuigen'}</span>
        )}
      </div>

      {loading && <Notice>Voertuigen ophalen...</Notice>}
      {!loading && error && <Notice error onRetry={reload}>{error}</Notice>}
      {!loading && !error && records.length > 0 && (
        <div className="vehicle-grid">
          {records.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
        </div>
      )}
      {!loading && !error && records.length === 0 && (
        <EmptyState
          title="Je hebt nog geen voertuigen toegevoegd"
          text="Voeg een fictief demovoertuig toe om je overzicht te bekijken."
          actionLabel="Voertuig toevoegen"
          actionTo="/kenteken"
        />
      )}
    </>
  );
}
