import { afterEach, describe, expect, it } from "vitest";
import { McpConnection } from "../../src/client/mcp-connection.js";
import type { StdioServerConfig } from "../../src/client/types.js";

const mockServerConfig: StdioServerConfig = {
  type: "stdio",
  command: "npx",
  args: ["-y", "tsx", "tests/fixtures/mock-server.ts"],
};

describe("McpConnection — lifecycle", () => {
  let conn: McpConnection | undefined;

  afterEach(async () => {
    if (conn) await conn.disconnect().catch(() => undefined);
    conn = undefined;
  });

  it("connects to stdio mock server and returns ServerInfo", async () => {
    conn = new McpConnection(mockServerConfig);
    const info = await conn.connect();
    expect(info.name).toBe("mock-server");
    expect(info.capabilities.tools).toBe(true);
    expect(info.capabilities.resources).toBe(true);
    expect(info.capabilities.prompts).toBe(true);
    expect(info.toolCount).toBe(2);
    expect(info.resourceCount).toBe(1);
    expect(info.promptCount).toBe(1);
    expect(conn.status).toBe("connected");
  });

  it("ping returns true against a live server", async () => {
    conn = new McpConnection(mockServerConfig);
    await conn.connect();
    expect(await conn.ping()).toBe(true);
  });

  it("disconnect sets status to disconnected", async () => {
    conn = new McpConnection(mockServerConfig);
    await conn.connect();
    await conn.disconnect();
    expect(conn.status).toBe("disconnected");
  });
});

describe("McpConnection — tools", () => {
  let conn: McpConnection | undefined;
  afterEach(async () => {
    if (conn) await conn.disconnect().catch(() => undefined);
    conn = undefined;
  });

  it("listTools returns the mock server's tools", async () => {
    conn = new McpConnection(mockServerConfig);
    await conn.connect();
    const tools = await conn.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(["echo", "slow_echo"]);
    const echo = tools.find((t) => t.name === "echo");
    expect(echo?.description).toBeDefined();
    expect(echo?.inputSchema).toBeDefined();
  });

  it("callTool executes a tool and returns content + timing", async () => {
    conn = new McpConnection(mockServerConfig);
    await conn.connect();
    const result = await conn.callTool("echo", { text: "hi" });
    expect(result.content).toEqual([{ type: "text", text: "hi" }]);
    expect(result.isError ?? false).toBe(false);
    expect(result.timing.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.timing.completedAt).toBeGreaterThanOrEqual(result.timing.startedAt);
  });

  it("callTool wraps server errors in ProtocolError", async () => {
    conn = new McpConnection(mockServerConfig);
    await conn.connect();
    await expect(conn.callTool("nonexistent", {})).rejects.toThrow(/Unknown tool|tools\/call/);
  });
});

describe("McpConnection — resources", () => {
  let conn: McpConnection | undefined;
  afterEach(async () => {
    if (conn) await conn.disconnect().catch(() => undefined);
    conn = undefined;
  });

  it("listResources returns the mock server's resources", async () => {
    conn = new McpConnection(mockServerConfig);
    await conn.connect();
    const resources = await conn.listResources();
    expect(resources.length).toBe(1);
    expect(resources[0]?.uri).toBe("mock://hello");
  });

  it("readResource returns the content", async () => {
    conn = new McpConnection(mockServerConfig);
    await conn.connect();
    const content = await conn.readResource("mock://hello");
    expect(content.uri).toBe("mock://hello");
    expect(content.contents[0]?.text).toContain("Hello");
  });
});

describe("McpConnection — prompts", () => {
  let conn: McpConnection | undefined;
  afterEach(async () => {
    if (conn) await conn.disconnect().catch(() => undefined);
    conn = undefined;
  });

  it("listPrompts returns the mock server's prompts", async () => {
    conn = new McpConnection(mockServerConfig);
    await conn.connect();
    const prompts = await conn.listPrompts();
    expect(prompts.length).toBe(1);
    expect(prompts[0]?.name).toBe("greeting");
    expect(prompts[0]?.arguments?.[0]?.name).toBe("who");
  });

  it("getPrompt returns rendered messages", async () => {
    conn = new McpConnection(mockServerConfig);
    await conn.connect();
    const res = await conn.getPrompt("greeting", { who: "Alice" });
    expect(res.messages[0]?.content.type).toBe("text");
    if (res.messages[0]?.content.type === "text") {
      expect(res.messages[0].content.text).toContain("Alice");
    }
  });
});

describe("McpConnection — events", () => {
  it("emits statusChange on connect and disconnect", async () => {
    const conn = new McpConnection(mockServerConfig);
    const statuses: string[] = [];
    conn.on("statusChange", (s) => statuses.push(s.status));
    await conn.connect();
    await conn.disconnect();
    expect(statuses).toEqual(["connecting", "connected", "disconnected"]);
  });
});

describe("McpConnection — not connected", () => {
  it("throws ProtocolError when calling methods without connecting", async () => {
    const conn = new McpConnection(mockServerConfig);
    await expect(conn.listTools()).rejects.toThrow(/Not connected/);
    await expect(conn.callTool("x", {})).rejects.toThrow(/Not connected/);
    await expect(conn.listResources()).rejects.toThrow(/Not connected/);
    await expect(conn.readResource("x")).rejects.toThrow(/Not connected/);
    await expect(conn.listPrompts()).rejects.toThrow(/Not connected/);
    await expect(conn.getPrompt("x")).rejects.toThrow(/Not connected/);
    await expect(conn.ping()).rejects.toThrow(/Not connected/);
  });

  it("connect failure surfaces as ConnectionError", async () => {
    const conn = new McpConnection({
      type: "stdio",
      command: "node",
      args: ["-e", "process.exit(1)"],
    });
    await expect(conn.connect()).rejects.toThrow(/Failed to connect/);
    expect(conn.status).toBe("error");
  });

  it("disconnect on never-connected is a no-op", async () => {
    const conn = new McpConnection(mockServerConfig);
    await conn.disconnect();
    expect(conn.status).toBe("disconnected");
  });
});
