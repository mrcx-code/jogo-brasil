// QA 05/09 — DECODIFICADOR DE LARGURA INDEPENDENTE, escrito para DUVIDAR do numero do dev.
//
// POR QUE ELE EXISTE. A entrega de 04/09 (`worktree-agent-a344774d043e46b43`) afirma que a
// fileira 2 de `GENTE_EP_B64.praca` mede 148, 148, 151, **323**, 147, 151, **322**, 1 px, e que
// as duas celulas largas empacotam DUAS poses coladas — e e essa afirmacao que sustenta a
// decisao §2-sensivel de deixar `f2q7` VAZIO (pessoa vira barril num passo de oito).
// Aceitar o numero de quem entregou seria confirmar, nao refutar. Este arquivo le os bytes do
// WebP na mao, sem navegador e sem biblioteca, e recalcula tudo: as 24 larguras, a MEDIANA da
// fileira, e a razao largura/mediana de cada celula.
//
// A REGUA QUE ELE APLICA, e ela e a pergunta que o QA recebeu: "dobrada" tem de significar
// razao ~2,00 contra a mediana das poses simples da MESMA fileira. Se a razao for 1,3 ou 1,5,
// a celula e "um pouco mais larga" e a palavra "dobrada" nao esta provada.
//
// USO:  node test/qa-praca-larguras-independente.js [capitulo...]
//       (sem argumento: praca e pindorama, os dois capitulos da alegacao)
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

// ---- 1. os bytes: extrair GENTE_EP_B64 do src/jogo.ts sem executar nada ----
function lerFolhas() {
  const txt = fs.readFileSync(path.join(RAIZ, 'src', 'jogo.ts'), 'utf8');
  const i = txt.indexOf('const GENTE_EP_B64');
  if (i < 0) throw new Error('GENTE_EP_B64 nao achado em src/jogo.ts');
  const fim = txt.indexOf('/*GENTE_EP_B64_END*/', i);
  const bloco = txt.slice(i, fim < 0 ? txt.length : fim);
  const folhas = {};
  // cada capitulo: `  nome: [` ... `  ],`
  const re = /^\s{2}([a-z0-9]+):\s*\[/gm;
  let m, marcas = [];
  while ((m = re.exec(bloco))) marcas.push({ nome: m[1], de: m.index });
  for (let k = 0; k < marcas.length; k++) {
    const trecho = bloco.slice(marcas[k].de, k + 1 < marcas.length ? marcas[k + 1].de : bloco.length);
    // as fileiras sao `    [` ... `    ],`
    const fileiras = [];
    const reF = /\[\s*([^\[\]]*?)\]/g;
    let f;
    while ((f = reF.exec(trecho))) {
      const uris = f[1].match(/"data:image\/[^"]+"/g);
      if (uris && uris.length) fileiras.push(uris.map(s => s.slice(1, -1)));
    }
    if (fileiras.length) folhas[marcas[k].nome] = fileiras;
  }
  return folhas;
}

// ---- 2. a largura: parser de cabecalho WebP/PNG/GIF na mao ----
// Fontes da forma dos cabecalhos: RIFF/WEBP container (VP8 lossy, VP8L lossless, VP8X
// extended). Nao ha biblioteca envolvida DE PROPOSITO — uma biblioteca poderia compartilhar
// o mesmo defeito da ferramenta que se quer auditar.
function dimensoes(dataURI) {
  const virg = dataURI.indexOf(',');
  const b = Buffer.from(dataURI.slice(virg + 1), 'base64');
  if (b.length < 16) return { w: 0, h: 0, fmt: 'curto' };
  // GIF (o pixel de espera 1x1 do jogo, e a injecao de prova)
  if (b.slice(0, 3).toString('latin1') === 'GIF') {
    return { w: b.readUInt16LE(6), h: b.readUInt16LE(8), fmt: 'gif' };
  }
  // PNG
  if (b[0] === 0x89 && b.slice(1, 4).toString('latin1') === 'PNG') {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), fmt: 'png' };
  }
  if (b.slice(0, 4).toString('latin1') !== 'RIFF' || b.slice(8, 12).toString('latin1') !== 'WEBP') {
    return { w: 0, h: 0, fmt: 'desconhecido' };
  }
  // percorrer os chunks; VP8X manda no tamanho da tela, VP8/VP8L no do quadro
  let off = 12, vp8x = null, vp8 = null;
  while (off + 8 <= b.length) {
    const cc = b.slice(off, off + 4).toString('latin1');
    const tam = b.readUInt32LE(off + 4);
    const corpo = off + 8;
    if (cc === 'VP8X' && corpo + 10 <= b.length) {
      vp8x = { w: (b[corpo + 4] | (b[corpo + 5] << 8) | (b[corpo + 6] << 16)) + 1,
               h: (b[corpo + 7] | (b[corpo + 8] << 8) | (b[corpo + 9] << 16)) + 1, fmt: 'vp8x' };
    } else if (cc === 'VP8 ' && corpo + 10 <= b.length) {
      // frame tag 3 bytes, sync 0x9d 0x01 0x2a, depois 14 bits de largura e de altura
      if (b[corpo + 3] === 0x9d && b[corpo + 4] === 0x01 && b[corpo + 5] === 0x2a) {
        vp8 = { w: b.readUInt16LE(corpo + 6) & 0x3fff, h: b.readUInt16LE(corpo + 8) & 0x3fff, fmt: 'vp8' };
      }
    } else if (cc === 'VP8L' && corpo + 5 <= b.length && b[corpo] === 0x2f) {
      const bits = b.readUInt32LE(corpo + 1);
      vp8 = { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1, fmt: 'vp8l' };
    }
    off = corpo + tam + (tam & 1);
  }
  return vp8x || vp8 || { w: 0, h: 0, fmt: 'riff-sem-quadro' };
}

