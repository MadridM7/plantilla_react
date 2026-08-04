import { createContext, useContext, useMemo, useState } from "react";

const AppContext = createContext(null);

// Estado global mínimo con Context API. Si el proyecto crece y necesita
// algo más potente (Redux Toolkit, Zustand), este provider es el único
// punto a reemplazar: el resto de la app consume useAppContext().
export function AppProvider({ children }) {
  const [theme, setTheme] = useState("light");

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext debe usarse dentro de <AppProvider>");
  }
  return ctx;
}
