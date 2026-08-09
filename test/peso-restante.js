// peso-restante.js — o que AINDA dá para cortar do index.html publicado sem perder um
// pixel nem uma linha de fonte. Feito para o ticket O PESO, item 5.
//
//   node test/peso-restante.js
//
// O `removeComments` do tsc tirou o comentário do JS. Sobra comentário em DOIS lugares que
// o tsc não alcança: o CSS (src/estilo.css) e o molde HTML (src/index.html). Este
// instrumento mede quanto isso pesa CRU e NO FIO (brotli q5 e gzip 6), porque comentário é
// texto repetitivo e comprime muito bem — o número que interessa a quem baixa não é o mesmo
// que o número no disco.
//
// AS DUAS VARREDURAS NÃO SÃO REGEX INGÊNUA, e o motivo é concreto:
//   - `/* */` aparece dentro de string e de url() no CSS; um `.replace(/\/\*[\s\S]*?\*\//g)`
//     cego come conteúdo entre duas ocorrências não relacionadas.
//   - `<!--` aparece DENTRO do <script> (é sequência legal em JS e pode cair no meio de um
//     base64 de 400 KB). Apagar comentário de HTML sem respeitar as fronteiras de <script> e
//     <style> é a receita para um arquivo que não abre. A varredura abaixo pula os dois
//     blocos inteiros e só olha o HTML de verdade.
// Nada é escrito: o instrumento responde "quantos KB", e a aplicação — se o dono quiser —
// é uma etapa do ferramentas/construir.js, não deste arquivo.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { execFileSync } = require("child_process");

const RAIZ = path.join(__dirname, "..");
const saida = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");

const br = (s) => zlib.brotliCompressSync(Buffer.from(s), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }).length;
const gz = (s) => zlib.gzipSync(Buffer.from(s), { level: 6 }).length;
const KB = (n) => (n / 1024).toFixed(1).padStart(7) + " KB";

// ---------- 1. fronteiras: onde está o CSS, onde está o JS, onde está o HTML ----------
function bloco(tag) {
  const abre = saida.indexOf("<" + tag);
  const ini = saida.indexOf(">", abre) + 1;
  const fim = saida.indexOf("</" + tag + ">", ini);
  if (abre < 0 || fim < 0) throw new Error("não achei o bloco " + tag);
  return { abre, ini, fim };
}
const bStyle = bloco("style");
const bScript = bloco("script");
const css = saida.slice(bStyle.ini, bStyle.fim);
const js = saida.slice(bScript.ini, bScript.fim);

// ---------- 2. comentário de CSS, ciente de string e de url() ----------
function comentariosCss(src) {
  let com = 0, i = 0, n = src.length, estado = "cod";
  const faixas = [];
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (estado === "cod") {
      if (c === "/" && d === "*") {
        const fim = src.indexOf("*/", i + 2);
        const ate = fim < 0 ? n : fim + 2;
        faixas.push([i, ate]); com += ate - i; i = ate; continue;
      }
      if (c === "'") estado = "str'";
      else if (c === '"') estado = 'str"';
      i++; continue;
    }
    if (c === "\\") { i += 2; continue; }
    if ((estado === "str'" && c === "'") || (estado === 'str"' && c === '"') || c === "\n") estado = "cod";
    i++;
  }
  return { com, faixas };
}

// ---------- 3. comentário de HTML, PULANDO <script> e <style> ----------
function comentariosHtml(src, pulos) {
  let com = 0, i = 0;
  const faixas = [];
  const n = src.length;
  while (i < n) {
    const pulo = pulos.find((p) => i === p[0]);
    if (pulo) { i = pulo[1]; continue; }
    if (src.startsWith("<!--", i)) {
      const fim = src.indexOf("-->", i);
      const ate = fim < 0 ? n : fim + 3;
      // só conta se o comentário inteiro couber FORA dos blocos pulados
      if (!pulos.some((p) => i < p[1] && ate > p[0])) { faixas.push([i, ate]); com += ate - i; }
      i = ate; continue;
    }
    i++;
  }
  return { com, faixas };
}

const cCss = comentariosCss(css);
const cHtml = comentariosHtml(saida, [[bStyle.ini, bStyle.fim], [bScript.ini, bScript.fim]]);

// ---------- 4. sobras de formatação do JS compilado (indentação e linha em branco) ----------
// O tsc reemite com a indentação da fonte. Contar quanto é espaço de início de linha e
// linha vazia dá a ordem de grandeza do que um minificador conservador tiraria — e mostra
// por que NÃO vale: no fio, brotli já modela isso quase de graça.
let recuo = 0, vazias = 0;
for (const L of js.split("\n")) {
  const m = L.match(/^[ \t]+/);
  if (m) recuo += m[0].length;
  if (!L.trim()) vazias += 1;
}

// ---------- 5. aplica de mentira e mede o resultado ----------
function retirar(src, faixas) {
  if (!faixas.length) return src;
  const ord = faixas.slice().sort((a, b) => a[0] - b[0]);
  let saida = "", ultimo = 0;
  for (const [a, b] of ord) { saida += src.slice(ultimo, a); ultimo = b; }
  return saida + src.slice(ultimo);
}
const semCss = saida.slice(0, bStyle.ini) + retirar(css, cCss.faixas) + saida.slice(bStyle.fim);
const semTudo = retirar(semCss, []); // css já aplicado
const semHtml = retirar(saida, cHtml.faixas);
// os dois juntos: as faixas de HTML estão em coordenadas do arquivo inteiro; aplica primeiro
// as de HTML (à direita e à esquerda do <style>) e depois as de CSS deslocadas.
const faixasCss = cCss.faixas.map(([a, b]) => [a + bStyle.ini, b + bStyle.ini]);
const ambos = retirar(saida, [...cHtml.faixas, ...faixasCss]);

console.log("index.html publicado: " + KB(saida.length) + " cru · " + KB(br(saida)) + " brotli q5 · " + KB(gz(saida)) + " gzip 6\n");
console.log("candidato                          |   cru   |  brotli  |   gzip");
function linha(nome, novo) {
  console.log(nome.padEnd(34) + " | " + KB(saida.length - novo.length).trim().padStart(7)
    + " | " + KB(br(saida) - br(novo)).trim().padStart(8)
    + " | " + KB(gz(saida) - gz(novo)).trim().padStart(8));
}
linha("comentário do CSS (" + cCss.faixas.length + " blocos)", semCss);
linha("comentário do molde HTML (" + cHtml.faixas.length + ")", semHtml);
linha("os dois juntos", ambos);
console.log("\nformatação do JS compilado (NÃO aplicada, só a ordem de grandeza):");
console.log("  recuo de linha: " + KB(recuo) + " · linhas em branco: " + vazias);

// ---------- 6. o que os 318 KB do removeComments valeram NO FIO ----------
try {
  const antes = execFileSync("git", ["show", "c6b6252~1:index.html"], { cwd: RAIZ, maxBuffer: 1 << 28 });
  console.log("\nreferência — o corte de comentário do JS (commit c6b6252):");
  console.log("  antes: " + KB(antes.length) + " cru · " + KB(zlib.brotliCompressSync(antes, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }).length) + " brotli");
  console.log("  hoje : " + KB(saida.length) + " cru · " + KB(br(saida)) + " brotli");
} catch (e) {
  console.log("\n(não consegui ler o index.html anterior no git: " + e.message.split("\n")[0] + ")");
}
