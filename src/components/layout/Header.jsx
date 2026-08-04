import { memo } from "react";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
      <nav style={{ display: "flex", gap: "1rem" }}>
        <Link to="/">Inicio</Link>
        <Link to="/about">Acerca de</Link>
      </nav>
    </header>
  );
}

// memo evita re-renders del header cuando cambia el estado de las páginas,
// ya que no depende de ningún prop que varíe entre navegaciones.
export default memo(Header);
