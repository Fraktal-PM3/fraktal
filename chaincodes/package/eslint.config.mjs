import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "module",
            parserOptions: {
                project: "tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ["test/**/*.ts"],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "module",
            parserOptions: {
                project: "tsconfig.test.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
        },
    },
)
