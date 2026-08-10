// CONVERTE uma imagem gerada fora em peça de cenário do jogo.
//
// Três passos, e cada um resolve um problema medido:
//
// 1. RECORTE ao centro, para a proporção do alvo. O gerador entrega o que quer; o motor
//    precisa de 720x959 (peça de cima) e 720x320 (peça de baixo). Recortar é melhor que
//    esticar, e recortar ao centro é seguro porque os prompts pedem composição uniforme
//    sem marco dominante — não há nada nas bordas que doa perder.
//
// 2. REDUÇÃO por área (não por vizinho mais próximo). Reduzir por vizinho jogaria fora 3 de
//    cada 4 pixels e serrilharia tudo; a média por área preserva a mancha, que é o que
//    sobrevive à quantização em seguida.
//
// 3. QUANTIZAÇÃO da paleta. É o passo que existe porque o gerador NÃO faz pixel art: as seis
//    imagens vieram com 220 mil a 328 mil cores depois de dois rounds pedindo 32. Sem cortar
//    a paleta, o resultado reduzido é ilustração borrada, não pixel art. Corte por
//    popularidade: conta as cores num cubo grosseiro, fica com as N mais frequentes, e mapeia
//    cada pixel para a mais próxima em distância euclidiana no RGB.
//
//   node test/converter-fundo.js <entrada> <alto|baixo> <saida.png> [cores]

const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');

const ENT = process.argv[2];
const PECA = process.argv[3];
const SAI = process.argv[4];
const CORES = parseInt(process.argv[5] || '48', 10);

if (!ENT || !PECA || !SAI) {
  console.error('uso: node test/converter-fundo.js <entrada> <alto|baixo> <saida.png> [cores]');
  process.exit(1);
}
// 720x1279 é a pintura inteira e o chão fica a 75% dela: 959 acima, 320 abaixo.
const ALVO = PECA === 'alto' ? { w: 720, h: 959 } : { w: 720, h: 320 };

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.goto(ABRIR('file:///' + path.resolve(ENT).replace(/\\/g, '/')));

  const r = await pg.evaluate(async function (args) {
    const im = document.querySelector('img');
    await im.decode();
    const iw = im.naturalWidth, ih = im.naturalHeight;

    // 1. recorte ao centro na proporção do alvo
    const pAlvo = args.w / args.h, pEnt = iw / ih;
    let cw, ch;
    if (pEnt > pAlvo) { ch = ih; cw = Math.round(ih * pAlvo); }
    else { cw = iw; ch = Math.round(iw / pAlvo); }
    const cx0 = Math.round((iw - cw) / 2), cy0 = Math.round((ih - ch) / 2);

    // 2. redução por área
    const c = document.createElement('canvas');
    c.width = args.w; c.height = args.h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    x.drawImage(im, cx0, cy0, cw, ch, 0, 0, args.w, args.h);

    const dado = x.getImageData(0, 0, args.w, args.h);
    const d = dado.data;
    const antes = new Set();
    for (let i = 0; i < d.length; i += 4) antes.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);

    // 3. quantização por popularidade num cubo de 32 níveis por canal
    const conta = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      conta.set(k, (conta.get(k) || 0) + 1);
    }
    const pal = [...conta.entries()].sort((a, b) => b[1] - a[1]).slice(0, args.cores)
      .map(function (e) {
        const k = e[0];
        return [((k >> 10) & 31) * 8 + 4, ((k >> 5) & 31) * 8 + 4, (k & 31) * 8 + 4];
      });

    const cache = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      let p = cache.get(k);
      if (p === undefined) {
        let melhor = 0, dist = Infinity;
        for (let j = 0; j < pal.length; j++) {
          const dr = d[i] - pal[j][0], dg = d[i + 1] - pal[j][1], db = d[i + 2] - pal[j][2];
          const v = dr * dr + dg * dg + db * db;
          if (v < dist) { dist = v; melhor = j; }
        }
        p = melhor; cache.set(k, p);
      }
      d[i] = pal[p][0]; d[i + 1] = pal[p][1]; d[i + 2] = pal[p][2];
    }
    x.putImageData(dado, 0, 0);

    return { dados: c.toDataURL('image/png'), entrada: iw + 'x' + ih,
             recorte: cw + 'x' + ch, coresAntes: antes.size, coresDepois: pal.length };
  }, { w: ALVO.w, h: ALVO.h, cores: CORES });

  require('fs').writeFileSync(SAI, Buffer.from(r.dados.split(',')[1], 'base64'));
  console.log('entrada ' + r.entrada + ' -> recorte ' + r.recorte + ' -> ' + ALVO.w + 'x' + ALVO.h);
  console.log('cores ' + r.coresAntes + ' -> ' + r.coresDepois);
  console.log('gravado: ' + SAI);
  await nav.close();
})();
