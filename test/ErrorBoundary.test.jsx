import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ErrorBoundary from "../src/components/common/ErrorBoundary.jsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Flag mutable fuera de React: simula que la causa del error ya no está
// (ej. una respuesta de API que ahora sí trae los datos esperados),
// distinto de simplemente re-renderizar el mismo children que rompía.
const bombState = { shouldThrow: true };

function Bomb() {
  if (bombState.shouldThrow) throw new Error("boom de prueba");
  return <p>Ya está arreglado</p>;
}

describe("ErrorBoundary", () => {
  it("sin errores, renderiza los hijos normalmente", () => {
    render(
      <ErrorBoundary>
        <p>Todo bien</p>
      </ErrorBoundary>
    );

    expect(screen.getByText("Todo bien")).toBeInTheDocument();
  });

  it("si un hijo falla al renderizar, muestra el fallback en vez de romper la app", () => {
    // React loguea por consola el error que el boundary ya atrapó; se
    // silencia acá porque el test ya está afirmando que se manejó bien.
    vi.spyOn(console, "error").mockImplementation(() => {});
    bombState.shouldThrow = true;

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Algo salió mal");
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("Reintentar limpia el error y vuelve a renderizar si la causa ya no está", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    bombState.shouldThrow = true;

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    bombState.shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(screen.getByText("Ya está arreglado")).toBeInTheDocument();
  });
});
