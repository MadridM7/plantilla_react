import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  const location = useLocation();
  const mainRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // En una SPA el navegador no recarga la página al navegar, así que ni
    // el foco ni el scroll se mueven solos: sin esto, quien usa teclado o
    // lector de pantalla no recibe ninguna señal de que cambió la página.
    // Se salta en el render inicial para no robarle el foco a la carga normal.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Header />
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        <AppRoutes />
      </main>
      <Footer />
    </>
  );
}
