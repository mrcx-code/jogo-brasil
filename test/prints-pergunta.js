// PRINTS DA PERGUNTA DO FIM — e da tela de AJUSTES que ela obrigou a reescrever.
//
// A pergunta ("você voltaria amanhã?") mora na CHEGADA, entre o placar e as duas portas. O
// encaixe.js bloco 19 prova que ela existe, que não insiste e que não é pedágio; o que ele NÃO
// prova é se ela cabe na tela, se lê como o resto do jogo, e se as três tábuas não estouram a
// linha num aparelho estreito. Isso só o olho responde — daí este instrumento.
//
//   node test/prints-pergunta.js
//
// Três larguras, porque a CHEGADA é a tela mais alta do jogo e a única que já transbordou:
// 390×844 (a régua), 360×640 e 320×568 (o piso do que ainda se vende).
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
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.ALVO || 'index.html'));
const TELAS = [[390, 844], [360, 640], [320, 568]];

(async () => {
  const b = await chromium.launch({ executablePath: chromiumPath() });
  for (const [w, h] of TELAS) {
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await p.goto(ALVO);
    await p.waitForTimeout(900);
    // uma partida que chegou ao fim de verdade: o placar cheio é o vizinho de cima da pergunta,
    // e é com ele na tela que se julga se ela pesa demais
    const medida = await p.evaluate(async () => {
      fecharTudo(); fecharTelas();
      R.volta = 0; R.chegou = 1; R.historia = 2; R.fontes = 0; R.dias = 2; R.segundos = 2100;
      S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.travessias = 1;
      montarFim(); abrirTela('telaFim');
      await new Promise(r => setTimeout(r, 250));
      const t = document.getElementById('telaFim');
      const cx = document.getElementById('fimPergunta');
      const bts = [...document.querySelectorAll('#fimPerguntaBotoes .perguntaBtn')];
      return {
        // transborda? a tela rola, então o número que interessa é quanto passa da dobra
        sobra: t.scrollHeight - t.clientHeight,
        // e as três tábuas: mesma largura entre si, e o rótulo cabendo dentro delas
        tabuas: bts.map(function (e) {
          const r = e.getBoundingClientRect();
          const c = e.querySelector('canvas');
          const cw = c ? c.getBoundingClientRect().width : 0;
          return { l: Math.round(r.width), rotulo: Math.round(cw), folga: Math.round(r.width - cw) };
        }),
        papel: Math.round(cx.getBoundingClientRect().width)
      };
    });
    await p.screenshot({ path: path.resolve(__dirname, 'P-pergunta-' + w + 'x' + h + '.png') });
    console.log(w + 'x' + h + ' -> papel ' + medida.papel + 'px | tábuas '
      + medida.tabuas.map(t => t.l + '(rótulo ' + t.rotulo + ', folga ' + t.folga + ')').join(' · ')
      + ' | transborda ' + medida.sobra + 'px');
    if (medida.tabuas.some(t => t.folga < 0)) console.log('  !! um rótulo é mais largo que a tábua dele');
    // e o depois do toque: o papel vira anotação e as tábuas somem
    if (w === 390) {
      await p.evaluate(() => document.getElementById('btnVolta1')
        .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
      await p.waitForTimeout(250);
      await p.screenshot({ path: path.resolve(__dirname, 'P-pergunta-respondida.png') });
      // AJUSTES: a tela que teve de contar a verdade nova no mesmo commit
      await p.evaluate(() => { fecharTelas(); montarConfig(); abrirTela('telaConfig'); });
      await p.waitForTimeout(250);
      await p.screenshot({ path: path.resolve(__dirname, 'P-ajustes.png') });
    }
    await p.close();
  }
  await b.close();
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
