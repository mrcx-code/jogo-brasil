// QA · O VERBO E A FALA — o lado que o bloco 5 do `encaixe.js` deixou de cobrir (05/09).
//
//   node test/qa-verbo-e-fala.js          → 0 se passou, 1 na primeira falha
//   QA_SEM_FRASE=<id> node ...            → apaga a abertura daquele capítulo antes de medir,
//                                           para provar que este instrumento REPROVA (lição 2.8)
//
// ================================ POR QUE ELE EXISTE ================================
//
// O bloco 5 do `encaixe.js` cruza a FALA de um capítulo com o MOTOR dele. Em 05/09 ele passou
// a perguntar ao motor de verdade (`capFila()`/`capPalavra()`) em vez de a duas constantes
// congeladas em 16/08 — e no mesmo movimento trocou IGUALDADE por IMPLICAÇÃO:
//
//     promessa ⇒ motor      ("quem promete ACOLHER tem a fila de verdade")
//
// A troca está certa e foi medida: com IGUALDADE o portão reprova **10** capítulos (medido
// nesta sessão, duas corridas, mesmas 10) que TÊM o motor e nomeiam o gesto no idioma deles —
// O CAIS "juntar gente na pedra", JABAQUARA "abrir caminho", A PEQUENA ÁFRICA "guardar o
// lugar". Cobrar deles a frase-molde de PALMARES/SALVADOR reprovaria vocabulário, não dívida.
//
// **Mas a implicação morde num sentido só, e o preço tem número.** As duas expressões que
// disparam o antecedente ("alcançar é acolher|vem ficar|passa a andar com você" e "levar
// palavra|passa a saber") só aparecem em DOIS capítulos: PALMARES e SALVADOR. Então, dos
// treze capítulos, o bloco 5 guarda **2**; nos outros **10 que têm motor** a asserção passa a
// VAZIO — o antecedente é falso e ela é verdadeira sem olhar para nada.
//
// Medido por injeção: mover JABAQUARA de `CAP_FILA` para `CAPS_VERBO` (a mão troca de gesto e
// a abertura continua dizendo "alcançar é abrir caminho... o da roça, para quem já chegou")
// **não faz o bloco 5 piscar** — e o censo do bloco 32 também não, porque lá o capítulo
// continua "tendo verbo", só que o outro.
//
// Este arquivo fecha esse buraco sem reprovar vocabulário, e o jeito é o mesmo que o bloco 32
// usa para os capítulos sem verbo: **um registro NOMINAL**. Cada capítulo com motor declara,
// pelo id, a frase com que a abertura dele nomeia o gesto — e de que FAMÍLIA é esse gesto.
// Capítulo novo passa a exigir uma linha aqui, o que é uma decisão visível no diff, não um
// silêncio. Trocar o motor de família sem trocar a fala passa a reprovar por nome.
//
// ================================ COMO ELE MEDE ================================
//
// No jogo vivo, nunca no código-fonte. A época é simulada como no censo do bloco 32
// (`S.cenario = cenarioDaEpoca(i)`, pergunta, restaura) — e a primeira coisa que este arquivo
// faz é **medir a própria simulação**: contra o modelo puro (`CAP_FILA.indexOf(i)`, sem tocar
// em `S`), contra TODAS as cenas da época e não só a primeira, com o resto do estado sujo, e
// conferindo que `S` volta byte a byte ao que era.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');

// ===== O REGISTRO NOMINAL =====
// id do capítulo → { familia, frase }
//   familia: 'fila'   → a mão FORMA FILA (o gesto de PALMARES/JABAQUARA)
//            'verbo'  → a mão LEVA PALAVRA (o gesto de SALVADOR/AS PORTAS)
//   frase:   um pedaço LITERAL da abertura em que aquele capítulo nomeia o gesto, no idioma
//            dele. É a única coisa que este arquivo cobra do texto — nunca uma frase-molde.
// Capítulo sem motor não entra aqui. Capítulo que ganhar motor entra, ou este teste reprova.
const REGISTRO = {
  pindorama:     { familia: 'fila',  frase: 'Alcance quem puder' },
  palmares:      { familia: 'fila',  frase: 'alcançar é acolher' },
  cais:          { familia: 'fila',  frase: 'alcançar é juntar gente na pedra' },
  jabaquara:     { familia: 'fila',  frase: 'alcançar é abrir caminho' },
  pequenaafrica: { familia: 'fila',  frase: 'alcançar é guardar o lugar' },
  salvador:      { familia: 'verbo', frase: 'levar palavra' },
  portas:        { familia: 'verbo', frase: 'alcançar é abrir a porta' },
  naodito:       { familia: 'verbo', frase: 'alcançar é fazer passar' },
  praca:         { familia: 'verbo', frase: 'alcançar é juntar' },
  segurou:       { familia: 'verbo', frase: 'chegar na última casa' },
  aceiro:        { familia: 'verbo', frase: 'este capítulo é esse verbo' },
  temfonte:      { familia: 'verbo', frase: 'o verbo daqui é conferir' }
};

