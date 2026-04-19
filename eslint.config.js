import js from "@eslint/js";

export default [
  {
    ignores: [
      "node_modules",
      "schemas",
      "tool-server",
      "po",
      "md2pango.js",
      "package.json",
      "stylesheet.css",
      "eslint.config.js",
      ".prettierrc",
      ".prettierignore",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      indent: "off",
      quotes: "off",
      semi: "off",
      "linebreak-style": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-case-declarations": "off",
      "no-throw-literal": "off",
    },
  },
];
