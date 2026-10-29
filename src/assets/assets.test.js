import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { it, expect } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));

it("keeps every image asset at or under 300KB", () => {
  for (const file of readdirSync(dir)) {
    if (!/\.(png|jpe?g|webp|avif|svg)$/i.test(file)) continue;
    expect(statSync(join(dir, file)).size, file).toBeLessThanOrEqual(300 * 1024);
  }
});
