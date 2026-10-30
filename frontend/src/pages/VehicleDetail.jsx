import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { updateNickname } from '../api/vehicles';
import { deleteMaintenance, deleteVehicleWithMaintenance } from '../api/maintenance';
import useVehicles from '../hooks/useVehicles';
import useMaintenance from '../hooks/useMaintenance';
import { formatMaintenanceDate } from '../helpers/maintenance';
import { demoVehicle } from '../api/data';
import ApkStatus from '../components/ApkStatus';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import MaintenanceItem from '../components/MaintenanceItem';
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
  const maintenance = useMaintenance(vehicle?.id, Boolean(vehicle));
  const navigate = useNavigate();
  // Wat er verwijderd gaat worden: { type: 'maintenance', record } of { type: 'vehicle' }.
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState('');

  function closeRemove() {
    setRemoving(null);
    setRemoveError('');
  }

  async function confirmRemove() {
    setRemoveBusy(true);
    setRemoveError('');
    try {
      if (removing.type === 'vehicle') {
        await deleteVehicleWithMaintenance(session, vehicle, maintenance.records);
        navigate('/voertuigen', { state: { message: `${vehicle.licensePlate} en het bijbehorende onderhoud zijn verwijderd.` } });
        return;
      }
      await deleteMaintenance(session, removing.record);
      setMessage('Het onderhoud is verwijderd.');
      closeRemove();
      maintenance.reload();
    } catch (error) {
      setRemoveError(handleError(error));
      // Bij een gedeeltelijke mislukking laten we de actuele stand zien.
      maintenance.reload();
    } finally {
      setRemoveBusy(false);
    }
  }

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
            <Button
              variant="danger"
              onClick={() => setRemoving({ type: 'vehicle' })}
              disabled={maintenance.loading || Boolean(maintenance.error)}
            >
              Voertuig verwijderen
            </Button>
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
            <Link to={`/voertuigen/${vehicle.id}/apk`}>APK en gebreken bekijken</Link>
          </section>

          <section className="card maintenance-section" aria-labelledby="maintenance-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">EIGEN ADMINISTRATIE</p>
                <h2 id="maintenance-title">Onderhoud</h2>
              </div>
              {maintenance.records.length > 0 && (
                <Link className="button" to={`/voertuigen/${vehicle.id}/onderhoud/nieuw`}>Onderhoud toevoegen</Link>
              )}
            </div>
            <p className="muted">Deze gegevens vul je zelf in. Ze zijn niet gecontroleerd door de RDW of een garage.</p>
            {maintenance.loading && <Notice>Onderhoud ophalen...</Notice>}
            {!maintenance.loading && maintenance.error && <Notice error onRetry={maintenance.reload}>{maintenance.error}</Notice>}
            {!maintenance.loading && !maintenance.error && maintenance.records.length === 0 && (
              <EmptyState
                title="Nog geen onderhoud vastgelegd"
                text="Voeg je eerste onderhoudsbeurt toe, zoals een kleine beurt of nieuwe banden."
                actionLabel="Onderhoud toevoegen"
                actionTo={`/voertuigen/${vehicle.id}/onderhoud/nieuw`}
              />
            )}
            {!maintenance.loading && !maintenance.error && maintenance.records.length > 0 && (
              <ul className="maintenance-list">
                {maintenance.records.map(record => (
                  <MaintenanceItem
                    key={record.id}
                    record={record}
                    editTo={`/voertuigen/${vehicle.id}/onderhoud/${record.id}/bewerken`}
                    onDelete={item => setRemoving({ type: 'maintenance', record: item })}
                  />
                ))}
              </ul>
            )}
          </section>

          {removing?.type === 'maintenance' && (
            <ConfirmDialog
              title="Onderhoud verwijderen?"
              confirmLabel="Onderhoud verwijderen"
              busyLabel="Verwijderen..."
              busy={removeBusy}
              error={removeError}
              onConfirm={confirmRemove}
              onCancel={closeRemove}
            >
              <p>
                Je verwijdert &quot;{removing.record.description}&quot; van {formatMaintenanceDate(removing.record.maintenanceDate)}.
                Dit kun je niet ongedaan maken.
              </p>
            </ConfirmDialog>
          )}
          {removing?.type === 'vehicle' && (
            <ConfirmDialog
              title="Voertuig verwijderen?"
              confirmLabel="Voertuig en onderhoud verwijderen"
              busyLabel="Verwijderen..."
              busy={removeBusy}
              error={removeError}
              onConfirm={confirmRemove}
              onCancel={closeRemove}
            >
              <p>
                Je verwijdert {vehicle.licensePlate} en {maintenance.records.length === 1 ? '1 onderhoudsrecord' : `${maintenance.records.length} onderhoudsrecords`}.
                Dit kun je niet ongedaan maken.
              </p>
            </ConfirmDialog>
          )}
        </>
      )}
    </>
  );
}
