import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createEvergreen, curtainGeometry, surfaceDetail, trimLoop } from './details';
import { createFire } from './fire';
import { createFirewood } from './firewood';

export function createRoom(scene: THREE.Scene) {
  let seed = 1253;
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const mat = (color: number, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const oak = mat(0x69402b), darkwood = mat(0x30241c), trim = mat(0x896647), cream = mat(0xbba481), brass = mat(0xc49a52,.3,.65), black = mat(0x19130f);
  const materials = { oak, darkwood, trim, cream, brass, black };
  const clothDetail = surfaceDetail('cloth');
  const stoneDetail = surfaceDetail('stone');
  const paperDetail = surfaceDetail('paper');
  const boxMeshes = new Map<string, THREE.BufferGeometry>();
  const ballShape = new THREE.SphereGeometry(1, 28, 20);
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene, rounding = .022) => {
    const radius = Math.min(rounding, w * .24, h * .24, d * .24);
    const key = [w, h, d, radius].join('/');
    let geometry = boxMeshes.get(key);
    if (!geometry) {
      geometry = radius > 0 ? new RoundedBoxGeometry(w, h, d, 2, radius) : new THREE.BoxGeometry(w, h, d);
      boxMeshes.set(key, geometry);
    }
    const mesh = new THREE.Mesh(geometry,m); mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const sphere = (r: number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene) => {
    const mesh = new THREE.Mesh(ballShape,m); mesh.scale.setScalar(r); mesh.position.set(x,y,z); mesh.castShadow=true; parent.add(mesh);return mesh;
  };
  const cylinder = (rt:number,rb:number,h:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,40,3),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  // Individually staggered floorboards, with fine procedural wood grain.
  const woodCanvas = document.createElement('canvas'); woodCanvas.width=256;woodCanvas.height=512;
  const wc=woodCanvas.getContext('2d')!;wc.fillStyle='#74503a';wc.fillRect(0,0,256,512);
  for(let i=0;i<1100;i++){const x=rand()*256;wc.strokeStyle=`rgba(${rand()>.5?'25,12,3':'211,170,112'},${rand()*.16})`;wc.beginPath();wc.moveTo(x,0);wc.bezierCurveTo(x+rand()*18,160,x-rand()*18,340,x+rand()*8,512);wc.stroke();}
  const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.anisotropy=4;
  oak.map = woodTexture; oak.color.set(0xc39368);
  for(let i=0;i<28;i++) {
    const m=new THREE.MeshStandardMaterial({map:woodTexture,color:new THREE.Color().setHSL(.075,.26,.42+rand()*.07),roughness:.62});
    box(.495,.12,40,m,-6.75+i*.5,-.06,14.8);
  }
  const wallpaper = mat(0x3a493c);
  box(60,20,.2,wallpaper,0,10,-5,scene,0);box(.2,20,60,mat(0x354037),-7,10,20,scene,0);
  box(80,.12,80,new THREE.MeshStandardMaterial({map:woodTexture,color:0x6c4c36,roughness:.72}),0,-.14,20);
  box(14,1.35,.12,darkwood,0,.675,-4.84);box(.12,1.35,12,darkwood,-6.84,.675,1);
  for(let x=-6.6;x<7;x+=.65){box(.035,1.2,.06,trim,x,.65,-4.74);}
  box(14,.09,.16,trim,0,1.36,-4.72);box(14,.15,.16,trim,0,.12,-4.72);
  box(14,.14,.25,trim,0,5.7,-4.72);box(.22,.14,12,trim,-6.74,5.7,1);
  // Fine repeated wallpaper diamonds.
  const pattern = mat(0x667058);
  for(let x=-6.5;x<7;x+=.55)for(let y=1.8;y<5.6;y+=.65){const d=box(.055,.09,.008,pattern,x+(Math.round(y*10)%2)*.17,y,-4.887);d.rotation.z=Math.PI/4;}

  // Stone hearth, soot-dark firebox, individual brick surround and timber mantel.
  const fx=-2.65;
  const stone=mat(0x817160), soot=mat(0x15100d), mortar=mat(0x4c4236);
  stone.bumpMap = stoneDetail; stone.bumpScale = .023;
  box(4.4,.22,1.9,stone,fx,.11,-3.95,scene,.064);
  box(4.14,.078,1.74,stone,fx,.245,-3.98,scene,.033);
  box(3.9,3.2,.7,mortar,fx,1.8,-4.43);
  box(2.58,2.33,.11,soot,fx,1.53,-4.015);
  box(2.6,.18,1.15,black,fx,.32,-3.97);
  const brickMats=[0x765340,0x8b6047,0x684938,0x96694e,0x7e5d48].map(c=>new THREE.MeshStandardMaterial({ color: c, roughness: .92, bumpMap: stoneDetail, bumpScale: .014 }));
  for(let row=0;row<9;row++) {
    const y=.49+row*.315;
    for(let col=0;col<6;col++) {
      const x=fx-1.62+col*.65;
      if(row<7 && Math.abs(x-fx)<1.28)continue;
      const brick = box(.619,.286,.20,brickMats[Math.floor(rand()*brickMats.length)],x,y,-3.99 + (rand() - .5) * .022,scene,.024);
      brick.rotation.z = (rand() - .5) * .019;
    }
  }
  box(4.4,.25,1.2,oak,fx,3.52,-4.28,scene,.060);
  box(4.24,.075,1.06,trim,fx,3.39,-4.27,scene,.035);box(4.12,.13,.95,trim,fx,3.33,-4.3);
  for(const x of [fx-1.65,fx+1.65])box(.3,.45,.6,oak,x,3.1,-4.25);
  const firewood = createFirewood();
  for (let i = 0; i < 6; i++) {
    const length = 1.48 + (i % 2) * .31;
    const shape = new THREE.CylinderGeometry(.15, .21, length, 32, 20);
    const vertices = shape.attributes.position;
    for (let v = 0; v < vertices.count; v++) {
      const x = vertices.getX(v), y = vertices.getY(v), z = vertices.getZ(v);
      const roughness = 1 + .075 * Math.sin(x * 55 + y * 10 + z * 36 + i);
      vertices.setXYZ(v, x * roughness, y + .024 * Math.sin(x * 28 + z * 21), z * roughness);
    }
    shape.computeVertexNormals();
    const log = new THREE.Mesh(shape, [firewood.wood, firewood.end, firewood.end]);
    log.position.set(fx + (rand() - .5) * .66, .49 + Math.floor(i / 3) * .25, -3.72 - (i % 3) * .18);
    log.rotation.set((i % 2 ? 1 : -1) * .28, i % 2 ? .52 : -.38, 1.38 + i * .067);
    log.castShadow = true;
    log.receiveShadow = true;
    scene.add(log);
  }
  const coalShape = new THREE.IcosahedronGeometry(1, 2);
  for (let i = 0; i < 62; i++) {
    const coal = new THREE.Mesh(coalShape, firewood.embers[i % 3]);
    const size = .025 + rand() * .075;
    coal.position.set(fx + (rand() - .5) * 2.05, .43 + rand() * .07, -3.67 + (rand() - .5) * .83);
    coal.scale.set(size, size * .53, size * .85);
    coal.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    scene.add(coal);
  }
  const grate = mat(0x211b17, .6, .5);
  for (let i = 0; i < 7; i++) box(.035, .22, .65, grate, fx - .93 + i * .31, .46, -3.48);
  box(2.1, .045, .045, grate, fx, .6, -3.17);
  const fire = createFire();
  fire.mesh.position.set(fx, 1.58, -3.58);
  scene.add(fire.mesh);
  const fireLight = new THREE.PointLight(0xffa659, 40, 14, 2);
  fireLight.position.set(fx, 1.2, -3.1);
  fireLight.castShadow = true;
  fireLight.shadow.mapSize.set(1024, 1024);
  fireLight.shadow.bias = -.002;
  fireLight.shadow.normalBias = .035;
  scene.add(fireLight);
  // A broader, softer pool carries the same flicker to the rug and furniture.
  const bounce = new THREE.PointLight(0xff9951, 14, 12, 2);
  bounce.position.set(fx, 1.3, -1.8);
  scene.add(bounce);
  // Stockings and evergreen garland.
  const red=mat(0x852d2a), ivory=mat(0xe7d5b7), pine=mat(0x263f2a);
  red.bumpMap = ivory.bumpMap = clothDetail;
  red.bumpScale = ivory.bumpScale = .014;
  for(const [i,x] of [fx-.9,fx+.75].entries()) {
    const sock=new THREE.Group();sock.position.set(x,3.22,-3.59);sock.rotation.z=i?-.13:.11;scene.add(sock);
    const stocking = new THREE.Shape();
    stocking.moveTo(-.15, .015);
    stocking.lineTo(.15, .015);
    stocking.bezierCurveTo(.15, -.11, .10, -.29, .13, -.39);
    stocking.bezierCurveTo(.15, -.47, .33, -.44, .34, -.55);
    stocking.bezierCurveTo(.35, -.66, .17, -.69, .02, -.663);
    stocking.bezierCurveTo(-.19, -.66, -.20, -.53, -.17, -.39);
    stocking.lineTo(-.15, .015);
    const stockingMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(stocking, {
      depth: .086, bevelEnabled: true, bevelThickness: .036, bevelSize: .044,
      bevelSegments: 5, curveSegments: 18
    }), red);
    stockingMesh.position.z = -.043;
    stockingMesh.castShadow = true;
    sock.add(stockingMesh);
    box(.41,.17,.2,ivory,0,0,0,sock,.056);
  }
  const foliage = new THREE.SphereGeometry(1, 11, 7);
  const sprigs = new THREE.InstancedMesh(foliage, pine, 312);
  const sprig = new THREE.Object3D();
  const foliageTint = new THREE.Color();
  for (let i = 0; i < 312; i++) {
    const along = i / 311;
    const angle = i * 2.39996;
    const wreathSprig = i >= 156;
    const wreathAngle = (along - .5) * Math.PI * 4;
    sprig.position.set(
      wreathSprig ? fx + Math.cos(wreathAngle) * .52 + Math.cos(angle) * .11 : fx - 2 + along * 8,
      wreathSprig ? 4.57 + Math.sin(wreathAngle) * .52 + Math.sin(angle) * .105 : 3.68 + Math.sin(angle) * .10,
      wreathSprig ? -4.4 + Math.cos(angle) * .08 : -3.94 + Math.cos(angle) * .12
    );
    sprig.rotation.set(angle, i * .71, i * .42);
    sprig.scale.set(.067, .15 + rand() * .065, .036);
    sprig.updateMatrix();
    sprigs.setMatrixAt(i, sprig.matrix);
    sprigs.setColorAt(i, foliageTint.setHSL(.24 + rand() * .11, .29, .48 + rand() * .27));
  }
  sprigs.castShadow = true;
  scene.add(sprigs);
  const warmBulb = new THREE.MeshBasicMaterial({color:0xffdf9f});
  for(let i=0;i<14;i++)sphere(.027,warmBulb,fx-1.9+i*.29,3.63,-3.70);
  // Mantel mirror and a wreath, reflecting warmth through a painted material.
  box(1.75,1.64,.09,brass,fx,4.57,-4.71);box(1.54,1.43,.1,mat(0x303c36,.22,.75),fx,4.57,-4.64);
  const wreath=new THREE.Mesh(new THREE.TorusGeometry(.52,.097,16,80),pine);wreath.position.set(fx,4.57,-4.51);scene.add(wreath);
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2;sphere(.04,red,fx+Math.cos(a)*.52,4.57+Math.sin(a)*.52,-4.36);}
  box(.2,.17,.09,red,fx,4.05,-4.31);
  for(const x of [fx-1.55,fx+1.55]){cylinder(.085,.13,.09,brass,x,3.7,-4.15);cylinder(.035,.055,.35,brass,x,3.9,-4.15);cylinder(.07,.07,.32,ivory,x,4.2,-4.15);sphere(.032,warmBulb,x,4.39,-4.15).scale.y *= 1.85;}

  // Blue hour window: layered procedural snowfall remains behind the frame.
  const windowMat=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float time;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){vec2 uv=vUv;vec3 col=mix(vec3(.065,.11,.15),vec3(.013,.032,.065),uv.y);float ridge=.17+.07*sin(uv.x*24.)+.04*sin(uv.x*49.);col=mix(col,vec3(.035,.07,.085),1.-smoothstep(ridge,ridge+.012,uv.y));
  for(int l=0;l<3;l++){float k=float(l);vec2 p=uv*(12.+k*9.)+vec2(time*(.04+k*.015),time*(.16+k*.05));vec2 id=floor(p);vec2 f=fract(p)-vec2(hash(id),hash(id+3.));float snow=1.-smoothstep(.012,.055-k*.009,length(f));col+=snow*(.25+k*.13);}
  float moon=1.-smoothstep(.055,.062,length(uv-vec2(.73,.79)));col+=moon*vec3(.5,.55,.55);gl_FragColor=vec4(col,1.);}`});
  const windowMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.2,3),windowMat);windowMesh.position.set(2.4,3.55,-4.83);scene.add(windowMesh);
  for(const x of [.72,4.08])box(.15,3.35,.24,cream,x,3.55,-4.64);
  for(const y of [1.91,5.19])box(3.52,.15,.24,cream,2.4,y,-4.64);
  box(.065,3,.2,cream,2.4,3.55,-4.59);box(3.25,.07,.2,cream,2.4,3.55,-4.59);box(3.8,.14,.5,oak,2.4,1.84,-4.5);
  const curtain = new THREE.MeshStandardMaterial({
    color: 0x792f2a, side: THREE.DoubleSide, roughness: .97,
    bumpMap: clothDetail, bumpScale: .014
  });
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(curtainGeometry(side), curtain);
    panel.position.set(2.4 + side * 1.75, 1.79, -4.35);
    panel.castShadow = panel.receiveShadow = true;
    scene.add(panel);
    sphere(.077, brass, 2.4 + side * 2.4, 5.4, -4.36);
    for (let ringIndex = 0; ringIndex < 7; ringIndex++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.063,.012,10,26), brass);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(2.4 + side * 1.75 + (ringIndex - 3) * .087, 5.375, -4.36);
      scene.add(ring);
    }
  }
  cylinder(.033,.033,4.8,brass,2.4,5.4,-4.36).rotation.z=Math.PI/2;
  const moonLight=new THREE.SpotLight(0x92b5ce,18,18,1.1,.8,1.3);moonLight.position.set(2.4,4.4,-4.25);moonLight.target.position.set(-2,0,2);scene.add(moonLight,moonLight.target);

  const tx = 4.1, tz = -2.15;
  cylinder(.14,.20,.8,oak,tx,.4,tz);
  cylinder(.65,.75,.24,mat(0x6f2528),tx,.15,tz);
  const evergreen = createEvergreen(mat(0xffffff, .92), rand);
  evergreen.position.set(tx, 0, tz);
  scene.add(evergreen);
  const bulbMats = [0xffd493, 0xffe2b7, 0xffbf6d].map(color => new THREE.MeshBasicMaterial({color}));
  const lights = bulbMats.map(material => {
    const bulbs = new THREE.InstancedMesh(ballShape, material, 34);
    scene.add(bulbs);
    return bulbs;
  });
  lights[1].count = lights[2].count = 33;
  const bulbTransform = new THREE.Object3D();
  bulbTransform.scale.setScalar(.031);
  const wirePoints:THREE.Vector3[]=[];
  for(let i=0;i<200;i++){
    const h=i/199, a=h*Math.PI*2*6.6,r=1.36*(1-h)+.16;
    const p=new THREE.Vector3(tx+Math.cos(a)*r,.55+h*3.9,tz+Math.sin(a)*r);wirePoints.push(p);
    if (i % 2 === 0) {
      const bulb = i / 2;
      bulbTransform.position.copy(p);
      bulbTransform.updateMatrix();
      lights[bulb % 3].setMatrixAt(Math.floor(bulb / 3), bulbTransform.matrix);
    }
  }
  const wire=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePoints),280,.009,8,false),mat(0x51452a));scene.add(wire);
  const ornaments=[mat(0x9e2824,.23,.45),mat(0xd7ad63,.21,.6),mat(0xe3d0a5,.2,.25)];
  for(let i=0;i<48;i++){
    const y=.65+rand()*3.45,r=1.36*(1-(y-.55)/4)+.17,a=i*2.399;
    const x=tx+Math.cos(a)*r,z=tz+Math.sin(a)*r;
    const radius = .075 + rand() * .04;
    sphere(radius, ornaments[i%3], x, y, z);
    cylinder(.021, .026, .036, brass, x, y + radius, z);
    if (i % 3 === 1) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(radius * .99, .007, 8, 36), brass);
      band.rotation.x = Math.PI / 2;
      band.position.set(x, y, z);
      scene.add(band);
    }
  }
  // Five-point gold star, extruded just enough to catch the firelight.
  const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.115:.27;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?starShape.lineTo(x,y):starShape.moveTo(x,y);}starShape.closePath();
  const star=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape,{depth:.045,bevelEnabled:true,bevelThickness:.013,bevelSize:.017,bevelSegments:4}),new THREE.MeshStandardMaterial({color:0xffd180,emissive:0xffb849,emissiveIntensity:.7,metalness:.6,roughness:.3}));star.position.set(tx,4.52,tz);scene.add(star);
  const treeLight=new THREE.PointLight(0xffd59a,5,9,2);treeLight.position.set(tx,2.4,tz+2.2);scene.add(treeLight);
  // Gifts, ribbons and tags.
  const giftMats=[mat(0x892f2c),mat(0xb7a583),mat(0x3d5949),mat(0x9b6b3c)];
  for (const gift of giftMats) { gift.bumpMap = paperDetail; gift.bumpScale = .009; }
  for(let i=0;i<8;i++){
    const g=new THREE.Group();const a=i*2.4;g.position.set(tx+Math.cos(a)*(1+rand()*.7),.01,tz+Math.sin(a)*(1+rand()*.7));g.rotation.y=rand()*2;scene.add(g);
    const w=.45+rand()*.45,h=.3+rand()*.45,d=.42+rand()*.4;
    box(w,h,d,giftMats[i%4],0,h/2,0,g);box(w+.025,.035,d+.025,giftMats[i%4],0,h,0,g);
    box(.07,h+.05,d+.04,brass,0,h/2,0,g);box(w+.04,h+.05,.07,brass,0,h/2,0,g);
    for (const side of [-1, 1]) {
      const bow = new THREE.Mesh(new THREE.TorusGeometry(.071,.013,12,34), brass);
      bow.rotation.set(Math.PI / 2.65, 0, side * .29);
      bow.scale.set(1.42, .77, 1);
      bow.position.set(side * .083, h + .08, 0);
      g.add(bow);
    }
    sphere(.033, brass, 0, h + .079, 0, g);
    const tag = box(.13,.014,.081,cream,.13,h+.029,.12,g);
    tag.rotation.y = .36;
  }

  // Woven rug: a canvas pattern is part of the source asset pipeline, not a downloaded image.
  const rc=document.createElement('canvas');rc.width=512;rc.height=512;const rctx=rc.getContext('2d')!;
  rctx.fillStyle='#692e2d';rctx.fillRect(0,0,512,512);
  for(const [inset,width,color] of [[12,4,'#d0a26b'],[25,12,'#b18155'],[47,3,'#d2af77'],[58,2,'#a57950']] as const){rctx.strokeStyle=color;rctx.lineWidth=width;rctx.strokeRect(inset,inset,512-inset*2,512-inset*2);}
  for(let x=85;x<460;x+=56)for(let y=85;y<460;y+=56){rctx.save();rctx.translate(x,y);rctx.rotate(Math.PI/4);rctx.strokeStyle='#af8055';rctx.lineWidth=3;rctx.strokeRect(-12,-12,24,24);rctx.restore();}
  for(let i=0;i<14000;i++){rctx.fillStyle=`rgba(230,210,170,${rand()*.06})`;rctx.fillRect(rand()*512,rand()*512,1,2);}
  const rugTex=new THREE.CanvasTexture(rc);rugTex.colorSpace=THREE.SRGBColorSpace;const rug=box(6.6,.025,4.8,new THREE.MeshStandardMaterial({map:rugTex,bumpMap:clothDetail,bumpScale:.008,roughness:1}),-.1,.018,.1);rug.rotation.y=-.08;
  const fringeMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(.009, .006, 1, 8), mat(0xb9966a), 132
  );
  const fringe = new THREE.Object3D();
  for (let i = 0; i < 132; i++) {
    const side = i < 66 ? -1 : 1;
    const length = .061 + rand() * .058;
    fringe.position.set(-3.23 + (i % 66) * .099, .005, side * (2.38 + length * .46));
    fringe.rotation.set(Math.PI / 2, 0, (rand() - .5) * .24, 'YXZ');
    fringe.scale.set(1, length, 1);
    fringe.updateMatrix();
    fringeMesh.setMatrixAt(i, fringe.matrix);
  }
  rug.add(fringeMesh);

  // Deep green armchair, side table, knitted throw and a quiet cup of cocoa.
  const upholstery=mat(0x344f43), cushion=mat(0x9c6948);
  upholstery.bumpMap = cushion.bumpMap = clothDetail;
  upholstery.bumpScale = cushion.bumpScale = .019;
  const chair=new THREE.Group();chair.position.set(-5.15,0,.2);chair.rotation.y=.72;scene.add(chair);
  for(const x of [-.65,.65])for(const z of [-.6,.6])cylinder(.07,.05,.4,darkwood,x,.2,z,chair);
  box(1.65,.42,1.65,upholstery,0,.55,0,chair,.15);box(1.4,.24,1.3,upholstery,0,.87,.1,chair,.11);
  const back=box(1.65,1.55,.36,upholstery,0,1.28,-.66,chair,.15);back.rotation.x=-.12;
  for(const x of [-.8,.8])box(.29,.68,1.65,upholstery,x,.98,0,chair,.14);
  const pillow=box(.77,.65,.2,cushion,.16,1.27,-.35,chair,.09);pillow.rotation.z=-.12;pillow.rotation.x=-.18;
  const piping = new THREE.Mesh(trimLoop(.74,.62,.14,.012), mat(0xbc8a61));
  piping.position.z = .092;
  pillow.add(piping);
  const throwMat=mat(0xc4b99e);throwMat.bumpMap=clothDetail;throwMat.bumpScale=.019;box(.55,.06,1.18,throwMat,-.72,1.35,.1,chair);box(.55,.8,.07,throwMat,-.72,.94,.72,chair);
  for(let i=0;i<14;i++) {
    const tassel = cylinder(.007,.004,.075+rand()*.035,ivory,-.975+i*.039,.535,.763,chair);
    tassel.rotation.x = (rand()-.5)*.36;
  }
  cylinder(.64,.64,.12,oak,-3.65,.85,1.6);for(let i=0;i<3;i++){const a=i/3*Math.PI*2;cylinder(.035,.055,.8,darkwood,-3.65+Math.sin(a)*.4,.4,1.6+Math.cos(a)*.4);}
  const mugProfile = [[0,0],[.07,0],[.088,.014],[.099,.052],[.108,.143],[.108,.181],[.103,.194],[.092,.194],[.089,.183],[.088,.151],[.076,.044],[.055,.025],[0,.025]];
  const mug = new THREE.Mesh(new THREE.LatheGeometry(mugProfile.map(([x,y]) => new THREE.Vector2(x,y)), 56), ivory);
  mug.position.set(-3.6,.91,1.6);
  scene.add(mug);
  const coffee=cylinder(.087,.087,.01,mat(0x382117),-3.6,1.083,1.6);coffee.castShadow=false;
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.07,.018,14,38),ivory);handle.position.set(-3.46,1.02,1.6);scene.add(handle);mug.castShadow=true;
  // Low ottoman, books and a standing lamp complete the room without a busy HUD.
  const ottoman=box(1.8,.6,1.15,mat(0x86533b),1.5,.36,2.3,scene,.15);ottoman.rotation.y=-.12;
  for(let i=0;i<2;i++){
    const book=new THREE.Group();
    book.position.set(1.4,.71+i*.10,2.3);
    book.rotation.y=.15-i*.3;
    scene.add(book);
    const cover=mat(i?0xa49477:0x354b49);
    box(.58,.057,.38,cream,0,0,0,book);
    box(.62,.025,.42,cover,0,.037,0,book);
    box(.62,.025,.42,cover,0,-.037,0,book);
    box(.034,.079,.416,cover,-.289,0,0,book);
    for(let page=0;page<4;page++)box(.58,.002,.004,trim,0,-.021+page*.012,.191,book);
  }
  cylinder(.43,.48,.08,brass,-5.5,.06,-2.2);cylinder(.035,.035,3.5,brass,-5.5,1.8,-2.2);
  const shadeGeometry = new THREE.CylinderGeometry(.38,.69,.85,96,8,true);
  const shadeVertices = shadeGeometry.attributes.position;
  for (let i=0;i<shadeVertices.count;i++) {
    const x=shadeVertices.getX(i), z=shadeVertices.getZ(i);
    const pleat=1+.026*Math.cos(Math.atan2(z,x)*32);
    shadeVertices.setX(i,x*pleat);
    shadeVertices.setZ(i,z*pleat);
  }
  shadeGeometry.computeVertexNormals();
  const shade = new THREE.Mesh(shadeGeometry, new THREE.MeshStandardMaterial({
    color:0xe3c59a, emissive:0xc68b42, emissiveIntensity:.3, side:THREE.DoubleSide,
    bumpMap:clothDetail,bumpScale:.018
  }));
  shade.position.set(-5.5,3.6,-2.2);
  scene.add(shade);
  for(const [radius,height] of [[.69,3.175],[.38,4.025]]) {
    const rim=new THREE.Mesh(new THREE.TorusGeometry(radius,.015,12,64),brass);
    rim.rotation.x=Math.PI/2;
    rim.position.set(-5.5,height,-2.2);
    scene.add(rim);
  }
  shade.castShadow=false;const lamp=new THREE.PointLight(0xffda99,22,9,2);lamp.position.set(-5.5,3.25,-2.2);scene.add(lamp);
  const sparkCount = 22;
  const positions = new THREE.BufferAttribute(new Float32Array(sparkCount * 3), 3);
  const brightness = new THREE.BufferAttribute(new Float32Array(sparkCount), 1);
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position', positions);
  sparkGeometry.setAttribute('brightness', brightness);
  const sparkMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float brightness;
      varying float glow;
      void main() {
        vec4 center = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * center;
        gl_PointSize = clamp(17. / -center.z, 1.3, 7.);
        glow = brightness;
      }
    `,
    fragmentShader: `
      varying float glow;
      void main() {
        float radius = length(gl_PointCoord - .5);
        gl_FragColor = vec4(1., .44 + glow * .24, .12,
                           (1. - smoothstep(.03, .5, radius)) * glow);
      }
    `
  });
  const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
  sparks.frustumCulled = false;
  sparks.renderOrder = 2;
  scene.add(sparks);
  scene.add(new THREE.HemisphereLight(0x9eafc0, 0x67432a, 1.1));
  const fill = new THREE.DirectionalLight(0xffdab0, .92);
  fill.position.set(0, 6, 6);
  scene.add(fill);

  return { materials, update(time: number) {
    const draft = .55 * Math.sin(time * 1.8) + .3 * Math.sin(time * 3.1 + 1.2);
    const burn = 1 + .13 * Math.sin(time * 2.2) + .07 * Math.sin(time * 4.7 + 1.9);
    const flicker = (burn - 1) * 42 + Math.sin(time * 7.1) * 2.6 + Math.sin(time * 11.3 + .8) * 1.5;
    fire.update(time, draft, burn);
    firewood.update(time);
    windowMat.uniforms.time.value = time;
    fireLight.intensity = 34 + flicker;
    fireLight.position.set(fx + draft * .20, 1.26 + (burn - 1) * .7, -3.12);
    bounce.intensity = 15 + flicker * .46;
    bounce.position.x = fx + draft * .4;

    for (let i = 0; i < sparkCount; i++) {
      const life = (time * (.2 + (i % 5) * .057) + i * .618) % 1;
      positions.setXYZ(i,
        fx + Math.sin(i * 23.7) * .75 + Math.sin(life * 4.1 + i) * life * .34 + draft * life * .12,
        .66 + life * (1.05 + (i % 5) * .23),
        -3.54 + Math.sin(i * 7) * .28 + life * .2
      );
      brightness.setX(i, Math.min(1, life * 9) * (1 - life) ** 2 * (.48 + (i % 4) * .15));
    }
    positions.needsUpdate = true;
    brightness.needsUpdate = true;
  }};
}
