// scripts/replace-index-href.js
// Substitui base href e favicon no index.html do build Angular

const fs = require("fs");
const path = require("path");

// Detecta ambiente pelo argumento de build (ex: --configuration=homolog)
const argv = process.argv.join(" ");
let env = "production";
if (/--configuration=homolog/i.test(argv)) env = "homolog";
if (/--configuration=serodio/i.test(argv)) env = "serodio";
if (/--configuration=development|--configuration=dev/i.test(argv))
  env = "development";

let baseHref = "/";
let faviconPath = "/favicon.ico";

if (env === "homolog") {
  baseHref = "/cacambashomolog/web/";
  faviconPath = "/cacambashomolog/web/favicon.ico";
} else if (env === "production") {
  baseHref = "/cacambas/web/";
  faviconPath = "/cacambas/web/favicon.ico";
} else if (env === "serodio") {
  // serodio.nexusoperations.com.br serves straight from its FTP docroot (/www/serodio/, see
  // deploy.yml's deploy-frontend-serodio job), not from a subpath -- unlike the
  // "production"/"homolog" targets above.
  baseHref = "/";
  faviconPath = "/favicon.ico";
} else if (env === "development") {
  baseHref = "/";
  faviconPath = "/favicon.ico";
}

// Detecta --output-path no argv
let outputPath = null;
const outputPathMatch = argv.match(/--output-path=([^\s]+)/i);
if (outputPathMatch) {
  outputPath = outputPathMatch[1];
}

// Se --output-path não foi passado, usa o padrão do Angular
let indexPath;
if (!outputPath) {
  indexPath = path.join(
    __dirname,
    "../dist/tsi.nexus.uiapp/browser/index.html",
  );
} else {
  indexPath = path.join(outputPath, "browser", "index.html");
}
if (!fs.existsSync(indexPath)) {
  console.error("index.html não encontrado em", indexPath);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");

// Substitui (ou insere) o base href
if (/<base href="[^"]*"/i.test(html)) {
  html = html.replace(/<base href="[^"]*"/i, `<base href="${baseHref}"`);
} else {
  html = html.replace(/<head>/i, `<head>\n    <base href=\"${baseHref}\" />`);
}

// Substitui (ou insere) o favicon
if (/<link rel="icon" type="image\/x-icon" href="[^"]*"/i.test(html)) {
  html = html.replace(
    /<link rel="icon" type="image\/x-icon" href="[^"]*"/i,
    `<link rel="icon" type="image/x-icon" href="${faviconPath}"`,
  );
} else {
  html = html.replace(
    /<head>/i,
    `<head>\n    <link rel=\"icon\" type=\"image/x-icon\" href=\"${faviconPath}\" />`,
  );
}

fs.writeFileSync(indexPath, html);
console.log("Base href e favicon substituídos com sucesso!");
