/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/react-internal"],
  ignorePatterns: ["**/.next/**", "**/dist/**", "**/node_modules/**", "**/*.d.ts"],
};
