// QA — A NOTA DE HONESTIDADE SAIU DA ABERTURA E FOI PARA O FECHO (05/09, decisão do dono).
//
// Este arquivo NÃO acredita no relatório de quem fez. Ele mede, no jogo VIVO, as sete
// alegações da entrega `fbcc359`, e cada uma vira asserção com exit code:
//
//   1. nos seis capítulos a `abertura` tem 4 falas e a `aberturaImg` tem 4 posições;
//   2. a nota é a ÚLTIMA fala do `fecho` nos seis, e em nenhum outro lugar;
//   3. a nota migrou SEM REESCRITA: o texto novo é prefixo exato do antigo, e o que sobra do
//      antigo é exatamente a oração dos contadores — nada mais foi cortado, nada acrescentado;
//   4. a oração dos contadores não sobrou em canto nenhum de EPOCAS;
//   5. os OUTROS SETE capítulos não ganharam nota nenhuma (regressão em quem não foi tocado);
//   6. o total de falas do jogo não mudou — o que a abertura perdeu, o fecho ganhou;
//   7. tirar a oração dos contadores não fecha porta em AS PALAVRAS DAQUI: a lista de verbetes
//      de cada capítulo é IDÊNTICA à que o jogo daria com o texto de antes. Isto é medido
//      rodando `capPalavrasCalcular()` duas vezes — uma como está, outra com EPOCAS remontado
//      na forma antiga —, e não por leitura de olho.
//
// E mede o que a entrega NÃO mediu (o gap): o `fecho` também é servido por `aberturaImg`
// posição a posição (`mostrarFecho` → `abrirFala`), e NENHUM portão desta casa cobra esse
// encaixe — o `encaixe.js` bloco 1 só olha `abertura` e `TRAVESSIAS`. A trava aqui é a que
// faltava: nos capítulos com nota, a nota é a última fala e a última fala não pode herdar
// pintura de contexto; e a pintura que cada fala de fecho herda tem de ser a MESMA de antes.
//
//   node test/qa-nota-honestidade-mudou-de-lugar.js
//
// Roda contra o index.html da RAIZ como está (sem build). Sai 1 na primeira falha.
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

// Os seis que a entrega diz ter mexido, por id. Escrito à mão de propósito: se a entrega
// mexeu num sétimo sem dizer, o bloco 5 acusa.
const SEIS = ['cais', 'jabaquara', 'pequenaafrica', 'portas', 'naodito', 'praca'];
// A oração que a entrega diz ter deixado para trás, palavra por palavra.
const CONTADORES = ' Os três contadores lá em cima são os mesmos de sempre.';

