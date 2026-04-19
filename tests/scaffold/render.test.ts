import { describe, expect, it } from "vitest";
import { renderTemplate } from "../../src/scaffold/render.js";

describe("renderTemplate", () => {
  it("substitutes a basic variable", () => {
    const out = renderTemplate("Hello {{name}}!", { name: "World" });
    expect(out).toBe("Hello World!");
  });

  it("does NOT HTML-escape values with triple-stache", () => {
    const out = renderTemplate("{{{raw}}}", { raw: '"quoted" & <tag>' });
    expect(out).toBe('"quoted" & <tag>');
  });

  it("supports {{#each}} over objects with @key", () => {
    const out = renderTemplate("{{#each items}}{{@key}}={{type}};{{/each}}", {
      items: { a: { type: "string" }, b: { type: "number" } },
    });
    expect(out).toBe("a=string;b=number;");
  });

  it("supports the 'json' helper", () => {
    const out = renderTemplate("{{{json x}}}", { x: { a: 1 } });
    expect(out).toBe('{"a":1}');
  });

  it("supports the 'snake' helper", () => {
    const out = renderTemplate("{{snake name}}", { name: "MyToolName" });
    expect(out).toBe("my_tool_name");
  });

  it("supports 'pascal' helper", () => {
    const out = renderTemplate("{{pascal name}}", { name: "my_tool_name" });
    expect(out).toBe("MyToolName");
  });
});
