// OS PRIMEIROS CINCO MINUTOS — três pessoas que nunca viram o jogo, medidas por bot.
//
// A lente do critério do dono que nunca foi usada: alguém que abre o jogo agora entende o
// que fazer? Onde trava? Não se responde por leitura de código nem por impressão — cada
// pessoa é simulada por 5 minutos DE RELÓGIO, com localStorage limpo (contexto novo do
// Playwright já nasce limpo; ainda assim é conferido), e tudo que aparece na tela vira
// evento com carimbo de tempo.
//
//   node test/cinco-minutos.js parada     # abre e não toca em nada
//   node test/cinco-minutos.js timida     # um toque a cada 3 s, sempre em (292, 422)
//   node test/cinco-minutos.js curiosa    # toca em tudo: lados, botão, cartões, menu
//   ... [--rapido]                        # 45 s em vez de 300 s, para depurar o instrumento
//
// Saída: tabela por minuto no console, test/cinco-<pessoa>.json com o log inteiro de
// eventos e toques, e prints test/CINCO-<pessoa>-*.png nos momentos que sustentam achado.
//
// O COLETOR (injetado na página): embrulha soltarDrop/coletarDrop/novoMob/registrarChegada/
// novoFloat para contar o que nasce e o que é recolhido, e um sampler de 120 ms diffa o que
// está NA TELA — telas abertas, cerimônia, fala, rótulo, sussurro, microdicas, saldo — e
// grava cada mudança como evento. "Momento morto" = o maior vão entre dois eventos.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PESSOA = (process.argv[2] || '').toLowerCase();
if (!['parada', 'timida', 'curiosa'].includes(PESSOA)) {
  console.error('uso: node test/cinco-minutos.js parada|timida|curiosa [--rapido]');
  process.exit(2);
}
const RAPIDO = process.argv.includes('--rapido');
const DURACAO = RAPIDO ? 45000 : 300000;         // 5 min de relógio
const DIR = __dirname;

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
const ALVO = 'file://' + path.resolve(DIR, '..', process.env.JOGO_HTML || 'index.html');

