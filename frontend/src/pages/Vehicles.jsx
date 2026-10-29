import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { loadVehicles } from '../api/vehicles';
import { demoVehicle, formatRdwDate } from '../api/data';
import { Button, EmptyState, Notice, PageHeading, VehicleCard } from '../components/UI';

function useVehicles() {
  const { session, handleError } = useAuth();
  const [records, setRecords] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); let current = true;
    setLoading(true); setError(''); setRecords([]);
    loadVehicles(session, controller.signal).then(data => { if (current) setRecords(data); }).catch(error => { if (current) setError(handleError(error)); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; controller.abort(); };
    // Session is stable for the mounted private subtree; a logout unmounts it.
  }, [session, revision]);
  return { records, loading, error, retry: () => setRevision(v => v + 1) };
}
export function VehicleList() {
  const { records, loading, error, retry } = useVehicles();
  return <><PageHeading eyebrow="JOUW OVERZICHT" title="Goed op weg." description="Je auto's overzichtelijk bij elkaar."><Link className="button" to="/kenteken"><span aria-hidden="true">＋</span> Auto toevoegen</Link></PageHeading><div className="section-title"><h2>Mijn auto's</h2>{!loading && !error && <span className="count">{records.length} {records.length === 1 ? 'voertuig' : 'voertuigen'}</span>}</div>{loading ? <Notice>Voertuigen ophalen...</Notice> : error ? <Notice error>{error} <Button secondary onClick={retry}>Opnieuw proberen</Button></Notice> : records.length ? <div className="vehicle-grid">{records.map(v => <VehicleCard key={v.id} vehicle={v}/>)}</div> : <EmptyState/>}<aside className="soft-panel"><h3>Een overzicht dat met je meegroeit.</h3><p>Onderhoud, uitgebreid APK-inzicht en garages zoeken volgen in een volgende bouwstap.</p></aside></>;
}
export function VehicleDetail() {
  const { id } = useParams(); const { records, loading, error, retry } = useVehicles();
  const vehicle = records.find(v => String(v.id) === id); const details = vehicle && demoVehicle(vehicle.licensePlate);
  return <><Link className="back-link" to="/voertuigen">← Mijn auto's</Link>{loading ? <Notice>Voertuig ophalen...</Notice> : error ? <Notice error>{error} <Button secondary onClick={retry}>Opnieuw proberen</Button></Notice> : !vehicle ? <section className="card"><h1>Voertuig niet gevonden</h1><p>Dit voertuig staat niet in jouw overzicht.</p></section> : <><PageHeading eyebrow="VOERTUIGDETAILS" title={vehicle.nickname || 'Mijn auto'} description="Fictieve voertuiggegevens voor deze demo."/><section className="card detail-card"><span className="plate">{vehicle.licensePlate}</span><h2>{details ? `${details.brand} ${details.model}` : 'Opgeslagen voertuig'}</h2><dl className="data-list"><div><dt>Bouwjaar</dt><dd>{details?.year || 'Niet beschikbaar'}</dd></div><div><dt>Brandstof</dt><dd>{details?.fuel || 'Niet beschikbaar'}</dd></div><div><dt>APK-datum</dt><dd>{formatRdwDate(details?.apk)}</dd></div></dl><p className="muted">Geen beschikbare APK-datum is geen keuringsgarantie.</p></section><aside className="soft-panel"><h3>Onderhoud komt hier.</h3><p>Het vastleggen van onderhoud en wijzigen/verwijderen van voertuigen horen bij een volgende bouwstap.</p></aside></>}</>;
}
