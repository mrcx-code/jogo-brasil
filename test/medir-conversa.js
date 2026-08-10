// MEDE AS TRÊS QUEIXAS DO DONO ("objetos aleatórios · fundos que não fazem sentido ·
// imagens que não se conversam"), cena a cena, sem supor nada.
//
// 1. OBJETOS POR CAPÍTULO — imprime, para cada capítulo, qual índice de arte cai em
//    MOB_B64/DROP_B64/FRENTE_CAP e o tamanho na tela. Índice errado = objeto de outro século.
// 2. A EMENDA DO FUNDO — a peça de CIMA rola a `paralaxeLonge` (0,45) e a de BAIXO a 1:1,
//    e AS DUAS espelham cópias alternadas. Como os deslocamentos são diferentes, a PARIDADE
//    do espelho diverge: metade do tempo o céu está espelhado sobre um chão que não está.
//    Mede-se pela DESCONTINUIDADE na linha da emenda: média |ΔRGB| entre a última linha da
//    peça de cima e a primeira da de baixo, varrendo worldX. Referência: a mesma medida com
//    paralaxeLonge = 0 (as duas peças na mesma fase) é o piso do que a pintura permite.
// 3. CONVERSA DE PALETA — luma média e matiz dominante de cada bloco de arte (mob, drop,
//    vegetação de frente, personagem) contra a luma da FAIXA DA PINTURA onde ele é desenhado.
//    Contraste alto demais = "colado de outro jogo".
//
// node test/medir-conversa.js [index.html] [prefixo-dos-prints]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
const ARQ = process.argv[2] || path.resolve(__dirname, '..', 'index.html');
const PREFIXO = process.argv[3] || 'CONV-A';

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE-ERR', m.text()); });
  await page.goto(ABRIR('file://' + path.resolve(ARQ)));
  await page.waitForTimeout(900);
  await page.evaluate(() => { fecharTelas(); fecharTudo(); });

  // ---------- 1. o censo por capítulo ----------
  const censo = await page.evaluate(() => {
    const out = [];
    for (let e = 0; e < EPOCAS.length; e++) {
      const cena0 = cenarioDaEpoca(e);
      S.cenario = cena0;
      S.energiaTotal = LIMIAR_CENA * cena0 + 10;
      const cap = capArte();
      const mob = {};
      ['smog', 'drum', 'cash'].forEach(function (k) {
        const im = MOB_SPR[k][cap] || MOB_SPR[k][0];
        mob[k] = { idx: MOB_SPR[k][cap] ? cap : 0, w: im && im.naturalWidth, h: im && im.naturalHeight };
      });
      const lista = DROP_SPR[cap] || DROP_SPR[0];
      out.push({
        epoca: e, nome: EPOCAS[e].nome, cena0: cena0, cenas: EPOCAS[e].cenas,
        capArte: cap,
        passoCap: PASSO_CAP[cap] ? +PASSO_CAP[cap].passo.toFixed(3) : null,
        mob: mob,
        dropIdxUsado: DROP_SPR[cap] ? cap : 0, dropN: lista.length,
        frenteCap: FRENTE_CAP[cap], frenteBloco: frenteBloco(),
        pinturas: EPOCAS[e].cenas
      });
    }
    return { caps: out, nMob: MOB_SPR.smog.length, nDrop: DROP_SPR.length,
             nFrentePacotes: Math.floor(FRENTE_SPR.length / 8), nPinturas: CENARIO_ALTO.length,
             totalCenas: TOTAL_CENAS, nCeu: CEU_PINT.length, nHero: HERO_CAP_B64.length,
             nPasso: PASSO_CAP.length, nRetrato: RETRATO_SPR.length };
  });
  console.log('=== 1. CENSO POR CAPÍTULO ===');
  console.log(JSON.stringify(censo, null, 1));

  // ---------- 2. o fundo: simetria de espelho e o degrau da emenda ----------
  // Duas medidas, porque o espelho troca um defeito por outro e é preciso ver os dois:
  //   SIMETRIA — para cada quadro, a melhor razão de simetria em torno de um eixo vertical
  //   dentro da tela. Uma junta espelhada é uma reflexão PERFEITA, então ela não deixa
  //   descontinuidade nenhuma; o que ela deixa é um eixo. Em mata ninguém acha o eixo; em
  //   fachada ele é uma catedral impossível. Conta-se a fração de quadros com eixo forte.
  //   DEGRAU DA EMENDA — média |ΔRGB| entre a linha logo acima e a logo abaixo da junta
  //   horizontal entre a peça de cima e a de baixo. Alto = corte de barbeiro.
  console.log('\n=== 2. FUNDO: eixo de espelho em cena + degrau da emenda ===');
  const emenda = await page.evaluate(async () => {
    const fc = document.getElementById('fundoHD');
    function amostra() {
      const g = fundoGeo; const fx = fc.getContext('2d');
      const yTopo = Math.round(g.dy + g.dh * FUNDO_GROUND_SRC * 0.45);
      const largura = Math.min(g.cw, 720);
      const x0 = Math.round((g.cw - largura) / 2);
      const lin = fx.getImageData(x0, yTopo, largura, 1).data;
      // melhor eixo de simetria: varre eixos e mede a diferença média dos pares refletidos
      let melhor = 1e9;
      for (let eixo = 80; eixo < largura - 80; eixo += 4) {
        const alcance = Math.min(eixo, largura - eixo, 120);
        let s = 0, n = 0;
        for (let d = 2; d < alcance; d += 2) {
          const a = (eixo - d) * 4, b = (eixo + d) * 4;
          s += Math.abs(lin[a] - lin[b]) + Math.abs(lin[a + 1] - lin[b + 1]) + Math.abs(lin[a + 2] - lin[b + 2]);
          n += 3;
        }
        if (n) { const m = s / n; if (m < melhor) melhor = m; }
      }
      // degrau da emenda horizontal
      const y = Math.round(g.dy + g.dh * FUNDO_GROUND_SRC);
      let s2 = 0;
      if (y > 3 && y < g.ch - 3) {
        const a = fx.getImageData(0, y - 3, g.cw, 1).data;
        const b = fx.getImageData(0, y + 2, g.cw, 1).data;
        for (let i = 0; i < g.cw; i++)
          s2 += Math.abs(a[i * 4] - b[i * 4]) + Math.abs(a[i * 4 + 1] - b[i * 4 + 1]) + Math.abs(a[i * 4 + 2] - b[i * 4 + 2]);
        s2 = s2 / g.cw / 3;
      }
      return { sim: melhor, deg: s2 };
    }
    const res = [];
    for (let cena = 0; cena < TOTAL_CENAS; cena++) {
      fundoAtivo = cena;
      let eixos = 0, simMin = 1e9, degSoma = 0, n = 0;
      for (let k = 0; k < 52; k++) {
        worldX = k * 26;            // 52 passos cobrem ~1216 px de mundo = um período inteiro
        redesenharFundo();
        const a = amostra();
        if (a.sim < 6) eixos++;     // 6/255 é "reflexão praticamente exata"
        if (a.sim < simMin) simMin = a.sim;
        degSoma += a.deg; n++;
      }
      res.push({ cena: cena, fracComEixo: +(eixos / n).toFixed(2), simMin: +simMin.toFixed(1),
                 degrauEmenda: +(degSoma / n).toFixed(1) });
    }
    fundoAtivo = -1; worldX = 0; redesenharFundo();
    return res;
  });
  for (const r of emenda) console.log(JSON.stringify(r));

  // ---------- 3. conversa de paleta ----------
  console.log('\n=== 3. PALETA: luma media (0-255) por bloco de arte x faixa da pintura ===');
  const paleta = await page.evaluate(() => {
    function lumaDe(img, alvoH) {
      if (!img || !img.complete || !img.naturalWidth) return null;
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let l = 0, r = 0, g2 = 0, b2 = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue;
        l += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        r += d[i]; g2 += d[i + 1]; b2 += d[i + 2]; n++;
      }
      if (!n) return null;
      return { luma: +(l / n).toFixed(1), rgb: [Math.round(r / n), Math.round(g2 / n), Math.round(b2 / n)], px: n };
    }
    // luma da pintura na faixa onde o objeto vive (chão, logo abaixo da emenda)
    function lumaPintura(cena) {
      fundoAtivo = cena; worldX = 0; redesenharFundo();
      const fc = document.getElementById('fundoHD'); const g = fundoGeo;
      const fx = fc.getContext('2d');
      const y0 = Math.round(g.dy + g.dh * FUNDO_GROUND_SRC);
      const h = Math.max(4, Math.min(g.ch - y0 - 1, Math.round(g.ch * 0.10)));
      const d = fx.getImageData(0, y0, g.cw, h).data;
      let l = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { l += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
      return +(l / n).toFixed(1);
    }
    const out = [];
    for (let e = 0; e < EPOCAS.length; e++) {
      const cena0 = cenarioDaEpoca(e);
      S.cenario = cena0; S.energiaTotal = LIMIAR_CENA * cena0 + 10;
      const cap = capArte();
      const fundo = lumaPintura(cena0);
      const blocos = {};
      ['smog', 'drum', 'cash'].forEach(function (k) { blocos['mob.' + k] = lumaDe(MOB_SPR[k][cap] || MOB_SPR[k][0]); });
      const dl = DROP_SPR[cap] || DROP_SPR[0];
      dl.forEach(function (im, i) { blocos['drop.' + i] = lumaDe(im); });
      const bl = frenteBloco();
      if (bl >= 0) {
        let l = 0, n = 0;
        for (let i = 0; i < 8; i++) { const v = lumaDe(FRENTE_SPR[bl + i]); if (v) { l += v.luma; n++; } }
        blocos['frente(media 8)'] = n ? { luma: +(l / n).toFixed(1) } : null;
      } else blocos['frente(media 8)'] = null;
      const hs = (typeof HERO_SPR_CAP !== 'undefined') ? (HERO_SPR_CAP[cap] || HERO_SPR_CAP[0]) : null;
      const hi = hs && (hs.walk ? hs.walk[0] : (hs[0] && hs[0][0]) || hs[0]);
      blocos['heroi'] = lumaDe(hi);
      out.push({ epoca: e, nome: EPOCAS[e].nome, cap: cap, lumaChaoPintura: fundo, blocos: blocos });
    }
    fundoAtivo = -1; worldX = 0; redesenharFundo();
    return out;
  });
  for (const p of paleta) {
    console.log('--- ' + p.nome + ' (cap arte ' + p.cap + ') | chão da pintura luma ' + p.lumaChaoPintura);
    for (const k in p.blocos) {
      const b = p.blocos[k];
      if (!b) { console.log('   ' + k.padEnd(16) + ' —'); continue; }
      const d = (b.luma - p.lumaChaoPintura);
      console.log('   ' + k.padEnd(16) + ' luma ' + String(b.luma).padStart(6) +
        '  Δ ' + (d >= 0 ? '+' : '') + d.toFixed(1) + (b.rgb ? '  rgb ' + b.rgb.join(',') : ''));
    }
  }

  // ---------- prints: um por capítulo, com objetos plantados ----------
  for (let e = 0; e < censo.caps.length; e++) {
    await page.evaluate((e) => {
      fecharTelas(); fecharTudo();
      const c0 = cenarioDaEpoca(e);
      S.cenario = c0; S.energiaTotal = LIMIAR_CENA * c0 + 10; S.energia = 1e6;
      fundoAtivo = -1; worldX = 400;
      mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
      redesenharFundo();
      // um de cada objeto atravessando, e um de cada drop no chão — SEMPRE pelos construtores
      // do próprio jogo: um objeto montado à mão aqui perde campos (`t`, `spawn`) e o desenho
      // cai em NaN, que pinta um halo claro e me faria acusar o jogo do defeito do instrumento.
      ['smog', 'barrel', 'cash'].forEach(function (t, i) {
        mobs.push(novoMob(t, worldX + 70 + i * 100));
      });
      ['smog', 'barrel', 'cash'].forEach(function (t, i) {
        soltarDrop({ type: t }, 120 + i * 100);
      });
    }, e);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.resolve(__dirname, PREFIXO + '-cap' + e + '-' + censo.caps[e].nome.replace(/\s+/g, '_') + '.png') });
  }
  console.log('\nprints ' + PREFIXO + '-cap*.png em test/');
  await browser.close();
})();
