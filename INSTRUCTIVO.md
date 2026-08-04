# Instructivo: cómo usar y entender `plantilla-react`

Esta guía es distinta al `README.md` (referencia rápida) y al
`.claude/skills/plantilla-react/SKILL.md` (instrucciones para una IA). Acá
el objetivo es que entiendas **qué hace cada pieza y por qué existe**,
paso a paso, aunque sea la primera vez que ves un proyecto así.

---

## 1. ¿Qué es esto?

Un sitio web hecho con [React](https://react.dev/) (la librería más usada
para construir interfaces) y [Vite](https://vitejs.dev/) (la herramienta
que arma/empaqueta el código para que el navegador lo entienda).

A diferencia de un "hola mundo" de React, esta plantilla ya trae resuelto
lo que un proyecto grande necesita tarde o temprano:

- Organización de carpetas que escala (no todo en un solo archivo).
- Las páginas se cargan de a una (más rápido para el usuario).
- Un error en un componente no rompe toda la página.
- Cabeceras de seguridad y SEO básico ya configurados.
- Un cliente HTTP ya conectado con el backend (`plantilla-node`).

---

## 2. Antes de empezar

Necesitás **una** de estas dos cosas (no las dos):

- **Docker Desktop** instalado y corriendo, o
- **Node.js** instalado en tu PC (versión 20 o superior).

---

## 3. Cómo arrancarlo

### Opción A — desarrollo con recarga automática (la más usada día a día)

```powershell
cd DockerLab\projects\plantilla-react
npm install --no-audit --no-fund
npm run dev
```

Abrí `http://localhost:8090`. Cada vez que guardás un archivo, la página
se actualiza sola en el navegador (sin recargar todo — eso se llama
"hot reload").

### Opción B — build de producción sin Docker

```powershell
npm run build            # genera dist/ optimizado
npm run preview           # lo sirve en el puerto 8090, con las mismas
                            # cabeceras de seguridad que la versión Docker
```

### Opción C — con Docker

```powershell
docker network create dockerlab   # una sola vez
cd DockerLab\projects\plantilla-react
docker compose up -d --build
```

Las tres formas terminan sirviendo en `http://localhost:8090` — elegí
según lo que estés haciendo (desarrollando → Opción A; probando el build
final → B o C).

---

## 4. Tour guiado por las carpetas

```
src/
├── assets/        ← imágenes, íconos
├── components/
│   ├── common/     ← piezas genéricas: ErrorBoundary, Loader, Seo
│   └── layout/      ← Header, Footer (aparecen en todas las páginas)
├── pages/            ← una carpeta por página (Home, About, NotFound)
├── routes/            ← AppRoutes.jsx: qué URL muestra qué página
├── hooks/              ← lógica reutilizable (useFetch)
├── services/            ← apiClient.js: cómo hablar con el backend
├── context/              ← estado compartido entre componentes
├── utils/                 ← funciones sueltas (logger, etc.)
├── constants/               ← valores fijos (URLs, etc.)
├── App.jsx                    ← arma Header + página actual + Footer
└── main.jsx                     ← el punto de entrada de todo
```

### ¿Cómo se relacionan estas piezas?

`main.jsx` es lo primero que corre. Monta React en la página y envuelve
todo en capas (mirá el archivo, están anidadas a propósito):

```
ErrorBoundary            ← si algo se rompe adentro, muestra un mensaje en vez de pantalla en blanco
  └─ HelmetProvider        ← permite que cada página cambie el <title>
      └─ AppProvider          ← estado global disponible para toda la app
          └─ BrowserRouter       ← habilita la navegación por URL
              └─ App                ← Header + la página actual + Footer
```

Cuando entrás a `/about`, `App.jsx` le pide a `AppRoutes.jsx` "¿qué
componente corresponde a esta URL?", y ese componente (`About.jsx`) es lo
que se muestra donde antes estaba `Home.jsx`.

---

## 5. Cómo se cargan las páginas (lazy loading)

Mirá `src/routes/AppRoutes.jsx`:

```js
const Home = lazy(() => import("../pages/Home/Home.jsx"));
```

Esto NO es un `import` normal. `lazy(...)` le dice a Vite: "no incluyas el
código de `Home` en el paquete inicial — descargalo recién cuando alguien
visite esa página". Así, si tu sitio tiene 20 páginas, el usuario que
solo visita la portada no descarga el código de las otras 19.

Podés verlo con tus propios ojos:

```powershell
npm run build
```

Fijate en la salida — cada página aparece como un archivo `.js` separado
(`Home-XXXX.js`, `About-XXXX.js`, etc.), en vez de todo junto en un solo
archivo gigante.

