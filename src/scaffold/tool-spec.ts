import type { ScaffoldTool } from "./types.js";

export function parseToolSpec(spec: string): ScaffoldTool {
  const raw = spec.trim();
  if (!raw) throw new Error("Tool spec must be a non-empty string");

  const firstColon = raw.indexOf(":");
  if (firstColon <= 0) throw new Error(`Tool spec '${spec}' must be 'name:description[:params]'`);
  const name = raw.slice(0, firstColon).trim();

  const afterName = raw.slice(firstColon + 1);
  const secondColon = afterName.indexOf(":");
  const description = (secondColon < 0 ? afterName : afterName.slice(0, secondColon)).trim();
  const paramsPart = secondColon < 0 ? "" : afterName.slice(secondColon + 1);

  const parameters: ScaffoldTool["parameters"] = {};
  if (paramsPart.trim().length > 0) {
    for (const pair of paramsPart.split(",")) {
      const trimmed = pair.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf(":");
      if (idx <= 0) {
        throw new Error(
          `Parameter '${trimmed}' must be in form 'name:type' (param is missing type)`,
        );
      }
      let paramName = trimmed.slice(0, idx).trim();
      const type = trimmed.slice(idx + 1).trim();
      if (!type) throw new Error(`Parameter '${paramName}' is missing a type`);
      let required = true;
      if (paramName.endsWith("?")) {
        required = false;
        paramName = paramName.slice(0, -1);
      }
      parameters[paramName] = {
        type,
        description: `${paramName} parameter`,
        required,
      };
    }
  }

  return { name, description, parameters };
}
