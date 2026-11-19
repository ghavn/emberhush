import * as THREE from 'three';

const up = new THREE.Vector3(0, 1, 0);

export function surfaceDetail(kind: 'cloth' | 'stone' | 'paper') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const image = context.createImageData(256, 256);
  let seed = 9137;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = seed / 4294967296 - .5;
      const warp = Math.sin(x * Math.PI / 2);
      const weft = Math.sin(y * Math.PI / 2);
      const weave = (warp + weft) * 18 + warp * weft * 18;
      const pores = Math.sin(x * .31 + Math.sin(y * .22) * 2) * Math.cos(y * .17) * 23;
      const value = kind === 'cloth' ? 128 + weave + grain * 16
        : kind === 'stone' ? 128 + pores + grain * 86
        : 128 + grain * 34 + (warp + weft) * 5;
      image.data.set([value, value, value, 255], (y * 256 + x) * 4);
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function curtainGeometry(side: number) {
  const geometry = new THREE.PlaneGeometry(1, 1, 68, 36);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    const gather = .61 + .33 * Math.sin(v * Math.PI) ** 2;
    const fold = Math.cos(u * Math.PI * 12 + v * 1.3);
    positions.setXYZ(i,
      side * (u - .5) * gather + side * .20 * Math.sin(v * Math.PI),
      v * 3.51 + .032 * fold * (1 - v) ** 8,
      fold * (.048 + .043 * (1 - v)) + .055 * Math.sin(v * Math.PI)
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function trimLoop(width: number, height: number, radius: number, thickness: number) {
  const shape = new THREE.Shape();
  const x = width / 2, y = height / 2;
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + radius);
  shape.lineTo(x, y - radius);
  shape.quadraticCurveTo(x, y, x - radius, y);
  shape.lineTo(-x + radius, y);
  shape.quadraticCurveTo(-x, y, -x, y - radius);
  shape.lineTo(-x, -y + radius);
  shape.quadraticCurveTo(-x, -y, -x + radius, -y);
  const curve = new THREE.CatmullRomCurve3(
    shape.getPoints(8).slice(0, -1).map(p => new THREE.Vector3(p.x, p.y, 0)), true
  );
  return new THREE.TubeGeometry(curve, 100, thickness, 8, true);
}

export function createEvergreen(material: THREE.MeshStandardMaterial, random: () => number) {
  const layers = 11, branches = 15, sprays = 7, needlesPerSpray = 20;
  const branchCount = layers * branches;
  const branchMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(.007, .023, 1, 10), material, branchCount
  );
  const sprayMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 7), material, branchCount * sprays
  );
  const needleMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(.011, 1, 4), material, branchCount * sprays * needlesPerSpray
  );
  const origin = new THREE.Vector3();
  const tip = new THREE.Vector3();
  const delta = new THREE.Vector3();
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let branchIndex = 0, sprayIndex = 0, needleIndex = 0;
  function align(start: THREE.Vector3, end: THREE.Vector3) {
    delta.subVectors(end, start);
    dummy.position.copy(start).lerp(end, .5);
    dummy.quaternion.setFromUnitVectors(up, delta.clone().normalize());
    return delta.length();
  }
  for (let layer = 0; layer < layers; layer++) {
    const y = .57 + layer * .336;
    const radius = 1.58 * (1 - layer / (layers + .15));
    for (let index = 0; index < branches; index++) {
      const angle = index / branches * Math.PI * 2 + layer * 2.38;
      const reach = radius * (.77 + random() * .24);
      origin.set(0, y + .20, 0);
      tip.set(Math.sin(angle) * reach, y + .03 + random() * .18, Math.cos(angle) * reach);
      const length = align(origin, tip);
      dummy.scale.setScalar(1);
      dummy.scale.y = length;
      dummy.updateMatrix();
      branchMesh.setMatrixAt(branchIndex, dummy.matrix);
      branchMesh.setColorAt(branchIndex++, color.set(0x54442a));
      for (let spray = 0; spray < sprays; spray++) {
        const t = .28 + spray / (sprays - 1) * .68;
        const start = origin.clone().lerp(tip, t);
        const spread = Math.min(.38, radius * .62) * (1 - t * .56);
        const direction = angle + (spray % 2 ? .95 : -.95);
        const end = start.clone().add(new THREE.Vector3(
          Math.sin(direction) * spread, .09 + radius * .063, Math.cos(direction) * spread
        ));
        const sprayLength = align(start, end);
        dummy.scale.set(.012 + radius * .012, sprayLength * .61, .014 + radius * .016);
        dummy.updateMatrix();
        sprayMesh.setMatrixAt(sprayIndex, dummy.matrix);
        sprayMesh.setColorAt(sprayIndex++, color.setHSL(.29 + random() * .045, .37, .145 + random() * .095));
        for (let needle = 0; needle < needlesPerSpray; needle++) {
          const base = start.clone().lerp(end, .12 + needle / needlesPerSpray * .88);
          const azimuth = direction + (needle % 2 ? 1 : -1) * (.65 + random() * .58);
          const needleLength = .078 + random() * .085;
          const point = base.clone().add(new THREE.Vector3(
            Math.sin(azimuth) * needleLength, .032 + random() * .084, Math.cos(azimuth) * needleLength
          ));
          const length = align(base, point);
          dummy.scale.set(.83, length, .83);
          dummy.updateMatrix();
          needleMesh.setMatrixAt(needleIndex, dummy.matrix);
          needleMesh.setColorAt(needleIndex++, color.setHSL(.28 + random() * .06, .42, .115 + random() * .13));
        }
      }
    }
  }
  branchMesh.castShadow = sprayMesh.castShadow = true;
  branchMesh.receiveShadow = sprayMesh.receiveShadow = needleMesh.receiveShadow = true;
  const tree = new THREE.Group();
  tree.add(branchMesh, sprayMesh, needleMesh);
  return tree;
}
