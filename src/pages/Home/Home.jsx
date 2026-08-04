import Seo from "../../components/common/Seo.jsx";

export default function Home() {
  return (
    <section style={{ padding: "2rem" }}>
      <Seo
        title="Inicio"
        description="Este sitio corre en un contenedor Docker independiente."
        path="/"
      />
      <h1>plantilla-react</h1>
      <p>Este sitio corre en un contenedor Docker independiente.</p>
    </section>
  );
}
