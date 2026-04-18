import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { McpConnection } from "../../src/client/index.js";
import { startKonduktServer, type KonduktServerHandle } from "../../src/server/kondukt-server.js";

const PORT = 18081;

describe("startKonduktServer (http) in-process", () => {
  let handle: KonduktServerHandle;
  let conn: McpConnection;

  beforeAll(async () => {
    handle = await startKonduktServer({ transport: "http", port: PORT, host: "127.0.0.1" });
    conn = new McpConnection({ type: "http", url: `http://127.0.0.1:${PORT}/mcp` });
    await conn.connect();
  });

  afterAll(async () => {
    await conn.disconnect().catch(() => undefined);
    await handle.close();
  });

  it("lists all 9 tools over HTTP", async () => {
    const tools = await conn.listTools();
    expect(tools.length).toBe(9);
    const names = tools.map((t) => t.name).sort();
    expect(names).toContain("test_server");
    expect(names).toContain("validate_server");
  });

  it("dispatches unknown tool to isError response", async () => {
    const result = await conn.callTool("no_such_tool", {});
    expect(result.isError).toBe(true);
  });
});
