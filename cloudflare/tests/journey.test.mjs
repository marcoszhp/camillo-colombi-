import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/js/journey.js', import.meta.url), 'utf8');

function matchesViewport(query, width, height) {
  const minWidth = query.match(/min-width:\s*(\d+)px/);
  const minHeight = query.match(/min-height:\s*(\d+)px/);
  return (!minWidth || width >= Number(minWidth[1])) && (!minHeight || height >= Number(minHeight[1]));
}

function harness({ desktop = false, width = desktop ? 1280 : 390, height = 800, reduced = false, vendors = false, media = false } = {}) {
  class Node extends EventTarget {
    constructor() {
      super(); this.attributes = new Map(); this.children = []; this.dataset = {}; this.style = {};
      const classes = new Set();
      this.classList = { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name), toggle: (name, force) => force ? classes.add(name) : classes.delete(name) };
    }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    hasAttribute(name) { return this.attributes.has(name); }
    appendChild(node) { this.children.push(node); }
    replaceChildren() { this.children = []; }
    remove() { this.removed = true; }
    querySelector() { return new Node(); }
  }
  const stage = new Node(), control = new Node(), particles = new Node(), root = new Node();
  const video = new Node(); video.paused = true; video.loads = video.plays = 0;
  video.pause = () => { video.paused = true; };
  video.load = () => { video.loads += 1; };
  video.play = () => { video.paused = false; video.plays += 1; return Promise.resolve(); };
  Object.defineProperty(video, 'src', { set(value) { this.setAttribute('src', value); } });
  if (media) video.dataset.videoSrc = '/assets/journey/test.mp4';
  const scenes = [new Node(), new Node(), new Node()];
  root.querySelector = (selector) => ({ '[data-journey-stage]': stage, '[data-journey-motion]': control, '[data-journey-particles]': particles, video })[selector];
  root.querySelectorAll = (selector) => selector === '[data-journey-scene]' ? scenes : [];
  const document = new Node(); document.head = new Node(); document.documentElement = new Node();
  document.querySelector = () => root; document.createElement = () => new Node();
  const desktopQuery = new Node(), reducedQuery = new Node(); desktopQuery.matches = desktop; reducedQuery.matches = reduced;
  const window = new Node(); window.matchMedia = (query) => {
    if (query.includes('reduced')) return reducedQuery;
    desktopQuery.matches = matchesViewport(query, width, height);
    return desktopQuery;
  };
  window.IntersectionObserver = true;
  let reverts = 0, refreshes = 0, timelineOptions, observerCallback;
  const chain = { to() { return this; }, fromTo() { return this; }, progress() { return this.position || 0; } };
  const gsap = { registerPlugin() {}, set() {}, timeline(options) { timelineOptions = options; return chain; }, context(callback) { callback(); return { revert() { reverts += 1; } }; } };
  const ScrollTrigger = { refresh() { refreshes += 1; } };
  if (vendors) { window.gsap = gsap; window.ScrollTrigger = ScrollTrigger; }
  const timers = new Map(); let timerId = 0;
  vm.runInNewContext(source, {
    document, window, innerHeight: height,
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); },
    getComputedStyle() { return { getPropertyValue: (key) => ({ '--journey-paper': '#f7f2e6', '--journey-ink': '#33271e', '--journey-roast': '#3c241b' })[key] }; },
    MutationObserver: class { observe() {} },
    IntersectionObserver: class { constructor(callback) { observerCallback = callback; } observe() {} disconnect() {} }
  });
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
  return { root, stage, scenes, particles, control, video, document, window, gsap, ScrollTrigger, desktopQuery, reducedQuery, flush,
    get reverts() { return reverts; }, get refreshes() { return refreshes; },
    progress(value) { chain.position = value; timelineOptions.onUpdate(); }, visible(value) { observerCallback([{ isIntersecting: value }]); }
  };
}

