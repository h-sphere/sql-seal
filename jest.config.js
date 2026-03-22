/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
    "^.+.ts?$": ["ts-jest",{}],
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__mocks__/'
  ],
  moduleNameMapper: {
    '^virtual:wa-sqlite-wasm-url$': '<rootDir>/src/modules/explorer/database/__tests__/__mocks__/wa-sqlite-wasm-url.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(wa-sqlite)/)'
  ],
};