function mediana(a) {
  const s = a.slice().sort((x, y) => x - y);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

// ---- 3. o relatorio ----
const folhas = lerFolhas();
const alvos = process.argv.slice(2).length ? process.argv.slice(2) : ['praca', 'pindorama'];
let falhas = 0;
function ok(c, m) { console.log((c ? '  ok    ' : '  FALHA ') + m); if (!c) falhas++; }

console.log('LARGURAS DECODIFICADAS DIRETO DO BYTE — src/jogo.ts, sem navegador\n');
const medidas = {};
for (const cap of alvos) {
  const folha = folhas[cap];
  if (!folha) { ok(false, cap + ': folha nao encontrada em GENTE_EP_B64'); continue; }
  console.log('== ' + cap + ' ==');
  medidas[cap] = [];
  folha.forEach((fl, fi) => {
    const dims = fl.map(dimensoes);
    medidas[cap][fi] = dims;
    const simples = dims.map(d => d.w).filter(w => w > 1);
    // mediana das poses que NAO sao suspeitas de dobra: descarta o terco mais largo
    const ord = simples.slice().sort((a, b) => a - b);
    const base = mediana(ord.slice(0, Math.max(1, Math.ceil(ord.length * 0.6))));
    console.log('  f' + fi + '  ' + dims.map((d, qi) =>
      'q' + qi + '=' + d.w + 'x' + d.h + (d.w > 1 ? '(' + (d.w / base).toFixed(2) + '×)' : '(VAZIO)')
    ).join('  '));
    console.log('       mediana das simples = ' + base + ' px');
  });
  console.log('');
}

// ---- 4. as asseroes que refutam ou confirmam a alegacao do dev ----
console.log('AS ALEGACOES, uma a uma:\n');
if (medidas.praca) {
  const f0 = medidas.praca[0], f2 = medidas.praca[2];
  ok(f0[7].w > 1, 'praca f0q7 tem tinta de verdade (largura ' + f0[7].w + 'px, nao pixel de espera)');
  ok(f2[0].w > 1, 'praca f2q0 tem tinta de verdade (largura ' + f2[0].w + 'px, nao pixel de espera)');
  ok(f2[7].w <= 1, 'praca f2q7 continua vazio (largura ' + f2[7].w + 'px) — a excecao declarada e real');
  const vazios = [];
  medidas.praca.forEach((fl, fi) => fl.forEach((d, qi) => { if (d.w <= 1) vazios.push('f' + fi + 'q' + qi); }));
  ok(vazios.length === 1 && vazios[0] === 'f2q7',
    'praca tem EXATAMENTE um quadro vazio, e e o f2q7 — achados: [' + vazios.join(', ') + ']');

  // A alegacao mais importante: "duas poses coladas". A FAIXA E 1,85-2,60 E ISSO FOI CALIBRADO,
  // nao chutado: a primeira versao deste arquivo exigiu 1,85-2,15 e REPROVOU as duas celulas por
  // 0,03 (2,18x). O erro era meu. A celula e recortada com a margem transparente aparada, entao
  // duas poses coladas nunca dao 2,00x exatos — `pindorama f2q6`, que a revisao adversarial de
  // 04/09 confirmou A OLHO como a mesma senhora duas vezes, mede 2,44x. O teto tem de caber nela.
  // A PROVA FORTE DE VERDADE NAO E A LARGURA e esta em `test/qa-praca-o-que-a-pessoa-ve.js`:
  // um vao vertical de 24-28 colunas vazias no MEIO exato da celula (fracao 0,49-0,50) e tinta
  // de 2x a das vizinhas. Largura sozinha nunca separa "duas poses" de "uma pose de braco aberto".
  const simples = [f2[0].w, f2[1].w, f2[2].w, f2[4].w, f2[5].w].filter(w => w > 1);
  const base = mediana(simples);
  for (const qi of [3, 6]) {
    const r = f2[qi].w / base;
    console.log('  ...   praca f2q' + qi + ': ' + f2[qi].w + 'px / mediana ' + base + 'px = ' + r.toFixed(3) + '×');
    ok(r >= 1.85 && r <= 2.60,
      'praca f2q' + qi + ' e DE FATO ~2 poses (razao ' + r.toFixed(3) + '× dentro de 1,85-2,60)');
  }

  // O QUE O RELATORIO DO DEV NAO DISSE, e o QA acha lendo os bytes: a FILEIRA 0 TAMBEM tem uma
  // celula dobrada. `f0q3` = 330px contra mediana 150 (2,20x), com o mesmo vao no meio. A tabela
  // de larguras do PENDENTES 109 ate mostra o 330 em negrito, mas a palavra "dobrada" e a
  // conclusao que decorre dela ficaram so na fileira 2.
  //
  // POR QUE ISSO IMPORTA E NAO E DETALHE: a regra escrita para NAO tapar o `f2q7` e "a fileira 2
  // nao e um laco de oito poses, entao nenhuma pose limpa dela pode ser VERIFICADA como
  // continuacao do passo". Essa frase e verdadeira, palavra por palavra, da fileira 0 tambem —
  // que empacota 8 poses em 7 celulas e MESMO ASSIM foi tapada (`f0q7 <- f0q6`). Ou a regra e
  // forte demais e o `f2q7` podia ter sido tapado, ou ela vale e o remendo do `f0q7` esta tao
  // as cegas quanto. Nao e o QA que decide qual — mas as duas nao podem valer ao mesmo tempo.
  const f0simples = [f0[0].w, f0[1].w, f0[2].w, f0[4].w, f0[5].w, f0[6].w].filter(w => w > 1);
  const f0base = mediana(f0simples);
  const r0 = f0[3].w / f0base;
  console.log('  ...   praca f0q3: ' + f0[3].w + 'px / mediana ' + f0base + 'px = ' + r0.toFixed(3) + '× (FILEIRA 0)');
  ok(r0 >= 1.85 && r0 <= 2.60,
    'praca f0q3 e TAMBEM uma celula dobrada (' + r0.toFixed(3) + '×) — a fileira 0 nao e um laco de 8 poses limpo, ' +
    'e mesmo assim o f0q7 foi remendado por copia. A regra que barrou o f2q7 barraria este remendo tambem.');
  ok(f0[7].w === f0[6].w, 'o remendo f0q7=f0q6 tem a MESMA largura da fonte declarada (' + f0[6].w + 'px)');
  ok(f2[0].w === f2[1].w, 'o remendo f2q0=f2q1 tem a MESMA largura da fonte declarada (' + f2[1].w + 'px)');
  ok(f2[0].w !== f2[6].w,
    'a fonte do remendo de f2q0 NAO e a celula dobrada f2q6 (' + f2[6].w + 'px) — o padrao automatico foi evitado');
}
if (medidas.pindorama) {
  const p2 = medidas.pindorama[2];
  ok(p2[7].w <= 1, 'pindorama f2q7 continua vazio — a entrega NAO mexeu nele (fora do escopo)');
  const simples = [p2[0].w, p2[1].w, p2[2].w, p2[3].w, p2[4].w, p2[5].w].filter(w => w > 1);
  const base = mediana(simples);
  const r = p2[6].w / base;
  console.log('  ...   pindorama f2q6: ' + p2[6].w + 'px / mediana ' + base + 'px = ' + r.toFixed(3) + '×');
}

console.log(falhas ? '\nREPROVOU (' + falhas + ')' : '\nPASSOU');
process.exit(falhas ? 1 : 0);
