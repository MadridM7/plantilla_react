import { memo } from "react";
import { NavLink } from "react-router-dom";

function Header() {
  return (
    <header style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
      {/* NavLink agrega aria-current="page" solo al link activo, sin código extra */}
      <nav aria-label="Principal" style={{ display: "flex", gap: "1rem" }}>
        <NavLink to="/" end>
          Inicio
        </NavLink>
        <NavLink to="/about">Acerca de</NavLink>
      </nav>
    </header>
  );
}

// memo evita re-renders del header cuando cambia el estado de las páginas,
// ya que no depende de ningún prop que varíe entre navegaciones.
export default memo(Header);
