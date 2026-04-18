import { afterEach, describe, expect, it } from "vitest";
import { ConnectionManager } from "../../src/client/connection-manager.js";
import type { StdioServerConfig } from "../../src/client/types.js";

const cfg: StdioServerConfig = {
  type: "stdio",
  command: "npx",
  args: ["-y", "tsx", "tests/fixtures/mock-server.ts"],
};

describe("ConnectionManager", () => {
  let mgr: ConnectionManager | undefined;

  afterEach(async () => {
    if (mgr) await mgr.disconnectAll();
    mgr = undefined;
  });

  it("connect returns id and ServerInfo", async () => {
    mgr = new ConnectionManager();
    const { id, info } = await mgr.connect(cfg);
    expect(id).toMatch(/[0-9a-f-]/);
    expect(info.name).toBe("mock-server");
    expect(mgr.count()).toBe(1);
  });

  it("get returns the connection by id", async () => {
    mgr = new ConnectionManager();
    const { id } = await mgr.connect(cfg);
    const conn = mgr.get(id);
    expect(conn).toBeDefined();
    expect(conn?.id).toBe(id);
  });

  it("list returns status objects for all managed connections", async () => {
    mgr = new ConnectionManager();
    await mgr.connect(cfg);
    await mgr.connect(cfg);
    const statuses = mgr.list();
    expect(statuses.length).toBe(2);
    expect(statuses.every((s) => s.status === "connected")).toBe(true);
  });

  it("disconnect removes the connection", async () => {
    mgr = new ConnectionManager();
    const { id } = await mgr.connect(cfg);
    await mgr.disconnect(id);
    expect(mgr.count()).toBe(0);
    expect(mgr.get(id)).toBeUndefined();
  });

  it("emits connectionAdded and connectionRemoved events", async () => {
    mgr = new ConnectionManager();
    const added: string[] = [];
    const removed: string[] = [];
    mgr.on("connectionAdded", (s) => added.push(s.id));
    mgr.on("connectionRemoved", (id) => removed.push(id));
    const { id } = await mgr.connect(cfg);
    await mgr.disconnect(id);
    expect(added).toEqual([id]);
    expect(removed).toEqual([id]);
  });

  it("respects maxConnections", async () => {
    mgr = new ConnectionManager({ maxConnections: 1 });
    await mgr.connect(cfg);
    await expect(mgr.connect(cfg)).rejects.toThrow(/Max connections/);
  });
});
