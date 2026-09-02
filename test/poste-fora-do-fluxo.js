// POR QUE O POSTE "PRENDE" O BOTÃO — a mecânica medida, pregada como asserção (02/09, QA).
//
// ISTO NASCEU DE DOIS DIAGNÓSTICOS ERRADOS SEGUIDOS SOBRE O MESMO NÚMERO. A `test/regua-larga.js`
// reprova em exatamente 2 das 6 telas largas quando se injeta `#poste{position:absolute}`, e
// duas rodadas seguidas explicaram esse 2/6 de um jeito que a medição não sustenta:
//
//   1ª (QA, 02/09) — "o botão vai parar FORA DA VIEWPORT, por baixo" (receita `top:9999px`).
//   2ª (item regua-terceira-receita, 02/09) — corrigiu a primeira e errou a explicação: escreveu
//      no rodapé da régua que `top:9999px` sem `position:absolute` "não tem efeito nenhum num
//      elemento STATIC", e que as outras quatro telas passam porque "sair do fluxo não desloca
//      nada horizontal o bastante para vazar".
//
// AS DUAS FRASES SÃO FALSAS, e as três asserções abaixo existem para que a terceira rodada não
// tenha de redescobrir isto:
//
//   A. `#poste` NÃO é `static`. `src/estilo.css:659` declara `#poste { position: relative; ... }`
//      — é o que ancora o mastro (`#poste::before`, `position:absolute`). Logo `top` TEM efeito
//      nele, e o exit 0 daquela receita nunca teve nada a ver com `position:static`.
//   B. `top:9999px` DESLOCA o botão 9999 px para baixo NAS SEIS TELAS. Ele passa porque
//      `#telaMenu` tem `overflow-y:auto` e o deslocamento relativo ENTRA na região de overflow
//      rolável: `scrollHeight` cresce ~9999 px, e o resgate por rolagem da régua alcança o botão
//      de verdade — do jeito que o dedo alcançaria. Passar está CERTO; a razão escrita é que não.
//   C. O que separa as 2 telas que mordem das 4 que não é o EIXO do transbordo, não a "faixa do
//      layout". Com a receita LITERAL do rodapé (`position:absolute; top:0`), tablet paisagem,
//      notebook e ultrawide TAMBÉM saem da janela — para BAIXO, 384, 384 e 392 px medidos — e
//      são resgatadas pela rolagem vertical; landscape 899 e phone deitado 926 saem PELA
//      DIREITA, e a régua não rola no eixo X — só mexe `scrollTop`. Só tablet retrato não sai
//      da janela por eixo nenhum, e é a única das seis cujo `#telaMenu` é `flex`, não `grid`.
//
// O QUE ISTO REVELAVA E FICOU FECHADO em 02/09 (item `regua-eixo-x-nao-olhado`, dev-jogo): nas
// duas telas que mordem, `#telaMenu` tem `overflow-x: auto` computado e `scrollWidth >
// clientWidth` — um dedo real PODERIA arrastar de lado e chegar ao botão. A DECISÃO, com
// medição: CONTA COMO PRESO mesmo assim — `sobraX` é 0 nas seis telas largas em produção
// (medido, sem defeito nenhum) e `overflow-x` nunca é declarado em `estilo.css` para
// `#telaMenu` (só `overflow-y: auto`), então o eixo X só existe como efeito colateral do spec
// quando algo já quebrou, não como affordance real. O que MUDOU foi a mensagem: antes imprimia
// só "(top …, bottom …, janela …)" para uma falha horizontal, o que fazia quem lesse concluir
// "está abaixo da dobra" — o erro da 1ª rodada. `test/regua-larga.js` agora imprime
// `left`/`right`/`largura` também, sempre. O aviso `⚠` abaixo (bloco C) continua de propósito,
// como registro do NÚMERO que sustentou a decisão — não é mais um achado em aberto.
//
// AUTOTESTE (lição EQUIPE.md 2.8): `POSTE_CONTROLE=1` inverte a expectativa da asserção A
// (passa a exigir `static`, que é a frase falsa do rodapé) e o portão TEM de sair 1.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));

