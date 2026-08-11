// ACOLHER — a medição que decide se o gesto de PALMARES deixou de ser o de bater.
//
//   node test/medir-acolher.js [segundos]
//
// Irmão do `medir-acompanhar.js` (SALVADOR), com as mesmas três perguntas, porque a dívida
// era a mesma e a régua tem de ser a mesma:
//   1. QUANTOS TOQUES POR PESSOA. Em PALMARES era `m.hp -= dmg` com hp 5/8/13 — de 5 a 13
//      toques até alguém "ser acolhida", que é a forma de bater por baixo com nome novo por
//      cima. Tem de ser 1.
//   2. QUANTAS FICAM. Acolhidas por minuto e fração de quem chegou — o número que o Diário
//      de 2026-08-06 gravou (andando 1,00 · correndo 0,68) e que esta mudança não pode
//      derrubar.
//   3. A RENDA NÃO PODE MUDAR. Contrato da casa: mecânica nova não mexe na economia sem
//      medição antes/depois. ±10% em impacto por minuto.
//
// O dedo simulado SEGURA: um toque a cada 145 ms, que é o que o botão dourado repete e o
// jeito dominante de jogar (a medição de 2026-08-06 foi feita segurando).
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const SEG = +(process.argv[2] || 60);

function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return p;
  return ABRIR('file://' + path.resolve(__dirname, '..', p || 'index.html'));
}

