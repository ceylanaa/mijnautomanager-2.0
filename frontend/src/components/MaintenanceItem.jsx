import { Link } from 'react-router';
import Button from './Button';
import { formatEuro, formatMaintenanceDate, formatMileage } from '../helpers/maintenance';
import './MaintenanceItem.css';

// Eén onderhoudsbeurt in de lijst op S05. Optionele velden verschijnen alleen als ze zijn ingevuld,
// behalve kosten: daar is "Niet ingevuld" iets anders dan € 0,00 (F27).
export default function MaintenanceItem({ record, editTo, onDelete }) {
  return (
    <li className="maintenance-item">
      <div className="maintenance-main">
        <p className="maintenance-date">{formatMaintenanceDate(record.maintenanceDate)}</p>
        <h3>{record.description}</h3>
        <dl className="data-list">
          <div><dt>Kilometerstand</dt><dd>{formatMileage(record.mileage)}</dd></div>
          <div><dt>Kosten</dt><dd>{formatEuro(record.costEuro)}</dd></div>
          {record.garageName && <div><dt>Garage</dt><dd>{record.garageName}</dd></div>}
        </dl>
        {record.notes && <p className="maintenance-notes">{record.notes}</p>}
      </div>
      <div className="maintenance-actions">
        <Link className="button secondary" to={editTo}>Bewerken<span className="visually-hidden">: {record.description}</span></Link>
        <Button variant="danger" onClick={() => onDelete(record)}>Verwijderen<span className="visually-hidden">: {record.description}</span></Button>
      </div>
    </li>
  );
}
