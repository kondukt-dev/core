import { describe, expect, it } from "vitest";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createTransport } from "../../src/client/transports.js";
import type { HttpServerConfig, StdioServerConfig } from "../../src/client/types.js";

describe("createTransport", () => {
  it("produces a StdioClientTransport for stdio config", () => {
    const cfg: StdioServerConfig = { type: "stdio", command: "node", args: ["-e", ";"] };
    const t = createTransport(cfg);
    expect(t).toBeInstanceOf(StdioClientTransport);
  });

  it("produces a StreamableHTTPClientTransport for http config", () => {
    const cfg: HttpServerConfig = { type: "http", url: "http://localhost:9999/mcp" };
    const t = createTransport(cfg);
    expect(t).toBeInstanceOf(StreamableHTTPClientTransport);
  });

  it("injects auth headers into http transport requestInit", () => {
    const cfg: HttpServerConfig = {
      type: "http",
      url: "http://localhost:9999/mcp",
      auth: { type: "bearer", token: "abc" },
    };
    const t = createTransport(cfg) as StreamableHTTPClientTransport;
    const opts = (t as unknown as { _requestInit?: { headers?: Record<string, string> } })
      ._requestInit;
    expect(opts?.headers?.["Authorization"]).toBe("Bearer abc");
  });
});
