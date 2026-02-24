/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", { tsconfig: { esModuleInterop: true } }],
    "^.+.ts?$": ["ts-jest", { tsconfig: { esModuleInterop: true } }],
  },
  moduleNameMapper: {
    "^obsidian$": "<rootDir>/src/__mocks__/obsidian.ts",
  },
};