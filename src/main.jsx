import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import { logger } from "./utils/logger.js";
import "./styles/global.css";

// Errores que ocurren fuera del árbol de React (event listeners nativos,
// promesas sin catch) no los ve un Error Boundary; se capturan aquí para
// que al menos queden registrados en vez de fallar en silencio.
window.addEventListener("error", (event) => logger.error("Error global:", event.error));
window.addEventListener("unhandledrejection", (event) => logger.error("Promesa sin manejar:", event.reason));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <AppProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
