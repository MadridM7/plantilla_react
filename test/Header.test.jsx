import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "../src/components/layout/Header.jsx";

afterEach(cleanup);

describe("Header", () => {
  it('marca la página activa con aria-current="page" (vía NavLink)', () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /acerca de/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: /inicio/i })).not.toHaveAttribute("aria-current");
  });
});
