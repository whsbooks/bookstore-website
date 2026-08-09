import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStorefront } from './storefront.js';

const canvas = document.getElementById('scene');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0d1822');
scene.fog = new THREE.FogExp2('#0d1822', 0.028);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(3.8, 2.6, 9.5);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 2.2, 0);
controls.update();

// Environment / sky gradient via large hemisphere
{
  const skyGeo = new THREE.SphereGeometry(60, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color('#1a3048') },
      bottomColor: { value: new THREE.Color('#0a1218') },
      offset: { value: 4 },
      exponent: { value: 0.55 },
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
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));
}

// Lights
const hemi = new THREE.HemisphereLight('#8aa4c0', '#2a2218', 0.55);
scene.add(hemi);

const ambient = new THREE.AmbientLight('#6a7e92', 0.25);
scene.add(ambient);

const moon = new THREE.DirectionalLight('#b8cce0', 0.55);
moon.position.set(-8, 14, 6);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 40;
moon.shadow.camera.left = -15;
moon.shadow.camera.right = 15;
moon.shadow.camera.top = 15;
moon.shadow.camera.bottom = -10;
moon.shadow.bias = -0.0002;
scene.add(moon);

const warmFill = new THREE.DirectionalLight('#ffd8a8', 0.35);
warmFill.position.set(6, 5, 8);
scene.add(warmFill);

// Window display spotlight
const spot = new THREE.SpotLight('#fff2d8', 28, 14, Math.PI / 5.5, 0.45, 1.2);
spot.position.set(-1.2, 4.2, 2.5);
spot.target.position.set(-1.15, 1.3, -0.3);
spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024);
scene.add(spot);
scene.add(spot.target);

// Interior warm lights
for (const [x, z] of [[-2.5, -2.5], [0.5, -2.5], [3.0, -2.5]]) {
  const pl = new THREE.PointLight('#ffd9a0', 4.5, 8, 2);
  pl.position.set(x, 5.35, z);
  scene.add(pl);
}

// Sign wash
const signLight = new THREE.PointLight('#9ec8ff', 3.5, 6, 2);
signLight.position.set(-0.4, 4.3, 1.4);
scene.add(signLight);

// Street lamp light
const streetLamp = new THREE.PointLight('#ffcc77', 6, 10, 2);
streetLamp.position.set(6.75, 3.4, 2.2);
scene.add(streetLamp);

// Awning underglow
const awningGlow = new THREE.PointLight('#3C6382', 2.2, 5, 2);
awningGlow.position.set(-1.15, 3.2, 1.2);
scene.add(awningGlow);

async function init() {
  const loader = new THREE.TextureLoader();
  const coverMap = await loader.loadAsync('/cover-01.png');
  coverMap.colorSpace = THREE.SRGBColorSpace;
  coverMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const store = createStorefront(coverMap);
  scene.add(store);

  // Floating dust / night particles
  const count = 280;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = Math.random() * 8;
    positions[i * 3 + 2] = Math.random() * 10 - 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: '#cfe3f5',
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    })
  );
  scene.add(particles);

  // Subtle camera intro drift
  let t = 0;
  const book = store.userData.featuredBook;

  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    particles.rotation.y = t * 0.02;
    if (book) {
      book.position.y = 1.22 + Math.sin(t * 0.9) * 0.012;
      book.rotation.y = -0.18 + Math.sin(t * 0.5) * 0.04;
    }
    // Gentle neon pulse on sign light
    signLight.intensity = 3.2 + Math.sin(t * 2.2) * 0.45;
    spot.intensity = 26 + Math.sin(t * 1.4) * 2;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

init();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
