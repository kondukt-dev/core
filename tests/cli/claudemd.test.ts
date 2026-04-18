import { execa } from "execa";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const cli = (args: string[]) =>
  execa("pnpm", ["tsx", "src/cli/index.ts", ...args], { reject: false });

const fixturePath = new URL("../claudemd/fixtures/ts-next/", import.meta.url).pathname;

describe("kondukt claudemd", () => {
  let out: string;
  beforeEach(() => {
    out = mkdtempSync(join(tmpdir(), "kondukt-claudemd-"));
  });
  afterEach(() => {
    rmSync(out, { recursive: true, force: true });
  });

  it("writes CLAUDE.md to --output path", async () => {
    const dest = join(out, "CLAUDE.md");
    const r = await cli(["claudemd", fixturePath, "--output", dest]);
    expect(r.exitCode).toBe(0);
    expect(existsSync(dest)).toBe(true);
    const content = readFileSync(dest, "utf8");
    expect(content).toContain("# ts-next-sample");
    expect(content).toContain("Next.js");
  });

  it("prints content to stdout with --stdout", async () => {
    const r = await cli(["claudemd", fixturePath, "--stdout"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("# ts-next-sample");
  });

  it("--format json emits analysis", async () => {
    const r = await cli(["claudemd", fixturePath, "--format", "json", "--stdout"]);
    expect(r.exitCode).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.analysis.dependencies.packageName).toBe("ts-next-sample");
    expect(typeof parsed.content).toBe("string");
  });
});
