import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/** @type {import('eslint').Linter.FlatConfig[]} */

// Disable the no-explicit-any rule
const eslintRules = {
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
};
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  eslintRules,
];

export default eslintConfig;
