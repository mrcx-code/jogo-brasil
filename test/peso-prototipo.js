// peso-prototipo.js — o PROTÓTIPO do caminho "carregar sob demanda", sem tocar em src/
// nem no build. Feito para o ticket O PESO: prova com número que dá para tirar a arte dos
// capítulos 2+ do arquivo inicial e buscá-la quando a pessoa chega nelas.
//
//   node test/peso-prototipo.js [dirDeSaida]
//
// O que faz:
//   1. lê o index.html da RAIZ (a saída real do build de hoje) e gera uma CÓPIA em que a
//      arte dos capítulos 2+ vira um pixel transparente, e a arte de verdade vai para
//      arquivos pack-*.json ao lado (um por capítulo + travessia + páginas da história);
//   2. troca UMA diretiva da CSP: connect-src 'none' -> connect-src 'self'. Nada além —
//      é exatamente o que o caminho 1 exigiria abrir;
//   3. abre a cópia no Chromium headless e PROVA a troca em jogo vivo: o cenário 2 nasce
//      1×1 px, um fetch("pack-palmares.json") chega, os `src` são reatribuídos, e o
//      `onload` das peças (que já chama redesenharFundo()) redesenha — sem erro de console.
//
// A cópia NÃO é produção: é um protótipo de medida. O que ele não difere (herói, mobs,
// vegetação por época — mais ~250 KB por capítulo) está anotado no docs/arquivo/RELATORIO-PESO.md.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { ehRuidoDeRedeExterna } = require("./rede-externa.js");

const RAIZ = path.join(__dirname, "..");
const SAIDA = path.resolve(process.argv[2] ||
  path.join(require("os").tmpdir(), "claude", "peso-prototipo"));
fs.mkdirSync(SAIDA, { recursive: true });

let html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const packs = {
  "pack-travessia": {}, "pack-palmares": {}, "pack-salvador": {},
  "pack-hoje": {}, "pack-historia": {},
};

// --- cenário: listas em ordem de cena; 0,1 ficam (capítulo 1), 2..6 saem ---
// cena -> pack (mesma tabela do peso-composicao.js)
const PACK_DA_CENA = [null, null, "pack-palmares", "pack-palmares", "pack-salvador", "pack-hoje", "pack-hoje"];
for (const bloco of ["CENARIO_ALTO_B64", "CENARIO_CHAO_B64"]) {
  const ini = html.indexOf("const " + bloco + " = [");
  const fim = html.indexOf("];", ini);
  if (ini < 0 || fim < 0) throw new Error("não achei o bloco " + bloco);
  let i = -1;
  const trecho = html.slice(ini, fim).replace(/"data:image\/\w+;base64,[A-Za-z0-9+/=]+"/g, (lit) => {
    i++;
    const pack = PACK_DA_CENA[i];
    if (!pack) return lit;
    packs[pack][bloco === "CENARIO_ALTO_B64" ? "cenAlto" + i : "cenChao" + i] = lit.slice(1, -1);
    return '"' + PIXEL + '"';
  });
  html = html.slice(0, ini) + trecho + html.slice(fim);
}

// --- blocos por chave: contexto, quadrinho, travessia ---
// cap2=Palmares, cap3=Ainda Aqui, cap4=Salvador (numeração dos arquivos é anterior à
// reordenação das épocas); p07..p11-* são as páginas da travessia; p1..p6 ficam (início
// da linha do tempo), o resto das páginas d'A HISTÓRIA sai junto.
function packDaChave(k) {
  if (/^cap2-/.test(k)) return "pack-palmares";
  if (/^cap3-/.test(k)) return "pack-hoje";
  if (/^cap4-/.test(k)) return "pack-salvador";
  if (/^p(07|08|09|10|11)-/.test(k)) return "pack-travessia";
  if (/^p([1-9]|[12][0-9])$/.test(k) && !/^p[1-6]$/.test(k)) return "pack-historia";
  if (k === "mar") return "pack-travessia";
  return null;
}
html = html.replace(/"((?:cap\d|p\d|mar)[\w-]*)":\s*"(data:image\/\w+;base64,[A-Za-z0-9+/=]+)"/g,
  (tudo, chave, uri) => {
    const pack = packDaChave(chave);
    if (!pack) return tudo;
    packs[pack][chave] = uri;
    return '"' + chave + '": "' + PIXEL + '"';
  });

