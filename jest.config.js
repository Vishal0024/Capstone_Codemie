module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/api/**/*.test.js'],
  globalSetup: '<rootDir>/tests/support/jest-global-setup.js',
  globalTeardown: '<rootDir>/tests/support/jest-global-teardown.js',
  testTimeout: 30000,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
