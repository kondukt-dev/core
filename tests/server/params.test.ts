import { describe, expect, it } from "vitest";
import { buildConfigFromParams, ConnectParamsSchema } from "../../src/server/params.js";

describe("buildConfigFromParams", () => {
  it("builds stdio config from command param", () => {
    const cfg = buildConfigFromParams({ command: "npx my-server" });
    expect(cfg.type).toBe("stdio");
    if (cfg.type === "stdio") {
      expect(cfg.command).toBe("npx");
      expect(cfg.args).toEqual(["my-server"]);
    }
  });

  it("preserves quoted args", () => {
    const cfg = buildConfigFromParams({ command: "node -e 'console.log(1)'" });
    expect(cfg.type).toBe("stdio");
    if (cfg.type === "stdio") {
      expect(cfg.command).toBe("node");
      expect(cfg.args).toEqual(["-e", "console.log(1)"]);
    }
  });

  it("builds http config from url param", () => {
    const cfg = buildConfigFromParams({ url: "https://example.com/mcp" });
    expect(cfg.type).toBe("http");
    if (cfg.type === "http") {
      expect(cfg.url).toBe("https://example.com/mcp");
    }
  });

  it("adds bearer auth to http config", () => {
    const cfg = buildConfigFromParams({
      url: "https://example.com/mcp",
      auth_type: "bearer",
      auth_value: "xyz",
    });
    if (cfg.type !== "http" || cfg.auth?.type !== "bearer") throw new Error("bad cfg");
    expect(cfg.auth.token).toBe("xyz");
  });

  it("adds api-key auth to http config", () => {
    const cfg = buildConfigFromParams({
      url: "https://example.com/mcp",
      auth_type: "api-key",
      auth_header: "X-API-Key",
      auth_value: "abc",
    });
    if (cfg.type !== "http" || cfg.auth?.type !== "api-key") throw new Error("bad cfg");
    expect(cfg.auth.headerName).toBe("X-API-Key");
    expect(cfg.auth.value).toBe("abc");
  });

  it("rejects params with neither command nor url", () => {
    expect(() => buildConfigFromParams({})).toThrow(/command.*url/);
  });

  it("rejects params with both command and url", () => {
    expect(() => buildConfigFromParams({ command: "x", url: "http://x" })).toThrow(
      /both.*command.*url/,
    );
  });

  it("ConnectParamsSchema parses timeout", () => {
    const parsed = ConnectParamsSchema.parse({ command: "x", timeout: 5000 });
    expect(parsed.timeout).toBe(5000);
  });
});
