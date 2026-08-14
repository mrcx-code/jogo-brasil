// A ESCADA DO MENU — o menu fotografado e MEDIDO numa faixa densa de tamanhos.
//
//   node test/escada-menu.js            fotografa e mede
//   node test/escada-menu.js --so-medir nao grava PNG
//
// Por que existe: o `medir-telas.js` roda dez aparelhos reais, que e o certo para "cabe?".
// Ele nao responde "fica bonito ATRAVESSANDO os tamanhos" — e e nessa travessia que um
// @media mal posto aparece, porque o defeito nao mora num aparelho, mora no DEGRAU entre
// dois. Com dezenove @media no estilo, varios com condicoes que se sobrepoem, o modo de
// falhar mais provavel nao e "quebrou", e "muda de cara sem motivo entre 599 e 601 px".
//
// O que ele mede em cada largura, tudo em pixels de tela:
//   - a caixa do poste e a das tabuas (esquerda, largura, topo, base)
//   - a altura de cada tabua e o vao entre tabuas
//   - a folga entre a ultima tabua e o pe da tela
//   - a rolagem sobrando
//   - o logo
// E depois compara DEGRAU A DEGRAU: mudanca brusca num degrau de 1 px e um @media aparecendo.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const SO_MEDIR = process.argv.includes('--so-medir');
const DIR = __dirname;

// A escada: os tamanhos reais mais os DEGRAUS de cada @media (o valor e o valor+1), que e
// onde a mudanca acontece. Sem os degraus, um salto de cara passa despercebido.
const LARGURAS = [320, 340, 341, 360, 375, 390, 412, 430, 480, 540, 600, 768, 820, 900, 901, 1024];
const ALTURAS = [568, 600, 601, 640, 641, 720, 721, 812, 844, 915, 932];

async function medir(pg) {
  return pg.evaluate(() => {
    const cx = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const poste = document.getElementById('poste') || document.querySelector('#telaMenu .poste');
    const tela = document.getElementById('telaMenu');
    const botoes = [...document.querySelectorAll('#telaMenu button')].filter(b => b.offsetParent !== null);
    const caixas = botoes.map(b => ({ rot: (b.textContent || '').trim().slice(0, 14), ...cx(b) }));
    const vaos = [];
    for (let i = 1; i < caixas.length; i++) vaos.push(caixas[i].y - (caixas[i - 1].y + caixas[i - 1].h));
    const logo = document.querySelector('#telaMenu img, #telaMenu canvas');
    const ultima = caixas[caixas.length - 1];
    return {
      vp: { w: innerWidth, h: innerHeight },
      poste: cx(poste),
      logo: cx(logo),
      n: caixas.length,
      caixas,
      alturas: caixas.map(c => c.h),
      vaos,
      menorAlvo: caixas.length ? Math.min(...caixas.map(c => c.h)) : 0,
      peDaUltima: ultima ? innerHeight - (ultima.y + ultima.h) : null,
      rolagem: tela ? Math.max(0, tela.scrollHeight - tela.clientHeight) : 0,
      forade: caixas.filter(c => c.y < 0 || c.y + c.h > innerHeight || c.x < 0 || c.x + c.w > innerWidth).map(c => c.rot)
    };
  });
}

