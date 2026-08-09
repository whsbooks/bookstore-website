import * as THREE from 'three';

const DEEP = '#0A3D62';
const WAVE = '#3C6382';
const FOAM = '#F5F7FA';

export function makeCanvasTexture(draw, width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function brickTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#6a4a3a';
    ctx.fillRect(0, 0, w, h);
    const rows = 16;
    const cols = 8;
    const bh = h / rows;
    const bw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (bw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * bw + offset;
        const y = r * bh;
        const shade = 0.85 + Math.random() * 0.2;
        const R = Math.floor(118 * shade);
        const G = Math.floor(72 * shade);
        const B = Math.floor(52 * shade);
        ctx.fillStyle = `rgb(${R},${G},${B})`;
        ctx.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
        ctx.strokeStyle = 'rgba(40,24,16,0.35)';
        ctx.strokeRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      }
    }
  }, 1024, 1024);
}

export function woodTexture(tone = '#5c3d28') {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = tone;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const y = (i / 90) * h;
      ctx.strokeStyle = `rgba(30,18,10,${0.04 + Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 8) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 2);
      }
      ctx.stroke();
    }
  }, 512, 512);
}

export function sidewalkTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#8a8e92';
    ctx.fillRect(0, 0, w, h);
    const tile = 64;
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const n = 0.92 + Math.random() * 0.12;
        ctx.fillStyle = `rgb(${Math.floor(130 * n)},${Math.floor(134 * n)},${Math.floor(138 * n)})`;
        ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
      }
    }
  }, 1024, 1024);
}

export function asphaltTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#2a2e32';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const g = 30 + Math.random() * 40;
      ctx.fillStyle = `rgba(${g},${g},${g + 4},0.35)`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }, 512, 512);
}

export function plasterTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#d9d2c5';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 12000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const a = 0.015 + Math.random() * 0.04;
      ctx.fillStyle = `rgba(90,80,60,${a})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }, 512, 512);
}

export function signTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, DEEP);
    g.addColorStop(1, '#062840');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(245,247,250,0.35)';
    ctx.lineWidth = 8;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    ctx.fillStyle = FOAM;
    ctx.font = '700 92px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('수영의 서점', w / 2, h * 0.42);

    ctx.font = '400 36px "Cormorant Garamond", serif';
    ctx.fillStyle = 'rgba(245,247,250,0.78)';
    ctx.fillText('SWIMMING BOOKSTORE', w / 2, h * 0.68);
  }, 1024, 384);
}

export function hangingSignTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = DEEP;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = WAVE;
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = FOAM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 78px "Noto Sans KR", sans-serif';
    ctx.fillText('서점', w / 2, h * 0.38);
    ctx.font = 'italic 36px "Cormorant Garamond", serif';
    ctx.fillStyle = 'rgba(245,247,250,0.85)';
    ctx.fillText('Books', w / 2, h * 0.68);
  }, 512, 640);
}

export function posterTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = FOAM;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = DEEP;
    ctx.textAlign = 'center';
    ctx.font = '700 64px "Cormorant Garamond", serif';
    ctx.fillText('Swimming', w / 2, h * 0.28);
    ctx.font = 'italic 42px "Cormorant Garamond", serif';
    ctx.fillStyle = WAVE;
    ctx.fillText('The art', w / 2, h * 0.38);
    ctx.font = '500 34px "Noto Sans KR", sans-serif';
    ctx.fillStyle = DEEP;
    ctx.fillText('수영 · 그 예술', w / 2, h * 0.55);
    ctx.font = '400 28px "Cormorant Garamond", serif';
    ctx.fillStyle = WAVE;
    ctx.fillText('Wong Heung Sang', w / 2, h * 0.68);
    ctx.font = '300 22px "Noto Sans KR", sans-serif';
    ctx.fillText('지금 진열 중', w / 2, h * 0.82);
  }, 512, 768);
}

export function openSignTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#1a5c3a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b8f0c8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 54px "Noto Sans KR", sans-serif';
    ctx.fillText('영업중', w / 2, h * 0.42);
    ctx.font = '400 28px "Cormorant Garamond", serif';
    ctx.fillText('OPEN', w / 2, h * 0.68);
  }, 384, 256);
}

export function hoursTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(245,247,250,0.95)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = DEEP;
    ctx.textAlign = 'center';
    ctx.font = '600 36px "Noto Sans KR", sans-serif';
    ctx.fillText('영업시간', w / 2, 70);
    ctx.font = '400 28px "Noto Sans KR", sans-serif';
    ctx.fillText('매일 10:00 – 21:00', w / 2, 140);
    ctx.font = '300 24px "Cormorant Garamond", serif';
    ctx.fillStyle = WAVE;
    ctx.fillText('Daily 10am – 9pm', w / 2, 200);
  }, 512, 280);
}

export function spineTexture(title, color) {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = FOAM;
    ctx.font = '500 28px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }, 64, 512);
}

export { DEEP, WAVE, FOAM };
