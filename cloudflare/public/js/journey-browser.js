export const fetchFrame = (...args) => globalThis.fetch(...args);
export const decodeFrame = (...args) => globalThis.createImageBitmap(...args);
export const requestFrame = (...args) => globalThis.requestAnimationFrame(...args);
export const cancelFrame = (...args) => globalThis.cancelAnimationFrame(...args);