// --- a CSP: UMA diretiva, e nada além ---
const antes = "connect-src 'none'";
if (html.indexOf(antes) < 0) throw new Error("CSP esperada não encontrada");
html = html.replace(antes, "connect-src 'self'");

// --- escreve ---
fs.writeFileSync(path.join(SAIDA, "index.html"), html);
let totalPacks = 0;
for (const nome in packs) {
  const j = JSON.stringify(packs[nome]);
  fs.writeFileSync(path.join(SAIDA, nome + ".json"), j);
  totalPacks += j.length;
  console.log(nome + ".json: " + (j.length / 1024).toFixed(0) + " KB (" + Object.keys(packs[nome]).length + " imagens)");
}
const original = fs.statSync(path.join(RAIZ, "index.html")).size;
console.log("\nindex.html do protótipo: " + (html.length / 1048576).toFixed(2) + " MB (era "
  + (original / 1048576).toFixed(2) + " MB — saíram " + ((original - html.length) / 1048576).toFixed(2) + " MB para os packs)");
console.log("escrito em: " + SAIDA + "\n");

// --- a prova em jogo vivo ---
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, "/opt/pw-browsers/chromium"]) if (p && fs.existsSync(p)) return p;
  return undefined;
}
(async () => {
  const http = require("http");
  const servidor = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\//, "") || "index.html";
    const arq = path.normalize(path.join(SAIDA, rel));
    if (!arq.startsWith(SAIDA) || !fs.existsSync(arq)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "Content-Type": arq.endsWith(".html") ? "text/html" : "application/json" });
    res.end(fs.readFileSync(arq));
  });
  await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + servidor.address().port + "/index.html";

  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const erros = [];
  page.on("pageerror", (e) => erros.push("PAGEERROR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !ehRuidoDeRedeExterna(m)) erros.push("CONSOLE: " + m.text()); });
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(800);

  const prova = await page.evaluate(async () => {
    const antes = { alto2: CENARIO_ALTO[2].naturalWidth, chao2: CENARIO_CHAO[2].naturalWidth };
    const t0 = performance.now();
    const pack = await (await fetch("pack-palmares.json")).json();
    const tFetch = performance.now() - t0;
    const espera = [];
    for (const k in pack) {
      const i = k.match(/^cen(Alto|Chao)(\d)$/);
      if (!i) continue;
      const im = (i[1] === "Alto" ? CENARIO_ALTO : CENARIO_CHAO)[+i[2]];
      espera.push(new Promise((r) => { im.onload = r; }));
      im.src = pack[k];   // o onload original chamava redesenharFundo(); reatribuir src refaz o caminho
    }
    await Promise.all(espera);
    const tTudo = performance.now() - t0;
    return {
      antes, tFetch: tFetch.toFixed(0), tTudo: tTudo.toFixed(0),
      depois: { alto2: CENARIO_ALTO[2].naturalWidth, chao2: CENARIO_CHAO[2].naturalWidth },
      ctxChegou: Object.keys(pack).filter((k) => /^cap2-/.test(k)).length,
    };
  });
  await page.screenshot({ path: path.join(SAIDA, "prova-prototipo.png") });
  await browser.close();
  servidor.close();

  console.log("PROVA (rede local, sem estrangulo — o tempo em 3G sai do peso-abrir.js --fetch):");
  console.log("  cenário 2 antes do fetch: " + prova.antes.alto2 + "×? px (o pixel de espera)");
  console.log("  fetch do pack: " + prova.tFetch + " ms · pack aplicado e decodificado: " + prova.tTudo + " ms");
  console.log("  cenário 2 depois: alto " + prova.depois.alto2 + " px · chão " + prova.depois.chao2 + " px de largura");
  console.log("  contextos de fala no pack: " + prova.ctxChegou);
  console.log("  erros de console: " + (erros.length ? erros.join(" | ") : "nenhum"));
  if (erros.length || prova.depois.alto2 <= 1) { console.error("PROVA FALHOU"); process.exit(1); }
  console.log("\nagora meça a abertura do protótipo: node test/peso-abrir.js "
    + path.join(SAIDA, "index.html") + " --fetch pack-palmares.json,pack-travessia.json");
})();
