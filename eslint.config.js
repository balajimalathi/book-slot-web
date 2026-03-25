import pluginNext from "@next/eslint-plugin-next";

export default [
  {
    name: "nextjs",
    ignores: ["**/.next/**", "**/node_modules/**"],
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
];

