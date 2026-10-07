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
  const videos = Array.from({ length: 4 }, (_, index) => {
    const video = new Node(); video.paused = true; video.loads = video.plays = 0; video.seeks = []; video.time = 0; video.readyState = 0; video.networkState = 0;
    video.buffered = video.seekable = { length: 0 };
    video.pause = () => { video.paused = true; };
    video.load = () => { video.loads += 1; };
    video.play = () => { video.plays += 1; throw new Error('Scroll media must stay paused'); };
    Object.defineProperty(video, 'src', { set(value) { this.setAttribute('src', value); } });
    Object.defineProperty(video, 'currentTime', { get() { return this.time; }, set(value) { this.time = value; this.seeking = true; this.seeks.push(value); } });
    video.dataset.videoSrc = `/assets/journey/test-${index}.mp4`;
    video.metadata = ({ dataReady = true } = {}) => {
      video.duration = 10; video.readyState = dataReady ? 2 : 1;
      if (dataReady) video.buffered = video.seekable = { length: 1, end: () => 10 };
      video.dispatchEvent(new Event('loadedmetadata'));
    };
    video.finishSeek = () => { video.seeking = false; video.readyState = 2; video.dispatchEvent(new Event('seeked')); };
    return video;
  });
  const video = videos[0];
  const scenes = Array.from({ length: 6 }, (_, index) => {
    const scene = new Node(); scene.querySelectorAll = () => media && index >= 2 ? [videos[index - 2]] : []; return scene;
  });
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
  let reverts = 0, refreshes = 0, timelines = 0, timelineOptions, observerCallback;
  const chain = { to() { return this; }, fromTo() { return this; }, progress() { return this.position || 0; } };
  const gsap = { registerPlugin() {}, set() {}, timeline(options) { timelines += 1; timelineOptions = options; return chain; }, context(callback) { callback(); return { revert() { reverts += 1; } }; } };
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
  return { root, stage, scenes, particles, control, video, videos, document, window, gsap, ScrollTrigger, desktopQuery, reducedQuery, flush,
    get reverts() { return reverts; }, get refreshes() { return refreshes; },
    get timelines() { return timelines; }, get trigger() { return timelineOptions.scrollTrigger; },
    progress(value) { chain.position = value; timelineOptions.onUpdate(); }, visible(value) { observerCallback([{ isIntersecting: value }]); }
  };
}

