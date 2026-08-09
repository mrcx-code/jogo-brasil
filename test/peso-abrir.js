// peso-abrir.js — quanto tempo o jogo leva para ABRIR, medido de verdade, em três
// velocidades de rede. Feito para o ticket O PESO: é o número que decide entre "arquivo
// grande" e "carregar sob demanda", e ninguém nunca o tinha medido.
//
//   node test/peso-abrir.js [caminho/para/um.html] [--fetch arq1.json,arq2.json]
//
// O que faz: serve o DIRETÓRIO do arquivo por http com compressão brotli (como a Vercel
// serve a produção — medido lá: ~3,12 MB no fio para o index de 4,27 MB), estrangula a
// rede via CDP com os perfis do DevTools/Lighthouse, e mede:
//   fio      — bytes que atravessaram a rede (encodedBodySize)
//   download — navigationStart -> responseEnd (o documento terminou de chegar)
//   toque    — -> DOMContentLoaded (o script inline rodou; os handlers de pointer existem)
//   tela     — -> primeiro requestAnimationFrame depois do DCL (o menu foi desenhado)
//   1ª tinta — first-contentful-paint (o HTML progressivo pinta antes do script chegar)
// Com --fetch, depois de aberta a página ele busca cada arquivo listado (relativo ao
// diretório servido) DE DENTRO da página, na mesma rede estrangulada — é o custo de
// "entrar no capítulo" do caminho sob demanda.
const { chromium } = require("playwright");
const http = require("http");
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const iFetch = args.indexOf("--fetch");
const fetches = iFetch >= 0 ? args.splice(iFetch, 2)[1].split(",") : [];
const alvo = path.resolve(args[0] || path.join(__dirname, "..", "index.html"));
const DIR = path.dirname(alvo);
const NOME = path.basename(alvo);

// Perfis. Fast 3G = preset clássico do DevTools (1,6 Mbit/s ×0,9 = 180 KB/s, RTT 562,5 ms).
// Slow 4G = perfil do Lighthouse (1,6 Mbit/s cheios = 200 KB/s, RTT 150 ms) — é o que o
// Chrome atual chama de "Slow 4G" no seletor. Sem limite = a máquina local.
const PERFIS = [
  { nome: "Fast 3G ", download: 1.6 * 1024 * 1024 / 8 * 0.9, upload: 675 * 1024 / 8 * 0.9, latency: 562.5 },
  { nome: "Slow 4G ", download: 1.6 * 1024 * 1024 / 8, upload: 750 * 1024 / 8, latency: 150 },
  { nome: "sem limite", download: -1, upload: -1, latency: 0 },
];

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, "/opt/pw-browsers/chromium"]) if (p && fs.existsSync(p)) return p;
  return undefined;
}

(async () => {
  // servidor: brotli quality 5 — a Vercel serve a produção comprimida nessa ordem de
  // grandeza (medido: 3.118.042 B no fio). Pré-comprime e guarda em cache por mtime.
  const cache = new Map();
  function pronto(arq) {
    const st = fs.statSync(arq);
    const c = cache.get(arq);
    if (c && c.mtime === +st.mtime) return c;
    const cru = fs.readFileSync(arq);
    const br = zlib.brotliCompressSync(cru, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } });
    const gz = zlib.gzipSync(cru, { level: 6 });
    const novo = { mtime: +st.mtime, cru, br, gz };
    cache.set(arq, novo);
    return novo;
  }
  const servidor = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\//, "") || NOME;
    const arq = path.normalize(path.join(DIR, rel));
    if (!arq.startsWith(DIR) || !fs.existsSync(arq)) { res.writeHead(404).end("404"); return; }
    const { cru, br, gz } = pronto(arq);
    const aceita = String(req.headers["accept-encoding"] || "");
    const tipo = arq.endsWith(".html") ? "text/html; charset=utf-8"
      : arq.endsWith(".json") ? "application/json" : "application/octet-stream";
    const enc = /\bbr\b/.test(aceita) ? ["br", br] : /\bgzip\b/.test(aceita) ? ["gzip", gz] : [null, cru];
    const cab = { "Content-Type": tipo, "Cache-Control": "no-store" };
    if (enc[0]) cab["Content-Encoding"] = enc[0];
    res.writeHead(200, cab);
    res.end(enc[1]);
  });
  await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
  const porta = servidor.address().port;
  const url = "http://127.0.0.1:" + porta + "/" + NOME;

  const info = pronto(alvo);
  console.log("alvo: " + alvo);
  console.log("no disco " + (info.cru.length / 1048576).toFixed(2) + " MB · no fio (brotli q5) "
    + (info.br.length / 1048576).toFixed(2) + " MB · (gzip) " + (info.gz.length / 1048576).toFixed(2) + " MB\n");

  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const s = (ms) => ms == null ? "   —  " : (ms / 1000).toFixed(2).padStart(6) + " s";
  console.log("rede        |    fio    | download |  toque  |  tela   | 1ª tinta");
  for (const perfil of PERFIS) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () =>
        requestAnimationFrame(() => { window.__telaUtil = performance.now(); }));
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    if (perfil.download > 0) await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: perfil.latency,
      downloadThroughput: perfil.download, uploadThroughput: perfil.upload,
    });
    await page.goto(url, { waitUntil: "load", timeout: 300000 });
    await page.waitForFunction(() => window.__telaUtil !== undefined, null, { timeout: 60000 }).catch(() => {});
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const fcp = performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint");
      return {
        fio: nav.encodedBodySize, download: nav.responseEnd,
        toque: nav.domContentLoadedEventStart, tela: window.__telaUtil || null,
        tinta: fcp ? fcp.startTime : null,
      };
    });
    console.log(perfil.nome.padEnd(11) + " | " + (m.fio / 1048576).toFixed(2).padStart(6) + " MB |"
      + s(m.download) + "  |" + s(m.toque) + " |" + s(m.tela) + " |" + s(m.tinta));

    for (const f of fetches) {
      const r = await page.evaluate(async (nome) => {
        const t0 = performance.now();
        const resp = await fetch(nome);
        const blob = await resp.blob();
        const t1 = performance.now();
        return { ms: t1 - t0, bytes: blob.size, ok: resp.ok };
      }, f);
      console.log("   fetch " + f + ": " + (r.ms / 1000).toFixed(2) + " s · "
        + (r.bytes / 1024).toFixed(0) + " KB descomprimidos · ok=" + r.ok);
    }
    await ctx.close();
  }
  await browser.close();
  servidor.close();
})();
