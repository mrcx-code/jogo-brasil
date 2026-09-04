// "FECHARIA A PORTA" É FORTE DEMAIS? — a segunda medida da alegação 7 da entrega.
//
// A historiadora mediu que apagar os três nomes da fala de SALVADOR derruba a porta AS PALAVRAS
// DAQUI de 7 para 4 verbetes, perdendo PANO DA COSTA, ACARAJÉ e BÚZIOS. O QA reproduziu esse
// 7/4/7 com instrumento próprio (test/qa-salvador-vivo.js) e ele bate exatamente.
//
// Este arquivo mede a PARTE QUE FALTA, e é a que decide o tamanho da frase: os três ficariam
// mesmo fora do alcance de quem está no capítulo, ou continuariam a UM CLIQUE, pelas ligações
// `rel`/`GLOSSARIO_REL` dos verbetes que SOBRAM na porta? A diferença importa porque "o jogo
// emudeceria sobre eles" e "a porta direta fecharia" não são a mesma afirmação, e só a segunda
// é sustentada por número.
//
//   node test/qa-salvador-porta-indireta.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const RAIZ = path.resolve(__dirname, '..');
const SEM_NOMES = "Pela ladeira vem tabuleiro, barril d'água e trouxa de roupa — o trabalho da rua, e é ele que fica no chão: os mesmos três contadores de sempre.";
const ALVOS = ['PANO DA COSTA', 'ACARAJÉ', 'BÚZIOS'];

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await page.goto(ABRIR('file://' + path.resolve(RAIZ, process.env.JOGO_HTML || 'index.html')));
  await page.waitForTimeout(900);

  const r = await page.evaluate(function (a) {
    const ep = iEp('salvador');
    const original = EPOCAS[ep].abertura[4];
    function porta() { capPalavrasCache = null; return capPalavrasCalcular()[ep].map(i => GLOSSARIO[i].t); }
    function rel(t) {
      const v = GLOSSARIO.find(function (x) { return x.t === t; });
      return (v && v.rel) || (typeof GLOSSARIO_REL !== 'undefined' && GLOSSARIO_REL[t]) || [];
    }
    const hoje = porta();
    EPOCAS[ep].abertura[4] = a.sem;
    const sem = porta();
    const umClique = {};
    a.alvos.forEach(function (t) {
      umClique[t] = sem.filter(function (p) { return rel(p).indexOf(t) >= 0; });
    });
    EPOCAS[ep].abertura[4] = original;
    const volta = porta();
    return { hoje, sem, umClique, volta, relDosAlvos: a.alvos.map(t => ({ t, rel: rel(t) })) };
  }, { sem: SEM_NOMES, alvos: ALVOS });
  await browser.close();

  console.log('porta de SALVADOR com a fala aplicada (' + r.hoje.length + '): ' + r.hoje.join(', '));
  console.log('porta de SALVADOR sem os três nomes (' + r.sem.length + '): ' + r.sem.join(', '));
  console.log('controle (restaurada): ' + r.volta.length + ' — ' + r.volta.join(', '));
  console.log('\nsem os nomes, quem ainda leva a cada um a UM CLIQUE (rel dos que sobram na porta):');
  ALVOS.forEach(function (t) {
    const q = r.umClique[t];
    console.log('  ' + t.padEnd(14) + (q.length ? '← ' + q.join(', ') : 'NINGUÉM — sairia da navegação do capítulo por completo'));
  });
  console.log('\nleitura: a porta DIRETA fecha (medido, 7 → 4). O que não fecha é a navegação inteira,');
  console.log('e é por isso que a frase certa é "fecha a porta direta", não "o jogo emudece".');
})().catch(e => { console.error(e); process.exit(1); });
