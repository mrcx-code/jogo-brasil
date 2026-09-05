// A FALA NOVA CABE NA CAIXA? — medida em três telas, não numa só.
//
// Escrito pelo QA em 04/09 contra a alegação 8 de `entrega/salvador-fala-abertura`: "seis
// linhas na caixa a 390x844, sem rolagem (scrollHeight 197 = clientHeight 197)". A frase de
// abertura de SALVADOR passou de 170 para 239 caracteres — 40% mais texto — e uma medida numa
// tela só não responde à pergunta que interessa, que é se ela cabe na MENOR tela que o jogo
// atende. O teto de 260 do `encaixe.js` é uma régua de CARACTERES; caber é uma régua de PIXEL,
// e as duas não são a mesma coisa quando a largura muda.
//
// Ele anda pelo caminho da pessoa (`mostrarAbertura` + `avancarFala`, como o test/ver-capitulo.js),
// espera a linha TERMINAR de ser escrita — a caixa revela ~14 caracteres por segundo, e medir
// antes disso mede meia frase e passa — e só então lê `scrollHeight`/`clientHeight`.
//
// A PRIMEIRA ASSERÇÃO ERA UM AMIGO FALSO, E O CONSERTO NÃO É O QUE O ITEM PEDIA (05/09)
//
// Ela dizia `termina em "não se recolhe"` no rótulo e era `indexOf(...) >= 0` no código. O texto
// foi reescrito para "não se recolhem", e o portão continuou verde **por acidente de substring** —
// "recolhem" CONTÉM "recolhe" —, não por a promessa ter sido mantida. É a mesma classe que esta
// casa já caçou três vezes nesta semana: decidir por casamento de string produz verde que não
// significa nada.
//
// O item `qa-fala-salvador-caixa-amigo-falso` mandava trocar por `endsWith`. **A premissa dele
// caiu na medição**, e por isso o conserto é outro. Medido em 05/09 contra `src/jogo.ts:2302`:
//
//   comprimento                        258 caracteres
//   últimos 60                         "...santo se conta. E o acarajé é as duas coisas: trabalho e fé."
//   endsWith("não se recolhe")         false
//   endsWith("não se recolhem")        false
//   indexOf("não se recolhem") >= 0    true
//
// Ou seja: a fala foi reescrita **de novo** depois do achado do QA (a mudança do acarajé, que o
// comentário de `src/jogo.ts` logo acima dela explica), e a frase deixou de ser o fim — virou
// miolo. `endsWith` deixaria este portão VERMELHO sobre uma `main` sã, e o passo seguinte seria
// alguém mexer no TEXTO DO JOGO para satisfazer o instrumento. É exatamente o que o `PLANTAO.md`
// §8 proíbe: antes de consertar o produto para satisfazer um portão, desconfie do portão.
//
// O QUE ENTROU NO LUGAR: **igualdade contra a fonte da verdade**. A asserção compara o que foi
// medido na tela com `EPOCAS[salvador].abertura[4]` lido da própria página. Ela cobra o que o
// rótulo promete (é ESTA fala, inteira), e **não precisa de manutenção** quando o texto mudar de
// novo, que é a razão de o amigo falso ter nascido.
//
// **Ela NÃO é estritamente mais forte que as duas formas antigas, e dizer que era foi um erro
// meu** — derrubado pelo QA em 05/09, com mutante que eu não tinha feito. Ela é mais forte numa
// classe e **mais fraca noutra**:
//
//   MUTANTE G — reescreve `abertura[4]` para um texto inteiramente outro (185 caracteres) que
//   apenas MENCIONA "não se recolhe":
//     asserção NOVA (igualdade)     exit 0   ← CEGA
//     asserção ANTIGA (indexOf)     exit 0   ← cega também
//     `endsWith`, o que o item pedia         ← MORDERIA
//
// Ou seja: na classe "o texto foi reescrito", o `endsWith` do item era **mais forte** que o que
// entrou aqui. A decisão de recusá-lo continua certa pelo motivo já escrito acima — ele deixaria
// o portão vermelho sobre uma `main` sã —, mas a troca **custou cobertura**, e o custo fica
// escrito porque um portão que se anuncia mais forte do que é volta a ser amigo falso, agora em
// prosa em vez de em código.
//
// A MORDIDA, PROVADA POR INJEÇÃO — e o primeiro mutante NÃO separou as duas formas (05/09)
//
// Mutante A (a navegação para uma fala antes: `i < FALA - 1`) mede a `abertura[3]`, 104 dos 258
// caracteres. Ele morde — mas **a asserção antiga também mordia**, então ele não prova nada
// sobre o conserto. Está registrado porque uma medição que não separa é resultado, não erro.
//
// Mutante B é o que separa, e é o perigo que o cabeçalho acima já descrevia — medir antes de a
// caixa terminar de revelar. Ele mede 200 dos 258 caracteres, e o fragmento "não se recolhe"
// mora entre 170 e 184, ou seja **dentro do prefixo**:
//
//   mutante B · asserção ANTIGA (indexOf)      exit 0 — "tudo verde"   ← falso verde
//   mutante B · asserção NOVA  (igualdade)     exit 1                  ← morde
//   restaurado · asserção NOVA                 exit 0, md5 de src/jogo.ts conferido
//
// O QUE ESTE CONSERTO **NÃO** FAZ, e o item pedia: uma reescrita do texto no `src/jogo.ts` não
// deixa este portão vermelho, porque a expectativa é lida da MESMA fonte que a medição. É
// deliberado. Esta asserção responde "o instrumento mediu a fala certa, inteira?" — que é a
// pergunta de que o resto do arquivo depende. "O texto é este texto?" é outra pergunta, e fixá-la
// aqui com um fragmento na mão foi exatamente o que criou o amigo falso. O teto de caracteres
// continua no `encaixe.js`; a **regra de conteúdo desta fala** vive no `test/qa-salvador-vivo.js`
// (`ANTIGA`/`PROPOSTA` mais a porta do glossário) — e não no `encaixe.js`, como esta linha dizia
// antes de o QA rodar o `grep` que eu não rodei: `encaixe.js` tem **zero** regra de conteúdo.
//
// ⚠ E O MAIOR DEFEITO DESTE ARQUIVO NÃO É ESTE, e não foi consertado aqui (05/09, achado do QA):
// as TRÊS asserções de geometria abaixo — as que dão nome ao portão — **são incapazes de
// reprovar**. `#falaPalco` e `#falaCaixa` têm `overflow: visible` e altura `auto`, e elemento que
// não corta e não rola tem `scrollHeight === clientHeight` SEMPRE: as duas primeiras comparam um
// número com ele mesmo. A terceira também não dispara, porque a caixa é ancorada embaixo e cresce
// para cima — `base` fica constante. Medido a 320×568: uma fala de 1400 caracteres dá
// `caixa 907/907` numa janela de **568**, com `topo −356`, e o portão diz "tudo verde". O único
// dos quatro números que responderia — `topo` — é IMPRESSO e não é COBRADO.
// Não é defeito de produto hoje: a maior fala do jogo é justamente esta (258, teto 260) e a folga
// a 320×568 é de 282 px ≈ 515 caracteres. **Quem segura a linha é o teto de CARACTERES do
// `encaixe.js`, não estas três asserções de pixel.** Item aberto: `portao-fala-topo-na-tela`.
//
//   node test/qa-fala-salvador-caixa.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const DIR = __dirname;
const TELAS = [[390, 844], [360, 640], [320, 568]];
const FALA = 4;            // EPOCAS[salvador].abertura[4] — a que a entrega reescreveu

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok    ' : '  FALHA ') + msg); if (!cond) falhas++; }

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  for (const [w, h] of TELAS) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(ABRIR('file://' + path.resolve(DIR, '..', 'index.html')));
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      const e = EPOCAS.findIndex(x => x.id === 'salvador');
      fecharTudo(); entrarNaEpoca(e); redesenharFundo(); fecharTelas(); mostrarAbertura(undefined, true);
    });
    await page.waitForTimeout(4200);                       // a cerimônia do nome segura 3,4 s
    for (let i = 0; i < FALA; i++) {
      await page.waitForTimeout(400);
      await page.evaluate(() => avancarFala());            // termina a linha
      await page.waitForTimeout(200);
      await page.evaluate(() => avancarFala());            // vira a página
    }
    await page.waitForTimeout(500);
    await page.evaluate(() => avancarFala());              // completa a fala 5 sem virar
    await page.waitForTimeout(400);

    const m = await page.evaluate(function (FALA) {
      const txt = document.getElementById('falaTxt');
      const palco = document.getElementById('falaPalco');
      const caixa = document.getElementById('falaCaixa');
      const cs = getComputedStyle(txt);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
      const r = txt.getBoundingClientRect();
      const ep = EPOCAS.find(x => x.id === 'salvador');
      return {
        texto: txt.textContent,
        esperado: ep.abertura[FALA],
        linhas: Math.round(r.height / lh),
        lh: +lh.toFixed(1),
        txt: { s: txt.scrollHeight, c: txt.clientHeight },
        palco: { s: palco.scrollHeight, c: palco.clientHeight },
        caixa: { s: caixa.scrollHeight, c: caixa.clientHeight, topo: caixa.getBoundingClientRect().top, base: caixa.getBoundingClientRect().bottom },
        janela: innerHeight
      };
    }, FALA);
    const arq = path.join(DIR, 'QAFALA-salvador-' + w + 'x' + h + '.png');
    await page.screenshot({ path: arq });

    console.log('\n' + w + 'x' + h + ' — ' + m.texto.length + ' caracteres, ' + m.linhas + ' linhas (line-height ' + m.lh + ')');
    console.log('  falaTxt   ' + m.txt.s + '/' + m.txt.c + '   falaPalco ' + m.palco.s + '/' + m.palco.c +
      '   falaCaixa ' + m.caixa.s + '/' + m.caixa.c + '  (topo ' + Math.round(m.caixa.topo) + ', base ' + Math.round(m.caixa.base) + ' de ' + m.janela + ')');
    console.log('  print: ' + arq);
    ok(m.texto === m.esperado, 'a fala medida é EXATAMENTE EPOCAS[salvador].abertura[' + FALA + ']' +
      ' (' + m.texto.length + ' caracteres medidos, ' + m.esperado.length + ' na fonte)');
    ok(m.palco.s <= m.palco.c + 1, 'o palco da fala não rola (' + m.palco.s + ' ≤ ' + m.palco.c + ')');
    ok(m.caixa.s <= m.caixa.c + 1, 'a caixa da fala não rola (' + m.caixa.s + ' ≤ ' + m.caixa.c + ')');
    ok(m.caixa.base <= m.janela + 1, 'a caixa termina dentro da tela (base ' + Math.round(m.caixa.base) + ' ≤ ' + m.janela + ')');
    await page.close();
  }
  await browser.close();
  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
