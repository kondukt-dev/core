import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { McpConnection } from "../../src/client/index.js";
import {
  PROTOCOL_RULES,
  runProtocolRules,
} from "../../src/validator/rules/protocol-rules.js";
import type { StdioServerConfig } from "../../src/client/types.js";

const mockConfig: StdioServerConfig = {
  type: "stdio",
  command: "npx",
  args: ["-y", "tsx", "tests/fixtures/mock-server.ts"],
};

describe("protocol rules against mock-server (all should pass)", () => {
  let conn: McpConnection;

  beforeEach(async () => {
    conn = new McpConnection(mockConfig);
    await conn.connect();
  });

  afterEach(async () => {
    await conn.disconnect().catch(() => undefined);
  });

  it("server-responds-ping passes", async () => {
    const issues = await runProtocolRules({ conn });
    expect(issues.some((i) => i.rule === "server-responds-ping")).toBe(false);
  });

  it("server-reports-capabilities passes (tools/resources/prompts advertised)", async () => {
    const issues = await runProtocolRules({ conn });
    expect(issues.some((i) => i.rule === "server-reports-capabilities")).toBe(false);
  });

  it("tools-list-stable passes for deterministic server", async () => {
    const issues = await runProtocolRules({ conn });
    expect(issues.some((i) => i.rule === "tools-list-stable")).toBe(false);
  });

  it("PROTOCOL_RULES has 5 unique rules", () => {
    expect(PROTOCOL_RULES.length).toBe(5);
    expect(new Set(PROTOCOL_RULES.map((r) => r.id)).size).toBe(5);
  });
});
