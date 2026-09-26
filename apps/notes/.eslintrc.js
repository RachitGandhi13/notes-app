/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/eslint-config/next"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  // Typed linting needs each file in tsconfig; plain-JS config files aren't.
  ignorePatterns: [".eslintrc.js", "*.config.js"],
};
