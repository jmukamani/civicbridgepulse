import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock custom hooks
jest.mock('../hooks/useOnlineStatus.js', () => {
  return jest.fn(() => true);
});

jest.mock('../hooks/useQueueSync.js', () => {
  return jest.fn(() => {});
});

// Mock auth utils
jest.mock('../utils/auth.js', () => ({
  getToken: jest.fn(() => 'mock-token'),
  setToken: jest.fn(),
}));

// Mock db utils
jest.mock('../utils/db.js', () => ({
  queueAction: jest.fn(),
  generateId: jest.fn(() => 'mock-id'),
}));

// Mock API endpoints using MSW v1 API
export const server = setupServer(
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        token: 'mock-jwt-token'
      })
    );
  }),

  rest.post('http://localhost:5000/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        token: 'mock-jwt-token'
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.json({
        message: 'Registration successful, please check your email'
      })
    );
  }),

  rest.post('http://localhost:5000/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.json({
        message: 'Registration successful, please check your email'
      })
    );
  }),

  // Issues endpoints
  rest.get('/api/issues', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          title: 'Test Issue',
          description: 'Test Description',
          status: 'reported',
          category: 'infrastructure',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ])
    );
  }),

  rest.get('http://localhost:5000/api/issues', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          title: 'Test Issue',
          description: 'Test Description',
          status: 'reported',
          category: 'infrastructure',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ])
    );
  }),

  rest.post('/api/issues', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 2,
        title: 'Test Issue Title',
        description: 'Test issue description',
        status: 'reported',
        category: 'infrastructure',
        location: 'Test Location',
        createdAt: new Date().toISOString()
      })
    );
  }),

  rest.post('http://localhost:5000/api/issues', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 2,
        title: 'Test Issue Title',
        description: 'Test issue description',
        status: 'reported',
        category: 'infrastructure',
        location: 'Test Location',
        createdAt: new Date().toISOString()
      })
    );
  }),

  // Users endpoints
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      ])
    );
  }),

  rest.get('http://localhost:5000/api/users', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      ])
    );
  })
);

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock; 


jest.mock('../utils/network.js', () => ({
  API_BASE: 'http://localhost:3000'
})); 