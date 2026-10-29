import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { updateNickname } from '../api/vehicles';
import useVehicles from '../hooks/useVehicles';
import { demoVehicle } from '../api/data';
import ApkStatus from '../components/ApkStatus';
import Button from '../components/Button';
import NicknameForm from '../components/NicknameForm';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import './VehicleDetail.css';

// S05 Voertuig en onderhoud. De dynamische route /voertuigen/:id gebruikt dezelfde gefilterde lijst.
export default function VehicleDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { session, handleError } = useAuth();
  const { records, loading, error, reload } = useVehicles();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(location.state?.message ?? '');
  const vehicle = records.find(record => String(record.id) === id);
  const details = vehicle && demoVehicle(vehicle.licensePlate);

  async function saveNickname(nickname) {
    try {
      await updateNickname(session, vehicle.id, nickname);
    } catch (saveError) {
      throw new Error(handleError(saveError));
    }
    setEditing(false);
    setMessage('De bijnaam is opgeslagen.');
    reload();
  }

  return (
    <>
      <Link className="back-link" to="/voertuigen">← Mijn auto's</Link>
      <Notice>{message}</Notice>
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
          >
            {!editing && <Button variant="secondary" onClick={() => setEditing(true)}>Bijnaam wijzigen</Button>}
          </PageHeading>
          {editing && (
            <section className="card edit-card">
              <NicknameForm initialValue={vehicle.nickname} onSave={saveNickname} onCancel={() => setEditing(false)} />
            </section>
          )}
          <section className="card detail-card">
            <span className="plate">{vehicle.licensePlate}</span>
            <h2>{details ? `${details.brand} ${details.model}` : 'Opgeslagen voertuig'}</h2>
            <dl className="data-list">
              <div><dt>Bouwjaar</dt><dd>{details?.year || 'Niet beschikbaar'}</dd></div>
              <div><dt>Brandstof</dt><dd>{details?.fuel || 'Niet beschikbaar'}</dd></div>
            </dl>
            <ApkStatus expiry={details?.apk} />
            <p className="muted">Geen beschikbare APK-datum is geen keuringsgarantie.</p>
          </section>
        </>
      )}
    </>
  );
}
