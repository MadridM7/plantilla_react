import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Loader from "../components/common/Loader.jsx";

// Cada página es su propio chunk: no se descarga hasta que el usuario
// navega a esa ruta, en vez de ir todo en el bundle inicial.
const Home = lazy(() => import("../pages/Home/Home.jsx"));
const About = lazy(() => import("../pages/About/About.jsx"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound.jsx"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
