import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { McpConnection } from "../../src/client/mcp-connection.js";
import type { HttpServerConfig } from "../../src/client/types.js";
import { startMockHttpServer } from "../fixtures/mock-http-server.js";

describe("McpConnection — HTTP transport", () => {
  let server: Awaited<ReturnType<typeof startMockHttpServer>>;
  let conn: McpConnection | undefined;

  beforeEach(async () => {
    server = await startMockHttpServer();
  });

  afterEach(async () => {
    if (conn) await conn.disconnect().catch(() => undefined);
    conn = undefined;
    await server.close();
  });

  it("connects over HTTP with bearer auth and calls a tool", async () => {
    const cfg: HttpServerConfig = {
      type: "http",
      url: server.url,
      auth: { type: "bearer", token: "test-token" },
    };
    conn = new McpConnection(cfg);
    const info = await conn.connect();
    expect(info.name).toBe("mock-http-server");
    expect(info.capabilities.tools).toBe(true);
    const res = await conn.callTool("echo", { text: "http-ok" });
    expect(res.content).toEqual([{ type: "text", text: "http-ok" }]);
  });

  it("fails to connect with wrong bearer token", async () => {
    const cfg: HttpServerConfig = {
      type: "http",
      url: server.url,
      auth: { type: "bearer", token: "wrong-token" },
    };
    conn = new McpConnection(cfg);
    await expect(conn.connect()).rejects.toBeDefined();
  });
});
