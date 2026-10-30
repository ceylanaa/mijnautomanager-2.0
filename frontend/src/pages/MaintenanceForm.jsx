import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { addMaintenance, updateMaintenance } from '../api/maintenance';
import useVehicles from '../hooks/useVehicles';
import useMaintenance from '../hooks/useMaintenance';
import { formValues, mileageWarning, validateMaintenance } from '../helpers/maintenance';
import { todayKey } from '../helpers/apkStatus';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import './MaintenanceForm.css';

const FIELDS = ['date', 'description', 'mileage', 'cost', 'garageName', 'notes'];

// S08 Onderhoud toevoegen of bewerken. Het voertuig komt uit de route en is hier niet te wijzigen (F29).
export default function MaintenanceForm() {
  const { id, maintenanceId } = useParams();
  const editing = Boolean(maintenanceId);
  const navigate = useNavigate();
  const { session, handleError } = useAuth();
  const vehicles = useVehicles();
  const vehicle = vehicles.records.find(record => String(record.id) === id);
  const maintenance = useMaintenance(vehicle?.id, Boolean(vehicle));
  const record = editing ? maintenance.records.find(item => String(item.id) === maintenanceId) : null;

  const loading = vehicles.loading || (vehicle && maintenance.loading);
  const loadError = vehicles.error || maintenance.error;
  const vehiclePath = `/voertuigen/${id}`;

  if (loading) return <Notice>Gegevens ophalen...</Notice>;
  if (loadError) {
    return <Notice error onRetry={() => { vehicles.reload(); maintenance.reload(); }}>{loadError}</Notice>;
  }
  if (!vehicle || (editing && !record)) {
    return (
      <section className="card">
        <h1>{vehicle ? 'Onderhoud niet gevonden' : 'Voertuig niet gevonden'}</h1>
        <p>Dit record staat niet in jouw overzicht.</p>
        <Link to={vehicle ? vehiclePath : '/voertuigen'}>Terug</Link>
      </section>
    );
  }

  async function save(data) {
    try {
      if (editing) await updateMaintenance(session, record, data);
      else await addMaintenance(session, vehicle.id, data);
    } catch (saveError) {
      throw new Error(handleError(saveError));
    }
    navigate(vehiclePath, { state: { message: editing ? 'De wijzigingen zijn opgeslagen.' : 'Het onderhoud is opgeslagen.' } });
  }

  return (
    <MaintenanceEditor
      key={record?.id ?? 'nieuw'}
      editing={editing}
      vehicle={vehicle}
      record={record}
      others={maintenance.records}
      onSave={save}
      onLeave={() => navigate(vehiclePath)}
      backTo={vehiclePath}
    />
  );
}

function MaintenanceEditor({ editing, vehicle, record, others, onSave, onLeave, backTo }) {
  const initial = useRef(formValues(record));
  const [values, setValues] = useState(initial.current);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const formRef = useRef(null);
  const dirty = FIELDS.some(field => values[field] !== initial.current[field]);

  // Na een mislukte controle krijgt het eerste foute veld de focus.
  useEffect(() => {
    const first = FIELDS.find(field => errors[field]);
    if (first) formRef.current?.querySelector(`#maintenance-${first}`)?.focus();
  }, [errors]);

  // De waarschuwing verschijnt zodra datum en kilometerstand geldig zijn; opslaan blijft mogelijk.
  const check = validateMaintenance(values);
  const warning = check.data ? mileageWarning(others, check.data, record?.id) : '';

  function change(event) {
    setValues(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveError('');
    const result = validateMaintenance(values);
    setErrors(result.errors);
    if (!result.data) return;
    setSaving(true);
    try {
      await onSave(result.data);
    } catch (error) {
      setSaveError(error.message);
      setSaving(false);
    }
  }

  function cancel() {
    if (dirty) setConfirmLeave(true);
    else onLeave();
  }

  const field = name => ({
    id: `maintenance-${name}`,
    name,
    value: values[name],
    onChange: change,
    error: errors[name],
    disabled: saving,
  });

  return (
    <>
      <Link className="back-link" to={backTo}>← Terug naar voertuig</Link>
      <PageHeading
        eyebrow="ONDERHOUD"
        title={editing ? 'Onderhoud bewerken' : 'Onderhoud toevoegen'}
        description="Leg een uitgevoerde beurt vast in je eigen administratie."
      />
      <section className="card maintenance-form">
        <p className="vehicle-link">
          Voertuig: <span className="plate">{vehicle.licensePlate}</span>
          {vehicle.nickname && <span> {vehicle.nickname}</span>}
        </p>
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <FormField label="Datum" type="date" max={`${todayKey().slice(0, 4)}-${todayKey().slice(4, 6)}-${todayKey().slice(6, 8)}`} required {...field('date')} />
          <FormField label="Omschrijving" as="textarea" rows={3} maxLength={1000} required {...field('description')} />
          <FormField label="Kilometerstand" inputMode="numeric" required hint="Hele kilometers, bijvoorbeeld 48210." {...field('mileage')} />
          <Notice>{warning}</Notice>
          <FormField label="Kosten in euro (optioneel)" inputMode="decimal" hint="Bijvoorbeeld 189,50. Leeg laten als je het bedrag niet weet; 0 betekent gratis." {...field('cost')} />
          <FormField label="Garage (optioneel)" maxLength={200} {...field('garageName')} />
          <FormField label="Notities (optioneel)" as="textarea" rows={4} maxLength={2000} {...field('notes')} />
          <Notice error>{saveError}</Notice>
          <div className="form-actions">
            <Button type="submit" busy={saving}>
              {saving ? 'Opslaan...' : editing ? 'Wijzigingen opslaan' : 'Onderhoud opslaan'}
            </Button>
            <Button variant="secondary" onClick={cancel} disabled={saving}>Annuleren</Button>
          </div>
        </form>
      </section>
      {confirmLeave && (
        <ConfirmDialog
          title="Wijzigingen niet opslaan?"
          confirmLabel="Niet opslaan"
          onConfirm={onLeave}
          onCancel={() => setConfirmLeave(false)}
        >
          <p>Je hebt gegevens ingevuld die nog niet zijn opgeslagen. Als je doorgaat, gaan deze verloren.</p>
        </ConfirmDialog>
      )}
    </>
  );
}
