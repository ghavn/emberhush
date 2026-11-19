import * as THREE from 'three';
import { createRoom } from './room';
import { HearthAudio } from './audio';
import './style.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const app = $('app'), ui = $('interface'), canvas = $<HTMLCanvasElement>('scene');
const audio = new HearthAudio();
let renderer: THREE.WebGLRenderer;
let mode: 'fire' | 'room' = 'room';
const fireViews = {
  close: { distance: 4.53, height: 1.42, width: 2.55, label: 'Close fire view' },
  medium: { distance: 5.43, height: 1.66, width: 3.65, label: 'Medium fire view' },
  full: { distance: 6.7, height: 1.92, width: 4.9, label: 'Full fireplace view' }
} as const;
type FireView = keyof typeof fireViews;
const fireViewOptions = Object.keys(fireViews) as FireView[];
let fireView: FireView = 'close';
let hideTimer: ReturnType<typeof setTimeout>;
let hidden = false;
let tipsOpen = false;
const announce = (text: string) => { $('announcement').textContent = text; };
function hideControls() {
  if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
  hidden = true; ui.classList.add('hidden'); ui.inert = true; document.body.classList.add('immersed');
  $('tips').hidden = true; tipsOpen = false;
}
function showControls() {
  hidden = false; ui.classList.remove('hidden'); ui.inert = false; document.body.classList.remove('immersed');
  clearTimeout(hideTimer); hideTimer = setTimeout(hideControls, 2000);
}
// A tap on the scene always reveals the controls. Pointer motion also wakes desktop UI.
app.addEventListener('pointerdown', showControls);
let lastMove = 0;
app.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && performance.now() - lastMove > 150) { lastMove = performance.now(); showControls(); } });
ui.addEventListener('focusin', () => { showControls(); clearTimeout(hideTimer); });
ui.addEventListener('focusout', () => { clearTimeout(hideTimer); hideTimer = setTimeout(hideControls, 2000); });
function choose(next: 'fire' | 'room') {
  mode = next; app.dataset.view = mode;
  $('fire').setAttribute('aria-pressed', String(mode === 'fire')); $('room').setAttribute('aria-pressed', String(mode === 'room'));
  $('fire-framing').hidden = mode !== 'fire';
  $('caption').textContent = mode === 'fire' ? 'Stay a little. There is nowhere to be.' : 'Snow outside. Christmas inside.';
  canvas.setAttribute('aria-label', mode === 'fire' ? 'Flickering flames, glowing embers and split logs in the fireplace' : 'A cosy Christmas room with an animated fireplace, decorated tree and falling snow outside');
  announce(mode === 'fire' ? 'Fire view' : 'Christmas room view'); showControls();
}
$('fire').onclick = () => choose('fire'); $('room').onclick = () => choose('room');
function chooseFireView(view: FireView) {
  fireView = view;
  for (const option of fireViewOptions) {
    $(`fire-${option}`).setAttribute('aria-pressed', String(option === view));
  }
  announce(fireViews[view].label);
  showControls();
}
for (const option of fireViewOptions) {
  $(`fire-${option}`).onclick = () => chooseFireView(option);
}
$('about').onclick = () => { tipsOpen = !tipsOpen; $('tips').hidden = !tipsOpen; showControls(); };
$('sound').onclick = async () => {
  try { const on = await audio.toggleFire(); $('sound').setAttribute('aria-pressed', String(on)); $('sound').setAttribute('aria-label', on ? 'Disable fire crackle' : 'Enable fire crackle');
    $('sound-waves').setAttribute('d', on ? 'M15 8q5 4 0 8m3-11q8 7 0 14' : 'm16 9 5 6m0-6-5 6'); announce(on ? 'Fire sound on' : 'Fire sound off');
  } catch { announce('Sound is unavailable in this browser.'); }
  showControls();
};
$('music').onclick = async () => {
  try { const on = await audio.toggleMusic(); $('music').setAttribute('aria-pressed', String(on)); $('music').setAttribute('aria-label', on ? 'Disable Jingle Bells music' : 'Enable quiet Jingle Bells music'); announce(on ? 'Quiet Jingle Bells on' : 'Music off');
  } catch { announce('Music is unavailable in this browser.'); }
  showControls();
};
async function fullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else if (app.requestFullscreen && document.fullscreenEnabled) await app.requestFullscreen(); else announce('Fullscreen is unavailable here. Open the scene in a new tab and use your browser fullscreen control.'); }
  catch { announce('Fullscreen is unavailable here. Open the scene in a new tab and try again.'); }
  showControls();
}
$('fullscreen').onclick = fullscreen;
document.addEventListener('fullscreenchange', () => { const on = !!document.fullscreenElement; $('fullscreen').setAttribute('aria-label', on ? 'Exit fullscreen' : 'Enter fullscreen'); $('fullscreen-label').textContent = on ? 'Exit fullscreen' : 'Fullscreen'; showControls(); });
document.addEventListener('keydown', e => {
  if(e.altKey || e.ctrlKey || e.metaKey) return;
  if(e.key === 'Tab') { if(hidden)showControls(); clearTimeout(hideTimer); return; }
  if(e.key === 'Escape') showControls();
  if(e.key === '1') choose('fire'); if(e.key === '2') choose('room');
  if(e.key.toLowerCase() === 'f') { e.preventDefault(); void fullscreen(); }
  if(e.key.toLowerCase() === 'c') $('sound').click(); if(e.key.toLowerCase() === 'm') $('music').click();
});