async function celula(pg, nome, modo) {
  const r = await pg.evaluate(async ([segundos, modo]) => {
    localStorage.clear();
    fecharTelas(); fecharTudo();
    S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.marcos = MASCARA_MARCOS;
    // PALMARES por IDENTIDADE, nunca por posição — `CAP_GENTE` é o próprio motor dizendo
    // qual capítulo tem fila (a lição do `medir-acompanhar.js`).
    const c0 = cenarioDaEpoca(CAP_GENTE);
    S.cenario = c0; S.fronteira = c0; visitando = false;
    S.energiaTotal = LIMIAR_CENA * c0; S.energia = 0;
    S.u1 = false; S.u2 = false; S.u3 = false; S.u4 = false;
    S.recursos = { flor: 0, agua: 0, refeicao: 0 };
    S.grupo = 0; grupo.length = 0; ficando.length = 0; moradores.length = 0;
    S.acolhidos = S.acolhidos.map(function () { return 0; });
    mobs.length = 0; drops.length = 0; floats.length = 0; folhas.length = 0;
    mobChao = 0; proximoMob = -1;
    S.modo = modo;
    // instrumentação: o capítulo não vira no meio da célula (mesma neutralização do
    // medir-poluicao.js — nada disto toca o jogo)
    verificarCenario = function () {};

    // quem chegou e quem foi alcançada, pela porta por onde o mundo já conta
    let chegou = 0, alcancou = 0, acolhidas = 0;
    const regOriginal = window.registrarChegada;
    window.registrarChegada = function (a) { chegou++; if (a) alcancou++; return regOriginal.apply(null, arguments); };
    const acolherOriginal = window.acolherPessoa;
    window.acolherPessoa = function () { acolhidas++; return acolherOriginal.apply(null, arguments); };

    // O CENSO DE TOQUES. Não é soma: quero quantas vezes a MESMA pessoa foi tocada, e só
    // conta o toque que FEZ alguma coisa — o que baixa hp (jeito velho) ou o que abre o
    // acolhimento (jeito novo). Toque que cai enquanto o acolhimento já corre não faz nada
    // e mediria a mão do bot, não a mecânica.
    let toques = 0, uteis = 0, seq = 0;
    const porPessoa = new Map();
    const clicarOriginal = window.clicar;
    window.clicar = function (auto) {
      let perto = null, d = 1e9;
      if (!auto) {
        toques++;
        mobs.forEach(function (m) {
          if (m.dying > 0 || m.dead || m.hp <= 0) return;
          const sx = m.wx - worldX;
          if (sx > HX - 6 && sx < HX + 96 && sx < d) { d = sx; perto = m; }
        });
      }
      const hpAntes = perto ? perto.hp : 0, acAntes = perto ? (perto.acolhida || 0) : 0;
      const saida = clicarOriginal.apply(null, arguments);
      if (perto) {
        const mexeu = perto.hp < hpAntes || (perto.acolhida || 0) > acAntes;
        if (mexeu) {
          if (!perto.__id) { perto.__id = ++seq; }
          porPessoa.set(perto.__id, (porPessoa.get(perto.__id) || 0) + 1);
          uteis++;
        }
      }
      return saida;
    };

    const e0 = S.energiaTotal, t0 = performance.now();
    let ultimo = 0;
    await new Promise(function (resolve) {
      const laco = setInterval(function () {
        const t = (performance.now() - t0) / 1000;
        if (t >= segundos) { clearInterval(laco); resolve(null); return; }
        if (t - ultimo >= 0.145) { ultimo = t; window.clicar(false); }   // o botão dourado segurado
      }, 16);
    });
    window.clicar = clicarOriginal;
    window.registrarChegada = regOriginal;
    window.acolherPessoa = acolherOriginal;

    const min = (performance.now() - t0) / 60000;
    const contagens = [...porPessoa.values()];
    const soma = contagens.reduce(function (a, b) { return a + b; }, 0);
    return {
      impactoMin: Math.round((S.energiaTotal - e0) / min),
      // O IMPACTO POR TOQUE é a comparação honesta, e a primeira leitura desta medida quase
      // enganou: o bot bate por `setInterval` e, com a máquina carregada, ele dá menos toques
      // no mesmo minuto — o impacto/min variou 19% entre duas rodadas do MESMO código. Toque
      // é a maior parte da renda; normalizar por ele separa a mecânica da carga da máquina.
      toquesMin: Math.round(toques / min),
      impactoPorToque: +((S.energiaTotal - e0) / Math.max(1, toques)).toFixed(2),
      chegadasMin: +(chegou / min).toFixed(1),
      acolhidasMin: +(acolhidas / min).toFixed(1),
      fracao: +(alcancou / Math.max(1, chegou)).toFixed(2),
      toques: toques, uteis: uteis,
      pessoas: contagens.length,
      toquesPorPessoa: contagens.length ? +(soma / contagens.length).toFixed(2) : 0,
      pior: contagens.length ? Math.max.apply(null, contagens) : 0,
      recursos: S.recursos.flor + S.recursos.agua + S.recursos.refeicao
    };
  }, [SEG, modo]);
  console.log('  ' + nome.padEnd(10) +
    'impacto/min ' + String(r.impactoMin).padStart(5) +
    ' (' + r.toquesMin + ' toques, ' + r.impactoPorToque + '/toque)' +
    ' | chegadas/min ' + String(r.chegadasMin).padStart(5) +
    ' | acolhidas/min ' + String(r.acolhidasMin).padStart(5) +
    ' | fração ' + r.fracao.toFixed(2) +
    ' | toques ÚTEIS/pessoa ' + r.toquesPorPessoa + ' (pior ' + r.pior + ')' +
    ' | recursos ' + r.recursos);
  return r;
}

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  pg.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await pg.goto(alvo());
  await pg.waitForTimeout(1200);

  console.log('PALMARES, ' + SEG + ' s por célula, segurando (um toque a cada 145 ms):\n');
  const anda = await celula(pg, 'ANDANDO', 'limpo');
  const corre = await celula(pg, 'CORRENDO', 'carvao');

  console.log('\n--- 1 · a dívida de §2: quantos toques por pessoa ---');
  const pior = Math.max(anda.toquesPorPessoa, corre.toquesPorPessoa);
  console.log('  pior das duas células: ' + pior + ' (era 5 a 13, por `m.hp -= dmg`)');
  console.log(pior <= 1.35
    ? '  ✓ um toque acolhe, e é o único que a mão dá'
    : '  ✗ ainda são ' + pior + ' toques por pessoa — a forma do gesto continua a de bater');

  console.log('\n--- 2 · quantas ficam ---');
  console.log('  andando ' + anda.acolhidasMin + '/min (fração ' + anda.fracao + ')' +
    ' | correndo ' + corre.acolhidasMin + '/min (fração ' + corre.fracao + ')');
  console.log('  referência do Diário de 2026-08-06: andando 28/min fração 1,00 · correndo 56×0,68 ≈ 38/min');

  console.log('\n--- 3 · a renda mudou? (contrato: ±10%) ---');
  console.log('  impacto/min  andando ' + anda.impactoMin + ' | correndo ' + corre.impactoMin +
    '   (sensível ao ritmo do bot — ver abaixo)');
  console.log('  impacto/TOQUE andando ' + anda.impactoPorToque + ' | correndo ' + corre.impactoPorToque +
    '   ← é este que compara antes com depois');

  console.log('\nerros de console: ' + (erros.length ? erros[0] : '(nenhum)'));
  await nav.close();
  process.exit(erros.length ? 1 : 0);
})();
