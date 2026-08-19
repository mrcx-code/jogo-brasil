// QUANTO TEMPO LEVA PARA ATRAVESSAR OS TREZE CAPÍTULOS (19/08).
//
// A PERGUNTA QUE ISTO RESPONDE, e ela é a do repositório: o jogo existe para descobrir se o laço
// segura alguém por TRÊS DIAS. Só que ninguém nunca mediu quanto tempo o arco leva — e sem esse
// número a pergunta não tem como ser respondida nem por acaso. Se o arco inteiro couber em vinte
// minutos, não há terceiro dia possível; se levar dez horas, o terceiro dia é o quinto.
//
// A CURVA É LINEAR, e isso surpreende quem vem do outro projeto: `LIMIAR_CENA = 1500` por cena,
// dezesseis cenas, `LIMIAR_FIM = 24.000` de impacto acumulado. Não há `1,15^n` aqui. Então a
// pergunta "a curva de custo aguenta três dias?" vira uma pergunta de RENDA: quanto se ganha por
// minuto, e como isso muda ao longo do caminho.
//
// COMO ELE MEDE, e por que não joga 40 minutos de verdade: medir o arco em tempo real seria um
// instrumento que ninguém roda. Ele mede a RENDA REAL em janelas curtas, em pontos diferentes da
// curva, com o estado que um jogador teria ali — e integra. Cada renda é medida jogando de
// verdade, com toque, no jogo construído; o que é simulado é só a soma.
//
// TRÊS ESTILOS, porque o arco tem duração diferente para cada um e a média esconderia isso:
//   · TOCANDO   — só o botão dourado, sem comprar nada. O primeiro dia de quem não abriu o menu.
//   · COMPRANDO — compra `u1`, `u2` e `u3` assim que dá. O jogador que entendeu o laço.
//   · SEGURANDO — mantém o dedo no botão, que repete a ~7 golpes/s, e compra tudo.
//
// O QUE ELE NÃO MEDE, e é honesto dizer: o tempo que a pessoa passa LENDO. Treze aberturas e
// treze fechos, mais a travessia — o instrumento pula tudo, porque medir leitura de gente exige
// gente. O número que sai é o CHÃO: o arco nunca é mais rápido que isto.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));
const JANELA = Number(process.argv[2] || 20);   // segundos de medição por ponto

