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
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9d0e4');
scene.fog = new THREE.FogExp2('#c5d7e8', 0.016);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.35, 2.35, 8.6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 5;
controls.maxDistance = 14;
controls.minPolarAngle = Math.PI * 0.28;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minAzimuthAngle = -0.55;
controls.maxAzimuthAngle = 0.55;
controls.target.set(-0.4, 2.15, 0.2);
controls.update();

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

const hemi = new THREE.HemisphereLight('#d7e8f7', '#b8a890', 0.95);
scene.add(hemi);

const ambient = new THREE.AmbientLight('#f2f6fa', 0.45);
scene.add(ambient);

const sun = new THREE.DirectionalLight('#fff4e0', 2.1);
sun.position.set(7.5, 11, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -10;
sun.shadow.bias = -0.0002;
scene.add(sun);

const skyFill = new THREE.DirectionalLight('#a8c8e8', 0.55);
skyFill.position.set(-6, 8, 4);
scene.add(skyFill);

const windowWash = new THREE.SpotLight('#fff8ef', 12, 16, Math.PI / 5, 0.5, 1.1);
windowWash.position.set(-1.0, 5.2, 4.2);
windowWash.target.position.set(-1.15, 1.4, -0.2);
windowWash.castShadow = true;
scene.add(windowWash);
scene.add(windowWash.target);

for (const [x, z] of [
  [-2.5, -2.5],
  [0.5, -2.5],
  [3.0, -2.5],
]) {
  const pl = new THREE.PointLight('#fff0d4', 1.6, 7, 2);
  pl.position.set(x, 5.35, z);
  scene.add(pl);
}

const signLight = new THREE.PointLight('#ffffff', 1.2, 5, 2);
signLight.position.set(-0.4, 4.4, 1.5);
scene.add(signLight);

async function init() {
  const loader = new THREE.TextureLoader();
  const coverMap = await loader.loadAsync(`${import.meta.env.BASE_URL}cover-01.png`);
  coverMap.colorSpace = THREE.SRGBColorSpace;
  coverMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const store = createStorefront(coverMap);
  scene.add(store);

  const count = 120;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = 0.5 + Math.random() * 6;
    positions[i * 3 + 2] = Math.random() * 8 - 1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.028,
      transparent: true,
      opacity: 0.28,
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

  function animate() {
    requestAnimationFrame(animate);
    t += 0.006;
    particles.position.y = Math.sin(t * 0.4) * 0.08;
    if (book) {
      book.position.y = 1.22 + Math.sin(t * 0.8) * 0.01;
      book.rotation.y = -0.18 + Math.sin(t * 0.45) * 0.03;
    }
    if (!dragging) {
      camera.position.x += Math.sin(t * 0.22) * 0.00035;
      camera.position.y += Math.cos(t * 0.18) * 0.0002;
    }
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
