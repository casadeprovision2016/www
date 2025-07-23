import '@testing-library/jest-dom';

// Mock fetch for API calls during tests
global.fetch = vi.fn();

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:4000',
  },
  writable: true
});

// Setup function to reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});