const TELAS = [
  { nome: 'tablet retrato', w: 768, h: 1024 },
  { nome: 'tablet paisagem', w: 1024, h: 768 },
  { nome: 'notebook', w: 1366, h: 768 },
  { nome: 'landscape 899', w: 899, h: 500 },
  { nome: 'phone deitado 926', w: 926, h: 428 },
  { nome: 'ultrawide 1920', w: 1920, h: 1080 },
];
// as duas que a régua reprova com `position:absolute` — o par medido, não chutado
const MORDEM = new Set(['landscape 899', 'phone deitado 926']);

let falhas = 0;
function ok(cond, msg) {
  console.log((cond ? '  ok  ' : '  FALHA  ') + msg);
  if (!cond) falhas++;
  return cond;
}

// a mesma espera de mobília parada que a `regua-larga.js` usa (PENDENTES 69/70c) — sem ela a
// geometria é lida com o `brota .42s` ainda andando
async function telaParada(pg, id) {
  return await pg.evaluate(async (id) => {
    const tela = document.getElementById(id);
    if (!tela) return false;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const vivas = (tela.getAnimations ? tela.getAnimations({ subtree: true }) : [])
      .filter(a => a.animationName !== 'respira' && a.playState !== 'idle')
      .filter(a => !(a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity))
      .map(a => a.finished.catch(() => {}));
    await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 20000))]);
    await new Promise(r => requestAnimationFrame(r));
    return true;
  }, id);
}

