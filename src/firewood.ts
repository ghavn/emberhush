import * as THREE from 'three';

export function createFirewood() {
  let seed = 21327;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function surface(width: number, height: number, background: string) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const brush = canvas.getContext('2d')!;
    brush.fillStyle = background;
    brush.fillRect(0, 0, width, height);
    return { canvas, brush };
  }
  function texture(canvas: HTMLCanvasElement) {
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }

  const bark = surface(256, 512, '#342923');
  const glow = surface(256, 512, '#000');
  for (let i = 0; i < 520; i++) {
    const x = random() * 256;
    const y = random() * 512;
    const length = 20 + random() * 150;
    bark.brush.strokeStyle = ['#211c19', '#453932', '#57463a', '#2d2119'][i % 4];
    bark.brush.lineWidth = 1 + random() * 4;
    bark.brush.beginPath();
    bark.brush.moveTo(x, y);
    bark.brush.bezierCurveTo(x - 8, y + length * .25, x + 6, y + length * .7, x + 3, y + length);
    bark.brush.stroke();
  }
  // The emissive map lights the fissures themselves and leaves the ash and char dark.
  for (let i = 0; i < 85; i++) {
    const x = 8 + random() * 240;
    const y = 28 + random() * 465;
    const length = 9 + random() * 72;
    const hot = random();
    for (const [brush, color, width] of [
      [bark.brush, '#190f0b', 5],
      [glow.brush, hot > .72 ? '#ffae46' : '#912207', 1 + hot * 3],
    ] as const) {
      brush.strokeStyle = color;
      brush.lineWidth = width;
      brush.lineCap = 'round';
      brush.beginPath();
      brush.moveTo(x, y);
      brush.lineTo(x - 4, y + length * .3);
      brush.lineTo(x + 2, y + length * .64);
      brush.lineTo(x - 1, y + length);
      brush.stroke();
    }
  }
  const grain = surface(128, 128, '#6b4a33');
  for (let ring = 5; ring < 92; ring += 3.6) {
    grain.brush.strokeStyle = ring % 5 > 2 ? '#563823' : '#846044';
    grain.brush.lineWidth = 1.7;
    grain.brush.beginPath();
    grain.brush.ellipse(53, 68, ring, ring * .87, .31, 0, Math.PI * 2);
    grain.brush.stroke();
  }
  grain.brush.strokeStyle = '#34221a';
  grain.brush.lineWidth = 3;
  grain.brush.beginPath();
  grain.brush.moveTo(5, 44);
  grain.brush.lineTo(32, 54);
  grain.brush.lineTo(43, 65);
  grain.brush.lineTo(57, 68);
  grain.brush.stroke();

  const emissiveMap = texture(glow.canvas);
  const wood = new THREE.MeshStandardMaterial({
    color: 0xb8a49b, map: texture(bark.canvas), emissiveMap,
    emissive: 0xffb570, roughness: .93
  });
  const end = new THREE.MeshStandardMaterial({ map: texture(grain.canvas), roughness: .91 });
  const embers = [0x7c1705, 0xdb3709, 0xff751b].map(emissive => new THREE.MeshStandardMaterial({
    color: 0x30201b, emissive, emissiveMap, roughness: 1
  }));
  return {
    wood, end, embers,
    update(time: number) {
      wood.emissiveIntensity = 1.15 + Math.sin(time * 2.1) * .21 + Math.sin(time * 4.9) * .08;
      embers.forEach((ember, i) => {
        ember.emissiveIntensity = 2.5 + Math.sin(time * (1.7 + i * .42) + i * 2.1) * .8;
      });
    }
  };
}
