import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("shows the application dashboard heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "管理看板" }),
    ).toBeInTheDocument();
  });
});
