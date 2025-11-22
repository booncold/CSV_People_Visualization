// js/main.js
import { fetchSheetData } from './data.js';

let camera, scene, renderer, controls;
const objects = [];
const targets = [];

init();

async function init() {
  const container = document.getElementById('container');

  // camera
  camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 10000);
  camera.position.set(0, 0, 2500);

  scene = new THREE.Scene();

  // CSS3D renderer
  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.domElement.style.position = 'absolute';
  container.appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // load data
  let data = [];
  try {
    data = await fetchSheetData();
    console.log('Loaded rows:', data.length);
  } catch (e) {
    console.error(e);
    const msg = document.createElement('div');
    msg.style.color = 'red';
    msg.style.padding = '16px';
    msg.textContent = 'Failed to load CSV data. See console for details.';
    container.appendChild(msg);
    return;
  }

  // Use up to 200 tiles (20x10)
  const count = Math.min(200, data.length);

  for (let i = 0; i < count; i++) {
    const p = data[i];

    const el = document.createElement('div');
    el.className = 'element';

    // photo
    const photo = document.createElement('div');
    photo.className = 'photo';
    if (p.photo) photo.style.backgroundImage = `url("${p.photo}")`;
    el.appendChild(photo);

    // name
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name || 'Unknown';
    el.appendChild(name);

    // meta (country • age)
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${p.country || ''}${p.country && p.age ? ' • ' : ''}${p.age || ''}`;
    el.appendChild(meta);

    // net worth
    const net = document.createElement('div');
    net.className = 'networth';
    net.textContent = p.netWorth ? ('$' + p.netWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })) : '$0';
    el.appendChild(net);

    // color background based on netWorth
    if (p.netWorth < 100000) {
      el.style.background = '#9b1b1b'; // red
    } else if (p.netWorth >= 100000 && p.netWorth < 200000) {
      el.style.background = '#b86b14'; // orange
    } else {
      el.style.background = '#1b8a3b'; // green
    }

    // hover interactions (optional)
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'translateY(-8px)';
      el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.7)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.6)';
    });

    // create CSS3DObject
    const obj = new THREE.CSS3DObject(el);
    obj.position.x = Math.random() * 4000 - 2000;
    obj.position.y = Math.random() * 4000 - 2000;
    obj.position.z = Math.random() * 4000 - 2000;
    scene.add(obj);
    objects.push(obj);
  }

  // Create table targets (20 columns x 10 rows)
  const cols = 20;
  const rows = 10;
  const hSpacing = 160;
  const vSpacing = 220;

  const startX = -(cols - 1) * hSpacing / 2;
  const startY = (rows - 1) * vSpacing / 2;

  for (let i = 0; i < objects.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const target = new THREE.Object3D();
    target.position.x = startX + col * hSpacing;
    target.position.y = startY - row * vSpacing;
    target.position.z = 0;
    targets.push(target);
  }

  // Snap objects to table positions
  for (let i = 0; i < objects.length; i++) {
    objects[i].position.copy(targets[i].position);
    objects[i].rotation.copy(targets[i].rotation);
  }

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  const container = document.getElementById('container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
