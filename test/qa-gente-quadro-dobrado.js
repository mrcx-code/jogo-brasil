// QA 04/09 — O QUADRO QUE TEM **DUAS** PESSOAS DENTRO.
//
// POR QUE ELE EXISTE. O portao irmao (`qa-gente-quadro-que-chega.js`) cobra que todo quadro de
// `GENTE_EP_B64` tenha TINTA, com a regua do jogo (`esperando()`, `naturalWidth <= 1`). Ele
// resolve o buraco de 1x1 — e nao ve o defeito OPOSTO, que e o corte ter engolido a celula
// vizinha: `pindorama f2q6` guarda 295x253 com a MESMA senhora do pote desenhada DUAS VEZES
// lado a lado, contra 131 px de mediana da fileira. Esse quadro tem tinta, decodifica, passa
// por `esperando()` e e desenhado como pessoa — mas o motor centra pela LARGURA DO QUADRO
// (`dx = cxm - dw/2`, jogo.ts ~6391) e normaliza pela ALTURA (`GENTE4_ALVO / naturalHeight`),
// entao o passo aparece como duas figuras onde deveria haver uma.
//
// SEIS quadros ja estavam assim na arte versionada de 04/09, e o remendo de
// `test/tapar-buraco-gente.js` copiou UM deles (pindorama f2q6 -> f2q7) para tapar o buraco de
// 1x1 do capitulo dos povos originarios: o passo que virava barril passou a virar a senhora em
// dobro, e o defeito passou de 1 para 2 dos 8 passos daquela fileira. Trocar um defeito por
// outro pode ser a escolha certa (§2: objeto no lugar de pessoa e pior), mas nao pode ser
// SILENCIOSA — e este instrumento e o que tira o silencio.
//
// A REGUA: quadro cuja largura passa de LIMITE x a MEDIANA da propria fileira. Mediana, e nao
// media, porque a fileira tem 8 quadros e um outlier arrasta a media. Ele NAO reprova pelo que
// ja estava (a lista `CONHECIDOS` e o estado medido em 04/09) — reprova pelo que APARECER
// depois, e reprova tambem quando um conhecido some sem tirar a linha daqui.
//
// USO:  node test/qa-gente-quadro-dobrado.js
//       GENTE_LIMITE=1.3 node test/qa-gente-quadro-dobrado.js   (aperta a regua)
const fs = require('fs');
const path = require('path');

const LIMITE = +(process.env.GENTE_LIMITE || 1.6);

// Estado medido em 04/09, revisado apos a auditoria adversarial achar que o remendo de
// PINDORAMA usava uma fonte ja double-wide e foi REVERTIDO (ver PENDENTES 109). Cada linha
// e um quadro largo que JA existia na arte entregue — nenhum e remendo.
const CONHECIDOS = [
  'praca f0q3', 'praca f2q3', 'praca f2q6',       // folha de A PRACA, entregue assim
  'segurou f2q5', 'temfonte f2q5',                 // idem, um por folha
  'pindorama f2q6',                                // a senhora do pote em dobro (nao remendada)
];

const txt = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'jogo.ts'), 'utf8');
const ini = txt.indexOf('const GENTE_EP_B64');
if (ini < 0) { console.error('nao achei GENTE_EP_B64 em src/jogo.ts'); process.exit(1); }
let bloco = txt.slice(txt.indexOf('{', ini), txt.indexOf('/*GENTE_EP_B64_END*/'));
bloco = bloco.slice(0, bloco.indexOf('\n};') + 2);
const folhas = eval('(' + bloco + ')');

// Largura do WebP sem navegador: o cabecalho basta, e assim o instrumento roda em 30 ms.
function largura(uri) {
  const b = Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64');
  if (b.length < 30 || b.toString('ascii', 8, 12) !== 'WEBP') return 0;
  const tag = b.toString('ascii', 12, 16);
  if (tag === 'VP8X') return 1 + b.readUIntLE(24, 3);
  if (tag === 'VP8 ') return b.readUInt16LE(26) & 0x3fff;
  if (tag === 'VP8L') return (b.readUInt32LE(21) & 0x3fff) + 1;
  return 0;
}

let falhas = 0;
function ok(c, m) { console.log((c ? '  ok    ' : '  FALHA ') + m); if (!c) falhas++; }

const largos = [];
let total = 0;
for (const cap of Object.keys(folhas)) {
  folhas[cap].forEach((fila, f) => {
    const ws = fila.map(largura).filter(w => w > 1);
    total += fila.length;
    if (!ws.length) return;
    const ord = ws.slice().sort((a, b) => a - b);
    const med = ord[Math.floor(ord.length / 2)];
    fila.forEach((q, i) => {
      const w = largura(q);
      if (w > 1 && w > med * LIMITE) largos.push({ nome: cap + ' f' + f + 'q' + i, w, med });
    });
  });
}

console.log('   ' + Object.keys(folhas).length + ' folhas · ' + total + ' quadros · regua: largura > ' + LIMITE + 'x a mediana da fileira');
largos.forEach(l => console.log('   LARGO  ' + l.nome.padEnd(18) + l.w + 'px contra mediana ' + l.med + 'px  (' + (l.w / l.med).toFixed(2) + 'x)'));
console.log('');

const novos = largos.map(l => l.nome).filter(n => CONHECIDOS.indexOf(n) < 0);
ok(novos.length === 0, 'nenhum quadro largo fora da lista conhecida' +
  (novos.length ? ' — ACHADOS ' + novos.join(', ') + '. Quadro muito mais largo que os irmaos da fileira guarda a celula vizinha junto: o motor centra pela largura do QUADRO, entao o passo desenha duas figuras.' : ''));

const velhos = CONHECIDOS.filter(n => largos.every(l => l.nome !== n));
ok(velhos.length === 0, 'todo quadro largo declarado ainda esta largo' +
  (velhos.length ? ' — ' + velhos.join(', ') + ' nao e(sao) mais. Se a arte de verdade chegou, tire a linha de CONHECIDOS.' : ''));

console.log(falhas ? '\nREPROVOU (' + falhas + ')' : '\nPASSOU');
process.exit(falhas ? 1 : 0);
