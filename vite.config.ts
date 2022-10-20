import { resolve } from "path";
import { defineConfig } from "vite";
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'
import replace from '@rollup/plugin-replace';

const REPLACE = {
  __DEV__: `(process.env.NODE_ENV !== 'production')`
}

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [vue(), dts()],
    base: "./",
    test: {
      globals: true,
      environment: "jsdom",
      coverage: {
        provider: 'istanbul' // or 'c8'
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: 'vueVroom',
        fileName: 'vue-vroom',
      },
      rollupOptions: {
        external: ['vue', 'pinia'],
        output: {
          globals: {
            vue: 'Vue',
            pinia: 'pinia'
          }
        },
        plugins: [
          replace({
            values: REPLACE,
            preventAssignment: true
          })
        ]
      }
    },

  }
})