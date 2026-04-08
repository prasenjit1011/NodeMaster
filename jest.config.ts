export default {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  moduleFileExtensions: ["ts", "js"],
  testMatch: ["**/src/test/**/*.test.ts"],
};