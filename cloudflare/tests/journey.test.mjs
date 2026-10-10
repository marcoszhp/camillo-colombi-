import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JourneySequence, frameAt, phaseAt, frameURL } from '../public/js/journey-sequence.js';
const source = fs.readFileSync(new URL('../public/js/journey.js', import.meta.url), 'utf8').replace(/^import[^\n]+\n/, '');
class Node extends EventTarget {
  constructor() {
    super(); this.attributes = new Map(); this.children = []; this.dataset = {};
    const classes = new Set();
    this.classList = { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) };
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  appendChild(node) { this.children.push(node); }
  remove() {}
}
function harness({ width = 1280, height = 600, reduced = false, vendors = true } = {}) {
  const root = new Node(), stage = new Node(), canvas = new Node(), poster = new Node(), control = new Node();
  const scenes = Array.from({ length: 6 }, () => new Node());
  root.querySelector = (selector) => ({ '[data-journey-stage]': stage, '[data-journey-canvas]': canvas, '[data-journey-poster]': poster, '[data-journey-motion]': control })[selector];
  root.querySelectorAll = (selector) => selector === 'img' ? [poster] : scenes;
  const document = new Node(); document.head = new Node(); document.querySelector = () => root; document.createElement = () => new Node();
  const desktop = new Node(), reduce = new Node(); desktop.matches = width >= 1024; reduce.matches = reduced;
  const window = new Node(); window.matchMedia = (query) => query.includes('reduced') ? reduce : desktop;
  window.IntersectionObserver = true;
  let options, visible, reverts = 0, players = [];
  const chain = { progress: () => chain.position || 0, to() { return this; } };
  const gsap = { registerPlugin() {}, set() {}, timeline(value) { options = value; return chain; }, context(callback) { callback(); return { revert() { reverts++; } }; } };
  const ScrollTrigger = { refresh() {} };
  if (vendors) { window.gsap = gsap; window.ScrollTrigger = ScrollTrigger; }
  class Player { constructor(_, options) { this.options = options; players.push(this); } request(frame) { this.frame = frame; } setActive(active) { this.active = active; } destroy() { this.destroyed = true; } }
  vm.runInNewContext(source, { document, window, innerHeight: height, JourneySequence: Player, frameAt, phaseAt, setTimeout, clearTimeout,
    IntersectionObserver: class { constructor(callback) { visible = callback; } observe() {} disconnect() {} } });
  return { root, stage, scenes, control, document, window, desktop, reduce, gsap,
    get trigger() { return options.scrollTrigger; }, get reverts() { return reverts; }, get player() { return players.at(-1); },
    progress(value) { chain.position = value; options.onUpdate(); }, visible(value) { visible([{ isIntersecting: value }]); },
    flush: async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); } };
}
test('deterministic mapping covers 300 frames and six equal phases', () => {
  assert.equal(frameAt(-1), 1); assert.equal(frameAt(2), 300);
  for (let frame = 1; frame <= 300; frame++) assert.equal(frameAt((frame - 1) / 299), frame);
  assert.deepEqual([1, 50, 51, 100, 101, 150, 151, 200, 201, 250, 251, 300].map(phaseAt), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  assert.equal(frameURL(1), '/assets/journey/blender/frame-0001.webp');
});

test('default browser APIs retain their global receiver during load, draw, reverse and cancel', async () => {
  const names = ['fetch', 'createImageBitmap', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const originals = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  const callbacks = new Map(), draws = [], calls = new Set(); let id = 0;
  const implementations = {
    fetch: async (url) => ({ ok: true, blob: async () => ({ frame: Number(url.match(/frame-(\d+)/)[1]) }) }),
    createImageBitmap: async (blob) => ({ ...blob, width: 960, height: 840, close() {} }),
    requestAnimationFrame: (callback) => { callbacks.set(++id, callback); return id; },
    cancelAnimationFrame: (key) => callbacks.delete(key)
  };
  for (const name of names) Object.defineProperty(globalThis, name, { configurable: true, value: function (...args) {
    assert.ok(this === globalThis, `${name}: illegal browser receiver`);
    calls.add(name); return implementations[name](...args);
  } });
  const canvas = new Node(); canvas.getContext = () => ({ clearRect() {}, drawImage: (bitmap) => draws.push(bitmap.frame) });
  let player;
  try {
    player = new JourneySequence(canvas); player.setActive(true);
    const paint = async () => {
      for (let i = 0; i < 100; i++) await Promise.resolve();
      const ready = [...callbacks.values()]; callbacks.clear(); ready.forEach((callback) => callback());
    };
    await paint(); assert.equal(canvas.dataset.drawnFrame, '1');
    player.request(175); await paint(); assert.equal(canvas.dataset.drawnFrame, '175');
    player.request(25); await paint(); assert.equal(canvas.dataset.drawnFrame, '25');
    player.request(26); player.setActive(false); assert.equal(callbacks.size, 0);
    assert.deepEqual(draws, [1, 175, 25]); assert.equal(calls.size, 4);
    player.destroy(); player = null;
  } finally {
    try { player?.destroy(); } finally {
      names.forEach((name, i) => originals[i] ? Object.defineProperty(globalThis, name, originals[i]) : delete globalThis[name]);
    }
  }
});
test('short desktop has one pin and one accessible phase in both directions', () => {
  const h = harness({ width: 1024, height: 480 });
  assert.ok(h.root.classList.contains('journey-enhanced')); assert.equal(h.trigger.pin, h.stage);
  assert.equal(h.trigger.scrub, .2); assert.equal(h.trigger.end(), '+=2160');
  for (const index of [0, 1, 2, 3, 4, 5, 4, 2, 0]) {
    h.progress((index * 50 + 25) / 299);
    h.scenes.forEach((scene, i) => { assert.equal(scene.inert, i !== index); assert.equal(scene.hasAttribute('aria-hidden'), i !== index); });
  }
});
test('mobile and reduced motion download no vendors and leave six phases readable', () => {
  for (const settings of [{ width: 1023 }, { reduced: true }]) {
    const h = harness({ ...settings, vendors: false });
    assert.equal(h.document.head.children.length, 0); assert.equal(h.player, undefined);
    assert.ok(h.scenes.every((scene) => !scene.inert)); assert.equal(h.control.attributes.get('aria-pressed'), 'false');
  }
});
test('explicit desktop opt-in works; OS changes teardown and restore accessibility', () => {
  const h = harness({ reduced: true }); h.control.dispatchEvent(new Event('click'));
  assert.ok(h.root.classList.contains('journey-enhanced')); h.progress(.8); const player = h.player;
  h.reduce.dispatchEvent(new Event('change')); assert.equal(player.destroyed, true); assert.equal(h.reverts, 1);
  assert.ok(h.scenes.every((scene) => !scene.inert && !scene.hasAttribute('aria-hidden')));
  h.reduce.matches = false; h.reduce.dispatchEvent(new Event('change')); assert.ok(h.root.classList.contains('journey-enhanced'));
});
test('late or failed vendor preserves static fallback', async () => {
  const h = harness({ vendors: false }); const script = h.document.head.children[0];
  h.reduce.matches = true; h.reduce.dispatchEvent(new Event('change')); h.window.gsap = h.gsap; script.onload(); await h.flush();
  assert.equal(h.document.head.children.length, 1); assert.equal(h.player, undefined);
  const failed = harness({ vendors: false }); failed.document.head.children[0].onerror(); await failed.flush();
  assert.equal(failed.player, undefined); assert.ok(failed.scenes.every((scene) => !scene.inert));
});
test('visibility pauses work; BFCache releases and rebuilds player', () => {
  const h = harness(); h.visible(true); assert.equal(h.player.active, true);
  h.document.hidden = true; h.document.dispatchEvent(new Event('visibilitychange')); assert.equal(h.player.active, false);
  h.document.hidden = false; h.visible(false); assert.equal(h.player.active, false);
  const old = h.player; h.window.dispatchEvent(new Event('pagehide')); assert.equal(old.destroyed, true);
  const event = new Event('pageshow'); event.persisted = true; h.window.dispatchEvent(event); assert.notEqual(h.player, old);
});
function sequenceHarness(options = {}) {
  const canvas = new Node(), requests = [], draws = [], callbacks = new Map(); let id = 0, closed = 0;
  canvas.getContext = () => ({ clearRect() {}, drawImage(bitmap) { draws.push(bitmap.frame); } });
  const player = new JourneySequence(canvas, {
    fetchImage(url, { signal }) { return new Promise((resolve, reject) => {
      const request = { frame: Number(url.match(/frame-(\d+)/)[1]), signal, reject, resolve() { resolve({ ok: true, blob: async () => ({ frame: request.frame }) }); } };
      requests.push(request); signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    }); },
    decode: async (blob) => ({ width: 960, height: 840, frame: blob.frame, close() { closed++; } }),
    raf(callback) { callbacks.set(++id, callback); return id; }, cancel(key) { callbacks.delete(key); }, ...options
  });
  return { canvas, player, requests, draws, callbacks, get closed() { return closed; },
    flush: async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); },
    paint() { const ready = [...callbacks.values()]; callbacks.clear(); ready.forEach((callback) => callback()); } };
}
test('sequence loads four at most, cancels long jumps and never paints stale completion', async () => {
  const h = sequenceHarness(); assert.equal(h.requests.length, 0); h.player.setActive(true);
  assert.equal(h.requests.length, 4); assert.equal(h.requests[0].frame, 1);
  h.player.request(250); assert.ok(h.requests.every((request) => request.signal.aborted));
  await h.flush(); assert.equal(h.requests[4].frame, 250); assert.equal(h.player.pending.size, 4);
  h.requests[4].resolve(); await h.flush(); h.paint(); assert.deepEqual(h.draws, [250]);
  h.player.request(120); h.paint(); assert.deepEqual(h.draws, [250]); assert.equal(h.canvas.dataset.requestedFrame, '120');
  h.player.destroy(); await h.flush();
});
test('bounded cache closes images without continually refetching, teardown cancels RAF and downloads', async () => {
  const h = sequenceHarness(); h.player.request(100); h.player.setActive(true);
  const complete = async () => {
    for (let round = 0; round < 12; round++) {
      h.requests.filter((request) => !request.done && !request.signal.aborted).forEach((request) => { request.done = true; request.resolve(); });
      await h.flush(); assert.ok(h.player.cache.size <= 36); assert.ok(h.player.pending.size <= 4);
    }
  };
  await complete(); assert.equal(h.player.cache.size, 36); assert.equal(h.player.pending.size, 0); assert.equal(h.requests.length, 36);
  h.player.request(40); await complete(); assert.ok(h.closed > 0);
  h.player.request(290); const before = h.closed; h.player.destroy();
  assert.equal(h.callbacks.size, 0); assert.equal(h.player.cache.size, 0); assert.equal(h.closed, before + 36);
  await h.flush(); assert.equal(h.player.pending.size, 0); h.paint(); assert.deepEqual(h.draws, []);
});
test('HTML preserves six static phases and catalogue links, with one decorative canvas and no video', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.equal([...html.matchAll(/data-journey-scene/g)].length, 6); assert.equal([...html.matchAll(/<canvas /g)].length, 1);
  assert.match(html, /journey-sequence" aria-hidden="true"/); assert.doesNotMatch(html, /<video|autoplay|data-video-src/);
  for (const label of ['origin', 'roast', 'grinding', 'water', 'extraction', 'serving']) assert.match(html, new RegExp(`id="journey-${label}-title"`));
  assert.match(html, /href="#featured"/); assert.match(html, /href="\/nossa-historia"/);
});


