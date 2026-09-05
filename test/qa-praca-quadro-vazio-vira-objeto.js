// QA — A PRAÇA: o que a abertura AFIRMA, cobrado no jogo vivo.
//
// HISTÓRIA DESTE ARQUIVO, porque ela explica a forma dele. Ele nasceu em 04/09 como PROVA VIVA
// de uma frase: a abertura de A PRAÇA dizia que quem atravessa a tela "já foi desenhado para cá,
// mas não inteiro: em alguns passos entra um objeto no lugar da pessoa", e o teste cobrava que
// esse defeito existisse de verdade — texto que se gaba de honestidade sem prova é só texto.
//
// EM 05/09 A FRASE MUDOU e este teste foi reescrito junto. A historiadora tirou a ressalva
// ("A PRACA: a ressalva 'mas nao inteiro' sai da abertura, por subtracao"), e o dev tapou dois
// dos três quadros vazios da folha de gente. A frase passou a ser:
//
//   "Quem atravessa a tela já foi desenhado para cá. A pintura ainda é emprestada do capítulo
//    anterior e o que fica no chão vem de outro — e o jogo prefere dizer isso a fingir."
//
// E NO MESMO DIA ELA MUDOU DE LISTA, por decisão do dono no check: a nota de honestidade sobre
// a arte saiu da `abertura` (onde era a quinta fala, a última antes de jogar) e passou a ser a
// ÚLTIMA do `fecho`, nos seis capítulos que a tinham. Este teste não muda por causa disso, e é
// de propósito: ele nunca leu o texto — ele mede no jogo vivo se o que a frase afirma é
// verdade. Onde a frase é LIDA é decisão editorial; se ela é VERDADEIRA é o que se cobra aqui.
//
// Então o teste deixa de provar um defeito e passa a cobrar as TRÊS afirmações que sobraram,
// que são todas verificáveis:
//   (a) "já foi desenhado para cá" — os passos usam a folha de gente PRÓPRIA de A PRAÇA;
//   (b) "a pintura ainda é emprestada do capítulo ANTERIOR" — o pacote de onde vem a pintura é
//       o do capítulo imediatamente anterior em `EPOCAS`. O teste NÃO grava o nome "naodito":
//       ele calcula `EPOCAS[ep - 1].id` na página, para que reordenar os capítulos reprove aqui
//       em vez de deixar a frase mentindo em silêncio;
//   (c) "o que fica no chão vem de OUTRO" — outro quer dizer outro capítulo, e um DIFERENTE do
//       que empresta a pintura; é por isso que a fala separa as duas coisas em vez de juntá-las.
//
// E ELE AINDA PRENDE O BURACO QUE SOBROU. `praca f2q7` continua vazio de propósito (o motivo
// longo está em CONHECIDOS, em `qa-gente-quadro-que-chega.js`: a fileira 2 tem duas células
// DOBRADAS, então nenhuma pose limpa dela pode ser verificada como continuação do passo). Aqui
// ele é cobrado NOMINALMENTE: exatamente um passo cai no objeto, e é o f2q7. Se alguém tapar o
// f2q7 sem passar por aqui, este teste reprova e manda ler a lista do portão irmão; se alguém
// abrir um buraco NOVO, ele reprova também, porque o índice deixa de bater.
//
// POR QUE MEDIR NO JOGO VIVO E NÃO NO `src/jogo.ts`: a arte de `GENTE_EP_B64.praca` NÃO viaja no
// `index.html` — ela sai no `pack-naodito.json` (ver `PACK_DA_GENTE` em ferramentas/pacotes.js).
// No arquivo construído os 24 quadros são pixel de espera até o pacote chegar, e é o PACOTE que
// decide quantos ficam vazios de verdade. Medir a fonte responderia a pergunta errada.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));

// O buraco que sobrou, por índice. Uma linha só, para o teste falar o mesmo idioma do
// CONHECIDOS do portão irmão — e para tapá-lo ser uma edição de UMA linha aqui.
const VAZIO_ESPERADO = ['f2q7'];

