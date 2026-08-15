// REPRODUTOR DO BLOCO INTERMITENTE DO MUTIRÃO.
//
//   node test/repro-obra.js [voltas]
//
// O `npm test` falha em ~metade das execuções neste bloco, e cada rodada dele custa minutos.
// Este arquivo roda SÓ o bloco, N vezes, no mesmo navegador — dá dezenas de amostras no tempo
// de uma execução do smoke, que é o que separa "hipótese" de "causa".
//
// A hipótese herdada (PENDENTES.md §13, escrita por outra sessão e NÃO confirmada): o preparo
// semeia `energiaTotal` a 90% do vão da última cena, e o `clicar()` que o pointerdown dispara
// empurraria o total por cima da fronteira de cena durante o gesto; a fala que abre aí derruba
// `obraPodeArmar()`. Aqui isso é medido em vez de suposto — a cada volta o instrumento guarda
// o estado ANTES e DEPOIS do gesto e diz o que mudou nas voltas que falham.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const VOLTAS = parseInt(process.argv[2] || '12', 10);

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/')));
  await pg.waitForTimeout(1200);

  const linhas = [];
  for (let v = 0; v < VOLTAS; v++) {
    // ---- o mesmo preparo do smoke.js, palavra por palavra ----
    const prep = await pg.evaluate(() => {
      fecharTelas(); fecharTudo();
      const c0 = cenarioDaEpoca(CAP_GENTE);
      S.cenario = c0; S.fronteira = Math.max(S.fronteira | 0, c0);
      S.energiaTotal = LIMIAR_CENA * c0 + LIMIAR_CENA * EPOCAS[CAP_GENTE].cenas * 0.9;
      S.energia = 1e6; S.u3 = false; S.u4 = false;
      S.aberturas = MASCARA_EPOCAS; S.fechos = 0; S.marcos = MASCARA_MARCOS;
      S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = 20;
      S.recursos = { flor: 200, agua: 200, refeicao: 200 };
      S.obra = { roca: 0, palicada: 0, casa: 0 };
      mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
      const ini = LIMIAR_CENA * cenarioDaEpoca(CAP_GENTE);
      const span = LIMIAR_CENA * EPOCAS[CAP_GENTE].cenas;
      return { golpe: ganhoClique(), span, ini, frac: (S.energiaTotal - ini) / span,
        ateAFronteira: ini + span - S.energiaTotal, cenas: EPOCAS[CAP_GENTE].cenas };
    });
    await pg.waitForTimeout(300);
    await pg.evaluate(() => { canteiros.length = 0; canteiros.push({ tipo: 'roca', wx: worldX + HX }); });

    const r = await pg.evaluate(() => {
      const b = document.getElementById('scene').getBoundingClientRect();
      return { x: b.left + b.width * 0.75, y: b.top + b.height * 0.45 };
    });
    const antes = await pg.evaluate(() => ({
      obra: S.obra.roca + S.obra.palicada + S.obra.casa, total: S.energiaTotal, x: worldX,
      cena: S.cenario, podeArmar: obraPodeArmar(), faixa: faixaViva(), cant: !!canteiroNaTela()
    }));
    await pg.mouse.move(r.x, r.y);
    await pg.mouse.down();
    await new Promise(res => setTimeout(res, 500));
    const armado = await pg.evaluate(() => ({
      x: worldX, dedo: obraDedo, trab: obraTrabalhando, pode: obraPodeArmar(),
      fala: falaAberta(), tela: telaAberta(), cena: S.cenario, total: S.energiaTotal
    }));
    await new Promise(res => setTimeout(res, 2100));
    const meio = await pg.evaluate(() => ({
      obra: S.obra.roca + S.obra.palicada + S.obra.casa, total: S.energiaTotal,
      x: worldX, trab: obraTrabalhando, cena: S.cenario
    }));
    await pg.mouse.up();
    await pg.waitForTimeout(120);

    const pontos = meio.obra - antes.obra;
    const andouDepois = Math.round(meio.x - armado.x);
    const ok = pontos >= 2 && Math.abs(andouDepois) <= 4;
    linhas.push({ v, ok, pontos, andouDepois, prep, antes, armado, meio });
    console.log((ok ? '  ok  ' : '  ✗   ') + 'volta ' + String(v).padStart(2) +
      ' | pontos ' + String(pontos).padStart(3) +
      ' | andou depois de armar ' + String(andouDepois).padStart(4) + 'px' +
      ' | cena ' + antes.cena + '→' + meio.cena +
      ' | armou? dedo=' + (armado.dedo > 0) + ' trab=' + armado.trab +
      ' | na hora de armar: pode=' + armado.pode + ' fala=' + armado.fala + ' tela=' + armado.tela);
  }

  const maus = linhas.filter(l => !l.ok);
  console.log('\n=== ' + (linhas.length - maus.length) + ' de ' + linhas.length + ' passaram ===');
  const p = linhas[0].prep;
  console.log('golpe vale ' + p.golpe.toFixed(1) + ' | vão da cena ' + p.span +
    ' | semeado a ' + (p.frac * 100).toFixed(0) + '% | falta ' + p.ateAFronteira.toFixed(0) +
    ' para a fronteira de cena');
  if (maus.length) {
    console.log('\nnas voltas que falharam:');
    console.log('  mudou de cena durante o gesto: ' + maus.filter(l => l.meio.cena !== l.antes.cena).length + '/' + maus.length);
    console.log('  fala aberta no instante de armar: ' + maus.filter(l => l.armado.fala).length + '/' + maus.length);
    console.log('  tela aberta no instante de armar: ' + maus.filter(l => l.armado.tela).length + '/' + maus.length);
    console.log('  obraDedo continuou zero: ' + maus.filter(l => !(l.armado.dedo > 0)).length + '/' + maus.length);
    console.log('  podeArmar era false ANTES do gesto: ' + maus.filter(l => !l.antes.podeArmar).length + '/' + maus.length);
    console.log('  canteiro sumiu antes do gesto: ' + maus.filter(l => !l.antes.cant).length + '/' + maus.length);
    console.log('  faixa morta antes do gesto: ' + maus.filter(l => !l.antes.faixa).length + '/' + maus.length);
  }
  console.log('\nerros de console: ' + (erros.length ? erros[0] : '(nenhum)'));
  await nav.close();
})();