test('short desktop uses the animated story by width while narrower screens stay static', () => {
  for (const [width, height] of [[1366, 600], [1280, 480], [1024, 480]]) {
    const h = harness({ width, height, vendors: true });
    assert.equal(h.root.classList.contains('journey-enhanced'), true);
    assert.equal(h.refreshes, 1);
    assert.equal(h.control.textContent, 'Reduzir animação');
    assert.equal(h.timelines, 1);
    assert.equal(h.trigger.pin, h.stage);
    assert.equal(h.trigger.end(), `+=${Math.round(height * 4.5)}`);
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
    assert.ok(h.videos.every((video) => !video.hasAttribute('src')));
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

test('all phases reveal one accessible scene in either scroll direction with one pin', () => {
  const h = harness({ desktop: true, vendors: true, media: true });
  for (const index of [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0]) {
    h.progress((index + .5) / 6);
    h.scenes.forEach((scene, position) => {
      assert.equal(scene.inert, position !== index);
      assert.equal(scene.hasAttribute('aria-hidden'), position !== index);
    });
  }
  assert.equal(h.timelines, 1);
  assert.equal(h.reverts, 0);
});

test('failed animation vendor leaves all six static scenes and media fallbacks readable', async () => {
  const h = harness({ desktop: true, media: true });
  h.document.head.children[0].onerror(); await h.flush();
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.ok(h.scenes.every((scene) => !scene.inert && !scene.hasAttribute('aria-hidden')));
  assert.ok(h.videos.every((video) => !video.hasAttribute('src')));
  assert.equal(h.timelines, 0);
});

test('desktop lifecycle hides inactive scenes and reverts once before repeated preference changes', async () => {
  const h = harness({ desktop: true, vendors: true });
  assert.equal(h.root.classList.contains('journey-enhanced'), true);
  assert.equal(h.particles.children.length, 6);
  h.progress(.5);
  assert.deepEqual(h.scenes.map((scene) => scene.inert), [true, true, true, false, true, true]);
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

test('scroll media loads near its phase and keeps its poster until a decoded seek completes', () => {
  const h = harness({ desktop: true, vendors: true, media: true });
  h.progress(2.5 / 6);
  assert.ok(h.videos.every((video) => !video.hasAttribute('src')));
  h.progress(0); h.visible(true); h.progress(1.5 / 6);
  assert.ok(h.videos.every((video) => !video.hasAttribute('src')));
  h.progress(1.9 / 6);
  assert.equal(h.video.hasAttribute('src'), true);
  assert.equal(h.video.classList.contains('is-ready'), false);
  h.progress(2.5 / 6); h.video.metadata();
  assert.equal(h.video.currentTime, 5);
  assert.equal(h.video.classList.contains('is-ready'), false);
  h.video.finishSeek();
  assert.equal(h.video.classList.contains('is-ready'), true);
  assert.equal(h.video.plays, 0);
  assert.equal(h.video.paused, true);
});

test('seeks coalesce to the latest scroll position and run backwards without playing', () => {
  const h = harness({ desktop: true, vendors: true, media: true });
  h.visible(true); h.progress(2.2 / 6); h.video.metadata();
  assert.equal(h.video.seeks.length, 1);
  h.progress(2.4 / 6); h.progress(2.8 / 6);
  assert.equal(h.video.seeks.length, 1);
  assert.equal(h.video.dataset.scrubTarget, '8.000');
  assert.equal(h.video.dataset.scrubFrame, undefined);
  assert.equal(h.video.dataset.scrubSeeking, 'true');
  h.video.finishSeek();
  assert.equal(h.video.seeks.length, 2);
  assert.ok(Math.abs(h.video.currentTime - 8) < .00001);
  h.video.finishSeek(); h.progress(2.1 / 6);
  assert.equal(h.video.dataset.scrubFrame, '8.000');
  assert.equal(h.video.dataset.scrubTarget, '1.000');
  assert.ok(Math.abs(h.video.currentTime - 1) < .00001);
  assert.ok(h.video.seeks.at(-1) < h.video.seeks.at(-2));
  assert.equal(h.video.plays, 0);
  h.video.finishSeek();
  assert.equal(h.video.dataset.scrubFrame, '1.000');
  assert.equal(h.video.dataset.scrubSeeking, 'false');
});

test('data availability resumes the latest metadata-era target while the poster stays visible until seeked', () => {
  const h = harness({ desktop: true, vendors: true, media: true });
  assert.equal(h.video.preload, 'none');
  h.visible(true); h.progress(2.2 / 6);
  assert.equal(h.video.preload, 'auto');
  h.video.networkState = 2; h.video.metadata({ dataReady: false });
  assert.equal(h.video.dataset.scrubReadyState, '1');
  assert.equal(h.video.dataset.scrubNetworkState, '2');
  assert.equal(h.video.dataset.scrubBufferedEnd, '0.000');
  assert.equal(h.video.classList.contains('is-ready'), false);
  h.progress(2.4 / 6); h.progress(2.8 / 6);
  assert.equal(h.video.seeks.length, 0);

  // Even a buffered file is not safe to seek until the browser exposes its range.
  h.video.time = 0; h.video.seeking = false; h.video.readyState = 2;
  h.video.buffered = { length: 1, end: () => 10 };
  h.video.dispatchEvent(new Event('loadeddata'));
  assert.equal(h.video.seeks.length, 0);
  h.video.seekable = { length: 1, end: () => 10 };
  h.video.dispatchEvent(new Event('canplay'));
  assert.equal(h.video.seeks.length, 1);
  assert.ok(Math.abs(h.video.currentTime - 8) < .00001);
  assert.equal(h.video.dataset.scrubReadyState, '2');
  assert.equal(h.video.dataset.scrubBufferedEnd, '10.000');
  assert.equal(h.video.dataset.scrubSeekableEnd, '10.000');
  assert.equal(h.video.classList.contains('is-ready'), false);
  h.video.dispatchEvent(new Event('canplay')); h.video.dispatchEvent(new Event('progress'));
  assert.equal(h.video.seeks.length, 1);
  h.video.finishSeek();
  assert.equal(h.video.classList.contains('is-ready'), true);
  assert.equal(h.video.paused, true);
  assert.equal(h.video.plays, 0);
  h.control.dispatchEvent(new Event('click'));
  assert.equal(h.video.preload, 'none');
  assert.equal(h.video.dataset.scrubReadyState, undefined);
  const seeks = h.video.seeks.length;
  h.video.dispatchEvent(new Event('loadeddata')); h.video.dispatchEvent(new Event('canplay')); h.video.dispatchEvent(new Event('progress'));
  assert.equal(h.video.seeks.length, seeks);
  assert.equal(h.video.dataset.scrubBufferedEnd, undefined);
});

test('decoded-frame diagnostics report presented media time and cancel callbacks on teardown', () => {
  const h = harness({ desktop: true, vendors: true, media: true });
  let frameCallback, cancelled;
  h.video.requestVideoFrameCallback = (callback) => { frameCallback = callback; return 41; };
  h.video.cancelVideoFrameCallback = (id) => { cancelled = id; };
  h.visible(true); h.progress(2.5 / 6); h.video.metadata(); h.video.finishSeek();
  assert.equal(h.video.dataset.scrubDuration, '10.000');
  frameCallback(0, { mediaTime: 4.958333 });
  assert.equal(h.video.dataset.scrubFrame, '4.958');
  h.progress(2.7 / 6); h.video.finishSeek();
  h.control.dispatchEvent(new Event('click'));
  assert.equal(cancelled, 41);
  assert.equal(h.video.dataset.scrubFrame, undefined);
  assert.equal(h.video.dataset.scrubTarget, undefined);
  frameCallback(0, { mediaTime: 7 });
  assert.equal(h.video.dataset.scrubFrame, undefined);
});

test('hidden and off-screen media stays paused; teardown removes source and event handlers', () => {
  const h = harness({ desktop: true, vendors: true, media: true });
  h.visible(true); h.progress(2.5 / 6); h.video.metadata(); h.video.finishSeek();
  h.document.hidden = true; h.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.video.classList.contains('is-ready'), false);
  const seeks = h.video.seeks.length;
  h.progress(2.8 / 6);
  assert.equal(h.video.seeks.length, seeks);
  h.document.hidden = false; h.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.video.seeks.length, seeks + 1);
  h.video.finishSeek();
  h.visible(false);
  assert.equal(h.video.paused, true);
  assert.equal(h.video.classList.contains('is-ready'), false);
  h.reducedQuery.matches = true; h.reducedQuery.dispatchEvent(new Event('change'));
  assert.ok(h.videos.every((video) => !video.hasAttribute('src') && !video.classList.contains('is-ready')));
  assert.equal(h.video.loads, 2);
  const after = h.video.seeks.length;
  h.video.metadata(); h.video.finishSeek();
  assert.equal(h.video.seeks.length, after);
});

test('media errors keep the poster without repeated downloads across preference changes', () => {
  const h = harness({ desktop: true, vendors: true, media: true });
  h.visible(true); h.progress(2.5 / 6);
  h.video.dispatchEvent(new Event('error'));
  h.progress(2.7 / 6); h.visible(false); h.visible(true);
  assert.equal(h.video.loads, 1);
  assert.equal(h.video.classList.contains('is-ready'), false);
  h.control.dispatchEvent(new Event('click')); h.control.dispatchEvent(new Event('click'));
  h.visible(true); h.progress(2.5 / 6);
  assert.equal(h.video.hasAttribute('src'), false);
  assert.equal(h.video.loads, 2);
  assert.equal(h.document.head.children.length, 0);
  assert.equal(h.timelines - h.reverts, 1);
});

test('BFCache restoration rebuilds one pin and resumes paused media with a coherent control', () => {
  const h = harness({ desktop: true, vendors: true, media: true });
  h.visible(true); h.progress(2.5 / 6); h.video.metadata(); h.video.finishSeek();
  h.window.dispatchEvent(new Event('pagehide'));
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.video.hasAttribute('src'), false);
  assert.equal(h.timelines - h.reverts, 0);

  const restored = new Event('pageshow');
  Object.defineProperty(restored, 'persisted', { value: true });
  h.window.dispatchEvent(restored);
  assert.equal(h.root.classList.contains('journey-enhanced'), true);
  assert.equal(h.control.textContent, 'Reduzir animação');
  assert.equal(h.control.attributes.get('aria-pressed'), 'true');
  assert.equal(h.timelines - h.reverts, 1);
  h.visible(true); h.progress(2.5 / 6); h.video.metadata(); h.video.finishSeek();
  assert.equal(h.video.hasAttribute('src'), true);
  assert.equal(h.video.classList.contains('is-ready'), true);
  assert.equal(h.video.paused, true);
  assert.equal(h.video.plays, 0);

  h.window.dispatchEvent(new Event('pageshow'));
  assert.equal(h.timelines, 2);
  h.control.dispatchEvent(new Event('click'));
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.control.textContent, 'Ativar animação');
  assert.equal(h.control.attributes.get('aria-pressed'), 'false');
  assert.equal(h.timelines - h.reverts, 0);
  assert.equal(h.video.hasAttribute('src'), false);
});

test('all six phases have static content and four videos start without a source or autoplay', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.equal([...html.matchAll(/data-journey-scene/g)].length, 6);
  const videos = [...html.matchAll(/<video\b([^>]+)>/g)].map((match) => match[1]);
  assert.equal(videos.length, 4);
  for (const attributes of videos) {
    assert.match(attributes, /data-video-src="\/assets\/journey\//);
    assert.match(attributes, /preload="none"/);
    assert.doesNotMatch(attributes, /(?:^|\s)(?:src=|autoplay\b|loop\b|controls\b)/);
  }
});
