// scripts/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { transform } from "lightningcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function listFiles(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function die(message) {
  console.error(`starwind build: ${message}`);
  process.exit(1);
}

function packageBaseName(pkgName) {
  const name = pkgName.split("/").pop() || pkgName;
  return name;
}

function deriveSlugFromPackageName(pkgName) {
  const base = packageBaseName(pkgName);
  if (base.startsWith("starwind-")) {
    return base.slice("starwind-".length);
  }
  return base;
}

function findSingleEntryInSrc(srcDir, preferredBase) {
  const files = listFiles(srcDir).filter((f) => f.endsWith(".js"));
  const candidates = files
    .filter((f) => f.startsWith("starwind."))
    .map((f) => path.join(srcDir, f));

  if (preferredBase) {
    const preferred = path.join(srcDir, `${preferredBase}.js`);
    if (exists(preferred)) return preferred;
  }

  if (candidates.length === 1) return candidates[0];

  if (candidates.length === 0) {
    die(
      `no entry JS found in ${srcDir}. Expected a file like ` +
        `"starwind.*.js" (e.g. "starwind.layout.stacked.js").`,
    );
  }

  die(
    `multiple entry JS files found in ${srcDir}:\n` +
      candidates.map((c) => `- ${path.basename(c)}`).join("\n") +
      `\nAdd package.json config: { "starwind": { "entry": "src/<file>.js" } }`,
  );
}

function getBuildConfig() {
  const repoRoot = path.join(__dirname, "..");
  const pkgPath = path.join(repoRoot, "package.json");
  if (!exists(pkgPath)) die("package.json not found at repo root.");

  const pkg = readJson(pkgPath);
  if (!pkg.name) die("package.json missing required field: name");

  const starwindCfg = pkg.starwind || {};
  const slug = starwindCfg.slug || deriveSlugFromPackageName(pkg.name);

  const srcDir = path.join(repoRoot, "src");
  const outDir = path.join(repoRoot, starwindCfg.outDir || slug);

  const entry =
    starwindCfg.entry && typeof starwindCfg.entry === "string"
      ? path.join(repoRoot, starwindCfg.entry)
      : null;

  const preferredBase = starwindCfg.baseName || `starwind.layout.${slug}`;

  const entryJs = entry || findSingleEntryInSrc(srcDir, preferredBase);
  const baseName = path.basename(entryJs, ".js");

  return {
    repoRoot,
    pkg,
    slug,
    outDir,
    entryJs,
    baseName,
  };
}

async function buildJs(entryJs, outDir, baseName) {
  const outJs = path.join(outDir, `${baseName}.js`);
  const outJsMin = path.join(outDir, `${baseName}.min.js`);

  await esbuild({
    entryPoints: [entryJs],
    bundle: true,
    format: "esm",
    target: ["es2020"],
    outfile: outJs,
    minify: false,
    sourcemap: false,
  });

  await esbuild({
    entryPoints: [entryJs],
    bundle: true,
    format: "esm",
    target: ["es2020"],
    outfile: outJsMin,
    minify: true,
    sourcemap: false,
  });

  return { outJs, outJsMin };
}

function buildCss(outDir, baseName) {
  const inCss = path.join(outDir, `${baseName}.css`);
  const outCssMin = path.join(outDir, `${baseName}.min.css`);

  if (!exists(inCss)) {
    console.warn(
      `starwind build: CSS not found at ${path.relative(
        process.cwd(),
        inCss,
      )} (skipping CSS minify)`,
    );
    return { inCss: null, outCssMin: null };
  }

  const css = fs.readFileSync(inCss, "utf8");
  const result = transform({
    filename: path.basename(inCss),
    code: Buffer.from(css),
    minify: true,
    sourceMap: false,
  });

  fs.writeFileSync(outCssMin, result.code);
  return { inCss, outCssMin };
}

async function main() {
  const { outDir, entryJs, baseName } = getBuildConfig();

  if (!exists(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const { outJs, outJsMin } = await buildJs(entryJs, outDir, baseName);
  const { outCssMin } = buildCss(outDir, baseName);

  console.log("Built:");
  console.log(" -", path.relative(process.cwd(), outJs));
  console.log(" -", path.relative(process.cwd(), outJsMin));
  if (outCssMin) console.log(" -", path.relative(process.cwd(), outCssMin));
}

await main();
