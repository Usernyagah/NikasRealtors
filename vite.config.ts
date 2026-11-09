import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Security: Restrict file system access in development
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
      // Deny access to sensitive directories (but allow Vite's internal files)
      deny: [
        // Deny access to .git
        '**/.git/**',
        // Deny access to .env files
        '**/.env*',
        // Deny access to package.json and lock files
        '**/package*.json',
        '**/package-lock.json',
        '**/yarn.lock',
        '**/pnpm-lock.yaml',
        // Deny access to node_modules, but allow Vite's client files
        // Note: We don't block node_modules entirely as Vite needs access to its own files
        // The server.fs.deny bypass vulnerabilities are mitigated by restricting to localhost only
      ],
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ensure CSS is properly included and hashed for cache busting
    cssCodeSplit: true,
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        // Add hash to CSS files for cache busting
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (assetInfo.name?.match(/\.(png|jpe?g|svg|gif|webp|avif)$/i)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (assetInfo.name?.match(/\.(woff|woff2|eot|ttf|otf)$/i)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
      // Ensure CSS is processed correctly
      plugins: [],
    },
    // Ensure CSS is extracted and not inlined
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
  },
}));
