// GLOSSARIO — o instrumento da tela nova (Direcao de Arte).
// Faz duas coisas que o olho sozinho nao faz:
//   1. MEDE O POSTE com N botoes, em varias alturas de tela, e acusa estouro: o poste do menu
//      ancora embaixo (margin-top:auto) e, quando o conteudo passa da altura, o auto vira 0 e
//      a coluna transborda pelo PE — o ultimo botao sai da tela sem barra de rolagem nenhuma.
//      Por isso a medida que importa nao e' "coube?", e' a FOLGA entre o topo do poste e o pe
//      da tagline, e o pe do ultimo botao contra a altura da janela.
//   2. FOTOGRAFA a tela de glossario com verbetes de exemplo INJETADOS pelo instrumento
//      (nunca no molde: quem preenche #listaGlossario e' o JS do jogo).
//
//   node test/prints-glossario.js            -> prints GL-depois-*.png
//   ROTULO=antes node test/prints-glossario.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROT = process.env.ROTULO || 'depois';
const DIR = __dirname;
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
// Verbetes de exemplo. Sao SO' para a foto — o conteudo verdadeiro e a estrutura vem do Dev.
const AMOSTRA = [
  { g: 'POVOS ORIGINARIOS' },
  { t: 'Pindorama', o: 'do tupi pindó (palmeira) + rama (região)', d: 'Nome pelo qual povos de língua tupi chamavam a terra onde viviam, muito antes de qualquer chegada europeia. Não é um nome antigo de "Brasil": é outro nome, de quem já estava aqui.', f: 'Navarro, Dicionário de Tupi Antigo, 2013' },
  { t: 'Povos originários', o: 'do latim originarius, "que vem da origem"', d: 'Os povos que já viviam nesta terra antes da invasão europeia, e que continuam aqui — centenas de povos distintos, com línguas distintas. O IBGE registrou 305 povos e 274 línguas indígenas no Censo 2010.', f: 'IBGE, Censo Demográfico 2010 — Indígenas' },
  { t: 'Tupinambá', o: 'autodenominação em tupi antigo', d: 'Conjunto de povos de língua tupi do litoral, cujas aldeias os invasores encontraram no século XVI. Nomear o povo é a regra da casa: "índio" não é um povo.', f: 'Fausto, Os índios antes do Brasil, 2000' },
  { g: 'RESISTENCIA' },
  { t: 'Palmares', o: 'do português, pelos palmares da serra da Barriga', d: 'Conjunto de mocambos na serra da Barriga, hoje Alagoas, onde viveram por quase um século pessoas que fugiram da escravidão. Não foi um vilarejo: foi um território, com vários núcleos.', f: 'Silvia H. Lara, "O território dos Palmares", Afro-Ásia nº 64, 2021' },
  { t: 'Quilombo', o: 'do quimbundo kilombo, "acampamento, sociedade de guerra"', d: 'Comunidade formada por pessoas que escaparam da escravidão. A palavra atravessou o Atlântico com quem a trouxe, e hoje nomeia também as comunidades quilombolas reconhecidas pela Constituição de 1988.', f: 'Beatriz Nascimento, O conceito de quilombo e a resistência cultural negra, 1985' },
  { dv: 1, t: 'Angola Janga', o: 'atribuído ao quimbundo, "Angola pequena"', d: 'Circula como o nome que os próprios palmaristas usariam para Palmares, mas não localizamos atestação em documento colonial, e o estudo mais completo da toponímia não menciona o termo. Por isso o jogo não o usa.', f: 'onde as fontes discordam — ver DE ONDE VEM' }
];
const INJETA = function (itens) {
  const box = document.getElementById('listaGlossario');
  if (!box) { window.__semLista = 1; return; }
  box.textContent = '';
  itens.forEach(function (v) {
    if (v.g) {
      const h = document.createElement('div'); h.className = 'glGrupo';
      if (typeof pixelRotulo === 'function') pixelRotulo(h, v.g, 1, '#d9a441'); else h.textContent = v.g;
      box.appendChild(h); return;
    }
    const d = document.createElement('div'); d.className = 'glItem' + (v.dv ? ' dv' : '');
    const t = document.createElement('div'); t.className = 'glT'; t.textContent = v.t; d.appendChild(t);
    const o = document.createElement('div'); o.className = 'glO'; o.textContent = v.o; d.appendChild(o);
    const p = document.createElement('div'); p.className = 'glD'; p.textContent = v.d; d.appendChild(p);
    const f = document.createElement('div'); f.className = 'glF'; f.textContent = v.f; d.appendChild(f);
    box.appendChild(d);
  });
};
const medePoste = function () {
  const poste = document.getElementById('poste');
  if (!poste) return null;
  const r = poste.getBoundingClientRect();
  const sub = document.getElementById('menuSub');
  const rs = sub ? sub.getBoundingClientRect() : null;
  const logo = document.getElementById('logoImg');
  const rl = logo ? logo.getBoundingClientRect() : null;
  const btns = Array.from(poste.querySelectorAll('.telaBtn')).map(function (b) {
    const q = b.getBoundingClientRect();
    const cv = b.querySelector('canvas');
    return { id: b.id, topo: Math.round(q.top), pe: Math.round(q.bottom), alt: Math.round(q.height),
      larg: Math.round(q.width), rot: cv ? (cv.width + 'x' + cv.height + ' @' + (cv.getBoundingClientRect().width / cv.width).toFixed(2) + 'x') : 'SEM BITMAP' };
  });
  return {
    janela: window.innerHeight,
    logoPe: rl ? Math.round(rl.bottom) : -1,
    taglinePe: rs ? Math.round(rs.bottom) : -1,
    posteTopo: Math.round(r.top), postePe: Math.round(r.bottom), posteAlt: Math.round(r.height),
    btns: btns
  };
};
(async () => {
  const file = 'file://' + path.resolve(process.env.JOGO_HTML || path.join(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });

  // ---- 1. O POSTE em varias alturas de tela ----
  console.log('\n=== O POSTE (' + ROT + ') — a coluna ancorada e o que sobra de folga');
  for (const vp of [{ width: 375, height: 812 }, { width: 390, height: 844 },
                    { width: 360, height: 640 }, { width: 320, height: 568 },
                    { width: 812, height: 375 }, { width: 667, height: 375 }]) {
    const page = await browser.newPage({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    page.on('pageerror', e => console.log('PAGEERROR', e.message));
    await page.goto(file);
    await page.waitForTimeout(1200);
    await page.evaluate(() => { fecharTelas(); abrirTela('telaMenu'); });
    await page.waitForTimeout(500);
    const m = await page.evaluate(medePoste);
    const folgaTopo = m.posteTopo - m.taglinePe;         // respiro entre a tagline e a 1a tabua
    const sobra = m.janela - m.postePe;                  // o pe do poste contra a borda de baixo
    console.log('  ' + (vp.width + 'x' + vp.height).padEnd(9) +
      ' poste ' + String(m.posteTopo).padStart(4) + '..' + String(m.postePe).padStart(4) +
      ' (alt ' + String(m.posteAlt).padStart(3) + ')' +
      '  tagline termina ' + String(m.taglinePe).padStart(3) +
      '  FOLGA topo ' + String(folgaTopo).padStart(4) +
      '  sobra pe ' + String(sobra).padStart(4) +
      (folgaTopo < 0 ? '   <<< O POSTE COBRE A TAGLINE' : '') +
      (m.postePe > m.janela ? '   <<< ESTOUROU A TELA' : '') +
      (m.logoPe < 0 ? '   <<< LOGO FORA DA TELA' : ''));
    m.btns.forEach(function (b) {
      console.log('      ' + String(b.id).padEnd(15) + ' ' + String(b.topo).padStart(4) + '..' + String(b.pe).padStart(4) +
        '  alt ' + String(b.alt).padStart(3) + '  larg ' + String(b.larg).padStart(4) + '  rotulo ' + b.rot +
        (b.pe > m.janela ? '   <<< FORA DA TELA' : ''));
    });
    await page.screenshot({ path: path.join(DIR, 'GL-' + ROT + '-menu-' + vp.width + 'x' + vp.height + '.png') });
    // O CUSTO EXATO DA QUINTA TABUA, sob o MESMO css: tira-se a tabua do glossario do DOM e
    // mede-se de novo. E' a unica comparacao honesta enquanto o CSS e' o mesmo nos dois lados
    // — separa "o poste ja' estava apertado nesta tela" de "eu apertei o poste".
    const semQuinta = await page.evaluate(function (m) {
      const b = document.getElementById('btnGlossario');
      if (!b) return null;
      const pai = b.parentNode, prox = b.nextSibling;
      pai.removeChild(b);
      const r = eval('(' + m + ')')();
      pai.insertBefore(b, prox);
      return r;
    }, medePoste.toString());
    if (semQuinta) {
      const f5 = m.posteTopo - m.taglinePe, f4 = semQuinta.posteTopo - semQuinta.taglinePe;
      console.log('      >> a quinta tabua custa ' + (f4 - f5) + ' px de folga  (com 4: ' + f4 + ', com 5: ' + f5 + ')' +
        (f4 < 0 ? '   [esta tela JA estourava com quatro]' : ''));
    }
    await page.close();
  }

  // ---- 2. A TELA DE GLOSSARIO ----
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(1200);
  const existe = await page.evaluate(() => !!document.getElementById('telaGlossario'));
  if (!existe) { console.log('\n=== TELA DE GLOSSARIO ainda nao existe neste build.'); await browser.close(); return; }
  await page.evaluate(() => { fecharTelas(); abrirTela('telaGlossario'); });
  // O VERDADEIRO primeiro: assim que montarGlossario() existe, e' o conteudo do jogo que
  // vai para a foto. A amostra so' segura o lugar enquanto o Dev nao chegou.
  const real = await page.evaluate(() => {
    if (typeof montarGlossario !== 'function') return 0;
    montarGlossario();
    return document.querySelectorAll('#listaGlossario .glItem').length;
  });
  console.log('\nconteudo: ' + (real ? real + ' verbetes REAIS (montarGlossario)' : 'amostra do instrumento'));
  if (!real) await page.evaluate(INJETA, AMOSTRA);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(DIR, 'GL-' + ROT + '-topo.png') });
  const med = await page.evaluate(() => {
    const box = document.getElementById('listaGlossario');
    const r = box.getBoundingClientRect();
    const v = document.getElementById('btnVoltarGloss').getBoundingClientRect();
    const tit = document.querySelector('#telaGlossario .telaTit').getBoundingClientRect();
    const it = document.querySelector('#telaGlossario .glItem').getBoundingClientRect();
    const g = document.querySelector('#telaGlossario .glGrupo');
    const gc = g && g.querySelector('canvas');
    const dv = document.querySelector('#telaGlossario .glItem.dv');
    const luma = function (el) {
      const s = getComputedStyle(el); const m = /(\d+), (\d+), (\d+)/.exec(s.color);
      return m ? Math.round(0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) : -1;
    };
    const tipo = function (sel) { const e = document.querySelector('#telaGlossario ' + sel); if (!e) return 'AUSENTE';
      const s = getComputedStyle(e);
      return s.fontStyle + ' ' + s.fontWeight + ' ' + s.fontSize + '/' + s.lineHeight + ' ' + s.fontFamily.split(',')[0] + ' luma ' + luma(e); };
    return {
      janela: window.innerHeight,
      titulo: Math.round(tit.top) + '..' + Math.round(tit.bottom),
      lista: Math.round(r.top) + '..' + Math.round(r.bottom) + ' larg ' + Math.round(r.width),
      rolo: box.scrollHeight + ' px de conteudo em ' + Math.round(r.height) + ' px de janela',
      rolaMesmo: box.scrollHeight > box.clientHeight + 2,
      voltar: Math.round(v.top) + '..' + Math.round(v.bottom),
      corteListaVoltar: Math.round(v.top - r.bottom),
      voltarNaTela: v.bottom <= window.innerHeight,
      item1: Math.round(it.height) + ' px de altura, larg ' + Math.round(it.width),
      grupoBitmap: gc ? (gc.width + 'x' + gc.height + ' @' + (gc.getBoundingClientRect().width / gc.width).toFixed(2) + 'x') : 'SEM BITMAP',
      glT: tipo('.glT'), glO: tipo('.glO'), glD: tipo('.glD'), glF: tipo('.glF'),
      dvExiste: !!dv
    };
  });
  console.log('\n=== TELA DE GLOSSARIO (' + ROT + ') 375x812');
  Object.keys(med).forEach(k => console.log('  ' + k.padEnd(18) + ' ' + med[k]));
  // rola ate o verbete disputado para fotografar o .dv
  await page.evaluate(() => {
    const dv = document.querySelector('#telaGlossario .glItem.dv');
    if (dv) dv.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(DIR, 'GL-' + ROT + '-disputado.png') });
  await page.evaluate(() => { const b = document.getElementById('listaGlossario'); b.scrollTop = b.scrollHeight; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(DIR, 'GL-' + ROT + '-fim.png') });
  await browser.close();
  console.log('\nprints GL-' + ROT + '-*.png em test/');
})();
