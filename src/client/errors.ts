export class McpError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "McpError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConnectionError extends McpError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ConnectionError";
  }
}

export class TimeoutError extends McpError {
  readonly timeoutMs: number;
  constructor(message: string, options: { timeoutMs: number; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = "TimeoutError";
    this.timeoutMs = options.timeoutMs;
  }
}

export class ProtocolError extends McpError {
  readonly method?: string;
  constructor(message: string, options?: { method?: string; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "ProtocolError";
    if (options?.method !== undefined) this.method = options.method;
  }
}
