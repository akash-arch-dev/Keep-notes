import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: "KeepScribe - Creative Writer's Studio",
          short_name: 'KeepScribe',
          description: 'Extended Google Keep for creative writers with multi-page notes, drawing, audio, video, and vocabulary map.',
          theme_color: '#f59e0b',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'vite-sandbox-ws-guard',
        transformIndexHtml: {
          order: 'pre',
          handler() {
            return [
              {
                tag: 'script',
                attrs: { type: 'text/javascript' },
                children: `
(function() {
  if (typeof window !== 'undefined' && window.WebSocket) {
    var NativeWS = window.WebSocket;
    function NoopWS() {
      var t = new EventTarget();
      t.readyState = 1;
      t.OPEN = 1;
      t.CONNECTING = 0;
      t.CLOSING = 2;
      t.CLOSED = 3;
      t.url = '';
      t.protocol = 'vite-hmr';
      t.send = function() {};
      t.close = function() {};
      return t;
    }
    window.WebSocket = function(url, proto) {
      if (proto === 'vite-hmr' || proto === 'vite-ping' || (typeof url === 'string' && (url.indexOf('token=') !== -1 || url.indexOf('vite') !== -1))) {
        return NoopWS();
      }
      return new NativeWS(url, proto);
    };
    window.WebSocket.prototype = NativeWS.prototype;
    window.WebSocket.CONNECTING = 0;
    window.WebSocket.OPEN = 1;
    window.WebSocket.CLOSING = 2;
    window.WebSocket.CLOSED = 3;
    window.addEventListener('error', function(e) {
      var msg = e && (e.message || (e.error && e.error.message) || '');
      if (typeof msg === 'string' && (msg.includes('WebSocket') || msg.includes('createWebSocketModuleRunnerTransport') || msg.includes('@vite/client'))) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    window.addEventListener('unhandledrejection', function(e) {
      var r = e && e.reason && (e.reason.message || String(e.reason));
      if (typeof r === 'string' && (r.includes('WebSocket') || r.includes('createWebSocketModuleRunnerTransport') || r.includes('@vite/client'))) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
})();
`,
                injectTo: 'head-prepend',
              },
            ];
          },
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
