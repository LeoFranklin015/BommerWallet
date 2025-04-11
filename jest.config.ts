import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: false,
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
};

export default config; 