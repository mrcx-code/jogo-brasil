// TAPA UM BURACO NUMA FOLHA DE GENTE — com a pose VIZINHA, nunca com arte inventada.
//
// POR QUE ISTO EXISTE (04/09). Seis dos 312 quadros de `GENTE_EP_B64` nasceram **1x1**: a folha
// entregue nao trouxe aquela figura, e o corte (`test/cortar-gente.js`) recortou o nada. Nao e
// defeito da esteira — os `test/gente-*.json`, que sao o corte cru, ja tem o buraco. Enquanto o
// quadro for 1x1, `esperando(im)` e verdadeiro e `mobFrame()` **troca a pessoa por barril/saco**
// naquele passo. Em PINDORAMA isso acontecia no capitulo dos povos originarios (§2.1), e e por
// isso que o remendo entra antes de haver arte nova.
//
// O QUE ELE FAZ, e o limite: copia a pose VIZINHA da MESMA fileira para o quadro vazio. Fileira
// e uma pessoa em oito poses de caminhada (conferido a olho nas tiras de contato das tres
// folhas), entao repetir uma pose NAO apaga ninguem — segura a mesma pessoa por dois tempos.
//
// POR QUE COPIAR E NAO REMOVER O QUADRO DA FILEIRA. `GENTE4_PASSO` foi derivado de "vao maximo
// dos pes 141 px de sprite -> laco completo ~282 px em OITO quadros". Com oito quadros o laco
// cobre 8 x 5,589 = 44,71 px de mundo contra 45,04 px de passada desenhada: 0,7% de erro. Com
// sete, cobre 39,12 contra os mesmos 45,04 — **13,1% de deslize**, que e exatamente a armadilha
// nº 1 do §7 (o pe deslizando porque o quadro nao casa com a distancia) entrando por uma porta
// nova. Alem disso `test/embutir-gente.js` recusa folha que nao tenha 24 quadros, e o pacote
// viaja com a mesma forma: uma fileira de sete quebraria a esteira inteira.
//
// USO:  node test/tapar-buraco-gente.js <capitulo> <fileira> <quadro> [fileira:quadroDaFonte]
//       node test/tapar-buraco-gente.js pindorama 2 7          (copia a pose anterior, ciclica)
//
// Ele e conservador: recusa se o alvo NAO estiver vazio (tapar buraco que nao existe seria
// apagar arte), recusa se a fonte estiver vazia, e recusa se a folha nao tiver 24 quadros.
const fs = require('fs');
const path = require('path');

const [cap, fArg, qArg, fonteArg] = process.argv.slice(2);
if (!cap || fArg === undefined || qArg === undefined) {
  console.error('uso: node test/tapar-buraco-gente.js <capitulo> <fileira 0-2> <quadro 0-7> [fileira:quadro da fonte]');
  process.exit(1);
}
const fi = +fArg, qi = +qArg;

const alvo = path.resolve(__dirname, '..', 'src', 'jogo.ts');
const s = fs.readFileSync(alvo, 'utf8');
const iIni = s.indexOf('/*GENTE_EP_B64_START');
const iFim = s.indexOf('/*GENTE_EP_B64_END');
if (iIni < 0 || iFim < 0) { console.error('as marcas GENTE_EP_B64_START/END nao estao no lugar'); process.exit(1); }

// Recorta o trecho do capitulo dentro do bloco.
const bloco = s.slice(iIni, iFim);
const re = /^  ([A-Za-z0-9_]+): \[$/gm;
let m, caps = [];
while ((m = re.exec(bloco))) caps.push({ nome: m[1], i: m.index });
const ci = caps.findIndex(c => c.nome === cap);
if (ci < 0) { console.error('nao ha folha de gente para "' + cap + '" — ha: ' + caps.map(c => c.nome).join(', ')); process.exit(1); }
const de = caps[ci].i, ate = ci + 1 < caps.length ? caps[ci + 1].i : bloco.length;

// Posicao exata de cada data-URI dentro do trecho.
const achados = [];
const reU = /"data:[^"]*"/g;
let u;
const trecho = bloco.slice(de, ate);
while ((u = reU.exec(trecho))) achados.push({ txt: u[0], ini: de + u.index, fim: de + u.index + u[0].length });
if (achados.length !== 24) { console.error(cap + ': ' + achados.length + ' quadros, esperava 24'); process.exit(1); }

function vazio(txt) {
  const b64 = txt.slice(1, -1).split(',')[1] || '';
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 16) return true;
  if (buf.slice(0, 4).toString('ascii') === 'RIFF') {
    let off = 12;
    while (off + 8 <= buf.length) {
      const id = buf.slice(off, off + 4).toString('ascii');
      const size = buf.readUInt32LE(off + 4);
      const d = buf.slice(off + 8, off + 8 + size);
      if (id === 'VP8X') return d.readUIntLE(4, 3) + 1 <= 1 || d.readUIntLE(7, 3) + 1 <= 1;
      if (id === 'VP8 ') return (d.readUInt16LE(6) & 0x3fff) <= 1 || (d.readUInt16LE(8) & 0x3fff) <= 1;
      if (id === 'VP8L') { const bits = d.readUInt32LE(1); return (bits & 0x3fff) + 1 <= 1 || ((bits >> 14) & 0x3fff) + 1 <= 1; }
      off += 8 + size + (size % 2);
    }
  }
  return false;   // GIF/PNG de verdade nao aparecem aqui; qualquer outra coisa nao e "vazio"
}

const iAlvo = fi * 8 + qi;
if (!(iAlvo >= 0 && iAlvo < 24)) { console.error('fileira/quadro fora da folha'); process.exit(1); }
if (!vazio(achados[iAlvo].txt)) {
  console.error(cap + ' f' + fi + 'q' + qi + ' NAO esta vazio (' + achados[iAlvo].txt.length + ' caracteres). Tapar buraco que nao existe seria apagar arte — recusado.');
  process.exit(1);
}

// A fonte: a pose ANTERIOR da mesma fileira, ciclica, pulando as que tambem estao vazias.
let fonte;
if (fonteArg) {
  const [ff, fq] = fonteArg.split(':').map(Number);
  fonte = ff * 8 + fq;
} else {
  for (let k = 1; k < 8; k++) {
    const cand = fi * 8 + ((qi - k + 8) % 8);
    if (!vazio(achados[cand].txt)) { fonte = cand; break; }
  }
}
if (fonte === undefined || vazio(achados[fonte].txt)) { console.error('nao ha pose com tinta nesta fileira para copiar'); process.exit(1); }
if (Math.floor(fonte / 8) !== fi) { console.error('a fonte tem de ser da MESMA fileira (fileira = uma pessoa)'); process.exit(1); }

const novo = s.slice(0, iIni + achados[iAlvo].ini) + achados[fonte].txt + s.slice(iIni + achados[iAlvo].fim);
fs.writeFileSync(alvo, novo);
console.log(cap + ' f' + fi + 'q' + qi + ' <- f' + Math.floor(fonte / 8) + 'q' + (fonte % 8) +
  '  (' + achados[iAlvo].txt.length + ' -> ' + achados[fonte].txt.length + ' caracteres)');