test('missing image retains the poster and hiding then resuming restarts aborted downloads', async () => {
  const h = sequenceHarness(); h.player.setActive(true); h.player.setActive(false);
  await h.flush(); assert.equal(h.player.pending.size, 0); assert.equal(h.callbacks.size, 0);
  h.player.setActive(true); assert.equal(h.requests[4].frame, 1);
  h.player.failed.add(1); h.player.setActive(false); await h.flush(); h.player.setActive(true); h.paint();
  assert.equal(h.canvas.classList.contains('is-ready'), false); assert.equal(h.canvas.dataset.drawnFrame, undefined);
  assert.notEqual(h.requests.at(-1).frame, 1); h.player.destroy(); await h.flush();
});
test('bitmap finishing decode after teardown is closed and never enters cache', async () => {
  const canvas = new Node(); const finishDecode = []; let closed = 0;
  canvas.getContext = () => ({ clearRect() {}, drawImage() { assert.fail('Destroyed player cannot paint'); } });
  const player = new JourneySequence(canvas, {
    fetchImage: async () => ({ ok: true, blob: async () => ({}) }),
    decode: () => new Promise((resolve) => { finishDecode.push(resolve); }), raf: () => 1, cancel() {}
  });
  player.request(300); player.failed.add(299); player.failed.add(298); player.failed.add(297);
  player.setActive(true);
  for (let i = 0; i < 8; i++) await Promise.resolve();
  // Resolve all four decodes independently so the assertion covers their disposal.
  player.destroy(); finishDecode.forEach((resolve) => resolve({ width: 960, height: 840, close() { closed++; } }));
  for (let i = 0; i < 8; i++) await Promise.resolve();
  assert.equal(closed, 4); assert.equal(player.cache.size, 0);
});

