---
name: plantilla-react
description: Usar al crear un proyecto nuevo a partir de esta plantilla de React grande (Vite), o al extender páginas/rutas/llamadas a API dentro de un proyecto que ya nace de ella. Explica la estructura de carpetas, el patrón de code-splitting con React.lazy + Suspense, el manejo de errores (ErrorBoundary + apiClient + useFetch), las cabeceras de seguridad de nginx, el SEO por página con react-helmet-async, y el procedimiento paso a paso para clonar esta plantilla en un proyecto nuevo. Toda esta plantilla se rige por seguridad básica, rendimiento máximo y cumplimiento de SEO — no son opcionales.
---

# plantilla-react — cómo trabajar con esta plantilla

## Qué es esto

Un template de proyecto React (Vite, JSX, sin TypeScript) con la
organización de carpetas típica de un proyecto grande: separación clara
entre páginas, componentes reutilizables, servicios de red, estado global y
utilidades. Código dividido por rutas (`React.lazy`), manejo de errores en
capas, cliente HTTP con axios pre-integrado con CSRF, y cabeceras de
seguridad ya configuradas en el nginx que sirve el build de producción. No
es una demo — es el punto de partida real de un proyecto.

Convive dentro de `DockerLab/projects/`, un laboratorio de contenedores
Docker independientes conectados por una red compartida llamada
`dockerlab` (ver `../../../README.md` en la raíz de `DockerLab` para el
panorama completo). Cada carpeta de `projects/` es un servicio Docker
autónomo con su propio `docker-compose.yml`. El Dockerfile hace build
multi-stage: Node compila el bundle estático, y un nginx `alpine` lo sirve.

**No depende de Docker para funcionar**: copiado a cualquier PC con Node,
`npm run dev` / `npm run build && npm run preview` funcionan igual —
`vite.config.js` fija el puerto en 8090 (coincide con `CORS_ORIGIN` de
`plantilla-node`) y `server.js` replica las cabeceras de `nginx.conf` para
que el comportamiento no dependa de si hay contenedores o no.

## Principios no negociables

Cualquier código que se agregue a un proyecto nacido de esta plantilla —
lo escriba una IA o una persona— tiene que regirse por esto:

**Seguridad básica**
- Nunca uses `dangerouslySetInnerHTML` con contenido que venga de un
  usuario o de la API sin sanitizarlo antes (XSS). Si necesitas renderizar
  HTML dinámico, sanitízalo (ej. DOMPurify) antes de inyectarlo.
- Todo dato sensible (tokens de sesión de larga duración, etc.) va en
  cookies `httpOnly` puestas por el backend, nunca en `localStorage` — el
  patrón CSRF de esta plantilla ya sigue esa idea.
- Solo variables de entorno con prefijo `VITE_` llegan al bundle del
  cliente — nunca metas una API key privada ahí, Vite la incrusta en texto
  plano visible por cualquiera que abra el JS.
- No aflojes la Content-Security-Policy de `nginx.conf` de forma genérica;
  amplíala solo para el origen/recurso concreto que necesitas.

**Rendimiento máximo**
- Toda página nueva se registra con `lazy()` en `AppRoutes.jsx`, nunca con
  import estático (ver "Regla de oro" abajo).
- Usa `React.memo`/`useMemo`/`useCallback` en componentes que reciben props
  estables pero se re-renderizan seguido (mismo criterio que ya aplican
  `Header`/`Footer`) — no en todo por sistema, solo donde el profiler o el
  sentido común lo justifique.
- Imágenes: usa `loading="lazy"` y el formato/tamaño correcto; nunca subas
  una imagen sin comprimir a `assets/`.
- Listas largas (>~100 items): considera virtualización antes de renderizar
  todo el DOM de una.
- Revisa el tamaño de cualquier dependencia nueva contra el output de
  `vite build` (chunk `vendor` no debería crecer sin que lo notes).
- No pierdas el cacheo `immutable` de `/assets/*` ni el `no-cache` de
  `index.html` en `nginx.conf` (ver sección Performance del README).

