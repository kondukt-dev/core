import { execa } from "execa";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const cli = (args: string[]) =>
  execa("pnpm", ["tsx", "src/cli/index.ts", ...args], { reject: false });

describe("kondukt scaffold", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "kondukt-cli-scaffold-"));
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("generates TS project from --tool spec in pretty mode", async () => {
    const r = await cli([
      "scaffold",
      "my-ts",
      "--template",
      "typescript",
      "--output-dir",
      tmp,
      "--tool",
      "echo:Echo back:text:string",
    ]);
    expect(r.exitCode).toBe(0);
    const root = join(tmp, "my-ts");
    const index = readFileSync(join(root, "src/index.ts"), "utf8");
    expect(index).toContain('name: "echo"');
  });

  it("--format json emits ScaffoldResult", async () => {
    const r = await cli([
      "scaffold",
      "my-ts2",
      "--template",
      "typescript",
      "--output-dir",
      tmp,
      "--tool",
      "echo:Echo:text:string",
      "--format",
      "json",
    ]);
    expect(r.exitCode).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.outputDir).toBe(join(tmp, "my-ts2"));
  });

  it("fails with exit=1 when template is unsupported", async () => {
    const r = await cli(["scaffold", "x", "--template", "cobol", "--output-dir", tmp]);
    expect(r.exitCode).not.toBe(0);
  });
});
