import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Fijo en 8090 para que coincida con CORS_ORIGIN en plantilla-node/.env
  // y con el puerto que usa la imagen Docker (docker-compose.yml expone
  // 8090:80) — así "npm run dev"/"npm run preview" y Docker se comportan
  // igual sin tener que tocar CORS_ORIGIN cada vez que cambias de forma de
  // correr el proyecto. strictPort: falla claro si el puerto ya está
  // ocupado, en vez de arrancar en otro puerto y romper CORS en silencio.
  server: {
    port: 8090,
    strictPort: true,
  },
  preview: {
    port: 8090,
    strictPort: true,
  },
  build: {
    // Separa las librerías de terceros del código propio para que el
    // navegador cachee el vendor chunk aunque cambie el código de la app.
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  test: {
    // jsdom simula un DOM en Node para poder renderizar componentes sin
    // navegador real. setupFiles agrega los matchers de jest-dom
    // (toBeInTheDocument, etc.) a todos los tests sin importarlos c/u.
    environment: "jsdom",
    setupFiles: ["./test/setup.js"],
  },
});