**SEO (aplica especialmente a esta plantilla de React)**
- Toda página nueva en `src/pages/*` empieza con
  `<Seo title="..." description="..." path="/ruta" />`
  (`src/components/common/Seo.jsx`, usa `react-helmet-async`). Sin esto la
  página hereda el title/description genérico de `index.html`.
- Páginas que no deben indexarse (login, admin, 404) usan
  `<Seo ... noIndex />` — ver `pages/NotFound/NotFound.jsx`.
- Cada ruta pública nueva se agrega a `public/sitemap.xml`.
- Mantén HTML semántico: un solo `<h1>` por página, `<nav>`/`<main>`/`<footer>`
  donde corresponda (ya establecido en `App.jsx`), texto alternativo en
  toda `<img>`.
- Esta es una SPA sin SSR: para necesidades de SEO serias (no solo estas
  bases), el techo de esta arquitectura es real — la alternativa es migrar
  a SSR/SSG (Next.js, Remix, Astro) o agregar prerendering, no forzarlo
  aquí.

**Accesibilidad**
- `App.jsx` mueve el foco a `<main id="main-content">` y hace scroll al
  tope en cada cambio de ruta (`useLocation` + `useRef`, se salta en el
  primer render). Sin esto, navegar en una SPA no le avisa nada a quien usa
  teclado o lector de pantalla — el foco se queda en el link que acaban de
  clickear. Si agregás una página nueva no tenés que hacer nada extra, ya
  está resuelto a nivel de `App.jsx`.
- Los links de `Header.jsx` usan `NavLink` (no `Link`): marca automáticamente
  la página activa con `aria-current="page"`, sin código adicional. Usá
  `NavLink` para cualquier link de navegación principal que agregues.
- Favicon en `public/favicon.svg`, referenciado desde `index.html` — si lo
  reemplazás por el logo real del proyecto, mantené un `<link rel="icon">`
  válido (sin favicon, algunos navegadores repiten requests fallidos a
  `/favicon.ico` en cada carga).

## Estructura y qué hace cada pieza

```
src/
├── assets/       # imágenes, íconos, fuentes
├── components/
│   ├── common/   # ErrorBoundary, Loader, Seo — piezas sin lógica de negocio
│   └── layout/   # Header, Footer — memoizados con React.memo
├── pages/        # una carpeta por página (Home/, About/, NotFound/...)
├── routes/AppRoutes.jsx  # define el router y qué página es lazy
├── hooks/        # hooks reutilizables (useFetch como ejemplo)
├── services/apiClient.js # única puerta de salida HTTP (instancia axios)
├── context/AppContext.jsx # estado global mínimo (Context API)
├── utils/        # helpers puros (logger, etc.)
├── constants/    # valores fijos (API_BASE_URL, etc.)
├── styles/       # CSS global
├── App.jsx        # arma Header + rutas + Footer
└── main.jsx        # monta React: ErrorBoundary > AppProvider > BrowserRouter > App
```

**Regla de oro de este template**: cada página nueva vive en su propia
carpeta bajo `pages/` y se registra en `routes/AppRoutes.jsx` con
`lazy(() => import(...))`, nunca con un `import` estático — eso es lo que
mantiene el bundle inicial pequeño (cada página es su propio chunk JS,
confirmable en el output de `vite build`). Toda llamada HTTP pasa por
`apiClient` (nunca `fetch`/`axios` sueltos dentro de un componente), para
que los errores de red siempre terminen como `ApiError` y no rompan el
árbol de React sin control.

## Manejo de errores, en capas

1. **`ErrorBoundary`** (envuelve toda la app en `main.jsx`): si un
   componente falla al renderizar, muestra un fallback en vez de romper
   toda la UI.
2. **`apiClient.js`**: interceptor de respuesta de axios que traduce
   cualquier fallo (timeout, red, status != 2xx) a `ApiError` con
   `status`/`data`.
3. **`useFetch`**: hook de ejemplo que expone `{ data, error, loading }`
   para que un componente nunca tenga que hacer `try/catch` a mano.
4. **`window.addEventListener("error"/"unhandledrejection")`** en
   `main.jsx`: registra errores fuera del árbol de React (donde un Error
   Boundary no llega).

