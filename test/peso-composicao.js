// peso-composicao.js — a composição do peso do index.html, byte a byte, POR CATEGORIA e
// POR CAPÍTULO. Feito para o ticket O PESO: o `medir-peso.js` responde "qual const pesa";
// este responde "quem é o dono de cada byte" — pintura, sprite, retrato, contexto,
// quadrinho, código, comentário — e quanto cada capítulo custa NA MARGEM.
//
//   node test/peso-composicao.js
//
// Lê a FONTE (src/jogo.ts) para atribuição (só ela tem os nomes) e reconcilia com a SAÍDA
// (index.html da raiz), que é o que pesa de verdade: a saída paga arte repetida uma vez só
// (__ART do construir.js) e soma molde + CSS.
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const fonte = fs.readFileSync(path.join(RAIZ, "src", "jogo.ts"), "utf8");
const saida = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
const css = fs.readFileSync(path.join(RAIZ, "src", "estilo.css"), "utf8");
const molde = fs.readFileSync(path.join(RAIZ, "src", "index.html"), "utf8");

// ---------- 1. cada data:URI da FONTE, atribuído a const + chave + posição ----------
const linhas = fonte.split("\n");
const re = /data:image\/(\w+);base64,([A-Za-z0-9+/=]+)/g;
const itens = [];
let atualConst = "(topo)", atualChave = "", posNoArray = -1;
for (let i = 0; i < linhas.length; i++) {
  const L = linhas[i];
  const mc = L.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/);
  if (mc) { atualConst = mc[1]; atualChave = ""; posNoArray = -1; }
  const mk = L.match(/^\s{1,4}"?([A-Za-z_$][\w$-]*)"?\s*:/);
  if (mk && mk[1] !== "data") atualChave = mk[1]; // "data" = a própria URI numa lista indentada
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(L))) {
    posNoArray++;
    itens.push({ constN: atualConst, chave: atualChave, pos: posNoArray, b64: m[2].length, lit: m[0] });
  }
}

// ---------- 2. o desconto da saída: arte repetida paga uma vez (igual ao construir.js) ----------
const conta = new Map();
for (const it of itens) conta.set(it.lit, (conta.get(it.lit) || 0) + 1);
let dedup = 0;
for (const [lit, n] of conta) if (n > 1) dedup += lit.length * (n - 1);
// aplica o desconto no PRÓPRIO item repetido: só a 1ª ocorrência paga
const vistos = new Set();
for (const it of itens) {
  it.paga = vistos.has(it.lit) ? 0 : it.b64;
  vistos.add(it.lit);
}

// ---------- 3. categoria e capítulo ----------
// CENARIO_*: lista em ordem de CENA; EPOCAS diz `arte:[0,1] [2,3] [4] [5,6]`.
const CAP_DA_CENA = ["1 PINDORAMA", "1 PINDORAMA", "2 PALMARES", "2 PALMARES", "3 SALVADOR", "4 AINDA AQUI", "4 AINDA AQUI"];
// CTX: prefixo do arquivo entregue. cap3-* é a terra demarcada (AINDA AQUI); cap4-* é o
// pátio e o porto (SALVADOR) — a numeração dos arquivos é anterior à reordenação das épocas.
const CAP_DO_CTX = { cap1: "1 PINDORAMA", cap2: "2 PALMARES", cap3: "4 AINDA AQUI", cap4: "3 SALVADOR" };
// HERO/MOB/DROP/FRENTE/RETRATO: um bloco por ÉPOCA de arte (capArte): 0→cap1, 1→cap2, 2→cap4.
const CAP_DA_EPOCA_ARTE = ["1 PINDORAMA", "2 PALMARES", "4 AINDA AQUI"];

function classificar(it) {
  const c = it.constN, k = it.chave;
  if (c === "CENARIO_ALTO_B64" || c === "CENARIO_CHAO_B64")
    return { cat: "pintura de cenário (alto+chão)", cap: CAP_DA_CENA[it.pos] || "?" };
  if (c === "QUAD_B64")
    return /^p(07|08|09|1[01])-/.test(k)
      ? { cat: "quadrinho — páginas da travessia", cap: "TRAVESSIA" }
      : { cat: "quadrinho — páginas A HISTÓRIA", cap: "(linha do tempo, global)" };
  if (c === "CTX_B64") {
    const m = k.match(/^cap(\d)/);
    return { cat: "contexto de fala (paisagem)", cap: (m && CAP_DO_CTX["cap" + m[1]]) || "?" };
  }
  if (c === "TRAV_B64") return { cat: "pintura da travessia", cap: "TRAVESSIA" };
  if (c === "RETRATO_B64") return { cat: "retratos", cap: CAP_DA_EPOCA_ARTE[it.pos] || "(outro)" };
  if (c === "HERO_B64") {
    const ep = /_3$|^sp3$/.test(k) ? 2 : /_2$|^sp2$/.test(k) ? 1 : /^walk/.test(k) ? -1 : 0;
    return { cat: "sprites — personagem", cap: ep < 0 ? "(todas as eras)" : CAP_DA_EPOCA_ARTE[ep] };
  }
  if (c === "MOB_B64" || c === "DROP_B64" || c === "FRENTE_B64")
    return { cat: "sprites — objetos e vegetação", cap: CAP_DA_EPOCA_ARTE[it.pos % 3] || "(?)" };
  if (c === "NPC_B64") return { cat: "sprites — NPCs", cap: "(todas as eras)" };
  if (c === "DECOR_B64") return { cat: "sprites — decoração", cap: "(todas as eras)" };
  if (c === "ICONE_B64") return { cat: "ícones de HUD", cap: "(todas as eras)" };
  return { cat: "outros (" + c + ")", cap: "?" };
}
// posição DENTRO do const (MOB_B64.smog é uma lista de 3, uma por época de arte)
{
  const porGrupo = new Map();
  for (const it of itens) {
    const g = it.constN + "." + it.chave;
    const n = porGrupo.get(g) || 0;
    it.pos = n; porGrupo.set(g, n + 1);
  }
  // CENARIO e RETRATO são arrays sem chave: pos por const
  const porConst = new Map();
  for (const it of itens) {
    if (it.chave) continue;
    const n = porConst.get(it.constN) || 0;
    it.pos = n; porConst.set(it.constN, n + 1);
  }
}

