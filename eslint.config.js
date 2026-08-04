import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["node_modules/**", "dist/**", "coverage/**"] },
  js.configs.recommended,
  react.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // React 17+ con el runtime automático de JSX no necesita `import React`
      // en cada archivo (ver vite.config.js, plugin @vitejs/plugin-react).
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // Esta regla (parte del set orientado a React Compiler de
      // eslint-plugin-react-hooks v7) marca como error el patrón estándar
      // "fetch on mount" (setState async disparado desde un useEffect vía
      // useCallback) — exactamente lo que hace useFetch.js a propósito.
      // Es un falso positivo para este patrón, no un bug real.
      "react-hooks/set-state-in-effect": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    files: ["test/**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier,
];
