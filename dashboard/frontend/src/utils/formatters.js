/**
 * Safely parse ISO string to a standard local Date-time representation
 */
export function formatTimeSec(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return '—';
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    const day = d.getDate();
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} ${year}, ${time}`;
  } catch (e) {
    return '—';
  }
}
