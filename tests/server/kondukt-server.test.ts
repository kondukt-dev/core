import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { McpConnection } from "../../src/client/index.js";
import type { StdioServerConfig } from "../../src/client/types.js";

const konduktConfig: StdioServerConfig = {
  type: "stdio",
  command: "npx",
  args: ["-y", "tsx", "src/server/kondukt-server.ts", "--stdio-autostart"],
};

const mockCommand = "npx -y tsx tests/fixtures/mock-server.ts";

describe("kondukt-server end-to-end over stdio", () => {
  let conn: McpConnection;
  beforeAll(async () => {
    conn = new McpConnection(konduktConfig);
    await conn.connect();
  });
  afterAll(async () => {
    await conn.disconnect().catch(() => undefined);
  });

  it("exposes the 9 Kondukt tools", async () => {
    const tools = await conn.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "call_tool",
        "get_prompt",
        "list_prompts",
        "list_resources",
        "list_tools",
        "read_resource",
        "scaffold_server",
        "test_server",
        "validate_server",
      ].sort(),
    );
  });

  it("test_server tool works end-to-end", async () => {
    const result = await conn.callTool("test_server", { command: mockCommand });
    expect(result.isError ?? false).toBe(false);
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("text expected");
    const info = JSON.parse(first.text);
    expect(info.name).toBe("mock-server");
  });

  it("validate_server returns ValidationResult JSON", async () => {
    const result = await conn.callTool("validate_server", { command: mockCommand });
    const first = result.content[0];
    if (first?.type !== "text") throw new Error("text expected");
    const validation = JSON.parse(first.text);
    expect(typeof validation.score).toBe("number");
    expect(Array.isArray(validation.issues)).toBe(true);
  });
});