// o ponto da TÍMIDA: o centro da metade direita da tela 390×844
const PT_TIMIDA = { x: 292, y: 422 };
const PT_ESQ = { x: 97, y: 422 };
const PT_FALA = { x: 195, y: 640 };              // onde o percurso.js avança falas

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  const errosConsole = [];
  page.on('pageerror', e => errosConsole.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errosConsole.push('CONSOLE: ' + m.text()); });

  await page.goto(ALVO);
  // save limpo, conferido — a armadilha do beforeunload não morde porque não há reload.
  // O próprio boot grava a chave de retenção (é o dia 1 de verdade); o que não pode
  // existir é save de JOGO.
  const chaves = await page.evaluate(() => Object.keys(localStorage));
  if (chaves.some(k => /v1|muro/.test(k))) { console.error('havia save de jogo: ' + chaves.join(',')); process.exit(1); }
  await page.waitForTimeout(700);   // o boot assentar (o percurso espera 1000; 700 + install chega igual)

  // ---------- O COLETOR ----------
  await page.evaluate(() => {
    const t0 = performance.now();
    const Q = window.__QA = {
      t0, ev: [], linhas: [], dropsSol: 0, dropsCol: 0, dropsColAuto: 0,
      mobsNasc: 0, alcancadas: 0, falasAbertas: 0, cerimonias: 0, erroSampler: null
    };
    const marca = (tipo, info) => { Q.ev.push({ t: Math.round(performance.now() - t0), tipo, info: String(info == null ? '' : info).slice(0, 140) }); };
    // embrulhos — funções de topo de script são bindings do window; os call sites internos
    // resolvem pelo mesmo binding, então reatribuir aqui conta tudo
    const _sol = window.soltarDrop;
    window.soltarDrop = function (m, sx) { Q.dropsSol++; marca('drop-nasce', m.type); return _sol.apply(this, arguments); };
    const _col = window.coletarDrop;
    window.coletarDrop = function (d, auto) { if (auto) Q.dropsColAuto++; else Q.dropsCol++; marca('drop-recolhido', d.type + (auto ? ' (auto)' : '')); return _col.apply(this, arguments); };
    const _mob = window.novoMob;
    window.novoMob = function () { Q.mobsNasc++; if (Q.mobsNasc === 1) marca('primeira-chegada', arguments[0]); return _mob.apply(this, arguments); };
    const _che = window.registrarChegada;
    window.registrarChegada = function (a) { if (a) Q.alcancadas++; return _che.apply(this, arguments); };
    const _flo = window.novoFloat;
    window.novoFloat = function (o) {
      if (o && o.txt && !/^\+/.test(o.txt)) marca('float', o.txt);   // NOVA ERA, CORRER!, ANDAR!…
      return _flo.apply(this, arguments);
    };
    // sampler: o que mudou NA TELA desde a última olhada
    let u = {};
    const TELAS = ['telaMenu', 'telaCapitulos', 'telaFala', 'telaCompletude', 'telaConfig', 'telaFontes', 'telaFim'];
    setInterval(() => {
      try {
        const g = id => document.getElementById(id);
        const s = {
          telas: TELAS.filter(id => g(id) && g(id).classList.contains('aberta')).join(','),
          cer: typeof emCerimonia === 'function' ? emCerimonia() : false,
          viva: typeof falaViva !== 'undefined' ? falaViva : false,
          falaTit: g('falaTit') ? (g('falaTit').getAttribute('aria-label') || '') : '',
          falaTxt: g('falaTxt') ? g('falaTxt').textContent : '',
          pronta: g('falaCaixa') ? g('falaCaixa').classList.contains('pronta') : false,
          rotulo: g('rotuloEpoca') ? (g('rotuloEpoca').getAttribute('aria-label') || g('rotuloEpoca').textContent) : '',
          sussurro: g('sussurroEra') ? g('sussurroEra').textContent.trim() : '',
          marco: g('marcoDist') ? g('marcoDist').textContent.trim() : '',
          seta: g('dicaSeta') ? g('dicaSeta').classList.contains('viva') : false,
          pulo: (typeof dicaPuloAte !== 'undefined' && typeof relogio !== 'undefined') ? dicaPuloAte > relogio : false,
          podeU1: typeof S !== 'undefined' && S.energia >= CFG.custoU1,
          us: typeof S !== 'undefined' ? [1, 2, 3, 4].map(n => S['u' + n] ? n : 0).join('') : '',
          modo: typeof S !== 'undefined' ? S.modo : '',
          sheet: g('sheetUpgrades') ? g('sheetUpgrades').classList.contains('aberto') : false,
          retorno: g('retorno') ? g('retorno').getAttribute('aria-hidden') : ''
        };
        if (u.telas !== undefined) {
          if (s.telas !== u.telas) marca('telas', s.telas || '(a rua)');
          if (s.cer && !u.cer) { Q.cerimonias++; marca('cerimonia', g('cerNome') ? g('cerNome').textContent : ''); }
          if (s.viva && !u.viva) { Q.falasAbertas++; marca('fala-abre', s.falaTit); }
          if (s.viva && s.pronta && s.falaTxt && s.falaTxt !== u.falaTxt) {
            if (Q.linhas[Q.linhas.length - 1] !== s.falaTxt) { Q.linhas.push(s.falaTxt); marca('fala-linha', '[' + s.falaTit + '] ' + s.falaTxt); }
          }
          if (s.rotulo !== u.rotulo) marca('rotulo-epoca', s.rotulo);
          if (s.sussurro && s.sussurro !== u.sussurro) marca('sussurro', s.sussurro);
          if (s.marco && s.marco !== u.marco) marca('marco', s.marco);
          if (s.seta && !u.seta) marca('microdica-seta', 'a seta apontando o contador que encheu');
          if (s.pulo && !u.pulo) marca('microdica-pulo', 'ESQUERDA PULA (no canvas, 2,8 s)');
          if (s.podeU1 && !u.podeU1) marca('u1-compravel', 'saldo ' + Math.round(S.energia) + ' >= ' + CFG.custoU1);
          if (s.us !== u.us) marca('upgrade-comprado', s.us);
          if (s.modo !== u.modo) marca('modo', s.modo);
          if (s.sheet !== u.sheet) marca('sheet-melhorias', s.sheet ? 'abriu' : 'fechou');
          if (s.retorno !== u.retorno) marca('painel-retorno', s.retorno);
        } else {
          marca('estado-inicial', 'telas=' + (s.telas || '(a rua)') + ' rotulo=' + s.rotulo);
        }
        u = s;
      } catch (e) { Q.erroSampler = String(e); }
    }, 120);
  });

  // ---------- ferramentas ----------
  const taps = [];
  async function toque(x, y, alvoNome) {
    const el = await page.evaluate(([px, py]) => {
      const e = document.elementFromPoint(px, py);
      return e ? (e.id || e.className || e.tagName) : '(nada)';
    }, [x, y]);
    await page.touchscreen.tap(x, y);
    taps.push({ t: Date.now() - T0, x, y, alvo: alvoNome || '', em: String(el).slice(0, 60) });
  }
  async function print(nome) {
    await page.screenshot({ path: path.join(DIR, 'CINCO-' + PESSOA + '-' + nome + '.png') });
  }
  async function foto() {   // o snapshot numérico de um instante
    return page.evaluate(() => {
      const Q = window.__QA;
      const g = id => document.getElementById(id);
      return {
        impacto: typeof S !== 'undefined' ? +S.energiaTotal.toFixed(1) : 0,
        saldo: typeof S !== 'undefined' ? +S.energia.toFixed(1) : 0,
        falasAbertas: Q.falasAbertas, cerimonias: Q.cerimonias, linhasLidas: Q.linhas.length,
        dropsSol: Q.dropsSol, dropsCol: Q.dropsCol, dropsColAuto: Q.dropsColAuto,
        dropsVivos: typeof drops !== 'undefined' ? drops.length : 0,
        mobsNasc: Q.mobsNasc, alcancadas: Q.alcancadas,
        dicaPulo: typeof dicaPuloVista !== 'undefined' ? dicaPuloVista : false,
        dicaSeta: typeof dicaSetaVista !== 'undefined' ? dicaSetaVista : false,
        podeU1: typeof S !== 'undefined' && S.energia >= CFG.custoU1,
        us: typeof S !== 'undefined' ? [1, 2, 3, 4].filter(n => S['u' + n]) : [],
        telas: ['telaMenu', 'telaCapitulos', 'telaFala', 'telaCompletude', 'telaConfig', 'telaFontes', 'telaFim']
          .filter(id => g(id) && g(id).classList.contains('aberta')),
        eventos: Q.ev.length
      };
    });
  }

  // o retrato do primeiro quadro: o que está na tela e o que está escrito
  const quadroZero = await page.evaluate(() => {
    const g = id => document.getElementById(id);
    const vis = e => { if (!e) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const caixa = id => { const e = g(id); if (!vis(e)) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
    return {
      telaMenuTexto: g('telaMenu') ? g('telaMenu').innerText.replace(/\n+/g, ' | ') : '',
      botoesMenu: [...document.querySelectorAll('#telaMenu .telaBtn')].filter(vis).map(b => {
        const r = b.getBoundingClientRect();
        return { id: b.id, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), rotulo: (b.getAttribute('aria-label') || b.textContent || '').trim() };
      }),
      emPontoTimida: (() => { const e = document.elementFromPoint(292, 422); return e ? (e.id || e.className || e.tagName) : '(nada)'; })(),
      hud: { chipTaxa: caixa('chipTaxa'), recursos: caixa('recursos'), linhaEpoca: caixa('linhaEpoca'), rotulo: g('rotuloEpoca') ? (g('rotuloEpoca').getAttribute('aria-label') || g('rotuloEpoca').textContent) : '' },
      controles: { modeQuick: caixa('modeQuick'), btnClique: caixa('btnClique'), openUpgrades: caixa('openUpgrades'), abrirMenu: caixa('abrirMenu'),
        rotuloBotao: g('cliqueRotulo') ? (g('cliqueRotulo').getAttribute('aria-label') || g('cliqueRotulo').textContent || '').trim() : '' },
      cardU4Visivel: (() => { const c = g('cardU4'); return c ? getComputedStyle(c).display !== 'none' : false; })()
    };
  });

  const T0 = Date.now();
  const minutos = [];
  let proxMinuto = 60000;
  async function talvezMinuto() {
    const t = Date.now() - T0;
    if (t >= proxMinuto || t >= DURACAO) {
      const f = await foto();
      f.min = Math.round(t / 60000 * 10) / 10;
      minutos.push(f);
      proxMinuto += 60000;
    }
  }

  console.log('== A ' + PESSOA.toUpperCase() + ' · ' + (DURACAO / 1000) + ' s de relógio · save limpo ==');
  console.log('ponto da tímida cai em: ' + quadroZero.emPontoTimida);
  await print('00-boot');

  // ================= AS TRÊS PESSOAS =================
  if (PESSOA === 'parada') {
    // não toca em nada. O jogo que se apresente.
    while (Date.now() - T0 < DURACAO) {
      await page.waitForTimeout(1000);
      await talvezMinuto();
      const t = Date.now() - T0;
      if (Math.abs(t - 30000) < 600) await print('01-30s');
      if (Math.abs(t - 150000) < 600) await print('02-150s');
    }
  }

  if (PESSOA === 'timida') {
    // um toque a cada 3 s, sempre no mesmo ponto. Nunca descobre o pulo nem o botão.
    let n = 0;
    while (Date.now() - T0 < DURACAO) {
      await toque(PT_TIMIDA.x, PT_TIMIDA.y, 'o ponto de sempre');
      n++;
      if (n === 1) await print('01-primeiro-toque');
      if (n === 10) await print('02-toque-10');
      if (n === 40) await print('03-toque-40');
      const resto = 3000 - ((Date.now() - T0) % 3000);
      await page.waitForTimeout(Math.max(200, resto));
      await talvezMinuto();
    }
    console.log('toques dados: ' + n);
  }

  if (PESSOA === 'curiosa') {
    // toca em tudo, ~1 toque/s: os dois lados da rua, o botão dourado, os três cartões, e
    // dentro do menu cada porta uma vez. Não toca APAGAR MEU PROGRESSO (quer jogar, não
    // apagar) — a sonda do APAGAR roda depois dos 5 min, fora da medição.
    const visitou = { historia: false, fontes: false, ajustes: false, som: false };
    let passo = 0;
    const rua = ['direita', 'esquerda', 'botao', 'ritmo', 'melhorias', 'direita', 'botao', 'esquerda', 'menu'];
    while (Date.now() - T0 < DURACAO) {
      const s = await page.evaluate(() => {
        const g = id => document.getElementById(id);
        const ab = id => g(id) && g(id).classList.contains('aberta');
        return {
          fala: typeof falaViva !== 'undefined' && falaViva,
          menu: ab('telaMenu'), caps: ab('telaCapitulos'), comp: ab('telaCompletude'),
          fontes: ab('telaFontes'), cfg: ab('telaConfig'), fim: ab('telaFim'),
          sheet: g('sheetUpgrades') && g('sheetUpgrades').classList.contains('aberto'),
          retorno: g('retorno') && g('retorno').getAttribute('aria-hidden') === 'false'
        };
      });
      const caixa = async id => { const b = await page.locator('#' + id).boundingBox(); return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null; };

      if (s.fala) { await toque(PT_FALA.x, PT_FALA.y, 'avançar a fala'); await page.waitForTimeout(650); }
      else if (s.retorno) { await toque(195, 300, 'fechar o papel da volta'); await page.waitForTimeout(500); }
      else if (s.menu) {
        let alvoId = 'btnJogar';
        if (!visitou.historia && passo > 0) { alvoId = 'btnCompletude'; visitou.historia = true; }
        else if (!visitou.fontes && passo > 0) { alvoId = 'btnFontes'; visitou.fontes = true; }
        else if (!visitou.ajustes && passo > 0) { alvoId = 'btnConfig'; visitou.ajustes = true; }
        const c = await caixa(alvoId);
        if (c) { await toque(c.x, c.y, alvoId); }
        await page.waitForTimeout(700);
      }
      else if (s.caps) { const c = await caixa('listaCapitulos'); if (c) await toque(c.x, c.y, 'primeiro capítulo'); await page.waitForTimeout(700); }
      else if (s.comp) {
        await page.evaluate(() => { const l = document.getElementById('listaCenas'); l.scrollTop += l.clientHeight; });
        await page.waitForTimeout(900);
        await print('05-historia');
        const c = await caixa('btnVoltarComp'); if (c) await toque(c.x, c.y, 'VOLTAR da história');
        await page.waitForTimeout(600);
      }
      else if (s.fontes) { const c = await caixa('btnVoltarFontes'); if (c) await toque(c.x, c.y, 'VOLTAR das fontes'); await page.waitForTimeout(600); }
      else if (s.cfg) {
        if (!visitou.som) { const c = await caixa('btnSom'); if (c) await toque(c.x, c.y, 'SOM'); visitou.som = true; await page.waitForTimeout(400); }
        const c = await caixa('btnVoltarCfg'); if (c) await toque(c.x, c.y, 'VOLTAR dos ajustes'); await page.waitForTimeout(600);
      }
      else if (s.fim) { const c = await caixa('btnFimVoltar'); if (c) await toque(c.x, c.y, 'VOLTAR PARA A RUA'); await page.waitForTimeout(600); }
      else if (s.sheet) {
        // ela olha a bandeja e aperta o que der: cada botão visível, uma vez por visita
        for (const id of ['btnU1', 'btnU2', 'btnU3', 'btnU4']) {
          const vis = await page.evaluate(i => { const b = document.getElementById(i); if (!b) return false; const c = b.closest('.upgrade'); return c && getComputedStyle(c).display !== 'none'; }, id);
          if (!vis) continue;
          const c = await caixa(id);
          if (c) { await toque(c.x, c.y, id); await page.waitForTimeout(250); }
        }
        await print('04-bandeja');
        const c = await caixa('openUpgrades'); if (c) await toque(c.x, c.y, 'fechar MELHORIAS');
        await page.waitForTimeout(500);
      }
      else {
        const alvo = rua[passo % rua.length];
        if (alvo === 'direita') await toque(PT_TIMIDA.x, PT_TIMIDA.y, 'metade direita');
        else if (alvo === 'esquerda') await toque(PT_ESQ.x, PT_ESQ.y, 'metade esquerda');
        else { const mapa = { botao: 'btnClique', ritmo: 'modeQuick', melhorias: 'openUpgrades', menu: 'abrirMenu' };
          const c = await caixa(mapa[alvo]); if (c) await toque(c.x, c.y, mapa[alvo]); }
        passo++;
        await page.waitForTimeout(750);
      }
      await talvezMinuto();
      const t = Date.now() - T0;
      if (t > 55000 && t < 57000) await print('02-60s');
    }
    await print('06-fim-5min');

    // ---------- SONDA, FORA DOS 5 MIN: o APAGAR confirma? ----------
    console.log('\n-- sonda pós-medição: APAGAR MEU PROGRESSO --');
    await page.evaluate(() => { fecharTudo(); abrirTela('telaMenu'); });
    await page.waitForTimeout(300);
    let c = await page.locator('#btnConfig').boundingBox();
    await page.touchscreen.tap(c.x + c.width / 2, c.y + c.height / 2);
    await page.waitForTimeout(400);
    const antes = await page.evaluate(() => ({ impacto: S.energiaTotal, us: [1, 2, 3, 4].filter(n => S['u' + n]) }));
    c = await page.locator('#btnApagar').boundingBox();
    await page.touchscreen.tap(c.x + c.width / 2, c.y + c.height / 2);
    await page.waitForTimeout(300);
    const meio = await page.evaluate(() => ({
      rotuloVisivel: (document.getElementById('btnApagar').getAttribute('aria-label') || '').trim(),
      u5escondido: document.getElementById('btnU5').textContent
    }));
    await print('07-apagar-1-toque');
    await page.touchscreen.tap(c.x + c.width / 2, c.y + c.height / 2);
    await page.waitForTimeout(300);
    const depois = await page.evaluate(() => ({ impacto: S.energiaTotal, us: [1, 2, 3, 4].filter(n => S['u' + n]) }));
    console.log('antes: impacto ' + antes.impacto.toFixed(0) + ', upgrades [' + antes.us + ']');
    console.log('1º toque -> rótulo visível: "' + meio.rotuloVisivel + '" | o "tem certeza?" foi para o botão escondido: "' + meio.u5escondido + '"');
    console.log('2º toque -> impacto ' + depois.impacto.toFixed(0) + ', upgrades [' + depois.us + ']  (apagou: ' + (depois.impacto < antes.impacto) + ')');
  }

  // ================= O RELATO =================
  const fim = await foto();
  const dump = await page.evaluate(() => window.__QA);

  console.log('\n-- retrato do primeiro quadro --');
  console.log(JSON.stringify(quadroZero, null, 1).slice(0, 2400));

  console.log('\n-- por minuto --');
  console.log('min | impacto | telas hist. | linhas | drops rec/perd | dicas | u1?');
  for (const m of minutos) {
    const perdidos = m.dropsSol - m.dropsCol - m.dropsColAuto - m.dropsVivos;
    console.log(String(m.min).padStart(3) + ' | ' + String(m.impacto).padStart(7) + ' | ' +
      String(m.falasAbertas + m.cerimonias).padStart(11) + ' | ' + String(m.linhasLidas).padStart(6) + ' | ' +
      (m.dropsCol + m.dropsColAuto + '/' + Math.max(0, perdidos)).padStart(14) + ' | ' +
      ((m.dicaPulo ? 1 : 0) + (m.dicaSeta ? 1 : 0)).toString().padStart(5) + ' | ' + (m.podeU1 || m.us.length ? 'sim' : 'não'));
  }

  console.log('\n-- eventos (o que aconteceu, quando) --');
  const ev = dump.ev;
  for (const e of ev.slice(0, 400)) {
    console.log('  ' + (e.t / 1000).toFixed(1).padStart(6) + 's  ' + e.tipo.padEnd(18) + ' ' + e.info);
  }
  if (ev.length > 400) console.log('  … +' + (ev.length - 400) + ' eventos (no JSON)');

  // o momento morto: o maior vão entre eventos consecutivos dentro da janela medida
  let morto = { de: 0, ate: 0, vao: 0 };
  const soJanela = ev.filter(e => e.t <= DURACAO);
  for (let i = 1; i < soJanela.length; i++) {
    const vao = soJanela[i].t - soJanela[i - 1].t;
    if (vao > morto.vao) morto = { de: soJanela[i - 1].t, ate: soJanela[i].t, vao };
  }
  const rabo = soJanela.length ? DURACAO - soJanela[soJanela.length - 1].t : DURACAO;
  console.log('\n-- momento morto --');
  console.log('maior vão entre eventos: ' + (morto.vao / 1000).toFixed(1) + ' s (de ' +
    (morto.de / 1000).toFixed(1) + 's a ' + (morto.ate / 1000).toFixed(1) + 's)');
  console.log('do último evento ao fim dos 5 min: ' + (rabo / 1000).toFixed(1) + ' s');
  if (dump.erroSampler) console.log('ERRO NO SAMPLER: ' + dump.erroSampler);
  console.log('\n-- erros de console --');
  console.log(errosConsole.length ? errosConsole.join('\n') : '(nenhum)');

  fs.writeFileSync(path.join(DIR, 'cinco-' + PESSOA + '.json'), JSON.stringify({
    pessoa: PESSOA, duracao: DURACAO, quadroZero, minutos, fimDaJanela: fim,
    eventos: ev, taps, linhas: dump.linhas, morto, rabo, errosConsole
  }, null, 1));
  console.log('\nJSON: test/cinco-' + PESSOA + '.json · prints: test/CINCO-' + PESSOA + '-*.png');

  await browser.close();
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
