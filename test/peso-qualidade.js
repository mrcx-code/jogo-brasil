// peso-qualidade.js — quanto o MAIOR bloco do peso (as pinturas de cenário, alto+chão)
// custaria a menos um degrau de qualidade abaixo do 0,72 atual. Feito para o ticket O PESO.
//
//   node test/peso-qualidade.js [qualidade]     (padrão 0.68)
//
// Método idêntico ao do requalificar.js: decodifica cada WebP no Chromium, redesenha em
// canvas no tamanho natural e reencoda. NÃO grava nada — é só o número. A régua do §6
// continua valendo: 0,65 foi medida e RECUSADA (a mata perde a mancha fina de folha), e
// qualquer aplicação de verdade exige medir o erro NA TELA (test/medir-na-tela.js), não
// aqui. Este instrumento responde "quantos KB", não "ficou bom".
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const Q = parseFloat(process.argv[2] || "0.68");
const fonte = fs.readFileSync(path.join(__dirname, "..", "src", "jogo.ts"), "utf8");

function bloco(nome) {
  const ini = fonte.indexOf("const " + nome + " = [");
  const fim = fonte.indexOf("];", ini);
  return (fonte.slice(ini, fim).match(/data:image\/\w+;base64,[A-Za-z0-9+/=]+/g)) || [];
}
const uris = [...bloco("CENARIO_ALTO_B64"), ...bloco("CENARIO_CHAO_B64")];

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, "/opt/pw-browsers/chromium"]) if (p && fs.existsSync(p)) return p;
  return undefined;
}
(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage();
  let antes = 0, depois = 0;
  for (const uri of uris) {
    const r = await page.evaluate(async ({ uri, q }) => {
      const im = new Image();
      await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = uri; });
      const cv = document.createElement("canvas");
      cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      cv.getContext("2d").drawImage(im, 0, 0);
      return { antes: uri.length, depois: cv.toDataURL("image/webp", q).length, w: im.naturalWidth, h: im.naturalHeight };
    }, { uri, q: Q });
    antes += r.antes; depois += r.depois;
    console.log(r.w + "×" + r.h + ": " + (r.antes / 1024).toFixed(0) + " KB -> " + (r.depois / 1024).toFixed(0) + " KB");
  }
  await browser.close();
  console.log("\ncenário (alto+chão) a q=" + Q + ": " + (antes / 1024).toFixed(0) + " KB -> "
    + (depois / 1024).toFixed(0) + " KB · poupa " + ((antes - depois) / 1024).toFixed(0) + " KB ("
    + (100 * (antes - depois) / antes).toFixed(1) + "%)");
  console.log("(base64; no fio com brotli a poupança é ~0,69× disso)");
})();
