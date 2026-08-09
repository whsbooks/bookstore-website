import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStorefront } from './storefront.js';

const canvas = document.getElementById('scene');
const hero = document.querySelector('.hero');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9d0e4');
scene.fog = new THREE.FogExp2('#c5d7e8', 0.012);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const desktopCam = new THREE.Vector3(6.2, 7.8, 11.5);
const desktopTarget = new THREE.Vector3(0.2, 2.4, -0.8);
const mobileCam = new THREE.Vector3(5.0, 7.4, 13.8);
const mobileTarget = new THREE.Vector3(0.15, 2.75, 0.15);
camera.position.copy(desktopCam);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enableZoom = false;
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 24;
controls.minPolarAngle = Math.PI * 0.22;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minAzimuthAngle = -0.45;
controls.maxAzimuthAngle = 0.75;
controls.target.copy(desktopTarget);
controls.update();

let isMobileView = false;
let wasMobile = null;
const mobileOrbit = {
  active: false,
  startX: 0,
  startY: 0,
  mode: null, // null | 'orbit' | 'scroll'
  spherical: new THREE.Spherical(),
  offset: new THREE.Vector3(),
};

function syncMobileOrbitFromCamera() {
  mobileOrbit.offset.copy(camera.position).sub(controls.target);
  mobileOrbit.spherical.setFromVector3(mobileOrbit.offset);
}

function applyResponsiveCamera() {
  const mobile = window.innerWidth < 800;
  const switching = wasMobile !== mobile;
  isMobileView = mobile;

  if (mobile) {
    // Custom horizontal drag + native vertical scroll (OrbitControls off)
    controls.enabled = false;
    camera.fov = window.innerWidth < 420 ? 50 : 46;
    if (switching || wasMobile === null) {
      camera.position.copy(mobileCam);
      controls.target.copy(mobileTarget);
      syncMobileOrbitFromCamera();
    }
  } else {
    controls.enabled = true;
    camera.fov = 42;
    if (wasMobile !== false) {
      camera.position.copy(desktopCam);
      controls.target.copy(desktopTarget);
    }
  }
  wasMobile = mobile;
  controls.update();
  camera.updateProjectionMatrix();
}

function resize() {
  const width = hero.clientWidth;
  const height = hero.clientHeight;
  camera.aspect = width / Math.max(height, 1);
  applyResponsiveCamera();
  renderer.setSize(width, height, false);
}

canvas.addEventListener(
  'touchstart',
  (e) => {
    if (!isMobileView || e.touches.length !== 1) return;
    mobileOrbit.active = true;
    mobileOrbit.mode = null;
    mobileOrbit.startX = e.touches[0].clientX;
    mobileOrbit.startY = e.touches[0].clientY;
    syncMobileOrbitFromCamera();
  },
  { passive: true }
);

canvas.addEventListener(
  'touchmove',
  (e) => {
    if (!isMobileView || !mobileOrbit.active || e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = x - mobileOrbit.startX;
    const dy = y - mobileOrbit.startY;

    if (!mobileOrbit.mode) {
      if (Math.abs(dx) + Math.abs(dy) < 10) return;
      mobileOrbit.mode = Math.abs(dx) > Math.abs(dy) * 1.05 ? 'orbit' : 'scroll';
      mobileOrbit.startX = x;
      mobileOrbit.startY = y;
      if (mobileOrbit.mode === 'scroll') return;
    }

    if (mobileOrbit.mode === 'scroll') return;

    e.preventDefault();
    const deltaX = x - mobileOrbit.startX;
    mobileOrbit.startX = x;
    mobileOrbit.spherical.theta -= deltaX * 0.005;
    mobileOrbit.spherical.theta = Math.max(
      -0.45,
      Math.min(0.75, mobileOrbit.spherical.theta)
    );
    mobileOrbit.spherical.phi = Math.max(
      Math.PI * 0.22,
      Math.min(Math.PI * 0.48, mobileOrbit.spherical.phi)
    );
    mobileOrbit.offset.setFromSpherical(mobileOrbit.spherical);
    camera.position.copy(controls.target).add(mobileOrbit.offset);
    camera.lookAt(controls.target);
  },
  { passive: false }
);

canvas.addEventListener(
  'touchend',
  () => {
    mobileOrbit.active = false;
    mobileOrbit.mode = null;
  },
  { passive: true }
);

canvas.addEventListener(
  'touchcancel',
  () => {
    mobileOrbit.active = false;
    mobileOrbit.mode = null;
  },
  { passive: true }
);

{
  const skyGeo = new THREE.SphereGeometry(60, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color('#7eb6de') },
      midColor: { value: new THREE.Color('#c4daf0') },
      bottomColor: { value: new THREE.Color('#e8eef4') },
      offset: { value: 2.2 },
      exponent: { value: 0.65 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        vec3 col = mix(bottomColor, midColor, smoothstep(0.0, 0.45, t));
        col = mix(col, topColor, smoothstep(0.35, 1.0, t));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));
}

scene.add(new THREE.HemisphereLight('#d7e8f7', '#b8a890', 1.05));
scene.add(new THREE.AmbientLight('#f2f6fa', 0.55));

const sun = new THREE.DirectionalLight('#fff4e0', 2.2);
sun.position.set(8, 14, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 45;
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -12;
sun.shadow.bias = -0.0002;
scene.add(sun);

const skyFill = new THREE.DirectionalLight('#a8c8e8', 0.65);
skyFill.position.set(-7, 9, 5);
scene.add(skyFill);

// Soft interior fill so the display book reads in morning light (no hard spotlight cone)
const windowFill = new THREE.PointLight('#fff6ea', 3.2, 6.5, 2);
windowFill.position.set(-1.15, 2.6, -0.35);
scene.add(windowFill);

for (const [x, z] of [
  [-2.5, -2.5],
  [0.5, -2.5],
  [3.0, -2.5],
]) {
  const pl = new THREE.PointLight('#fff0d4', 1.8, 7, 2);
  pl.position.set(x, 5.35, z);
  scene.add(pl);
}

async function init() {
  const loader = new THREE.TextureLoader();
  const coverMap = await loader.loadAsync(`${import.meta.env.BASE_URL}cover-01.png`);
  coverMap.colorSpace = THREE.SRGBColorSpace;
  coverMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const store = createStorefront(coverMap);
  scene.add(store);

  const count = 90;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = 0.8 + Math.random() * 7;
    positions[i * 3 + 2] = Math.random() * 10 - 1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.03,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    })
  );
  scene.add(particles);

  let t = 0;
  const book = store.userData.featuredBook;
  let dragging = false;
  controls.addEventListener('start', () => {
    dragging = true;
  });
  controls.addEventListener('end', () => {
    dragging = false;
  });

  resize();

  function animate() {
    requestAnimationFrame(animate);
    t += 0.006;
    particles.position.y = Math.sin(t * 0.4) * 0.08;
    if (book) {
      book.rotation.y = -0.12 + Math.sin(t * 0.45) * 0.03;
    }
    if (!isMobileView && !dragging) {
      camera.position.x += Math.sin(t * 0.2) * 0.0004;
      camera.position.y += Math.cos(t * 0.16) * 0.00025;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

init();

window.addEventListener('resize', resize);
