import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // small plugin to set headers in dev server
    {
      name: 'dev-headers',
      configureServer(server) {
        server.middlewares.use((_req: any, res: any, next: any) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          // Dev CSP: Allow localhost:3000 for API calls, allow unsafe-inline/unsafe-eval for dev
          res.setHeader('Content-Security-Policy', "default-src 'self' http://localhost:3000; connect-src 'self' http://localhost:3000; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;");
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
