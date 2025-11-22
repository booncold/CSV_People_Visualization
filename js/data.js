// js/data.js
export async function fetchSheetData() {
  // Replace with your published Google Sheet CSV URL
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ2JQZQxQs1Bb12V9Un_Ntxk-zuAKoGdRNXGCW3vNtYkgVhMhcmlVm-p2VEX7PXg9tERkuvSNKpHxr/pub?output=csv';
  const response = await fetch(url);
  const csvText = await response.text();

  // Convert CSV to array of objects
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split('\t'); // your CSV is tab-separated

  const data = lines.slice(1).map(line => {
    const values = line.split('\t');
    return {
      name: values[0],
      photo: values[1],
      age: values[2],
      country: values[3],
      interest: values[4],
      netWorth: parseFloat(values[5].replace(/[\$,]/g, '')) // remove $ and comma
    };
  });

  return data;
}
