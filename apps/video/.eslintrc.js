/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/eslint-config/next"],
  parser: "@typescript-eslint/parser",
  parserOptions: { project: true },
};
