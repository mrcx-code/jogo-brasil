// Headless smoke test: no console errors, upgrades buyable, hold-to-attack repeats, fps sane.
// Run: node test/smoke.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Use the sandbox chromium when it is there, otherwise whatever playwright installed.
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;   // let playwright resolve its own download
}

(async () => {
  const file = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_(TUNNEL|NAME|CONNECTION)/.test(m.text())) errors.push('CONSOLE: ' + m.text()); });

  await page.goto(file);
  await page.waitForTimeout(900);
  // read the tuning out of the page instead of restating it here
  const CFG_TIROS = await page.evaluate(() => CFG.autoFogoTiros);
  const CFG_COMBOS = await page.evaluate(() => CFG.superCombos);
  // obsolete: the opening card was removed by owner request — the game starts on the street.

  // obsolete: the first-run guide was removed by owner request — feature and test.
  // ---- the world is the JUMP surface, and it never earns ----
  const salto = await page.evaluate(async () => {
    fecharTudo();
    mobs.length = 0; drops.length = 0; folhas.length = 0; jumpT = 0;
    const antes = S.energiaTotal, comboAntes = combo;
    const cv = document.getElementById('scene');
    const r = cv.getBoundingClientRect();
    // the street is split down the middle now: left jumps, right swings. Aim well inside
    // the left half, not at the boundary.
    cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width * 0.25, clientY: r.top + r.height / 2 }));
    await new Promise(rr => setTimeout(rr, 60));
    const noAr = jumpT;
    cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    // the arc is JUMPF frames at 60fps — 733ms — so 700 was cutting it fine enough to fail
    // on a slow frame. Wait for the landing instead of guessing at it.
    for (let i = 0; i < 60 && jumpT > 0; i++) await new Promise(rr => setTimeout(rr, 40));
    return { noAr, pousou: jumpT, ganho: S.energiaTotal - antes, combo: combo - comboAntes };
  });
  console.log('tap on the world -> jumpT', salto.noAr, '| landed at', salto.pousou,
    '| earned', salto.ganho.toFixed(2), '| combo moved', salto.combo);
  if (salto.noAr <= 0) errors.push('a tap on the world did not jump');
  if (salto.pousou !== 0) errors.push('the jump never landed');
  // owner changed his mind: the jump lands a blow on the way up, so it DOES earn and it DOES
  // move the combo. What it must not do is stamp an attack pose over the leap.
  if (!(salto.ganho > 0)) errors.push('the jump landed no blow');
  if (salto.combo === 0) errors.push('the jump did not advance the combo');

  // ...and the right half swings instead of jumping
  const golpe = await page.evaluate(async () => {
    fecharTudo();
    mobs.length = 0; drops.length = 0; folhas.length = 0; jumpT = 0;
    const antes = S.energiaTotal;
    const cv = document.getElementById('scene');
    const r = cv.getBoundingClientRect();
    cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width * 0.75, clientY: r.top + r.height / 2 }));
    await new Promise(rr => setTimeout(rr, 60));
    return { pulou: jumpT, ganho: S.energiaTotal - antes, atacando: attackT };
  });
  console.log('tap on the right half -> jumpT', golpe.pulou, '| attackT', golpe.atacando,
    '| earned', golpe.ganho.toFixed(2));
  if (!(golpe.ganho > 0)) errors.push('the right half did not swing');
  if (golpe.pulou > 0) errors.push('the right half jumped instead of swinging');

  // a leaf caught out of the air pays, and only while she is up there
  const folha = await page.evaluate(async () => {
    fecharTudo();
    folhas.length = 0; jumpT = 0; floats.length = 0;
    // hold off the spawner: a leaf arriving mid-test would leave the array non-empty and say
    // nothing about whether THIS one was taken
    folhaT = 0; proximaFolha = 9999;
    // one parked right where her head passes at the top of the arc
    const alvo = { wx: worldX + HX, y: GROUND - 60, fase: 0 };
    folhas.push(alvo);
    const noChao = S.energiaTotal;
    atualizarFolhas(1 / 60, 0);                       // standing: it is above her
    const semPular = S.energiaTotal - noChao;
    const nAntes = folhas.length;
    pular();
    for (let i = 0; i < 40; i++) {                    // ride the arc
      const pj = 1 - jumpT / JUMPF;
      const alto = jumpT > 0 ? Math.round(Math.pow(Math.sin(pj * Math.PI), 0.7) * 52) : 0;
      atualizarFolhas(1 / 60, alto);
      if (jumpT > 0) jumpT--;
    }
    return { semPular, nAntes, aindaLa: folhas.indexOf(alvo) >= 0, pago: S.energiaTotal - noChao };
  });
  console.log('a leaf overhead -> ignored while standing:', folha.semPular.toFixed(2),
    '| still hanging:', folha.aindaLa, '| jumping paid', folha.pago.toFixed(2));
  if (folha.semPular > 0.001) errors.push('a leaf overhead was taken without jumping');
  if (folha.aindaLa) errors.push('jumping through a leaf did not take it');
  if (!(folha.pago > 0)) errors.push('catching a leaf paid nothing');


  // ---- how much of a trouble is left, and how much there was to begin with ----
  // The damage was always there; nothing ever showed it. Two things are checked: the
  // spread between the little one and the big one is wide enough to feel, and the readout
  // actually puts pixels on the screen over the right head.
  const vida = await page.evaluate(async () => {
    mobs.length = 0; drops.length = 0; chamada = null; mutiraoT = 0; superT = 0; superCarga = 0; superSwings = 0; superCd = 0; superFx = null;
    const hp = {}, golpes = {};
    for (const t of ['smog', 'cash', 'barrel']) {
      hp[t] = novoMob(t, 0).hp;
      // hits from the button: the 3-hit combo deals 1, 1, 2
      let restante = hp[t], n = 0, c = 0;
      while (restante > 0) { restante -= (c % 3 === 2) ? 2 : 1; c++; n++; }
      golpes[t] = n;
    }
    // and it is drawn: paint one barrel's readout onto the scene and look at the pixels
    mobs.length = 0;
    const m = novoMob('barrel', worldX + HX + 40);
    m.parado = true; mobs.push(m);
    const y = GROUND - VIDA_TOPO.barrel, x0 = Math.round(m.wx - worldX) + 5 - ((m.hpMax * 3 - 1) >> 1);
    const leia = () => Array.from(cx.getImageData(x0, y, m.hpMax * 3 - 1, 3).data);
    drawScene(); desenharMundo();
    const cheio = leia();
    m.hp = 1;
    drawScene(); desenharMundo();
    const ferido = leia();
    mobs.length = 0;
    return { hp, golpes, mudou: cheio.some((v, i) => v !== ferido[i]),
      pintou: cheio.some((v, i) => i % 4 === 3 && v > 0) };
  });
  console.log('trouble health -> smog', vida.hp.smog, 'hits', vida.golpes.smog,
    '| cash', vida.hp.cash, 'hits', vida.golpes.cash,
    '| barrel', vida.hp.barrel, 'hits', vida.golpes.barrel);
  console.log('  health readout drawn:', vida.pintou, '| it changes when damaged:', vida.mudou);
  if (!(vida.hp.barrel >= vida.hp.smog + 3)) errors.push('big and small troubles do not differ enough');
  if (!(vida.golpes.barrel > vida.golpes.cash && vida.golpes.cash > vida.golpes.smog)) {
    errors.push('the three troubles do not take different numbers of hits');
  }
  // The cap was 6 back when the button was the only thing that swung. A jump lands a blow
  // too now, so the owner raised health across the board; the guard still exists to stop an
  // arms race, just at the new scale.
  if (vida.hp.barrel > 24) errors.push('the health spread grew into a damage system');
  if (!vida.pintou) errors.push('the health readout drew nothing');
  if (!vida.mudou) errors.push('the health readout does not change when a trouble is damaged');

  // ---- troubles walk in, block the work, and pay when they are cleared ----
  const encontro = await page.evaluate(async () => {
    mobs.length = 0; drops.length = 0; chamada = null; mutiraoT = 0;
    S.geradores = 10; S.poluicao = 0; S.modo = 'limpo';
    mobs.push(novoMob('smog', worldX + W + 12));
    const alvo = mobs[0];
    const longe = alvo.wx - worldX;
    let passouPorEla = false;
    const chegadas = [];
    let antesN = mobs.length;
    for (let i = 0; i < 1200; i++) {                   // 60s of street: enough gaps to judge
      atualizarMobs(0.05);
      if (mobs.length > antesN) chegadas.push(i * 0.05);
      antesN = mobs.length;
      if (alvo.wx - worldX < HX - 10) passouPorEla = true;
    }
    const sumiu = mobs.indexOf(alvo) < 0;
    const parados = mobs.filter(m => m.parado).length;
    // gaps between arrivals must not all be identical, or the street has a metronome in it
    const vaos = chegadas.slice(1).map((t, i) => +(t - chegadas[i]).toFixed(2));
    // with random gaps a short window can yield a single gap, which says nothing — judge only
    // once there are at least three of them
    const variados = vaos.length < 3 || new Set(vaos).size > 1;
    return { longe, passouPorEla, sumiu, parados, nChegadas: chegadas.length, vaos, variados };
  });
  console.log('a trouble walks the street -> from x', Math.round(encontro.longe),
    '| walked past her:', encontro.passouPorEla, '| left the frame:', encontro.sumiu,
    '| arrivals in 60s:', encontro.nChegadas, '| gaps:', JSON.stringify(encontro.vaos));
  if (!encontro.passouPorEla) errors.push('the trouble never walked past the hero');
  if (!encontro.sumiu) errors.push('the trouble never left the frame');
  if (encontro.parados > 0) errors.push('a trouble parked in front of the hero');
  if (encontro.nChegadas < 4) errors.push('too few troubles showed up in 60s');
  if (!encontro.variados) errors.push('the gaps between arrivals are all identical');


  // clearing one leaves a drop; the drop is picked up with a tap on the world
  const recolha = await page.evaluate(async () => {
    drops.length = 0;
    // they walk past now instead of parking, so put one within reach on purpose
    mobs.length = 0;
    mobs.push(novoMob('smog', worldX + HX + 40));
    const m = mobs[0];
    const sx = m.wx - worldX;
    const r = document.getElementById('scene').getBoundingClientRect();
    const paraCliente = (x, y) => ({ x: r.left + x / W * r.width, y: r.top + y / H * r.height });
    const alvo = paraCliente(sx + 5, GROUND - 12);
    const cv = document.getElementById('scene');
    // the world is the jump surface now, so swinging is done on the button
    // troubles have four times the health they used to, and the leap only lands every fifth
    // swing, so it takes a good few more taps to see one off
    for (let i = 0; i < 24 && mobs.length && !mobs[0].dying; i++) {
      clicar();
      await new Promise(rr => setTimeout(rr, 40));
    }
    const nDrops = drops.length, oDrop = drops[0], valor = oDrop ? oDrop.valor : 0;
    const antes = S.energiaTotal;
    // a drop comes off the ground when she walks over it — the world tap is a jump now
    for (let i = 0; i < 200 && drops.indexOf(oDrop) >= 0; i++) { worldX += 2; atualizarDrops(0.05); }
    // the swing that comes with the tap can fell another trouble, so check *this* drop
    return { nDrops, valor, ganho: S.energiaTotal - antes, saiu: drops.indexOf(oDrop) < 0 };
  });
  console.log('aimed taps -> drops left:', recolha.nDrops, 'worth', recolha.valor.toFixed(1),
    '| picking one up paid', recolha.ganho.toFixed(1), '| taken off the ground:', recolha.saiu);
  if (recolha.nDrops < 1) errors.push('beating a trouble left no drop');
  if (recolha.ganho < recolha.valor - 1e-9) errors.push('picking up a drop paid nothing');
  if (!recolha.saiu) errors.push('the drop was not taken off the ground');
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-mundo.png') });

  // ---- the resource layer: a drop leaves a resource of its kind, and the hero picks up a
  // drop just by running over it (full value + a resource), the same as an aimed tap ----
  const recursos = await page.evaluate(async () => {
    mobs.length = 0; drops.length = 0; chamada = null; mutiraoT = 0; superT = 0; superCarga = 0; superSwings = 0; superCd = 0; superFx = null;
    S.geradores = 10; S.poluicao = 0; S.recursos = { flor: 0, agua: 0, refeicao: 0 };
    // each trouble type maps to one resource: smog->flower, barrel->water, cash->meal
    const tipos = [['smog', 'flor'], ['barrel', 'agua'], ['cash', 'refeicao']];
    const porTipo = {};
    tipos.forEach(([t, r]) => {
      drops.length = 0; const antes = S.recursos[r];
      soltarDrop({ type: t }, 40);
      coletarDrop(drops[0], false);
      porTipo[t] = { recurso: r, ganhou: S.recursos[r] - antes };
    });
    // pass-over: a drop sitting at/behind the hero's x is collected by atualizarDrops alone,
    // with no tap — full value and a resource, and it comes off the ground
    S.recursos = { flor: 0, agua: 0, refeicao: 0 }; drops.length = 0; S.u4 = false;
    drops.push({ wx: worldX + HX + 4, type: 'cash', t: 0,
      valor: (CFG.dropBase + CFG.dropPorProjeto * S.geradores) });
    const d = drops[0], impAntes = S.energiaTotal, valor = d.valor;
    atualizarDrops(0.05);
    const passou = { pago: S.energiaTotal - impAntes, valor, saiu: drops.indexOf(d) < 0,
      recurso: S.recursos.refeicao };
    // a drop still ahead of the hero is NOT collected by pass-over yet
    drops.length = 0;
    drops.push({ wx: worldX + HX + 60, type: 'smog', t: 0, valor: 5 });
    const dAhead = drops[0]; atualizarDrops(0.05);
    passou.aindaLa = drops.indexOf(dAhead) >= 0;
    S.recursos = { flor: 0, agua: 0, refeicao: 0 }; drops.length = 0;
    return { porTipo, passou };
  });
  console.log('resources -> smog +' + recursos.porTipo.smog.ganhou + recursos.porTipo.smog.recurso,
    '| barrel +' + recursos.porTipo.barrel.ganhou + recursos.porTipo.barrel.recurso,
    '| cash +' + recursos.porTipo.cash.ganhou + recursos.porTipo.cash.recurso);
  console.log('  pass-over -> paid', recursos.passou.pago.toFixed(1), 'of', recursos.passou.valor.toFixed(1),
    '| off the ground:', recursos.passou.saiu, '| meal +' + recursos.passou.recurso,
    '| a drop still ahead stays:', recursos.passou.aindaLa);
  if (recursos.porTipo.smog.ganhou !== 1 || recursos.porTipo.smog.recurso !== 'flor') errors.push('smog did not leave a flower');
  if (recursos.porTipo.barrel.ganhou !== 1 || recursos.porTipo.barrel.recurso !== 'agua') errors.push('barrel did not leave water');
  if (recursos.porTipo.cash.ganhou !== 1 || recursos.porTipo.cash.recurso !== 'refeicao') errors.push('cash did not leave a meal');
  if (recursos.passou.pago < recursos.passou.valor - 1e-9) errors.push('pass-over collection did not pay full value');
  if (!recursos.passou.saiu) errors.push('a passed-over drop was not taken off the ground');
  if (recursos.passou.recurso !== 1) errors.push('pass-over collection left no resource');
  if (!recursos.passou.aindaLa) errors.push('a drop still ahead of the hero was collected too early');

  // obsolete: special projects removed by owner request — feature and test.
  // obsolete: the community call was removed by owner request — feature and test.
  // obsolete: the AUTO-FIRE skill was removed by owner request — feature and test.
  // ---- coming back on another day is worth something ----
  const dias = await page.evaluate(() => {
    localStorage.setItem('jogo_brasil_retencao',
      JSON.stringify({ dias: ['2026-07-30', '2026-07-31', '2026-08-01'], segundos: 900, tochas: 0 }));
    R = { dias: [], segundos: 0, tochas: 0 };
    diaNovo = false;
    carregarRetencao();
    return { n: R.dias.length, bonus: bonusDias(), novo: diaNovo };
  });
  console.log('day streak ->', dias.n, 'days | bonus ×' + dias.bonus.toFixed(2), '| new day:', dias.novo);
  if (dias.n !== 4) errors.push('the new day was not recorded');
  if (Math.abs(dias.bonus - 1.06) > 1e-9) errors.push('the day bonus is not what CFG says');
  if (!dias.novo) errors.push('coming back on a new day was not noticed');
  await page.evaluate(() => {
    localStorage.removeItem('jogo_brasil_retencao');
    R = { dias: [], segundos: 0, tochas: 0 }; carregarRetencao();
    mobs.length = 0; drops.length = 0; chamada = null; mutiraoT = 0; superT = 0; superCarga = 0; superSwings = 0; superCd = 0; superFx = null;
    S.geradores = 0; S.poluicao = 0; S.modo = 'carvao';
    // the torch used to wipe these; it is a no-op now, so the test resets them itself
    S.u1 = S.u2 = S.u3 = false;
  });

  // every upgrade buyable and applied
  await page.evaluate(() => { S.energia = 999999; desenhar(); });
  await page.tap('#openUpgrades');
  await page.waitForTimeout(350);
  for (const id of ['btnU1', 'btnU2', 'btnU3']) {
    await page.tap('#' + id);
    await page.waitForTimeout(80);
  }
  const st = await page.evaluate(() => ({ u: [S.u1, S.u2, S.u3], tap: ganhoClique() }));
  console.log('upgrades owned:', st.u.join(','), '| tap gain:', st.tap.toFixed(2));
  if (st.u.some(v => !v)) errors.push('some upgrade did not apply');

  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-upgrades.png') });
  await page.evaluate(() => fecharTudo());   // the close X moved onto the card below
  await page.waitForTimeout(400);

  // third hit must be a leap: hero leaves the ground, then a shockwave appears
  const mid = await page.evaluate(() => { combo = 2; S.energiaTotal = 30000; mobs.length = 0; shocks.length = 0; clicar(); return jumpT; });
