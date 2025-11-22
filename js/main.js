// js/main.js
// Creates window.showTablePage() which hides the login page and builds the 3D view
import { fetchSheetData } from './data.js';

// Use CDN imports so the project works without local threejs files.
// You can change the version if needed.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import TWEEN from 'https://unpkg.com/three@0.160.0/examples/jsm/libs/tween.module.js';
import { TrackballControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS3DRenderer.js';

let camera, scene, renderer, controls;
const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };

// Expose the function so index.html can call it after login
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

  // Initialize visualization
  init(rows);
  animate();
};

function createTile(row, index) {
  const element = document.createElement('div');
  element.className = 'element';
  // base styling
  element.style.width = '160px';
  element.style.height = '200px';
  element.style.boxSizing = 'border-box';
  element.style.padding = '10px';
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'flex-start';
  element.style.borderRadius = '10px';
  element.style.color = '#fff';
  element.style.fontFamily = 'Helvetica, Arial, sans-serif';
  element.style.backdropFilter = 'blur(2px)';
  element.style.overflow = 'hidden';
  element.style.border = '1px solid rgba(255,255,255,0.06)';
  element.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';

  // background color by netWorth thresholds
  const nw = row.netWorth;
  if (nw == null || isNaN(nw)) {
    element.style.background = 'linear-gradient(180deg, rgba(80,80,80,0.95), rgba(60,60,60,0.95))';
  } else if (nw < 100000) {
    element.style.background = 'linear-gradient(180deg,#b22222,#8b1a1a)'; // red
  } else if (nw < 200000) {
    element.style.background = 'linear-gradient(180deg,#ff8c00,#c86b00)'; // orange
  } else {
    element.style.background = 'linear-gradient(180deg,#2e8b57,#236b44)'; // green
  }

  // avatar / photo
  const img = document.createElement('img');
  img.src = row.photo || '';
  img.alt = row.name || '';
  img.style.width = '96px';
  img.style.height = '96px';
  img.style.objectFit = 'cover';
  img.style.borderRadius = '50%';
  img.style.border = '2px solid rgba(255,255,255,0.14)';
  img.style.marginTop = '6px';
  element.appendChild(img);

  // name
  const name = document.createElement('div');
  name.textContent = row.name || '(no name)';
  name.style.fontSize = '14px';
  name.style.fontWeight = '700';
  name.style.marginTop = '8px';
  name.style.textAlign = 'center';
  element.appendChild(name);

  // details
  const details = document.createElement('div');
  details.style.fontSize = '12px';
  details.style.marginTop = '6px';
  details.style.textAlign = 'center';
  details.style.lineHeight = '1.2';
  const netStr = (row.netWorth != null && !isNaN(row.netWorth)) ? '$' + Number(row.netWorth).toLocaleString() : '-';
  details.innerHTML = `
    Age: ${row.age || '-'}<br>
    Country: ${row.country || '-'}<br>
    Interest: ${row.interest || '-'}<br>
    Net: ${netStr}
  `;
  element.appendChild(details);

  // small index number
  const badge = document.createElement('div');
  badge.textContent = (index + 1);
  badge.style.position = 'absolute';
  badge.style.right = '10px';
  badge.style.top = '8px';
  badge.style.fontSize = '11px';
  badge.style.opacity = '0.9';
  element.appendChild(badge);

  const obj = new CSS3DObject(element);
  return obj;
}

function init(dataRows) {
  // reset arrays & scene
  objects.length = 0;
  targets.table.length = targets.sphere.length = targets.helix.length = targets.grid.length = 0;

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 3000;

  scene = new THREE.Scene();

  // create CSS3D objects
  dataRows.forEach((row, i) => {
    const objectCSS = createTile(row, i);
    objectCSS.position.x = Math.random() * 4000 - 2000;
    objectCSS.position.y = Math.random() * 4000 - 2000;
    objectCSS.position.z = Math.random() * 4000 - 2000;
    scene.add(objectCSS);
    objects.push(objectCSS);
  });

  // TABLE: 20x10 (cols x rows)
  const cols = 20;
  const rows = 10;
  const spacingX = 180;
  const spacingY = 220;
  const offsetX = (cols - 1) * spacingX / 2;
  const offsetY = (rows - 1) * spacingY / 2;
  for (let i = 0; i < objects.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols) % rows;
    const layer = Math.floor(i / (cols * rows)); // if more than 200, put into layers
    const object = new THREE.Object3D();
    object.position.x = (col * spacingX) - offsetX;
    object.position.y = - (row * spacingY) + offsetY;
    object.position.z = (layer * 420) - 420; // small z offset per layer
    targets.table.push(object);
  }

  // SPHERE
  const vector = new THREE.Vector3();
  for (let i = 0, l = objects.length; i < l; i++) {
    const phi = Math.acos(-1 + (2 * i) / l);
    const theta = Math.sqrt(l * Math.PI) * phi;
    const object = new THREE.Object3D();
    object.position.setFromSphericalCoords(800, phi, theta);
    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);
    targets.sphere.push(object);
  }

  // DOUBLE HELIX (two intertwined strands)
  const helixRadius = 600;
  // We'll interleave items on two strands, keeping ordering along the helix
  for (let i = 0, l = objects.length; i < l; i++) {
    const strand = i % 2; // 0 or 1
    const idx = Math.floor(i / 2);
    const theta = idx * 0.5 + (strand === 0 ? 0 : Math.PI); // phase offset
    const y = - (idx * 18) + (l / 4);
    const object = new THREE.Object3D();
    object.position.x = Math.cos(theta) * helixRadius;
    object.position.z = Math.sin(theta) * helixRadius;
    object.position.y = y;
    const vec = new THREE.Vector3(object.position.x * 2, object.position.y, object.position.z * 2);
    object.lookAt(vec);
    targets.helix.push(object);
  }

  // GRID: 5 x 4 x 10 (x,y,z)
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

  // renderer
  if (renderer) {
    // remove old DOM element
    const old = document.querySelector('#container > canvas, #container > div');
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

  // button hooks
  document.getElementById('table').addEventListener('click', () => transform(targets.table, 2000));
  document.getElementById('sphere').addEventListener('click', () => transform(targets.sphere, 2000));
  document.getElementById('helix').addEventListener('click', () => transform(targets.helix, 2000));
  document.getElementById('grid').addEventListener('click', () => transform(targets.grid, 2000));

  // initial layout
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

// keep an initial export to make linter happy; primary API is window.showTablePage
export default {};
