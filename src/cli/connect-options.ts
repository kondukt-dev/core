import type { Command } from "commander";
import type {
  AuthConfig,
  HttpServerConfig,
  ServerConfig,
  StdioServerConfig,
} from "../client/types.js";

export interface CliConnectOptions {
  url?: string;
  bearer?: string;
  apiKey?: string;
  header?: string[];
  timeout?: number;
  format?: "pretty" | "json";
}

export function commonConnectOptions(cmd: Command): Command {
  return cmd
    .option("--url <url>", "remote server URL (HTTP transport)")
    .option("--bearer <token>", "Bearer token for HTTP auth")
    .option("--api-key <header:value>", "API key auth, format Header:Value")
    .option(
      "--header <name:value>",
      "extra HTTP header, repeatable",
      (v, acc: string[]) => [...acc, v],
      [] as string[],
    )
    .option("--timeout <ms>", "per-request timeout ms", (v) => Number.parseInt(v, 10), 30_000)
    .option("--format <fmt>", "output format: pretty | json", "pretty");
}

export function buildConfigFromCli(
  stdioArgs: string[] | undefined,
  opts: CliConnectOptions,
): ServerConfig {
  const hasStdio = stdioArgs && stdioArgs.length > 0;
  const hasHttp = Boolean(opts.url);

  if (!hasStdio && !hasHttp) {
    throw new Error("Provide either a stdio command (positional) or --url <url>");
  }
  if (hasStdio && hasHttp) {
    throw new Error("Cannot use both stdio command and --url; pick one");
  }

  if (hasStdio) {
    const [head, ...rest] = stdioArgs!;
    const cfg: StdioServerConfig = { type: "stdio", command: head! };
    if (rest.length > 0) cfg.args = rest;
    if (opts.timeout) cfg.timeout = opts.timeout;
    return cfg;
  }

  const cfg: HttpServerConfig = { type: "http", url: opts.url! };
  if (opts.timeout) cfg.timeout = opts.timeout;
  const auth = buildAuth(opts);
  if (auth) cfg.auth = auth;
  return cfg;
}

function buildAuth(opts: CliConnectOptions): AuthConfig | undefined {
  if (opts.bearer) return { type: "bearer", token: opts.bearer };
  if (opts.apiKey) {
    const idx = opts.apiKey.indexOf(":");
    if (idx <= 0) throw new Error("--api-key must be in form 'Header:Value'");
    return {
      type: "api-key",
      headerName: opts.apiKey.slice(0, idx),
      value: opts.apiKey.slice(idx + 1),
    };
  }
  if (opts.header && opts.header.length > 0) {
    const headers: Record<string, string> = {};
    for (const h of opts.header) {
      const idx = h.indexOf(":");
      if (idx <= 0) throw new Error(`--header must be 'Name:Value', got '${h}'`);
      headers[h.slice(0, idx)] = h.slice(idx + 1);
    }
    return { type: "custom", headers };
  }
  return undefined;
}