try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x17120f);scene.fog=new THREE.FogExp2(0x20170f,.013);
  const camera=new THREE.PerspectiveCamera(48,1,.1,85);
  const world=createRoom(scene);
  const target=new THREE.Vector3(), desired=new THREE.Vector3(), look=new THREE.Vector3(-.4,2.2,-2.7), desiredLook=new THREE.Vector3();
  function cameraGoal() {
    const portrait=innerWidth/innerHeight<.95;
    if (mode === 'room') {
      const framing = Math.max(1, 1.53 / camera.aspect);
      desiredLook.set(-.35, 2.35, -2.9);
      desired.set(2.7, 3.5, 7.7).sub(desiredLook);
      desired.x *= Math.min(framing, 1.14);
      desired.y *= Math.min(framing, 1.7);
      desired.z *= framing;
      desired.add(desiredLook);
      camera.fov = 48;
    } else {
      const view = fireViews[fireView];
      camera.fov = portrait ? 49 : 46;
      const halfWidthPerUnit = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      // Fit the selected width at the hearth's front edge, closest to the camera.
      const distance = Math.max(view.distance, view.width / (2 * halfWidthPerUnit) + .85);
      desired.set(-2.65, view.height + .14, -3.85 + distance);
      desiredLook.set(-2.65, view.height, -3.85);
    }
    camera.updateProjectionMatrix();
  }
  function resize() { renderer.setSize(app.clientWidth,app.clientHeight,false);camera.aspect=app.clientWidth/app.clientHeight;cameraGoal(); }
  window.addEventListener('resize',resize);resize();
  camera.position.copy(desired);look.copy(desiredLook);camera.lookAt(look);
  let previous=performance.now(), elapsed=0, frame=0, raf=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate=(now:number) => {
    raf=requestAnimationFrame(animate);
    if(document.hidden) {previous=now;return;}
    // Thirty frames per second is sufficient for ambience and keeps background viewing lighter.
    if(now-frame<1000/30) return;frame=now;
    const dt=Math.min((now-previous)/1000,.1);previous=now;elapsed+=dt*(reduced?.55:1);
    cameraGoal();const blend=1-Math.exp(-dt*3.2);camera.position.lerp(desired,blend);look.lerp(desiredLook,blend);target.copy(look);camera.lookAt(target);
    world.update(elapsed);renderer.render(scene,camera);
  };
  raf=requestAnimationFrame(animate);
  document.addEventListener('visibilitychange', () => { previous=performance.now(); if(document.hidden)void audio.suspend();else void audio.resume(); });
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);$('error').hidden=false;announce('The graphics connection was interrupted. Reload to relight the hearth.');});
  $('loading').hidden=true;app.dataset.ready='true';app.dataset.view=mode;showControls();
} catch(error) { $('loading').hidden=true;$('error').hidden=false;console.error('Unable to render the Christmas room',error); }
