import * as THREE from 'three';
import {
  brickTexture,
  woodTexture,
  plasterTexture,
  sidewalkTexture,
  asphaltTexture,
  signTexture,
  hangingSignTexture,
  posterTexture,
  openSignTexture,
  hoursTexture,
  spineTexture,
  DEEP,
  WAVE,
  FOAM,
} from './textures.js';

function mat(opts) {
  return new THREE.MeshStandardMaterial(opts);
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addBook(group, x, y, z, w, h, d, coverColor, spineTitle, rotY = 0) {
  const spine = spineTexture(spineTitle, coverColor);
  const cover = mat({ color: coverColor, roughness: 0.55, metalness: 0.05 });
  const pages = mat({ color: '#f2eee6', roughness: 0.9 });
  const materials = [pages, pages, cover, cover, cover, cover];
  // Better: custom box with spine on +x
  const geo = new THREE.BoxGeometry(w, h, d);
  const m = [
    mat({ map: spine, roughness: 0.5 }), // +x spine
    cover, // -x
    pages, // +y
    pages, // -y
    cover, // +z front
    cover, // -z back
  ];
  const book = new THREE.Mesh(geo, m);
  book.position.set(x, y, z);
  book.rotation.y = rotY;
  book.castShadow = true;
  group.add(book);
  return book;
}

export function createStorefront(coverMap) {
  const root = new THREE.Group();
  root.name = 'storefront';

  const brickMap = brickTexture();
  brickMap.wrapS = brickMap.wrapT = THREE.RepeatWrapping;
  brickMap.repeat.set(3, 4);

  const woodMap = woodTexture('#4a3224');
  woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping;
  woodMap.repeat.set(2, 2);

  const lightWood = woodTexture('#8b6a4a');
  const plasterMap = plasterTexture();
  const sideWalk = sidewalkTexture();
  sideWalk.wrapS = sideWalk.wrapT = THREE.RepeatWrapping;
  sideWalk.repeat.set(6, 4);
  const roadMap = asphaltTexture();
  roadMap.wrapS = roadMap.wrapT = THREE.RepeatWrapping;
  roadMap.repeat.set(4, 2);

  const brickMat = mat({ map: brickMap, roughness: 0.92, metalness: 0.02 });
  const woodMat = mat({ map: woodMap, roughness: 0.7, metalness: 0.05 });
  const lightWoodMat = mat({ map: lightWood, roughness: 0.65 });
  const plasterMat = mat({ map: plasterMap, roughness: 0.88 });
  const darkMetal = mat({ color: '#1c2228', roughness: 0.35, metalness: 0.7 });
  const brass = mat({ color: '#b08d57', roughness: 0.35, metalness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#f4fbff',
    transparent: true,
    opacity: 0.1,
    roughness: 0.05,
    metalness: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const interiorWall = mat({ color: '#f3eee4', roughness: 0.9 });
  const floorMat = mat({ color: '#5a4536', roughness: 0.55, metalness: 0.05 });

  // --- Ground: road out front, sidewalk at the store, building not on asphalt ---
  // Layout (looking toward facade): camera → road → curb → sidewalk → storefront
  const sidewalkMat = mat({ map: sideWalk, roughness: 0.85 });
  const sidewalkDepth = 4.2;
  const sidewalkZ = 2.35; // front of facade (~0.4) to curb (~4.45)
  root.add(box(18, 0.12, sidewalkDepth, sidewalkMat, 0, 0.06, sidewalkZ));

  const curbZ = sidewalkZ + sidewalkDepth / 2 + 0.18;
  root.add(box(18, 0.2, 0.36, mat({ color: '#6e7276', roughness: 0.9 }), 0, 0.1, curbZ));

  const roadDepth = 9;
  const roadZ = curbZ + 0.18 + roadDepth / 2;
  root.add(box(18, 0.08, roadDepth, mat({ map: roadMap, roughness: 0.95 }), 0, 0.04, roadZ));
  for (let i = -3; i <= 3; i++) {
    root.add(box(1.2, 0.02, 0.12, mat({ color: '#c9b86a', roughness: 0.8 }), i * 2.4, 0.09, roadZ));
  }

  // --- Building shell ---
  const buildingW = 10;
  const buildingH = 7.2;
  const buildingD = 6;

  // Back & side walls (interior shell)
  root.add(box(buildingW, buildingH, 0.35, plasterMat, 0, buildingH / 2, -buildingD + 0.2));
  root.add(box(0.35, buildingH, buildingD, brickMat, -buildingW / 2, buildingH / 2, -buildingD / 2 + 0.15));
  root.add(box(0.35, buildingH, buildingD, brickMat, buildingW / 2, buildingH / 2, -buildingD / 2 + 0.15));

  // Floor interior
  root.add(box(buildingW - 0.4, 0.15, buildingD - 0.4, floorMat, 0, 0.08, -buildingD / 2 + 0.1));

  // Ceiling
  root.add(box(buildingW - 0.3, 0.2, buildingD - 0.3, mat({ color: '#f0ebe3', roughness: 0.9 }), 0, buildingH - 0.15, -buildingD / 2 + 0.1));

  // Front facade — coherent openings: left pier | window | mid pier | door | right pier
  const facadeZ = 0.15;
  const leftPierW = 1.2;
  const rightPierW = 1.1;
  const midPierW = 0.55;
  const leftPierX = -buildingW / 2 + leftPierW / 2; // -4.4
  const rightPierX = buildingW / 2 - rightPierW / 2; // 4.45
  const openLeft = leftPierX + leftPierW / 2; // -3.8
  const openRight = rightPierX - rightPierW / 2; // 3.9

  const doorOpenW = 1.85;
  const doorX = openRight - doorOpenW / 2; // ~2.975
  const midPierX = doorX - doorOpenW / 2 - midPierW / 2; // ~1.875

  const winW = midPierX - midPierW / 2 - openLeft; // ~5.4 span available
  const winX = openLeft + winW / 2;

  const groundTop = 3.9;
  const lintelH = 0.85;
  const lintelY = groundTop + lintelH / 2;
  const topStoryBottom = lintelY + lintelH / 2;
  const topStoryH = buildingH - topStoryBottom;
  const topStoryY = topStoryBottom + topStoryH / 2;

  root.add(box(leftPierW, groundTop + lintelH, 0.55, brickMat, leftPierX, (groundTop + lintelH) / 2, facadeZ));
  root.add(box(rightPierW, groundTop + lintelH, 0.55, brickMat, rightPierX, (groundTop + lintelH) / 2, facadeZ));

  root.add(box(midPierW, groundTop, 0.55, brickMat, midPierX, groundTop / 2, facadeZ));
  root.add(box(openRight - openLeft, lintelH, 0.55, brickMat, (openLeft + openRight) / 2, lintelY, facadeZ));
  // Upper plaster sits cleanly above the brick — no shared faces to flash
  root.add(box(buildingW, topStoryH, 0.55, plasterMat, 0, topStoryY, facadeZ));

  // Base plinth under window + piers only (door opening flush with sidewalk — no step)
  const plinthMat = mat({ color: '#3a342e', roughness: 0.8 });
  const plinthLeftW = openLeft - (-buildingW / 2) + winW + midPierW;
  const plinthLeftX = -buildingW / 2 + plinthLeftW / 2;
  root.add(box(plinthLeftW, 0.35, 0.55, plinthMat, plinthLeftX, 0.175, 0.18));
  root.add(box(rightPierW, 0.35, 0.55, plinthMat, rightPierX, 0.175, 0.18));

  // Cornice
  root.add(box(buildingW + 0.4, 0.28, 0.9, darkMetal, 0, 7.15, 0.2));
  root.add(box(buildingW + 0.2, 0.18, 0.55, brass, 0, 6.95, 0.35));

  // Second-floor windows (set slightly forward of plaster)
  for (const x of [-2.8, 0, 2.8]) {
    const frame = box(1.5, 1.7, 0.12, darkMetal, x, 5.85, 0.4);
    root.add(frame);
    const pane = box(1.25, 1.45, 0.05, glassMat, x, 5.85, 0.46);
    root.add(pane);
    root.add(box(0.06, 1.45, 0.06, darkMetal, x, 5.85, 0.48));
    root.add(box(1.25, 0.06, 0.06, darkMetal, x, 5.85, 0.48));
    root.add(box(1.15, 1.3, 0.04, mat({ color: '#c9b8a0', roughness: 0.95, transparent: true, opacity: 0.55 }), x, 5.85, 0.3));
  }

  // --- Main display window ---
  // Frame sits fully in front of the brick; stiles stop between rails (no left/right flashing)
  const winH = 3.15;
  const winY = 2.05;
  const frameT = 0.11;
  const frameD = 0.14;
  const pierFront = facadeZ + 0.55 / 2;
  const frameZ = pierFront + frameD / 2 + 0.04;
  const mullionT = 0.055;
  const mullionZ = frameZ + 0.02;

  // Top / bottom rails (full window width)
  root.add(box(winW, frameT, frameD, darkMetal, winX, winY + winH / 2 - frameT / 2, frameZ));
  root.add(box(winW, frameT, frameD, darkMetal, winX, winY - winH / 2 + frameT / 2, frameZ));
  // Left / right stiles — only between the rails
  const stileH = winH - frameT * 2;
  root.add(box(frameT, stileH, frameD, darkMetal, winX - winW / 2 + frameT / 2, winY, frameZ));
  root.add(box(frameT, stileH, frameD, darkMetal, winX + winW / 2 - frameT / 2, winY, frameZ));

  const clearW = winW - frameT * 2;
  const clearH = stileH;
  const clearX = winX;
  const clearY = winY;

  root.add(box(mullionT, clearH, mullionT, darkMetal, clearX, clearY, mullionZ));
  const halfClearW = (clearW - mullionT) / 2;
  root.add(box(halfClearW, mullionT, mullionT, darkMetal, clearX - (halfClearW + mullionT) / 2, clearY, mullionZ));
  root.add(box(halfClearW, mullionT, mullionT, darkMetal, clearX + (halfClearW + mullionT) / 2, clearY, mullionZ));

  const gap = 0.035;
  const paneW = halfClearW - gap * 2;
  const paneH = (clearH - mullionT) / 2 - gap * 2;
  const glassZ = mullionZ + 0.025;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.max(paneW, 0.05), Math.max(paneH, 0.05)),
        glassMat
      );
      pane.position.set(
        clearX + (sx * (halfClearW + mullionT)) / 2,
        clearY + sy * ((clearH - mullionT) / 4 + mullionT / 2),
        glassZ
      );
      pane.renderOrder = 2;
      root.add(pane);
    }
  }

  const backH = Math.min(winH - 0.1, groundTop - 0.35);
  const backY = 0.2 + backH / 2;
  root.add(
    box(winW - 0.25, backH, 0.08, mat({ color: '#f7f3eb', roughness: 0.95, emissive: '#f0ebe3', emissiveIntensity: 0.18 }), winX, backY, -1.35)
  );
  root.add(box(winW - 0.2, 0.35, 0.5, plasterMat, winX, groundTop - 0.15, -0.6));

  // Exterior sill only (outside under the frame)
  root.add(box(winW + 0.1, 0.08, 0.28, woodMat, winX, winY - winH / 2 - 0.06, frameZ + 0.08));

  // Interior display platform — fully inside the shop, layers stacked with no overlap
  const platformW = Math.min(winW - 0.55, 4.0);
  const platformDepth = 1.05;
  const platformZ = -0.65; // stays behind the glass (~0.5+)
  const floorY = 0.16;
  const deckH = 0.07;
  const riserH = 0.42;
  const riserMat = mat({ color: '#b59a78', roughness: 0.82 });
  root.add(box(platformW, riserH, platformDepth - 0.06, riserMat, winX, floorY + riserH / 2, platformZ));
  root.add(
    box(platformW + 0.04, deckH, platformDepth, lightWoodMat, winX, floorY + riserH + deckH / 2, platformZ)
  );
  const platformTop = floorY + riserH + deckH;

  // --- Door with a real glass opening (no wood behind the pane) ---
  const jambW = 0.1;
  const headH = 0.12;
  const doorLeafW = doorOpenW - jambW * 2;
  const doorH = groundTop - headH - 0.02;
  const doorY = 0.02 + doorH / 2;
  const doorZ = 0.45;
  const stileW = 0.14;
  const glassW = doorLeafW - stileW * 2;
  const glassH = 1.55;
  const glassCY = doorY + 0.35;
  const railH = 0.12;
  const bottomPanelH = glassCY - glassH / 2 - railH - 0.02;
  const topPanelH = doorY + doorH / 2 - (glassCY + glassH / 2 + railH);

  // Outer frame
  root.add(box(doorOpenW, headH, 0.24, darkMetal, doorX, doorY + doorH / 2 + headH / 2, 0.4));
  root.add(box(jambW, doorH + headH, 0.24, darkMetal, doorX - doorOpenW / 2 + jambW / 2, doorY + headH / 2, 0.4));
  root.add(box(jambW, doorH + headH, 0.24, darkMetal, doorX + doorOpenW / 2 - jambW / 2, doorY + headH / 2, 0.4));

  // Door leaf parts (opening left for glass)
  root.add(box(stileW, doorH, 0.09, woodMat, doorX - doorLeafW / 2 + stileW / 2, doorY, doorZ));
  root.add(box(stileW, doorH, 0.09, woodMat, doorX + doorLeafW / 2 - stileW / 2, doorY, doorZ));
  if (bottomPanelH > 0.05) {
    root.add(box(glassW, bottomPanelH, 0.09, woodMat, doorX, 0.02 + bottomPanelH / 2, doorZ));
  }
  root.add(box(glassW, railH, 0.09, woodMat, doorX, glassCY - glassH / 2 - railH / 2, doorZ));
  root.add(box(glassW, railH, 0.09, woodMat, doorX, glassCY + glassH / 2 + railH / 2, doorZ));
  if (topPanelH > 0.05) {
    root.add(
      box(glassW, topPanelH, 0.09, woodMat, doorX, glassCY + glassH / 2 + railH + topPanelH / 2, doorZ)
    );
  }

  // Glass only in the opening
  const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(glassW - 0.02, glassH - 0.02), glassMat);
  doorGlass.position.set(doorX, glassCY, doorZ + 0.02);
  doorGlass.renderOrder = 2;
  root.add(doorGlass);

  root.add(box(0.07, 0.5, 0.07, brass, doorX - doorLeafW / 2 + 0.16, doorY - 0.1, doorZ + 0.1));
  root.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), brass)).position.set(
    doorX - doorLeafW / 2 + 0.16,
    doorY + 0.15,
    doorZ + 0.14
  );
  root.add(box(doorLeafW - 0.04, 0.28, 0.04, brass, doorX, 0.2, doorZ + 0.06));
  root.add(box(doorOpenW, 0.03, 0.4, darkMetal, doorX, 0.03, 0.45));

  const openTex = openSignTexture();
  const openSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.3),
    mat({ map: openTex, roughness: 0.5, emissive: '#0a4020', emissiveIntensity: 0.25, depthWrite: false })
  );
  openSign.position.set(doorX, glassCY + 0.35, doorZ + 0.05);
  openSign.renderOrder = 3;
  root.add(openSign);

  const hoursTex = hoursTexture();
  const hours = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.34),
    mat({ map: hoursTex, roughness: 0.6 })
  );
  hours.position.set(rightPierX, 1.55, 0.48);
  root.add(hours);

  // --- Main storefront sign ---
  const mainSignTex = signTexture();
  const mainSign = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 1.05, 0.18),
    [
      darkMetal, darkMetal, darkMetal, darkMetal,
      mat({ map: mainSignTex, roughness: 0.4, emissive: DEEP, emissiveMap: mainSignTex, emissiveIntensity: 0.35 }),
      darkMetal,
    ]
  );
  mainSign.position.set(-0.4, 4.15, 0.55);
  mainSign.castShadow = true;
  root.add(mainSign);

  // Sign fixtures (daytime — dim, not glowing hard)
  for (const x of [-2.8, -0.4, 2.0]) {
    root.add(box(0.35, 0.08, 0.35, brass, x, 4.75, 0.7));
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 12),
      mat({ color: '#e8e0d0', emissive: '#d8d0c0', emissiveIntensity: 0.2, roughness: 0.45 })
    );
    bulb.position.set(x, 4.68, 0.78);
    root.add(bulb);
  }

  // --- Hanging blade sign ---
  const hangTex = hangingSignTexture();
  const hang = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.1, 0.85),
    [
      mat({ map: hangTex, roughness: 0.45, emissive: DEEP, emissiveIntensity: 0.2 }),
      mat({ map: hangTex, roughness: 0.45 }),
      darkMetal, darkMetal, darkMetal, darkMetal,
    ]
  );
  hang.position.set(-5.15, 3.4, 0.7);
  root.add(hang);
  // Bracket
  root.add(box(0.5, 0.05, 0.05, darkMetal, -4.85, 4.0, 0.7));
  root.add(box(0.05, 0.05, 0.7, darkMetal, -5.15, 4.0, 0.45));
  // Chains
  for (const z of [0.4, 1.0]) {
    root.add(box(0.02, 0.55, 0.02, darkMetal, -5.15, 3.95, z));
  }

  // --- Awning ---
  const awningGroup = new THREE.Group();
  const awningMat = mat({ color: DEEP, roughness: 0.7, side: THREE.DoubleSide });
  const stripeMat = mat({ color: WAVE, roughness: 0.7, side: THREE.DoubleSide });
  for (let i = 0; i < 10; i++) {
    const stripe = box(0.62, 0.04, 1.5, i % 2 ? awningMat : stripeMat, -4.5 + i * 0.62 + 0.31, 3.55, 1.05);
    stripe.rotation.x = -0.35;
    awningGroup.add(stripe);
  }
  // Awning valance scallops
  for (let i = 0; i < 10; i++) {
    const scallop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.58, 16, 1, false, 0, Math.PI),
      i % 2 ? awningMat : stripeMat
    );
    scallop.rotation.z = Math.PI / 2;
    scallop.rotation.y = Math.PI / 2;
    scallop.position.set(-4.5 + i * 0.62 + 0.31, 3.22, 1.72);
    awningGroup.add(scallop);
  }
  // Awning rods
  awningGroup.add(box(6.2, 0.04, 0.04, darkMetal, -1.15, 3.72, 0.5));
  awningGroup.add(box(6.2, 0.04, 0.04, darkMetal, -1.15, 3.35, 1.55));
  root.add(awningGroup);

  // --- Featured book display (on the interior platform) ---
  const display = new THREE.Group();
  display.position.set(winX, platformTop, platformZ + 0.15);

  // Pedestal
  const pedestal = box(0.7, 0.7, 0.7, lightWoodMat, 0, 0.35, 0);
  display.add(pedestal);
  display.add(box(0.82, 0.05, 0.82, woodMat, 0, 0.725, 0));

  // Featured book — uses real cover, facing the street
  const bookW = 0.52;
  const bookH = 0.74;
  const bookD = 0.07;
  const coverMat = mat({ map: coverMap, roughness: 0.4, metalness: 0 });
  const pageMat = mat({ color: '#f4f0e8', roughness: 0.85 });
  const spineMat = mat({ color: DEEP, roughness: 0.5 });
  const featured = new THREE.Mesh(new THREE.BoxGeometry(bookW, bookH, bookD), [
    spineMat,
    pageMat,
    pageMat,
    pageMat,
    coverMat,
    mat({ color: FOAM, roughness: 0.5 }),
  ]);
  featured.position.set(0, 1.14, 0.05);
  featured.rotation.y = -0.12;
  featured.castShadow = true;
  display.add(featured);

  // Second copy slightly behind
  const copy2 = featured.clone();
  copy2.position.set(0.12, 1.1, -0.12);
  copy2.rotation.y = 0.28;
  copy2.scale.set(0.92, 0.92, 0.92);
  display.add(copy2);

  display.add(
    box(0.5, 0.02, 0.35, mat({ color: '#cfd8e0', roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.45 }), 0, 0.76, 0.05)
  );

  const plaqueTex = posterTexture();
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.28),
    mat({
      map: makeSmallPlaque(),
      roughness: 0.5,
    })
  );
  plaque.position.set(0, 0.4, 0.38);
  display.add(plaque);

  root.add(display);

  // Window posters on sides (inside, not covering the book)
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.85),
    mat({ map: plaqueTex, roughness: 0.55 })
  );
  poster.position.set(winX + 2.15, 2.35, -0.9);
  root.add(poster);

  const poster2 = poster.clone();
  poster2.position.set(winX - 2.15, 2.35, -0.9);
  root.add(poster2);

  // --- Interior bookshelves ---
  const shelfMat = woodMat;
  for (const sx of [-3.2, -0.2, 2.8]) {
    const unit = new THREE.Group();
    unit.position.set(sx, 0, -4.6);
    // Cabinet body
    unit.add(box(2.2, 3.8, 0.45, shelfMat, 0, 1.95, 0));
    // Shelves
    for (let s = 0; s < 5; s++) {
      unit.add(box(2.05, 0.06, 0.42, lightWoodMat, 0, 0.45 + s * 0.7, 0.02));
      // Books on shelf
      let bx = -0.85;
      while (bx < 0.85) {
        const bw = 0.06 + Math.random() * 0.05;
        const bh = 0.28 + Math.random() * 0.22;
        const colors = [DEEP, WAVE, '#2c3e50', '#4a3728', '#5c1a1a', '#1a3c4a', '#3d4f2f'];
        const c = colors[Math.floor(Math.random() * colors.length)];
        addBook(unit, bx, 0.45 + s * 0.7 + bh / 2 + 0.03, 0.05, bw, bh, 0.28, c, '책', 0);
        bx += bw + 0.01;
      }
    }
    root.add(unit);
  }

  // Interior pendant lights
  for (const x of [-2.5, 0.5, 3.0]) {
    const cord = box(0.02, 1.2, 0.02, darkMetal, x, 6.2, -2.5);
    root.add(cord);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.35, 24, 1, true),
      mat({ color: '#e8dcc8', roughness: 0.6, side: THREE.DoubleSide })
    );
    shade.position.set(x, 5.5, -2.5);
    root.add(shade);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      mat({ color: '#fff6e4', emissive: '#ffe7b8', emissiveIntensity: 0.55 })
    );
    glow.position.set(x, 5.4, -2.5);
    root.add(glow);
  }

  // Counter near door inside
  root.add(box(2.0, 1.05, 0.7, woodMat, doorX, 0.6, -2.2));
  root.add(box(2.0, 0.08, 0.75, lightWoodMat, doorX, 1.15, -2.2));

  // --- Exterior details ---
  // Planters
  for (const px of [-4.6, 4.6]) {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.42, 0.55, 16),
      mat({ color: '#4a4038', roughness: 0.85 })
    );
    pot.position.set(px, 0.4, 1.35);
    pot.castShadow = true;
    root.add(pot);
    // Foliage
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 12, 12),
      mat({ color: '#2f5c3a', roughness: 0.95 })
    );
    foliage.position.set(px, 0.95, 1.35);
    foliage.castShadow = true;
    root.add(foliage);
    const foliage2 = foliage.clone();
    foliage2.scale.set(0.7, 0.85, 0.7);
    foliage2.position.set(px + 0.15, 1.15, 1.4);
    root.add(foliage2);
  }

  // Street lamp
  const lamp = new THREE.Group();
  lamp.position.set(6.2, 0, 2.2);
  lamp.add(box(0.12, 3.6, 0.12, darkMetal, 0, 1.8, 0));
  lamp.add(box(0.8, 0.06, 0.08, darkMetal, 0.25, 3.55, 0));
  const lampHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
    mat({ color: '#222', roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide })
  );
  lampHead.position.set(0.55, 3.45, 0);
  lamp.add(lampHead);
  const lampGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 12),
    mat({ color: '#d8d2c4', emissive: '#cfc8b8', emissiveIntensity: 0.15 })
  );
  lampGlow.position.set(0.55, 3.4, 0);
  lamp.add(lampGlow);
  root.add(lamp);

  // Bike rack + bike silhouette
  root.add(box(1.4, 0.05, 0.05, darkMetal, 5.5, 0.35, 1.5));
  root.add(box(0.05, 0.55, 0.05, darkMetal, 4.9, 0.35, 1.5));
  root.add(box(0.05, 0.55, 0.05, darkMetal, 6.1, 0.35, 1.5));

  // Doormat
  root.add(box(1.15, 0.03, 0.7, mat({ color: '#3a4a3a', roughness: 1 }), doorX, 0.14, 1.05));

  // Address number on right pier
  const addr = makeCanvasNumber('17');
  const addrPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.26),
    mat({ map: addr, roughness: 0.4, metalness: 0.3 })
  );
  addrPlate.position.set(rightPierX, 2.15, 0.48);
  root.add(addrPlate);

  // Window LED strip inside top
  // Soft accent strip inside the window (morning, not a hard LED beam)
  root.add(
    box(winW - 0.4, 0.03, 0.03, mat({ color: '#f2efe8', emissive: '#efe8dc', emissiveIntensity: 0.25 }), winX, winY + winH / 2 - 0.25, -0.15)
  );

  // Neighbor buildings (simple depth)
  root.add(box(4, 8, 5, mat({ color: '#5a4a42', roughness: 0.9 }), -9.5, 4, -2));
  root.add(box(5, 6.5, 5.5, mat({ color: '#4a5560', roughness: 0.9 }), 10, 3.25, -2.2));
  root.add(box(2.2, 0.45, 0.1, mat({ color: '#1e4a6b', roughness: 0.5 }), 10, 4.8, 0.55));

  // Wet reflection strips on sidewalk
  for (let i = 0; i < 8; i++) {
    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(0.15 + Math.random() * 0.25, 16),
      mat({ color: '#6a7a88', roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.35 })
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(-6 + Math.random() * 12, 0.13, 0.5 + Math.random() * 3);
    root.add(puddle);
  }

  // Extra window-table books (supporting display) — on the interior platform only
  const stackColors = [WAVE, '#1a3c4a', '#4a3728', '#2c3e50'];
  for (let i = 0; i < 4; i++) {
    addBook(
      root,
      winX - 1.35 + i * 0.2,
      platformTop + 0.14 + i * 0.03,
      platformZ - 0.15,
      0.18,
      0.26,
      0.04,
      stackColors[i],
      '수영',
      0.4 + i * 0.1
    );
  }
  // Standing books beside pedestal
  for (let i = 0; i < 5; i++) {
    addBook(
      root,
      winX + 1.25 + i * 0.08,
      platformTop + 0.18 + (i % 3) * 0.02,
      platformZ + 0.05,
      0.05,
      0.3 + (i % 3) * 0.04,
      0.2,
      stackColors[i % stackColors.length],
      '책',
      0.05
    );
  }

  // Security camera
  root.add(box(0.18, 0.1, 0.28, darkMetal, 4.6, 3.55, 0.55));
  const camLens = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 12),
    mat({ color: '#111', roughness: 0.2, metalness: 0.8 })
  );
  camLens.position.set(4.6, 3.5, 0.72);
  root.add(camLens);

  // Wall lantern on mid pier beside door
  const lantern = new THREE.Group();
  lantern.position.set(midPierX, 2.55, 0.55);
  lantern.add(box(0.08, 0.25, 0.08, brass, 0, 0.25, 0));
  const lanternCage = box(0.28, 0.4, 0.28, darkMetal, 0, 0, 0.05);
  lantern.add(lanternCage);
  const lanternGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 12),
    mat({ color: '#e8dcc0', emissive: '#d4c4a0', emissiveIntensity: 0.25 })
  );
  lanternGlow.position.set(0, 0, 0.05);
  lantern.add(lanternGlow);
  root.add(lantern);

  // Vertical fabric banner
  const bannerTex = makeBannerTexture();
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 2.4),
    mat({ map: bannerTex, side: THREE.DoubleSide, roughness: 0.85 })
  );
  banner.position.set(-5.35, 2.4, 0.35);
  root.add(banner);
  root.add(box(0.6, 0.06, 0.06, darkMetal, -5.35, 3.65, 0.35));

  // Mail slot on lower door panel
  root.add(box(0.45, 0.08, 0.04, brass, doorX, Math.max(0.55, bottomPanelH * 0.55), doorZ + 0.06));

  // Interior reading chair (simple)
  const chair = new THREE.Group();
  chair.position.set(-3.6, 0.15, -2.4);
  chair.add(box(0.55, 0.08, 0.55, woodMat, 0, 0.4, 0));
  chair.add(box(0.55, 0.55, 0.08, woodMat, 0, 0.7, -0.24));
  chair.add(box(0.06, 0.4, 0.06, darkMetal, -0.22, 0.2, 0.22));
  chair.add(box(0.06, 0.4, 0.06, darkMetal, 0.22, 0.2, 0.22));
  chair.add(box(0.06, 0.4, 0.06, darkMetal, -0.22, 0.2, -0.22));
  chair.add(box(0.06, 0.4, 0.06, darkMetal, 0.22, 0.2, -0.22));
  root.add(chair);

  // Ceiling fixtures (subtle daytime presence)
  for (const x of [-2.5, -1.15, 0.2]) {
    root.add(box(0.18, 0.06, 0.18, darkMetal, x, 6.85, -1.0));
  }

  // Facade decorative brick soldier course — only on piers, not under the window frame
  for (const [startX, count] of [
    [-4.7, 3],
    [midPierX - 0.15, 1],
    [rightPierX - 0.35, 3],
  ]) {
    for (let i = 0; i < count; i++) {
      root.add(
        box(
          0.38,
          0.16,
          0.1,
          mat({ color: i % 2 ? '#5a3a2c' : '#6e4a38', roughness: 0.9 }),
          startX + i * 0.45,
          0.48,
          pierFront + 0.06
        )
      );
    }
  }

  // Roof edge tiles suggestion
  for (let i = 0; i < 22; i++) {
    const tile = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.55, 8, 1, false, 0, Math.PI),
      mat({ color: '#2a3038', roughness: 0.7, metalness: 0.3 })
    );
    tile.rotation.z = Math.PI / 2;
    tile.position.set(-5.1 + i * 0.48, 7.35, 0.55);
    root.add(tile);
  }

  // Spotlights for display (invisible helpers — real lights added in main)
  root.userData.displayFocus = new THREE.Vector3(winX, 1.5, 0.1);
  root.userData.featuredBook = featured;

  return root;
}

function makeBannerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, DEEP);
  g.addColorStop(1, '#062438');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 1024);
  ctx.fillStyle = FOAM;
  ctx.textAlign = 'center';
  const chars = ['수', '영', '의', '서', '점'];
  ctx.font = '700 88px "Noto Sans KR", sans-serif';
  chars.forEach((ch, i) => {
    ctx.fillText(ch, 128, 160 + i * 150);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSmallPlaque() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = DEEP;
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = WAVE;
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 488, 232);
  ctx.fillStyle = FOAM;
  ctx.textAlign = 'center';
  ctx.font = '600 42px "Noto Sans KR", sans-serif';
  ctx.fillText('수영 · 그 예술', 256, 110);
  ctx.font = 'italic 32px "Cormorant Garamond", serif';
  ctx.fillText('Swimming the Art', 256, 170);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCanvasNumber(n) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a1e22';
  ctx.fillRect(0, 0, 256, 200);
  ctx.fillStyle = FOAM;
  ctx.font = '700 110px "Cormorant Garamond", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(n, 128, 100);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
