import { Link, useParams } from 'react-router';
import { fetchApkDate, fetchDefects, topDefects } from '../api/rdw';
import { demoVehicle, normalizePlate, validPlate } from '../api/data';
import useVehicles from '../hooks/useVehicles';
import useRequest from '../hooks/useRequest';
import { formatRdwDate } from '../helpers/format';
import ApkStatus from '../components/ApkStatus';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import './ApkPage.css';

const GARAGE_LINK = `/garages?erkenning=${encodeURIComponent('APK Lichte voertuigen')}`;

function time(date) {
  return date ? new Intl.DateTimeFormat('nl-NL', { timeStyle: 'short', timeZone: 'Europe/Amsterdam' }).format(date) : '';
}

// S06 vanuit de eigen voertuigpagina: /voertuigen/:id/apk. Alleen voertuigen uit het eigen overzicht.
export function OwnVehicleApk() {
  const { id } = useParams();
  const { records, loading, error, reload } = useVehicles();
  const vehicle = records.find(record => String(record.id) === id);

  if (loading) return <Notice>Voertuig ophalen...</Notice>;
  if (error) return <Notice error onRetry={reload}>{error}</Notice>;
  if (!vehicle) {
    return (
      <section className="card">
        <h1>Voertuig niet gevonden</h1>
        <p>Dit voertuig staat niet in jouw overzicht.</p>
      </section>
    );
  }
  return <ApkPage plate={vehicle.licensePlate} backTo={`/voertuigen/${vehicle.id}`} backLabel="← Terug naar voertuig" />;
}

// S06 voor een RDW-kenteken uit de zoekpagina: /apk/:kenteken (alleen lezen, niets opslaan).
export function PlateApk() {
  const plate = normalizePlate(useParams().kenteken);
  if (!validPlate(plate)) {
    return <Notice error>Dit kenteken is niet geldig.</Notice>;
  }
  return <ApkPage plate={plate} backTo="/kenteken" backLabel="← Terug naar kenteken zoeken" />;
}

function ApkPage({ plate, backTo, backLabel }) {
  const apk = useRequest(signal => fetchApkDate(plate, signal), plate);
  const defects = useRequest(signal => fetchDefects(plate, signal), plate);
  const demo = Boolean(demoVehicle(plate));
  const rows = defects.data?.rows ?? [];
  const top = topDefects(rows);

  return (
    <>
      <Link className="back-link" to={backTo}>{backLabel}</Link>
      <PageHeading
        eyebrow="APK EN GEBREKEN"
        title={plate}
        description={demo ? 'Fictieve voorbeeldgegevens: demokentekens bestaan niet bij de RDW.' : 'Bron: RDW Open Data. Alleen lezen.'}
      />

      <div className="apk-layout">
        <section className="card apk-card" aria-labelledby="apk-title">
          <h2 id="apk-title">APK-vervaldatum</h2>
          {apk.loading && <Notice>APK-datum ophalen...</Notice>}
          {!apk.loading && apk.error && <Notice error onRetry={apk.reload}>{apk.error}</Notice>}
          {!apk.loading && apk.data && !apk.data.found && <p>Dit kenteken is niet gevonden in het RDW-voertuigregister.</p>}
          {!apk.loading && apk.data?.found && (
            <>
              <ApkStatus expiry={apk.data.expiry} />
              <p className="muted">Opgehaald om {time(apk.fetchedAt)}.</p>
            </>
          )}
        </section>
        <section className="soft-panel apk-info">
          <h2>Wat betekent dit?</h2>
          <p>De vervaldatum zegt niets over de huidige staat van de auto. Een datum in de toekomst betekent niet dat de auto veilig of goedgekeurd is.</p>
          <p>De gebreken hieronder zijn historische registraties van keuringen, geen huidige defecten.</p>
          <Link className="button secondary" to={GARAGE_LINK}>Zoek een APK-keuringsbedrijf</Link>
        </section>
      </div>

      <section className="card defects-card" aria-labelledby="defects-title">
        <h2 id="defects-title">Geregistreerde gebreken</h2>
        {defects.loading && <Notice>Gebrekregistraties ophalen...</Notice>}
        {!defects.loading && defects.error && <Notice error onRetry={defects.reload}>{defects.error}</Notice>}
        {!defects.loading && defects.data && rows.length === 0 && <p>Geen registraties gevonden voor dit kenteken.</p>}
        {!defects.loading && rows.length > 0 && (
          <>
            <Notice error onRetry={defects.data.codebookError ? defects.reload : undefined}>{defects.data.codebookError}</Notice>
            <div className="table-wrap">
              <table>
                <caption className="visually-hidden">Gebrekregistraties van nieuw naar oud</caption>
                <thead>
                  <tr><th scope="col">Melddatum</th><th scope="col">Gebrek</th><th scope="col">Aantal</th></tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.date}-${row.time}-${row.code}-${index}`}>
                      <td>{formatRdwDate(row.date)}</td>
                      <td>{row.description ? <>{row.description} <span className="muted">({row.code})</span></> : `Code ${row.code}`}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Meest geregistreerd</h3>
            <p className="muted">
              Telling over alle {rows.length} opgehaalde registraties van {plate}. Dit zegt niets over andere auto's of het hele land.
            </p>
            <ol className="top-defects">
              {top.map(item => (
                <li key={item.code}>{item.description || `Code ${item.code}`}: {item.count}×</li>
              ))}
            </ol>
            <p className="muted">Opgehaald om {time(defects.fetchedAt)}.</p>
          </>
        )}
      </section>
    </>
  );
}
