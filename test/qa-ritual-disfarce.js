// QUANTO DISFARCE O PORTÃO DO RITUAL AGUENTA — o controle que mede o instrumento, não o jogo.
//
// Escrito pelo QA em 04/09 contra `test/salvador-drop-sem-ritual.js`. Aquele portão declara
// "mesma figura ≈ 0, figuras diferentes ≥ 40" e usa LIMIAR = 12. O número da esquerda foi
// medido comparando o arquivo com ELE MESMO — bit a bit o mesmo WebP. Isso não responde à
// pergunta que importa para um portão que vai durar meses:
//
//   se o objeto ritual VOLTAR ao chão passando pela esteira de arte (aparado, recomprimido,
//   redimensionado), o portão ainda o reconhece? ou a distância sobe acima de 12 e o portão
//   deixa entrar a MESMA FIGURA por ter outro recorte?
//
// A esteira deste repositório APARA (test/aparar-objeto.js) e RECOMPRIME (test/inline-objetos.js)
// tudo que entra — quer dizer que a arte ritual reintroduzida hoje quase certamente NÃO teria os
// bytes do arquivo de referência. Então "mesma figura = 0,0" é a medida do caso que não vai
// acontecer.
//
// Este arquivo fabrica disfarces de cada uma das três artes rituais e imprime a distância
// de cada um até a referência, contra os dois números que decidem: o LIMIAR (12) e o mínimo
// medido entre figuras DIFERENTES neste repositório (29,9 — test/qa-ritual-varredura.js).
// Disfarce que passar dos 12 é um caminho de volta que o portão não fecha.
//
// ── 04/09, segunda passada (dev-jogo): DE 5 DISFARCES PARA 13, e foi isso que decidiu ────
// Com cinco casos, o espelho horizontal parecia o vizinho a remendar, porque era o único
// vizinho MEDIDO. O item de backlog chegou propondo justamente esse remendo:
// `min(d(a,b), d(a,espelho(b)))`. As oito linhas novas (espelho vertical, 180°, 90°, 8°,
// matiz, brilho, moldura, espelho+aparado) mostram que ele é remendo de CASO:
//
//   · compra **2 de 13** — e as duas são a mesma transformação;
//   · **7 continuam passando**, e a mais barata não é geometria nenhuma:
//     **brilho ×1,25 = 14,0**, um filtro, a mesma figura na tela.
//
// Foi essa tabela que fez `test/salvador-drop-sem-ritual.js` virar LISTA BRANCA em vez de
// ganhar o espelho: lista negra só pega o disfarce que alguém já imaginou. A coluna do
// espelho ficou, porque custa uma linha e é tudo o que sobra fora do lugar de drop.
//
// Instrumento medido contra si mesmo: a linha "idêntico" tem de dar 0,0 nas duas colunas —
// se der outra coisa, é o instrumento que mudou, não o jogo.
//
//   node test/qa-ritual-disfarce.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}

const RAIZ = path.resolve(__dirname, '..');
const OBJ = path.join(RAIZ, 'assets', 'objetos');
const LIMIAR = 12;                 // o do portão do autor
const PISO_DIFERENTE = 29.9;       // menor distância entre figuras DIFERENTES, varredura de 518

const RITUAL = { 'drop-cap4-1': 'acarajé', 'drop-cap4-2': 'pano da costa', 'drop-cap4-3': 'búzios' };
// A lista branca de `test/salvador-drop-sem-ritual.js`, repetida aqui para medir a TERCEIRA
// coluna: a que diz por que a lista branca fecha as treze linhas. Se as duas listas
// discordarem um dia, é sinal de que uma arte de drop entrou sem passar por lá.
const APROVADOS = ['drop-semente', 'drop-broto', 'drop-peixe', 'drop-cap2-1',
  'drop-cap4-tabuleiro', 'drop-cap4-balde', 'drop-cap4-trouxa', 'drop-cap3-1'];

