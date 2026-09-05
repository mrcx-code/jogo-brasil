// QA ADVERSARIAL 05/09 — A TIRA DE CONTATO TIRADA DO JOGO RODANDO, nao da fonte.
//
// POR QUE ELE EXISTE. As tiras que acompanham a entrega (`test/TIRA-*.png`, `test/CORTE-*.png`)
// foram geradas por quem cortou, a partir da fonte. Elas podem estar certas e ainda assim nao
// provarem nada sobre o JOGO: entre `src/jogo.ts` e o pixel na rua ha o build, o `pack-*.json`,
// o `fetch` do pacote e o desenho de `mobFrame()`. Este arquivo abre o `index.html` construido
// por **http** (nunca `file://` — sob file o fetch do pacote e recusado e o capitulo cai na arte
// do capitulo 1 sem avisar), entra no capitulo pela MESMA porta da entrada de verdade
// (`garantirEpoca`), e desenha os 24 quadros a partir de `GENTE_EP_SPR`, que e o array que o
// desenho le. O que sair daqui e o que a pessoa ve.
//
// SAI: test/QA-TIRA-<cap>.png  (24 quadros, na escala de tela, com o indice por baixo)

//
// USO:  node test/qa-refuta-tira-gente-na-tela.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));

const CAPS = ['praca', 'pindorama', 'temfonte', 'segurou'];

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) erros.push(m.text()); });
  await page.goto(ALVO, { waitUntil: 'load' });
  await page.waitForFunction('typeof EPOCAS !== "undefined" && typeof mobFrame === "function"', { timeout: 30000 });
  console.log('   jogo aberto por ' + ALVO);

  for (const cap of CAPS) {
    const posto = await page.evaluate((cap) => {
      const ep = EPOCAS.findIndex(e => e.id === cap);
      let cen = -1;
      for (let n = 0; n < TOTAL_CENAS; n++) if (epocaDoCenario(n) === ep) { cen = n; break; }
      S.cenario = cen; S.fronteira = Math.max(S.fronteira, cen);
      if (typeof visitando !== 'undefined') visitando = false;
      garantirEpoca(ep);
      return { ep, cen };
    }, cap);
    await page.waitForFunction((cap) => {
      const f = GENTE_EP_SPR[cap];
      if (!f) return false;
      let c = 0; f.forEach(fl => fl.forEach(im => { if (im.complete && im.naturalWidth > 1) c++; }));
      return c === 24;
    }, cap, { timeout: 30000 });

    // A tira: os 24 quadros na ESCALA DE TELA (o jogo normaliza pela altura, `GENTE4_ALVO`),
    // cada um numa celula de largura fixa, com a linha do chao e o centro marcados. E assim que
    // se ve de olho se um passo tem duas pessoas ou meia pessoa.
    const png = await page.evaluate(async (cap) => {
      const folha = GENTE_EP_SPR[cap];
      const ALVO_H = (typeof GENTE4_ALVO !== 'undefined' ? GENTE4_ALVO : 44) * 4; // 4x para caber o olho
      const CEL = 140, PAD = 26;
      const c = document.createElement('canvas');
      c.width = CEL * 8; c.height = (ALVO_H + PAD) * 3;
      const g = c.getContext('2d');
      g.fillStyle = '#181818'; g.fillRect(0, 0, c.width, c.height);
      g.imageSmoothingEnabled = false;
      g.font = '13px monospace'; g.textAlign = 'center';
      for (let f = 0; f < 3; f++) for (let q = 0; q < 8; q++) {
        const im = folha[f][q];
        const sc = ALVO_H / im.naturalHeight;
        const dw = im.naturalWidth * sc, dh = ALVO_H;
        const cx = q * CEL + CEL / 2, base = f * (ALVO_H + PAD) + ALVO_H;
        g.strokeStyle = '#2f2f2f'; g.beginPath();
        g.moveTo(q * CEL, base + 0.5); g.lineTo(q * CEL + CEL, base + 0.5); g.stroke();
        g.strokeStyle = '#4b3a1a'; g.beginPath();
        g.moveTo(cx + 0.5, base - ALVO_H); g.lineTo(cx + 0.5, base); g.stroke();  // o CENTRO da celula = a ancora
        g.drawImage(im, cx - dw / 2, base - dh, dw, dh);
        g.fillStyle = '#c9c9c9';
        g.fillText('f' + f + 'q' + q + '  ' + im.naturalWidth + 'x' + im.naturalHeight, cx, base + 17);
      }
      return c.toDataURL('image/png');
    }, cap);
    fs.writeFileSync(path.join(__dirname, 'QA-TIRA-' + cap + '.png'),
      Buffer.from(png.slice(png.indexOf(',') + 1), 'base64'));

    // NAO SE TIRA PRINT DA RUA AQUI, e a razao vale escrita para ninguem tentar de novo achando
    // que esta acrescentando prova. Tentei: `garantirEpoca` carrega a arte mas deixa o MENU na
    // tela, e o `tap('#btnJogar')` daqui nao atravessa (o veu de volta esta sobre o botao — e o
    // `smoke.js` que sabe a sequencia inteira de entrar). O print saia do menu, sem uma pedestre
    // dentro, e um print que nao mostra o que o nome dele promete e pior que print nenhum.
    // O caminho que PROVA e o de cima: `GENTE_EP_SPR` lido DEPOIS de o pacote do capitulo chegar,
    // que e o mesmo array de onde `desenharGente` tira o quadro. E `qa-praca-o-que-a-pessoa-ve.js`
    // fecha o resto, desenhando os 24 passos por `mobFrame()` — a escolha de quadro do motor.
    console.log('   ' + cap.padEnd(11) + ' epoca ' + posto.ep + ' cena ' + posto.cen +
      ' -> test/QA-TIRA-' + cap + '.png');
  }

  await nav.close();
  if (erros.length) { console.error('\nERRO DE CONSOLE: ' + erros.slice(0, 3).join(' | ')); process.exit(1); }
  console.log('\nPRINTS GERADOS — olhe. O teste nao diz que ficou bom, so que nao quebrou.');
})().catch(e => { console.error(e); process.exit(1); });