(async () => {
  const nav = await chromium.launch();
  const erros = [];
  const alvo = ABRIR('file:///' + path.resolve(DIR, '..', 'index.html').split(path.sep).join('/'));
  const linhas = [];

  // ---- passada 1: largura variando, altura fixa em 844 (retrato tipico)
  console.log('=== LARGURA VARIANDO (altura 844) ===');
  for (const w of LARGURAS) {
    const pg = await nav.newPage({ viewport: { width: w, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    pg.on('pageerror', e => erros.push(w + 'x844: ' + e.message));
    await pg.goto(alvo);
    await pg.waitForTimeout(900);
    await pg.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof abrirTela === 'function') abrirTela('telaMenu'); });
    await pg.waitForTimeout(350);
    const m = await medir(pg);
    linhas.push({ chave: w + 'x844', eixo: 'w', v: w, m });
    if (!SO_MEDIR) await pg.screenshot({ path: path.join(DIR, 'ESC-w' + w + '.png') });
    await pg.close();
  }

  // ---- passada 2: altura variando, largura fixa em 390
  console.log('\n=== ALTURA VARIANDO (largura 390) ===');
  for (const h of ALTURAS) {
    const pg = await nav.newPage({ viewport: { width: 390, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    pg.on('pageerror', e => erros.push('390x' + h + ': ' + e.message));
    await pg.goto(alvo);
    await pg.waitForTimeout(900);
    await pg.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof abrirTela === 'function') abrirTela('telaMenu'); });
    await pg.waitForTimeout(350);
    const m = await medir(pg);
    linhas.push({ chave: '390x' + h, eixo: 'h', v: h, m });
    if (!SO_MEDIR) await pg.screenshot({ path: path.join(DIR, 'ESC-h' + h + '.png') });
    await pg.close();
  }

  // ---- passada 3: DEITADO, do telefone ao tablet. Aqui a régua é a largura, e o modo de
  // falhar é outro: não é "não cabe", é sobrar tela. Um tablet deitado tem 768 px de altura
  // e o desenho do deitado foi feito para um telefone de 390 — se as tábuas continuarem no
  // mínimo de dedo com o respiro mínimo, o poste fica com um palmo de coluna vazia em volta.
  console.log('\n=== DEITADO ===');
  for (const [w, h] of [[568, 320], [640, 360], [812, 375], [844, 390], [932, 430], [1024, 768], [1280, 800]]) {
    const pg = await nav.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    pg.on('pageerror', e => erros.push(w + 'x' + h + ': ' + e.message));
    await pg.goto(alvo);
    await pg.waitForTimeout(900);
    await pg.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof abrirTela === 'function') abrirTela('telaMenu'); });
    await pg.waitForTimeout(350);
    const m = await medir(pg);
    linhas.push({ chave: w + 'x' + h, eixo: 'd', v: h, m });
    if (!SO_MEDIR) await pg.screenshot({ path: path.join(DIR, 'ESC-d' + w + 'x' + h + '.png') });
    await pg.close();
  }

  const mostra = (l) => {
    const m = l.m;
    console.log('  ' + l.chave.padEnd(10) +
      ' tábuas ' + String(m.n).padStart(2) +
      ' | alvo menor ' + String(m.menorAlvo).padStart(3) + 'px' +
      ' | vão ' + (m.vaos.length ? Math.min(...m.vaos) + '–' + Math.max(...m.vaos) : '—').padEnd(8) +
      ' | pé ' + String(m.peDaUltima).padStart(4) +
      ' | rolagem ' + String(m.rolagem).padStart(4) +
      ' | poste ' + (m.poste ? m.poste.w + 'x' + m.poste.h : '—') +
      (m.forade.length ? '  ⚠ FORA: ' + m.forade.join(',') : ''));
  };
  linhas.filter(l => l.eixo === 'w').forEach(mostra);
  console.log('');
  linhas.filter(l => l.eixo === 'h').forEach(mostra);
  console.log('');
  linhas.filter(l => l.eixo === 'd').forEach(l => {
    mostra(l);
    // a sobra: quanto da coluna do poste fica vazia acima e abaixo das tábuas
    const m = l.m;
    if (m.poste && m.caixas.length) {
      const alto = m.caixas[0].y - m.poste.y;
      const baixo = (m.poste.y + m.poste.h) - (m.caixas[m.caixas.length - 1].y + m.caixas[m.caixas.length - 1].h);
      console.log('              sobra da coluna: ' + alto + 'px acima + ' + baixo + 'px abaixo das tábuas');
    }
  });

  // ---- o degrau: mudanca brusca entre dois tamanhos vizinhos
  console.log('\n=== DEGRAUS (mudança entre vizinhos) ===');
  let bruscos = 0;
  for (const eixo of ['w', 'h']) {
    const seq = linhas.filter(l => l.eixo === eixo);
    for (let i = 1; i < seq.length; i++) {
      const a = seq[i - 1].m, b = seq[i].m;
      const passo = seq[i].v - seq[i - 1].v;
      const dAlvo = Math.abs(b.menorAlvo - a.menorAlvo);
      const dPe = (a.peDaUltima != null && b.peDaUltima != null) ? Math.abs(b.peDaUltima - a.peDaUltima) : 0;
      const dN = Math.abs(b.n - a.n);
      // um degrau de 1 px que muda mais de 8 px de altura de alvo, ou 40 px de pé, é @media
      const brusco = (passo <= 1 && (dAlvo > 8 || dPe > 40 || dN > 0)) || dN > 0;
      if (brusco) {
        bruscos++;
        console.log('  ⚠ ' + seq[i - 1].chave + ' → ' + seq[i].chave + ' (passo ' + passo + 'px): ' +
          'alvo ' + a.menorAlvo + '→' + b.menorAlvo + ', pé ' + a.peDaUltima + '→' + b.peDaUltima + ', tábuas ' + a.n + '→' + b.n);
      }
    }
  }
  if (!bruscos) console.log('  (nenhum salto brusco entre vizinhos)');

  console.log('\n=== O QUE REPROVA ===');
  let ruim = 0;
  for (const l of linhas) {
    const m = l.m;
    const p = [];
    if (m.forade.length) p.push('tábua fora da tela: ' + m.forade.join(','));
    if (m.menorAlvo && m.menorAlvo < 44) p.push('alvo de toque ' + m.menorAlvo + 'px < 44');
    if (m.rolagem > 0) p.push('rolagem ' + m.rolagem + 'px');
    if (m.peDaUltima != null && m.peDaUltima < 0) p.push('última tábua ' + (-m.peDaUltima) + 'px abaixo da borda');
    if (p.length) { ruim++; console.log('  ✗ ' + l.chave.padEnd(10) + p.join(' · ')); }
  }
  if (!ruim) console.log('  ✓ nenhum tamanho reprova');

  console.log('\nerros de console: ' + (erros.length ? erros.join(' | ') : '(nenhum)'));
  await nav.close();
  process.exit(erros.length || ruim ? 1 : 0);
})();
