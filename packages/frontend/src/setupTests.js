// Global test setup for Vitest (jsdom environment)
// Base64 polyfills for Node/jsdom
if (typeof globalThis.atob !== 'function') {
  globalThis.atob = (str) => Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('binary');
}
if (typeof globalThis.btoa !== 'function') {
  globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}

// Example: enable useful DOM matchers if installed
// import '@testing-library/jest-dom';

// Example: MSW setup (if/when you add MSW)
// import { server } from './test/mocks/server';
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
