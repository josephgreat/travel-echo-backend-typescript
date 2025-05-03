import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["./src/**/*.{js,mjs,cjs,ts}"],
    ignores: ["node_modules", "dist"],
    plugins: { js },
    extends: ["js/recommended"]
  },
  {
    files: ["./src/**/*.{js,mjs,cjs,ts}"],
    ignores: ["node_modules", "dist"],
    languageOptions: { globals: globals.node }
  },
  tseslint.configs.recommended
]);
