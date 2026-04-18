import { z } from "zod";

import type { HttpServerConfig, ServerConfig, StdioServerConfig } from "../client/types.js";

export const ConnectParamsSchema = z.object({
  command: z.string().optional(),
  url: z.string().optional(),
  auth_type: z.enum(["none", "bearer", "api-key"]).optional(),
  auth_value: z.string().optional(),
  auth_header: z.string().optional(),
  timeout: z.number().int().positive().optional(),
});

export type ConnectParams = z.infer<typeof ConnectParamsSchema>;

export function buildConfigFromParams(raw: unknown): ServerConfig {
  const p = ConnectParamsSchema.parse(raw);
  if (!p.command && !p.url) {
    throw new Error("Must provide either `command` (stdio) or `url` (http)");
  }
  if (p.command && p.url) {
    throw new Error("Cannot provide both `command` and `url` — pick one");
  }

  if (p.command) {
    const parts = tokenize(p.command);
    if (parts.length === 0) throw new Error("Empty command");
    const [head, ...rest] = parts;
    const cfg: StdioServerConfig = { type: "stdio", command: head! };
    if (rest.length > 0) cfg.args = rest;
    if (p.timeout !== undefined) cfg.timeout = p.timeout;
    return cfg;
  }

  const cfg: HttpServerConfig = { type: "http", url: p.url! };
  if (p.timeout !== undefined) cfg.timeout = p.timeout;
  if (p.auth_type && p.auth_type !== "none") {
    if (p.auth_type === "bearer") {
      if (!p.auth_value) throw new Error("bearer auth requires auth_value");
      cfg.auth = { type: "bearer", token: p.auth_value };
    } else {
      if (!p.auth_header || !p.auth_value) {
        throw new Error("api-key auth requires auth_header and auth_value");
      }
      cfg.auth = { type: "api-key", headerName: p.auth_header, value: p.auth_value };
    }
  }
  return cfg;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  for (const ch of input) {
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (cur.length > 0) {
        tokens.push(cur);
        cur = "";
      }
      continue;
    }
    cur += ch;
  }
  if (cur.length > 0) tokens.push(cur);
  return tokens;
}
