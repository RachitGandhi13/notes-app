/** @type {import("eslint").Linter.Config} */
module.exports = {
  // Deliberately no "plugin:react-hooks/recommended" here: eslint-config-next
  // (used by both apps) bundles its own internal copy of
  // eslint-plugin-react-hooks, and having a second, separately-resolved copy
  // referenced here makes ESLint refuse to run at all ("couldn't determine
  // the plugin uniquely") whenever a single lint run spans both an app and a
  // package using this config — e.g. lint-staged linting a mixed changeset.
  extends: ["plugin:react/recommended", "plugin:@typescript-eslint/recommended", "./index.js"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
