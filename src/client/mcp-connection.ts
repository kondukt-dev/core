import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import debug from "debug";

import { ConnectionError, ProtocolError, TimeoutError } from "./errors.js";
import { createTransport } from "./transports.js";
import type {
  ConnectionStatus,
  Prompt,
  PromptMessages,
  Resource,
  ResourceContent,
  ServerConfig,
  ServerInfo,
  Tool,
  ToolContent,
  ToolResult,
} from "./types.js";

const log = debug("kondukt:client:connection");

function looksLikeEarlyExit(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current != null; depth++) {
    if (typeof current !== "object") break;
    const node = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (node.code === "EPIPE" || node.code === "ENOENT" || node.code === -32000) return true;
    if (typeof node.message === "string") {
      const m = node.message.toLowerCase();
      if (
        m.includes("epipe") ||
        m.includes("enoent") ||
        m.includes("spawn ") ||
        m.includes("connection closed")
      ) {
        return true;
      }
    }
    current = node.cause;
  }
  return false;
}

export class McpConnection extends EventEmitter {
  readonly id: string;
  readonly config: ServerConfig;
  status: ConnectionStatus["status"] = "disconnected";

  private client: Client | undefined;
  private serverName = "";

  constructor(config: ServerConfig) {
    super();
    this.id = randomUUID();
    this.config = config;
  }

  async connect(): Promise<ServerInfo> {
    this.setStatus("connecting");
    try {
      const transport = createTransport(this.config);
      const client = new Client({ name: "kondukt", version: "0.1.0" });
      await client.connect(transport);
      this.client = client;
      const capabilities = client.getServerCapabilities() ?? {};
      const version = client.getServerVersion();
      this.serverName = version?.name ?? "unknown";
      const [toolCount, resourceCount, promptCount] = await Promise.all([
        capabilities.tools ? client.listTools().then((r) => r.tools.length) : 0,
        capabilities.resources ? client.listResources().then((r) => r.resources.length) : 0,
        capabilities.prompts ? client.listPrompts().then((r) => r.prompts.length) : 0,
      ]);
      const info: ServerInfo = {
        name: version?.name ?? "unknown",
        version: version?.version ?? "0.0.0",
        protocolVersion: "unknown",
        capabilities: {
          tools: Boolean(capabilities.tools),
          resources: Boolean(capabilities.resources),
          prompts: Boolean(capabilities.prompts),
        },
        toolCount,
        resourceCount,
        promptCount,
      };
      this.setStatus("connected");
      log("connected to %s (%s)", info.name, info.version);
      return info;
    } catch (err) {
      const message = looksLikeEarlyExit(err)
        ? "target process exited before handshake"
        : "Failed to connect to MCP server";
      this.setStatus("error", message);
      throw new ConnectionError(message, { cause: err });
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      this.setStatus("disconnected");
      return;
    }
    try {
      await this.client.close();
    } finally {
      this.client = undefined;
      this.setStatus("disconnected");
    }
  }

  async ping(): Promise<boolean> {
    this.requireClient("ping");
    try {
      await this.client!.ping();
      return true;
    } catch {
      return false;
    }
  }

  async listTools(): Promise<Tool[]> {
    this.requireClient("tools/list");
    const resp = await this.client!.listTools();
    return resp.tools.map((t) => ({
      name: t.name,
      ...(t.description !== undefined ? { description: t.description } : {}),
      inputSchema: t.inputSchema as Record<string, unknown>,
    }));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    this.requireClient("tools/call");
    const timeoutMs = this.config.timeout ?? 30_000;
    const startedAt = Date.now();
    try {
      const resp = await this.withTimeout(
        this.client!.callTool({ name, arguments: args }),
        timeoutMs,
        "tools/call",
      );
      const completedAt = Date.now();
      return {
        content: resp.content as ToolContent[],
        ...(resp.isError !== undefined ? { isError: Boolean(resp.isError) } : {}),
        timing: { startedAt, completedAt, durationMs: completedAt - startedAt },
      };
    } catch (err) {
      if (err instanceof TimeoutError) throw err;
      throw new ProtocolError(err instanceof Error ? err.message : "tools/call failed", {
        method: "tools/call",
        cause: err,
      });
    }
  }

  async listResources(): Promise<Resource[]> {
    this.requireClient("resources/list");
    const resp = await this.client!.listResources();
    return resp.resources.map((r) => ({
      uri: r.uri,
      name: r.name,
      ...(r.description !== undefined ? { description: r.description } : {}),
      ...(r.mimeType !== undefined ? { mimeType: r.mimeType } : {}),
    }));
  }

  async readResource(uri: string): Promise<ResourceContent> {
    this.requireClient("resources/read");
    const resp = await this.client!.readResource({ uri });
    return {
      uri,
      contents: resp.contents.map((c) => {
        const raw = c as { uri: string; text?: string; blob?: string; mimeType?: string };
        return {
          uri: raw.uri,
          ...(typeof raw.text === "string" ? { text: raw.text } : {}),
          ...(typeof raw.blob === "string" ? { blob: raw.blob } : {}),
          ...(raw.mimeType !== undefined ? { mimeType: raw.mimeType } : {}),
        };
      }),
    };
  }

  async listPrompts(): Promise<Prompt[]> {
    this.requireClient("prompts/list");
    const resp = await this.client!.listPrompts();
    return resp.prompts.map((p) => ({
      name: p.name,
      ...(p.description !== undefined ? { description: p.description } : {}),
      ...(p.arguments !== undefined
        ? {
            arguments: p.arguments.map((a) => ({
              name: a.name,
              ...(a.description !== undefined ? { description: a.description } : {}),
              ...(a.required !== undefined ? { required: a.required } : {}),
            })),
          }
        : {}),
    }));
  }

  async getPrompt(name: string, args?: Record<string, string>): Promise<PromptMessages> {
    this.requireClient("prompts/get");
    const resp = await this.client!.getPrompt({
      name,
      ...(args !== undefined ? { arguments: args } : {}),
    });
    return { messages: resp.messages as PromptMessages["messages"] };
  }

  protected requireClient(method: string): void {
    if (!this.client) {
      throw new ProtocolError("Not connected", { method });
    }
  }

  private async withTimeout<T>(p: Promise<T>, timeoutMs: number, method: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new TimeoutError(`${method} timed out after ${timeoutMs}ms`, { timeoutMs }));
      }, timeoutMs);
    });
    try {
      return await Promise.race([p, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private setStatus(status: ConnectionStatus["status"], error?: string): void {
    this.status = status;
    const payload: ConnectionStatus = {
      id: this.id,
      serverName: this.serverName,
      status,
      ...(error !== undefined ? { error } : {}),
      ...(status === "connected" ? { connectedAt: new Date() } : {}),
    };
    this.emit("statusChange", payload);
  }
}
