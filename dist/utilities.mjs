export const money = (sen, digits = 0) => 'RM' + new Intl.NumberFormat('en-MY', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(sen / 100);
export function compact(sen) {
  const amount = sen / 100;
  if (Math.abs(amount) >= 1e6) return `RM${(amount / 1e6).toFixed(2)}m`;
  if (Math.abs(amount) >= 1e3) return `RM${(amount / 1e3).toFixed(1)}k`;
  return money(sen, Number.isInteger(amount) ? 0 : 2);
}
export function range(low, high) {
  if (low >= 1e8) return `RM${(low / 1e8).toFixed(2)}–${(high / 1e8).toFixed(2)}m`;
  if (low >= 1e5) return `RM${(low / 1e5).toFixed(low < 1e6 ? 1 : 0)}–${(high / 1e5).toFixed(high < 1e6 ? 1 : 0)}k`;
  return `${money(low, Number.isInteger(low / 100) ? 0 : 2)}–${money(high, Number.isInteger(high / 100) ? 0 : 2).slice(2)}`;
}
export function csvCell(value) {
  // Typed numbers remain numbers. All strings that could be interpreted as a
  // spreadsheet formula are made literal, including a minus followed by digits.
  let text = String(value ?? '');
  if (typeof value !== 'number' && /^\s*[=+\-@\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function parseCSV(text) {
  const result = [];
  let row = [], cell = '', quoted = false, closedQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (!quoted && (cell.length || closedQuote)) throw Error('Unexpected quote in CSV. Use a standard comma-separated file.');
      else { quoted = !quoted; if (!quoted) closedQuote = true; }
    } else if (c === ',' && !quoted) { row.push(cell); cell = ''; closedQuote = false; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(v => v.trim())) result.push(row);
      row = []; cell = ''; closedQuote = false;
    } else {
      if (closedQuote) throw Error('Unexpected characters after a closing quote in CSV.');
      cell += c;
    }
  }
  if (quoted) throw Error('A quoted field is not closed. Check the CSV format.');
  row.push(cell); if (row.some(v => v.trim())) result.push(row);
  return result;
}
