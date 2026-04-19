import { execa } from "execa";
import { describe, expect, it } from "vitest";

const cli = (args: string[]) =>
  execa("pnpm", ["tsx", "src/cli/index.ts", ...args], { reject: false });

const mockCmd = ["npx", "-y", "tsx", "tests/fixtures/mock-server.ts"];

describe("kondukt call", () => {
  it("calls echo and prints result", async () => {
    const r = await cli(["call", "--tool", "echo", "--args", '{"text":"hi"}', ...mockCmd]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("OK");
    expect(r.stdout).toContain("hi");
  });

  it("--format json emits ToolResult object", async () => {
    const r = await cli([
      "call",
      "--tool",
      "echo",
      "--args",
      '{"text":"json-ok"}',
      "--format",
      "json",
      ...mockCmd,
    ]);
    expect(r.exitCode).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.content[0].text).toBe("json-ok");
    expect(typeof parsed.timing.durationMs).toBe("number");
  });

  it("exits non-zero when tool errors", async () => {
    const r = await cli(["call", "--tool", "nope", "--args", "{}", ...mockCmd]);
    expect(r.exitCode).not.toBe(0);
  });
});
