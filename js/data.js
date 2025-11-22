// js/data.js
export async function fetchSheetData() {
  // Your published CSV (you already had this one)
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ2JQZQxQs1Bb12V9Un_Ntxk-zuAKoGdRNXGCW3vNtYkgVhMhcmlVm-p2VEX7PXg9tERkuvSNKpHxr/pub?output=csv';

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV (${res.status})`);
  }
  const text = await res.text();

  // break into non-empty lines
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  // detect separator (tab or comma)
  const sep = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());

  const idx = {}; // header name -> column index
  headers.forEach((h, i) => idx[h] = i);

  const rows = lines.slice(1).map((line, li) => {
    const cols = line.split(sep).map(c => c.trim());

    // if short row, pad to headers length
    while (cols.length < headers.length) cols.push('');

    const get = (name, fallbackIndex) => {
      const key = name.toLowerCase();
      if (idx[key] !== undefined) return cols[idx[key]] ?? '';
      return cols[fallbackIndex] ?? '';
    };

    // parse net worth robustly: remove $ , spaces, then parseFloat
    const rawNet = get('net worth', 5);
    const cleaned = (rawNet || '').replace(/[\s\$\,]/g, '');
    const netNum = cleaned === '' ? 0 : parseFloat(cleaned);

    return {
      name: get('name', 0),
      photo: get('photo', 1),
      age: get('age', 2),
      country: get('country', 3),
      interest: get('interest', 4),
      netWorth: Number.isFinite(netNum) ? netNum : 0
    };
  });

  // filter empty rows
  return rows.filter(r => r.name || r.photo || r.netWorth);
}
