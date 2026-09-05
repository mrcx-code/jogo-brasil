// A CAIXA DA FALA COMEÇA DENTRO DA TELA? — a pergunta que o portão vizinho promete e não faz.
//
// Escrito pelo QA em 05/09, auditando `entrega/qa-fala-salvador-caixa-amigo-falso`. A entrega
// está certa no que afirma (o amigo falso caiu, a premissa do item caiu junto, a igualdade
// contra a fonte morde) — e enquanto eu media a mordida dela, o instrumento devolveu um número
// que não fazia sentido, e o número é este arquivo.
//
// O QUE FOI MEDIDO, e é o achado. O `test/qa-fala-salvador-caixa.js` se chama "A FALA NOVA CABE
// NA CAIXA?" e decide isso com três asserções: `palco.scrollHeight <= clientHeight`,
// `caixa.scrollHeight <= clientHeight` e `caixa.bottom <= innerHeight`. AS TRÊS SÃO INCAPAZES DE
// REPROVAR uma fala que não cabe, e a medição é esta — `EPOCAS[salvador].abertura[4]` reescrita
// na página com comprimentos crescentes, a 320x568:
//
//     258 caracteres   palco 154/154   caixa 269/269   topo  282   base 550/568   portão passa
//     700 caracteres   palco 396/396   caixa 511/511   topo   40   base 550/568   portão passa
//    1400 caracteres   palco 792/792   caixa 907/907   topo -356   base 550/568   portão passa
//
// Uma caixa de 907 px numa janela de 568 px, com 356 px de texto FORA da tela pelo alto, e o
// portão diz "tudo verde". As três asserções são tautologias por construção:
//
//   · `#falaPalco` e `#falaCaixa` têm `overflow: visible` e altura `auto` (medido em
//     `getComputedStyle`: `{h:"268.5px", minH:"auto", maxH:"none", of:"visible"}`). Elemento que
//     não corta e não rola tem `scrollHeight === clientHeight` SEMPRE. As duas primeiras
//     asserções comparam um número com ele mesmo.
//   · a caixa está ancorada em BAIXO. Ela cresce para CIMA. Então `bottom` é praticamente
//     constante (550 nas três linhas acima) e a terceira asserção também não pode disparar.
//
// O transbordo desta caixa acontece pelo TOPO, e `topo` era o único dos quatro números que o
// portão vizinho IMPRIME e não COBRA. É isso que este arquivo cobra.
//
// A CAIXA É DIMENSIONADA PELA MAIOR FALA DA CONVERSA, não pela que se lê — `#falaFantasma`
// empilha todas as linhas invisíveis na mesma célula de grade (`src/jogo.ts`, em `abrirFala`).
// Duas consequências, as duas medidas:
//   1. basta ABRIR a conversa para o pior caso dela já estar na tela; não é preciso navegar até
//      a fala mais longa. É por isso que este instrumento mede 26 conversas em pouco tempo.
//   2. medir a geometria antes de a revelação terminar dá o MESMO número (medido: 65 de 258
//      caracteres revelados devolvem `palco 132/132`, `caixa 247/247`, idênticos ao completo).
//      Ou seja, a revelação incompleta que o cabeçalho do portão vizinho teme não corrompe a
//      geometria — corrompe só o rótulo. A igualdade que a entrega instalou continua valendo a
//      pena por isso: ela é o que faz o RÓTULO ser verdade.
//
// O ESTADO DE HOJE NÃO É DEFEITO DE PRODUTO, e dizer isso é parte do trabalho: a maior fala do
// jogo tem 258 caracteres (SALVADOR, abertura[4]), o teto do `encaixe.js` é 260, e a folga
// medida a 320x568 é de 282 px de topo — cerca de 515 caracteres de sobra. Quem segura a linha
// hoje é o teto de CARACTERES do `encaixe.js`, não estas três asserções de PIXEL. Este arquivo
// existe para o dia em que o teto mudar, para a fala que entrar por outro caminho (a placa da
// estrada chama `abrirFala()` com o texto inteiro do nó), e para uma tela menor que 320.
//
// O CONTROLE, porque instrumento que nunca foi visto reprovando é decoração (EQUIPE §2.8):
//
//     QAFALA_CONTROLE=1400 node test/qa-fala-cabe-de-verdade.js
//
// injeta uma fala de 1400 caracteres em cada conversa e EXIGE que este portão fique vermelho.
// Se ele passar com o defeito injetado, o instrumento é que está quebrado, e ele diz isso.
//
//   node test/qa-fala-cabe-de-verdade.js

const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

// 320x568 é a menor tela que o jogo atende (a mesma do portão vizinho); 390x844 é a de
// referência do smoke. A menor é a que decide — é nela que a folga de topo é mínima.
const TELAS = [[390, 844], [320, 568]];
const CONTROLE = parseInt(process.env.QAFALA_CONTROLE || '0', 10) || 0;

let falhas = 0, medidas = 0, piorTopo = { topo: 1e9 };
function ok(cond, msg) { console.log((cond ? '  ok    ' : '  FALHA ') + msg); if (!cond) falhas++; }

