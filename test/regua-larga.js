// A RÉGUA DE RESPONSIVIDADE EM TELA LARGA — o "menu de celular esticado" não volta (20/08).
//
// O DEFEITO QUE ISTO EXISTE PARA NÃO TER DE NOVO. Até 20/08 a home em tela larga era o layout
// de celular esticado: a proposta (`#telaMenu .mpFrase`) em 11px FIXOS — ilegível num notebook —
// e o painel de largura fixa com ~80% de vazio. O dono apontou de olho ("muito pequenininho,
// não está legível"; "só o logo adaptando não parece responsivo"). O conserto (home cinemática)
// fez a tipografia escalar com `clamp()` e o painel virar faixa contida à direita.
//
// O SMOKE JÁ MEDE O CELULAR (390×844). Esta régua mede o que faltava: TABLET e NOTEBOOK. A
// régua é de LEGIBILIDADE e de CONTENÇÃO — em tela larga o texto da proposta tem de ler
// confortável, e o painel não pode ocupar a tela toda (seria o menu de celular esticado). Se
// alguém voltar a fixar 11px, tirar o clamp, ou fazer o painel encher a largura, aqui reprova
// por exit code — é o portão, não um aviso.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));

// largura -> piso de fonte legível naquela largura (da tabela de faixas da direção de arte)
const TELAS = [
  { nome: 'tablet retrato',  w: 768,  h: 1024, pisoFrase: 12, pisoCta: 7 },
  { nome: 'tablet paisagem', w: 1024, h: 768,  pisoFrase: 15, pisoCta: 9 },
  { nome: 'notebook',        w: 1366, h: 768,  pisoFrase: 16, pisoCta: 10 },
];

(async () => {
  const nav = await chromium.launch();
  let falhou = false;
  for (const t of TELAS) {
    const pg = await nav.newPage();
    await pg.setViewportSize({ width: t.w, height: t.h });
    await pg.goto(ALVO);
    await pg.waitForTimeout(1400);
    const m = await pg.evaluate(() => {
      const px = (sel) => { const el = document.querySelector(sel); return el ? parseFloat(getComputedStyle(el).fontSize) : null; };
      const larg = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().width : null; };
      const menu = document.querySelector('#telaMenu');
      const visivel = !!menu && getComputedStyle(menu).display !== 'none' && menu.getBoundingClientRect().width > 0;
      return {
        menuVisivel: visivel,
        frase: px('#telaMenu .mpFrase'),
        cta: px('#telaMenu .mpCta'),
        painel: larg('#poste'),
        logo: larg('#logoImg'),
        tela: window.innerWidth,
      };
    });
    await pg.close();

    const probs = [];
    if (!m.menuVisivel) probs.push('menu não visível');
    if (m.frase == null || m.frase < t.pisoFrase) probs.push('proposta ' + (m.frase == null ? 'ausente' : m.frase.toFixed(1) + 'px') + ' < piso ' + t.pisoFrase);
    if (m.cta == null || m.cta < t.pisoCta) probs.push('cta ' + (m.cta == null ? 'ausente' : m.cta.toFixed(1) + 'px') + ' < piso ' + t.pisoCta);
    // em tela larga (>=900) o painel não pode ocupar quase a tela toda — isso é o "menu esticado"
    if (t.w >= 900 && m.painel != null && m.painel > t.w * 0.6) probs.push('painel ' + m.painel.toFixed(0) + 'px ocupa >60% da largura (esticado)');

    const linha = t.nome.padEnd(16) + ' · ' + t.w + 'x' + t.h
      + ' · proposta ' + (m.frase != null ? m.frase.toFixed(1) : '—') + 'px'
      + ' · cta ' + (m.cta != null ? m.cta.toFixed(1) : '—') + 'px'
      + ' · painel ' + (m.painel != null ? m.painel.toFixed(0) : '—') + 'px'
      + ' · logo ' + (m.logo != null ? m.logo.toFixed(0) : '—') + 'px';
    if (probs.length) { console.log('  ✗ ' + linha + '  →  ' + probs.join('; ')); falhou = true; }
    else console.log('  ✓ ' + linha);
  }
  await nav.close();

  if (falhou) {
    console.error('\nRÉGUA DE RESPONSIVIDADE: REPROVOU — a home em tela larga voltou a ficar ilegível ou esticada.');
    process.exit(1);
  }
  console.log('\nRÉGUA DE RESPONSIVIDADE: PASSOU — proposta legível e painel contido em tablet e notebook.');
})();
