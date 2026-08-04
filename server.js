// Servidor de producción alternativo a Docker: sirve el build de
// `vite build` con las MISMAS cabeceras de seguridad y cache-control que
// `nginx.conf` (usado dentro de la imagen Docker), para que el
// comportamiento sea idéntico corras esto con o sin contenedores.
//
// Si cambias algo acá, cambia también nginx.conf (y viceversa) — son dos
// implementaciones del mismo contrato, no hay forma de compartir el código
// entre un config de nginx y JS.
//
// Uso: npm run build && npm run preview
import express from "express";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const port = Number(process.env.PORT) || 8090;

const app = express();

app.disable("x-powered-by");
app.use(compression());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  // connect-src incluye el origen de plantilla-node: sin esto, CSP
  // bloquea el fetch/axios ANTES de que exista un problema de CORS (el
  // navegador ni intenta la conexión). Mantener en sync con nginx.conf.
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' http://localhost:3010; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  );
  // Igual que en nginx.conf: no tiene efecto real sobre HTTP plano, el
  // navegador la ignora fuera de HTTPS.
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  next();
});

// Los archivos bajo /assets/ tienen hash en el nombre (los genera Vite):
// cacheo "para siempre" es seguro porque cualquier cambio de contenido
// cambia el nombre del archivo.
app.use(
  "/assets",
  express.static(path.join(distDir, "assets"), {
    immutable: true,
    maxAge: "1y",
  })
);

app.use(
  express.static(distDir, {
    index: false,
    setHeaders: (res) => res.setHeader("Cache-Control", "no-cache"),
  })
);

// SPA fallback: cualquier ruta no encontrada devuelve index.html (mismo
// comportamiento que try_files $uri /index.html en nginx.conf), para que
// React Router pueda resolverla del lado del cliente.
app.get("*", (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`plantilla-react (build de producción) sirviendo en el puerto ${port}`);
});
