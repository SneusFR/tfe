// Polyfill for Draft.js to work in browser environments
if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

// Additional polyfills that Draft.js might need
if (typeof process === 'undefined') {
  window.process = { env: { NODE_ENV: 'production' } };
}
