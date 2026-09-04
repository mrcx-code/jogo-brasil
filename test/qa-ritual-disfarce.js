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
// Este arquivo fabrica cinco disfarces de cada uma das três artes rituais e imprime a distância
// de cada um até a referência, contra os dois números que decidem: o LIMIAR (12) e o mínimo
// medido entre figuras DIFERENTES neste repositório (29,9 — test/qa-ritual-varredura.js).
// Disfarce que passar dos 12 é um caminho de volta que o portão não fecha.
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

(async () => {
  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');

  const linhas = [];
  for (const nome of Object.keys(RITUAL)) {
    const uri = 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, nome + '.webp')).toString('base64');
    const r = await pg.evaluate(async function (u) {
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

      const casos = {
        'idêntico (o caso do autor)': u,
        'recomprimido q=0,50': c.toDataURL('image/webp', 0.5),
        'aparado na mancha (esteira real)': recortado().toDataURL('image/webp', 0.8),
        'reduzido a 60%': reduzido(0.6).toDataURL('image/webp', 0.8),
        'espelhado': espelho().toDataURL('image/webp', 0.8)
      };
      const base = assinatura(im);
      const out = { tam: w + 'x' + h, recorte: nw + 'x' + nh, casos: {} };
      for (const k of Object.keys(casos)) {
        const a = assinatura(await carregar(casos[k]));
        let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - base[i]);
        out.casos[k] = s / a.length;
      }
      return out;
    }, uri);
    linhas.push({ nome, r });
  }
  await nav.close();

  console.log('distância de cada DISFARCE até a arte ritual original (limiar do portão: ' + LIMIAR
    + '; figuras diferentes começam em ' + PISO_DIFERENTE + ')\n');
  const chaves = Object.keys(linhas[0].r.casos);
  console.log('  ' + 'disfarce'.padEnd(34) + Object.keys(RITUAL).map(n => n.replace('drop-cap4-', 'rit-').padStart(9)).join('') + '   veredito');
  chaves.forEach(function (k) {
    const vals = linhas.map(l => l.r.casos[k]);
    const pior = Math.max.apply(null, vals);
    console.log('  ' + k.padEnd(34) + vals.map(v => v.toFixed(1).padStart(9)).join('') +
      '   ' + (pior <= LIMIAR ? 'PEGO pelo portão' : 'PASSA pelo portão' + (pior >= PISO_DIFERENTE ? ' (e nem parece a mesma figura)' : '')));
  });
  linhas.forEach(l => console.log('\n  ' + RITUAL[l.nome] + ': quadro ' + l.r.tam + ', mancha ' + l.r.recorte));
  console.log('\n(este arquivo é DIAGNÓSTICO: ele não reprova nada, ele diz de que tamanho é o buraco)');
})().catch(e => { console.error(e); process.exit(1); });
