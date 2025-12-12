import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'self' http://localhost:5190; connect-src 'self' http://localhost:5190 https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://*.firebaseio.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data: https:;"
          );
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
        target: 'http://localhost:5190',
        changeOrigin: true,
      },
    },
  },

  // 🔥 IMPORTANT FOR VERCEL
  build: {
    outDir: "dist",
  }
});
