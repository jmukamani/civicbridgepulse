export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/swagger.js'
  ],
  // Run tests sequentially to avoid database interference
  maxWorkers: 1,
  testTimeout: 30000,
  verbose: true
}; 