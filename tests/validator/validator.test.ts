import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { McpConnection } from "../../src/client/index.js";
import { SchemaValidator } from "../../src/validator/index.js";
import type { StdioServerConfig } from "../../src/client/types.js";

const mockConfig: StdioServerConfig = {
  type: "stdio",
  command: "npx",
  args: ["-y", "tsx", "tests/fixtures/mock-server.ts"],
};

describe("SchemaValidator against mock-server", () => {
  let conn: McpConnection;

  beforeEach(async () => {
    conn = new McpConnection(mockConfig);
    await conn.connect();
  });

  afterEach(async () => {
    await conn.disconnect().catch(() => undefined);
  });

  it("validates and returns a ValidationResult", async () => {
    const result = await new SchemaValidator().validate(conn);
    expect(result.server).toBe("mock-server");
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.passed + result.failed + result.warnings).toBeLessThanOrEqual(19);
    expect(result.summary).toMatch(/score/i);
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("mock-server scores at least 85 (it's a clean fixture)", async () => {
    const result = await new SchemaValidator().validate(conn);
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("throws when called with disconnected connection", async () => {
    const c = new McpConnection(mockConfig);
    await expect(new SchemaValidator().validate(c)).rejects.toThrow(/connected/);
  });
});
