import { apkStatus } from '../helpers/apkStatus';
import { formatRdwDate } from '../helpers/format';
import './ApkStatus.css';

// Toont APK-datum plus tekstlabel. De status is nooit alleen aan kleur te herkennen.
export default function ApkStatus({ expiry }) {
  const status = apkStatus(expiry);

  return (
    <p className="apk-status">
      <span className={`apk-label ${status.level}`}>{status.label}</span>
      {status.level !== 'unknown' && <span className="apk-date">APK-datum: {formatRdwDate(expiry)}</span>}
    </p>
  );
}