const porCat = new Map(), porCap = new Map();
for (const it of itens) {
  const { cat, cap } = classificar(it);
  porCat.set(cat, (porCat.get(cat) || 0) + it.paga);
  porCap.set(cap, (porCap.get(cap) || 0) + it.paga);
}

// ---------- 4. código × comentário (varredura ciente de string, nada de regex cego:
// base64 contém `//` de verdade) ----------
function medirComentarios(src) {
  let cod = 0, com = 0, i = 0;
  const n = src.length;
  let estado = "cod"; // cod | str' | str" | tpl | com1 | comN
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (estado === "cod") {
      if (c === "/" && d === "/") { estado = "com1"; com += 2; i += 2; continue; }
      if (c === "/" && d === "*") { estado = "comN"; com += 2; i += 2; continue; }
      if (c === "'") estado = "str'";
      else if (c === '"') estado = 'str"';
      else if (c === "`") estado = "tpl";
      cod++; i++; continue;
    }
    if (estado === "com1") { com++; if (c === "\n") estado = "cod"; i++; continue; }
    if (estado === "comN") {
      if (c === "*" && d === "/") { com += 2; estado = "cod"; i += 2; continue; }
      com++; i++; continue;
    }
    // dentro de string
    if (c === "\\") { cod += 2; i += 2; continue; }
    if ((estado === "str'" && c === "'") || (estado === 'str"' && c === '"') || (estado === "tpl" && c === "`") ||
        (estado !== "tpl" && c === "\n")) estado = "cod";
    cod++; i++;
  }
  return { cod, com };
}
const totalB64Fonte = itens.reduce((a, x) => a + x.b64, 0);
const totalB64Pago = itens.reduce((a, x) => a + x.paga, 0);
const overheadUri = itens.length * "data:image/webp;base64,".length; // aproximação do prefixo
const jsSemArte = fonte.length - totalB64Fonte;
const cc = medirComentarios(fonte);
// comentários fora das strings de arte: mede sobre a fonte com a arte removida
const fonteSemArte = fonte.replace(/data:image\/\w+;base64,[A-Za-z0-9+/=]+/g, "");
const ccLimpo = medirComentarios(fonteSemArte);
const comHtml = (molde.match(/<!--[\s\S]*?-->/g) || []).join("").length;
const ccCss = medirComentarios(css);

// ---------- 5. imprime ----------
const KB = (n) => (n / 1024).toFixed(0).padStart(6) + " KB";
const pct = (n, t) => (100 * n / t).toFixed(1).padStart(5) + "%";
const T = saida.length;
console.log("SAÍDA index.html: " + saida.length + " bytes (" + (T / 1048576).toFixed(2) + " MB)");
console.log("arte na fonte " + KB(totalB64Fonte) + " -> paga na saída " + KB(totalB64Pago) + "  (dedup __ART poupa " + (dedup / 1024).toFixed(0) + " KB)\n");

console.log("--- POR CATEGORIA (bytes pagos na saída) ---");
const linhasCat = [...porCat.entries()].sort((a, b) => b[1] - a[1]);
for (const [n, v] of linhasCat) console.log(KB(v) + "  " + pct(v, T) + "  " + n);
const codigoJs = ccLimpo.cod;
const comentarios = ccLimpo.com + comHtml + ccCss.com;
console.log(KB(codigoJs) + "  " + pct(codigoJs, T) + "  código JS (sem comentário, sem arte)");
console.log(KB(comentarios) + "  " + pct(comentarios, T) + "  comentários (JS + molde + CSS)");
console.log(KB(css.length - ccCss.com) + "  " + pct(css.length - ccCss.com, T) + "  CSS (sem comentário)");
console.log(KB(molde.length - comHtml) + "  " + pct(molde.length - comHtml, T) + "  HTML do molde (sem comentário)");

console.log("\n--- POR CAPÍTULO (só a arte atribuível, bytes pagos) ---");
for (const [n, v] of [...porCap.entries()].sort((a, b) => b[1] - a[1]))
  console.log(KB(v) + "  " + n);

// soma de conferência: tudo acima deve chegar perto do tamanho real da saída
const soma = linhasCat.reduce((a, x) => a + x[1], 0) + codigoJs + comentarios
  + (css.length - ccCss.com) + (molde.length - comHtml);
console.log("\nconferência: categorias somam " + KB(soma) + " · saída real " + KB(T)
  + " · diferença " + ((T - soma) / 1024).toFixed(0) + " KB (prefixos data:, __ART, EOL)");