async function medir(nav, t, css) {
  const pg = await nav.newPage();
  await pg.setViewportSize({ width: t.w, height: t.h });
  await pg.goto(ALVO);
  await pg.waitForFunction(() => typeof S !== 'undefined' && !!document.getElementById('telaMenu')
    && document.getElementById('telaMenu').classList.contains('aberta'), null, { timeout: 30000 }).catch(() => {});
  await telaParada(pg, 'telaMenu');
  if (css) await pg.addStyleTag({ content: css + '\n#poste{--posteSonda:1}' });
  const m = await pg.evaluate(() => {
    const menu = document.getElementById('telaMenu');
    const poste = document.getElementById('poste');
    const cfg = document.getElementById('btnConfig');
    const csP = getComputedStyle(poste), csM = getComputedStyle(menu);
    const J = innerHeight, L = innerWidth;
    const cabe = (r) => r.top >= -2 && r.bottom <= J + 2 && r.left >= -2 && r.right <= L + 2;
    const antes = cfg.getBoundingClientRect();
    const rolouY = [];
    if (!cabe(antes)) {
      // o MESMO resgate da regua-larga.js: só `scrollTop`, só quem tem overflow-y rolável
      for (let p = cfg.parentElement; p; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && p.scrollHeight - p.clientHeight > 1) {
          p.scrollTop = p.scrollHeight; rolouY.push(p.id || p.tagName);
        }
        if (p === menu) break;
      }
    }
    const dep = cfg.getBoundingClientRect();
    return {
      // a sonda prova que a regra INJETADA casou o #poste — injeção que não casa nada também
      // daria exit 0 e pareceria confirmar qualquer tese
      casou: csP.getPropertyValue('--posteSonda').trim() === '1',
      postePos: csP.position,
      menuOverflowY: csM.overflowY, menuOverflowX: csM.overflowX,
      menuSobraY: menu.scrollHeight - menu.clientHeight,
      menuSobraX: menu.scrollWidth - menu.clientWidth,
      cfgTopo: antes.top, cfgDir: antes.right, cfgEsq: antes.left, cfgBase: antes.bottom,
      vazaX: antes.right > L + 2 || antes.left < -2,
      vazaY: antes.bottom > J + 2 || antes.top < -2,
      cabeAntes: cabe(antes), cabeDepois: cabe(dep), rolouY: rolouY,
      J: J, L: L,
    };
  });
  await pg.close();
  return m;
}

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const CONTROLE = process.env.POSTE_CONTROLE === '1';
  console.log('=== o poste fora do fluxo: a mecânica do 2-de-6, medida'
    + (CONTROLE ? '  [CONTROLE LIGADO: a asserção A é invertida e TEM de falhar]' : ''));

  // ---------- A · o #poste não é `static` (a frase do rodapé da régua) ----------
  console.log('\nA · `position` computado do #poste, sem defeito nenhum');
  const limpo = {};
  for (const t of TELAS) {
    const m = await medir(nav, t, null);
    limpo[t.nome] = m;
    const esperado = CONTROLE ? 'static' : 'relative';
    ok(m.postePos === esperado, t.nome.padEnd(18) + ' #poste position = ' + m.postePos
      + ' (esperado ' + esperado + ')');
  }

  // ---------- B · `top` MOVE o poste, e quem salva é a rolagem ----------
  console.log('\nB · `#poste{top:9999px}` SEM position:absolute — desloca, e o overflow-y resgata');
  for (const t of TELAS) {
    const m = await medir(nav, t, '#poste{top:9999px!important}');
    if (!ok(m.casou, t.nome.padEnd(18) + ' a regra injetada CASOU o #poste')) continue;
    const desl = m.cfgTopo - limpo[t.nome].cfgTopo;
    ok(desl > 9990 && desl < 10010, t.nome.padEnd(18) + ' o botão desceu ' + desl.toFixed(0)
      + ' px — `top` TEM efeito (a frase "não tem efeito num elemento static" é falsa)');
    ok(m.menuOverflowY === 'auto' && m.menuSobraY > 9990, t.nome.padEnd(18)
      + ' #telaMenu overflow-y=' + m.menuOverflowY + ' e ganhou ' + m.menuSobraY
      + ' px de rolagem — é ISTO que devolve o botão, não `position:static`');
    ok(!m.cabeAntes && m.cabeDepois && m.rolouY.length > 0, t.nome.padEnd(18)
      + ' fora da janela antes, DENTRO depois de rolar ' + (m.rolouY.join(',') || '(nada)')
      + ' — passa com razão, por razão errada no rodapé');
  }

  // ---------- C · o eixo do transbordo é o que separa 2 de 6 ----------
  console.log('\nC · a receita do rodapé, `#poste{position:absolute;top:0}` — quem morde vaza pela DIREITA, quem passa vaza por BAIXO e é resgatado');
  for (const t of TELAS) {
    const m = await medir(nav, t, '#poste{position:absolute!important;top:0px!important}');
    if (!ok(m.casou, t.nome.padEnd(18) + ' a regra injetada CASOU o #poste')) continue;
    const info = 'cfg ' + m.cfgEsq.toFixed(0) + '..' + m.cfgDir.toFixed(0) + ' x '
      + m.cfgTopo.toFixed(0) + '..' + m.cfgBase.toFixed(0) + ' · janela ' + m.L + 'x' + m.J;
    if (MORDEM.has(t.nome)) {
      ok(m.vazaX && !m.vazaY, t.nome.padEnd(18) + ' vaza pela DIREITA e NÃO por baixo — ' + info);
      ok(!m.cabeDepois, t.nome.padEnd(18) + ' a rolagem vertical NÃO resgata (a régua só mexe scrollTop)');
      // não é asserção de aprovação: é o registro do número que sustenta a DECISÃO de 02/09
      // (item regua-eixo-x-nao-olhado) — conta como PRESO porque sobraX é 0 em produção nas
      // seis telas e overflow-x nunca é declarado em estilo.css. A mensagem da régua já não
      // mente mais (imprime left/right/largura também).
      console.log('   ⚠ ' + t.nome.padEnd(16) + ' #telaMenu overflow-x=' + m.menuOverflowX
        + ' com ' + m.menuSobraX + ' px de sobra horizontal (0 em produção) — o dedo talvez'
        + ' alcançasse, mas a régua chama de PRESO por decisão, e agora a mensagem inclui os'
        + ' dois eixos');
    } else {
      ok(!m.vazaX, t.nome.padEnd(18) + ' NÃO vaza pela direita — ' + info);
      ok(m.cabeDepois, t.nome.padEnd(18) + ' alcançável'
        + (m.vazaY ? ' — mas SÓ porque a rolagem vertical resgatou ' + (m.cfgTopo - m.J).toFixed(0)
          + ' px de transbordo por baixo (a frase "não desloca nada" é falsa)' : ' sem precisar rolar'));
    }
  }

  await nav.close();
  console.log(falhas
    ? '\nPOSTE FORA DO FLUXO: ' + falhas + ' falha(s) — a mecânica medida mudou, ou a explicação escrita está errada de novo'
    : '\nPOSTE FORA DO FLUXO OK — `#poste` é relative, `top` desloca, o overflow-y resgata, e o 2-de-6 é do eixo X');
  process.exit(falhas ? 1 : 0);
})();
