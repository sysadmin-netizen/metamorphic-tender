export function formatGST(date: string | Date): string {
  const d = new Date(date);
  const raw = d.toLocaleString('en-GB', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  // en-GB produces "DD/MM/YYYY, HH:mm" — convert to "DD.MM.YYYY HH:mm GST"
  return raw.replace(/\//g, '.').replace(',', '') + ' GST';
}

export function formatDateOnly(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