let falhas = 0;
function ok(cond, txt) {
  console.log((cond ? '  ok   ' : '  FALHA ') + txt);
  if (!cond) falhas++;
}
const log = (...a) => console.log(...a);
const sec = t => log('\n---- ' + t);

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return p;
  return ABRIR('file://' + path.resolve(__dirname, '..', p || 'index.html'));
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  await page.goto(alvo());
  await page.waitForFunction(() => typeof EPOCAS !== 'undefined' && typeof capFila === 'function', null, { timeout: 20000 });

  // O DEFEITO DE PROPÓSITO (lição 2.8): apagar a abertura de um capítulo com motor tem de
  // fazer este arquivo sair 1. Sem isto ele seria decoração.
  const semFrase = process.env.QA_SEM_FRASE || '';
  if (semFrase) {
    const apagou = await page.evaluate((id) => {
      const e = EPOCAS.find(x => x.id === id);
      if (!e) return false;
      e.abertura = ['(abertura apagada pelo QA para provar que este teste reprova)'];
      return true;
    }, semFrase);
    log('   DEFEITO INJETADO: abertura de "' + semFrase + '" apagada em memória — ' +
      (apagou ? 'ok' : 'ID NÃO EXISTE (o defeito não entrou; isto por si só é falha)'));
    if (!apagou) falhas++;
  }

  const m = await page.evaluate(() => {
    const snapAntes = JSON.stringify(S);
    const cenarioAntes = S.cenario;
    const caps = EPOCAS.map(function (e, i) {
      // modelo puro: as listas, sem tocar em S
      const modeloFila = CAP_FILA.indexOf(i) >= 0;
      const modeloVerbo = CAPS_VERBO.indexOf(i) >= 0;
      // a simulação: primeira cena da época
      let g = S.cenario;
      S.cenario = cenarioDaEpoca(i);
      const simFila = capFila(), simVerbo = capPalavra();
      S.cenario = g;
      // todas as cenas da época — a época é uma FAIXA de cenas, e o bloco 5 só olha a primeira
      let estavel = true;
      const c0 = cenarioDaEpoca(i);
      for (let c = c0; c < c0 + (e.cenas | 0); c++) {
        g = S.cenario; S.cenario = c;
        if (capFila() !== simFila || capPalavra() !== simVerbo) estavel = false;
        S.cenario = g;
      }
      return { i, id: e.id, nome: e.nome, modeloFila, modeloVerbo, simFila, simVerbo, estavel,
        abertura: (e.abertura || []).join(' ') };
    });
    // o resto do estado SUJO: se o verbo dependesse de mais que S.cenario, isto divergiria
    const gd = { ac: S.acolhidos, u1: S.u1, u2: S.u2, u3: S.u3, u4: S.u4, cen: S.cenario };
    let sujo;
    try {
      S.acolhidos = {}; S.u1 = 9; S.u2 = 9; S.u3 = 9; S.u4 = 1;
      sujo = EPOCAS.map(function (e, i) {
        const g = S.cenario; S.cenario = cenarioDaEpoca(i);
        const v = { fila: capFila(), verbo: capPalavra() };
        S.cenario = g; return v;
      });
    } finally {
      S.acolhidos = gd.ac; S.u1 = gd.u1; S.u2 = gd.u2; S.u3 = gd.u3; S.u4 = gd.u4; S.cenario = gd.cen;
    }
    return { caps, sujo, cenarioVoltou: S.cenario === cenarioAntes,
      estadoIntacto: JSON.stringify(S) === snapAntes };
  });

  // ============================================================
  // 1 · A SIMULAÇÃO É FIEL — antes de acreditar no que ela diz
  //
  // O bloco 5 e o censo do bloco 32 afirmam sobre o motor de um capítulo sem ENTRAR nele:
  // apontam `S.cenario` para a primeira cena da época e perguntam. Se `capFila()` dependesse
  // de mais estado que `S.cenario`, os dois passariam a falar de um motor que também não
  // existe — pelo outro caminho. Isto mede exatamente essa suposição.
  // ============================================================
  sec('1 · a simulação de época reproduz o motor de verdade');
  let divSim = 0, instaveis = 0, divSujo = 0;
  m.caps.forEach(function (c, i) {
    if (c.simFila !== c.modeloFila || c.simVerbo !== c.modeloVerbo) divSim++;
    if (!c.estavel) instaveis++;
    if (m.sujo[i].fila !== c.simFila || m.sujo[i].verbo !== c.simVerbo) divSujo++;
  });
  ok(divSim === 0, 'a simulação (S.cenario = cenarioDaEpoca) concorda com o modelo puro em ' +
    m.caps.length + ' capítulos — divergências: ' + divSim);
  ok(instaveis === 0, 'o verbo é o mesmo em TODAS as cenas de cada época, não só na primeira — ' +
    'épocas instáveis: ' + instaveis);
  ok(divSujo === 0, 'o verbo não muda com o resto do estado sujo (acolhidos, upgrades) — ' +
    'divergências: ' + divSujo);
  ok(m.cenarioVoltou, 'a simulação devolve S.cenario ao que era');
  ok(m.estadoIntacto, 'e não deixa mais nada mexido em S (comparado byte a byte)');

  // ============================================================
  // 2 · TODO CAPÍTULO COM MOTOR NOMEIA O GESTO — no idioma dele
  //
  // Este é o sentido que a implicação do bloco 5 abandonou. Aqui ele volta sem cobrar
  // frase-molde: cada capítulo declara a SUA frase no registro acima.
  // ============================================================
  sec('2 · todo capítulo com motor nomeia o gesto na abertura (idioma próprio, registro nominal)');
  m.caps.forEach(function (c) {
    const temMotor = c.simFila || c.simVerbo;
    const reg = REGISTRO[c.id];
    log('   ' + c.nome.padEnd(24) + ' motor[fila ' + c.simFila + ' verbo ' + c.simVerbo + ']' +
      ' registro ' + (reg ? reg.familia + ' · "' + reg.frase + '"' : '—'));
    if (temMotor) {
      ok(!!reg, c.nome + ': tem motor e está no registro — capítulo novo com verbo exige uma linha aqui');
      if (reg) {
        ok(c.abertura.indexOf(reg.frase) >= 0,
          c.nome + ': a abertura nomeia o gesto ("' + reg.frase + '")');
        const familiaMedida = c.simFila ? 'fila' : 'verbo';
        ok(reg.familia === familiaMedida,
          c.nome + ': a família registrada é a que a mão faz (registro ' + reg.familia +
          ' · motor ' + familiaMedida + ')');
      }
    } else {
      ok(!reg, c.nome + ': não tem motor, então não pode estar no registro — ' +
        'registro que sobra é fala prometendo o que a mão não faz');
    }
  });

  // ============================================================
  // 3 · UM CAPÍTULO NÃO ESTÁ NAS DUAS FAMÍLIAS AO MESMO TEMPO
  //
  // `pessoaNaRua()` é `capFila() || capPalavra()`, e o desenho de quem atravessa a tela
  // pergunta a ela. Se um id entrasse nas duas listas, o gesto ficaria indefinido e nenhum
  // portão diria nada.
  // ============================================================
  sec('3 · nenhum capítulo está em CAP_FILA e CAPS_VERBO ao mesmo tempo');
  const duplos = m.caps.filter(c => c.simFila && c.simVerbo).map(c => c.nome);
  ok(duplos.length === 0, 'nenhum capítulo tem as duas famílias' +
    (duplos.length ? ' — TEM: ' + duplos.join(', ') : ''));

  sec('ERROS DE CONSOLE');
  if (erros.length) { erros.forEach(e => log('   ' + e)); falhas += erros.length; }
  else log('(nenhum)');

  await browser.close();
  log(falhas ? '\nFALHOU em ' + falhas + ' asserção(ões)' : '\nPASSOU');
  process.exit(falhas ? 1 : 0);
})();
