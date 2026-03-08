import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Unused variables/imports
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Enforce consistent type imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // Disallow non-null assertions (flag for review)
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Require explicit return types on exported functions
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],

      // No explicit any
      "@typescript-eslint/no-explicit-any": "warn",

      // Prefer nullish coalescing
      "@typescript-eslint/prefer-nullish-coalescing": "warn",

      // Prefer optional chaining
      "@typescript-eslint/prefer-optional-chain": "warn",

      // No floating promises
      "@typescript-eslint/no-floating-promises": "error",

      // No misused promises
      "@typescript-eslint/no-misused-promises": "error",

      // Require await in async functions
      "@typescript-eslint/require-await": "warn",

      // Consistent array types
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],

      // No unnecessary type assertions
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "*.js"],
  }
);
