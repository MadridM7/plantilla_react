import { useState } from "react";
import Seo from "../../components/common/Seo.jsx";
import { useFetch } from "../../hooks/useFetch.js";
import { apiClient } from "../../services/apiClient.js";

// Demuestra la conexión real con plantilla-node: un GET simple (useFetch)
// y un POST protegido por CSRF (apiClient.post, el interceptor de
// apiClient.js se encarga de pedir y adjuntar el token solo).
function BackendStatus() {
  const { data, error, loading, refetch } = useFetch("/health");

  if (loading) return <p>Consultando plantilla-node…</p>;
  if (error) {
    return (
      <p>
        No se pudo conectar con el backend ({error.message}). ¿Está
        levantado <code>plantilla-node</code> en el puerto configurado en{" "}
        <code>VITE_API_BASE_URL</code>?
      </p>
    );
  }
  return (
    <p>
      Backend OK — status: <strong>{data.status}</strong>, uptime:{" "}
      {data.uptime.toFixed(1)}s{" "}
      <button type="button" onClick={refetch}>
        Refrescar
      </button>
    </p>
  );
}

function CsrfDemoButton() {
  const [result, setResult] = useState(null);

  const handleClick = async () => {
    setResult("Enviando...");
    try {
      const data = await apiClient.post("/csrf-demo", {});
      setResult(data.message);
    } catch (err) {
      setResult(`Error: ${err.message}`);
    }
  };

  return (
    <p>
      <button type="button" onClick={handleClick}>
        Probar POST protegido por CSRF
      </button>{" "}
      {result}
    </p>
  );
}

export default function About() {
  return (
    <section style={{ padding: "2rem" }}>
      <Seo
        title="Acerca de"
        description="Página de ejemplo cargada de forma perezosa (lazy) vía React Router."
        path="/about"
      />
      <h1>Acerca de</h1>
      <p>Página de ejemplo cargada de forma perezosa (lazy) vía React Router.</p>

      <h2>Conexión con plantilla-node</h2>
      <p>
        Esta sección es una demo del patrón de conexión real con la API (ver{" "}
        <code>src/services/apiClient.js</code>). Si usás plantilla-react de
        forma standalone (sin plantilla-node), podés borrar este bloque sin
        afectar el resto del sitio.
      </p>
      <BackendStatus />
      <CsrfDemoButton />
    </section>
  );
}
