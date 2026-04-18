import { describe, expect, it } from "vitest";
import { testServerTool } from "../../src/server/tools/test-server.js";
import { listToolsTool } from "../../src/server/tools/list-tools.js";
import { listResourcesTool } from "../../src/server/tools/list-resources.js";
import { listPromptsTool } from "../../src/server/tools/list-prompts.js";
import { callToolTool } from "../../src/server/tools/call-tool.js";
import { readResourceTool } from "../../src/server/tools/read-resource.js";
import { getPromptTool } from "../../src/server/tools/get-prompt.js";
import { validateServerTool } from "../../src/server/tools/validate-server.js";
import { scaffoldServerTool } from "../../src/server/tools/scaffold-server.js";
import { allTools } from "../../src/server/tools/index.js";

const mockCommand = "npx -y tsx tests/fixtures/mock-server.ts";

describe("test_server tool", () => {
  it("returns capabilities as JSON text content", async () => {
    const result = await testServerTool.handler({ command: mockCommand });
    expect(result.isError).toBeFalsy();
    expect(result.content.length).toBe(1);
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("expected text content");
    const info = JSON.parse(first.text);
    expect(info.name).toBe("mock-server");
    expect(info.capabilities.tools).toBe(true);
    expect(info.toolCount).toBe(2);
  });

  it("returns isError=true on connection failure", async () => {
    const result = await testServerTool.handler({
      command: "node -e 'process.exit(1)'",
    });
    expect(result.isError).toBe(true);
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("expected text content");
    expect(first.text).toMatch(/Failed to connect/);
  });
});

describe("list_tools tool", () => {
  it("returns an array of tools", async () => {
    const result = await listToolsTool.handler({ command: mockCommand });
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("expected text content");
    const tools = JSON.parse(first.text);
    expect(Array.isArray(tools)).toBe(true);
    const names = tools.map((t: { name: string }) => t.name).sort();
    expect(names).toEqual(["echo", "slow_echo"]);
  });
});

describe("list_resources tool", () => {
  it("returns an array of resources", async () => {
    const result = await listResourcesTool.handler({ command: mockCommand });
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("expected text content");
    const resources = JSON.parse(first.text);
    expect(resources.length).toBe(1);
    expect(resources[0].uri).toBe("mock://hello");
  });
});

describe("list_prompts tool", () => {
  it("returns an array of prompts", async () => {
    const result = await listPromptsTool.handler({ command: mockCommand });
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("expected text content");
    const prompts = JSON.parse(first.text);
    expect(prompts.length).toBe(1);
    expect(prompts[0].name).toBe("greeting");
  });
});

describe("call_tool tool", () => {
  it("invokes echo and returns result", async () => {
    const result = await callToolTool.handler({
      command: mockCommand,
      tool_name: "echo",
      arguments: { text: "hey" },
    });
    expect(result.isError).toBeFalsy();
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("expected text content");
    expect(first.text).toContain("hey");
  });

  it("returns isError on unknown tool", async () => {
    const result = await callToolTool.handler({
      command: mockCommand,
      tool_name: "nope",
      arguments: {},
    });
    expect(result.isError).toBe(true);
  });

  it("requires tool_name param", async () => {
    const result = await callToolTool.handler({ command: mockCommand });
    expect(result.isError).toBe(true);
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("expected text content");
    expect(first.text).toMatch(/tool_name/);
  });
});

describe("read_resource tool", () => {
  it("reads mock://hello", async () => {
    const result = await readResourceTool.handler({
      command: mockCommand,
      uri: "mock://hello",
    });
    expect(result.isError).toBeFalsy();
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("expected text content");
    expect(first.text).toContain("Hello");
  });
});

describe("get_prompt tool", () => {
  it("renders greeting prompt", async () => {
    const result = await getPromptTool.handler({
      command: mockCommand,
      prompt_name: "greeting",
      arguments: { who: "Bob" },
    });
    expect(result.isError).toBeFalsy();
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("expected text content");
    expect(first.text).toContain("Bob");
  });
});

describe("validate_server tool (real)", () => {
  it("returns a JSON ValidationResult with a score", async () => {
    const r = await validateServerTool.handler({ command: mockCommand });
    const first = r.content[0];
    if (first?.type !== "text") throw new Error("text expected");
    const result = JSON.parse(first.text);
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("returns isError on connection failure", async () => {
    const r = await validateServerTool.handler({
      command: "node -e 'process.exit(1)'",
    });
    expect(r.isError).toBe(true);
  });
});

describe("scaffold_server (stub)", () => {
  it("returns isError with phase-4 message", async () => {
    const r = await scaffoldServerTool.handler({ name: "x", template: "typescript" });
    expect(r.isError).toBe(true);
    const first = r.content[0];
    if (first?.type !== "text") throw new Error("text expected");
    expect(first.text).toMatch(/Phase 4/);
  });
});

describe("error paths (connection failure)", () => {
  const badCmd = "node -e 'process.exit(1)'";
  it("list_tools returns isError on connection failure", async () => {
    const r = await listToolsTool.handler({ command: badCmd });
    expect(r.isError).toBe(true);
  });
  it("list_resources returns isError on connection failure", async () => {
    const r = await listResourcesTool.handler({ command: badCmd });
    expect(r.isError).toBe(true);
  });
  it("list_prompts returns isError on connection failure", async () => {
    const r = await listPromptsTool.handler({ command: badCmd });
    expect(r.isError).toBe(true);
  });
  it("read_resource returns isError on connection failure", async () => {
    const r = await readResourceTool.handler({ command: badCmd, uri: "mock://x" });
    expect(r.isError).toBe(true);
  });
  it("read_resource requires uri", async () => {
    const r = await readResourceTool.handler({ command: mockCommand });
    expect(r.isError).toBe(true);
  });
  it("get_prompt returns isError on connection failure", async () => {
    const r = await getPromptTool.handler({ command: badCmd, prompt_name: "x" });
    expect(r.isError).toBe(true);
  });
  it("get_prompt requires prompt_name", async () => {
    const r = await getPromptTool.handler({ command: mockCommand });
    expect(r.isError).toBe(true);
  });
});

describe("tool registry", () => {
  it("exports all 9 tools with unique names", () => {
    expect(allTools.length).toBe(9);
    const names = allTools.map((t) => t.definition.name);
    expect(new Set(names).size).toBe(9);
  });
});
