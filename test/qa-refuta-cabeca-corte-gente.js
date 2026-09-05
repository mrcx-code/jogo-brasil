// QA ADVERSARIAL 05/09 — O DESVIO DA CABECA NAS 12 METADES NOVAS, MEDIDO AQUI.
//
// POR QUE ELE EXISTE. A entrega afirma "0 a 0,25 px de fonte" de desvio; o documento da direcao
// de arte, para o MESMO corte, afirma "0 a 0,5 px". Os dois numeros nao podem estar certos ao
// mesmo tempo, e nenhum dos dois foi medido por quem nao cortou. Este arquivo mede.
//
// O QUE E "O DESVIO DA CABECA", e por que ele e a regua certa. O motor ancora o quadro pelo
// CENTRO DA CELULA (`dx = cxm - dw/2`) e escala pela ALTURA. Entao o que decide se a pessoa anda
// reto nao e a largura do recorte: e onde a CABECA cai dentro do retangulo novo. Se uma metade
// pousa a cabeca 10 px a esquerda do centro e a irma 4 px, a pessoa da um passo de lado uma vez
// por ciclo — o "registre pela cabeca" do §5 do CLAUDE.md, aplicado a uma celula ja cortada.
//
// COMO SE MEDE AQUI (e nao e o metodo de quem cortou): topo da mancha; faixa de cabeca = as
// primeiras `FAIXA` fracoes da ALTURA DA FIGURA a partir do topo; centroide horizontal da tinta
// dentro dessa faixa; desvio = centroide - (largura/2). O numero de referencia de cada fileira e
// a MEDIANA dos quadros que NAO foram cortados — nao a media, para uma metade ruim nao puxar o
// alvo que ela deveria acertar.
//
// USO:  node test/qa-refuta-cabeca-corte-gente.js
//       GENTE_FONTE=<caminho para outro jogo.ts> node test/qa-refuta-cabeca-corte-gente.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ABRIR = require('./abrir.js');

const FAIXA = 0.12; // 12% do alto da figura = cabeca + ombro alto
// As 12 metades novas, por posicao DEPOIS do corte (a tabela de `arte-corte-gente-dobrada-05-09.md`
// diz de onde cada uma saiu; aqui so importa QUAIS posicoes sao recorte).
const NOVAS = {
  'praca:0': [3, 4],
  'praca:2': [2, 3, 6, 7],
  'pindorama:2': [6, 7],
  'temfonte:2': [5, 6],
  'segurou:2': [5, 6],
};
// A regua. A entrega afirma 0,25; a arte afirma 0,5. Passo com a MAIS FROUXA das duas e reporto
// o numero cru — reprovar por 0,3 seria escolher a versao de um dos dois sem medir qual esta certa.
const TETO = +(process.env.CABECA_TETO || 0.5);

const fonte = fs.readFileSync(process.env.GENTE_FONTE || path.resolve(__dirname, '..', 'src', 'jogo.ts'), 'utf8');
const iIni = fonte.indexOf('/*GENTE_EP_B64_START');
const iFim = fonte.indexOf('/*GENTE_EP_B64_END');
const bloco = fonte.slice(iIni, iFim);
const folhas = {};
{
  const re = /^  ([A-Za-z0-9_]+): \[$/gm;
  const marcas = []; let m;
  while ((m = re.exec(bloco))) marcas.push({ nome: m[1], i: m.index });
  for (let k = 0; k < marcas.length; k++) {
    const de = marcas[k].i, ate = k + 1 < marcas.length ? marcas[k + 1].i : bloco.length;
    folhas[marcas[k].nome] = (bloco.slice(de, ate).match(/"data:[^"]*"/g) || []).map(s => s.slice(1, -1));
  }
}

let falhas = 0;
function ok(c, m) { console.log((c ? '  ok    ' : '  FALHA ') + m); if (!c) falhas++; }

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage();
  await page.setContent('<!doctype html><meta charset="utf-8"><title>qa</title>');

  console.log('\n== DESVIO DA CABECA (centroide da faixa alta - centro da celula), px de FONTE ==');
  console.log('   faixa de cabeca = ' + (FAIXA * 100).toFixed(0) + '% do alto da figura · alvo = mediana dos quadros NAO cortados\n');

  const resumo = [];
  for (const chave of Object.keys(NOVAS)) {
    const [cap, fStr] = chave.split(':');
    const f = +fStr;
    const uris = folhas[cap].slice(f * 8, f * 8 + 8);
    const med = await page.evaluate(async ({ uris, faixa }) => {
      const fora = [];
      for (const d of uris) {
        const im = new Image(); im.src = d;
        await new Promise(r => { im.complete ? r() : (im.onload = r, im.onerror = r); });
        const w = im.naturalWidth, h = im.naturalHeight;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0);
        const px = g.getImageData(0, 0, w, h).data;
        let topo = -1, base = -1;
        for (let y = 0; y < h && topo < 0; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 24) { topo = y; break; }
        for (let y = h - 1; y >= 0 && base < 0; y--) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 24) { base = y; break; }
        const ate = topo + Math.max(1, Math.round((base - topo + 1) * faixa));
        let soma = 0, n = 0;
        for (let y = topo; y <= ate && y < h; y++) for (let x = 0; x < w; x++)
          if (px[(y * w + x) * 4 + 3] > 24) { soma += x; n++; }
        fora.push({ w, h, topo, base, cabecaX: n ? soma / n : null, n });
      }
      return fora;
    }, { uris, faixa: FAIXA });

    const novas = NOVAS[chave];
    const desvios = med.map(r => r.cabecaX === null ? null : r.cabecaX - r.w / 2);
    const antigos = desvios.filter((d, i) => d !== null && novas.indexOf(i) < 0).sort((a, b) => a - b);
    const alvo = antigos[Math.floor(antigos.length / 2)];
    console.log('   ' + chave + '  alvo (mediana das ' + antigos.length + ' nao cortadas) = ' + alvo.toFixed(2) + ' px');
    let pior = 0;
    desvios.forEach((d, i) => {
      const nova = novas.indexOf(i) >= 0;
      const err = Math.abs(d - alvo);
      if (nova && err > pior) pior = err;
      console.log('     q' + i + (nova ? ' NOVA ' : '      ') + ' larg ' + String(med[i].w).padStart(3) +
        '  cabeca ' + d.toFixed(2).padStart(7) + '  erro ' + err.toFixed(2).padStart(6) + (nova && err > TETO ? '   <-- ACIMA DO TETO' : ''));
    });
    const amp = Math.max.apply(null, antigos) - Math.min.apply(null, antigos);
    console.log('     amplitude natural das nao cortadas: ' + amp.toFixed(2) + ' px · PIOR erro das novas: ' + pior.toFixed(2) + ' px\n');
    resumo.push({ chave, pior, amp });
    ok(pior <= TETO, chave + ': as ' + novas.length + ' metades novas caem a <= ' + TETO + ' px do alvo (pior: ' + pior.toFixed(2) + ')');
    ok(pior <= amp, chave + ': o erro das novas nao passa a amplitude natural da propria fileira (' + pior.toFixed(2) + ' <= ' + amp.toFixed(2) + ')');
  }

  await nav.close();
  const piorGeral = Math.max.apply(null, resumo.map(r => r.pior));
  console.log('== PIOR DESVIO DAS 12 METADES: ' + piorGeral.toFixed(2) + ' px de fonte ==');
  console.log('   (a entrega afirmou "0 a 0,25"; o documento da arte afirmou "0 a 0,5")');
  console.log(falhas ? '\nREPROVOU (' + falhas + ')' : '\nPASSOU');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