const ESTILOS = [
  { id: 'tocando',   rot: 'só tocando, sem comprar', compra: false, segura: false },
  { id: 'comprando', rot: 'comprando as melhorias',  compra: true,  segura: false },
  { id: 'segurando', rot: 'segurando o botão',       compra: true,  segura: true  },
];

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(ALVO);
  await pg.waitForTimeout(2000);

  const mundo = await pg.evaluate(() => ({
    limiar: LIMIAR_CENA, fim: LIMIAR_FIM, cenas: TOTAL_CENAS,
    caps: EPOCAS.map((e, i) => ({ nome: e.nome, cenas: e.cenas, ini: LIMIAR_CENA * cenarioDaEpoca(i) })),
    custos: [CFG.custoU1, CFG.custoU2, CFG.custoU3],
  }));
  console.log('O MUNDO: ' + mundo.cenas + ' cenas × ' + mundo.limiar + ' de impacto = ' + mundo.fim +
    ' até o fim · melhorias custam ' + mundo.custos.join(' / '));
  console.log('janela de medição: ' + JANELA + ' s por ponto\n');

  // ===== A RENDA, medida no jogo de verdade =====
  // Mede-se em três pontos da curva porque a renda MUDA: as melhorias multiplicam o toque, e a
  // ajuda automática (`u3`) rende sozinha. Medir só o começo daria um arco fantasiosamente longo.
  const PONTOS = [0, 8000, 20000];
  const renda = {};
  for (const est of ESTILOS) {
    renda[est.id] = [];
    for (const ponto of PONTOS) {
      const antes = await pg.evaluate(([p, compra]) => {
        localStorage.clear(); fecharTelas(); fecharTudo(); pararFala();
        S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.travessias = 1;
        S.energiaTotal = p; S.cenario = Math.min(TOTAL_CENAS - 1, Math.floor(p / LIMIAR_CENA));
        S.fronteira = S.cenario;
        // O ESTADO QUE UM JOGADOR TERIA AQUI. Comprar é o que separa os estilos, e o preço sai
        // do bolso: quem compra chega ao ponto com menos energia guardada, e isso é fiel.
        S.u1 = S.u2 = S.u3 = false; S.u4 = false;
        S.energia = p;
        if (compra) {
          if (p >= CFG.custoU1) { S.u1 = true; S.energia -= CFG.custoU1; }
          if (p >= CFG.custoU2) { S.u2 = true; S.energia -= CFG.custoU2; }
          if (p >= CFG.custoU3) { S.u3 = true; S.energia -= CFG.custoU3; }
        }
        return { total: S.energiaTotal, ganho: ganhoClique() };
      }, [ponto, est.compra]);

      // FECHAR DEPOIS DE SEMEAR, E FECHAR AS DUAS COISAS — custou duas rodadas inteiras de zeros.
      // São DOIS fechamentos com nomes parecidos e eu chamava só um: "fecharTudo" fecha as
      // BANDEJAS (melhorias, nichos) e "fecharTelas" fecha as TELAS. Semear o cenário faz o jogo
      // abrir a cerimônia do capítulo no quadro seguinte; com ela aberta o toque é engolido, a
      // renda mede zero nos nove pontos, e o instrumento anuncia um arco de 400 horas.
      //
      // O QUE RESOLVEU NÃO FOI OUTRO PALPITE. As duas primeiras tentativas foram consertos no
      // escuro e as duas falharam. A terceira coisa que fiz foi IMPRIMIR o estado — 15 toques,
      // delta zero, ".tela.aberta" ainda true — e a causa apareceu na primeira linha. Medir o
      // instrumento custa um minuto; adivinhar custou duas rodadas.
      await pg.waitForTimeout(900);
      await pg.evaluate(() => { fecharTelas(); fecharTudo(); pararFala(); });
      await pg.waitForTimeout(400);
      const t0 = Date.now();
      if (est.segura) {
        // segurar o botão dourado: o motor repete a ~7 golpes/s enquanto o ponteiro estiver preso
        const cx = await pg.evaluate(() => { const b = document.getElementById('btnClique');
          const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
        await pg.touchscreen.tap(cx.x, cx.y);
        await pg.mouse.move(cx.x, cx.y); await pg.mouse.down();
        await pg.waitForTimeout(JANELA * 1000);
        await pg.mouse.up();
      } else {
        while (Date.now() - t0 < JANELA * 1000) { await pg.touchscreen.tap(300, 500); await pg.waitForTimeout(140); }
      }
      const dep = await pg.evaluate(() => ({ total: S.energiaTotal }));
      const seg = (Date.now() - t0) / 1000;
      const porMin = (dep.total - antes.total) / seg * 60;
      renda[est.id].push({ ponto, porMin, ganho: antes.ganho });
    }
    console.log(est.rot.padEnd(28) + renda[est.id].map(r =>
      'em ' + String(r.ponto).padStart(5) + ': ' + Math.round(r.porMin).toString().padStart(5) + '/min').join(' · '));
  }

  // ===== A INTEGRAÇÃO — quanto tempo até cada capítulo =====
  // A renda entre dois pontos medidos é interpolada linearmente. É aproximação, e é dita: o
  // número exato exigiria jogar o arco inteiro, que é justamente o que ninguém faz.
  const rendaEm = (est, x) => {
    const p = renda[est];
    if (x <= p[0].ponto) return p[0].porMin;
    for (let i = 1; i < p.length; i++) {
      if (x <= p[i].ponto) {
        const f = (x - p[i - 1].ponto) / (p[i].ponto - p[i - 1].ponto);
        return p[i - 1].porMin + f * (p[i].porMin - p[i - 1].porMin);
      }
    }
    return p[p.length - 1].porMin;
  };
  const tempoAte = (est, alvo) => {
    let t = 0, x = 0;
    const passo = 100;
    while (x < alvo) { const r = Math.max(1, rendaEm(est, x)); t += passo / r; x += passo; }
    return t;   // minutos
  };

  console.log('\n=== QUANTO TEMPO ATÉ CADA CAPÍTULO (minutos de jogo, sem contar leitura) ===');
  console.log('capítulo'.padEnd(26) + 'impacto' + ESTILOS.map(e => ('  ' + e.id).padStart(12)).join(''));
  mundo.caps.forEach(c => {
    console.log(c.nome.padEnd(26) + String(c.ini).padStart(6) +
      ESTILOS.map(e => {
        const m = tempoAte(e.id, c.ini);
        return (m < 1 ? '—' : m < 90 ? Math.round(m) + ' min' : (m / 60).toFixed(1) + ' h').padStart(12);
      }).join(''));
  });
  console.log('\nO ARCO INTEIRO'.padEnd(26) + String(mundo.fim).padStart(6) +
    ESTILOS.map(e => {
      const m = tempoAte(e.id, mundo.fim);
      return (m < 90 ? Math.round(m) + ' min' : (m / 60).toFixed(1) + ' h').padStart(12);
    }).join(''));

  console.log('\nerros de console: ' + (erros.length ? erros[0] : '(nenhum)'));
  await nav.close();
})();
