import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("Silvia shell", () => {
  it("states the promise and confirmation boundary", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /silvia/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/só faz o pedido quando você confirma/i),
    ).toBeInTheDocument();
  });
});
