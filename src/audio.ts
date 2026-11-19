// All sound is synthesized locally. No recordings or external audio requests.
const melody: [number, number][] = [
  [76,1],[76,1],[76,2], [76,1],[76,1],[76,2], [76,1],[79,1],[72,1.5],[74,.5],[76,4],
  [77,1],[77,1],[77,1.5],[77,.5], [77,1],[76,1],[76,1],[76,.5],[76,.5], [76,1],[74,1],[74,1],[76,1],[74,2],[79,2],
  [76,1],[76,1],[76,2], [76,1],[76,1],[76,2], [76,1],[79,1],[72,1.5],[74,.5],[76,4],
  [77,1],[77,1],[77,1.5],[77,.5], [77,1],[76,1],[76,1],[76,.5],[76,.5], [79,1],[79,1],[77,1],[74,1],[72,4], [0,4]
];
export class HearthAudio {
  private ctx?: AudioContext;
  private fireGain?: GainNode;
  private musicGain?: GainNode;
  private fireSource?: AudioBufferSourceNode;
  private timer?: ReturnType<typeof setInterval>;
  private index = 0;
  private nextNote = 0;
  fireOn = false;
  musicOn = false;
  private async init() {
    if (!this.ctx) {
      const ctx = this.ctx = new AudioContext();
      this.fireGain = ctx.createGain(); this.fireGain.gain.value = 0; this.fireGain.connect(ctx.destination);
      this.musicGain = ctx.createGain(); this.musicGain.gain.value = 0; this.musicGain.connect(ctx.destination);
      // Long, deterministic noise bed with sparse crackles, filtered into a soft hearth rumble.
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 12, ctx.sampleRate);
      const data = buffer.getChannelData(0); let low = 0, burst = 0, seed = 7919;
      const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < data.length; i++) {
        const n = rand() * 2 - 1; low = (low + .025 * n) / 1.025;
        if (rand() < .00013) burst = .15 + rand() * .6;
        burst *= .994;
        data[i] = low * 3.2 + n * .035 + n * burst;
      }
      this.fireSource = ctx.createBufferSource(); this.fireSource.buffer = buffer; this.fireSource.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2600;
      this.fireSource.connect(filter); filter.connect(this.fireGain); this.fireSource.start();
    }
    await this.ctx.resume();
  }
  async toggleFire() {
    await this.init(); this.fireOn = !this.fireOn;
    this.fireGain!.gain.setTargetAtTime(this.fireOn ? .55 : 0, this.ctx!.currentTime, .35);
    return this.fireOn;
  }
  async toggleMusic() {
    await this.init(); this.musicOn = !this.musicOn;
    this.musicGain!.gain.setTargetAtTime(this.musicOn ? .055 : 0, this.ctx!.currentTime, .5);
    if (this.musicOn) {
      this.index = 0; this.nextNote = this.ctx!.currentTime + .1;
      this.schedule(); this.timer = setInterval(() => this.schedule(), 100);
    } else { clearInterval(this.timer); }
    return this.musicOn;
  }
  private schedule() {
    const ctx = this.ctx!;
    if (this.nextNote < ctx.currentTime) this.nextNote = ctx.currentTime + .05;
    while (this.nextNote < ctx.currentTime + .3) {
      const [note, beats] = melody[this.index];
      if (note) this.bell(note - 12, this.nextNote);
      this.nextNote += beats * .44; this.index = (this.index + 1) % melody.length;
    }
  }
  private bell(note: number, start: number) {
    const ctx = this.ctx!, freq = 440 * 2 ** ((note - 69) / 12);
    for (const [ratio, level, decay] of [[1,1,1.7],[2,.2,.8],[3,.045,.35]]) {
      const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.value = freq * ratio;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(level, start + .014);
      gain.gain.exponentialRampToValueAtTime(.0001, start + decay);
      osc.connect(gain); gain.connect(this.musicGain!); osc.start(start); osc.stop(start + decay + .02);
    }
  }
  async suspend() { if (this.ctx) await this.ctx.suspend(); }
  async resume() { if (this.ctx && (this.fireOn || this.musicOn)) await this.ctx.resume(); }
}
