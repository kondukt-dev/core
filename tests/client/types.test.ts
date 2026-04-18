import { describe, expect, it } from "vitest";
import { ServerConfigSchema } from "../../src/client/types.js";

describe("ServerConfigSchema", () => {
  it("accepts a valid stdio config", () => {
    const result = ServerConfigSchema.safeParse({
      type: "stdio",
      command: "npx",
      args: ["-y", "my-server"],
      timeout: 30_000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid http config with bearer auth", () => {
    const result = ServerConfigSchema.safeParse({
      type: "http",
      url: "https://example.com/mcp",
      auth: { type: "bearer", token: "abc" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an http config with an invalid URL", () => {
    const result = ServerConfigSchema.safeParse({
      type: "http",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a stdio config missing command", () => {
    const result = ServerConfigSchema.safeParse({ type: "stdio" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown transport type", () => {
    const result = ServerConfigSchema.safeParse({ type: "smoke-signal" });
    expect(result.success).toBe(false);
  });
});
