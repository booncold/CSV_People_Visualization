// js/data.js
// You already provided this — small robustness tweaks included.
export async function fetchSheetData() {
  const url =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ2JQZQxQs1Bb12V9Un_Ntxk-zuAKoGdRNXGCW3vNtYkgVhMhcmlVm-p2VEX7PXg9tERkuvSNKpHxr/pub?output=csv';

  const response = await fetch(url);
  const csvText = await response.text();

  const lines = csvText.trim().split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return [];

  // Detect separator (comma or tab)
  const separator = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());

  const data = lines.slice(1)
    .map(line => {
      const values = line.split(separator).map(v => v.trim());
      if (values.length < headers.length) return null;

      // Assuming columns: name, photo, age, country, interest, netWorth
      // Try to be tolerant: match by header name if present, otherwise fallback positional.
      const asObj = {};
      headers.forEach((h, i) => {
        asObj[h] = values[i] || '';
      });

      // fallback positional mapping
      const name = asObj.name ?? values[0] ?? '';
      const photo = asObj.photo ?? values[1] ?? '';
      const age = asObj.age ?? values[2] ?? '';
      const country = asObj.country ?? values[3] ?? '';
      const interest = asObj.interest ?? values[4] ?? '';
      const rawNet = asObj.networth ?? asObj['net worth'] ?? values[5] ?? '';

      const netWorth = rawNet
        ? parseFloat(String(rawNet).replace(/[^\d.-]/g, ''))
        : null;

      return {
        name: name || '',
        photo: photo || '',
        age: age || '',
        country: country || '',
        interest: interest || '',
        netWorth
      };
    })
    .filter(Boolean);

  return data;
}