test('failed requested frame restores all static phases and releases the pin', () => {
  const h = harness(); h.visible(true); h.progress(.8);
  const player = h.player; player.options.onFailure();
  assert.equal(player.destroyed, true); assert.equal(h.reverts, 1);
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.ok(h.scenes.every((scene) => !scene.inert && !scene.hasAttribute('aria-hidden')));
  assert.equal(h.control.attributes.get('aria-pressed'), 'false');
});

test('failed prefetch falls back only when requested; aborts do not report failure', async () => {
  let failures = 0;
  const h = sequenceHarness({ onFailure() { failures++; } }); h.player.setActive(true);
  h.requests[1].reject(new Error('Missing')); await h.flush();
  assert.equal(failures, 0); h.player.request(2); assert.equal(failures, 1);
  h.player.destroy(); await h.flush(); assert.equal(failures, 1);
  const requested = sequenceHarness({ onFailure() { failures++; } }); requested.player.setActive(true);
  requested.requests[0].reject(new Error('Missing')); await requested.flush();
  assert.equal(failures, 2); requested.player.destroy(); await requested.flush();
});

test('phase jumps show the matching poster instead of stale canvas; reverse paints cached frame', async () => {
  const h = sequenceHarness(); h.player.setActive(true); h.requests[0].resolve(); await h.flush(); h.paint();
  assert.equal(h.canvas.classList.contains('is-ready'), true);
  h.player.request(250); h.paint(); assert.equal(h.canvas.classList.contains('is-ready'), false);
  h.player.request(1); h.paint(); assert.deepEqual(h.draws, [1, 1]);
  assert.equal(h.canvas.classList.contains('is-ready'), true); h.player.destroy(); await h.flush();
  const page = harness(); page.progress(.8);
  const poster = page.root.querySelector('[data-journey-poster]');
  assert.equal(poster.getAttribute('src'), '/assets/journey/blender/poster-extraction.webp');
  poster.dispatchEvent(new Event('error')); assert.equal(poster.hidden, true);
  page.progress(1); assert.equal(poster.hidden, false);
  assert.equal(poster.getAttribute('src'), '/assets/journey/blender/poster-serving.webp');
});