Mientras el navegador descarga el código de una página, `<Suspense>`
muestra el componente `Loader` ("Cargando...") — por eso `AppRoutes.jsx`
envuelve las rutas en `<Suspense fallback={<Loader />}>`.

---

## 6. Manejo de errores: tres capas distintas

**El problema que resuelve**: sin esto, un error en cualquier componente
(por ejemplo, intentar leer una propiedad de `undefined`) deja al usuario
viendo una pantalla en blanco, sin explicación.

1. **`ErrorBoundary`** (`src/components/common/ErrorBoundary.jsx`) —
   envuelve TODA la app. Si un componente falla al dibujarse, en vez de
   pantalla en blanco, se ve un mensaje con un botón "Reintentar".

2. **`apiClient`** (`src/services/apiClient.js`) — cualquier llamada al
   backend que falle (timeout, error 500, sin conexión) se convierte en un
   `ApiError` con información clara, en vez de una excepción críptica de
   `axios`.

3. **`useFetch`** (`src/hooks/useFetch.js`) — un "hook" (función especial
   de React) que te da `{ data, error, loading }` listos para usar en tu
   componente, sin que vos tengas que escribir `try/catch` cada vez.

### Un ejemplo real, ya funcionando

Abrí `src/pages/About/About.jsx` — tiene un componente `BackendStatus` que
usa `useFetch("/health")` para mostrar si `plantilla-node` está
respondiendo. Si el backend no está levantado, en vez de romperse, muestra
un mensaje explicando el problema. Probalo: apagá `plantilla-node` y
recargá `/about` — vas a ver el mensaje de error en vez de una falla
silenciosa. Está en `/about` y no en la portada a propósito: así `Home.jsx`
queda como landing limpia, usable sin `plantilla-node` corriendo.

---

## 7. Conectada con el backend (`plantilla-node`)

`src/services/apiClient.js` es la ÚNICA puerta de salida para hablar con
la API — nunca uses `fetch` o `axios` sueltos dentro de un componente,
porque perderías el manejo de errores y el envío automático del token
CSRF.

### ¿Cómo sabe a qué URL llamar?

`VITE_API_BASE_URL` en el archivo `.env` — por defecto
`http://localhost:3010` (el puerto de `plantilla-node`).

⚠️ **Importante**: esta URL la usa el **navegador**, no Docker — por eso
tiene que ser `localhost`, no el nombre de un contenedor.

### El detalle de CSRF (protección contra un tipo de ataque)

`plantilla-node` exige un "token secreto" para aceptar peticiones que
cambian datos (ver el instructivo de esa plantilla si querés el detalle
completo). `apiClient.js` ya se encarga de pedirlo y mandarlo solo — no
tenés que hacer nada extra al llamar `apiClient.post(...)`. Probalo en
`/about`: el botón "Probar POST protegido por CSRF" hace exactamente esa
llamada.

---

## 8. SEO: que Google (y las redes sociales) entiendan tu sitio

Este sitio es una SPA (Single Page Application): el navegador carga UNA
página HTML y JavaScript va cambiando el contenido. El problema es que
algunos robots que rastrean la web no ejecutan JavaScript, así que ven muy
poco si no hacés nada al respecto.

### Cómo se resuelve acá

Cada página usa el componente `Seo` para poner su propio título y
descripción:

```jsx
// src/pages/Home/Home.jsx
<Seo title="Inicio" description="..." path="/" />
```

Esto cambia el `<title>` de la pestaña del navegador y la meta-descripción
que se ve, por ejemplo, cuando compartís el link en WhatsApp. Sin esto,
todas las páginas mostrarían el mismo título genérico.

`public/robots.txt` y `public/sitemap.xml` son archivos que los buscadores
leen para saber qué páginas existen y cuáles pueden indexar.

---

## 9. Manos a la obra: creá tu primera página propia

Vamos a agregar una página `/contacto` que muestre un texto simple.

**Paso 1** — creá `src/pages/Contacto/Contacto.jsx`:

```jsx
import Seo from "../../components/common/Seo.jsx";

export default function Contacto() {
  return (
    <section style={{ padding: "2rem" }}>
      <Seo title="Contacto" description="Cómo contactarnos" path="/contacto" />
      <h1>Contacto</h1>
      <p>Escribinos a hola@ejemplo.com</p>
    </section>
  );
}
```

**Paso 2** — abrí `src/routes/AppRoutes.jsx` y agregá la carga perezosa:

```js
const Contacto = lazy(() => import("../pages/Contacto/Contacto.jsx"));
```

Y la ruta, junto a las que ya existen:

```jsx
<Route path="/contacto" element={<Contacto />} />
```

