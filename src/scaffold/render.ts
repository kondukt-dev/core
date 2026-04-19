import Handlebars from "handlebars";

const hb = Handlebars.create();

hb.registerHelper("json", (value: unknown) => new hb.SafeString(JSON.stringify(value)));

hb.registerHelper("snake", (value: unknown) => {
  const s = String(value ?? "");
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
});

hb.registerHelper("pascal", (value: unknown) => {
  const s = String(value ?? "");
  return s
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join("");
});

export function renderTemplate(template: string, context: unknown): string {
  const compiled = hb.compile(template, { noEscape: false, strict: false });
  return compiled(context);
}
