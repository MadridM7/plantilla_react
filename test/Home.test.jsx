import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import Home from "../src/pages/Home/Home.jsx";

afterEach(cleanup);

describe("Home", () => {
  it("renderiza la landing sin llamadas a la API (usable standalone)", () => {
    render(
      <HelmetProvider>
        <Home />
      </HelmetProvider>
    );

    expect(screen.getByRole("heading", { name: "plantilla-react" })).toBeInTheDocument();
  });
});
