import { execa } from "execa";
import { describe, expect, it } from "vitest";

const cli = (args: string[]) =>
  execa("pnpm", ["tsx", "src/cli/index.ts", ...args], { reject: false });

const mockCmd = ["npx", "-y", "tsx", "tests/fixtures/mock-server.ts"];

describe("kondukt test", () => {
  it("prints server info in pretty format", async () => {
    const r = await cli(["test", ...mockCmd]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("mock-server");
    expect(r.stdout).toContain("Tools:");
  });

  it("--format json returns machine-readable output", async () => {
    const r = await cli(["test", "--format", "json", ...mockCmd]);
    expect(r.exitCode).toBe(0);
    const info = JSON.parse(r.stdout);
    expect(info.name).toBe("mock-server");
    expect(info.toolCount).toBe(2);
  });

  it("exits non-zero when target server fails", async () => {
    const r = await cli(["test", "node", "-e", "process.exit(1)"]);
    expect(r.exitCode).not.toBe(0);
  });

  it("accepts a single quoted-string command (README form)", async () => {
    const r = await cli(["test", mockCmd.join(" ")]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("mock-server");
  });
});
