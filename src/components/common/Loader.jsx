// Fallback de <Suspense> mientras se descarga el chunk de una página lazy.
export default function Loader() {
  return (
    <div role="status" style={{ padding: "2rem", textAlign: "center" }}>
      Cargando...
    </div>
  );
}