**Paso 3** — agregá el link en `src/components/layout/Header.jsx`:

```jsx
<Link to="/contacto">Contacto</Link>
```

**Paso 4** — probalo: si tenés `npm run dev` corriendo, guardá los
archivos y andá a `http://localhost:8090/contacto` — ya debería andar.

Ese es el patrón completo: carpeta en `pages/`, carga con `lazy()`, ruta
en `AppRoutes.jsx`, y opcionalmente un link para llegar a ella. Todo lo
que agregues de acá en más sigue esta misma receta.

---

## 10. Tests: que el código se pruebe solo

**El problema que resuelve**: hasta acá probamos todo abriendo el
navegador. Eso está bien mientras programás, pero ¿te vas a acordar de
volver a clickear cada página, cada botón, cada link del `Header`, cada
vez que toques algo en tres meses? Un test hace exactamente eso, solo, en
segundos.

### Cómo está armado acá

[Vitest](https://vitest.dev/) corre los tests, y
[Testing Library](https://testing-library.com/) simula un DOM (vía
`jsdom`) para renderizar componentes de React sin necesitar un navegador
de verdad.

```powershell
npm test           # corre todos los tests una vez
npm run test:watch # los re-corre solo cuando guardás un archivo
```

Ya hay tests de ejemplo en `test/`: `ErrorBoundary.test.jsx` (que el
fallback aparece si un hijo falla, y que "Reintentar" vuelve a intentar
renderizar), `Header.test.jsx` (que `NavLink` marca la página activa con
`aria-current="page"`) y `Home.test.jsx` (que la landing renderiza sin
llamar a la API). Son la referencia a copiar para lo que agregues vos.

Dos detalles que vas a necesitar tarde o temprano:

- Un componente con `<Seo />` necesita `HelmetProvider` envolviéndolo en
  el test, si no `react-helmet-async` tira un error de contexto faltante.
- Un componente con `Link`/`NavLink` necesita un router envolviéndolo —
  usá `MemoryRouter` (no `BrowserRouter`: no depende de una URL real).

### Probalo vos mismo: testeá la página que creaste en la sección 9

Creá `test/Contacto.test.jsx`:

```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import Contacto from "../src/pages/Contacto/Contacto.jsx";

describe("Contacto", () => {
  it("muestra el email de contacto", () => {
    render(
      <HelmetProvider>
        <Contacto />
      </HelmetProvider>
    );

    expect(screen.getByText(/hola@ejemplo.com/)).toBeInTheDocument();
  });
});
```

```powershell
npm test
# ✓ test/Contacto.test.jsx (1 test)
```

Igual que en `plantilla-node`: esto no reemplaza probar a mano mientras
programás, pero una vez que algo ya anda, el test se asegura de que
**siga andando** sin que vos tengas que acordarte de volver a probarlo.

---

## 11. Glosario

- **SPA (Single Page Application)**: un sitio que carga una sola vez y
  después cambia el contenido con JavaScript, sin recargar la página
  completa en cada navegación.
- **Componente**: una pieza reutilizable de interfaz (un botón, una
  página entera, etc.), escrita como una función de JavaScript que
  devuelve HTML (JSX).
- **Hook**: una función especial de React (siempre empieza con `use...`)
  que te da acceso a funcionalidades como estado, efectos, o — en este
  proyecto — llamadas a la API (`useFetch`).
- **Lazy loading / code splitting**: cargar código solo cuando hace falta,
  en vez de todo de una al principio.
- **Error Boundary**: un componente especial de React que atrapa errores
  de los componentes que envuelve, para no romper toda la app.
- **CORS**: la regla del navegador que decide si el JavaScript de tu sitio
  puede llamar a una API en otro dominio/puerto.
- **CSRF**: ver el glosario de `plantilla-node` — la protección contra
  este ataque ya está integrada acá.
- **Test**: código que verifica automáticamente que un componente hace lo
  que se espera, sin tener que probarlo a mano en el navegador cada vez.
- **jsdom**: una implementación del DOM que corre en Node, sin navegador
  real — lo que usan los tests para poder "renderizar" un componente.

## 12. Para seguir

- `README.md` — referencia técnica más compacta de todo lo mismo.
- `.claude/skills/plantilla-react/SKILL.md` — si vas a pedirle a una IA
  que trabaje en este proyecto, ese archivo la orienta.
- El instructivo de `plantilla-node` (`../plantilla-node/INSTRUCTIVO.md`)
  — para entender el lado del backend con el que este sitio se conecta.
- Documentación oficial de [React](https://es.react.dev/) y de
  [Vite](https://vitejs.dev/guide/).