Al agregar una página o componente nuevo que llama a la API: usa
`apiClient.get/post` (o el hook `useFetch`), nunca `fetch` directo — así el
manejo de errores y el envío del token CSRF (ver abajo) quedan gratis.

## Tests

`Vitest` + `Testing Library` con `jsdom` (`test.environment` en
`vite.config.js`, setup en `test/setup.js`). `npm test` corre la suite,
`npm run test:watch` la re-corre en cada guardado.

- Al agregar un componente nuevo, agregá su test en
  `test/<Componente>.test.jsx` siguiendo `test/ErrorBoundary.test.jsx`
  (fallback + reset) o `test/Header.test.jsx` (nav/routing) según
  corresponda.
- Cualquier componente que renderice `<Seo />` necesita `HelmetProvider`
  envolviéndolo en el test (ver `test/Home.test.jsx`), si no,
  `react-helmet-async` tira un error de contexto faltante.
- Cualquier componente con `Link`/`NavLink` necesita un router envolviéndolo
  — `MemoryRouter` en tests (no `BrowserRouter`, no depende de una URL real
  del navegador).
- No agregues tests que dependan de `plantilla-node` corriendo (ej. pegarle
  de verdad a `/health`) — son lentos y frágiles en CI. Si necesitás probar
  algo que usa `apiClient`, mockeá el módulo (`vi.mock`) en vez de hacer la
  llamada real; la demo de `About.jsx` se sigue probando a mano.

## Cabeceras de seguridad

Definidas en DOS lugares que tienen que decir lo mismo: `nginx.conf` (build
Docker) y `server.js` (`npm run preview` sin Docker). Ambos agregan:
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Content-Security-Policy` y `Strict-Transport-Security`
(esta última solo aplica bajo HTTPS).

`connect-src` en la CSP ya incluye `http://localhost:3010` (el origen de
`plantilla-node`). **Esto causó un bug real**: se conectó `apiClient` a
`plantilla-node` sin actualizar `connect-src`, y el navegador bloqueaba el
fetch — no por CORS (CORS estaba bien configurado), sino porque CSP corta
la conexión ANTES de que el navegador intente el request. El síntoma es un
"Network Error" genérico en la app; la única pista real queda en la consola
del navegador ("Refused to connect... violates Content Security Policy"),
no en la pestaña de red (el request ni se envía). **Si cambias
`VITE_API_BASE_URL` a otro origen, actualiza `connect-src` en `nginx.conf`
Y en `server.js` — si no, vuelve a pasar lo mismo.** Igual con
`script-src`/`style-src` si agregas una librería que cargue recursos
externos.

## Conectada de verdad con plantilla-node (no solo "compatible")

`VITE_API_BASE_URL` (`.env`) apunta a la API — en el laboratorio,
`http://localhost:3010` (puerto **host**, no el nombre de contenedor: esto
lo resuelve el navegador del usuario, no la red interna de Docker).
`src/pages/About/About.jsx` tiene la demo real de esta conexión: un
`GET /health` vía `useFetch` y un botón que hace `POST /csrf-demo` vía
`apiClient`, ambos contra `plantilla-node`. Está en `/about` a propósito,
no en `Home.jsx` — así la portada queda lista para usarse como landing
standalone (sin `plantilla-node` levantado) sin mostrar un mensaje de
error de conexión a un visitante real. Si el proyecto nuevo no necesita
esta demo, se puede borrar de `About.jsx` sin tocar nada más.

`apiClient.js` usa `withCredentials: true` para que la cookie httpOnly del
CSRF viaje entre orígenes distintos. **La cookie es httpOnly a propósito**
(para que un XSS no pueda leerla) — por eso NO se puede usar el mecanismo
automático de axios (`xsrfCookieName`, que lee `document.cookie`): no
puede leer una cookie httpOnly, y falla en silencio (no manda el header,
el backend responde 403 sin pista obvia de por qué). En su lugar,
`apiClient.js` pide el token una sola vez por el **body** de
`GET /csrf-token` (no de la cookie), lo cachea en memoria, y un
interceptor de request lo agrega solo a cada POST/PUT/PATCH/DELETE — si
conectas esto a un backend distinto al de esta plantilla, mantén ese mismo
patrón (token por body + interceptor), no el mecanismo automático de
cookie de axios.

