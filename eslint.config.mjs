import eslint from "@eslint/js";
import vue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "artifacts/**",
      "dist/**",
      "node_modules/**",
      "public/phoenix/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "vue/multi-word-component-names": "off",
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: [".vue"],
        parser: tseslint.parser,
      },
    },
  },
);
