import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // ==================== 宽松规则配置 ====================

      // 未使用变量 - 完全关闭，让开发更顺畅
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",

      // any 类型 - 完全允许
      "@typescript-eslint/no-explicit-any": "off",

      // React hooks 依赖 - 关闭
      "react-hooks/exhaustive-deps": "off",

      // 图片元素 - 允许使用 img 标签
      "@next/next/no-img-element": "off",

      // 控制台语句 - 开发时允许
      "no-console": "off",

      // 未使用的导入 - 关闭
      "no-unused-vars": "off",

      // 空函数 - 允许
      "@typescript-eslint/no-empty-function": "off",

      // 非空断言 - 允许
      "@typescript-eslint/no-non-null-assertion": "warn",

      // 可选链 - 不强制
      "@typescript-eslint/prefer-optional-chain": "off",

      // 严格相等 - 不强制
      eqeqeq: "off",

      // 分号 - 不强制
      semi: "off",

      // 引号 - 不强制
      quotes: "off",

      // 尾随逗号 - 不强制
      "comma-dangle": "off",

      // 行长度 - 不限制
      "max-len": "off",

      // 函数复杂度 - 不限制
      complexity: "off",

      // 嵌套深度 - 不限制
      "max-depth": "off",

      // 无障碍访问 - 关闭alt属性要求
      "jsx-a11y/alt-text": "off",
    },
  },
];

export default eslintConfig;
