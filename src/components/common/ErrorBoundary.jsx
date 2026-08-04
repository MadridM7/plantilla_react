import { Component } from "react";
import { logger } from "../../utils/logger.js";

// Un error de render en cualquier componente hijo rompe TODO el árbol de
// React si no hay un Error Boundary. Este es el único punto donde se
// captura eso: el resto de la UI (o al menos un fallback) sigue en pie.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    logger.error("ErrorBoundary capturó un error:", error, info);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div role="alert" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h1>Algo salió mal</h1>
          <p>La aplicación encontró un error inesperado.</p>
          <button onClick={this.handleReset}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
