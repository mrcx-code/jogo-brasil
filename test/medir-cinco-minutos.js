// OS PRIMEIROS CINCO MINUTOS — a lente que nunca tinha sido usada (18/08).
//
// A pergunta da seção 6 do CLAUDE.md é "alguém que abre agora entende o que fazer? Onde trava?".
// Este instrumento não responde à segunda metade — travar é coisa de gente, e eu não sou gente
// abrindo o jogo pela primeira vez. Ele responde à primeira metade com número: O QUE ESTÁ NA
// TELA, EM QUE ORDEM, e QUANTO TEMPO até a primeira coisa que se pode tocar.
//
// Ele NÃO toca em nada antes de medir o que aparece sozinho. Isso é de propósito: metade das
// perguntas de primeiro minuto é sobre o que o jogo faz sem ser pedido.
// VISIVEL DE VERDADE, e isto custou uma tentativa: `offsetParent !== null` conta botao de tela
// FECHADA, porque as telas deste jogo ficam no layout e somem por visibility/opacity. A primeira
// rodada listou os 24 botoes do jogo inteiro como tocaveis no segundo 2. `checkVisibility` com
// as duas flags honra CSS e e o unico teste que responde a pergunta certa.
const VIS = "e => !!e && e.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true })";
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));
const rot = process.argv[2] || '';

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));

  const t0 = Date.now();
  await pg.goto(ALVO);

  // ===== 1 · A LINHA DO TEMPO DO QUE APARECE, sem ninguém tocar em nada =====
  const linha = [];
  let anterior = '';
  for (let i = 0; i < 120; i++) {            // 120 × 100 ms = 12 s de observação
    const agora = await pg.evaluate(() => {
      const aberta = [...document.querySelectorAll('.tela.aberta, #retorno.aberto, #cerimonia.aberto')]
        .map(e => e.id).sort().join('+');
      const falaVisivel = (() => {
        const f = document.getElementById('telaFala');
        return f && f.classList.contains('aberta');
      })();
      const btns = [...document.querySelectorAll('#controls button, .telaBtn')]
        .filter(b => b.checkVisibility({checkVisibilityCSS:true,checkOpacity:true}) && !b.disabled)
        .map(b => (b.id || b.textContent || '').trim().slice(0, 14));
      return (aberta || '(rua)') + ' | tocáveis: ' + (btns.join(',') || '(nenhum)') + (falaVisivel ? ' | FALA' : '');
    }).catch(() => '(carregando)');
    if (agora !== anterior) { linha.push({ ms: Date.now() - t0, o: agora }); anterior = agora; }
    await pg.waitForTimeout(100);
  }

  console.log('\n=== 1 · O QUE APARECE SOZINHO, nos primeiros 12 s ' + rot + ' ===');
  linha.forEach(x => console.log('  ' + String(x.ms).padStart(6) + ' ms  ' + x.o));

  await pg.screenshot({ path: path.join(__dirname, '5MIN-1-abertura.png') });

  // ===== 2 · QUANTOS TOQUES ATÉ A RUA, seguindo sempre o botão mais óbvio =====
  // "Mais óbvio" aqui é uma regra fixa e burra de propósito: o botão que o jogo destaca, ou o
  // único visível. Se um humano precisa de mais criatividade que isto, o número está errado
  // para baixo — e é assim que se quer errar num instrumento de primeira impressão.
  let toques = 0;
  const trilha = [];
  for (let i = 0; i < 12; i++) {
    const naRua = await pg.evaluate(() => !document.querySelector('.tela.aberta, #retorno.aberto'));
    if (naRua) break;
    const alvo = await pg.evaluate(() => {
      const vis = e => !!e && e.checkVisibility({checkVisibilityCSS:true,checkOpacity:true}) && !e.disabled;
      const jogar = document.getElementById('btnJogar');
      if (vis(jogar)) return { id: 'btnJogar', txt: (jogar.textContent || '').trim() };
      const pular = document.getElementById('btnFalaPular');
      if (vis(pular)) return { id: 'btnFalaPular', txt: (pular.textContent || '').trim() };
      const fala = document.getElementById('telaFala');
      if (fala && fala.classList.contains('aberta')) return { id: 'telaFala', txt: '(toque para seguir)' };
      const ret = document.getElementById('retorno');
      if (ret && ret.classList.contains('aberto')) return { id: 'retorno', txt: '(toque para fechar)' };
      return null;
    });
    if (!alvo) break;
    trilha.push(alvo.id + ' "' + alvo.txt.replace(/\s+/g, ' ').slice(0, 28) + '"');
    if (alvo.id === 'telaFala' || alvo.id === 'retorno') await pg.touchscreen.tap(195, 400);
    else { const c = await pg.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, alvo.id); await pg.touchscreen.tap(c.x, c.y); }
    toques++;
    await pg.waitForTimeout(900);
  }
  const chegou = Date.now() - t0;
  console.log('\n=== 2 · DA ABERTURA ATÉ A RUA ===');
  trilha.forEach((t, i) => console.log('  toque ' + (i + 1) + ': ' + t));
  console.log('  TOTAL: ' + toques + ' toque(s) · ' + (chegou / 1000).toFixed(1) + ' s desde a carga');
  await pg.screenshot({ path: path.join(__dirname, '5MIN-2-na-rua.png') });

  // ===== 3 · A RUA ENSINA O QUE FAZER? =====
  const rua = await pg.evaluate(() => {
    const vis = e => !!e && e.checkVisibility({checkVisibilityCSS:true,checkOpacity:true});
    const dica = document.getElementById('dicaSeta');
    const rotulo = document.getElementById('cliqueRotulo');
    return {
      naRua: !document.querySelector('.tela.aberta, #retorno.aberto'),
      dicaVisivel: vis(dica),
      dicaTxt: dica ? (dica.textContent || '').trim().slice(0, 40) : null,
      rotuloBotao: rotulo ? (rotulo.textContent || '').trim() : null,
      botoes: [...document.querySelectorAll('#controls button')].filter(vis)
        .map(b => (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18)),
      energia: Math.round(S.energiaTotal), grupo: S.grupo | 0
    };
  });
  // ===== 3b · AS MICRODICAS DISPARAM? =====
  // ELAS SAO DESENHADAS NO CANVAS, nao no DOM, e por isso a primeira versao desta sonda
  // respondeu "dica: NENHUMA" e me fez quase concluir que o jogo nao ensina nada. Ensina:
  // ESQUERDA PULA no primeiro toque na metade direita, SEGURE PARA ALCANCAR no terceiro toque
  // solto, e a seta apontando o contador na primeira pessoa atendida. O que se pergunta ao
  // motor e o PRAZO de cada uma contra o relogio -- viva e prazo no futuro.
  const viva = () => pg.evaluate(() => ({
    pulo: dicaPuloAte > relogio, segurar: dicaSegurarAte > relogio,
    seta: !!document.getElementById("dicaSeta").classList.contains("viva"),
    soltos: toquesSoltos, teto: DICA_TETO_IMPACTO, valem: dicasValem()
  }));
  const antesDeTocar = await viva();
  await pg.touchscreen.tap(300, 500); await pg.waitForTimeout(250);
  const apos1 = await viva();
  await pg.touchscreen.tap(300, 500); await pg.waitForTimeout(200);
  await pg.touchscreen.tap(300, 500); await pg.waitForTimeout(400);
  const apos3 = await viva();
  console.log("" + String.fromCharCode(10) + "=== 3b · AS MICRODICAS ===");
  console.log("  antes de tocar   pulo " + antesDeTocar.pulo + " · segurar " + antesDeTocar.segurar + " · dicas valem " + antesDeTocar.valem);
  console.log("  apos 1 toque     pulo " + apos1.pulo + " · segurar " + apos1.segurar);
  console.log("  apos 3 toques    pulo " + apos3.pulo + " · segurar " + apos3.segurar + " · toques soltos " + apos3.soltos);
  console.log("  teto de impacto em que as dicas param: " + apos3.teto);
  await pg.screenshot({ path: path.join(__dirname, "5MIN-2b-dica.png") });

  console.log('\n=== 3 · O QUE A RUA OFERECE ===');
  console.log('  botões: ' + rua.botoes.join(' · '));
  console.log('  dica na tela: ' + (rua.dicaVisivel ? '"' + rua.dicaTxt + '"' : 'NENHUMA'));
  console.log('  impacto no bolso: ' + rua.energia);

  // ===== 4 · CINCO MINUTOS DE JOGO HONESTO — só tocando, sem saber de upgrade =====
  // O comportamento que se mede é o do primeiro dia de qualquer jogo idle: a pessoa toca a
  // metade direita da tela e vê o que acontece. Não abre menu, não compra nada.
  const marcos = [];
  const alvos = [30, 60, 120, 300];          // segundos
  let seg = 0;
  for (const alvoS of alvos) {
    while (seg < alvoS) {
      await pg.touchscreen.tap(300, 500);
      await pg.waitForTimeout(140);
      seg += 0.14;
    }
    const m = await pg.evaluate(() => ({
      e: Math.round(S.energiaTotal), cen: S.cenario | 0, front: S.fronteira | 0,
      grupo: S.grupo | 0, marcos: S.marcos | 0,
      podeU1: S.energia >= CFG.custoU1, u1: !!S.u1
    }));
    marcos.push({ s: alvoS, ...m });
  }
  console.log('\n=== 4 · CINCO MINUTOS SÓ TOCANDO (sem abrir menu, sem comprar) ===');
  console.log('   tempo   impacto   capítulo   fila   placas vistas   dá para o 1º upgrade?');
  marcos.forEach(m => console.log('  ' + (String(m.s) + 's').padStart(6) + '  ' + String(m.e).padStart(8) +
    '  ' + String(m.cen).padStart(8) + '  ' + String(m.grupo).padStart(5) +
    '  ' + String(m.marcos ? m.marcos.toString(2).split('1').length - 1 : 0).padStart(13) +
    '   ' + (m.podeU1 ? 'sim' : 'não')));

  await pg.screenshot({ path: path.join(__dirname, '5MIN-3-cinco-minutos.png') });
  console.log('\nerros de console: ' + (erros.length ? erros[0] : '(nenhum)'));
  await nav.close();
})();
