import type { Dictionary } from "./dictionaries/en";

export function lookup(tree: unknown, key: string): unknown {
  let node: unknown = tree;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (match, name: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      return String(vars[name]);
    }
    return match;
  });
}

export function t(dict: Dictionary, key: string, vars?: Record<string, string | number>): string {
  const found = lookup(dict, key);
  if (typeof found !== "string") return key;
  if (!vars) return found;
  return interpolate(found, vars);
}
