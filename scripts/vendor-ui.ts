// Vendor official shadcn registry components into src/components/ui/.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
const names = process.argv.slice(2);
mkdirSync("src/components/ui", { recursive: true });
for (const name of names) {
  const url = `https://ui.shadcn.com/r/styles/base-rhea/${name}.json`;
  const res = await fetch(url);
  if (!res.ok) { console.log(`SKIP ${name}: HTTP ${res.status}`); continue; }
  const d = (await res.json()) as { files: { path: string; content: string }[]; dependencies?: string[]; registryDependencies?: string[] };
  for (const f of d.files) {
    const target = `src/components/ui/${name}.tsx`;
    const c = f.content
      .replaceAll("@/registry/base-rhea/ui/", "@/components/ui/")
      .replaceAll('from "cn"', 'from "@/lib/utils"')
      .replaceAll("IconPlaceholder", "PlaceholderIcon");
    writeFileSync(target, c);
    console.log(`OK ${name} -> ${target} (${c.length}b)`);
  }
  if (d.dependencies?.length) console.log(`  deps: ${d.dependencies.join(" ")}`);
  if (d.registryDependencies?.length) console.log(`  registry: ${d.registryDependencies.join(" ")}`);
}
