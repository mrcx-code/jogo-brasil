// QA — O QUE A `regua-larga` PASSOU A MEDIR (23/08, auditoria do ramo a0db28de).
//
// A régua trocou `waitForTimeout(1400)` por "esperar `#telaMenu` ter a classe `aberta`".
// Só que a classe `aberta` é o COMEÇO da animação, não o fim: `estilo.css:587` roda
// `#telaMenu.aberta > * { animation: brota .42s }` com `animation-delay: .12s` no terceiro
// filho — a mobília só para de andar em ~540 ms, e o que ela faz é `translateY(18px)`.
//
// O cabeçalho do `encaixe.js` (21/08) diz isso por extenso e chama de "portão cara ou coroa".
// O `encaixe` foi corrigido com `telaParada()`, que espera as promessas `finished`. A
// `regua-larga` recebeu só a metade da cura.
//
// Esta sonda mede, nas MESMAS seis telas da régua, a caixa do `#btnConfig` (o último botão do
// poste, que é o que a régua julga) em dois instantes: logo depois da espera NOVA, e depois de
// as animações terminarem. A diferença é o que a régua passou a ler.
//
//   node test/qa-regua-brota.js
//
// Sai 0 sempre: é medida, não portão.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html'));
// as SEIS telas do primeiro bloco da regua-larga, que e o bloco que julga o poste
const TELAS = [
  ['tablet retrato', 768, 1024], ['tablet paisagem', 1024, 768], ['notebook', 1366, 768],
  ['landscape 899', 899, 500], ['phone deitado 926', 926, 428], ['ultrawide 1920', 1920, 1080],
];

// cópia FIEL do julgamento da regua-larga sobre o `#btnConfig`
const JULGAR = () => {
  const menu = document.querySelector('#telaMenu');
  const cfg = document.getElementById('btnConfig');
  let alcancavel = false, tocavel = false, motivo = 'nao existe', rolou = false;
  if (cfg) {
    const b0 = cfg.getBoundingClientRect();
    if (b0.width === 0 || b0.height === 0) motivo = 'caixa vazia';
    else {
      const J = window.innerHeight, L = window.innerWidth;
      const cabe = (r) => r.top >= -2 && r.bottom <= J + 2 && r.left >= -2 && r.right <= L + 2;
      const cabiaDireto = cabe(b0);
      let b = b0;
      if (!cabe(b)) {
        rolou = true;
        for (let p = cfg.parentElement; p; p = p.parentElement) {
          const cs = getComputedStyle(p);
          const rolavel = (cs.overflowY === 'auto' || cs.overflowY === 'scroll')
            && p.scrollHeight - p.clientHeight > 1;
          if (rolavel) p.scrollTop = p.scrollHeight;
          if (p === menu) break;
        }
        b = cfg.getBoundingClientRect();
      }
      alcancavel = cabe(b);
      if (!alcancavel) motivo = 'fora da janela (top ' + Math.round(b.top) + ', bottom ' + Math.round(b.bottom) + ', janela ' + J + ')';
      else {
        const cx = Math.round((b.left + b.right) / 2), cy = Math.round((Math.max(b.top, 0) + Math.min(b.bottom, J)) / 2);
        const alvo = document.elementFromPoint(cx, cy);
        tocavel = !!(alvo && (alvo === cfg || cfg.contains(alvo)));
        if (!tocavel) motivo = 'coberto por ' + (alvo ? (alvo.tagName + (alvo.id ? '#' + alvo.id : '')) : '(nada)');
      }
      return { alcancavel, tocavel, motivo, cabiaDireto, rolou, top: +b0.top.toFixed(1), bottom: +b0.bottom.toFixed(1), J };
    }
  }
  return { alcancavel, tocavel, motivo, cabiaDireto: false, rolou, top: null, bottom: null, J: window.innerHeight };
};

(async () => {
  const nav = await chromium.launch();
  console.log('tela                  espera(ms)  btnConfig.top    depois de brota   delta   animacoes vivas');
  let pior = 0;
  for (const [nome, w, h] of TELAS) {
    const pg = await nav.newPage();
    await pg.setViewportSize({ width: w, height: h });
    await pg.goto(ALVO);
    const t0 = Date.now();
    // a espera EXATA que o ramo pos na regua-larga
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!document.getElementById('telaMenu')
      && document.getElementById('telaMenu').classList.contains('aberta'),
      null, { timeout: 30000 }).catch(() => {});
    const espera = Date.now() - t0;
    const antes = await pg.evaluate((src) => {
      const julgar = eval('(' + src + ')');
      const m = document.getElementById('telaMenu');
      const vivas = (m.getAnimations ? m.getAnimations({ subtree: true }) : [])
        .filter(a => a.playState === 'running').length;
      return Object.assign({ vivas }, julgar());
    }, JULGAR.toString());
    // ...e agora a espera que o `encaixe.js` usa: as promessas `finished` da subarvore
    const depois = await pg.evaluate(async (src) => {
      const julgar = eval('(' + src + ')');
      const m = document.getElementById('telaMenu');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const vivas = m.getAnimations({ subtree: true })
        .filter(a => a.animationName !== 'respira' && a.playState !== 'idle')
        .filter(a => !(a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity))
        .map(a => a.finished.catch(() => {}));
      await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 20000))]);
      await new Promise(r => requestAnimationFrame(r));
      return julgar();
    }, JULGAR.toString());
    const d = (antes.top === null || depois.top === null) ? null : +(depois.top - antes.top).toFixed(1);
    if (d !== null && Math.abs(d) > Math.abs(pior)) pior = d;
    console.log(nome.padEnd(20) + String(espera).padStart(7) + 'ms  '
      + 'top ' + String(antes.top).padStart(7) + ' -> ' + String(depois.top).padStart(7)
      + '  delta ' + String(d).padStart(6) + '  | vivas ' + antes.vivas
      + '  | cabia direto ' + antes.cabiaDireto + ' -> ' + depois.cabiaDireto
      + '  | rolou ' + antes.rolou + ' -> ' + depois.rolou
      + '  | alcancavel ' + antes.alcancavel + ' -> ' + depois.alcancavel
      + '  | tocavel ' + antes.tocavel + ' -> ' + depois.tocavel);
    await pg.close();
  }
  console.log('\nmaior deslocamento entre a espera NOVA da regua-larga e o fim da animacao: ' + pior + ' px');
  await nav.close();
  process.exit(0);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(2); });
