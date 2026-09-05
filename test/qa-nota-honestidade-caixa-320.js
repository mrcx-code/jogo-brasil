// QA VISUAL — a nota no fecho, na TELA MAIS APERTADA que o jogo atende (320×568).
//
// O relatório da entrega diz "print da caixa nos seis: cabe folgado". Isto mede em vez de
// olhar, e mede a coisa que o print não mostra: a caixa de fala NÃO tem a altura da linha que
// está aparecendo — `#falaPalco` é uma grade de uma célula com TODAS as falas da conversa
// empilhadas invisíveis dentro (`#falaFantasma`), então a caixa fica do tamanho da MAIS ALTA
// da conversa inteira. Acrescentar uma sétima fala ao fecho pode, em princípio, crescer a
// caixa — e cresce em silêncio, porque nenhuma linha isolada parece grande.
//
// O que este arquivo afirma, nos seis capítulos, a 320×568:
//   · a caixa do fecho com SETE falas tem a MESMA altura do fecho de SEIS de antes — ou seja,
//     a nota não é a fala mais alta e não empurrou a moldura;
//   · a caixa inteira cabe na tela (topo ≥ 0, base ≤ altura da janela) com a nota na tela;
//   · o texto não estoura a própria caixa (scrollHeight == clientHeight no palco);
//   · e a LEITURA da abertura: a última linha lida é o `querer` (o `mostrarAbertura` o
//     acrescenta), e a fala imediatamente antes dele passou a ser o VERBO do capítulo — que é
//     o que a decisão do dono queria. A nota não está mais entre o verbo e o querer.
//
//   node test/qa-nota-honestidade-caixa-320.js
//
// Prints em test/QA-NOTA-*.png. Sai 1 na primeira falha.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return p;
  return ABRIR('file://' + path.resolve(__dirname, '..', p || 'index.html'));
}
let falhas = 0;
function ok(cond, txt) {
  console.log((cond ? '  ok    ' : '  FALHA ') + txt);
  if (!cond) falhas++;
}
const log = (...a) => console.log(...a);
const sec = t => log('\n---- ' + t);

const SEIS = ['cais', 'jabaquara', 'pequenaafrica', 'portas', 'naodito', 'praca'];
const L = 320, A = 568;