let falhas = 0;
function ok(c, m) { console.log((c ? '  ok   ' : '  FALHA ') + m); if (!c) falhas++; }

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) erros.push(m.text()); });
  await page.goto(ALVO, { waitUntil: 'load' });
  await page.waitForFunction('typeof EPOCAS !== "undefined" && typeof mobFrame === "function"', { timeout: 20000 });

  // Ir para A PRAÇA: achar o cenário cuja época é `praca` e esperar o pacote de arte dela.
  const foi = await page.evaluate(() => {
    const ep = EPOCAS.findIndex(e => e.id === 'praca');
    let cen = -1;
    for (let n = 0; n < TOTAL_CENAS; n++) if (epocaDoCenario(n) === ep) { cen = n; break; }
    if (cen < 0) return { erro: 'nenhum cenário mapeia para A PRAÇA' };
    S.cenario = cen; S.fronteira = Math.max(S.fronteira, cen);
    if (typeof visitando !== 'undefined') visitando = false;
    // O pacote de arte chega quando a pessoa ENTRA no capítulo; entrar por `S.cenario` pula
    // esse caminho, então pede-se explicitamente — `garantirEpoca` é a mesma porta que a
    // entrada de verdade usa, e é idempotente.
    garantirEpoca(ep);
    return { ep: ep, cen: cen, verbo: pessoaNaRua(), arteCap: capArte() };
  });
  if (foi.erro) { ok(false, foi.erro); }
  console.log('   A PRAÇA = EPOCAS[' + foi.ep + '], cenário ' + foi.cen +
    ' · pessoaNaRua()=' + foi.verbo + ' · capArte()=' + foi.arteCap);
  ok(foi.verbo === true, 'A PRAÇA está em CAPS_VERBO — `mobFrame()` chega a consultar a folha de gente');

  // O pacote chega por fetch; esperar a folha acordar (20 dos 24 quadros com tamanho real).
  await page.waitForFunction(() => {
    const f = GENTE_EP_SPR && GENTE_EP_SPR.praca;
    if (!f) return false;
    let vivos = 0;
    f.forEach(fl => fl.forEach(im => { if (im.complete && im.naturalWidth > 1) vivos++; }));
    return vivos >= 20;
  }, { timeout: 30000 });

  // Agora as 24 chamadas. `m.d` escolhe o quadro: quadro = floor(d / GENTE4_PASSO) % 8.
  const medida = await page.evaluate(() => {
    const CARGA = { 0: 'barrel', 1: 'cash', 2: 'smog' };   // GENTE_FILEIRA: drum=0, cash=1, smog=2
    const linhas = [];
    for (let fi = 0; fi < 3; fi++) {
      for (let qi = 0; qi < 8; qi++) {
        const m = { type: CARGA[fi], d: (qi + 0.5) * GENTE4_PASSO };
        const img = mobFrame(m);
        linhas.push({ f: fi, q: qi, gente: !!mobEhGente,
          w: img ? img.naturalWidth : 0, h: img ? img.naturalHeight : 0 });
      }
    }
    const folha = GENTE_EP_SPR.praca;
    const vazios = [];
    folha.forEach((fl, fi) => fl.forEach((im, qi) => { if (im.complete && im.naturalWidth <= 1) vazios.push('f' + fi + 'q' + qi); }));
    return { linhas: linhas, vazios: vazios };
  });

  const objeto = medida.linhas.filter(l => !l.gente);
  const pessoa = medida.linhas.filter(l => l.gente);
  const nomesObjeto = objeto.map(l => 'f' + l.f + 'q' + l.q);
  console.log('   quadros vazios na folha viva: ' + medida.vazios.length + ' [' + medida.vazios.join(', ') + ']');
  console.log('   dos 24 passos: ' + pessoa.length + ' desenham a PESSOA, ' + objeto.length + ' caem no OBJETO ' +
    '[' + objeto.map(l => 'f' + l.f + 'q' + l.q + ' ' + l.w + 'x' + l.h).join(', ') + ']');

  // (a) "já foi desenhado para cá"
  ok(pessoa.length === 24 - VAZIO_ESPERADO.length,
    '"já foi desenhado para cá": ' + pessoa.length + ' de 24 passos usam a folha própria de A PRAÇA' +
    ' (esperado ' + (24 - VAZIO_ESPERADO.length) + ')');

  // O buraco que sobrou, NOMEADO. Reprova tanto quem tapa sem avisar quanto quem abre outro.
  const igual = nomesObjeto.length === VAZIO_ESPERADO.length &&
    VAZIO_ESPERADO.every(v => nomesObjeto.indexOf(v) >= 0);
  ok(igual,
    igual
      ? 'o único passo que cai no objeto é o esperado [' + VAZIO_ESPERADO.join(', ') + '] — o buraco declarado ainda é esse e só esse'
      : 'os passos que caem no objeto mudaram: achei [' + nomesObjeto.join(', ') + '], esperava [' + VAZIO_ESPERADO.join(', ') + ']. ' +
        'Se o f2q7 foi tapado, tire-o de VAZIO_ESPERADO aqui E de CONHECIDOS em qa-gente-quadro-que-chega.js. ' +
        'Se apareceu quadro vazio NOVO, é regressão da folha de gente — leia o portão irmão.');
  ok(objeto.length === medida.vazios.length,
    'cada passo que cai no objeto corresponde a um quadro vazio (' + objeto.length + ' = ' + medida.vazios.length + ')');

  // ---- (b) "a pintura ainda é emprestada do capítulo ANTERIOR" e (c) "o chão vem de OUTRO" ----
  // A pintura de A PRAÇA é a do capítulo imediatamente anterior em EPOCAS; o drop sai de
  // `dropDe()` → `capArte()` = 3, e o dono do bloco 3 é AINDA AQUI. A frase separa as duas
  // coisas porque elas vêm de lugares DIFERENTES — se um dia coincidirem, ela fica ambígua e
  // esta asserção avisa.
  const chao = await page.evaluate(() => {
    const ep = EPOCAS.findIndex(e => e.id === 'praca');
    const meu = dropDe('barrel');
    let bloco = -1;
    (DROP_SPR || []).forEach((lista, i) => { if (lista && lista.indexOf && lista.indexOf(meu) >= 0) bloco = i; });
    return { bloco: bloco, dono: DONO_DO_BLOCO[bloco],
      cena: EPOCAS[ep].arte[0], donoDaCena: (window.__PACOTES && window.__PACOTES.cena[EPOCAS[ep].arte[0]]) || null,
      anterior: ep > 0 ? EPOCAS[ep - 1].id : null,
      semColeta: capSemColeta(), w: meu ? meu.naturalWidth : 0 };
  });
  console.log('   o chão de A PRAÇA: DROP_SPR[' + chao.bloco + '] (dono "' + chao.dono + '") ' + chao.w + 'px' +
    ' · a pintura vem do pacote "' + chao.donoDaCena + '" · o capítulo anterior é "' + chao.anterior + '"' +
    ' · capSemColeta()=' + chao.semColeta);
  ok(chao.semColeta === false, 'A PRAÇA DEIXA coisa no chão — a frase fala de algo que existe aqui');
  ok(chao.w > 1 && chao.dono === 'hoje',
    'o drop de A PRAÇA é o de AINDA AQUI (bloco ' + chao.bloco + '), carregado de verdade');
  ok(chao.donoDaCena === chao.anterior,
    '"a pintura ainda é emprestada do capítulo ANTERIOR": a pintura vem de "' + chao.donoDaCena +
    '" e o anterior é "' + chao.anterior + '"' +
    (chao.donoDaCena === chao.anterior ? '' : '. Se os capítulos foram reordenados, a fala da abertura precisa mudar junto — é da historiadora.'));
  ok(chao.dono !== chao.donoDaCena,
    '"o que fica no chão vem de OUTRO": o chão ("' + chao.dono + '") não vem do mesmo capítulo que a pintura ("' + chao.donoDaCena + '")');

  ok(!erros.length, 'sem erro de console' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));

  await nav.close();
  console.log(falhas ? '\nREPROVOU (' + falhas + ')' : '\nPASSOU');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
