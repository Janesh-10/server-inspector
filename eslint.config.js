import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/", "ui/dist/", "coverage/"],
  },

  {
    files: ["server/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];
