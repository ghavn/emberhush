import * as THREE from 'three';

// Raymarched density inside a box: turbulent tongues, a hot base and transparent tips.
export function createFire() {
  const uniforms = { time: { value: 0 } };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vLocal; varying vec3 vEye;
    void main(){vLocal=position;vEye=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;
    varying vec3 vLocal; varying vec3 vEye; uniform float time;
    float hash(vec3 p){p=fract(p*.3183099+vec3(.13,.27,.43));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.11)*.15;}
    void main(){
      vec3 rd=normalize(vLocal-vEye),p=vLocal+rd*.006;vec4 sum=vec4(0.);
      for(int i=0;i<64;i++){
        if(any(greaterThan(abs(p),vec3(.505))))break;
        float y=p.y+.5;
        vec3 npos=vec3(p.x*5.,y*3.-time*1.8,p.z*5.);
        float n=fbm(npos);
        float body=-1.;
        for(int j=0;j<5;j++){
          float k=float(j),h=.55+.28*sin(k*3.7+time*.8)+.13*cos(time*1.4+k);
          float yy=y/h;
          float center=(k-2.)*.145+sin(yy*8.-time*2.4+k*4.)*.07*yy;
          float width=.13*(1.-pow(clamp(yy,0.,1.),.7));
          float tongue=width-length(vec2(p.x-center,p.z*.7))+(n-.5)*.105;
          body=max(body,tongue*(1.-smoothstep(.85,1.,yy))-.22*smoothstep(.88,1.,yy));
        }
        float density=smoothstep(-.035,.07,body)*smoothstep(0.,.09,y);
        float heat=clamp(density*.9+(1.-y)*.32,0.,1.);
        vec3 col=mix(vec3(1.8,.12,.006),vec3(2.6,1.1,.06),smoothstep(.15,.65,heat));
        col=mix(col,vec3(3.2,2.25,.8),smoothstep(.65,1.,heat));
        float a=density*.105;sum.rgb+=(1.-sum.a)*col*a;sum.a+=(1.-sum.a)*a;
        p+=rd*.019;
      }
      gl_FragColor=vec4(sum.rgb,sum.a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  mesh.scale.set(2.3, 1.95, .93);
  return { mesh, update(time: number) { uniforms.time.value = time; } };
}