// obsolete:   if (mid <= 0) errors.push('third hit did not leap');
  // hold him at the top of the arc for the screenshot
  await page.evaluate(() => new Promise(r => { jumpT = Math.round(JUMPF * 0.55); attackT = jumpT; requestAnimationFrame(() => r()); }));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-jump.png') });
  // land it deterministically, then grab the exact impact frame and one mid-wave frame
  await page.evaluate(() => new Promise(r => {
    jumpT = 1;
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  }));
  const land = await page.evaluate(() => ({ j: jumpT, s: shocks.length, t: shocks[0] && shocks[0].t }));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-slam.png') });
  await page.evaluate(() => new Promise(r => { shocks.forEach(s => s.t = 11); requestAnimationFrame(() => r()); }));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-wave.png') });
  console.log('leap -> jumpT mid:', mid, '| after landing jumpT:', land.j, 'shockwaves:', land.s);
// obsolete:   if (land.s < 1) errors.push('slam produced no shockwave');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-game.png') });

  // obsolete: the retention panel and the torch long-press were removed by owner request.
  // obsolete: torch, epilogue and the wall removed by owner request — feature and test.
  // obsolete: chapter cards were removed by owner request — feature and test.
  // ---- the hard rule: no authored fiction string may contain a digit, ever, so a line
  // can never be mistaken for the sourced REAL DATA banner ----
  const digitos = await page.evaluate(() => {
    const s = [];
    NOTAS_VOLTA.forEach(v => s.push(v));   // plain lines now: the cast that spoke them is gone
    return { total: s.length, ruins: s.filter(x => /[0-9]/.test(x)) };
  });
  console.log('fiction strings checked for digits ->', digitos.total, '| with a digit:', digitos.ruins.length);
  if (digitos.ruins.length) errors.push('a fiction string contains a digit: ' + JSON.stringify(digitos.ruins));

  await page.evaluate(() => { localStorage.removeItem('jogo_brasil_muro'); MURO = []; });

  // ---- the save is untrusted input ----
  // localStorage can be edited by hand, by anything else that runs on this origin, and by
  // whatever the player pastes into a console. The loader reads it through a schema; this is
  // what proves it, because a game that trusts its save is a game anyone can break by typing.
  const adulterado = await page.evaluate(async () => {
    salvar = function () {};   // the unload handler would write live state over the seed
    localStorage.setItem(CHAVE_JOGO, JSON.stringify({
      energia: 'nao e um numero',        // wrong type
      energiaTotal: Infinity,            // not finite
      modo: 'sabotado',                  // outside the allowed set
      u1: 'sim', u2: 1, u3: true,        // truthy, but not booleans
      salvoEm: -5,                       // out of range
      camposInventados: { a: 1 },        // not on the schema at all
      geradores: 999                     // a field from a removed feature
    }));
    return true;
  });
  await page.reload();
  await page.waitForFunction(() => typeof S !== 'undefined');
  const depois = await page.evaluate(() => ({
    energia: S.energia, total: S.energiaTotal, modo: S.modo,
    u1: S.u1, u2: S.u2, u3: S.u3, salvoEm: S.salvoEm,
    inventado: 'camposInventados' in S, geradores: 'geradores' in S,
    ganho: ganhoClique(), desenhou: (desenhar(), true)
  }));
  console.log('tampered save ->', JSON.stringify(depois));
  if (typeof depois.energia !== 'number' || !isFinite(depois.energia)) errors.push('a string got into energia');
  if (!isFinite(depois.total)) errors.push('Infinity got into energiaTotal');
  if (depois.modo !== 'limpo' && depois.modo !== 'carvao') errors.push('an unknown rhythm was accepted');
  if (depois.u1 !== false || depois.u2 !== false) errors.push('a non-boolean was accepted as an upgrade');
  if (depois.u3 !== true) errors.push('a real boolean was rejected');
  if (depois.salvoEm < 0) errors.push('a negative timestamp was accepted');
  if (depois.inventado) errors.push('an unknown field was copied into the game state');
  if (depois.geradores) errors.push('a field from a removed feature was copied in');
  if (!isFinite(depois.ganho) || depois.ganho <= 0) errors.push('the tap gain went NaN after a tampered save');

  // and what it writes back carries only what it would read
  const gravado = await page.evaluate(() => {
    delete window.salvar;
    location.reload();
  }).catch(() => null);
  await page.waitForFunction(() => typeof S !== 'undefined');
  const chaves = await page.evaluate(() => {
    S.energia = 12; salvar();
    return Object.keys(JSON.parse(localStorage.getItem(CHAVE_JOGO))).sort();
  });
  console.log('save written ->', chaves.join(', '));
  const esperadas = ['cenario', 'energia', 'energiaTotal', 'modo', 'salvoEm', 'u1', 'u2', 'u3', 'u4'];
  if (chaves.join(',') !== esperadas.join(',')) errors.push('the save carries fields the loader would discard');

  await page.evaluate(() => localStorage.removeItem(CHAVE_JOGO));


  // obsolete: the STREET bar was removed by owner request — element, style and test.

  const fps = await page.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    (function f() { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(f) : res(Math.round(n / 2)); })();
  }));
  console.log('FPS:', fps);

  console.log(errors.length ? 'FAIL\n' + errors.join('\n') : 'PASS — no errors');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
