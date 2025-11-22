// js/main.js

import { fetchSheetData } from './data.js';

// Currently only logs the CSV data
fetchSheetData().then(data => console.log(data));

// Later we will:
// - hide login page
// - redirect to 3D visualization page
// - generate Table / Sphere / Helix / Grid layouts using three.js
