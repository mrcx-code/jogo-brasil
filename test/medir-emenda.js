// MEDIR-EMENDA — as juntas do percurso, cronometradas.
//
// O percurso mostrou que a sequência ANDA. Isto mede se ela ASSENTA:
//   §1 a cerimônia do capítulo novo sobrevive ao dedo que vinha avançando o fecho anterior?
//   §2 quantos toques separam abrir o jogo de estar jogando — no dia 1 e no dia 2?
//   §3 o encaixe do quadrinho, medido DEPOIS de o navegador assentar (o teste antigo lia
//      no mesmo tique e podia mentir), e quantas páginas têm texto de verdade quando
//      `content-visibility` já as montou;
//   §4 quanto tempo REAL cada trecho de leitura leva, no ritmo de quem toca depressa.
//
// node test/medir-emenda.js — contra o index.html da RAIZ, sem build.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ALVO = 'file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html');
const log = (...a) => console.log(...a);

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  let page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  await page.goto(ALVO);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(900);

  const toque = async (x, y) => { await page.touchscreen.tap(x, y); };

  // ================= §1 · a cerimônia sobrevive ao dedo? =================
  log('\n===== §1 · A CERIMÔNIA DO CAPÍTULO NOVO CONTRA O DEDO QUE VINHA AVANÇANDO =====');
  log('   (o fecho de um capítulo é avançado a toque; o toque seguinte cai na cerimônia do próximo)');
  for (const ritmo of [280, 450, 700, 1200]) {
    await page.evaluate(() => {
      localStorage.clear();
      S.energiaTotal = LIMIARES[1] - 5; S.energia = S.energiaTotal;
      S.cenario = 1; S.fronteira = 1; S.aberturas = 1; S.fechos = 0; S.travessias = 1;
      fecharTelas();
    });
    // deixa o jogo virar sozinho e cronometra a CERIMÔNIA de PALMARES enquanto o dedo bate
    // no ritmo dado, sem nunca parar — que é o que faz quem estava lendo o fecho.
    const r = await page.evaluate(async (ms) => {
      const espera = t => new Promise(rr => setTimeout(rr, t));
      const bater = () => document.getElementById('telaFala')
        .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 195, clientY: 500 }));
      let cerimoniaVisivel = 0, viuCerimonia = false, t0 = 0, toques = 0, guardaTrav = 0;
      const t00 = Date.now();
      while (Date.now() - t00 < 40000) {
        const cer = document.getElementById('telaFala').classList.contains('cerimoniando');
        if (cer && !viuCerimonia) { viuCerimonia = true; t0 = Date.now(); }
        if (viuCerimonia && cerimoniaVisivel === 0 && !cer) cerimoniaVisivel = Date.now() - t0;
        if (travessiaAtiva()) guardaTrav++;
        if (falaAberta()) { bater(); toques++; }
        if (epocaAtual() === 1 && !falaAberta() && viuCerimonia && cerimoniaVisivel) break;
        await espera(ms);
      }
      return { cerimoniaVisivel, viuCerimonia, toques, epoca: EPOCAS[epocaAtual()].nome, quadrosTrav: guardaTrav };
    }, ritmo);
    log('   dedo a cada ' + String(ritmo).padStart(4) + ' ms -> a cerimônia de PALMARES ficou na tela ' +
      String(r.cerimoniaVisivel).padStart(5) + ' ms (do orçamento de 3400) | ' + r.toques + ' toques até sair | terminou em ' + r.epoca);
  }
  log('   NOTA: 3400 ms é o `cerTimer` declarado em abrirFala(). Tudo abaixo disso é cerimônia cortada pelo dedo.');

  // ================= §2 · toques até estar jogando =================
  log('\n===== §2 · DO BOOT ATÉ ESTAR JOGANDO — quantos toques =====');
  async function caminho(rotulo, semear) {
    // contexto NOVO a cada caminho: `beforeunload` grava o save de volta, então limpar o
    // localStorage e navegar na mesma aba devolve o estado anterior pela porta dos fundos.
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    const antiga = page;
    page = pg;
    await pg.goto(ALVO); await pg.waitForTimeout(900);
    if (semear) { await pg.evaluate(semear); await pg.evaluate(() => { window.salvar = function () {}; window.salvarRetencao = function () {}; }); await pg.reload(); await pg.waitForTimeout(1000); }
    let toques = 0; const t0 = Date.now(); const trilha = [];
    for (let i = 0; i < 60; i++) {
      const st = await page.evaluate(() => ({
        ret: document.getElementById('retorno').getAttribute('aria-hidden') === 'false',
        telas: ["telaMenu", "telaCapitulos", "telaFala"].filter(t => document.getElementById(t).classList.contains('aberta')),
        cer: document.getElementById('telaFala').classList.contains('cerimoniando'),
        fala: falaAberta()
      }));
      const onde = st.ret ? 'painel de retorno' : (st.cer ? 'cerimônia' : (st.telas[0] || 'RUA'));
      if (onde === 'RUA') { trilha.push('RUA'); break; }
      trilha.push(onde);
      if (st.ret) { await toque(195, 300); }
      else if (st.telas[0] === 'telaMenu') { const b = await page.locator('#btnJogar').boundingBox(); await toque(b.x + b.width / 2, b.y + b.height / 2); }
      else if (st.telas[0] === 'telaCapitulos') { const its = await page.locator('#listaCapitulos .capItem').all();
        const idx = await page.evaluate(() => epocaDoCenario(S.fronteira | 0)); await its[idx].tap(); }
      else { await toque(195, 500); }
      toques++;
      await page.waitForTimeout(220);
    }
    const passos = []; let ult = null, n = 0;
    trilha.forEach(t => { if (t === ult) n++; else { if (ult) passos.push(ult + (n > 1 ? '×' + n : '')); ult = t; n = 1; } });
    if (ult) passos.push(ult + (n > 1 ? '×' + n : ''));
    log('   ' + rotulo.padEnd(34) + ' -> ' + String(toques).padStart(2) + ' toques, ' +
      ((Date.now() - t0) / 1000).toFixed(1) + ' s | caminho: ' + passos.join(' → '));
    await ctx.close(); page = antiga;
  }
  await caminho('dia 1, save vazio (lendo tudo)', null);
  await caminho('dia 2, meio do cap. 3, 9 h fora', () => {
    S.energiaTotal = 6200; S.energia = 6200; S.cenario = 4; S.fronteira = 4;
    S.aberturas = 7; S.fechos = 3; S.travessias = 1; S.acolhidos = [0, 17, 0, 0];
    salvar();
    const k = 'jogo_brasil_v1';
    const j = JSON.parse(localStorage.getItem(k)); j.salvoEm = Date.now() - 9 * 3600 * 1000;
    localStorage.setItem(k, JSON.stringify(j));
  });

  // ================= §3 · o quadrinho, medido com o navegador assentado =================
  log('\n===== §3 · O QUADRINHO — encaixe e páginas com texto, medidos DEPOIS de assentar =====');
  await page.evaluate(() => { fecharTelas(); montarCompletude(); abrirTela('telaCompletude'); });
  await page.waitForTimeout(500);
  const snap = [];
  for (const frac of [0.25, 0.5, 0.75, 0.9]) {
    const r = await page.evaluate(async (f) => {
      const l = document.getElementById('listaCenas');
      const h = l.clientHeight;
      l.scrollTop = 0; await new Promise(rr => setTimeout(rr, 260));
      l.scrollTo({ top: Math.round(h * f), behavior: 'smooth' });
      await new Promise(rr => setTimeout(rr, 900));
      return { pedido: Math.round(h * f), ficou: Math.round(l.scrollTop), resto: Math.round(l.scrollTop) % h };
    }, frac);
    snap.push({ frac, ...r });
  }
  snap.forEach(s => log('   rolar ' + (s.frac * 100) + '% de página -> parou em ' + s.ficou + ' (resto ' + s.resto + ' — 0 = encaixou)'));

  const paginas = await page.evaluate(async () => {
    const l = document.getElementById('listaCenas');
    const n = l.children.length, h = l.clientHeight;
    const out = [];
    for (let k = 0; k < n; k++) {
      l.scrollTop = k * h;
      await new Promise(rr => setTimeout(rr, 90));
      const p = l.children[k];
      const txt = p.innerText.trim();
      const rot = [...p.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).join(' ');
      out.push({ k: k + 1, cls: p.className.replace('qQuadro ', ''), chars: txt.length, rot: rot.slice(0, 40),
        fundo: !!p.querySelector('.qFundo'), alt: Math.round(p.getBoundingClientRect().height) });
    }
    return out;
  });
  const semTexto = paginas.filter(p => p.chars === 0 && !p.rot);
  log('   páginas com ZERO caractere legível (nem texto nem rótulo de canvas): ' + semTexto.length +
    (semTexto.length ? ' -> ' + semTexto.map(p => 'p' + p.k + ' (' + p.cls + ')').join(', ') : ''));
  log('   páginas sem imagem de fundo: ' + paginas.filter(p => !p.fundo).map(p => 'p' + p.k).join(', '));
  log('   alturas distintas: ' + [...new Set(paginas.map(p => p.alt))].join(','));
  const curtas = paginas.filter(p => p.chars > 0 && p.chars < 90);
  log('   páginas com menos de 90 caracteres: ' + (curtas.length ? curtas.map(p => 'p' + p.k + '(' + p.chars + ')').join(', ') : 'nenhuma'));

  // ================= §4 · quanto tempo o conteúdo leva =================
  log('\n===== §4 · O ORÇAMENTO DE LEITURA — segundos de texto por trecho =====');
  const orc = await page.evaluate(() => {
    const conta = l => l.reduce((a, b) => a + b.length, 0);
    const r = [];
    EPOCAS.forEach(e => {
      r.push({ n: e.nome + ' abertura', linhas: e.abertura.length, chars: conta(e.abertura) });
      r.push({ n: e.nome + ' fecho', linhas: e.fecho.length, chars: conta(e.fecho) });
    });
    TRAVESSIAS.forEach(t => r.push({ n: t.nome, linhas: t.linhas.length, chars: conta(t.linhas) }));
    const pag = LINHA_TEMPO.filter(n => n.tipo !== 'vao');
    r.push({ n: 'A HISTÓRIA (26 páginas)', linhas: pag.length,
      chars: pag.reduce((a, b) => a + ((b.d || '') + (b.com || '') + (b.t || '')).length, 0) });
    return r;
  });
  let totalJog = 0;
  orc.forEach(o => {
    const digit = (o.chars * 18 / 1000);
    const leitura = o.chars / 5 / 200 * 60;   // 200 palavras/min, palavra = 5 caracteres
    if (!/HISTÓRIA/.test(o.n)) totalJog += o.chars;
    log('   ' + o.n.padEnd(24) + String(o.linhas).padStart(3) + ' linhas ' + String(o.chars).padStart(5) +
      ' car. | máquina escrevendo ' + digit.toFixed(1).padStart(5) + ' s | leitura calma ' + leitura.toFixed(0).padStart(3) + ' s');
  });
  log('   TOTAL do texto que o percurso jogado atravessa: ' + totalJog + ' caracteres = ' +
    (totalJog / 5 / 200).toFixed(1) + ' min de leitura calma, ' + (totalJog * 18 / 1000 / 60).toFixed(1) + ' min só de máquina de escrever');

  log('\n===== ERROS =====');
  log(erros.length ? erros.join('\n') : '(nenhum)');
  await browser.close();
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
