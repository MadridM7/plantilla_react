import Seo from "../../components/common/Seo.jsx";

export default function NotFound() {
  return (
    <section style={{ padding: "2rem" }}>
      <Seo title="Página no encontrada" description="Página no encontrada." noIndex />
      <h1>404</h1>
      <p>Página no encontrada.</p>
    </section>
  );
}
