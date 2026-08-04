# plantilla-react — template de proyecto React grande

> Si estás trabajando aquí con Claude Code (u otra IA compatible con
> Agent Skills), lee primero `.claude/skills/plantilla-react/SKILL.md` —
> documenta la arquitectura, las convenciones y el procedimiento para
> generar un proyecto nuevo a partir de esta plantilla.
>
> **¿Primera vez con esto?** Leé `INSTRUCTIVO.md` — es una guía paso a
> paso pensada para aprender, con ejemplos que podés probar vos mismo.

```
src/
├── assets/       # imágenes, íconos, fuentes
├── components/
│   ├── common/   # ErrorBoundary, Loader, botones, inputs reutilizables
│   └── layout/   # Header, Footer, layouts de página
├── pages/        # una carpeta por página, cargada con React.lazy()
├── routes/       # AppRoutes.jsx: define el router + qué página es lazy
├── hooks/        # hooks reutilizables (ej. useFetch)
├── services/     # apiClient.js: único punto de llamadas HTTP
├── context/      # estado global (Context API, reemplazable por Redux/Zustand)
├── utils/        # helpers puros (logger, formatters, etc.)
├── constants/    # valores fijos de la app (URLs, keys)
├── styles/       # CSS global
├── App.jsx
└── main.jsx
```

## Code splitting (lazy components)

`src/routes/AppRoutes.jsx` usa `React.lazy()` + `<Suspense>` por página, así
que el bundle inicial no incluye código de páginas que el usuario todavía no
visitó. `vite.config.js` además separa React/React Router en un chunk
`vendor` aparte del código propio.

## Manejo de errores

- **`ErrorBoundary`** (envuelve toda la app en `main.jsx`): si un componente
  falla al renderizar, se muestra un fallback en vez de romper toda la UI.
- **`apiClient.js`**: instancia de `axios` con timeout e interceptor de
  respuesta que traduce cualquier error (timeout, red, status != 2xx) a
  `ApiError`, en vez de dejar que rompa el componente que llama.
- **`useFetch`**: hook de ejemplo que expone `{ data, error, loading }` para
  que ningún componente tenga que hacer `try/catch` manualmente.
- **`window.addEventListener("error"/"unhandledrejection")`** en
  `main.jsx`: registra errores que ocurren fuera del árbol de React (donde
  un Error Boundary no llega).

## Cabeceras de seguridad

`nginx.conf` (con Docker) y `server.js` (sin Docker, ver más abajo) agregan
las mismas cabeceras en cada respuesta: `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`,
`Content-Security-Policy` y `Strict-Transport-Security` (esta última solo
surte efecto si el sitio se sirve por HTTPS).

`connect-src` en la CSP ya incluye `http://localhost:3010` (el origen por
defecto de `plantilla-node`) — **si cambias `VITE_API_BASE_URL` a otra URL,
tienes que actualizar `connect-src` también en los dos archivos, o CSP
bloquea la llamada antes de que exista siquiera un problema de CORS**, y el
error que se ve en la app es un "Network Error" genérico que no menciona
CSP en ningún lado obvio (solo queda en la consola del navegador como
"Refused to connect..."). Revisa también `script-src`/`style-src` si
agregas alguna librería que inyecte `<script>` o `<style>` externos.

## Conectada con plantilla-node (de verdad, no solo "compatible")

`VITE_API_BASE_URL` (en `.env`) apunta a la API — en el laboratorio,
`http://localhost:3010` (el puerto host de `plantilla-node`, no el nombre
de contenedor: esto lo ejecuta el navegador, no Docker, así que tiene que
ser una URL alcanzable desde tu máquina). `src/pages/About/About.jsx` tiene
una demo real: un `GET /health` vía `useFetch` y un botón que hace
`POST /csrf-demo` vía `apiClient`. Está en `/about` (no en la portada) a
propósito: `Home.jsx` queda limpio como landing page, listo para usarse
standalone sin mostrar un error de conexión si `plantilla-node` no está
levantado; si no necesitás la demo, borrá esa sección de `About.jsx` sin
que afecte al resto del sitio.

