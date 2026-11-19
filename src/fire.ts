import * as THREE from 'three';

export function createFire() {
  const uniforms = { time: { value: 0 }, draft: { value: 0 }, burn: { value: 1 } };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `
      varying vec3 entry;
      varying vec3 eye;
      void main() {
        entry = position;
        eye = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 entry;
      varying vec3 eye;
      uniform float time;
      uniform float draft;
      uniform float burn;

      float hash(vec3 p) {
        p = fract(p * .3183099 + vec3(.13, .27, .43)) * 17.;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3. - 2. * f);
        return mix(
          mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
          f.z);
      }

      void main() {
        vec3 ray = normalize(entry - eye);
        const float stepSize = .024;
        vec3 p = entry + ray * .012;
        vec4 sum = vec4(0.);
        for (int i = 0; i < 64; i++, p += ray * stepSize) {
          if (any(greaterThan(abs(p), vec3(.502))) || sum.a > .98) break;
          float y = clamp(p.y + .5, 0., 1.);
          vec3 advection = vec3(p.x * 5.2, y * 4.8 - time * 1.85, p.z * 3.8);
          float roll = noise(advection);
          float detail = noise(advection * 2.35 + vec3(2.5, -time * .32, 6.));
          float bend = (roll - .5) * (.10 + y * .27) + draft * y * .11;

          // Offset the roots in depth so curling tongues overlap at the logs.
          float shape = 0.;
          for (int j = 0; j < 5; j++) {
            float k = float(j);
            float phase = k * 4.26;
            float lift = noise(vec3(k * 7.9, time * .76, 4.3));
            float height = (.23 + lift * .45 + .09 * sin(k * 2.7)) * burn;
            float rise = y / height;
            float root = (k - 2.) * .142;
            float center = root * (1. - .22 * rise) + bend
                         + sin(rise * 5.8 - time * 3.4 + phase) * .065 * rise;
            float depth = .16 * sin(phase) + .17 * (detail - .5) * rise;
            float width = .111 * (1. - .75 * smoothstep(.10, 1., rise));
            float edge = width - length(vec2(p.x - center, (p.z - depth) * .67));
            edge += (detail - .5) * (.027 + rise * .05);
            float tongue = smoothstep(-.038, .063, edge) * (1. - smoothstep(.61, 1., rise));
            shape = 1. - (1. - shape) * (1. - tongue);
          }

          float base = smoothstep(0., .065, y);
          float density = shape * base * mix(.65, 1.12, roll);
          float heat = clamp(.24 + density * .52 + (1. - y) * .35 - y * .36, 0., 1.);
          vec3 color = mix(vec3(.8, .022, .001), vec3(2.0, .25, .009),
                           smoothstep(.26, .7, heat));
          color = mix(color, vec3(2.5, .94, .16), smoothstep(.73, 1., heat));
          float alpha = 1. - exp(-density * stepSize * 8.1);
          sum.rgb += (1. - sum.a) * color * alpha;
          sum.a += (1. - sum.a) * alpha;
        }
        gl_FragColor = vec4(sum.rgb / max(sum.a, .0001), sum.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  mesh.scale.set(2.34, 2.19, .84);
  mesh.renderOrder = 1;

  return {
    mesh,
    update(time: number, draft: number, burn: number) {
      uniforms.time.value = time;
      uniforms.draft.value = draft;
      uniforms.burn.value = burn;
    }
  };
}