// ── AS DUAS TABELAS TÊM DE CONCORDAR, e agora isso é exit code (04/09) ───────────────────
// A lista acima estava repetida à mão e **nada** conferia que ela batia com a do portão.
//
// O QUE A DIVERGÊNCIA ESTRAGA, medido e CORRIGIDO pelo QA: ela **infla o relatório**, não abre
// buraco no portão. O portão é autoridade da própria tabela e mordeu em quatro injeções com a
// tabela dele intacta. Mas com 6 dos 8 nomes aqui, três linhas desta tabela sobem — espelhado
// vertical 35,2 → 38,2 · rodado 180° 34,9 → 36,6 · rodado 90° 34,4 → 34,5 — e a lista branca
// passa a **parecer mais segura do que é**. Apodrecimento de documentação, e este arquivo
// existe justamente para ser a documentação medida.
//
// Por que ler o TEXTO do portão em vez de `require`: o portão é uma IIFE que sobe o Chromium e
// chama `process.exit` ao ser carregado — requerê-lo executaria o portão inteiro aqui dentro.
// Extrair a declaração é a leitura mais barata que não muda o portão de forma.
const FONTE_PORTAO = path.join(__dirname, 'salvador-drop-sem-ritual.js');
(function conferirTabelas() {
  const txt = fs.readFileSync(FONTE_PORTAO, 'utf8');
  const m = txt.match(/\nconst APROVADOS = (\[[\s\S]*?\n\]);/);
  if (!m) {
    console.error('não achei `const APROVADOS = [...]` em test/salvador-drop-sem-ritual.js — ' +
      'o portão mudou de forma e este controle deixou de saber o que comparar.');
    process.exit(1);
  }
  const doPortao = [].concat.apply([], new Function('return ' + m[1])());
  const a = doPortao.slice().sort(), b = APROVADOS.slice().sort();
  const so = (x, y) => x.filter(n => y.indexOf(n) < 0);
  if (a.length !== b.length || a.some((n, i) => n !== b[i])) {
    console.error('\nAS DUAS TABELAS APROVADOS DIVERGIRAM.');
    console.error('  portão  (test/salvador-drop-sem-ritual.js): ' + doPortao.length + ' nome(s)');
    console.error('  aqui    (test/qa-ritual-disfarce.js):       ' + APROVADOS.length + ' nome(s)');
    console.error('  só no portão: ' + (so(a, b).join(', ') || '—'));
    console.error('  só aqui:      ' + (so(b, a).join(', ') || '—'));
    console.error('\n  A coluna BRANCA desta tabela mede o disfarce contra as artes aprovadas.');
    console.error('  Com a lista incompleta ela INFLA e a lista branca parece mais segura do que é.');
    console.error('  CONSERTO: iguale a lista deste arquivo à do portão (o portão é a autoridade).\n');
    process.exit(1);
  }
  console.log('as duas tabelas APROVADOS concordam: ' + doPortao.length +
    ' nome(s), lidos de test/salvador-drop-sem-ritual.js e conferidos contra os daqui.');
})();

