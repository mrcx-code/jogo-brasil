// O DUBLÊ ALCANÇA O AGENDAMENTO? — o portão do PENDENTES 71
//
//   node test/duble-alcanca.js
//
// POR QUE ESTE PORTÃO EXISTE, e ele não guarda uma linha, guarda uma CLASSE.
//
// Todo teste desta casa trata o save como o que ele é — entrada editável à mão — e para isso
// instala um estafeta: `salvar = function(){}`, 17 vezes ao todo entre `smoke.js`,
// `robusto-tudo.js` e `medir-save-hostil.js`. Isso funciona para toda chamada que passe pelo
// NOME. **Não funciona para o que já foi agendado pelo VALOR.**
//
// `setInterval(salvar, 10000)` guarda a função que existia no instante do agendamento.
// Reatribuir o nome depois não alcança o que o intervalo segura — então, a cada 10 s, o save
// REAL sobrescrevia a semente que o teste tinha acabado de plantar.
//
// A CAUSA RAIZ foi provada pelo QA da máquina do Windows em 23/08, e ela explica uma classe
// inteira de vermelho intermitente que as duas máquinas vinham chamando de "carga da máquina":
//
//     0s:semente | 1s:semente | … | 9s:semente | 10s:REGRAVADO
//     REGRAVADO aos 10s -> {"energia":994965,"energiaTotal":994965,"modo":"carvao","u1"…}
//
// Bytes IDÊNTICOS aos de uma reprovação real de `npm test` ("a non-boolean was accepted as an
// upgrade"): o save adulterado da semeadura tinha virado um save de verdade antes da recarga.
// Medido na `main`: 2 vermelhos em 4 rodadas, com `git diff` de `src/` VAZIO — não era entrega
// nenhuma, era isto.
//
// O QUE ESCAPA E O QUE NÃO: cena que faz `setItem` + `carregar()` SÍNCRONOS dentro de um mesmo
// `evaluate` é imune (não dá tempo de o intervalo disparar). Cena que faz `setItem` + `reload`
// não é — e são justamente essas que reprovavam por sorteio.
//
// ESTE PORTÃO FOI MEDIDO CONTRA SI MESMO, em 23/08, que é a única forma de uma asserção valer:
// com o conserto desfeito ele acusa `10s:REGRAVADO` e sai com 1; com o conserto, a semente
// sobrevive aos 13 s e ele sai com 0. Sonda que nunca viu o defeito falhar não é sonda.
//
// A CLASSE, para quem vier: agendar pelo NOME de uma função que os testes dublam. Quem procura
// os outros casos usa
//     grep -nE "set(Interval|Timeout)\( *[A-Za-z_$][A-Za-z0-9_$]* *," src/jogo.ts
// e cruza com os nomes que `test/*.js` reatribui. Em 23/08 são três — `salvar`,
// `salvarRetencao` e `clicar` — e dois deles estavam em agendamento: o save de 10 s e o
// segurar-para-atacar. Os dois foram consertados; os outros três agendamentos ficaram como
// estavam, porque nenhum teste os dubla e mexer no que não está medido é o avesso da regra.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

// 13 s: o intervalo do save é de 10, então a janela precisa passar dele com folga para o
// "não regravou" significar alguma coisa. Menos que isso mediria o silêncio antes do disparo.
const SEGUNDOS = 13;

(async () => {
  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const erros = [];
  pg.on('pageerror', (e) => erros.push(e.message));

  const p = process.env.JOGO_HTML;
  const alvo = (p && /^https?:\/\//i.test(p))
    ? p
    : ABRIR('file://' + path.resolve(__dirname, '..', p || 'index.html'));
  await pg.goto(alvo);
  await pg.waitForFunction(() => typeof S !== 'undefined');
  await pg.waitForTimeout(250);

  // exatamente o que todo teste desta casa faz: instala o dublê e planta a semente
  await pg.evaluate(() => {
    salvar = function () {};
    salvarRetencao = function () {};
    localStorage.setItem(CHAVE_JOGO, JSON.stringify({ __semente: 'MINHA-SEMENTE', energia: 500 }));
  });

  const linha = [];
  let regravadoEm = null;
  for (let s = 1; s <= SEGUNDOS; s++) {
    await pg.waitForTimeout(1000);
    const v = await pg.evaluate(() => localStorage.getItem(CHAVE_JOGO) || '');
    const viva = v.includes('MINHA-SEMENTE');
    if (!viva && regravadoEm == null) regravadoEm = s;
    linha.push(s + 's:' + (viva ? 'semente' : 'REGRAVADO'));
  }
  console.log('  ' + linha.join(' | '));

  const falhas = [];
  if (regravadoEm != null) {
    falhas.push('o save REAL alcançou a semente aos ' + regravadoEm + 's — o agendamento está segurando a '
      + 'função por VALOR de novo. Conserto: setInterval(() => salvar(), 10000). Ver PENDENTES 71.');
  }
  if (erros.length) falhas.push('erros de console: ' + erros.join(' | '));

  console.log('\n' + (falhas.length
    ? 'DUBLÊ: FALHOU\n  ✗ ' + falhas.join('\n  ✗ ')
    : 'DUBLÊ: PASSOU — a semente sobreviveu aos ' + SEGUNDOS + ' s; o intervalo chama o estafeta.'));
  await nav.close();
  process.exit(falhas.length ? 1 : 0);
})();
