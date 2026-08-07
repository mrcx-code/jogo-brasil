// Mede o peso de cada bloco de arte embutido em src/jogo.ts.
// Atribui cada data:URI ao ultimo `const NOME` de coluna 0 e a ultima chave de objeto.
const fs = require("fs");
const path = require("path");

const arq = path.join(__dirname, "..", "src", "jogo.ts");
const linhas = fs.readFileSync(arq, "utf8").split("\n");

const re = /data:image\/(\w+);base64,([A-Za-z0-9+/=]+)/g;
const porConst = new Map();
const porChave = new Map();
const itens = [];

let atualConst = "(topo)";
let atualChave = "";
for (let i = 0; i < linhas.length; i++) {
  const L = linhas[i];
  const mc = L.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/);
  if (mc) { atualConst = mc[1]; atualChave = ""; }
  const mk = L.match(/^\s{1,4}([A-Za-z_$][\w$]*)\s*:/);
  if (mk) atualChave = mk[1];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(L))) {
    const bytes = Math.floor(m[2].length * 3 / 4);
    const b64 = m[2].length;
    const nome = atualChave ? atualConst + "." + atualChave : atualConst;
    porConst.set(atualConst, (porConst.get(atualConst) || 0) + b64);
    porChave.set(nome, (porChave.get(nome) || 0) + b64);
    itens.push({ linha: i + 1, nome, fmt: m[1], bytes, b64 });
  }
}

const kb = (n) => (n / 1024).toFixed(1);
const totalB64 = itens.reduce((a, x) => a + x.b64, 0);
const tamArq = fs.statSync(arq).size;
const raiz = path.join(__dirname, "..", "index.html");
const tamSaida = fs.existsSync(raiz) ? fs.statSync(raiz).size : 0;

console.log("imagens embutidas: " + itens.length);
console.log("bytes de base64 (= o que pesa no index.html): " + kb(totalB64) + " KB");
console.log("src/jogo.ts: " + kb(tamArq) + " KB · index.html: " + kb(tamSaida) + " KB");
console.log("codigo (jogo.ts - base64): " + kb(tamArq - totalB64) + " KB\n");

const ord = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);
console.log("--- por CONST ---");
for (const [n, v] of ord(porConst))
  console.log(String(kb(v)).padStart(9) + " KB  " + (100 * v / totalB64).toFixed(1).padStart(5) + "%  " + n);

console.log("\n--- por bloco (const.chave) ---");
for (const [n, v] of ord(porChave))
  console.log(String(kb(v)).padStart(9) + " KB  " + n);

if (process.argv.includes("--itens")) {
  console.log("\n--- por imagem ---");
  for (const it of itens.slice().sort((a, b) => b.b64 - a.b64))
    console.log(String(kb(it.b64)).padStart(8) + " KB  L" + String(it.linha).padStart(5) + "  " + it.nome);
}
