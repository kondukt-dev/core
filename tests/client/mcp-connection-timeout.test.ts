import { afterEach, describe, expect, it } from "vitest";
import { McpConnection } from "../../src/client/mcp-connection.js";
import { TimeoutError } from "../../src/client/errors.js";
import type { StdioServerConfig } from "../../src/client/types.js";

const slowConfig: StdioServerConfig = {
  type: "stdio",
  command: "npx",
  args: ["-y", "tsx", "tests/fixtures/mock-server.ts"],
  timeout: 500,
};

describe("McpConnection — timeout", () => {
  let conn: McpConnection | undefined;
  afterEach(async () => {
    if (conn) await conn.disconnect().catch(() => undefined);
    conn = undefined;
  });

  it("throws TimeoutError when slow_echo exceeds config timeout", async () => {
    conn = new McpConnection(slowConfig);
    await conn.connect();
    await expect(
      conn.callTool("slow_echo", { text: "late", delayMs: 2000 }),
    ).rejects.toBeInstanceOf(TimeoutError);
  });
});
