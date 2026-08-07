// Dimensoes em pixels de cada imagem embutida em src/jogo.ts (WebP e PNG).
const fs = require("fs");
const path = require("path");
const arq = path.join(__dirname, "..", "src", "jogo.ts");
const linhas = fs.readFileSync(arq, "utf8").split("\n");

function dimWebp(b) {
  if (b.toString("ascii", 0, 4) !== "RIFF") return null;
  // percorre os chunks ate achar VP8 / VP8L / VP8X
  let off = 12;
  while (off + 8 <= b.length) {
    const tag = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    const d = off + 8;
    if (tag === "VP8X") return { w: (b.readUIntLE(d + 4, 3) & 0xffffff) + 1, h: (b.readUIntLE(d + 7, 3) & 0xffffff) + 1, tipo: "X" };
    if (tag === "VP8L") {
      const bits = b.readUInt32LE(d + 1);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1, tipo: "L" };
    }
    if (tag === "VP8 ") {
      return { w: b.readUInt16LE(d + 6) & 0x3fff, h: b.readUInt16LE(d + 8) & 0x3fff, tipo: " " };
    }
    off = d + size + (size & 1);
  }
  return null;
}
function dimPng(b) {
  if (b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), tipo: "png" };
}

const re = /data:image\/(\w+);base64,([A-Za-z0-9+/=]+)/g;
let c = "(topo)", k = "";
const out = [];
for (let i = 0; i < linhas.length; i++) {
  const l = linhas[i];
  const mc = l.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/); if (mc) { c = mc[1]; k = ""; }
  const mk = l.match(/^\s{1,4}([A-Za-z_$][\w$]*)\s*:/); if (mk) k = mk[1];
  re.lastIndex = 0; let m;
  while ((m = re.exec(l))) {
    const buf = Buffer.from(m[2], "base64");
    const d = m[1] === "png" ? dimPng(buf) : dimWebp(buf);
    out.push({ nome: k ? c + "." + k : c, linha: i + 1, kb: m[2].length / 1024, d });
  }
}
// agrupa por (nome, dimensao)
const g = new Map();
for (const o of out) {
  const key = o.nome + " | " + (o.d ? o.d.w + "x" + o.d.h : "?");
  if (!g.has(key)) g.set(key, { n: 0, kb: 0 });
  const e = g.get(key); e.n++; e.kb += o.kb;
}
for (const [key, e] of [...g.entries()].sort((a, b) => b[1].kb - a[1].kb))
  console.log(e.kb.toFixed(1).padStart(8) + " KB  x" + String(e.n).padStart(3) + "  " + key);
