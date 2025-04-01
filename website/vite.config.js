import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: '../api/dist', // Output directory relative to the Vite root (storefront directory)
    emptyOutDir: true, // Ensures that the output directory is cleaned before each build
  },
  plugins: [tailwindcss(), react()],
});
