/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["eslint:recommended"],
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    // TypeScript's own compiler already checks for undefined names/types far
    // more accurately (including ambient globals like React/DOM types) —
    // eslint:recommended's no-undef doesn't understand any of that and
    // produces false positives on every TS/TSX file otherwise.
    "no-undef": "off",
  },
};
