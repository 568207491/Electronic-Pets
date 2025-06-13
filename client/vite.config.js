import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // 配置跨域代理
      '/url': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/url/, ''),
        // 添加调试信息
        configure: (proxy, options) => {
          console.log(`[Vite] API代理配置: ${options.target}`);
          proxy.on('error', (err, req, res) => {
            console.log('[Vite] 代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[Vite] 发送代理请求:', req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Vite] 收到代理响应:', proxyRes.statusCode);
          });
        }
      }
    },
    // 确保服务器启动信息可见
    port: 5173,
    host: 'localhost',
    open: true,
    // 显示详细日志
    logLevel: 'info'
  }
})
