import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "mock-server", version: "0.0.0" },
  { capabilities: { tools: {}, resources: {}, prompts: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "echo",
      description: "Return the text argument back",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string", description: "Text to echo" } },
        required: ["text"],
      },
    },
    {
      name: "slow_echo",
      description: "Wait delayMs, then echo",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string" },
          delayMs: { type: "number" },
        },
        required: ["text", "delayMs"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  if (name === "echo") {
    const text = String((args as { text?: unknown }).text ?? "");
    return { content: [{ type: "text", text }] };
  }
  if (name === "slow_echo") {
    const text = String((args as { text?: unknown }).text ?? "");
    const delayMs = Number((args as { delayMs?: unknown }).delayMs ?? 0);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return { content: [{ type: "text", text }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "mock://hello",
      name: "Hello resource",
      description: "A static fixture",
      mimeType: "text/plain",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const { uri } = req.params;
  if (uri === "mock://hello") {
    return { contents: [{ uri, text: "Hello from mock", mimeType: "text/plain" }] };
  }
  throw new Error(`Unknown resource: ${uri}`);
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "greeting",
      description: "Generate a greeting",
      arguments: [{ name: "who", description: "Whom to greet", required: true }],
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  if (name === "greeting") {
    const who = String((args as Record<string, unknown> | undefined)?.["who"] ?? "world");
    return {
      messages: [
        {
          role: "user",
          content: { type: "text", text: `Say hello to ${who}` },
        },
      ],
    };
  }
  throw new Error(`Unknown prompt: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
