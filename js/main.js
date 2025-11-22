// js/main.js
// Builds the 3D CSS3D visualization using data from js/data.js
// Imports use the importmap defined in index.html so "three" and "three/addons/..." resolve.

import { fetchSheetData } from './data.js';
import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

let camera, scene, renderer, controls;
const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };

// Expose the function so index.html's Google login callback can call it
window.showTablePage = async function showTablePage() {
  // hide login UI and show table page
  const loginPage = document.getElementById('login-page');
  const tablePage = document.getElementById('table-page');
  if (loginPage) loginPage.style.display = 'none';
  if (tablePage) tablePage.style.display = 'block';

  // fetch sheet data
  const rows = await fetchSheetData();
  if (!rows || rows.length === 0) {
    console.warn('No sheet data found.');
    return;
  }

  init(rows);
  animate();
};

function createTile(row, index) {
  const element = document.createElement('div');

  // assign net worth classes
  const nw = row.netWorth;
  if (nw == null || isNaN(nw)) element.className = 'net-unknown';
  else if (nw < 100) element.className = 'net-low';
  else if (nw <= 200) element.className = 'net-mid';
  else element.className = 'net-high';

  // avatar / photo
  const img = document.createElement('img');
  img.src = row.photo || '';
  img.alt = row.name || '';
  element.appendChild(img);

  // name
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = row.name || '(no name)';
  element.appendChild(name);

  // details text
  const details = document.createElement('div');
  details.className = 'details';
  const netStr = (row.netWorth != null && !isNaN(row.netWorth)) ? '$' + Number(row.netWorth).toLocaleString() : '-';
  details.innerHTML = `
    Age: ${row.age || '-'}<br>
    Country: ${row.country || '-'}<br>
    Interest: ${row.interest || '-'}<br>
    Net: ${netStr}
  `;
  element.appendChild(details);

  // index badge
  const badge = document.createElement('div');
  badge.className = 'badge';
  badge.textContent = (index + 1);
  badge.style.position = 'absolute';
  element.appendChild(badge);

  return new CSS3DObject(element);
}

function init(dataRows) {
  // clear previous scene if any
  objects.length = 0;
  targets.table.length = targets.sphere.length = targets.helix.length = targets.grid.length = 0;

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 3000;

  scene = new THREE.Scene();

  // create CSS3D objects for every row
  dataRows.forEach((row, i) => {
    const objectCSS = createTile(row, i);
    objectCSS.position.x = Math.random() * 4000 - 2000;
    objectCSS.position.y = Math.random() * 4000 - 2000;
    objectCSS.position.z = Math.random() * 4000 - 2000;
    scene.add(objectCSS);
    objects.push(objectCSS);
  });

  // TABLE layout: 20 x 10 (cols x rows) with layered z if >200
  const cols = 20;
  const rows = 10;
  const spacingX = 180;
  const spacingY = 220;
  const offsetX = (cols - 1) * spacingX / 2;
  const offsetY = (rows - 1) * spacingY / 2;
  for (let i = 0; i < objects.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols) % rows;
    const layer = Math.floor(i / (cols * rows)); // new layer every 200 items
    const object = new THREE.Object3D();
    object.position.x = (col * spacingX) - offsetX;
    object.position.y = - (row * spacingY) + offsetY;
    object.position.z = (layer * 420) - 420; // layer offset
    targets.table.push(object);
  }

  // SPHERE layout
  const vector = new THREE.Vector3();
  for (let i = 0, l = objects.length; i < l; i++) {
    const phi = Math.acos(-1 + (2 * i) / l);
    const theta = Math.sqrt(l * Math.PI) * phi;
    const object = new THREE.Object3D();
    object.position.setFromSphericalCoords(900, phi, theta);
    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);
    targets.sphere.push(object);
  }

  // DOUBLE HELIX (two intertwined strands)
  const helixRadius = 800;
  for (let i = 0, l = objects.length; i < l; i++) {
    const strand = i % 2; // 0 or 1
    const idx = Math.floor(i / 2);
    const theta = idx * 0.3 + (strand === 0 ? 0 : Math.PI); // phase offset for second strand
    const y = - (idx * 70) + (l / 4);
    const object = new THREE.Object3D();
    object.position.x = Math.cos(theta) * helixRadius;
    object.position.z = Math.sin(theta) * helixRadius;
    object.position.y = y;
    const vec = new THREE.Vector3(object.position.x * 2, object.position.y, object.position.z * 2);
    object.lookAt(vec);
    targets.helix.push(object);
  }

  // GRID: 5 x 4 x 10 (x, y, z)
  const gx = 5, gy = 4, gz = 10;
  const spacingGX = 300, spacingGY = 240, spacingGZ = 500;
  const offsetGX = (gx - 1) * spacingGX / 2;
  const offsetGY = (gy - 1) * spacingGY / 2;
  const offsetGZ = (gz - 1) * spacingGZ / 2;
  for (let i = 0; i < objects.length; i++) {
    const xi = i % gx;
    const yi = Math.floor(i / gx) % gy;
    const zi = Math.floor(i / (gx * gy)) % gz;
    const object = new THREE.Object3D();
    object.position.x = (xi * spacingGX) - offsetGX;
    object.position.y = - (yi * spacingGY) + offsetGY;
    object.position.z = (zi * spacingGZ) - offsetGZ;
    targets.grid.push(object);
  }

  // renderer (CSS3D)
  if (renderer) {
    // remove old renderer DOM if present
    const old = document.querySelector('#container > div');
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }
  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'absolute';
  document.getElementById('container').appendChild(renderer.domElement);

  // controls
  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener('change', render);

  // buttons
  document.getElementById('table').addEventListener('click', () => transform(targets.table, 2000));
  document.getElementById('sphere').addEventListener('click', () => transform(targets.sphere, 2000));
  document.getElementById('helix').addEventListener('click', () => transform(targets.helix, 2000));
  document.getElementById('grid').addEventListener('click', () => transform(targets.grid, 2000));

  // initial transform
  transform(targets.table, 2000);

  window.addEventListener('resize', onWindowResize, false);
}

function transform(targetsArr, duration) {
  TWEEN.removeAll();
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const target = targetsArr[i];
    if (!target) continue;
    new TWEEN.Tween(object.position)
      .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  }

  new TWEEN.Tween(this).to({}, duration * 2).onUpdate(render).start();
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  if (controls) controls.update();
}

function render() {
  if (renderer && scene && camera) renderer.render(scene, camera);
}

// keep a default export so bundlers/linting don't complain
export default {};
