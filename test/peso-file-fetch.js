// peso-file-fetch.js — prova medida do CUSTO ESCONDIDO nº 1 do caminho "vários arquivos":
// o smoke test abre o jogo por `file://` (test/smoke.js, função que monta o alvo), e sob
// `file://` o Chromium recusa `fetch()` de arquivo vizinho. Ou seja: no dia em que a arte
// sair para packs, o smoke test para de conseguir testar o caminho novo sem passar a servir
// por http. Este instrumento MEDE isso em vez de afirmar.
//
//   node test/peso-file-fetch.js [dirDoPrototipo]
const { chromium } = require("playwright");
const path = require("path");
const os = require("os");

const DIR = process.argv[2] || path.join(os.tmpdir(), "claude", "peso-prototipo");
const alvo = "file:///" + path.join(DIR, "index.html").replace(/\\/g, "/");

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(alvo);
  const r = await p.evaluate(async () => {
    try { const x = await fetch("pack-palmares.json"); return "ok " + x.status; }
    catch (e) { return "ERRO: " + e.message; }
  });
  console.log("alvo: " + alvo);
  console.log("fetch de pack vizinho sob file:// -> " + r);
  await b.close();
})();
