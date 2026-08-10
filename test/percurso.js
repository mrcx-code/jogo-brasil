// PERCURSO — a travessia INTEIRA do jogo, do save vazio ao fecho final, por toque real.
//
// Não é o smoke. O smoke pergunta "quebrou?"; este pergunta "ENCAIXA?" — se a sequência de
// telas, falas, capítulos e viradas faz sentido como percurso para quem abre o jogo hoje.
// Roda contra o index.html da RAIZ como ele está (sem build), 390×844, dsf 2, toque real.
//
// Onde ele SEMEIA estado, ele diz na saída com a marca [SEMEADO]. A regra: semear só para
// pular grind (impacto acumulado), nunca para pular tela, fala ou decisão.
//
//   node test/percurso.js            # tudo
//   node test/percurso.js 1 2 3      # só as seções pedidas
//
// Prints em test/X-*.png.
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
function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return p;
  return ABRIR('file://' + path.resolve(__dirname, '..', p || 'index.html'));
}
const SO = process.argv.slice(2).filter(a => /^\d+$/.test(a)).map(Number);
const quer = n => SO.length === 0 || SO.includes(n);
const DIR = __dirname;
const achados = [];
function nota(grav, txt) { achados.push({ grav, txt }); console.log('   [' + grav + '] ' + txt); }

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });

  // ---------- ferramentas de toque ----------
  const T = {
    async xy(x, y) { await page.touchscreen.tap(x, y); await page.waitForTimeout(90); },
    async em(sel) {
      const b = await page.locator(sel).boundingBox();
      if (!b) throw new Error('sem caixa: ' + sel);
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(120);
      return b;
    },
    async print(nome) { await page.screenshot({ path: path.join(DIR, 'X-' + nome + '.png') }); return 'X-' + nome + '.png'; },
    async estado() {
      return page.evaluate(() => ({
        cena: S.cenario, fronteira: S.fronteira, epoca: epocaAtual(), nome: EPOCAS[epocaAtual()].nome,
        total: +S.energiaTotal.toFixed(1), fala: falaAberta(), trav: travessiaAtiva(),
        cerim: typeof emCerimonia === 'function' ? emCerimonia() : false,
        telas: ["telaMenu", "telaCapitulos", "telaFala", "telaCompletude", "telaConfig", "telaFontes"]
          .filter(t => document.getElementById(t).classList.contains('aberta')),
        titulo: document.getElementById('falaTit') ? (document.getElementById('falaTit').getAttribute('aria-label')||'') : '',
        linha: document.getElementById('falaTxt') ? document.getElementById('falaTxt').textContent : '',
        falaI: typeof falaI !== 'undefined' ? falaI : -1,
        falaN: typeof falaLinhas !== 'undefined' ? falaLinhas.length : -1,
        prog: +(progressoCena() * 100).toFixed(0)
      }));
    },
    // avança uma fala até fechar, gravando cada linha. `limite` de segurança.
    async lerFala(limite = 60) {
      const linhas = [];
      const meta = [];
      for (let i = 0; i < limite; i++) {
        const e = await T.estado();
        if (!e.fala) break;
        // completa a revelação, depois avança
        await T.xy(195, 640);
        const d = await page.evaluate(() => ({
          i: falaI, txt: document.getElementById('falaTxt').textContent,
          pronta: document.getElementById('falaCaixa').classList.contains('pronta'),
          ctx: !!document.querySelector('.falaCtx.viva'),
          ret: (() => { const r = document.getElementById('falaRetrato'); if (!r) return false; return getComputedStyle(r).display !== 'none' && getComputedStyle(r).opacity !== '0'; })(),
          viva: falaViva
        }));
        if (d.viva && d.pronta && d.txt && linhas[linhas.length - 1] !== d.txt) {
          linhas.push(d.txt); meta.push({ ctx: d.ctx, ret: d.ret });
        }
      }
      return { linhas, meta };
    }
  };

  const log = (...a) => console.log(...a);
  const sec = t => log('\n================ ' + t + ' ================');

  // ============================================================
  // §1 · A PRIMEIRA ABERTURA — save vazio
  // ============================================================
  await page.goto(alvo());
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(1000);
  if (!quer(1)) {   // as seções seguintes precisam estar NA RUA, não no menu
    await page.evaluate(() => { fecharTelas(); S.aberturas = 1; salvar(); });
    await page.waitForTimeout(300);
  }

  if (quer(1)) {
    sec('§1 · PRIMEIRA ABERTURA (save vazio)');
    const boot = await page.evaluate(() => ({
      telas: ["telaMenu", "telaCapitulos", "telaFala", "telaCompletude", "telaConfig", "telaFontes"]
        .filter(t => document.getElementById(t).classList.contains('aberta')),
      botoes: [...document.querySelectorAll('#telaMenu .telaBtn')].map(b => b.id),
      retorno: document.getElementById('retorno').getAttribute('aria-hidden'),
      titulo: (document.getElementById('menuTit') || {}).textContent,
      subs: [...document.querySelectorAll('#telaMenu div')].map(d => (d.textContent || '').trim()).filter(t => t && t.length < 90).slice(0, 6)
    }));
    log('boot -> telas abertas:', boot.telas.join(',') || '(nenhuma), retorno', boot.retorno);
    log('  botões do menu:', boot.botoes.join(', '));
    await T.print('01-menu-primeira-vez');

    // o que o menu diz sem rótulo de botão (o texto de tela)
    const txtMenu = await page.evaluate(() => document.getElementById('telaMenu').innerText.replace(/\n+/g, ' | '));
    log('  texto legível do menu:', JSON.stringify(txtMenu).slice(0, 300));

    // JOGAR
    const t0 = Date.now();
    await T.em('#btnJogar');
    await page.waitForTimeout(400);
    const aposJogar = await T.estado();
    log('JOGAR -> telas:', aposJogar.telas.join(',') , '| cerimônia:', aposJogar.cerim, '| fala:', aposJogar.fala, '| título:', aposJogar.titulo);
    await T.print('02-cerimonia-pindorama');
    if (!aposJogar.cerim && !aposJogar.fala) nota('ALTA', 'JOGAR do save vazio não abriu nem cerimônia nem fala');

    // a cerimônia sozinha: quanto tempo ela dura se ninguém tocar?
    let esperou = 0;
    while (esperou < 6000) {
      const c = await page.evaluate(() => emCerimonia());
      if (!c) break;
      await page.waitForTimeout(200); esperou += 200;
    }
    log('  cerimônia sozinha durou', esperou, 'ms (sem toque)');

    const ab = await T.lerFala();
    log('ABERTURA PINDORAMA -> ' + ab.linhas.length + ' linhas, ' + (Date.now() - t0) + ' ms desde o JOGAR');
    ab.linhas.forEach((l, i) => log('   ' + (i + 1) + '. [img:' + (ab.meta[i].ctx ? 'sim' : 'não') + '] ' + l.slice(0, 96)));
    await T.print('03-rua-primeiro-quadro');

    const rua = await page.evaluate(() => ({
      telas: ["telaMenu", "telaCapitulos", "telaFala"].filter(t => document.getElementById(t).classList.contains('aberta')),
      hud: getComputedStyle(document.getElementById('hudTop')).transform,
      rotulo: document.getElementById('rotuloEpoca').getAttribute('aria-label'),
      dica: document.getElementById('dicaSeta').getAttribute('aria-hidden'),
      botao: !!document.getElementById('btnClique').offsetParent,
      cartoes: [...document.querySelectorAll('#controls .cartao .cn')].map(e => e.getAttribute('aria-label')||e.textContent)
    }));
    log('a rua -> telas:', rua.telas.join(',') || '(nenhuma)', '| era:', rua.rotulo, '| cartões:', rua.cartoes.join('/'), '| dica visível:', rua.dica);

    // ---- os primeiros 45 s, jogados de verdade ----
    const antes = await page.evaluate(() => ({ t: S.energiaTotal, x: worldX }));
    const cv = await page.locator('#scene').boundingBox();
    const bot = await page.locator('#btnClique').boundingBox();
    const t1 = Date.now();
    let toques = 0;
    while (Date.now() - t1 < 45000) {
      await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2);
      toques++;
      if (toques % 7 === 0) { await page.touchscreen.tap(cv.x + cv.width * 0.25, cv.y + cv.height * 0.5); toques++; }
      await page.waitForTimeout(90);
    }
    const dep = await page.evaluate(() => ({
      t: S.energiaTotal, x: worldX, prog: progressoCena(),
      up: [...document.querySelectorAll('#listaUp .upgrade')].filter(u => !u.classList.contains('oculta')).length
    }));
    log('45 s jogados a dedo -> ' + toques + ' toques | impacto ' + (dep.t - antes.t).toFixed(1) +
      ' (' + ((dep.t - antes.t) / 45).toFixed(2) + '/s) | chão ' + Math.round(dep.x - antes.x) + ' px | progresso da cena ' + (dep.prog * 100).toFixed(1) + '%');
    log('  projeção até a 1ª virada de cena (1500): ' + ((1500 - dep.t) / ((dep.t - antes.t) / 45) / 60).toFixed(1) + ' min a esse ritmo');
    await T.print('04-45s-jogados');

    // o u1 já é comprável? alguém avisa?
    const upg = await page.evaluate(() => {
      const r = {};
      r.aberto = document.getElementById('sheetUpgrades').classList.contains('aberto');
      r.custos = [...document.querySelectorAll('#listaUp .upgrade:not(.oculta) button')].map(b => b.textContent.trim());
      r.podeU1 = S.energia >= CFG.custoU1;
      r.energia = +S.energia.toFixed(0);
      return r;
    });
    log('  upgrades -> gaveta aberta:', upg.aberto, '| custos:', upg.custos.join(' / '), '| energia', upg.energia, '| dá pro u1:', upg.podeU1);
    if (!upg.aberto) nota('MÉDIA', 'a gaveta de upgrades nasce fechada e nada na tela diz que ela existe (só o cartão MELHORIAS na barra)');
  }

  // ============================================================
  // §2 · CAPÍTULO 1 → A TRAVESSIA → CAPÍTULO 2
  // ============================================================
  if (quer(2)) {
    sec('§2 · A FRONTEIRA DO CAP. 1, O FECHO, A TRAVESSIA E PALMARES');
    // [SEMEADO] impacto acumulado empurrado para 60 abaixo do limiar da 1ª virada de CENA.
    const l = await page.evaluate(() => ({ cena: LIMIAR_CENA, total: TOTAL_CENAS, fim: LIMIAR_FIM, lim: LIMIARES }));
    log('mapa de progressão -> LIMIAR_CENA', l.cena, '| cenas', l.total, '| limiares', l.lim.join(','), '| fim', l.fim);
    await page.evaluate(() => { S.energiaTotal = LIMIAR_CENA - 40; S.energia = S.energiaTotal; salvar(); });
    log('[SEMEADO] S.energiaTotal = LIMIAR_CENA - 40 (pula ~20 min de grind até a 1ª virada de cena)');

    const bot = await page.locator('#btnClique').boundingBox();
    // rola até a virada de CENA (dentro do mesmo capítulo)
    let n = 0;
    while (n < 400) {
      const e = await page.evaluate(() => ({ c: S.cenario, t: S.energiaTotal, f: falaAberta() }));
      if (e.c >= 1) break;
      await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2);
      await page.waitForTimeout(60); n++;
    }
    await page.waitForTimeout(600);
    const vCena = await page.evaluate(() => ({
      cena: S.cenario, fala: falaAberta(), cerim: emCerimonia(),
      floats: floats.map(f => f.txt).filter(Boolean),
      rotulo: document.getElementById('rotuloEpoca').getAttribute('aria-label')
    }));
    log('virada de CENA (0→1, mesmo capítulo) -> cena', vCena.cena, '| fala:', vCena.fala, '| cerimônia:', vCena.cerim, '| float:', vCena.floats.join(','), '| rótulo:', vCena.rotulo);
    await T.print('05-virada-de-cena');
    if (!vCena.floats.length) nota('BAIXA', 'a virada de CENA não deixou float na tela no instante medido — nada distingue a nova cena da anterior além da pintura');

    // [SEMEADO] agora até a beira da virada de CAPÍTULO
    await page.evaluate(() => { S.energiaTotal = LIMIARES[1] - 30; S.energia = S.energiaTotal; salvar(); });
    log('[SEMEADO] S.energiaTotal = LIMIARES[1] - 30 (beira da virada PINDORAMA→PALMARES)');
    n = 0;
    while (n < 400) {
      const e = await page.evaluate(() => ({ f: falaAberta(), t: S.energiaTotal }));
      if (e.f) break;
      await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2);
      await page.waitForTimeout(60); n++;
    }
    const eFecho = await T.estado();
    log('a virada abriu -> título:', eFecho.titulo, '| trav:', eFecho.trav, '| cerimônia:', eFecho.cerim);
    await T.print('06-fecho-pindorama');
    const fe = await page.evaluate(() => ({ t: document.getElementById('falaTit').getAttribute('aria-label'), n: falaLinhas.length }));
    log('FECHO de', fe.t, '->', fe.n, 'linhas');

    // percorre o fecho até a travessia começar
    const fechoLinhas = [];
    for (let i = 0; i < 40; i++) {
      const st = await page.evaluate(() => ({ trav: travessiaAtiva(), fala: falaViva, txt: document.getElementById('falaTxt').textContent }));
      if (st.trav) break;
      if (!st.fala) break;
      await T.xy(195, 640);
      const d = await page.evaluate(() => ({ txt: document.getElementById('falaTxt').textContent, pronta: document.getElementById('falaCaixa').classList.contains('pronta') }));
      if (d.pronta && d.txt && fechoLinhas[fechoLinhas.length - 1] !== d.txt) fechoLinhas.push(d.txt);
    }
    fechoLinhas.forEach((t, i) => log('   fecho ' + (i + 1) + '. ' + t.slice(0, 96)));

    // ---------- A TRAVESSIA ----------
    await page.waitForTimeout(500);
    const tv = await page.evaluate(() => ({
      ativa: travessiaAtiva(), n: falaLinhas.length, titulo: document.getElementById('falaTit').textContent,
      quando: document.getElementById('falaSub').textContent,
      travessando: document.body.classList.contains('travessando'),
      semPular: document.body.classList.contains('semPular'),
      pularVis: (() => { const b = document.getElementById('btnFalaPular'); return getComputedStyle(b).display; })(),
      retrato: getComputedStyle(document.getElementById('falaRetrato')).display,
      botao: !!document.getElementById('btnClique').offsetParent,
      rotuloBotao: (document.getElementById('cliqueRotulo').getAttribute('aria-label')||'').trim(),
      hud: !!document.getElementById('hudTop').offsetParent,
      seta: getComputedStyle(document.getElementById('falaSeta')).opacity,
      noPontoDoBotao: (() => { const b = document.getElementById('btnClique').getBoundingClientRect();
        const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return el ? (el.id || el.className || el.tagName) : null; })(),
      bit: S.travessias
    }));
    log('A TRAVESSIA -> ativa:', tv.ativa, '| linhas:', tv.n, '| título:', tv.titulo, '·', tv.quando);
    log('   body.travessando:', tv.travessando, '| semPular:', tv.semPular, '| PULAR display:', tv.pularVis, '| retrato:', tv.retrato);
    log('   botão dourado na tela:', tv.botao, '| rótulo dele:', JSON.stringify(tv.rotuloBotao), '| quem está no ponto dele:', tv.noPontoDoBotao);
    log('   HUD visível:', tv.hud, '| seta "toque para continuar" opacidade:', tv.seta, '| bit gravado JÁ:', tv.bit);
    await T.print('07-travessia-linha1');
    if (tv.bit) nota('MÉDIA', 'o bit da travessia já está gravado na PRIMEIRA linha — recarregar aqui devolve o PULAR sem ninguém ter atravessado (B2 do relatório anterior, SEGUE)');
    if (/\+/.test(tv.rotuloBotao)) nota('MÉDIA', 'o botão dourado promete "' + tv.rotuloBotao + '" durante a travessia e não paga (B7 do relatório anterior, SEGUE)');

    // (a) ela anda sozinha? o desenho vive? — 25 s SEM tocar em nada
    const parado0 = await page.evaluate(() => ({ i: falaI, t: travessiaT, r: relogio }));
    await page.waitForTimeout(25000);
    const parado1 = await page.evaluate(() => ({ i: falaI, t: +travessiaT.toFixed(1), r: +relogio.toFixed(0) }));
    log('   25 s SEM TOCAR -> linha ' + parado0.i + ' → ' + parado1.i + ' | travessiaT ' + parado1.t + ' | relógio ' + parado0.r.toFixed(0) + ' → ' + parado1.r);
    if (parado0.i === parado1.i) nota('ALTA', 'a travessia NÃO anda sozinha: 25 s parada na linha ' + parado0.i + '. Os "~90 s" do desenho são o tempo de quem toca, não do trecho — quem larga o telefone fica ali para sempre');
    await T.print('08-travessia-25s-sem-tocar');

    // (b) o botão dourado paga? (toque real no botão, não no meio da tela)
    const bt = await page.locator('#btnClique').boundingBox();
    const pg0 = await page.evaluate(() => ({ e: S.energiaTotal, i: falaI }));
    for (let i = 0; i < 10; i++) { await page.touchscreen.tap(bt.x + bt.width / 2, bt.y + bt.height / 2); await page.waitForTimeout(50); }
    const pg1 = await page.evaluate(() => ({ e: S.energiaTotal, i: falaI }));
    log('   10 toques NO BOTÃO DOURADO -> impacto ' + (pg1.e - pg0.e).toFixed(2) + ' | a fala avançou ' + (pg1.i - pg0.i) + ' linha(s)');
    if (pg1.i === pg0.i && pg1.e === pg0.e) nota('MÉDIA', 'quem toca no botão dourado (o verbo do jogo) durante a travessia não ganha nada E não avança o texto: dez toques, zero resposta. A saída existe, mas é tocar em OUTRO lugar');

    // (c) atravessar de verdade, cronometrando o mínimo possível
    const tA = Date.now();
    const linhas = [];
    for (let i = 0; i < 80; i++) {
      const st = await page.evaluate(() => ({ ativa: travessiaAtiva(), viva: falaViva, i: falaI }));
      if (!st.ativa || !st.viva) break;
      await T.xy(195, 500);
      const d = await page.evaluate(() => ({ txt: document.getElementById('falaTxt').textContent, pronta: document.getElementById('falaCaixa').classList.contains('pronta') }));
      if (d.pronta && d.txt && linhas[linhas.length - 1] !== d.txt) linhas.push(d.txt);
      if (linhas.length === 9) await T.print('09-travessia-meio');
    }
    const tB = Date.now();
    log('   A TRAVESSIA percorrida em ' + ((tB - tA) / 1000).toFixed(1) + ' s de relógio real, ' + linhas.length + ' linhas lidas');
    linhas.forEach((t, i) => log('     ' + String(i + 1).padStart(2) + '. ' + t));
    const temOceano = linhas.some(t => /cemitério de africanos/.test(t));
    const temCuritiba = linhas.some(t => /Curitiba/.test(t));
    const temParaguai = linhas.some(t => /Paraguai/.test(t));
    log('   frase do oceano:', temOceano, '| Curitiba:', temCuritiba, '| Guerra do Paraguai:', temParaguai);
    if (!temOceano || !temCuritiba || !temParaguai) nota('ALTA', 'a travessia não trouxe alguma das falas prometidas (oceano/Curitiba/Paraguai)');

    await page.waitForTimeout(700);
    const dep = await T.estado();
    log('   depois da travessia -> ', dep.nome + '@' + dep.cena, '| cerimônia:', dep.cerim, '| fala:', dep.fala, '| título:', dep.titulo);
    await T.print('10-cerimonia-palmares');
    const abP = await T.lerFala();
    log('ABERTURA PALMARES -> ' + abP.linhas.length + ' linhas');
    abP.linhas.forEach((l, i) => log('   ' + (i + 1) + '. [img:' + (abP.meta[i].ctx ? 'sim' : 'não') + '] ' + l.slice(0, 96)));
    await T.print('11-palmares-rua');
  }

  // ============================================================
  // §3 · O VERBO DE CADA CAPÍTULO — a mão faz o que o texto promete?
  // ============================================================
  if (quer(3)) {
    sec('§3 · O VERBO DE CADA CAPÍTULO');
    const bot = await page.locator('#btnClique').boundingBox();
    const cv = await page.locator('#scene').boundingBox();

    async function medirCapitulo(nome) {
      // limpa a rua e deixa o motor semear sozinho; joga 30 s a dedo e mede o que a mão fez
      await page.evaluate(() => { palavraDedo = 0; palavraCorrente = 0; grupo.length = 0; ficando.length = 0; });
      const a = await page.evaluate(() => ({ t: S.energiaTotal, x: worldX, ac: S.acolhidos.slice() }));
      const t0 = Date.now(); let toques = 0;
      while (Date.now() - t0 < 30000) {
        await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2); toques++;
        if (toques % 8 === 0) await page.touchscreen.tap(cv.x + cv.width * 0.25, cv.y + cv.height * 0.5);
        await page.waitForTimeout(80);
      }
      const b = await page.evaluate(() => ({
        t: S.energiaTotal, x: worldX, ac: S.acolhidos.slice(), grupo: grupo.length,
        dedo: typeof palavraDedo !== 'undefined' ? palavraDedo : -1,
        corrente: typeof palavraCorrente !== 'undefined' ? palavraCorrente : -1,
        mobs: mobs.length, portadoras: mobs.filter(m => m.sabe).length,
        cuidado: +S.cuidado.toFixed(2), rec: JSON.stringify(S.recursos || null)
      }));
      const e = await page.evaluate(() => epocaAtual());
      log(nome + ' — 30 s a dedo (' + toques + ' toques): impacto ' + (b.t - a.t).toFixed(1) +
        ' (' + ((b.t - a.t) / 30).toFixed(2) + '/s) | chão ' + Math.round(b.x - a.x) + ' px');
      log('   acolhidas nesta época: +' + ((b.ac[e] | 0) - (a.ac[e] | 0)) + ' | fila viva: ' + b.grupo +
        ' | palavra a dedo: ' + b.dedo + ' | palavra pela corrente: ' + b.corrente + ' | portadoras em quadro: ' + b.portadoras + ' | cuidado ' + b.cuidado);
      return b;
    }

    const m2 = await medirCapitulo('PALMARES (acolher)');
    await T.print('12-palmares-30s');
    if (m2.grupo === 0) nota('ALTA', 'PALMARES: 30 s a dedo e a fila do acolher ficou vazia — o verbo prometido pela abertura não apareceu na mão');

    // SALVADOR: pela virada de verdade
    await page.evaluate(() => { S.energiaTotal = LIMIARES[3] - 25; S.energia = S.energiaTotal; salvar(); });
    log('[SEMEADO] impacto = LIMIARES[3] - 25 (beira da virada PALMARES→SALVADOR)');
    for (let i = 0; i < 400; i++) {
      const e = await page.evaluate(() => falaAberta());
      if (e) break;
      await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2);
      await page.waitForTimeout(60);
    }
    const eF2 = await page.evaluate(() => ({ t: document.getElementById('falaTit').getAttribute('aria-label'), n: falaLinhas.length, trav: travessiaAtiva() }));
    log('virada PALMARES→SALVADOR -> fecho de', eF2.t, '(' + eF2.n + ' linhas) | travessia entre eles:', eF2.trav);
    await T.print('13-fecho-palmares');
    const f2 = await T.lerFala();
    f2.linhas.forEach((t, i) => log('   fecho ' + (i + 1) + '. ' + t.slice(0, 110)));
    await page.waitForTimeout(600);
    const dep2 = await T.estado();
    log('   logo depois -> ', dep2.nome + '@' + dep2.cena, '| fala:', dep2.fala, '| título:', dep2.titulo);
    const houveTravessia = await page.evaluate(() => travessiaEntre('palmares', 'salvador'));
    log('   travessia declarada entre palmares e salvador:', houveTravessia >= 0 ? 'sim' : 'NÃO');
    await T.print('14-cerimonia-salvador');
    const abS = await T.lerFala();
    log('ABERTURA SALVADOR -> ' + abS.linhas.length + ' linhas');
    abS.linhas.forEach((l, i) => log('   ' + (i + 1) + '. [img:' + (abS.meta[i].ctx ? 'sim' : 'não') + '] ' + l.slice(0, 96)));

    const m3 = await medirCapitulo('SALVADOR (levar palavra)');
    await T.print('15-salvador-30s');
    if (m3.corrente === 0) nota('ALTA', 'SALVADOR: 30 s a dedo e ZERO atendidas pela corrente — a palavra não correu sem o dedo');

    // AINDA AQUI
    await page.evaluate(() => { S.energiaTotal = LIMIARES[4] - 25; S.energia = S.energiaTotal; salvar(); });
    log('[SEMEADO] impacto = LIMIARES[4] - 25 (beira da virada SALVADOR→AINDA AQUI)');
    for (let i = 0; i < 400; i++) {
      const e = await page.evaluate(() => falaAberta());
      if (e) break;
      await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2);
      await page.waitForTimeout(60);
    }
    const eF3 = await page.evaluate(() => ({ t: document.getElementById('falaTit').getAttribute('aria-label'), n: falaLinhas.length }));
    log('virada SALVADOR→AINDA AQUI -> fecho de', eF3.t, '(' + eF3.n + ' linhas)');
    const f3 = await T.lerFala();
    f3.linhas.forEach((t, i) => log('   fecho ' + (i + 1) + '. ' + t.slice(0, 110)));
    await page.waitForTimeout(600);
    await T.print('16-cerimonia-hoje');
    const abH = await T.lerFala();
    log('ABERTURA AINDA AQUI -> ' + abH.linhas.length + ' linhas');
    abH.linhas.forEach((l, i) => log('   ' + (i + 1) + '. [img:' + (abH.meta[i].ctx ? 'sim' : 'não') + '] ' + l.slice(0, 96)));
    const m4 = await medirCapitulo('AINDA AQUI (?)');
    await T.print('17-hoje-30s');

    // ---- o FIM do jogo ----
    await page.evaluate(() => { S.energiaTotal = LIMIAR_FIM - 25; S.energia = S.energiaTotal; salvar(); });
    log('[SEMEADO] impacto = LIMIAR_FIM - 25 (beira do fim do jogo)');
    for (let i = 0; i < 500; i++) {
      const e = await page.evaluate(() => falaAberta());
      if (e) break;
      await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2);
      await page.waitForTimeout(60);
    }
    const eFim = await page.evaluate(() => ({ t: document.getElementById('falaTit').getAttribute('aria-label'), n: falaLinhas.length, fala: falaAberta(), total: S.energiaTotal }));
    log('O FIM -> fala aberta:', eFim.fala, '| título:', eFim.t, '|', eFim.n, 'linhas | impacto', eFim.total.toFixed(0));
    await T.print('18-fecho-final');
    const fFim = await T.lerFala();
    fFim.linhas.forEach((t, i) => log('   ' + (i + 1) + '. ' + t.slice(0, 120)));
    await page.waitForTimeout(800);
    const posFim = await page.evaluate(() => ({
      telas: ["telaMenu", "telaCapitulos", "telaFala", "telaCompletude"].filter(t => document.getElementById(t).classList.contains('aberta')),
      cena: S.cenario, prog: +(progressoCena() * 100).toFixed(0), rotulo: document.getElementById('rotuloEpoca').getAttribute('aria-label'),
      total: +S.energiaTotal.toFixed(0)
    }));
    log('   DEPOIS DO FIM -> telas:', posFim.telas.join(',') || '(nenhuma, voltou para a rua)', '| cena', posFim.cena, '| progresso', posFim.prog + '%', '| rótulo:', posFim.rotulo);
    await T.print('19-depois-do-fim');
    // e se continuar jogando depois do fim?
    const antesX = await page.evaluate(() => ({ t: S.energiaTotal }));
    for (let i = 0; i < 40; i++) { await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2); await page.waitForTimeout(60); }
    const depX = await page.evaluate(() => ({ t: S.energiaTotal, fala: falaAberta(), prog: +(progressoCena() * 100).toFixed(0) }));
    log('   40 toques DEPOIS do fecho final -> impacto +' + (depX.t - antesX.t).toFixed(0) + ' | fala:', depX.fala, '| progresso', depX.prog + '%');
    if (!posFim.telas.length && depX.prog >= 100) nota('ALTA', 'depois do fecho final o jogo devolve a pessoa à mesma rua, com a barra em 100%, e nada mais acontece: não há tela de fim, nem crédito, nem convite — o percurso termina sem fecho de PRODUTO');
  }

  // ============================================================
  // §4 · A HISTÓRIA — as 26 páginas de ponta a ponta
  // ============================================================
  if (quer(4)) {
    sec('§4 · A HISTÓRIA (o quadrinho), rolada de ponta a ponta');
    await page.evaluate(() => { fecharTelas(); });
    await page.evaluate(() => { fecharTudo(); abrirTela('telaMenu'); });
    await page.waitForTimeout(200);
    const tA = Date.now();
    await T.em('#btnCompletude');
    await page.waitForTimeout(400);
    const tMontagem = Date.now() - tA;
    const q = await page.evaluate(() => {
      const l = document.getElementById('listaCenas');
      const pgs = [...l.children];
      return {
        n: pgs.length, alturas: [...new Set(pgs.map(p => p.getBoundingClientRect().height | 0))],
        scrollH: l.scrollHeight, clientH: l.clientHeight, barra: l.offsetWidth - l.clientWidth,
        vazias: pgs.filter(p => !p.innerText.trim()).length,
        comImagem: pgs.filter(p => p.querySelector('.qFundo')).length,
        classes: pgs.map(p => p.className).slice(0, 30)
      };
    });
    log('quadrinho -> ' + q.n + ' páginas | alturas distintas: ' + q.alturas.join(',') + ' | rolo ' + q.scrollH + ' de ' + q.clientH +
      ' | barra ' + q.barra + ' | vazias ' + q.vazias + ' | com imagem própria ' + q.comImagem);
    log('   montagem levou ' + tMontagem + ' ms');
    await T.print('20-historia-p1');

    // rola página a página com gesto real (arrasto) e fotografa marcos
    const box = await page.locator('#listaCenas').boundingBox();
    const textos = [];
    for (let i = 0; i < q.n; i++) {
      const info = await page.evaluate((k) => {
        const l = document.getElementById('listaCenas');
        const p = l.children[k];
        if (!p) return null;
        l.scrollTop = k * l.clientHeight;
        return { cls: p.className, txt: p.innerText.replace(/\n+/g, ' § ').slice(0, 130), img: !!p.querySelector('.qFundo'), balao: !!p.querySelector('.qCom, .qBalao') };
      }, i);
      if (!info) break;
      textos.push(info);
      await page.waitForTimeout(60);
      if ([0, 6, 12, 18, 25].includes(i)) await T.print('21-historia-p' + (i + 1));
    }
    textos.forEach((t, i) => log('   p' + String(i + 1).padStart(2) + ' [' + (t.img ? 'IMG' : '   ') + (t.balao ? ' BAL' : '    ') + '] ' + t.cls.padEnd(22).slice(0, 22) + ' ' + t.txt));
    // o encaixe funciona?
    const snap = await page.evaluate(() => {
      const l = document.getElementById('listaCenas');
      const r = [];
      for (let k = 1; k <= 3; k++) { l.scrollTop = k * l.clientHeight * 0.75; r.push(l.scrollTop % l.clientHeight); }
      return r;
    });
    log('   resto do encaixe depois de rolar 3/4 de página:', snap.join(','));
    const fim = await page.evaluate(() => {
      const l = document.getElementById('listaCenas');
      l.scrollTop = l.scrollHeight;
      const b = document.getElementById('btnVoltarComp').getBoundingClientRect();
      const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return { top: l.scrollTop, max: l.scrollHeight - l.clientHeight, voltar: el ? (el.id || el.className) : null };
    });
    log('   fim do rolo:', fim.top, 'de', fim.max, '| quem está no ponto do VOLTAR:', fim.voltar);
    await T.print('22-historia-fim');
  }

  // ============================================================
  // §5 · O DIA 2
  // ============================================================
  if (quer(5)) {
    sec('§5 · O CAMINHO DO DIA 2');
    // Só quando esta seção roda SOZINHA: o dia 2 interessante é o de quem já atravessou
    // capítulos, porque é ele que tem lista de eras com escolha. Rodando 1→5 em sequência o
    // estado já vem de lá e nada aqui é semeado.
    const precisa = await page.evaluate(() => (S.fronteira | 0) < 4);
    if (precisa) {
      await page.evaluate(() => {
        S.energiaTotal = LIMIARES[3] + 200; S.energia = S.energiaTotal;
        S.cenario = 4; S.fronteira = 4; S.aberturas = 7; S.fechos = 3; S.travessias = 1;
        S.acolhidos = [0, 17, 0, 0]; S.u1 = true; S.u2 = true;
        salvar();
      });
      log('[SEMEADO] esta seção rodou fora da sequência: save posto em SALVADOR@4, fronteira 4, 17 acolhidas, u1+u2 — o estado que a §3 produziria');
    }
    const chaves = await page.evaluate(() => Object.keys(localStorage));
    log('chaves no localStorage:', chaves.join(', '));
    // envelhece o save e o registro de retenção em 9 h e 1 dia
    await page.evaluate(() => {
      const k = Object.keys(localStorage).find(x => /jogo_brasil_v1/.test(x));
      const j = JSON.parse(localStorage.getItem(k));
      j.salvoEm = Date.now() - 9 * 3600 * 1000;
      localStorage.setItem(k, JSON.stringify(j));
      const kr = Object.keys(localStorage).find(x => /retencao/.test(x));
      if (kr) {
        const r = JSON.parse(localStorage.getItem(kr));
        const d = new Date(Date.now() - 86400000);
        r.ultimo = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        localStorage.setItem(kr, JSON.stringify(r));
      }
    });
    log('[SEMEADO] save carimbado 9 h atrás e registro de retenção com `ultimo` = ontem (não dá para esperar um dia)');
    // ...e o `salvar` é neutralizado ANTES do reload: `beforeunload` grava `salvoEm = agora` e
    // apagaria o carimbo de 9 h que acabamos de pôr. No aparelho de verdade isso é correto
    // (fechar o jogo carimba a hora de fechar); aqui é o teste que precisa não ser desfeito.
    await page.evaluate(() => { window.salvar = function () {}; window.salvarRetencao = function () {}; });
    await page.reload();
    await page.waitForTimeout(1200);
    const volta = await page.evaluate(() => ({
      retorno: document.getElementById('retorno').getAttribute('aria-hidden'),
      linhas: [...document.querySelectorAll('#retLista *')].map(e => e.textContent.trim()).filter(Boolean),
      telas: ["telaMenu", "telaCapitulos", "telaFala"].filter(t => document.getElementById(t).classList.contains('aberta')),
      noPonto: (() => { const b = document.getElementById('retorno').getBoundingClientRect();
        const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return el ? (el.id || el.className) : null; })(),
      cena: S.cenario, fronteira: S.fronteira, epoca: EPOCAS[epocaAtual()].nome, total: +S.energiaTotal.toFixed(0)
    }));
    log('volta do dia 2 -> painel aberto:', volta.retorno === 'false', '| telas:', volta.telas.join(','), '| quem está no ponto do painel:', volta.noPonto);
    log('   ' + volta.epoca + '@' + volta.cena + ' (fronteira ' + volta.fronteira + '), impacto ' + volta.total);
    volta.linhas.forEach(l => log('   painel: ' + l));
    await T.print('23-dia2-retorno');
    // um toque fecha
    await T.xy(195, 300);
    await page.waitForTimeout(300);
    const dep = await page.evaluate(() => ({
      retorno: document.getElementById('retorno').getAttribute('aria-hidden'),
      telas: ["telaMenu", "telaCapitulos"].filter(t => document.getElementById(t).classList.contains('aberta')),
      botoes: [...document.querySelectorAll('#telaMenu .telaBtn')].map(b => b.id)
    }));
    log('   um toque -> painel:', dep.retorno, '| telas:', dep.telas.join(','));
    await T.print('24-dia2-menu');
    // JOGAR no dia 2
    await T.em('#btnJogar');
    await page.waitForTimeout(400);
    const lista = await page.evaluate(() => ({
      telas: ["telaMenu", "telaCapitulos", "telaFala"].filter(t => document.getElementById(t).classList.contains('aberta')),
      itens: [...document.querySelectorAll('#listaCapitulos .capItem')].map(b => ({ cls: b.className, txt: b.innerText.replace(/\n/g, ' / ') }))
    }));
    log('   JOGAR no dia 2 -> telas:', lista.telas.join(','));
    lista.itens.forEach((it, i) => log('     era ' + (i + 1) + ' [' + it.cls + '] ' + it.txt));
    await T.print('25-dia2-lista-eras');

    // escolher o capítulo da FRONTEIRA: retoma?
    const idx = await page.evaluate(() => epocaDoCenario(S.fronteira | 0));
    const antes = await page.evaluate(() => ({ c: S.cenario, v: typeof visitando !== 'undefined' ? visitando : null }));
    const its = await page.locator('#listaCapitulos .capItem').all();
    await its[idx].tap();
    await page.waitForTimeout(500);
    const posF = await page.evaluate(() => ({ c: S.cenario, v: visitando, fala: falaAberta(), tit: document.getElementById('falaTit').getAttribute('aria-label') }));
    log('   escolher o capítulo DA FRONTEIRA -> cena ' + antes.c + ' → ' + posF.c + ' | visitando:', posF.v, '| abriu fala:', posF.fala, posF.tit);
    await T.print('26-dia2-fronteira');
    // fecha a fala e mede se o jogo anda.
    // ⚠ A ESPERA NÃO É FRESCURA: `body.emTela` translada `#controls` para fora da tela e a
    // volta tem transição. Medir a caixa do botão dourado no MESMO instante em que a classe
    // sai devolve a posição de FORA — e os 30 toques seguintes caem no vazio. Duas rodadas
    // deste arquivo mediram "+0 de impacto no dia 2" por causa disso, e não havia bug nenhum.
    await page.evaluate(() => { fecharTelas(); });
    await page.waitForTimeout(500);
    const a1 = await page.evaluate(() => ({ t: S.energiaTotal, c: S.cenario }));
    const bt = await page.locator('#btnClique').boundingBox();
    for (let i = 0; i < 30; i++) { await page.touchscreen.tap(bt.x + bt.width / 2, bt.y + bt.height / 2); await page.waitForTimeout(50); }
    const b1 = await page.evaluate(() => ({ t: S.energiaTotal, c: S.cenario }));
    log('   30 toques -> impacto +' + (b1.t - a1.t).toFixed(0) + ' | cena ' + a1.c + ' → ' + b1.c + ' (o jogo ANDA: ' + (b1.t > a1.t) + ')');

    // agora VISITAR um capítulo antigo
    await page.evaluate(() => { fecharTudo(); abrirTela('telaMenu'); });
    await T.em('#btnJogar');
    await page.waitForTimeout(300);
    const its2 = await page.locator('#listaCapitulos .capItem').all();
    await its2[0].tap();
    await page.waitForTimeout(500);
    const vis = await page.evaluate(() => ({ c: S.cenario, f: S.fronteira, v: visitando, fala: falaAberta(), tit: document.getElementById('falaTit').getAttribute('aria-label') }));
    log('   VISITAR PINDORAMA -> cena ' + vis.c + ' (fronteira ' + vis.f + ') | visitando:', vis.v, '| fala:', vis.fala, vis.tit);
    await page.evaluate(() => { fecharTelas(); });
    await page.waitForTimeout(600);   // ver a nota acima: a barra de controles volta com transição
    const vHud = await page.evaluate(() => ({
      rotulo: document.getElementById('rotuloEpoca').getAttribute('aria-label'),
      prog: +(progressoCena() * 100).toFixed(0),
      sussurro: document.getElementById('sussurroEra').textContent,
      marco: document.getElementById('marcoDist').textContent
    }));
    log('   HUD durante a VISITA -> era:', vHud.rotulo, '| barra', vHud.prog + '%', '| sussurro:', JSON.stringify(vHud.sussurro), '| marco:', JSON.stringify(vHud.marco));
    const a2 = await page.evaluate(() => ({ t: S.energiaTotal, c: S.cenario }));
    for (let i = 0; i < 40; i++) { await page.touchscreen.tap(bt.x + bt.width / 2, bt.y + bt.height / 2); await page.waitForTimeout(50); }
    const b2 = await page.evaluate(() => ({ t: S.energiaTotal, c: S.cenario, prog: +(progressoCena() * 100).toFixed(0) }));
    log('   40 toques VISITANDO -> impacto +' + (b2.t - a2.t).toFixed(0) + ' | cena ' + a2.c + ' → ' + b2.c + ' | progresso ' + b2.prog + '%');
    await T.print('27-visitando-pindorama');
    if (b2.c === a2.c && b2.prog >= 100) nota('MÉDIA', 'visitando um capítulo antigo, a barra fica em 100% e nada avança — e NADA na tela diz que se está visitando nem como sair. A saída é MENU → JOGAR → escolher o capítulo da fronteira, e o jogo não a ensina');
  }

  // ---------- fecho ----------
  sec('ERROS DE CONSOLE');
  log(erros.length ? erros.join('\n') : '(nenhum)');
  sec('ACHADOS');
  achados.forEach(a => log('[' + a.grav + '] ' + a.txt));
  await browser.close();
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