test('short desktop uses the animated story by width while narrower screens stay static', () => {
  for (const [width, height] of [[1366, 600], [1280, 480], [1024, 480]]) {
    const h = harness({ width, height, vendors: true });
    assert.equal(h.root.classList.contains('journey-enhanced'), true);
    assert.equal(h.refreshes, 1);
    assert.equal(h.control.textContent, 'Reduzir animação');
  }
  const mobile = harness({ width: 1023, height: 480 });
  mobile.control.dispatchEvent(new Event('click'));
  assert.equal(mobile.document.head.children.length, 0);
  assert.equal(mobile.root.classList.contains('journey-enhanced'), false);

  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const beanQueries = [...html.matchAll(/<source media="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(beanQueries.length, 2);
  for (const query of beanQueries) {
    assert.equal(matchesViewport(query, 1280, 480), true);
    assert.equal(matchesViewport(query, 1023, 800), false);
    assert.ok(query.includes('(prefers-reduced-motion: no-preference)'));
  }
});

test('mobile and reduced motion keep every scene readable without vendor or video downloads', () => {
  for (const options of [{}, { desktop: true, reduced: true }]) {
    const h = harness({ ...options, media: true });
    assert.equal(h.document.head.children.length, 0);
    assert.equal(h.root.classList.contains('journey-enhanced'), false);
    assert.ok(h.scenes.every((scene) => !scene.inert && !scene.hasAttribute('aria-hidden')));
    assert.equal(h.video.hasAttribute('src'), false);
  }
});

test('a delayed vendor response cannot start a pin after reduced motion is enabled', async () => {
  const h = harness({ desktop: true });
  const script = h.document.head.children[0];
  assert.equal(script.src, '/js/vendor/gsap.min.js');
  h.reducedQuery.matches = true; h.reducedQuery.dispatchEvent(new Event('change'));
  h.window.gsap = h.gsap; script.onload(); await h.flush();
  assert.equal(h.document.head.children.length, 1);
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.refreshes, 0);
});

test('desktop lifecycle hides inactive scenes and reverts once before repeated preference changes', async () => {
  const h = harness({ desktop: true, vendors: true });
  assert.equal(h.root.classList.contains('journey-enhanced'), true);
  assert.equal(h.particles.children.length, 6);
  h.progress(.5);
  assert.deepEqual(h.scenes.map((scene) => scene.inert), [true, false, true]);
  h.reducedQuery.matches = true; h.reducedQuery.dispatchEvent(new Event('change'));
  assert.equal(h.reverts, 1);
  assert.equal(h.particles.children.length, 0);
  assert.ok(h.scenes.every((scene) => !scene.inert && !scene.hasAttribute('aria-hidden')));
  h.reducedQuery.dispatchEvent(new Event('change'));
  assert.equal(h.reverts, 1);
  h.reducedQuery.matches = false; h.reducedQuery.dispatchEvent(new Event('change'));
  assert.equal(h.refreshes, 2);
  h.control.dispatchEvent(new Event('click'));
  assert.equal(h.reverts, 2);
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.control.attributes.get('aria-pressed'), 'false');
  await h.flush();
});

test('an explicit desktop opt-in overrides reduced motion and a runtime OS change restores the system default', async () => {
  const h = harness({ width: 1280, height: 480, reduced: true, media: true });
  assert.equal(h.control.textContent, 'Ativar animação');
  assert.equal(h.document.head.children.length, 0);
  assert.equal(h.video.hasAttribute('src'), false);
  h.control.dispatchEvent(new Event('click'));
  assert.equal(h.document.head.children[0].src, '/js/vendor/gsap.min.js');
  h.window.gsap = h.gsap; h.document.head.children[0].onload(); await h.flush();
  assert.equal(h.document.head.children[1].src, '/js/vendor/ScrollTrigger.min.js');
  h.window.ScrollTrigger = h.ScrollTrigger; h.document.head.children[1].onload(); await h.flush();
  assert.equal(h.root.classList.contains('journey-enhanced'), true);
  assert.equal(h.control.textContent, 'Reduzir animação');
  h.control.dispatchEvent(new Event('click'));
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.control.textContent, 'Ativar animação');
  h.reducedQuery.matches = false; h.reducedQuery.dispatchEvent(new Event('change'));
  assert.equal(h.root.classList.contains('journey-enhanced'), true);
  h.reducedQuery.matches = true; h.reducedQuery.dispatchEvent(new Event('change'));
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.control.textContent, 'Ativar animação');
  assert.equal(h.video.hasAttribute('src'), false);
});

test('optional preparation media loads near its scene, pauses off screen and unloads on teardown', async () => {
  const h = harness({ desktop: true, vendors: true, media: true });
  h.visible(true); h.progress(.4);
  assert.equal(h.video.hasAttribute('src'), false);
  h.progress(.65); await h.flush();
  assert.equal(h.video.plays, 1);
  assert.equal(h.video.classList.contains('is-playing'), true);
  h.visible(false);
  assert.equal(h.video.paused, true);
  h.reducedQuery.matches = true; h.reducedQuery.dispatchEvent(new Event('change'));
  assert.equal(h.video.hasAttribute('src'), false);
  assert.equal(h.video.classList.contains('is-playing'), false);
  assert.equal(h.video.loads, 2);
});
