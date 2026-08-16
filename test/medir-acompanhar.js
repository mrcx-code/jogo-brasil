// ACOMPANHAR — a medição que decide se a mecânica nova de SALVADOR vale.
//
//   node test/medir-acompanhar.js
//
// Três perguntas, e as três são número:
//   1. QUANTOS TOQUES POR PESSOA. Era 5 a 13 (`m.hp -= dmg`), que é a forma de bater por
//      baixo com nome novo por cima — a dívida de §2 declarada no cabeçalho do capítulo.
//      Tem de ser 1.
//   2. ANDAR × CORRER VIROU DECISÃO? O PM mediu que trocar de ritmo pagava +9%,
//      imperceptível. Se a conversa só anda andando, um bot que ALTERNA tem de atender
//      bem mais que um bot que só corre. Abaixo de +10% a proposta falhou e se reverte.
//   3. A RENDA NÃO PODE MUDAR. Contrato da casa: mecânica nova não mexe na economia sem
//      medição. ±10% em impacto por minuto.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const SEG = 60;

function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return p;
  return ABRIR('file://' + path.resolve(__dirname, '..', p || 'index.html'));
}

// Uma célula: prepara SALVADOR, roda `SEG` segundos com a estratégia dada, devolve os números.
async function celula(pg, nome, estrategia) {
  const r = await pg.evaluate(async ([segundos, modo]) => {
    // SALVADOR, do zero, sem tela nenhuma aberta
    localStorage.clear();
    fecharTelas(); fecharTudo();
    S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS;
    // POR IDENTIDADE, NUNCA POR POSIÇÃO (16/08). O 4 fixo era SALVADOR quando este arquivo
    // nasceu; O CAIS entrou na cronologia em 11/08 e empurrou SALVADOR para a cena 5 — e este
    // instrumento passou a medir O CAIS, um capítulo SEM a mecânica de conversa, em silêncio:
    // "7,58 toques/pessoa" e "atendidas 0" eram o capítulo errado, não uma regressão. É a
    // mesma família do bug de ARCOS/arteCap, e a cura é a mesma da casa.
    const cenaSalvador = cenarioDaEpoca(EPOCAS.findIndex(function (e) { return e.id === "salvador"; }));
    S.cenario = cenaSalvador; S.fronteira = cenaSalvador; visitando = false;
    S.energia = 0; S.energiaTotal = 0;
    S.u1 = false; S.u2 = false; S.u3 = false; S.u4 = false;
    S.recursos = { flor: 0, agua: 0, refeicao: 0 };
    mobs.length = 0; drops.length = 0; floats.length = 0;
    S.modo = 'limpo';

    // A CONTAGEM DE TOQUES POR PESSOA precisa de um censo, não de uma soma: quero saber
    // quantas vezes a MESMA pessoa foi tocada. Marco cada mob e conto por marca.
    let toques = 0, pessoas = 0, uteis = 0;
    const porPessoa = new Map();
    const clicarOriginal = window.clicar;
    let seq = 0;
    window.clicar = function (auto) {
      if (!auto) {
        toques++;
        // quem está ao alcance neste instante — a mesma régua do `clicar`
        let perto = null, d = 1e9;
        mobs.forEach(function (m) {
          if (m.dying > 0 || m.dead || m.hp <= 0 || m.sabe) return;
          const sx = m.wx - worldX;
          // 80, não 96: o alcance normal do jogo é 80 px (96 é só a quinta batida do combo).
          // Com 96 o wrapper contava como útil um toque na faixa 80–96 que o jogo NÃO
          // convertia — e a pessoa "custava 2 toques" por régua larga, não por mecânica.
          if (sx > HX - 6 && sx < HX + 80 && sx < d) { d = sx; perto = m; }
        });
        // SÓ CONTA O TOQUE QUE FAZ ALGUMA COISA. A primeira versão contava todo toque que
        // caísse com alguém ao alcance — inclusive os que o bot dá enquanto a conversa já
        // corre, que não fazem nada (o `if (!m.conversa)` os ignora). Isso media a mão do
        // bot, não a mecânica: dava 3,8 "toques por pessoa" num gesto que precisa de UM.
        // O que importa é quantos toques ÚTEIS uma pessoa custa.
        if (perto && !perto.conversa) {
          if (!perto.__id) { perto.__id = ++seq; pessoas++; }
          porPessoa.set(perto.__id, (porPessoa.get(perto.__id) || 0) + 1);
          uteis++;
        }
      }
      return clicarOriginal.apply(null, arguments);
    };

    const t0 = performance.now();
    let ultimoToque = 0, alternando = 0;
    await new Promise(function (resolve) {
      const laco = setInterval(function () {
        const t = (performance.now() - t0) / 1000;
        if (t >= segundos) { clearInterval(laco); resolve(null); return; }
        // toque a cada 250 ms — o dedo de alguém jogando de verdade, não segurando
        if (t - ultimoToque >= 0.25) {
          ultimoToque = t;
          window.clicar(false);
        }
        if (modo === 'corre') S.modo = 'carvao';
        else if (modo === 'anda') S.modo = 'limpo';
        else {
          // ALTERNA: corre até ter alguém ao alcance, anda enquanto conversa
          const conversando = mobs.some(function (m) { return m.conversa && !m.sabe; });
          S.modo = conversando ? 'limpo' : 'carvao';
          if (conversando) alternando++;
        }
      }, 16);
    });
    window.clicar = clicarOriginal;

    const contagens = [...porPessoa.values()];
    const soma = contagens.reduce(function (a, b) { return a + b; }, 0);
    return {
      impacto: Math.round(S.energiaTotal),
      // pela janela __acompanhar: `let` de topo de script nunca foi alcançável do evaluate —
      // o typeof antigo devolvia undefined SEMPRE, e o "atendidas 0" era só isso.
      atendidas: (window.__acompanhar ? window.__acompanhar().dedo : 0),
      correntes: (window.__acompanhar ? window.__acompanhar().corrente : 0),
      toques: toques, uteis: uteis,
      pessoasTocadas: contagens.length,
      toquesPorPessoa: contagens.length ? +(soma / contagens.length).toFixed(2) : 0,
      pior: contagens.length ? Math.max.apply(null, contagens) : 0
    };
  }, [SEG, estrategia]);
  console.log('  ' + nome.padEnd(22) +
    'impacto ' + String(r.impacto).padStart(6) +
    ' | atendidas pela mão ' + String(r.atendidas).padStart(3) +
    ' | toques ÚTEIS/pessoa ' + r.toquesPorPessoa + ' (pior ' + r.pior + ')' +
    ' | toques cegos ' + (r.toques - r.uteis));
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

  console.log('SALVADOR, ' + SEG + ' s por célula, um toque a cada 250 ms:\n');
  const anda = await celula(pg, 'só ANDANDO', 'anda');
  const corre = await celula(pg, 'só CORRENDO', 'corre');
  const alterna = await celula(pg, 'ALTERNANDO', 'alterna');

  console.log('\n--- 1 · a dívida de §2: quantos toques por pessoa ---');
  const pior = Math.max(anda.toquesPorPessoa, corre.toquesPorPessoa, alterna.toquesPorPessoa);
  console.log('  média nas três células: ' + pior + ' (era 5 a 13 por `m.hp -= dmg`)');
  console.log(pior <= 1.35
    ? '  ✓ um toque abre a conversa e é o único que a mão dá'
    : '  ✗ ainda são ' + pior + ' toques por pessoa — a forma do gesto continua a de bater');

  console.log('\n--- 2 · andar × correr virou decisão? ---');
  const base = Math.max(1, corre.atendidas);
  const ganho = Math.round((alterna.atendidas / base - 1) * 100);
  console.log('  correndo sempre: ' + corre.atendidas + ' atendidas | alternando: ' +
    alterna.atendidas + ' → ' + (ganho >= 0 ? '+' : '') + ganho + '%');
  console.log(ganho >= 25 ? '  ✓ o ritmo virou a decisão central do capítulo'
    : ganho >= 10 ? '  ~ mexe, mas fraco: era +9% antes, e a meta é +25%'
    : '  ✗ o ritmo continua não decidindo nada — a proposta falhou');

  console.log('\n--- 3 · a renda mudou? (contrato: ±10%) ---');
  const dif = Math.round((alterna.impacto / Math.max(1, corre.impacto) - 1) * 100);
  console.log('  impacto/min correndo ' + corre.impacto + ' × alternando ' + alterna.impacto +
    ' → ' + (dif >= 0 ? '+' : '') + dif + '%');

  console.log('\nerros de console: ' + (erros.length ? erros[0] : '(nenhum)'));
  await nav.close();
  process.exit(erros.length ? 1 : 0);
})();
