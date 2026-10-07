import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id, { getModuleInfo }) {
          // jspdf, html2canvas and the dependencies only they use go in one chunk that
          // is loaded with import(), so no page imports it statically.
          const pdfOnly = new Map<string, boolean>();
          const isPdfOnly = (moduleId: string): boolean => {
            const cached = pdfOnly.get(moduleId);
            if (cached !== undefined) return cached;
            const visited = new Set<string>(); // a cycle adds no outside importer
            const walk = (current: string): boolean => {
              if (/node_modules\/(jspdf|html2canvas)\//.test(current)) return true;
              if (visited.has(current)) return true;
              visited.add(current);
              const info = getModuleInfo(current);
              if (!info || !current.includes('node_modules') || info.importers.length === 0) return false;
              return info.importers.every(walk);
            };
            const result = walk(moduleId);
            pdfOnly.set(moduleId, result);
            return result;
          };

          // Vite's import() helper must not live in the lazy chunk, or everything would import that chunk.
          if (id.includes('vite/preload-helper')) return 'vendor';

          if (id.includes('node_modules')) {
            if (isPdfOnly(id)) {
              return 'vendor-pdf';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('@hello-pangea/dnd') || id.includes('dnd')) {
              return 'vendor-dnd';
            }
            return 'vendor';
          }
        }
      }
    }
  }
}));

