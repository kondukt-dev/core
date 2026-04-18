import { z } from "zod";

const AuthNoneSchema = z.object({ type: z.literal("none") });
const AuthBearerSchema = z.object({ type: z.literal("bearer"), token: z.string().min(1) });
const AuthApiKeySchema = z.object({
  type: z.literal("api-key"),
  headerName: z.string().min(1),
  value: z.string().min(1),
});
const AuthCustomSchema = z.object({
  type: z.literal("custom"),
  headers: z.record(z.string(), z.string()),
});

export const AuthConfigSchema = z.discriminatedUnion("type", [
  AuthNoneSchema,
  AuthBearerSchema,
  AuthApiKeySchema,
  AuthCustomSchema,
]);
export type AuthConfig = z.infer<typeof AuthConfigSchema>;

export const StdioServerConfigSchema = z.object({
  type: z.literal("stdio"),
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().optional(),
  timeout: z.number().int().positive().optional(),
});
export type StdioServerConfig = z.infer<typeof StdioServerConfigSchema>;

export const HttpServerConfigSchema = z.object({
  type: z.literal("http"),
  url: z.string().url(),
  auth: AuthConfigSchema.optional(),
  timeout: z.number().int().positive().optional(),
});
export type HttpServerConfig = z.infer<typeof HttpServerConfigSchema>;

export const ServerConfigSchema = z.discriminatedUnion("type", [
  StdioServerConfigSchema,
  HttpServerConfigSchema,
]);
export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export interface ServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  toolCount: number;
  resourceCount: number;
  promptCount: number;
}

export type ConnectionStatusValue =
  | "connecting"
  | "connected"
  | "error"
  | "disconnected";

export interface ConnectionStatus {
  id: string;
  serverName: string;
  status: ConnectionStatusValue;
  connectedAt?: Date;
  error?: string;
}

export type JSONSchema = Record<string, unknown>;

export interface Tool {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
}

export type ToolContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }
  | { type: "resource"; uri: string; text?: string; mimeType?: string };

export interface ToolTiming {
  startedAt: number;
  completedAt: number;
  durationMs: number;
}

export interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
  timing: ToolTiming;
}

export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ResourceContent {
  uri: string;
  contents: Array<{ uri: string; text?: string; blob?: string; mimeType?: string }>;
}

export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface Prompt {
  name: string;
  description?: string;
  arguments?: PromptArgument[];
}

export interface PromptMessages {
  messages: Array<{
    role: "user" | "assistant";
    content:
      | { type: "text"; text: string }
      | { type: "image"; data: string; mimeType: string };
  }>;
}
