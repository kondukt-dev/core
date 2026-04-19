import { execa } from "execa";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const cli = (args: string[]) =>
  execa("pnpm", ["tsx", "src/cli/index.ts", ...args], { reject: false });

const fixturePath = new URL("../agent-docs/fixtures/ts-next/", import.meta.url).pathname;

describe("kondukt agent-docs", () => {
  let out: string;
  beforeEach(() => {
    out = mkdtempSync(join(tmpdir(), "kondukt-agent-docs-"));
  });
  afterEach(() => {
    rmSync(out, { recursive: true, force: true });
  });

  it("default target=claude writes CLAUDE.md", async () => {
    const dest = join(out, "CLAUDE.md");
    const r = await cli(["agent-docs", fixturePath, "--output", dest]);
    expect(r.exitCode).toBe(0);
    expect(existsSync(dest)).toBe(true);
    const content = readFileSync(dest, "utf8");
    expect(content).toContain("Claude Code");
    expect(content).toContain("# ts-next-sample");
  });

  it("--target codex writes AGENTS.md-style content", async () => {
    const dest = join(out, "AGENTS.md");
    const r = await cli(["agent-docs", fixturePath, "--target", "codex", "--output", dest]);
    expect(r.exitCode).toBe(0);
    const content = readFileSync(dest, "utf8");
    expect(content).toContain("Codex");
  });

  it("--target gemini writes GEMINI.md-style content", async () => {
    const dest = join(out, "GEMINI.md");
    const r = await cli(["agent-docs", fixturePath, "--target", "gemini", "--output", dest]);
    expect(r.exitCode).toBe(0);
    const content = readFileSync(dest, "utf8");
    expect(content).toContain("Gemini CLI");
  });

  it("--all writes three files", async () => {
    // For --all we use a temp fixture copy so the output files land next to it
    const tmpFixture = mkdtempSync(join(tmpdir(), "kondukt-agent-docs-all-"));
    // minimal: copy package.json so analyzers find the project
    const pkgSrc = readFileSync(join(fixturePath, "package.json"), "utf8");
    writeFileSync(join(tmpFixture, "package.json"), pkgSrc);
    try {
      const r = await cli(["agent-docs", tmpFixture, "--all"]);
      expect(r.exitCode).toBe(0);
      expect(existsSync(join(tmpFixture, "CLAUDE.md"))).toBe(true);
      expect(existsSync(join(tmpFixture, "AGENTS.md"))).toBe(true);
      expect(existsSync(join(tmpFixture, "GEMINI.md"))).toBe(true);
    } finally {
      rmSync(tmpFixture, { recursive: true, force: true });
    }
  });

  it("--stdout prints content", async () => {
    const r = await cli(["agent-docs", fixturePath, "--target", "codex", "--stdout"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("Codex");
  });

  it("rejects unknown --target", async () => {
    const r = await cli(["agent-docs", fixturePath, "--target", "aicat"]);
    expect(r.exitCode).not.toBe(0);
    expect(r.stderr).toContain("Unsupported --target");
  });
});

describe("kondukt claudemd (deprecated alias)", () => {
  let out: string;
  beforeEach(() => {
    out = mkdtempSync(join(tmpdir(), "kondukt-claudemd-dep-"));
  });
  afterEach(() => {
    rmSync(out, { recursive: true, force: true });
  });

  it("still works but prints deprecation warning to stderr", async () => {
    const dest = join(out, "CLAUDE.md");
    const r = await cli(["claudemd", fixturePath, "--output", dest]);
    expect(r.exitCode).toBe(0);
    expect(r.stderr).toContain("deprecated");
    expect(existsSync(dest)).toBe(true);
  });
});
