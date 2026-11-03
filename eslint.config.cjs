const js = require('@eslint/js')
const pluginVue = require('eslint-plugin-vue')
const tseslint = require('typescript-eslint')
const prettier = require('eslint-plugin-prettier/recommended')

// * 渲染进程浏览器环境全局（未安装 globals 包，按需声明）
const rendererGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  fetch: 'readonly',
  URL: 'readonly',
  Blob: 'readonly',
  File: 'readonly',
  FileReader: 'readonly',
  FormData: 'readonly',
  Image: 'readonly',
  HTMLElement: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLDivElement: 'readonly',
  HTMLSelectElement: 'readonly',
  HTMLTextAreaElement: 'readonly',
  HTMLCanvasElement: 'readonly',
  HTMLImageElement: 'readonly',
  WebGLRenderingContext: 'readonly',
  WebGLProgram: 'readonly',
  WebGLShader: 'readonly',
  performance: 'readonly',
  Element: 'readonly',
  Node: 'readonly',
  Event: 'readonly',
  CustomEvent: 'readonly',
  KeyboardEvent: 'readonly',
  MouseEvent: 'readonly',
  PointerEvent: 'readonly',
  ClipboardEvent: 'readonly',
  ResizeObserver: 'readonly',
  AbortController: 'readonly',
  getComputedStyle: 'readonly',
  ScrollBehavior: 'readonly',
  alert: 'readonly',
  confirm: 'readonly',
  prompt: 'readonly'
}

module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      'out/**',
      'build/**',
      'build-demo/**',
      'coverage/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      // * ESLint 自身配置是 CJS 且不进构建产物，不需要被 lint
      'eslint.config.cjs',
      '.eslintrc.cjs',
      'scripts/**',
      'LNTP/**',
      // 外部安装的技能库 / 编辑器缓存 / 历史工作记录，不属于本项目源码
      '.trae/**',
      '.agents/**',
      '.claude/**',
      '.workbuddy/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  prettier,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      },
      globals: rendererGlobals
    }
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: rendererGlobals
    }
  },
  {
    rules: {
      'no-console': 'warn',
      'no-debugger': 'warn',
      // * 清理/回滚路径上的空 catch 是有意为之（如删除临时文件失败不影响主流程），
      // * 空 catch 之外的空块仍然报错，避免把逻辑漏写当成风格问题放过
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // * IPC 载荷里大量空 interface 只是标记「这个通道没有参数」，按接口放行
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'always' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'prettier/prettier': 'warn'
    }
  },
  {
    // * 主进程按需 require：原生模块/可选依赖只在真正用到时才加载，改成顶层 import 会拖慢启动
    files: ['electron/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
)