(async () => {
  const browser = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  for (const [w, h] of TELAS) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const erros = [];
    page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
    await page.goto(ABRIR('file://' + path.resolve(__dirname, '..', 'index.html')));
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await page.waitForTimeout(900);

    const n = await page.evaluate(() => EPOCAS.length);
    console.log('\n=== ' + w + 'x' + h + ' — ' + n + ' capítulos, abertura e fecho ===');
    console.log('  capítulo          conversa   maior fala   caixa    topo   base/janela');

    for (let i = 0; i < n; i++) {
      for (const conversa of ['abertura', 'fecho']) {
        // Injeta o defeito ANTES de abrir: é `abrirFala` que monta o fantasma, e é o fantasma
        // que dá a altura. Injetar depois não mudaria número nenhum.
        await page.evaluate(function (a) {
          fecharTudo(); fecharTelas();
          if (typeof pararFala === 'function') pararFala();
          if (a.n > 0) {
            const arr = EPOCAS[a.i][a.conversa];
            if (arr && arr.length) {
              const base = arr[0];
              let s = base; while (s.length < a.n) s = s + ' ' + base;
              arr[0] = s.slice(0, a.n);
            }
          }
          entrarNaEpoca(a.i); redesenharFundo(); fecharTelas();
          if (a.conversa === 'abertura') mostrarAbertura(undefined, true); else mostrarFecho(a.i);
        }, { i, conversa, n: CONTROLE });
        // A abertura tem cerimônia de 3,4 s; o fecho não tem. Depois dela ainda corre a
        // transição de entrada da caixa (translateY 16px) — medir antes disso lê a caixa
        // ainda subindo, e é a lição 2.4 do EQUIPE.
        await page.waitForTimeout(conversa === 'abertura' ? 3900 : 800);

        const m = await page.evaluate(function (a) {
          const caixa = document.getElementById('falaCaixa');
          const palco = document.getElementById('falaPalco');
          const r = caixa.getBoundingClientRect();
          return {
            aberta: document.getElementById('telaFala').classList.contains('aberta'),
            // O fantasma empilha o que `mostrarAbertura` monta, e ele CONCATENA a linha do
            // `querer` na abertura. Deixá-la de fora daria uma coluna que subestima a caixa —
            // NAO DITO tem abertura maxima de 238 e caixa de 291 justamente por causa dela.
            maior: Math.max.apply(null, ((EPOCAS[a.i][a.conversa] || ['']).concat(
              a.conversa === 'abertura' && EPOCAS[a.i].querer ? ['“' + EPOCAS[a.i].querer + '”'] : []
            )).map(function (t) { return t.length; })),
            linhas: (EPOCAS[a.i][a.conversa] || []).length,
            palco: [palco.scrollHeight, palco.clientHeight],
            alt: Math.round(r.height), topo: Math.round(r.top), base: Math.round(r.bottom),
            janela: innerHeight,
          };
        }, { i: i, conversa: conversa });

        const nome = String(i).padStart(2) + ' ' + (await page.evaluate(k => EPOCAS[k].id, i)).padEnd(14);
        console.log('  ' + nome + ' ' + conversa.padEnd(9) + ' ' + String(m.maior).padStart(6) +
          '      ' + String(m.alt).padStart(4) + '   ' + String(m.topo).padStart(5) +
          '   ' + m.base + '/' + m.janela + (m.aberta ? '' : '   (tela NÃO aberta)'));

        // A asserção que faltava. `-1` de folga porque a transição de entrada pode deixar
        // meio pixel de arredondamento.
        ok(m.aberta, nome + conversa + ': a tela da fala está mesmo aberta (senão o número acima é de uma caixa fechada)');
        ok(m.topo >= -1, nome + conversa + ': a caixa COMEÇA dentro da tela (topo ' + m.topo + ' ≥ 0; altura ' + m.alt + ' de ' + m.janela + ')');
        ok(m.base <= m.janela + 1, nome + conversa + ': a caixa termina dentro da tela (base ' + m.base + ' ≤ ' + m.janela + ')');
        medidas++;
        if (m.topo < piorTopo.topo) piorTopo = { topo: m.topo, onde: nome + conversa, tela: w + 'x' + h, alt: m.alt, janela: m.janela };
      }
    }
    if (erros.length) { console.log('  ERROS DE PÁGINA: ' + erros.join(' | ')); falhas += erros.length; }
    await page.close();
  }
  await browser.close();

  console.log('\n' + medidas + ' conversas medidas · folga de topo mais apertada: ' + piorTopo.topo +
    ' px em ' + piorTopo.onde + ' a ' + piorTopo.tela + ' (caixa ' + piorTopo.alt + ' de ' + piorTopo.janela + ')');

  if (CONTROLE) {
    // No modo controle o veredito se INVERTE: o defeito está injetado, então verde é o defeito.
    if (falhas === 0) {
      console.log('\nCONTROLE FALHOU — com falas de ' + CONTROLE + ' caracteres injetadas, este portão ainda passou.');
      console.log('Um portão que não reprova o defeito que ele mede é decoração (EQUIPE §2.8).');
      process.exit(1);
    }
    console.log('\nCONTROLE PASSOU — ' + falhas + ' asserção(ões) reprovaram com o defeito de ' + CONTROLE + ' caracteres injetado.');
    process.exit(0);
  }

  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
