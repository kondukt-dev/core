import { execa } from "execa";
import { describe, expect, it } from "vitest";

const cli = (args: string[]) =>
  execa("pnpm", ["tsx", "src/cli/index.ts", ...args], { reject: false });

const mockCmd = ["npx", "-y", "tsx", "tests/fixtures/mock-server.ts"];

describe("kondukt inspect", () => {
  it("default shows all tables", async () => {
    const r = await cli(["inspect", ...mockCmd]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("echo");
    expect(r.stdout).toContain("mock://hello");
    expect(r.stdout).toContain("greeting");
  });

  it("--tools shows only tools", async () => {
    const r = await cli(["inspect", "--tools", ...mockCmd]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("echo");
    expect(r.stdout).not.toContain("mock://hello");
  });

  it("--tool <name> shows schema for that tool", async () => {
    const r = await cli(["inspect", "--tool", "echo", ...mockCmd]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("echo");
    expect(r.stdout).toContain("inputSchema");
  });

  it("--format json returns structured object", async () => {
    const r = await cli(["inspect", "--format", "json", ...mockCmd]);
    expect(r.exitCode).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(Array.isArray(data.tools)).toBe(true);
    expect(data.tools.map((t: { name: string }) => t.name).sort()).toEqual(["echo", "slow_echo"]);
  });
});