(async () => {
  const browser = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(alvo());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => typeof EPOCAS !== 'undefined' && EPOCAS.length > 0, { timeout: 15000 });

  // A MORDIDA, provada por injeção: `--controle` põe a nota no COMEÇO do fecho, que é
  // exatamente o defeito que a entrega diz ter evitado. Nenhum portão desta casa pega isso
  // hoje (o `encaixe.js` bloco 1 só olha `abertura` e `TRAVESSIAS`), então sem esta prova o
  // bloco GAP abaixo seria só uma asserção bonita que nunca foi vista reprovando.
  // Com o mutante, o esperado é exit 1 — e é isso que o controle cobra.
  const CONTROLE = process.argv.indexOf('--controle') >= 0;
  if (CONTROLE) {
    log('(--controle: a nota vai para o COMEÇO do fecho nos seis. O esperado agora é REPROVAR.)');
    await page.evaluate((SEIS) => {
      SEIS.forEach(id => {
        const e = EPOCAS.find(x => x.id === id);
        if (!e) return;
        e.fecho = [e.fecho[e.fecho.length - 1]].concat(e.fecho.slice(0, -1));
      });
    }, SEIS);
  }

  const caps = await page.evaluate(() => EPOCAS.map((e, i) => ({
    i, id: e.id, nome: e.nome,
    ab: (e.abertura || []).length,
    img: (e.aberturaImg || []).length,
    fe: (e.fecho || []).length,
    ultAb: (e.abertura || []).slice(-1)[0] || '',
    ultFe: (e.fecho || []).slice(-1)[0] || '',
    todas: (e.abertura || []).concat(e.fecho || []),
  })));

  // ============================================================
  sec('1 · nos seis, a abertura tem 4 falas e a lista de imagens tem 4 posições');
  caps.forEach(c => {
    const naLista = SEIS.indexOf(c.id) >= 0;
    log('   ' + String(c.nome).padEnd(24) + ' abertura ' + c.ab + ' · aberturaImg ' + c.img + ' · fecho ' + c.fe + (naLista ? '   <- dos seis' : ''));
  });
  SEIS.forEach(id => {
    const c = caps.find(x => x.id === id);
    ok(!!c, 'capítulo "' + id + '" existe em EPOCAS');
    if (!c) return;
    ok(c.ab === 4, c.nome + ': abertura tem 4 falas (medido ' + c.ab + ')');
    ok(c.img === 4, c.nome + ': aberturaImg tem 4 posições (medido ' + c.img + ')');
  });
  // e o encaixe que o bloco 1 do encaixe.js já cobra, repetido aqui para este arquivo valer sozinho
  caps.forEach(c => ok(c.ab === c.img, c.nome + ': ' + c.ab + ' falas para ' + c.img + ' imagens'));

  // ============================================================
  sec('2 · a nota é a ÚLTIMA fala do fecho nos seis — e a abertura volta a terminar no verbo');
  // A rede que pega uma nota de arte em qualquer das seis redações. O CAIS não usa "desenhad"
  // ("já são deste capítulo"), então o detector é pelo que TODAS dizem: o que fica no chão.
  const ehNota = s => /o que fica no chão/.test(s) &&
                      /emprestad|já são deste capítulo|já (foram|foi) desenhad/.test(s);
  caps.forEach(c => {
    const naLista = SEIS.indexOf(c.id) >= 0;
    const notasAb = c.todas.slice(0, c.ab).filter(ehNota).length;
    const notaNoFimDoFecho = ehNota(c.ultFe);
    if (naLista) {
      ok(notasAb === 0, c.nome + ': a abertura não tem mais nota de arte (achadas ' + notasAb + ')');
      ok(notaNoFimDoFecho, c.nome + ': a nota é a ÚLTIMA fala do fecho');
      log('        abertura termina em: "' + c.ultAb.slice(0, 78) + '…"');
    }
  });

  // ============================================================
  sec('3 · a nota migrou sem reescrita: texto novo + oração dos contadores == texto antigo');
  // O texto ANTIGO de cada uma, copiado do commit 71428a2 (o pai da entrega). Está aqui
  // inteiro de propósito: comparar contra o que a entrega diz é comparar contra ela mesma.
  const ANTIGAS = {
    cais: 'A pintura e quem atravessa a tela já são deste capítulo — quem passa é gente da Saúde e da Gamboa de hoje, sobre a pedra que voltou à luz. Emprestado, só o que fica no chão. Os três contadores lá em cima são os mesmos de sempre.',
    jabaquara: 'A serra e a gente que desce por ela já foram desenhadas para este capítulo. O que ainda vem emprestado de outro é só o que fica no chão, e o jogo prefere dizer isso a fingir. Os três contadores lá em cima são os mesmos de sempre.',
    pequenaafrica: 'A rua e quem atravessa a tela já foram desenhadas para este capítulo. O que ainda vem emprestado de outro é só o que fica no chão, e o jogo prefere dizer isso a fingir. Os três contadores lá em cima são os mesmos de sempre.',
    portas: 'O pátio e quem atravessa a tela já foram desenhados para este capítulo. O que ainda vem emprestado de outro é só o que fica no chão, e o jogo prefere dizer isso a fingir. Os três contadores lá em cima são os mesmos de sempre.',
    naodito: 'A rua e quem atravessa a tela já foram desenhadas para este capítulo. O que ainda vem emprestado de outro é só o que fica no chão, e o jogo prefere dizer isso a fingir. Os três contadores lá em cima são os mesmos de sempre.',
    praca: 'Quem atravessa a tela já foi desenhado para cá. A pintura ainda é emprestada do capítulo anterior e o que fica no chão vem de outro — e o jogo prefere dizer isso a fingir. Os três contadores lá em cima são os mesmos de sempre.',
  };
  const medidas = [];
  SEIS.forEach(id => {
    const c = caps.find(x => x.id === id);
    if (!c) return;
    const nova = c.ultFe, antiga = ANTIGAS[id];
    medidas.push({ nome: c.nome, n: nova.length, a: antiga.length });
    ok(antiga === nova + CONTADORES,
      c.nome + ': a nova é a antiga MENOS a oração dos contadores, caractere a caractere' +
      (antiga === nova + CONTADORES ? ' (' + antiga.length + ' -> ' + nova.length + ')'
        : '\n           antiga: ' + JSON.stringify(antiga) + '\n           nova+or: ' + JSON.stringify(nova + CONTADORES)));
  });
  log('   comprimentos das seis movidas: ' + medidas.map(m => m.n).join(' · '));

  // ============================================================
  sec('4 · a oração dos contadores não sobrou em canto nenhum');
  const sobrou = caps.filter(c => c.todas.some(l => /contadores lá em cima/.test(l)))
    .map(c => c.nome);
  ok(sobrou.length === 0, 'nenhuma fala de EPOCAS ainda diz "contadores lá em cima"' +
    (sobrou.length ? ' — sobrou em: ' + sobrou.join(', ') : ''));

  // ============================================================
  sec('5 · os outros sete não ganharam nota nenhuma (regressão em quem não foi tocado)');
  caps.filter(c => SEIS.indexOf(c.id) < 0).forEach(c => {
    const quantas = c.todas.filter(ehNota).length;
    ok(quantas === 0, c.nome + ': continua sem nota de arte (achadas ' + quantas + ')');
    ok(c.ab === 5 || c.ab === c.img, c.nome + ': abertura ' + c.ab + ' · imagens ' + c.img);
  });

  // ============================================================
  sec('6 · o total de falas do jogo não mudou — o que a abertura perdeu, o fecho ganhou');
  // Os números de ANTES saem do commit PAI (71428a2), contados do texto de `src/jogo.ts` por
  // ferramenta separada e conferidos contra esta medição no jogo vivo: abertura 65 · fecho 64.
  const AB_ANTES = 65, FE_ANTES = 64;
  const totAb = caps.reduce((s, c) => s + c.ab, 0);
  const totFe = caps.reduce((s, c) => s + c.fe, 0);
  const extras = await page.evaluate(() => ({
    trav: TRAVESSIAS.reduce((s, t) => s + (t.linhas || []).length, 0),
    querer: EPOCAS.filter(e => e.querer).length,
    marcos: (typeof MARCOS !== 'undefined' ? MARCOS.length : -1),
  }));
  log('   abertura ' + totAb + ' + fecho ' + totFe + ' = ' + (totAb + totFe) + ' falas em EPOCAS');
  log('   antes (71428a2): abertura ' + AB_ANTES + ' + fecho ' + FE_ANTES + ' = ' + (AB_ANTES + FE_ANTES));
  log('   para referência: querer ' + extras.querer + ' · travessia ' + extras.trav + ' · marcos ' + extras.marcos +
      ' · abertura+fecho+querer+travessia = ' + (totAb + totFe + extras.querer + extras.trav));
  ok(totAb + totFe === AB_ANTES + FE_ANTES,
    'EPOCAS soma as MESMAS ' + (AB_ANTES + FE_ANTES) + ' falas de antes (medido ' + (totAb + totFe) + ')');
  ok(totAb === AB_ANTES - 6, 'a abertura perdeu exatamente 6 falas (' + AB_ANTES + ' -> ' + totAb + ')');
  ok(totFe === FE_ANTES + 6, 'o fecho ganhou exatamente 6 falas (' + FE_ANTES + ' -> ' + totFe + ')');

  // ============================================================
  sec('7 · AS PALAVRAS DAQUI não perdeu nenhum verbete com a subtração da oração');
  // Roda o cálculo real do jogo duas vezes: como está, e com EPOCAS remontado na FORMA ANTIGA
  // (nota de volta no fim da abertura, com a oração dos contadores; fora do fim do fecho).
  const palavras = await page.evaluate((args) => {
    const { SEIS, ANTIGAS } = args;
    const antesDoTeste = JSON.stringify(capPalavrasCalcular());
    const guarda = EPOCAS.map(e => ({ ab: e.abertura.slice(), fe: e.fecho.slice() }));
    SEIS.forEach(id => {
      const e = EPOCAS.find(x => x.id === id);
      if (!e) return;
      e.fecho = e.fecho.slice(0, -1);        // tira a nota do fim do fecho
      e.abertura = e.abertura.concat([ANTIGAS[id]]);  // devolve a antiga ao fim da abertura
    });
    capPalavrasCache = null;
    const comOTextoAntigo = JSON.stringify(capPalavrasCalcular());
    EPOCAS.forEach((e, i) => { e.abertura = guarda[i].ab; e.fecho = guarda[i].fe; });
    capPalavrasCache = null;
    const depoisDeRestaurar = JSON.stringify(capPalavrasCalcular());
    return { agora: antesDoTeste, antigo: comOTextoAntigo, restaurado: depoisDeRestaurar,
      nVerbetes: GLOSSARIO.filter(v => !v.g && v.t).length };
  }, { SEIS, ANTIGAS });
  log('   verbetes no GLOSSARIO: ' + palavras.nVerbetes);
  ok(palavras.agora === palavras.restaurado, 'o experimento devolveu EPOCAS ao estado original');
  ok(palavras.agora === palavras.antigo,
    'AS PALAVRAS DAQUI dá EXATAMENTE a mesma lista com o texto de antes e com o de agora' +
    (palavras.agora === palavras.antigo ? '' : '\n           agora : ' + palavras.agora + '\n           antigo: ' + palavras.antigo));

  // ============================================================
  sec('GAP · o fecho também é servido por aberturaImg posição a posição, e ninguém cobrava isso');
  // `mostrarFecho` passa `EPOCAS[i].aberturaImg` para `abrirFala`, que faz `imgs[i] || null`.
  // Uma linha nova no COMEÇO do fecho empurraria cada pintura de contexto para a fala seguinte
  // — em silêncio, sem erro, e o `encaixe.js` bloco 1 NÃO pega, porque ele só olha `abertura`.
  // Estas asserções são a trava que faltava.
  const fechoImgs = await page.evaluate(() => EPOCAS.map(e => ({
    id: e.id, nome: e.nome,
    // exatamente a conta que `abrirFala` faz para o fecho
    herda: (e.fecho || []).map((_, i) => (e.aberturaImg && e.aberturaImg[i]) || null),
    // e a fala que fica DEBAIXO de cada pintura — é isto que importa, não o índice.
    // Foi este par que o primeiro rascunho deste arquivo não olhava: reordenar o fecho não
    // mexe em `herda` nenhum (as pinturas ficam nas posições 0,1,2 aconteça o que acontecer),
    // então uma asserção só sobre `herda` passa lisa pelo defeito que ela diz cobrir.
    sob: (e.fecho || []).map((l, i) => ({
      img: (e.aberturaImg && e.aberturaImg[i]) || null, ehNota: /o que fica no chão/.test(l),
    })),
  })));
  // A pintura que cada fala de fecho herda, como estava em 71428a2 (aberturaImg tinha 5
  // posições, e a quinta era `null` nos seis — por isso nada podia se mover).
  const ESPERADO = {
    cais: ['cap5-cais', 'cap5-cais', 'cap5-coberto', null, null, null, null],
    jabaquara: ['cap6-serra', 'cap6-serra', 'cap6-morro', null, null, null, null],
    pequenaafrica: ['cap7-praca', 'cap7-praca', 'cap7-casa', null, null, null, null],
    portas: ['cap8-patio', 'cap8-patio', 'cap8-noturno', null, null, null, null],
    naodito: ['cap9-rua', 'cap9-rua', 'cap9-banca', null, null, null, null],
    praca: ['cap10-comicio', 'cap10-comicio', 'cap10-depois', null, null, null, null],
  };
  SEIS.forEach(id => {
    const f = fechoImgs.find(x => x.id === id);
    if (!f) return;
    log('   ' + f.nome.padEnd(24) + ' fecho herda: ' + JSON.stringify(f.herda));
    ok(JSON.stringify(f.herda) === JSON.stringify(ESPERADO[id]),
      f.nome + ': cada POSIÇÃO do fecho herda a mesma pintura de antes');
    // a que morde de verdade: nenhuma pintura de contexto pode cair debaixo da nota de arte,
    // e as três primeiras falas (as que têm pintura) têm de ser as históricas.
    const notaComPintura = f.sob.filter(s => s.ehNota && s.img);
    ok(notaComPintura.length === 0,
      f.nome + ': nenhuma pintura de contexto pousa na nota de produção' +
      (notaComPintura.length ? ' — a nota herdou ' + JSON.stringify(notaComPintura.map(s => s.img)) : ''));
    ok(f.sob[f.sob.length - 1].ehNota && !f.sob[f.sob.length - 1].img,
      f.nome + ': a nota é a última do fecho e não puxa pintura');
  });

  // ============================================================
  sec('8 · o caminho do SAVE ANTIGO: quem já leu a abertura e ainda não chegou no fecho');
  // A pergunta que a entrega não fez: a nota mudou de lista, mas as duas listas são de leitura
  // ÚNICA por save (`jaViu(S.aberturas, i)` e `jaViu(S.fechos, i)`). Um save de quem já leu a
  // abertura do capítulo (com a nota velha) e ainda não chegou no fecho vai receber a nota DE
  // NOVO, agora no fecho. Não é perda — é repetição, e só para quem está no meio do caminho.
  // O que NÃO pode acontecer é a nota sumir: `mostrarFecho` não olha `S.aberturas`, então ela
  // aparece mesmo para quem pulou a abertura. Isto mede as duas coisas de verdade.
  for (const id of SEIS) {
    const r = await page.evaluate(([id]) => {
      const i = EPOCAS.findIndex(e => e.id === id);
      // save de quem JÁ LEU a abertura deste capítulo e NUNCA viu o fecho de ninguém
      S.aberturas = (1 << i) >>> 0;
      S.fechos = 0;
      fecharTudo(); pararFala();
      const abriu = mostrarFecho(i);
      const linhas = falaLinhas.slice();
      return { abriu, n: linhas.length, ultima: linhas[linhas.length - 1] || '',
        // e o segundo fecho do mesmo capítulo, que não deve acontecer
        deNovo: (function () { pararFala(); return mostrarFecho(i); })() };
    }, [id]);
    ok(r.abriu === true, id + ': o fecho abre mesmo com a abertura já lida no save');
    ok(/fica no chão/.test(r.ultima), id + ': e a nota está lá, na última das ' + r.n + ' falas');
    ok(r.deNovo === false, id + ': e continua sendo leitura única (o segundo fecho não abre)');
  }
  await page.evaluate(() => { S.aberturas = 0; S.fechos = 0; fecharTudo(); pararFala(); });

  ok(erros.length === 0, 'nenhum erro de console' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));

  await browser.close();
  log('\n' + (falhas ? falhas + ' FALHA(S)' : 'tudo verde'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
