// A LENTE DA ROBUSTEZ — os quatro maus-tratos da pergunta do dono, mais dois primos:
//   "save corrompido, aba em segundo plano por horas, tela pequena, relógio do sistema
//    mudado — o jogo aguenta?"
//
// Seis cenários, cada um com NÚMERO medido e asserção:
//   1. relógio do sistema andando para TRÁS (salvoEm no futuro)
//   2. relógio pulando ANOS para a frente (o teto de 12 h segura?)
//   3. aba em segundo plano por horas (o primeiro dt gigante teleporta?)
//   4. save podre CAMPO A CAMPO — cada campo do ESQUEMA_SAVE × 10 venenos
//   5. localStorage proibido/cheio (setItem e getItem lançando)
//   6. duas abas do jogo gravando no mesmo localStorage
//
// Roda contra o index.html da RAIZ (a saída do build), como o smoke.
// Uso: node test/robusto-tudo.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return p;
  return ABRIR('file://' + path.resolve(__dirname, '..', p || 'index.html'));
}

const falhas = [];   // o que QUEBROU (asserção)
const notas = [];    // o que aguentou mas merece registro
let cena = '';       // rótulo do cenário corrente, para os erros de console

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const errosConsole = [];

  async function novaPagina(ctx) {
    const page = await (ctx || browser).newPage(ctx ? {} : { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    page.on('pageerror', e => errosConsole.push(cena + ' PAGEERROR: ' + e.message));
    page.on('console', m => {
      if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) {
        errosConsole.push(cena + ' CONSOLE: ' + m.text());
      }
    });
    return page;
  }
  async function esperarS(page) {
    await page.waitForFunction(() => typeof S !== 'undefined');
    await page.waitForTimeout(250);
  }
  // abre o jogo com localStorage limpo (a primeira carga já leu o que havia; limpa e recarrega)
  async function paginaLimpa() {
    const page = await novaPagina();
    await page.goto(alvo());
    await esperarS(page);
    await page.evaluate(() => { salvar = function () {}; salvarRetencao = function () {}; localStorage.clear(); });
    await page.reload();
    await esperarS(page);
    return page;
  }

  // ============================================================
  // 1. O RELÓGIO ANDANDO PARA TRÁS — salvoEm fica no futuro
  // ============================================================
  cena = '[1 relogio-para-tras]';
  {
    const page = await paginaLimpa();
    const amanha = await page.evaluate(() => {
      salvar = function () {}; salvarRetencao = function () {};
      const d = new Date(Date.now() + 864e5);
      const am = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
        + '-' + String(d.getDate()).padStart(2, '0');
      // o telefone corrigiu a hora 6 h para trás: o save diz "fui gravado daqui a 6 horas"
      localStorage.setItem(CHAVE_JOGO, JSON.stringify({
        energia: 500, energiaTotal: 1000, salvoEm: Date.now() + 6 * 3600 * 1000
      }));
      localStorage.setItem(CHAVE_RET, JSON.stringify({
        dias: 3, primeiro: '2026-08-01', ultimo: am, segundos: 900
      }));
      return am;
    });
    await page.reload();
    await esperarS(page);
    const m = await page.evaluate(() => ({
      volta: voltouDepoisDe,
      painel: document.getElementById('retorno')
        ? document.getElementById('retorno').classList.contains('aberto') : null,
      energia: S.energia, total: S.energiaTotal,
      dias: R.dias, ultimo: R.ultimo, primeiro: R.primeiro, novo: diaNovo,
      bonus: bonusDias(), ganho: ganhoClique()
    }));
    console.log(cena, 'voltouDepoisDe =', Math.round(m.volta) + 's',
      '| painel de retorno aberto:', m.painel,
      '| energia', m.energia, '/', m.total,
      '| R.dias', m.dias, '| R.ultimo', m.ultimo, '| diaNovo', m.novo,
      '| bonus x' + m.bonus.toFixed(2), '| ganhoClique', m.ganho.toFixed(2));
    // CONSERTADO em 09/08: era esta a asserção que guardava o defeito. O relógio do aparelho
    // pode andar para trás sozinho (fuso, correção de hora), e aí a subtração fica negativa
    // com um save perfeitamente honesto. `Math.max(0, …)` em `carregar()`: tempo fora
    // negativo não existe, e um número negativo circulando é bomba para o próximo consumidor.
    if (m.volta !== 0) falhas.push('1: relógio para trás devia medir 0s de ausência, mediu ' + m.volta);
    // CONSERTADO em 09/08: o dt passa por `Math.max(0, …)`, então relógio para trás mede
    // ZERO, não um número negativo. Tempo fora negativo não existe.
    if (Math.round(m.volta) !== 0) notas.push('1: relógio para trás devia medir 0s, mediu ' + Math.round(m.volta) + 's');
    if (m.painel !== false) falhas.push('1: o painel de retorno abriu com tempo NEGATIVO fora');
    if (m.energia !== 500 || m.total !== 1000) falhas.push('1: a energia mudou com relógio recuado: ' + m.energia + '/' + m.total);
    if (m.dias !== 3) falhas.push('1: R.dias contou dia com relógio recuado: ' + m.dias);
    if (m.ultimo !== amanha) falhas.push('1: R.ultimo foi regravado para trás: ' + m.ultimo);
    if (m.novo) falhas.push('1: diaNovo acendeu com relógio recuado');
    if (!isFinite(m.ganho) || m.ganho <= 0) falhas.push('1: ganhoClique saiu ' + m.ganho);
    await page.close();
  }

  // ============================================================
  // 2. O RELÓGIO PULANDO TRÊS ANOS PARA A FRENTE — o teto de 12 h
  // ============================================================
  cena = '[2 relogio-anos-a-frente]';
  {
    const page = await paginaLimpa();
    await page.evaluate(() => {
      salvar = function () {}; salvarRetencao = function () {};
      localStorage.setItem(CHAVE_JOGO, JSON.stringify({
        energia: 500, energiaTotal: 1000, salvoEm: Date.now() - 3 * 365 * 864e5
      }));
      localStorage.setItem(CHAVE_RET, JSON.stringify({
        dias: 2, primeiro: '2023-06-01', ultimo: '2023-06-02', segundos: 600
      }));
    });
    await page.reload();
    await esperarS(page);
    const m = await page.evaluate(() => ({
      volta: voltouDepoisDe, teto: CFG.capOfflineHoras * 3600,
      painel: document.getElementById('retorno').classList.contains('aberto'),
      linha1: (document.querySelector('#retLista .retLinha') || {}).textContent || '',
      energia: S.energia, total: S.energiaTotal,
      dias: R.dias, primeiro: R.primeiro, ultimo: R.ultimo, novo: diaNovo,
      hoje: (function () { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })(),
      dobrada: chamadaDobrada
    }));
    console.log(cena, 'voltouDepoisDe =', m.volta + 's (teto ' + m.teto + 's)',
      '| painel:', m.painel, '| linha 1: "' + m.linha1 + '"',
      '| R.dias', m.dias, '(primeiro ' + m.primeiro + ', ultimo ' + m.ultimo + ')',
      '| diaNovo', m.novo, '| chamada dobrada', m.dobrada);
    if (m.volta !== m.teto) falhas.push('2: o teto de 12h não segurou: dt=' + m.volta);
    if (!m.painel) falhas.push('2: o painel de retorno não abriu depois de 3 anos');
    if (!/12h00/.test(m.linha1)) falhas.push('2: a linha do tempo fora não diz 12h00: "' + m.linha1 + '"');
    if (m.dias !== 3) falhas.push('2: R.dias devia somar UM dia (2->3), somou até ' + m.dias);
    if (m.primeiro !== '2023-06-01') falhas.push('2: R.primeiro se perdeu: ' + m.primeiro);
    if (m.ultimo !== m.hoje) falhas.push('2: R.ultimo não virou hoje: ' + m.ultimo);
    if (!m.novo) falhas.push('2: voltar 3 anos depois não acendeu diaNovo');
    if (m.energia !== 500 || m.total !== 1000) falhas.push('2: a energia mudou sozinha: ' + m.energia + '/' + m.total);

    // 2b. salvoEm ABSURDO, além do teto do esquema (4e12): o esquema APARA (não derruba
    // para o padrão) — o carimbo vira o ano de 2096, o dt sai -70 anos, e o que importa é
    // que nada abre, nada soma e nada quebra com um dt tão negativo
    await page.evaluate(() => {
      salvar = function () {}; salvarRetencao = function () {};
      localStorage.setItem(CHAVE_JOGO, JSON.stringify({ energia: 500, energiaTotal: 1000, salvoEm: 5e12 }));
    });
    await page.reload();
    await esperarS(page);
    const b = await page.evaluate(() => ({ salvoEm: S.salvoEm, volta: Math.round(voltouDepoisDe),
      painel: document.getElementById('retorno').classList.contains('aberto'),
      energia: S.energia, total: S.energiaTotal, ganho: ganhoClique() }));
    console.log(cena, '2b: salvoEm=5e12 (fora do esquema) -> S.salvoEm aparado para',
      b.salvoEm, '| voltouDepoisDe', b.volta + 's (~-70 anos) | painel:', b.painel,
      '| energia', b.energia + '/' + b.total);
    // 09/08: `salvoEm` ganhou `semAparar`, então um carimbo absurdo cai no PADRÃO (0) em vez
    // de ser aparado para 4e12. Naquele dia se escreveu aqui que "com o conserto, 5e12 vira
    // 'nunca foi salvo', o dt bate no teto de 12 h" — e essa segunda metade estava ERRADA.
    //
    // CORRIGIDO em 23/08 (mac-jogo). Não saber quando foi vale ZERO, e não doze horas: é o
    // commit `8889a6f` de 18/08, que se chama exatamente isso e traz a medição de por quê.
    // ANTES daquela trava, um `salvoEm` fora da faixa pagava **43.200 s de ausência, 144
    // pontos de obra de graça — 27% dos 540 do canteiro inteiro** — e o papel da volta
    // afirmava "você ficou fora por 12h00" a alguém de quem ninguém sabia nada. O jogo passou
    // a perguntar `ISTO É UM RELÓGIO?` (`RELOGIO_MINIMO`, src/jogo.ts) em vez de "é maior que
    // zero", e carimbo que não é relógio passou a valer 0.
    //
    // A ASSERÇÃO ABAIXO NÃO ACOMPANHOU, e ficou nove dias cobrando o comportamento que o jogo
    // tinha acabado de consertar — guardiã do bug que o comentário dela mesma alertava. Fazer
    // o jogo passar aqui seria REARMAR a bomba: bastaria zerar `salvoEm` à mão para colher o
    // teto quando quisesse. Zero é o lado certo de errar — perder uma ausência legítima custa
    // alguns pontos; pagar o teto a um save torto dá um terço da obra e faz a tela mentir.
    //
    // O TETO CONTINUA COBRADO onde ele deve valer: a cena 2 acima, com relógio LEGÍTIMO
    // adiantado anos, exige os 43.200 s. É a diferença entre capar tempo real e premiar lixo.
    if (b.salvoEm !== 0) falhas.push('2b: salvoEm=5e12 devia cair no padrão 0, veio ' + b.salvoEm);
    if (Math.round(b.volta) !== 0) falhas.push('2b: carimbo que não é relógio devia valer 0 s de ausência, veio ' + b.volta);
    if (b.painel) falhas.push('2b: o papel da volta NÃO pode abrir para um carimbo forjado — ele afirmaria um tempo fora que ninguém conhece');
    if (b.energia !== 500 || b.total !== 1000) falhas.push('2b: a energia mudou com carimbo absurdo: ' + b.energia);
    if (!isFinite(b.ganho) || b.ganho <= 0) falhas.push('2b: ganhoClique degradou com carimbo absurdo: ' + b.ganho);

    // 2c. RECUSOU, ou NÃO RODOU? — acrescentado pelo QA em 23/08, e é o que falta à 2b.
    // Zero é o valor INICIAL de `voltouDepoisDe`, então "vale 0 depois do reload" passa nos
    // DOIS mundos: naquele em que o guarda recusou o carimbo, e naquele em que o cálculo do
    // tempo fora nem aconteceu. MEDIDO: com um `return` plantado em `carregar()` logo antes
    // do bloco do `dt`, a 2b inteira continuava VERDE e a suíte saía com exit 0.
    // O conserto é carimbar a variável com −1 ANTES de chamar `carregar()`: −1 que sobrevive
    // é "não rodou", 0 é "alguém decidiu que vale zero". De quebra, as três medidas do
    // commit 8889a6f passam a ser cobradas no mesmo lugar, inclusive a que a trava fraca da
    // manhã de 18/08 deixava passar (um carimbo DENTRO da faixa do esquema que não é relógio).
    const c = await page.evaluate(() => {
      salvar = function () {}; salvarRetencao = function () {};
      const o = {};
      const rodar = (carimbo) => {
        localStorage.setItem(CHAVE_JOGO, JSON.stringify({ energia: 500, energiaTotal: 1000, salvoEm: carimbo }));
        voltouDepoisDe = -1;
        carregar();
        return { volta: Math.round(voltouDepoisDe), salvoEm: S.salvoEm };
      };
      o.forjado = rodar(5e12);            // fora da faixa do esquema -> padrão 0
      o.mil = rodar(1000);                // DENTRO da faixa, e ainda assim não é relógio (1970)
      o.legitimo = rodar(Date.now() - 3 * 365 * 864e5);
      o.oito = rodar(Date.now() - 8 * 3600 * 1000);
      o.teto = CFG.capOfflineHoras * 3600;
      if (typeof fecharRetorno === 'function') fecharRetorno();
      return o;
    });
    console.log(cena, '2c: sentinela -1 antes de carregar() ->',
      'forjado(5e12)', c.forjado.volta + 's', '| dentro-da-faixa(1000)', c.mil.volta + 's',
      '| relógio legítimo de 3 anos', c.legitimo.volta + 's (teto ' + c.teto + 's)',
      '| ausência honesta de 8 h', c.oito.volta + 's');
    if (c.forjado.volta === -1) falhas.push('2c: o cálculo do tempo fora NÃO RODOU para o carimbo forjado — a 2b estaria lendo o valor inicial, não uma recusa');
    if (c.forjado.volta !== 0) falhas.push('2c: carimbo forjado devia ser RECUSADO com 0 s, veio ' + c.forjado.volta);
    if (c.mil.salvoEm !== 1000) falhas.push('2c: salvoEm=1000 está DENTRO da faixa do esquema e devia chegar intacto ao guarda, veio ' + c.mil.salvoEm);
    if (c.mil.volta !== 0) falhas.push('2c: "maior que zero" não é a pergunta — salvoEm=1000 (1970) devia valer 0 s, veio ' + c.mil.volta);
    if (c.legitimo.volta !== c.teto) falhas.push('2c: relógio LEGÍTIMO adiantado 3 anos devia bater no teto de 12 h, veio ' + c.legitimo.volta);
    if (c.oito.volta !== 28800) falhas.push('2c: a ausência honesta de 8 h devia continuar valendo 28.800 s, veio ' + c.oito.volta);

    await page.close();
  }

  // ============================================================
  // 3. A ABA EM SEGUNDO PLANO POR HORAS — o primeiro dt gigante
  // ============================================================
  cena = '[3 aba-em-segundo-plano]';
  {
    const page = await paginaLimpa();
    const m = await page.evaluate(async () => {
      fecharTelas(); fecharTudo();
      await new Promise(r => setTimeout(r, 200));
      const v = velocidadeMundo();
      const e0 = S.energiaTotal, rel0 = relogio, antes = worldX;
      // o rAF congela na aba escondida; ao voltar, o primeiro quadro chega com um vão
      // enorme. Aqui o vão é fabricado travando a thread por 3 s — o mesmo que o loop vê.
      const t0 = performance.now();
      while (performance.now() - t0 < 3000) { /* aba "escondida" */ }
      const salto = await new Promise(res => requestAnimationFrame(() => res(worldX - antes)));
      return {
        v, salto: +salto.toFixed(2), teto: +(0.25 * v).toFixed(2),
        semTrava: +(3 * v).toFixed(0), dEnergia: S.energiaTotal - e0,
        dRelogio: +(relogio - rel0).toFixed(3), parado: mundoParado
      };
    });
    console.log(cena, 'vão de 3000ms -> mundo andou', m.salto + 'px',
      '(teto do clamp: ' + m.teto + 'px; sem clamp seriam ' + m.semTrava + 'px)',
      '| energia saltou:', m.dEnergia, '| relógio andou', m.dRelogio + 's');
    if (m.salto > m.teto * 1.05 + 0.5) falhas.push('3: o primeiro quadro depois do vão teleportou o mundo: ' + m.salto + 'px');
    if (m.dEnergia !== 0) falhas.push('3: a energia saltou sozinha no vão: +' + m.dEnergia);
    if (m.dRelogio > 0.3) falhas.push('3: o relógio do dia engoliu o vão inteiro: ' + m.dRelogio + 's');

    // 3b. esconder a aba grava o save na hora (é o que protege o progresso de quem é morto
    // pelo Android em segundo plano)
    const b = await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { get: () => true, configurable: true });
      const antes = Date.now();
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
      let s = null;
      try { s = JSON.parse(localStorage.getItem(CHAVE_JOGO)); } catch (e) {}
      return { gravou: !!s, atraso: s ? Date.now() - s.salvoEm : -1 };
    });
    console.log(cena, '3b: esconder a aba gravou o save:', b.gravou, '| atraso', b.atraso + 'ms');
    if (!b.gravou || b.atraso > 200 || b.atraso < 0) falhas.push('3b: esconder a aba não gravou o save na hora');

    // 3c. VOLTAR do segundo plano — o IRMÃO SEM COBERTURA do teto de 12 h (PENDENTES 72,
    // achado do QA em 23/08 auditando outra coisa).
    //
    // A 3b cobre a METADE que ESCONDE. A metade que VOLTA não tinha uma linha de teste: o
    // handler de `visibilitychange` chama
    //     pagarAusencia(Math.max(0, Math.min((Date.now() - escondidoEm)/1000, CFG.capOfflineHoras*3600)))
    // e esse caminho **não passa por `carregar()`** — é o único jeito de se ausentar de quem
    // troca de app sem fechar o jogo, que é o caso comum no celular e o ÚNICO no aplicativo,
    // onde a webview sobrevive ao segundo plano. `grep -rn` por `escondidoEm` ou
    // `pagarAusencia` em `test/*.js` devolvia NADA.
    //
    // MEDIDO pelo QA: com o `Math.min` inteiro arrancado do jogo, os quatro portões saíram
    // VERDES — `robusto-tudo` 0, `medir-save-hostil` 0, `encaixe` 0, `smoke` 0. Quatro verdes
    // com o teto arrancado. Era a resposta à pergunta "existe caminho em que o teto some sem
    // nenhuma cena reprovar": existe, e é este.
    //
    // A SENTINELA −1 é a mesma disciplina da 2c, e pela mesma razão: zero é o valor de repouso
    // de `voltouDepoisDe`, então "vale 0" passa nos DOIS mundos — naquele em que a conta rodou
    // e deu zero, e naquele em que ela não rodou. −1 que sobrevive é "NÃO RODOU".
    //
    // `salvoConhecido = discoSalvoEm()` antes de mostrar não é maquiagem: sem isso o handler
    // cai no ramo da ABA QUE RECUOU (`discoSalvoEm() > salvoConhecido`), que recarrega e zera
    // a marca DE PROPÓSITO — quem paga ali é a outra aba. Este bloco quer o outro ramo.
    const c = await page.evaluate(() => {
      salvar = function () {}; salvarRetencao = function () {};
      fecharTelas(); fecharTudo();
      const visivel = (v) => {
        Object.defineProperty(document, 'hidden', { get: () => !v, configurable: true });
        Object.defineProperty(document, 'visibilityState', { get: () => (v ? 'visible' : 'hidden'), configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      };
      const rodar = (segundos) => {
        visivel(false);                       // o handler carimba `escondidoEm = Date.now()`
        escondidoEm = Date.now() - segundos * 1000;   // ...e aqui ele vira o tempo que se quer medir
        salvoConhecido = discoSalvoEm();
        voltouDepoisDe = -1;                  // sentinela
        visivel(true);
        const r = { volta: Math.round(voltouDepoisDe),
          painel: document.getElementById('retorno').classList.contains('aberto'),
          marca: escondidoEm };
        fecharRetorno();
        return r;
      };
      const o = {};
      o.curta = rodar(30);                          // trocar de app por meio minuto
      o.oito = rodar(8 * 3600);                     // ausência honesta de 8 h
      o.anos = rodar(3 * 365 * 24 * 3600);          // o relógio do aparelho pulou 3 anos
      o.futuro = rodar(-6 * 3600);                  // o relógio andou para TRÁS 6 h
      o.teto = CFG.capOfflineHoras * 3600;
      visivel(true);
      return o;
    });
    console.log(cena, '3c: volta da aba oculta ->',
      '30s', c.curta.volta + 's (papel ' + c.curta.painel + ')',
      '| 8h', c.oito.volta + 's', '| 3 anos', c.anos.volta + 's (teto ' + c.teto + 's)',
      '| relógio -6h', c.futuro.volta + 's');
    for (const [nome, r] of [['curta', c.curta], ['oito', c.oito], ['anos', c.anos], ['futuro', c.futuro]]) {
      if (r.volta === -1) falhas.push('3c/' + nome + ': o caminho da ABA OCULTA não rodou — a sentinela -1 sobreviveu, então nenhum número abaixo prova coisa alguma');
      if (r.marca !== 0) falhas.push('3c/' + nome + ': `escondidoEm` não foi zerado (' + r.marca + ') — a mesma ausência seria paga de novo na próxima volta');
    }
    if (c.oito.volta !== 28800) falhas.push('3c: 8 h de aba oculta deviam valer 28.800 s, valeram ' + c.oito.volta);
    if (c.anos.volta !== c.teto) falhas.push('3c: O TETO DE 12 H NÃO SEGUROU NA ABA OCULTA — 3 anos escondida deviam virar ' + c.teto + 's, viraram ' + c.anos.volta);
    if (c.futuro.volta !== 0) falhas.push('3c: relógio recuado devia medir 0 s de aba oculta, mediu ' + c.futuro.volta);
    if (c.curta.volta !== 30) falhas.push('3c: 30 s de aba oculta deviam valer 30 s, valeram ' + c.curta.volta);
    if (c.curta.painel) falhas.push('3c: trocar de app por 30 s abriu o papel da volta na cara de alguém');
    if (!c.oito.painel || !c.anos.painel) falhas.push('3c: uma ausência longa pela aba oculta não abriu o papel da volta');
    await page.close();
  }

  // ============================================================
  // 4. O SAVE PODRE, CAMPO A CAMPO — todo campo do ESQUEMA_SAVE × 10 venenos
  // ============================================================
  cena = '[4 save-podre-por-campo]';
  {
    const page = await paginaLimpa();
    const m = await page.evaluate(() => {
      salvar = function () {}; salvarRetencao = function () {};
      fecharTelas(); fecharTudo();
      // um save VÁLIDO e cheio, para envenenar um campo por vez
      const base = {
        energia: 100, energiaTotal: 200, modo: 'limpo',
        u1: false, u2: true, u3: false, u4: false,
        cenario: 1, fronteira: 1, cuidado: 0.8,
        aberturas: 1, fechos: 0, som: true, grupo: 2,
        acolhidos: EPOCAS.map(() => 1), marcos: 0, travessias: 0,
        arco: ARCO_ATUAL, recursos: { flor: 1, agua: 2, refeicao: 3 },
        salvoEm: Date.now() - 1000
      };
      // 10 venenos, como TEXTO de JSON — 1e999 vira Infinity no parse, que é como
      // Infinity de verdade chega por um save editado à mão (JSON.stringify não o escreve)
      const venenos = ['null', '"texto"', '[1,2,3]', '{"x":1}', '-1',
        '1e999', '-1e999', 'true', '"123"', '1e300'];
      const savePodre = (campo, fragmento) => {
        const o = {};
        for (const k in base) o[k] = base[k];
        o[campo] = '__VENENO__';
        return JSON.stringify(o).replace('"__VENENO__"', fragmento);
      };
      const S0 = JSON.parse(JSON.stringify(S));
      const restaurar = () => { for (const k in S0) S[k] = JSON.parse(JSON.stringify(S0[k])); };
      const sano = (rotulo) => {
        const prob = [];
        for (const k in ESQUEMA_SAVE) {
          const r = ESQUEMA_SAVE[k], v = S[k];
          if (r.tipo === 'num' || r.tipo === 'cont' || r.tipo === 'bits') {
            if (typeof v !== 'number' || !isFinite(v) || v < r.min || v > r.max) prob.push(k + '=' + String(v));
          } else if (r.tipo === 'bool') { if (typeof v !== 'boolean') prob.push(k + '=' + String(v)); }
          else if (r.tipo === 'um') { if (r.entre.indexOf(v) < 0) prob.push(k + '=' + String(v)); }
          else if (r.tipo === 'lista') {
            if (!Array.isArray(v) || v.length !== r.n
              || v.some(x => typeof x !== 'number' || !isFinite(x) || x < r.min || x > r.max)) prob.push(k + '=' + JSON.stringify(v));
          } else if (r.tipo === 'mapa') {
            const ok = v && typeof v === 'object' && !Array.isArray(v)
              && Object.keys(v).sort().join(',') === r.chaves.slice().sort().join(',')
              && r.chaves.every(c => typeof v[c] === 'number' && isFinite(v[c]) && v[c] >= r.min && v[c] <= r.max);
            if (!ok) prob.push(k + '=' + JSON.stringify(v));
          }
        }
        const g = ganhoClique(); if (!isFinite(g) || g <= 0) prob.push('ganhoClique=' + g);
        const vm = velocidadeMundo(); if (!isFinite(vm) || vm <= 0) prob.push('velocidadeMundo=' + vm);
        if (S.energiaTotal < S.energia) prob.push('energiaTotal<energia');
        try { desenhar(); } catch (e) { prob.push('desenhar lançou: ' + e.message); }
        return prob.map(p => rotulo + ' -> ' + p);
      };
      const anomalias = [], observacoes = [];
      let casos = 0;
      const campos = Object.keys(ESQUEMA_SAVE);
      for (const campo of campos) {
        for (const ven of venenos) {
          casos++;
          restaurar();
          localStorage.setItem(CHAVE_JOGO, savePodre(campo, ven));
          try { carregar(); } catch (e) { anomalias.push(campo + '<-' + ven + ' -> carregar LANÇOU: ' + e.message); continue; }
          if (typeof fecharRetorno === 'function') fecharRetorno();
          anomalias.push(...sano(campo + '<-' + ven));
          // valores LEGAIS porém dignos de nota: o clamp aceita número finito fora do bom senso
          // CONSERTADO em 09/08 (`semAparar`): `cuidado: -1` cai no padrão 1 — o mundo
          // INTEIRO — em vez de ser aparado para 0, que é o mundo doente. Vira asserção, e
          // não observação: o comentário do esquema prometia isso e o código não cumpria, e
          // é justamente o tipo de coisa que volta em silêncio num refactor.
          if (campo === 'cuidado' && ven === '-1' && S.cuidado !== 1) {
            anomalias.push('cuidado<- -1 virou ' + S.cuidado + ' — o padrão é 1 (mundo inteiro), e errar para o SECO pune quem não fez nada');
          }
        }
      }
      // o save INTEIRO podre: vazio, truncado, tipos errados de raiz
      const inteiros = ['', 'null', '[]', '42', '"corda"', '{quebrado',
        JSON.stringify(base).slice(0, Math.floor(JSON.stringify(base).length / 2)), '{}'];
      const resultInteiros = [];
      for (const bruto of inteiros) {
        casos++;
        restaurar();
        localStorage.setItem(CHAVE_JOGO, bruto);
        let lancou = null;
        try { carregar(); } catch (e) { lancou = e.message; }
        if (typeof fecharRetorno === 'function') fecharRetorno();
        const prob = sano('inteiro<-' + JSON.stringify(bruto.slice(0, 24)));
        if (lancou) prob.push('carregar LANÇOU: ' + lancou);
        anomalias.push(...prob);
        // save ilegível não pode ter MEXIDO no estado (fora arco/migração, que é desenho)
        const intocado = ['energia', 'energiaTotal', 'modo', 'cenario', 'cuidado']
          .every(k => JSON.stringify(S[k]) === JSON.stringify(S0[k]));
        resultInteiros.push({ bruto: bruto.slice(0, 16), intocado });
        if (!lancou && !intocado && bruto !== '{}') {
          anomalias.push('inteiro<-' + JSON.stringify(bruto.slice(0, 24)) + ' -> um save ilegível MEXEU no estado');
        }
      }
      restaurar();
      localStorage.removeItem(CHAVE_JOGO);
      return { campos: campos.length, venenos: venenos.length, casos, anomalias, observacoes, resultInteiros };
    });
    console.log(cena, m.campos, 'campos ×', m.venenos, 'venenos +',
      m.resultInteiros.length, 'saves inteiros podres =', m.casos, 'casos',
      '| anomalias:', m.anomalias.length);
    if (m.anomalias.length) {
      console.log('  anomalias:', JSON.stringify(m.anomalias, null, 2));
      falhas.push('4: ' + m.anomalias.length + ' caso(s) deixaram estado estranho: ' + m.anomalias.slice(0, 5).join(' · '));
    }
    m.observacoes.forEach(o => notas.push('4: ' + o));
    await page.close();
  }

  // ============================================================
  // 5. localStorage CHEIO OU PROIBIDO — setItem e getItem lançando
  // ============================================================
  cena = '[5 storage-proibido]';
  {
    const page = await paginaLimpa();
    const m = await page.evaluate(async () => {
      fecharTelas(); fecharTudo();
      const orig = Storage.prototype.setItem;
      let lancadas = 0;
      Storage.prototype.setItem = function () {
        lancadas++;
        const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e;
      };
      let vazouEscrita = null;
      const e0 = S.energia;
      try {
        salvar();
        salvarRetencao();
        R.ultimo = '2026-01-01'; marcarDia();     // força um salvarRetencao interno
        for (let i = 0; i < 10; i++) clicar();
        desenhar();
      } catch (e) { vazouEscrita = e.message; }
      await new Promise(r => setTimeout(r, 300));   // alguns quadros vivos sob a proibição
      Storage.prototype.setItem = orig;
      const dEnergia = +(S.energia - e0).toFixed(2);
      const og = Storage.prototype.getItem;
      Storage.prototype.getItem = function () { throw new Error('SecurityError'); };
      let vazouLeitura = null;
      try { carregar(); carregarRetencao(); } catch (e) { vazouLeitura = e.message; }
      Storage.prototype.getItem = og;
      return { lancadas, vazouEscrita, vazouLeitura, dEnergia, ganho: ganhoClique() };
    });
    console.log(cena, 'setItem lançou', m.lancadas, 'vez(es)',
      '| exceção vazou na escrita:', m.vazouEscrita, '| na leitura:', m.vazouLeitura,
      '| 10 toques renderam', m.dEnergia, '| ganhoClique', m.ganho.toFixed(2));
    if (m.vazouEscrita) falhas.push('5: uma exceção de setItem vazou: ' + m.vazouEscrita);
    if (m.vazouLeitura) falhas.push('5: uma exceção de getItem vazou: ' + m.vazouLeitura);
    if (m.lancadas < 3) falhas.push('5: o instrumento não exercitou o setItem (' + m.lancadas + ')');
    if (!(m.dEnergia > 0)) falhas.push('5: o jogo parou de pagar toque com o storage proibido');
    if (!isFinite(m.ganho) || m.ganho <= 0) falhas.push('5: ganhoClique degradou sob storage proibido');
    await page.close();
  }

  // ============================================================
  // 6. DUAS ABAS AO MESMO TEMPO — o mesmo localStorage, dois jogos
  // (por http, porque é assim que a Vercel serve e é assim que duas abas dividem origem)
  // ============================================================
  cena = '[6 duas-abas]';
  {
    const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'));
    const srv = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    await new Promise(r => srv.listen(0, '127.0.0.1', r));
    const url = 'http://127.0.0.1:' + srv.address().port + '/';
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const abaA = await novaPagina(ctx);
    await abaA.goto(url);
    await esperarS(abaA);
    await abaA.evaluate(() => { localStorage.clear(); });
    await abaA.reload();
    await esperarS(abaA);
    // A joga e salva 1000
    await abaA.evaluate(() => { S.energia = 1000; S.energiaTotal = 1000; salvar(); });
    // B abre por cima, herda o save, joga e salva 1500
    const abaB = await novaPagina(ctx);
    await abaB.goto(url);
    await esperarS(abaB);
    const bAbriuCom = await abaB.evaluate(() => S.energia);
    await abaB.evaluate(() => { S.energia = 1500; S.energiaTotal = 1500; salvar(); R.segundos = 300; salvarRetencao(); });
    const depoisDeB = await abaB.evaluate(() => JSON.parse(localStorage.getItem(CHAVE_JOGO)).energia);
    // a aba A continua viva com o estado VELHO na memória — ela nunca escuta o evento
    // `storage`, então nem sabe que B existiu
    const aPercebeu = await abaA.evaluate(() => S.energia);
    // a pessoa fecha B (o beforeunload de B salva 1500 de novo — correto)...
    await abaB.close({ runBeforeUnload: true });
    await abaA.waitForTimeout(300);
    // ...e o autosave de 10 s da aba A dispara com a memória velha
    const depoisDeA = await abaA.evaluate(() => {
      salvar(); R.segundos = 45; salvarRetencao();
      return { energia: JSON.parse(localStorage.getItem(CHAVE_JOGO)).energia,
        segundos: JSON.parse(localStorage.getItem(CHAVE_RET)).segundos };
    });
    // quem abrir o jogo agora encontra o quê?
    const abaC = await novaPagina(ctx);
    await abaC.goto(url);
    await esperarS(abaC);
    const proximaSessao = await abaC.evaluate(() => S.energia);
    console.log(cena, 'B abriu herdando', bAbriuCom,
      '| B salvou 1500 (disco:', depoisDeB + ') e fechou',
      '| A percebeu o save de B? memória de A =', aPercebeu,
      '| autosave de A gravou por cima: disco =', depoisDeA.energia,
      '| próxima sessão abre com', proximaSessao,
      '-> progresso perdido:', (1500 - proximaSessao), 'de energia',
      '| retenção: 300s de B viraram', depoisDeA.segundos + 's');
    if (bAbriuCom !== 1000) falhas.push('6: a aba B não herdou o save da A (origem não dividida?): ' + bAbriuCom);
    if (depoisDeB !== 1500) falhas.push('6: o salvar de B não chegou ao disco');
    if (proximaSessao !== 1500) {
      falhas.push('6: DUAS ABAS PERDEM PROGRESSO — B jogou até 1500 e fechou salvando; o autosave de 10s da aba A, viva com memória velha, gravou 1000 por cima, e a próxima sessão abre com ' + proximaSessao + ' (perda medida: ' + (1500 - proximaSessao) + ' de energia; retenção idem: 300s de B viraram ' + depoisDeA.segundos + 's). Última a escrever vence — nenhuma aba escuta o evento storage nem faz merge.');
    }
    await abaA.close(); await abaC.close(); await ctx.close();
    srv.close();
  }

  await browser.close();

  // ============================================================
  console.log('');
  if (errosConsole.length) {
    console.log('ERROS DE CONSOLE DURANTE OS CENÁRIOS:');
    errosConsole.forEach(e => console.log('  ' + e));
  } else {
    console.log('nenhum erro de console em cenário nenhum');
  }
  if (notas.length) {
    console.log('NOTAS (aguentou, mas registre):');
    notas.forEach(n => console.log('  · ' + n));
  }
  if (falhas.length || errosConsole.length) {
    console.log('\nROBUSTO: FALHOU');
    falhas.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
  }
  console.log('\nROBUSTO: PASSOU — os seis maus-tratos aguentados');
})().catch(e => { console.error(e); process.exit(1); });
