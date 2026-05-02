/**
 * Pakistan Standard Time (PKT) utilities.
 * Uses Intl.DateTimeFormat with 'Asia/Karachi' for bulletproof conversion.
 *
 * Database stores everything in UTC (TIMESTAMPTZ).
 * The UI always shows PKT and datetime-local inputs are treated as PKT.
 */

const TZ = 'Asia/Karachi';

// Reusable formatters (Asia/Karachi = PKT, always UTC+5)
const _fullFmt = new Intl.DateTimeFormat('en-PK', {
  timeZone: TZ,
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true,
});

const _dateFmt = new Intl.DateTimeFormat('en-PK', {
  timeZone: TZ,
  day: '2-digit', month: 'short', year: 'numeric',
});

// Get PKT date parts from a Date using Intl (no manual offset math)
function _pktParts(date) {
  const parts = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date).forEach(({ type, value }) => {
    parts[type] = value;
  });
  return parts;
}

/**
 * Convert any Date/ISO-string to a formatted PKT display string.
 * Example output: "02 May 2026, 11:03 AM PKT"
 */
export function toPKTDisplay(utcValue) {
  if (!utcValue) return '—';
  let val = utcValue;
  if (typeof val === 'string') {
    if (!/[zZ]|[\+\-]\d{2}:?\d{2}$/.test(val)) {
      val = val.replace(' ', 'T');
      if (!val.endsWith('Z')) val = val + 'Z';
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return _fullFmt.format(d) + ' PKT';
}

/**
 * Short date in PKT.  Example: "02 May 2026"
 */
export function toPKTDate(utcValue) {
  if (!utcValue) return '—';
  const d = new Date(utcValue);
  if (isNaN(d.getTime())) return '—';
  return _dateFmt.format(d);
}

/**
 * Convert a UTC value to a string for <input type="datetime-local"> shown in PKT.
 * Format: "YYYY-MM-DDTHH:mm"
 */
export function toPKTInputValue(utcValue) {
  if (!utcValue) return '';
  const d = new Date(utcValue);
  if (isNaN(d.getTime())) return '';

  const p = _pktParts(d);
  // hour may come as "24" at midnight in some engines; normalise to "00"
  const hh = p.hour === '24' ? '00' : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hh}:${p.minute}`;
}

/**
 * Convert a datetime-local input value (entered in PKT) to a UTC ISO string.
 * We explicitly subtract 5 hours rather than trusting the browser's local TZ.
 * @param {string} localInputValue  e.g. "2026-05-02T15:38"
 * @returns {string} UTC ISO string
 */
export function pktInputToUTC(localInputValue) {
  if (!localInputValue) return '';
  const [datePart, timePart] = localInputValue.split('T');
  if (!datePart || !timePart) return '';

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  // Treat the digits as PKT (UTC+5) and subtract 5 hours to get UTC
  const pktMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const utcMs = pktMs - (5 * 60 * 60 * 1000);

  return new Date(utcMs).toISOString();
}
