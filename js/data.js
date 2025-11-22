// js/data.js
export async function fetchSheetData() {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ2JQZQxQs1Bb12V9Un_Ntxk-zuAKoGdRNXGCW3vNtYkgVhMhcmlVm-p2VEX7PXg9tERkuvSNKpHxr/pub?output=csv';
  const response = await fetch(url);
  const csvText = await response.text();

  // Split lines and remove empty ones
  const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
  
  // Detect separator: tab or comma
  const separator = lines[0].includes('\t') ? '\t' : ',';

  // Get headers
  const headers = lines[0].split(separator);

  // Parse data
  const data = lines.slice(1).map(line => {
    const values = line.split(separator);

    // Skip lines that don't have enough columns
    if(values.length < headers.length) return null;

    const rawNet = values[5] || '';
    const netWorth = rawNet ? parseFloat(rawNet.replace(/[\^\d.-]/g, '')) : null;

    return {
      name: values[0],
      photo: values[1],
      age: values[2],
      country: values[3],
      interest: values[4],
      netWorth
    };
  }).filter(Boolean); // remove null entries

  return data;
}
