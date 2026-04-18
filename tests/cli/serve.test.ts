import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { McpConnection } from "../../src/client/index.js";
import type { StdioServerConfig } from "../../src/client/types.js";

const serveConfig: StdioServerConfig = {
  type: "stdio",
  command: "pnpm",
  args: ["tsx", "src/cli/index.ts", "serve"],
};

describe("kondukt serve (stdio)", () => {
  let conn: McpConnection;
  beforeAll(async () => {
    conn = new McpConnection(serveConfig);
    await conn.connect();
  });
  afterAll(async () => {
    await conn.disconnect().catch(() => undefined);
  });

  it("advertises the 9 Kondukt tools", async () => {
    const tools = await conn.listTools();
    expect(tools.length).toBe(9);
  });
});
