export const FRAME_COUNT = 300;
export const frameAt = (progress) => 1 + Math.round(Math.max(0, Math.min(1, Number(progress) || 0)) * (FRAME_COUNT - 1));
export const phaseAt = (frame) => Math.min(5, Math.floor((frame - 1) / 50));
export const frameURL = (frame) => `/assets/journey/blender/frame-${String(frame).padStart(4, '0')}.webp`;

// 36 decoded RGBA frames + four in flight: about 129 MB at 960 × 840.
// No frame is fetched until the pinned stage is visible and the page is active.
export class JourneySequence {
  constructor(canvas, { fetchImage = fetch, decode = createImageBitmap, raf = requestAnimationFrame, cancel = cancelAnimationFrame, onFailure = () => {} } = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    if (!this.context) throw new Error('Canvas indisponível');
    this.fetchImage = fetchImage; this.decode = decode; this.raf = raf; this.cancel = cancel;
    this.onFailure = onFailure;
    this.cache = new Map(); this.pending = new Map(); this.failed = new Set();
    this.target = 1; this.direction = 1; this.active = false; this.dead = false; this.tick = null;
    this.report();
  }
  report() {
    this.canvas.dataset.requestedFrame = String(this.target);
    this.canvas.dataset.cache = String(this.cache.size);
    this.canvas.dataset.loading = String(this.pending.size);
  }
  setActive(active) {
    if (this.dead) return;
    this.active = active;
    if (!active) {
      this.pending.forEach(({ controller }) => controller.abort());
      if (this.tick !== null) this.cancel(this.tick);
      this.tick = null;
    } else { this.schedule(); this.pump(); }
  }
  request(frame) {
    if (this.dead) return;
    if (frame !== this.target) this.direction = frame > this.target ? 1 : -1;
    this.target = frame;
    if (this.failed.has(frame)) { this.onFailure(); return; }
    // A previous phase must never cover the poster while a jump is loading.
    if (phaseAt(Number(this.canvas.dataset.drawnFrame)) !== phaseAt(frame)) this.canvas.classList.remove('is-ready');
    // Long jumps cancel irrelevant fetches; completion always checks the latest target.
    this.pending.forEach(({ controller }, index) => { if (Math.abs(index - frame) > 20) controller.abort(); });
    this.report();
    if (this.active) { this.schedule(); this.pump(); }
  }
  priorities() {
    const order = [this.target];
    for (let offset = 1; offset <= 20; offset += 1) order.push(this.target + offset * this.direction, this.target - offset * this.direction);
    return order.filter((frame) => frame >= 1 && frame <= FRAME_COUNT).slice(0, 36);
  }
  trim() {
    const leastUseful = [...this.cache.keys()].sort((a, b) => Math.abs(b - this.target) - Math.abs(a - this.target));
    while (this.cache.size > 36) {
      const frame = leastUseful.shift(); this.cache.get(frame).close?.(); this.cache.delete(frame);
    }
  }
  pump() {
    if (!this.active || this.dead) return;
    for (const frame of this.priorities()) {
      if (this.pending.size >= 4) break;
      if (this.cache.has(frame) || this.pending.has(frame) || this.failed.has(frame)) continue;
      const controller = new AbortController();
      const entry = { controller };
      this.pending.set(frame, entry);
      this.fetchImage(frameURL(frame), { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error('Frame indisponível');
        return response.blob();
      }).then((blob) => {
        if (controller.signal.aborted || this.dead) return null;
        return this.decode(blob);
      }).then((bitmap) => {
        if (!bitmap) return;
        if (this.dead || controller.signal.aborted || !this.active || Math.abs(frame - this.target) > 20) { bitmap.close?.(); return; }
        // The renderer contract is fixed; malformed images must never inflate the cache.
        if (bitmap.width !== 960 || bitmap.height !== 840) { bitmap.close?.(); throw new Error('Dimensões inválidas'); }
        this.cache.set(frame, bitmap); this.trim();
        if (frame === this.target) this.schedule();
      }).catch(() => {
        if (!controller.signal.aborted && !this.dead) {
          this.failed.add(frame);
          if (frame === this.target) this.onFailure();
        }
      }).finally(() => {
        this.pending.delete(frame); this.report(); this.pump();
      });
    }
    this.report();
  }
  schedule() {
    if (this.tick !== null || this.dead || !this.active) return;
    this.tick = this.raf(() => {
      this.tick = null;
      if (this.dead || !this.active) return;
      const bitmap = this.cache.get(this.target);
      // Retain the last complete image during loading; the HTML poster sits below it.
      if (!bitmap) return;
      this.context.clearRect(0, 0, 960, 840);
      this.context.drawImage(bitmap, 0, 0, 960, 840);
      this.canvas.dataset.drawnFrame = String(this.target);
      this.canvas.classList.add('is-ready');
    });
  }
  destroy() {
    this.setActive(false); this.dead = true;
    this.cache.forEach((bitmap) => bitmap.close?.()); this.cache.clear(); this.failed.clear();
    this.context.clearRect(0, 0, 960, 840); this.canvas.classList.remove('is-ready');
    delete this.canvas.dataset.drawnFrame; this.report();
  }
}