(async () => {
  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');

  const linhas = [];
  for (const nome of Object.keys(RITUAL)) {
    const uri = 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, nome + '.webp')).toString('base64');
    const r = await pg.evaluate(async function (args) {
      const u = args.u;
      async function carregar(x) { const im = new Image(); im.src = x; await im.decode(); return im; }
      function assinatura(im) {
        const c = document.createElement('canvas'); c.width = 16; c.height = 16;
        const x = c.getContext('2d');
        x.fillStyle = '#808080'; x.fillRect(0, 0, 16, 16);
        x.imageSmoothingEnabled = true;
        x.drawImage(im, 0, 0, 16, 16);
        const d = x.getImageData(0, 0, 16, 16).data;
        const v = []; for (let i = 0; i < d.length; i += 4) v.push(d[i], d[i + 1], d[i + 2]);
        return v;
      }
      const im = await carregar(u);
      const w = im.naturalWidth, h = im.naturalHeight;

      // o recorte justo, do mesmo jeito que test/aparar-objeto.js faz (mancha com alfa > 16)
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(im, 0, 0);
      const d = c.getContext('2d').getImageData(0, 0, w, h).data;
      let x0 = w, x1 = -1, y0 = h, y1 = -1;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        if (d[(j * w + i) * 4 + 3] > 16) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      }
      if (x1 < 0) { x0 = 0; x1 = w - 1; y0 = 0; y1 = h - 1; }
      const nw = x1 - x0 + 1, nh = y1 - y0 + 1;

      function recortado() {
        const r = document.createElement('canvas'); r.width = nw; r.height = nh;
        r.getContext('2d').drawImage(c, x0, y0, nw, nh, 0, 0, nw, nh);
        return r;
      }
      function espelho() {
        const r = document.createElement('canvas'); r.width = w; r.height = h;
        const x = r.getContext('2d'); x.translate(w, 0); x.scale(-1, 1); x.drawImage(c, 0, 0);
        return r;
      }
      function reduzido(f) {
        const r = document.createElement('canvas'); r.width = Math.round(w * f); r.height = Math.round(h * f);
        r.getContext('2d').drawImage(c, 0, 0, r.width, r.height);
        return r;
      }

      // 04/09, segunda passada (dev-jogo): de 5 disfarces para 13. Os 5 originais não bastavam
      // para decidir entre "remendar o espelho" e "virar lista branca" — o espelho parecia o
      // vizinho único porque era o único vizinho MEDIDO. Com 13, o mais barato de todos
      // aparece, e não é geometria: brilho ×1,25.
      function girado(g) {
        const rad = g * Math.PI / 180;
        const r = document.createElement('canvas'); r.width = w; r.height = h;
        const x = r.getContext('2d'); x.translate(w / 2, h / 2); x.rotate(rad); x.drawImage(c, -w / 2, -h / 2);
        return r;
      }
      function filtrado(f) {
        const r = document.createElement('canvas'); r.width = w; r.height = h;
        const x = r.getContext('2d'); x.filter = f; x.drawImage(c, 0, 0);
        return r;
      }
      const casos = {
        'idêntico (o caso do autor)': u,
        'recomprimido q=0,50': c.toDataURL('image/webp', 0.5),
        'aparado na mancha (esteira real)': recortado().toDataURL('image/webp', 0.8),
        'reduzido a 60%': reduzido(0.6).toDataURL('image/webp', 0.8),
        'espelhado (horizontal)': espelho().toDataURL('image/webp', 0.8),
        'espelhado vertical': (function () {
          const r = document.createElement('canvas'); r.width = w; r.height = h;
          const x = r.getContext('2d'); x.translate(0, h); x.scale(1, -1); x.drawImage(c, 0, 0); return r;
        })().toDataURL('image/webp', 0.8),
        'rodado 180°': girado(180).toDataURL('image/webp', 0.8),
        'rodado 90°': (function () {
          const r = document.createElement('canvas'); r.width = h; r.height = w;
          const x = r.getContext('2d'); x.translate(h, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0); return r;
        })().toDataURL('image/webp', 0.8),
        'rodado 8° (torto de leve)': girado(8).toDataURL('image/webp', 0.8),
        'paleta: matiz +40°': filtrado('hue-rotate(40deg)').toDataURL('image/webp', 0.8),
        'paleta: brilho ×1,25': filtrado('brightness(1.25)').toDataURL('image/webp', 0.8),
        'espelho + aparado': (function () {
          const r = document.createElement('canvas'); r.width = nw; r.height = nh;
          const x = r.getContext('2d'); x.translate(nw, 0); x.scale(-1, 1);
          x.drawImage(c, x0, y0, nw, nh, 0, 0, nw, nh); return r;
        })().toDataURL('image/webp', 0.8),
        'moldura +12% (recuado)': (function () {
          const r = document.createElement('canvas'); r.width = w; r.height = h;
          r.getContext('2d').drawImage(c, w * 0.06, h * 0.06, w * 0.88, h * 0.88); return r;
        })().toDataURL('image/webp', 0.8)
      };
      // duas assinaturas da referência: normal e refletida. A segunda é o que permite medir
      // `min(d(a,b), d(a,espelho(b)))` — a saída que este arquivo ajudou a RECUSAR.
      const base = assinatura(im);
      function assEspelhada(im2) {
        const cc = document.createElement('canvas'); cc.width = 16; cc.height = 16;
        const x = cc.getContext('2d');
        x.fillStyle = '#808080'; x.fillRect(0, 0, 16, 16);
        x.imageSmoothingEnabled = true;
        x.translate(16, 0); x.scale(-1, 1);
        x.drawImage(im2, 0, 0, 16, 16);
        const d = x.getImageData(0, 0, 16, 16).data;
        const v = []; for (let i = 0; i < d.length; i += 4) v.push(d[i], d[i + 1], d[i + 2]);
        return v;
      }
      const refEsp = assEspelhada(im);
      // as oito artes APROVADAS, assinadas: é contra elas que a lista branca decide
      const aprov = [];
      for (const au of args.aprovados) { const ai = await carregar(au); aprov.push(assinatura(ai)); }
      const out = { tam: w + 'x' + h, recorte: nw + 'x' + nh, casos: {}, casosEsp: {}, casosWL: {} };
      for (const k of Object.keys(casos)) {
        const a = assinatura(await carregar(casos[k]));
        let s = 0, se = 0;
        for (let i = 0; i < a.length; i++) { s += Math.abs(a[i] - base[i]); se += Math.abs(a[i] - refEsp[i]); }
        out.casos[k] = s / a.length;
        out.casosEsp[k] = Math.min(s / a.length, se / a.length);
        let mw = Infinity;
        aprov.forEach(function (p) {
          let t = 0; for (let i = 0; i < a.length; i++) t += Math.abs(a[i] - p[i]);
          mw = Math.min(mw, t / a.length);
        });
        out.casosWL[k] = mw;
      }
      return out;
    }, { u: uri, aprovados: APROVADOS.map(n => 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, n + '.webp')).toString('base64')) });
    linhas.push({ nome, r });
  }
  await nav.close();

  console.log('distância de cada DISFARCE até a arte ritual original (limiar: ' + LIMIAR
    + '; figuras diferentes começam em ' + PISO_DIFERENTE + ')');
  console.log('coluna d = distância simples · coluna e = com espelho, min(d(a,b), d(a,espelho(b)))');
  console.log('o veredito é do PIOR dos três rituais em cada linha.\n');
  const chaves = Object.keys(linhas[0].r.casos);
  console.log('  ' + 'disfarce'.padEnd(34) + '      d      e     wl   negra  negra+esp   BRANCA');
  let compraEspelho = 0, sobra = [], piorWL = Infinity;
  chaves.forEach(function (k) {
    const pior = Math.max.apply(null, linhas.map(l => l.r.casos[k]));
    const piorE = Math.max.apply(null, linhas.map(l => l.r.casosEsp[k]));
    // a lista BRANCA pega quando o disfarce não é NENHUMA arte aprovada: o pior caso é o
    // disfarce que mais se APROXIMA de alguma aprovada, então aqui vale o MÍNIMO dos três.
    const menorWL = Math.min.apply(null, linhas.map(l => l.r.casosWL[k]));
    piorWL = Math.min(piorWL, menorWL);
    const v1 = pior <= LIMIAR, v2 = piorE <= LIMIAR, v3 = menorWL > LIMIAR;
    if (!v1 && v2) compraEspelho++;
    if (!v2) sobra.push(k + ' (' + piorE.toFixed(1) + ')');
    console.log('  ' + k.padEnd(34) + pior.toFixed(1).padStart(7) + piorE.toFixed(1).padStart(7) +
      menorWL.toFixed(1).padStart(7) + '   ' + (v1 ? 'PEGO ' : 'passa').padEnd(8) +
      (v2 ? 'PEGO ' : 'passa').padEnd(11) + (v3 ? 'PEGO' : 'PASSA'));
  });
  console.log('\n  a lista BRANCA pega ' + chaves.length + ' de ' + chaves.length +
    ' — o disfarce que mais se aproxima de uma arte aprovada ainda está a ' + piorWL.toFixed(1) +
    ' (limiar ' + LIMIAR + ', folga ' + (piorWL / LIMIAR).toFixed(1) + '×).');
  console.log('  o espelho compra ' + compraEspelho + ' de ' + chaves.length + ' disfarces.');
  console.log('  continuam passando (' + sobra.length + '): ' + sobra.join(' · '));
  console.log('  o MAIS BARATO dos que passam é o que decide o desenho do portão — e ele não é');
  console.log('  geometria: brilho ×1,25, um filtro só, a mesma figura na tela.');
  linhas.forEach(l => console.log('\n  ' + RITUAL[l.nome] + ': quadro ' + l.r.tam + ', mancha ' + l.r.recorte));
  console.log('\n(este arquivo é DIAGNÓSTICO: ele não reprova nada, ele diz de que tamanho é o buraco)');
  console.log('(em lugar de DROP o buraco está fechado por LISTA BRANCA desde 04/09 —');
  console.log(' test/salvador-drop-sem-ritual.js. Fora dele, esta tabela é o que sobra aberto.)');
})().catch(e => { console.error(e); process.exit(1); });
