import type { McpConnection } from "../../client/mcp-connection.js";
import type { ValidationIssue } from "../types.js";

export interface ProtocolContext {
  conn: McpConnection;
}

export interface ProtocolRule {
  id: string;
  run: (ctx: ProtocolContext) => Promise<ValidationIssue[]>;
}

export const serverRespondsInitialize: ProtocolRule = {
  id: "server-responds-initialize",
  run: async ({ conn }) => {
    if (conn.status !== "connected") {
      return [
        {
          severity: "error",
          rule: "server-responds-initialize",
          message: "Server did not complete initialize (connection is not in 'connected' state)",
          suggestion: "Verify the server implements the initialize handshake.",
        },
      ];
    }
    return [];
  },
};

export const serverReportsCapabilities: ProtocolRule = {
  id: "server-reports-capabilities",
  run: async ({ conn }) => {
    const issues: ValidationIssue[] = [];
    const caps = await safeCapsProbe(conn);
    if (!caps.anyAdvertised) {
      issues.push({
        severity: "error",
        rule: "server-reports-capabilities",
        message: "Server advertises no capabilities (no tools, resources, or prompts)",
        suggestion: "An MCP server without any capability is not useful.",
      });
    }
    return issues;
  },
};

export const serverRespondsPing: ProtocolRule = {
  id: "server-responds-ping",
  run: async ({ conn }) => {
    try {
      const ok = await conn.ping();
      if (!ok) {
        return [
          {
            severity: "error",
            rule: "server-responds-ping",
            message: "Server did not respond to ping",
            suggestion: "Verify the server implements the ping request.",
          },
        ];
      }
      return [];
    } catch (err) {
      return [
        {
          severity: "error",
          rule: "server-responds-ping",
          message: `ping failed: ${err instanceof Error ? err.message : String(err)}`,
        },
      ];
    }
  },
};

export const toolsListStable: ProtocolRule = {
  id: "tools-list-stable",
  run: async ({ conn }) => {
    const first = await conn.listTools();
    const second = await conn.listTools();
    const firstNames = first.map((t) => t.name).sort();
    const secondNames = second.map((t) => t.name).sort();
    if (JSON.stringify(firstNames) !== JSON.stringify(secondNames)) {
      return [
        {
          severity: "warning",
          rule: "tools-list-stable",
          message: "tools/list returned different results across calls",
          suggestion: "Tool listings should be deterministic for the lifetime of a connection.",
        },
      ];
    }
    return [];
  },
};

export const serverVersionValid: ProtocolRule = {
  id: "server-version-valid",
  run: async ({ conn }) => {
    // Peek private SDK client to read the reported protocolVersion.
    // If the field is missing or "unknown", emit info.
    const bag = conn as unknown as {
      client?: { getServerVersion?: () => { protocolVersion?: string } | undefined };
    };
    const version = bag.client?.getServerVersion?.()?.protocolVersion;
    if (version === undefined || version === "" || version === "unknown") {
      return [
        {
          severity: "info",
          rule: "server-version-valid",
          message: "Server did not report a protocolVersion",
          suggestion: "Make sure the SDK's initialize handshake yields a protocolVersion.",
        },
      ];
    }
    return [];
  },
};

async function safeCapsProbe(conn: McpConnection): Promise<{ anyAdvertised: boolean }> {
  let any = false;
  try {
    const tools = await conn.listTools();
    if (tools.length > 0) any = true;
  } catch {
    /* ignore */
  }
  try {
    const resources = await conn.listResources();
    if (resources.length > 0) any = true;
  } catch {
    /* ignore */
  }
  try {
    const prompts = await conn.listPrompts();
    if (prompts.length > 0) any = true;
  } catch {
    /* ignore */
  }
  return { anyAdvertised: any };
}

export const PROTOCOL_RULES: readonly ProtocolRule[] = [
  serverRespondsInitialize,
  serverReportsCapabilities,
  serverRespondsPing,
  toolsListStable,
  serverVersionValid,
] as const;

export async function runProtocolRules(ctx: ProtocolContext): Promise<ValidationIssue[]> {
  const results = await Promise.all(PROTOCOL_RULES.map((r) => r.run(ctx)));
  return results.flat();
}
