// js/data.js
// Fetch and parse the published Google Sheet CSV.
// Expected columns (preferred): name, photo, age, country, interest, netWorth
// The parser is tolerant: it will try to match headers by name or fall back to positional mapping.

export async function fetchSheetData() {
  const url =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ2JQZQxQs1Bb12V9Un_Ntxk-zuAKoGdRNXGCW3vNtYkgVhMhcmlVm-p2VEX7PXg9tERkuvSNKpHxr/pub?output=csv';

  const response = await fetch(url);
  const csvText = await response.text();

  // Split lines & remove empty ones
  const lines = csvText.trim().split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return [];

  // Detect comma or tab separator
  const separator = lines[0].includes('\t') ? '\t' : ',';
  const rawHeaders = lines[0].split(separator).map(h => h.trim());
  const headers = rawHeaders.map(h => h.toLowerCase());

  const data = lines.slice(1)
    .map(line => {
      const values = line.split(separator).map(v => v.trim());
      if (values.length < 1) return null;

      // Map by header names where possible
      const asObj = {};
      headers.forEach((h, i) => {
        asObj[h] = values[i] ?? '';
      });

      // Fallback positional mapping in expected order
      const name = asObj.name ?? values[0] ?? '';
      const photo = asObj.photo ?? values[1] ?? '';
      const age = asObj.age ?? values[2] ?? '';
      const country = asObj.country ?? values[3] ?? '';
      const interest = asObj.interest ?? values[4] ?? '';
      const rawNet = asObj.networth ?? asObj['net worth'] ?? asObj.net ?? values[5] ?? '';

      const netWorth = rawNet
        ? parseFloat(String(rawNet).replace(/[^\d.-]/g, '')) || null
        : null;

      return {
        name: name || '',
        photo: photo || '',
        age: age || '',
        country: country || '',
        interest: interest || '',
        netWorth: netWorth
      };
    })
    .filter(Boolean);

  return data;
}
