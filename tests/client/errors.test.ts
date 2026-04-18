import { describe, expect, it } from "vitest";
import {
  ConnectionError,
  McpError,
  ProtocolError,
  TimeoutError,
} from "../../src/client/errors.js";

describe("error hierarchy", () => {
  it("McpError is the base and extends Error", () => {
    const err = new McpError("base");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("McpError");
    expect(err.message).toBe("base");
  });

  it("ConnectionError extends McpError and carries a cause", () => {
    const cause = new Error("socket hangup");
    const err = new ConnectionError("cannot connect", { cause });
    expect(err).toBeInstanceOf(McpError);
    expect(err.name).toBe("ConnectionError");
    expect(err.cause).toBe(cause);
  });

  it("TimeoutError exposes the elapsed timeout in ms", () => {
    const err = new TimeoutError("slow", { timeoutMs: 30_000 });
    expect(err).toBeInstanceOf(McpError);
    expect(err.name).toBe("TimeoutError");
    expect(err.timeoutMs).toBe(30_000);
  });

  it("ProtocolError carries an optional method name for diagnostics", () => {
    const err = new ProtocolError("bad response", { method: "tools/list" });
    expect(err).toBeInstanceOf(McpError);
    expect(err.name).toBe("ProtocolError");
    expect(err.method).toBe("tools/list");
  });
});
