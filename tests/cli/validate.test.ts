import { execa } from "execa";
import { describe, expect, it } from "vitest";

const cli = (args: string[]) =>
  execa("pnpm", ["tsx", "src/cli/index.ts", ...args], { reject: false });

const mockCmd = ["npx", "-y", "tsx", "tests/fixtures/mock-server.ts"];

describe("kondukt validate", () => {
  it("prints a score in pretty format", async () => {
    const r = await cli(["validate", ...mockCmd]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/Score:\s*\d+\/100/);
  });

  it("--format json returns a ValidationResult object", async () => {
    const r = await cli(["validate", "--format", "json", ...mockCmd]);
    expect(r.exitCode).toBe(0);
    const result = JSON.parse(r.stdout);
    expect(typeof result.score).toBe("number");
    expect(Array.isArray(result.issues)).toBe(true);
    expect(typeof result.summary).toBe("string");
  });

  it("exits non-zero when target server fails to start", async () => {
    const r = await cli(["validate", "node", "-e", "process.exit(1)"]);
    expect(r.exitCode).not.toBe(0);
  });
});
