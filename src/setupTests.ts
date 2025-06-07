// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Configurar Jest para timeouts más rápidos
jest.setTimeout(10000);

// Mock básico para window.matchMedia (mejorado)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => {
    const mockMediaQueryList = {
      matches: query === '(prefers-color-scheme: light)',
      media: query,
      onchange: null,
      addListener: jest.fn(), // Función mock para addListener
      removeListener: jest.fn(), // Función mock para removeListener
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
    return mockMediaQueryList;
  }),
});

// Mock básico para ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock básico para IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mocks básicos para DOM APIs
window.scrollTo = jest.fn();
global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
  cb(performance.now());
  return 1;
});
global.cancelAnimationFrame = jest.fn();

// Mock localStorage optimizado
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'light'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(() => null),
  },
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(() => null),
  },
  writable: true,
});

// Mock simple para document.addEventListener
const originalAddEventListener = document.addEventListener;
document.addEventListener = jest.fn((event, handler, options) => {
  // Ignorar eventos de color mode que pueden causar demoras
  if (event === 'visibilitychange' || event === 'focus' || event === 'blur') {
    return;
  }
  return originalAddEventListener.call(document, event, handler, options);
});

// Mock para getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => ({
    getPropertyValue: jest.fn(() => 'light'),
  })),
});

// Mock para document.documentElement.style
Object.defineProperty(document.documentElement, 'style', {
  value: {
    setProperty: jest.fn(),
    getPropertyValue: jest.fn(() => 'light'),
  },
  writable: true,
});

// Mock global para Chakra UI ColorModeProvider
jest.mock('@chakra-ui/color-mode', () => ({
  useColorMode: () => ({
    colorMode: 'light',
    toggleColorMode: jest.fn(),
    setColorMode: jest.fn()
  }),
  useColorModeValue: (light: any, dark: any) => light,
  ColorModeProvider: ({ children }: any) => children,
  ColorModeScript: () => null,
  createLocalStorageManager: () => ({
    type: 'localStorage',
    get: jest.fn(() => 'light'),
    set: jest.fn()
  })
}));

// Mock global para media queries de Chakra UI
jest.mock('@chakra-ui/media-query', () => ({
  useBreakpointValue: (values: any) => values?.base || Object.values(values)[0],
  useMediaQuery: () => [false],
  createBreakpoints: (breakpoints: any) => breakpoints
}));