(async () => {
  const browser = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await browser.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(alvo());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => typeof EPOCAS !== 'undefined' && typeof abrirFala === 'function', { timeout: 15000 });
  await page.evaluate(() => { fecharTudo(); pararFala(); });

  // Monta uma conversa na tela de fala e vai até a linha `qual`, já revelada.
  async function montar(id, lista, qual) {
    return page.evaluate(([id, lista, qual]) => {
      const e = EPOCAS.find(x => x.id === id);
      fecharTudo(); pararFala();
      const falas = lista === 'abertura'
        ? (e.querer ? e.abertura.concat(['“' + e.querer + '”']) : e.abertura)
        : e.fecho;
      const imgs = lista === 'abertura'
        ? (e.querer ? (e.aberturaImg || []).concat([null]) : e.aberturaImg)
        : e.aberturaImg;
      abrirFala(e.nome, e.quando, falas, null, imgs, lista === 'abertura');
      const el = document.getElementById('telaFala');
      el.classList.add('aberta'); el.setAttribute('aria-hidden', 'false');
      el.classList.remove('cerimoniando');
      falaI = qual < 0 ? falaLinhas.length + qual : qual;
      revelarFala(); terminarLinha();
      const caixa = document.getElementById('falaCaixa').getBoundingClientRect();
      const palco = document.getElementById('falaPalco');
      return {
        n: falaLinhas.length,
        texto: document.getElementById('falaTxt').textContent,
        caixa: { top: caixa.top, bottom: caixa.bottom, h: caixa.height },
        janela: window.innerHeight,
        palcoScroll: palco.scrollHeight, palcoClient: palco.clientHeight,
      };
    }, [id, lista, qual]);
  }

  // ============================================================
  sec('A · a caixa do fecho com a nota tem a MESMA altura do fecho sem ela');
  for (const id of SEIS) {
    const com = await montar(id, 'fecho', -1);
    // agora o MESMO fecho sem a última fala (a nota) — a conversa de antes de 05/09
    const sem = await page.evaluate(([id]) => {
      const e = EPOCAS.find(x => x.id === id);
      fecharTudo(); pararFala();
      abrirFala(e.nome, e.quando, e.fecho.slice(0, -1), null, e.aberturaImg);
      const el = document.getElementById('telaFala');
      el.classList.add('aberta'); el.setAttribute('aria-hidden', 'false');
      el.classList.remove('cerimoniando');
      falaI = falaLinhas.length - 1; revelarFala(); terminarLinha();
      return document.getElementById('falaCaixa').getBoundingClientRect().height;
    }, [id]);
    const nome = id.padEnd(14);
    log('   ' + nome + ' fecho ' + com.n + ' falas · caixa ' + com.caixa.h.toFixed(1) +
        ' px · sem a nota (6 falas) ' + sem.toFixed(1) + ' px · janela ' + com.janela);
    ok(Math.abs(com.caixa.h - sem) < 0.5,
      id + ': a nota não mudou a altura da caixa (' + sem.toFixed(1) + ' -> ' + com.caixa.h.toFixed(1) + ' px)');
  }

  // ============================================================
  sec('B · com a nota na tela, a caixa cabe em 320×568 e o texto não estoura');
  for (const id of SEIS) {
    const r = await montar(id, 'fecho', -1);
    const cabe = r.caixa.top >= 0 && r.caixa.bottom <= r.janela + 0.5;
    log('   ' + id.padEnd(14) + ' topo ' + r.caixa.top.toFixed(1) + ' · base ' + r.caixa.bottom.toFixed(1) +
        ' / ' + r.janela + '  · folga em cima ' + r.caixa.top.toFixed(0) + ' px');
    ok(cabe, id + ': a caixa do fecho, na fala da nota, cabe inteira na tela de 320×568');
    ok(r.palcoScroll <= r.palcoClient + 1,
      id + ': o texto não estoura o palco (' + r.palcoScroll + ' / ' + r.palcoClient + ')');
    ok(/fica no chão/.test(r.texto), id + ': a linha na tela é mesmo a nota da arte');
    await page.screenshot({ path: path.join(__dirname, 'QA-NOTA-fecho-' + id + '-320x568.png') });
  }

  // ============================================================
  sec('C · a leitura da abertura: o verbo passou a ser a fala logo antes do querer');
  for (const id of SEIS) {
    const ult = await montar(id, 'abertura', -1);       // a última LIDA
    const penult = await montar(id, 'abertura', -2);    // a de antes dela
    log('   ' + id.padEnd(14) + ' abertura lida em ' + ult.n + ' linhas');
    log('        última  : ' + ult.texto.slice(0, 92));
    log('        penúltima: ' + penult.texto.slice(0, 92));
    ok(ult.n === 5, id + ': a abertura é lida em 5 linhas (4 falas + o querer), era 6');
    ok(/^[“"]/.test(ult.texto.trim()), id + ': a última linha lida continua sendo o querer, entre aspas');
    ok(!/fica no chão/.test(penult.texto),
      id + ': a nota não está mais entre o verbo e o querer');
    ok(/^Aqui, alcançar é|E este capítulo/.test(penult.texto.trim()) || /alcançar é/.test(penult.texto),
      id + ': a fala antes do querer é o VERBO do capítulo');
    await page.screenshot({ path: path.join(__dirname, 'QA-NOTA-abertura-' + id + '-320x568.png') });
  }

  // ============================================================
  sec('D · ACHADO DO QA: a porta AS PALAVRAS DAQUI mudou de vizinha, e ninguém declarou isso');
  // `falaOferta()` só acende o botão na ÚLTIMA linha da fala (`falaI === falaLinhas.length-1`),
  // e `mostrarFecho` é o único que liga `falaGlossCap`. Como a nota passou a SER a última linha
  // do fecho, a porta do glossário — a que o evento "abriu as palavras do capítulo" existe para
  // medir desde 19/08 — deixou de pousar no remate histórico do capítulo e passou a pousar numa
  // nota sobre produção de arte. Nenhum portão cobre isso, e a entrega não mencionou.
  // Isto NÃO é asserção de reprovação: é medição, e a decisão é editorial (do dono/PM).
  for (const id of SEIS) {
    const r = await page.evaluate(([id]) => {
      const i = EPOCAS.findIndex(e => e.id === id);
      const e = EPOCAS[i];
      const sob = (falas) => {
        fecharTudo(); pararFala();
        abrirFala(e.nome, e.quando, falas, null, e.aberturaImg);
        const el = document.getElementById('telaFala');
        el.classList.add('aberta'); el.setAttribute('aria-hidden', 'false');
        el.classList.remove('cerimoniando');
        falaGlossCap = i;
        falaI = falaLinhas.length - 1; revelarFala(); terminarLinha(); falaOferta();
        return { porta: !document.getElementById('falaGloss').hidden,
                 linha: document.getElementById('falaTxt').textContent };
      };
      const agora = sob(e.fecho);
      const antes = sob(e.fecho.slice(0, -1));
      return { agora, antes, nVerbetes: capPalavras(i).length };
    }, [id]);
    log('   ' + id.padEnd(14) + ' porta acesa: antes ' + r.antes.porta + ' · agora ' + r.agora.porta +
        ' (' + r.nVerbetes + ' verbetes)');
    log('        ANTES a porta pousava em: "' + r.antes.linha.slice(0, 88) + '…"');
    log('        AGORA pousa em          : "' + r.agora.linha.slice(0, 88) + '…"');
    ok(r.agora.porta === r.antes.porta,
      id + ': a porta continua acendendo igual (o que mudou é a fala embaixo dela, não a porta)');
  }

  ok(erros.length === 0, 'nenhum erro de console' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));
  await browser.close();
  log('\n' + (falhas ? falhas + ' FALHA(S)' : 'tudo verde'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