`apiClient.js` usa `withCredentials: true` para que la cookie httpOnly del
token CSRF viaje entre orígenes. **Importante**: esa cookie es `httpOnly`
a propósito (para que un XSS no pueda leerla), así que el mecanismo
automático de axios (`xsrfCookieName`, que lee `document.cookie`) **no
sirve aquí** — no puede leer una cookie httpOnly, y ni falla ni avisa, solo
no manda el header, causando un 403 confuso. En su lugar, `apiClient.js`
pide el token una vez por el **body** de `GET /csrf-token` (no de la
cookie), lo guarda en memoria, y un interceptor de request lo reenvía solo
en cada POST/PUT/PATCH/DELETE — sin código adicional por llamada, pero sin
depender de leer una cookie que el navegador nunca le va a dejar leer.

En `plantilla-node/.env`, `CORS_ORIGIN` debe ser el origen exacto de este
front (`http://localhost:8090` por defecto en el laboratorio) — con
`credentials: true` en CORS, el navegador rechaza el wildcard `*`.

## Rendimiento

- Code splitting por página (ver arriba) + chunk `vendor` separado.
- `nginx.conf` cachea `/assets/*` (los archivos con hash de Vite) por 1 año
  como `immutable`, e `index.html` con `no-cache` para que un despliegue
  nuevo siempre llegue, pero el JS/CSS sin cambios no se re-descargue.
- `Header`/`Footer` están memoizados con `React.memo` porque no dependen de
  ningún prop que cambie entre navegaciones.
- Antes de agregar una librería nueva, revisa su peso en el bundle (el
  build de `vite` imprime el tamaño gzip de cada chunk).

## SEO

Esta plantilla es una SPA sin SSR: los crawlers que no ejecutan JS (o lo
hacen con demora) solo ven el HTML estático inicial. Por eso:

- `index.html` trae un `<title>`/`<meta description>`/OG por defecto como
  fallback.
- `src/components/common/Seo.jsx` (usa `react-helmet-async`) sobrescribe
  título, descripción, `canonical` y Open Graph **por página** — cada
  página en `src/pages/*` debe empezar con `<Seo title="..." description="..." path="/ruta" />`.
  Las páginas que nunca deben indexarse (404, login, admin) usan
  `<Seo ... noIndex />`.
- `public/robots.txt` y `public/sitemap.xml` se sirven en la raíz del
  sitio; actualiza el dominio real y agrega una entrada al sitemap por cada
  ruta pública nueva.
- Si el SEO es un requisito serio (no solo estas bases), esta arquitectura
  CSR pura tiene un techo — considera migrar a SSR/SSG (Next.js, Remix,
  Astro) o agregar prerendering.

## Correr sin Docker

El proyecto no depende de Docker para nada — copialo a cualquier PC con
Node y funciona igual, con dos detalles ya resueltos para que no haga falta
tocar nada:

- **Puerto fijo en 8090** (`vite.config.js`, `server.PORT`/`preview.port`):
  así coincide con `CORS_ORIGIN=http://localhost:8090` que ya tiene
  `plantilla-node/.env` por defecto, sin importar si corres con `npm run
  dev`, `npm run preview` o Docker.
- **`server.js`**: reemplaza a `vite preview` para que `npm run preview`
  sirva el build con las mismas cabeceras de seguridad y cache-control que
  `nginx.conf` en Docker (`vite preview` por sí solo no las agrega).

```bash
npm install --no-audit --no-fund
npm run dev              # desarrollo, hot reload, puerto 8090
# — o —
npm run build && npm run preview   # build de producción + servidor con las mismas cabeceras que Docker
```

## Uso (con Docker)

```bash
docker compose up -d --build
# http://localhost:8090
```