En `plantilla-node/.env`, `CORS_ORIGIN` debe ser el origen exacto de este
front (nunca `*` — con `credentials: true` en CORS el navegador lo
rechaza).

## Procedimiento: crear un proyecto nuevo a partir de esta plantilla

1. **Copiar la carpeta completa** a la ubicación del proyecto nuevo.
2. **Renombrar identidad del proyecto**:
   - `package.json` → campo `"name"`
   - `docker-compose.yml` → clave del servicio y `container_name`
   - `index.html` → `<title>`, `<meta description>` y el resto de las meta
     etiquetas por defecto
   - `README.md` → título
   - Textos de ejemplo en `src/pages/Home/Home.jsx` y
     `src/components/layout/Footer.jsx` (dicen "plantilla-react")
   - `src/components/common/Seo.jsx`, `public/robots.txt` y
     `public/sitemap.xml` → reemplaza `https://tu-dominio.example` por el
     dominio real (o el SEO queda apuntando a un dominio que no existe)
3. **Regenerar el lockfile** después de cambiar dependencias:
   `npm install --no-audit --no-fund` (en el host; ver nota de entorno).
4. **Agregar una página nueva**:
   - `src/pages/NuevaPagina/NuevaPagina.jsx`
   - En `routes/AppRoutes.jsx`: `const NuevaPagina = lazy(() => import("../pages/NuevaPagina/NuevaPagina.jsx"));`
     y su `<Route path="..." element={<NuevaPagina />} />`
5. **Si necesita llamar a una API**: usa `apiClient.get/post` desde un hook
   (siguiendo el patrón de `useFetch`) o directamente en un `useEffect`, y
   si es un origen distinto a `http://localhost:3010`, actualiza
   `connect-src` en **`nginx.conf` Y `server.js`** (los dos, no solo uno).
6. **Probar local sin Docker**: `npm run dev` (hot reload) o
   `npm run build && npm run preview` (build de producción con las mismas
   cabeceras que Docker) — ambos en el puerto 8090 fijado en
   `vite.config.js`. Corre desde la raíz del proyecto (donde está
   `package.json`), no desde `src/`.
7. **Probar en Docker**: `docker compose up -d --build`, luego abrir
   `http://localhost:<puerto>`.
   Requiere la red compartida creada una vez:
   `docker network create dockerlab` (si el proyecto sigue conectado al
   laboratorio; si es standalone, puedes quitar la sección `networks:`
   externa del `docker-compose.yml`).

## Nota de entorno importante

En este entorno de Docker Desktop, `npm install`/`npm ci` **sin** la flag
`--no-audit` se cuelga indefinidamente al resolver el abanico de paquetes
opcionales de esbuild/rollup (la llamada de auditoría de npm nunca recibe
respuesta). El `Dockerfile` ya usa `npm ci --no-audit --no-fund` — si
regeneras el lockfile o tocas el Dockerfile, mantén esa flag.

## Qué NO hacer

- No importar una página de forma estática en `AppRoutes.jsx` — rompe el
  code-splitting que es el punto central de esta plantilla.
- No usar `fetch`/`axios` sueltos dentro de un componente — pasa siempre
  por `apiClient` para no perder el manejo de errores ni el token CSRF.
- No aflojar la Content-Security-Policy "por si acaso" — ajústala solo para
  el recurso externo concreto que necesitas permitir.
- No cambiar `connect-src`/cualquier cabecera en `nginx.conf` sin replicar
  el cambio en `server.js` (o viceversa) — son dos implementaciones del
  mismo contrato y divergen en silencio si solo tocas una.
- No agregar una página nueva sin `<Seo .../>` — queda sin title/description
  propios y hereda el genérico de `index.html`.
- No commitear `node_modules` (ya está en `.gitignore` de la raíz del
  laboratorio).
