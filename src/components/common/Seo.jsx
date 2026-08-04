import { Helmet } from "react-helmet-async";

// Uso: <Seo title="Acerca de" description="..." /> al inicio de cada
// página. Centraliza el patrón title/description/canonical/OG/robots para
// que ninguna página lo arme a mano y se olvide de algún campo. Usa
// noIndex en páginas que nunca deben indexarse (404, login, admin, etc.).
export default function Seo({ title, description, path = "", noIndex = false }) {
  const fullTitle = title ? `${title} · plantilla-react` : "plantilla-react";
  const canonical = `https://tu-dominio.example${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      {!noIndex && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {!noIndex && <meta property="og:url" content={canonical} />}
    </Helmet>
  );
}
