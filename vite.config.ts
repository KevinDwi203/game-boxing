import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function fixFetchGetterPlugin(): Plugin {
  return {
    name: 'fix-fetch-getter',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'script',
            children: `
(function() {
  try {
    var rawFetch = typeof window !== 'undefined' ? window.fetch : null;
    if (rawFetch && typeof rawFetch.bind === 'function') {
      try { rawFetch = rawFetch.bind(window); } catch(e) {}
    }
    Object.defineProperty(window, 'fetch', {
      get: function() { return rawFetch; },
      set: function(val) { rawFetch = val; },
      configurable: true,
      enumerable: true
    });
  } catch(e) {
    try {
      var proto = Object.getPrototypeOf(window) || (typeof Window !== 'undefined' && Window.prototype);
      if (proto) {
        var protoFetch = proto.fetch;
        Object.defineProperty(proto, 'fetch', {
          get: function() { return protoFetch; },
          set: function(val) { protoFetch = val; },
          configurable: true,
          enumerable: true
        });
      }
    } catch(e2) {}
  }
})();
            `.trim(),
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [fixFetchGetterPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
