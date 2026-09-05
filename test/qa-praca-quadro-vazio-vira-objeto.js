// QA 04/09 — A PROVA VIVA DA FRASE "em alguns passos entra um objeto no lugar da pessoa".
//
// A abertura de A PRAÇA passou a afirmar, em 04/09, que quem atravessa a tela "já foi desenhado
// para cá, mas não inteiro: em alguns passos entra um objeto no lugar da pessoa". Isso é uma
// afirmação sobre o que o JOGO faz, não sobre o que a fonte contém — e a diferença importa,
// porque a arte de `GENTE_EP_B64.praca` NÃO viaja no `index.html`: ela sai no `pack-naodito.json`
// (ver `PACK_DA_GENTE` em ferramentas/pacotes.js). Medir o `src/jogo.ts` responderia a pergunta
// errada: no arquivo construído os 24 quadros são pixel de espera até o pacote chegar, e é o
// PACOTE que decide quantos ficam vazios de verdade.
//
// Então este teste mede DEPOIS do pacote, no jogo vivo, chamando `mobFrame()` nas 24 distâncias
// que escolhem os 24 quadros e lendo `mobEhGente` — a mesma variável que o desenho lê.
//
// O que ele cobra:
//   (a) A PRAÇA usa a folha de gente própria na MAIORIA dos passos (senão "já foi desenhado
//       para cá" seria falso);
//   (b) e em PELO MENOS UM passo o jogo cai no objeto genérico (senão "mas não inteiro" e "em
//       alguns passos entra um objeto no lugar da pessoa" seriam falsos, na direção contrária).
//
// ⚠ ELE É PERECÍVEL DE PROPÓSITO: quem fechar `quadros-de-gente-vazios-na-fonte` e preencher os
//   três quadros faz (b) REPROVAR — e essa reprovação é o lembrete de voltar à fala, que passa a
//   ser a das outras cinco. Está escrito na mensagem de falha.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));

let falhas = 0;
function ok(c, m) { console.log((c ? '  ok   ' : '  FALHA ') + m); if (!c) falhas++; }

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
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

  // O pacote chega por fetch; esperar a folha acordar (21 dos 24 quadros com tamanho real).
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
  console.log('   quadros vazios na folha viva: ' + medida.vazios.length + ' [' + medida.vazios.join(', ') + ']');
  console.log('   dos 24 passos: ' + pessoa.length + ' desenham a PESSOA, ' + objeto.length + ' caem no OBJETO ' +
    '[' + objeto.map(l => 'f' + l.f + 'q' + l.q + ' ' + l.w + 'x' + l.h).join(', ') + ']');

  ok(pessoa.length >= 20,
    '"já foi desenhado para cá": ' + pessoa.length + ' de 24 passos usam a folha própria de A PRAÇA');
  ok(objeto.length >= 1,
    objeto.length >= 1
      ? '"em alguns passos entra um objeto no lugar da pessoa": ' + objeto.length + ' passo(s) caem no objeto — a frase da abertura tem prova viva'
      : 'NENHUM passo cai no objeto. Se os quadros vazios foram preenchidos (item `quadros-de-gente-vazios-na-fonte`), ESTE TESTE É O LEMBRETE: volte à abertura de A PRAÇA e tire o "mas não inteiro" — ela virou a frase das outras cinco.');
  ok(objeto.length === medida.vazios.length,
    'cada passo que cai no objeto corresponde a um quadro vazio (' + objeto.length + ' = ' + medida.vazios.length + ')');
  // ---- E A OUTRA METADE DA FRASE: "o que fica no chão vem de outro" ----
  // "Outro" quer dizer outro CAPÍTULO, e não o mesmo de onde vem a pintura — é por isso que a
  // fala separa as duas coisas em vez de juntá-las num "também". A pintura de A PRAÇA é a de
  // O QUE NÃO PODIA SER DITO (`arte: [10]`); o drop sai de `dropDe()` → `capArte()` = 3, e o
  // dono do bloco 3 é AINDA AQUI. Se um dia os dois passarem a vir do mesmo lugar, a frase
  // fica ambígua e esta asserção avisa.
  const chao = await page.evaluate(() => {
    const ep = EPOCAS.findIndex(e => e.id === 'praca');
    const meu = dropDe('barrel');
    let bloco = -1;
    (DROP_SPR || []).forEach((lista, i) => { if (lista && lista.indexOf && lista.indexOf(meu) >= 0) bloco = i; });
    return { bloco: bloco, dono: DONO_DO_BLOCO[bloco],
      cena: EPOCAS[ep].arte[0], donoDaCena: (window.__PACOTES && window.__PACOTES.cena[EPOCAS[ep].arte[0]]) || null,
      semColeta: capSemColeta(), w: meu ? meu.naturalWidth : 0 };
  });
  console.log('   o chão de A PRAÇA: DROP_SPR[' + chao.bloco + '] (dono "' + chao.dono + '") ' + chao.w + 'px' +
    ' · a pintura vem do pacote "' + chao.donoDaCena + '" · capSemColeta()=' + chao.semColeta);
  ok(chao.semColeta === false, 'A PRAÇA DEIXA coisa no chão — a frase fala de algo que existe aqui');
  ok(chao.w > 1 && chao.dono === 'hoje',
    'o drop de A PRAÇA é o de AINDA AQUI (bloco ' + chao.bloco + '), carregado de verdade');
  ok(chao.dono !== chao.donoDaCena,
    '"vem de OUTRO": o chão ("' + chao.dono + '") não vem do mesmo capítulo que a pintura ("' + chao.donoDaCena + '")');

  ok(!erros.length, 'sem erro de console' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));

  await nav.close();
  console.log(falhas ? '\nREPROVOU (' + falhas + ')' : '\nPASSOU');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
