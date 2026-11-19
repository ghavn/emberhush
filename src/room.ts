import * as THREE from 'three';
import { createFire } from './fire';

export function createRoom(scene: THREE.Scene) {
  let seed = 1253;
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const mat = (color: number, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const oak = mat(0x69402b), darkwood = mat(0x30241c), trim = mat(0x896647), cream = mat(0xbba481), brass = mat(0xc49a52,.3,.65), black = mat(0x19130f);
  const materials = { oak, darkwood, trim, cream, brass, black };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const sphere = (r: number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r,12,8),m); mesh.position.set(x,y,z); mesh.castShadow=true; parent.add(mesh);return mesh;
  };
  const cylinder = (rt:number,rb:number,h:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,16),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  // Individually staggered floorboards, with fine procedural wood grain.
  const woodCanvas = document.createElement('canvas'); woodCanvas.width=256;woodCanvas.height=512;
  const wc=woodCanvas.getContext('2d')!;wc.fillStyle='#74503a';wc.fillRect(0,0,256,512);
  for(let i=0;i<1100;i++){const x=rand()*256;wc.strokeStyle=`rgba(${rand()>.5?'25,12,3':'211,170,112'},${rand()*.16})`;wc.beginPath();wc.moveTo(x,0);wc.bezierCurveTo(x+rand()*18,160,x-rand()*18,340,x+rand()*8,512);wc.stroke();}
  const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.anisotropy=4;
  for(let i=0;i<28;i++) {
    const m=new THREE.MeshStandardMaterial({map:woodTexture,color:new THREE.Color().setHSL(.075,.26,.42+rand()*.07),roughness:.62});
    box(.495,.12,40,m,-6.75+i*.5,-.06,14.8);
  }
  const wallpaper = mat(0x3a493c);
  box(60,20,.2,wallpaper,0,10,-5);box(.2,20,60,mat(0x354037),-7,10,20);
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
  box(4.4,.22,1.9,stone,fx,.11,-3.95);
  box(3.9,3.2,.7,mortar,fx,1.8,-4.43);
  box(2.58,2.33,.11,soot,fx,1.53,-4.015);
  box(2.6,.18,1.15,black,fx,.32,-3.97);
  const brickMats=[0x765340,0x8b6047,0x684938,0x96694e,0x7e5d48].map(c=>mat(c));
  for(let row=0;row<9;row++) {
    const y=.49+row*.315;
    for(let col=0;col<6;col++) {
      const x=fx-1.62+col*.65;
      if(row<7 && Math.abs(x-fx)<1.28)continue;
      box(.62,.29,.2,brickMats[Math.floor(rand()*brickMats.length)],x,y,-3.99);
    }
  }
  box(4.4,.25,1.2,oak,fx,3.52,-4.28);box(4.12,.13,.95,trim,fx,3.33,-4.3);
  for(const x of [fx-1.65,fx+1.65])box(.3,.45,.6,oak,x,3.1,-4.25);
  // Split logs with bark rings and warm cracks.
  const bark=mat(0x2b1b12), endgrain=mat(0x805239), coal=new THREE.MeshStandardMaterial({color:0x4e1706,emissive:0xff3b05,emissiveIntensity:.8,roughness:.9});
  for(let i=0;i<6;i++) {
    const log=cylinder(.17,.21,1.55+(i%2)*.35,bark,fx+(rand()-.5)*.7,.52+Math.floor(i/3)*.24,-3.82+(rand()-.5)*.5);
    log.rotation.z=Math.PI/2;log.rotation.y=(i%2?1:-1)*.32;
    for(const side of [-1,1]) { const cap=new THREE.Mesh(new THREE.CircleGeometry(.167,16),endgrain);cap.rotation.x=side>0?-Math.PI/2:Math.PI/2;cap.position.y=side*.79;log.add(cap); }
    for(let k=0;k<5;k++) {const e=box(.035,.018,.18,coal,fx-.7+rand()*1.4,.5+rand()*.3,-3.6+rand()*.15);e.rotation.z=rand();}
  }
  for(let i=0;i<32;i++){const c=sphere(.04+rand()*.08,coal,fx+(rand()-.5)*1.8,.41,-3.5+(rand()-.5)*.7);c.scale.y=.4;}
  const grate=mat(0x211b17,.6,.5);
  for(let i=0;i<7;i++)box(.035,.3,.65,grate,fx-.93+i*.31,.49,-3.48);
  box(2.1,.045,.045,grate,fx,.68,-3.17);
  const fire=createFire();fire.mesh.position.set(fx,1.44,-3.88);scene.add(fire.mesh);
  const fireLight=new THREE.PointLight(0xffa34b,42,12,2);fireLight.position.set(fx,1.3,-3.05);fireLight.castShadow=true;fireLight.shadow.mapSize.set(1024,1024);fireLight.shadow.bias=-.002;fireLight.shadow.normalBias=.035;scene.add(fireLight);
  const bounce=new THREE.PointLight(0xff8138,10,8,2);bounce.position.set(fx,.9,-2);scene.add(bounce);
  // Stockings and evergreen garland.
  const red=mat(0x852d2a), ivory=mat(0xe7d5b7), pine=mat(0x263f2a);
  for(const [i,x] of [fx-.9,fx+.75].entries()) {
    const sock=new THREE.Group();sock.position.set(x,3.22,-3.59);sock.rotation.z=i?-.13:.11;scene.add(sock);
    box(.34,.58,.14,red,0,-.27,0,sock);const toe=sphere(.19,red,.1,-.55,.01,sock);toe.scale.set(1.3,.7,.5);box(.41,.17,.2,ivory,0,0,0,sock);
  }
  for(let i=0;i<38;i++){const x=fx-2+i*.108;sphere(.13,pine,x,3.65+Math.sin(i*.6)*.035,-3.87);}
  const warmBulb = new THREE.MeshBasicMaterial({color:0xffdf9f});
  for(let i=0;i<14;i++)sphere(.027,warmBulb,fx-1.9+i*.29,3.63,-3.70);
  // Mantel mirror and a wreath, reflecting warmth through a painted material.
  box(1.75,1.64,.09,brass,fx,4.57,-4.71);box(1.54,1.43,.1,mat(0x303c36,.22,.75),fx,4.57,-4.64);
  const wreath=new THREE.Mesh(new THREE.TorusGeometry(.52,.135,8,36),pine);wreath.position.set(fx,4.57,-4.51);scene.add(wreath);
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2;sphere(.04,red,fx+Math.cos(a)*.52,4.57+Math.sin(a)*.52,-4.36);}
  box(.2,.17,.09,red,fx,4.05,-4.31);
  for(const x of [fx-1.55,fx+1.55]){cylinder(.085,.13,.09,brass,x,3.7,-4.15);cylinder(.035,.055,.35,brass,x,3.9,-4.15);cylinder(.07,.07,.32,ivory,x,4.2,-4.15);sphere(.04,warmBulb,x,4.39,-4.15);}

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
  const curtain=mat(0x792f2a);
  for(const side of [-1,1])for(let i=0;i<7;i++){const x=2.4+side*(1.82+i*.065);cylinder(.095,.13,3.8,curtain,x,3.4,-4.39+Math.sin(i*2)*.07);}
  cylinder(.045,.045,4.8,brass,2.4,5.4,-4.36).rotation.z=Math.PI/2;
  const moonLight=new THREE.SpotLight(0x92b5ce,18,18,1.1,.8,1.3);moonLight.position.set(2.4,4.4,-4.25);moonLight.target.position.set(-2,0,2);scene.add(moonLight,moonLight.target);

  // Layered Christmas tree with irregular, individually needled branch fans.
  const tx=4.1,tz=-2.15;
  cylinder(.14,.2,.8,oak,tx,.4,tz);cylinder(.65,.75,.24,mat(0x6f2528),tx,.15,tz);
  const needles=[mat(0x193723),mat(0x25492d),mat(0x2c4b2c)];
  const branchGeom=new THREE.ConeGeometry(1,1,7);
  for(let tier=0;tier<10;tier++) {
    const y=.65+tier*.37, radius=1.48*(1-tier/11);
    const core=new THREE.Mesh(new THREE.ConeGeometry(radius*.86,.95,13),needles[tier%3]);core.position.set(tx,y+.35,tz);core.castShadow=true;core.receiveShadow=true;scene.add(core);
    for(let j=0;j<14;j++){
      const a=j/14*Math.PI*2+tier*.55, r=radius*.62;
      const b=new THREE.Mesh(branchGeom,needles[(j+tier)%3]);b.scale.set(.35,.95,.31);b.position.set(tx+Math.sin(a)*r,y+.12,tz+Math.cos(a)*r);b.rotation.set(Math.cos(a)*.72,0,-Math.sin(a)*.72);b.castShadow=true;scene.add(b);
    }
  }
  const lights:THREE.Mesh[]=[];const bulbMats=[0xffd493,0xffe2b7,0xffbf6d].map(c=>new THREE.MeshBasicMaterial({color:c}));
  const wirePoints:THREE.Vector3[]=[];
  for(let i=0;i<200;i++){
    const h=i/199, a=h*Math.PI*2*6.6,r=1.48*(1-h)+.07;
    const p=new THREE.Vector3(tx+Math.cos(a)*r,.55+h*3.9,tz+Math.sin(a)*r);wirePoints.push(p);
    if(i%2===0)lights.push(sphere(.034,bulbMats[i%3],p.x,p.y,p.z));
  }
  const wire=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePoints),200,.009,4,false),mat(0x51452a));scene.add(wire);
  const ornaments=[mat(0x9e2824,.23,.45),mat(0xd7ad63,.21,.6),mat(0xe3d0a5,.2,.25)];
  for(let i=0;i<48;i++){
    const y=.65+rand()*3.45,r=1.48*(1-(y-.55)/4)+.01,a=i*2.399;
    const x=tx+Math.cos(a)*r,z=tz+Math.sin(a)*r;
    sphere(.075+rand()*.04,ornaments[i%3],x,y,z);cylinder(.022,.022,.055,brass,x,y+.11,z);
  }
  // Five-point gold star, extruded just enough to catch the firelight.
  const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.115:.27;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?starShape.lineTo(x,y):starShape.moveTo(x,y);}starShape.closePath();
  const star=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape,{depth:.065,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:0xffd180,emissive:0xffb849,emissiveIntensity:.7,metalness:.6,roughness:.3}));star.position.set(tx,4.52,tz);scene.add(star);
  const treeLight=new THREE.PointLight(0xffd59a,5,9,2);treeLight.position.set(tx,2.4,tz+2.2);scene.add(treeLight);
  // Gifts, ribbons and tags.
  const giftMats=[mat(0x892f2c),mat(0xb7a583),mat(0x3d5949),mat(0x9b6b3c)];
  for(let i=0;i<8;i++){
    const g=new THREE.Group();const a=i*2.4;g.position.set(tx+Math.cos(a)*(1+rand()*.7),.01,tz+Math.sin(a)*(1+rand()*.7));g.rotation.y=rand()*2;scene.add(g);
    const w=.45+rand()*.45,h=.3+rand()*.45,d=.42+rand()*.4;
    box(w,h,d,giftMats[i%4],0,h/2,0,g);box(w+.025,.035,d+.025,giftMats[i%4],0,h,0,g);
    box(.07,h+.05,d+.04,brass,0,h/2,0,g);box(w+.04,h+.05,.07,brass,0,h/2,0,g);
    const bow=new THREE.Mesh(new THREE.TorusGeometry(.08,.015,5,15),brass);bow.rotation.x=Math.PI/2;bow.scale.x=1.8;bow.position.set(0,h+.05,0);g.add(bow);
  }

  // Woven rug: a canvas pattern is part of the source asset pipeline, not a downloaded image.
  const rc=document.createElement('canvas');rc.width=512;rc.height=512;const rctx=rc.getContext('2d')!;
  rctx.fillStyle='#692e2d';rctx.fillRect(0,0,512,512);
  for(const [inset,width,color] of [[12,4,'#d0a26b'],[25,12,'#b18155'],[47,3,'#d2af77'],[58,2,'#a57950']] as const){rctx.strokeStyle=color;rctx.lineWidth=width;rctx.strokeRect(inset,inset,512-inset*2,512-inset*2);}
  for(let x=85;x<460;x+=56)for(let y=85;y<460;y+=56){rctx.save();rctx.translate(x,y);rctx.rotate(Math.PI/4);rctx.strokeStyle='#af8055';rctx.lineWidth=3;rctx.strokeRect(-12,-12,24,24);rctx.restore();}
  for(let i=0;i<14000;i++){rctx.fillStyle=`rgba(230,210,170,${rand()*.06})`;rctx.fillRect(rand()*512,rand()*512,1,2);}
  const rugTex=new THREE.CanvasTexture(rc);rugTex.colorSpace=THREE.SRGBColorSpace;const rug=box(6.6,.025,4.8,new THREE.MeshStandardMaterial({map:rugTex,roughness:1}),-.1,.018,.1);rug.rotation.y=-.08;
  // Deep green armchair, side table, knitted throw and a quiet cup of cocoa.
  const upholstery=mat(0x344f43), cushion=mat(0x9c6948);
  const chair=new THREE.Group();chair.position.set(-5.15,0,.2);chair.rotation.y=.72;scene.add(chair);
  for(const x of [-.65,.65])for(const z of [-.6,.6])cylinder(.07,.05,.4,darkwood,x,.2,z,chair);
  box(1.65,.42,1.65,upholstery,0,.55,0,chair);box(1.4,.24,1.3,upholstery,0,.87,.1,chair);
  const back=box(1.65,1.55,.36,upholstery,0,1.28,-.66,chair);back.rotation.x=-.12;
  for(const x of [-.8,.8])box(.29,.68,1.65,upholstery,x,.98,0,chair);
  const pillow=box(.77,.65,.2,cushion,.16,1.27,-.35,chair);pillow.rotation.z=-.12;pillow.rotation.x=-.18;
  const throwMat=mat(0xc4b99e);box(.55,.06,1.18,throwMat,-.72,1.35,.1,chair);box(.55,.8,.07,throwMat,-.72,.94,.72,chair);
  for(let i=0;i<12;i++)box(.015,.08,1.19,ivory,-.97+i*.045,1.39,.1,chair);
  cylinder(.64,.64,.12,oak,-3.65,.85,1.6);for(let i=0;i<3;i++){const a=i/3*Math.PI*2;cylinder(.035,.055,.8,darkwood,-3.65+Math.sin(a)*.4,.4,1.6+Math.cos(a)*.4);}
  const mug=cylinder(.105,.09,.18,ivory,-3.6,1.01,1.6);const coffee=cylinder(.087,.087,.01,mat(0x382117),-3.6,1.106,1.6);coffee.castShadow=false;
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.07,.023,7,16),ivory);handle.position.set(-3.46,1.02,1.6);scene.add(handle);mug.castShadow=true;
  // Low ottoman, books and a standing lamp complete the room without a busy HUD.
  const ottoman=box(1.8,.6,1.15,mat(0x86533b),1.5,.36,2.3);ottoman.rotation.y=-.12;
  for(let i=0;i<2;i++)box(.62,.09,.42,mat(i?0xa49477:0x354b49),1.4,.71+i*.1,2.3).rotation.y=.15-i*.3;
  cylinder(.43,.48,.08,brass,-5.5,.06,-2.2);cylinder(.035,.035,3.5,brass,-5.5,1.8,-2.2);
  const shade=cylinder(.38,.69,.85,new THREE.MeshStandardMaterial({color:0xe3c59a,emissive:0xc68b42,emissiveIntensity:.3,side:THREE.DoubleSide}),-5.5,3.6,-2.2);
  shade.castShadow=false;const lamp=new THREE.PointLight(0xffda99,22,9,2);lamp.position.set(-5.5,3.25,-2.2);scene.add(lamp);
  // Spark embers rise out of the hearth, then fade rather than filling the room.
  const count=28, positions=new Float32Array(count*3), emberGeo=new THREE.BufferGeometry();emberGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const emberMat=new THREE.PointsMaterial({color:0xffac41,size:.035,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending});const sparks=new THREE.Points(emberGeo,emberMat);scene.add(sparks);
  scene.add(new THREE.HemisphereLight(0x9eafc0,0x67432a,1.1));
  const fill=new THREE.DirectionalLight(0xffdab0,1.2);fill.position.set(0,6,6);scene.add(fill);
  return { materials, update(t:number) {
    fire.update(t);windowMat.uniforms.time.value=t;
    fireLight.intensity=40+Math.sin(t*8.4)*2.5+Math.sin(t*13.1)*1.5;bounce.intensity=9+Math.sin(t*7)*.6;
    for(let i=0;i<count;i++) {const life=(t*.21+i*.618)%1;positions[i*3]=fx+Math.sin(i*23.7)*.75+Math.sin(t+i)*life*.17;positions[i*3+1]=.7+life*1.75;positions[i*3+2]=-3.6+Math.sin(i*7)*.21;}
    emberGeo.attributes.position.needsUpdate=true;
  }};
}
