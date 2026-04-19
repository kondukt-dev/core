import { EventEmitter } from "node:events";

import { McpConnection } from "./mcp-connection.js";
import type { ConnectionStatus, ServerConfig, ServerInfo } from "./types.js";

export class ConnectionManager extends EventEmitter {
  private readonly connections = new Map<string, McpConnection>();
  private readonly maxConnections: number;

  constructor(options?: { maxConnections?: number }) {
    super();
    this.maxConnections = options?.maxConnections ?? Infinity;
  }

  async connect(config: ServerConfig): Promise<{ id: string; info: ServerInfo }> {
    if (this.connections.size >= this.maxConnections) {
      throw new Error(`Max connections reached (${this.maxConnections})`);
    }
    const conn = new McpConnection(config);
    conn.on("statusChange", (s: ConnectionStatus) => this.emit("connectionStatusChange", s));
    const info = await conn.connect();
    this.connections.set(conn.id, conn);
    this.emit("connectionAdded", this.statusOf(conn));
    return { id: conn.id, info };
  }

  async disconnect(id: string): Promise<void> {
    const conn = this.connections.get(id);
    if (!conn) return;
    await conn.disconnect();
    this.connections.delete(id);
    this.emit("connectionRemoved", id);
  }

  async disconnectAll(): Promise<void> {
    const ids = [...this.connections.keys()];
    await Promise.all(ids.map((id) => this.disconnect(id)));
  }

  get(id: string): McpConnection | undefined {
    return this.connections.get(id);
  }

  list(): ConnectionStatus[] {
    return [...this.connections.values()].map((c) => this.statusOf(c));
  }

  count(): number {
    return this.connections.size;
  }

  private statusOf(conn: McpConnection): ConnectionStatus {
    return {
      id: conn.id,
      serverName: "",
      status: conn.status,
    };
  }
}
