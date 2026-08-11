// OS CANTEIROS DA OBRA, olhados de verdade — o teste diz que não quebrou, não que dá vontade
// de voltar. Põe a partida na faixa final do capítulo 2, planta cada canteiro na frente da
// personagem e fotografa o MESMO canteiro em vários pontos da própria construção.
//
// Duas coisas que este instrumento existe para mostrar, e nenhuma delas o smoke pega:
//   1. cada parcela debitada acrescenta UMA unidade visível — o desenho É o progresso;
//   2. a silhueta dos três fica abaixo da protagonista (44 px de mundo) e larga, nunca a
//      silhueta baixa e móvel dos itens.
//
// node test/prints-obra.js [index.html]
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
const ARQ = process.argv[2] || path.resolve(__dirname, '..', 'index.html');

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(ABRIR('file://' + path.resolve(ARQ)));
  await page.waitForTimeout(900);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(900);

  // a faixa final do capítulo 2, com gente vivendo ali
  await page.evaluate(() => {
    fecharTelas(); fecharTudo();
    const c0 = cenarioDaEpoca(CAP_GENTE);
    S.cenario = c0;
    S.energiaTotal = LIMIAR_CENA * c0 + LIMIAR_CENA * EPOCAS[CAP_GENTE].cenas * 0.9;
    S.energia = 1e6; S.u1 = true; S.u2 = true;
    S.aberturas = MASCARA_EPOCAS; S.marcos = MASCARA_MARCOS;
    S.acolhidos = S.acolhidos.map(() => 0); S.acolhidos[CAP_GENTE] = 12;
    verificarCenario = function () {};
    redesenharFundo();
  });
  await page.waitForTimeout(700);

  // Um canteiro por vez, plantado exatamente onde a personagem o vê, com o mundo PARADO — é o
  // mesmo que a pessoa vê quando segura o dedo, porque segurar para a personagem.
  async function posar(tipo, pontos, nome) {
    const dados = await page.evaluate(function (a) {
      mobs.length = 0; drops.length = 0; floats.length = 0; parts.length = 0; folhas.length = 0;
      S.obra = { roca: 0, palicada: 0, casa: 0 };
      S.obra[a.tipo] = a.pontos;
      canteiros.length = 0;
      canteiros.push({ tipo: a.tipo, wx: worldX + HX + 18 });
      desenhar();
      // a altura da silhueta, medida no canvas do mundo: quantas linhas de pixel acima do chão
      // o canteiro ocupa. A régua é a protagonista, 44 px de mundo.
      const cvs = document.getElementById('scene');
      const g = cvs.getContext('2d');
      const sx = Math.round(canteiros[0].wx - worldX);
      const larg = OBRA_LARGURA[a.tipo];
      const im = g.getImageData(sx * (cvs.width / W), (GROUND - 48) * (cvs.height / H),
        Math.round(larg * (cvs.width / W)), Math.round(48 * (cvs.height / H)));
      let topo = -1;
      for (let y = 0; y < im.height && topo < 0; y++) {
        for (let x = 0; x < im.width; x++) { if (im.data[(y * im.width + x) * 4 + 3] > 8) { topo = y; break; } }
      }
      return { unidades: unidadesObra(a.tipo), estagio: estagioObra(a.tipo),
        altura: topo < 0 ? 0 : Math.round((im.height - topo) / (cvs.height / H)) };
    }, { tipo: tipo, pontos: pontos });
    await page.screenshot({ path: path.join(__dirname, nome) });
    console.log(nome.padEnd(30), tipo.padEnd(9), 'pontos', String(pontos).padEnd(4),
      'unidades', String(dados.unidades).padEnd(3), 'estágio', dados.estagio,
      '| altura da silhueta', dados.altura, 'px de mundo (a protagonista tem 44)');
  }

  for (const t of ['roca', 'palicada', 'casa']) {
    await posar(t, 30, 'OBRA-' + t + '-1-comecando.png');    // metade do E1
    await posar(t, 60, 'OBRA-' + t + '-2-estagio1.png');     // E1 completo
    await posar(t, 120, 'OBRA-' + t + '-3-estagio2.png');    // E2 completo
    await posar(t, 180, 'OBRA-' + t + '-4-pronto.png');      // tudo de pé
  }

  // ...e o GESTO, do jeito que o dedo o faz: a microdica antes, e a personagem parada na pose
  // de quem segura enquanto a obra sobe. Estes dois são os prints que dizem se dá vontade.
  await page.evaluate(() => {
    mobs.length = 0; drops.length = 0; floats.length = 0; parts.length = 0;
    S.obra = { roca: 0, palicada: 0, casa: 0 };
    S.recursos = { flor: 200, agua: 200, refeicao: 200 };
    dicaObraVista = false; dicaObraAte = 0;
    canteiros.length = 0; canteiros.push({ tipo: 'palicada', wx: worldX + HX + 24 });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(__dirname, 'OBRA-5-microdica.png') });
  console.log('OBRA-5-microdica.png            a linha que ensina o gesto, uma vez por sessão');

  const cv = await page.evaluate(() => {
    const b = document.getElementById('scene').getBoundingClientRect();
    return { x: b.left + b.width * 0.5, y: b.top + b.height * 0.5 };
  });
  await page.mouse.move(cv.x, cv.y);
  await page.mouse.down();
  await page.waitForTimeout(10400);            // 10 s de dedo = a primeira parcela debitada
  await page.screenshot({ path: path.join(__dirname, 'OBRA-6-trabalhando.png') });
  const trab = await page.evaluate(() => ({
    obra: S.obra.palicada, rec: JSON.stringify(S.recursos), trabalhando: obraTrabalhando,
    andou: Math.round(worldX)
  }));
  await page.mouse.up();
  console.log('OBRA-6-trabalhando.png          10 s de dedo ->', JSON.stringify(trab));

  // ...e a TELA DE RETORNO com o que o mutirão ergueu durante a noite. É a superfície pela qual
  // o "fica evoluindo com o tempo" chega a quem voltou, e ela não pode carregar um dígito.
  await page.evaluate(() => {
    salvar = function () {}; salvarRetencao = function () {};
    localStorage.setItem(CHAVE_JOGO, JSON.stringify({
      energia: 500, energiaTotal: 5800, cenario: 3, arco: ARCO_ATUAL, modo: 'limpo',
      cuidado: 0.9, som: false, aberturas: MASCARA_EPOCAS, fechos: 0, grupo: 3,
      acolhidos: [4, 26, 0, 0], marcos: 7, obra: { roca: 0, palicada: 0, casa: 0 },
      recursos: { flor: 60, agua: 70, refeicao: 90 },
      salvoEm: Date.now() - 11 * 3600 * 1000
    }));
    const ontem = new Date(Date.now() - 864e5);
    const chave = ontem.getFullYear() + '-' + String(ontem.getMonth() + 1).padStart(2, '0')
      + '-' + String(ontem.getDate()).padStart(2, '0');
    localStorage.setItem(CHAVE_RET, JSON.stringify({ dias: 2, primeiro: chave, ultimo: chave,
      segundos: 900, tochas: 0, historia: 0, toqEsq: 0, toqDir: 0 }));
  });
  await page.reload();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'OBRA-7-retorno.png') });
  const volta = await page.evaluate(() => ({
    linhas: Array.from(document.querySelectorAll('#retorno .retLinha')).map(d => d.textContent),
    obra: JSON.stringify(S.obra), rec: JSON.stringify(S.recursos)
  }));
  console.log('OBRA-7-retorno.png              obra depois da noite:', volta.obra, '| sobrou:', volta.rec);
  volta.linhas.forEach(l => console.log('   | ' + l));
  const comDigito = volta.linhas.filter(l => /\d/.test(l) && !/^Você ficou fora|^Dia |pessoas/.test(l));
  console.log('   linhas da obra com dígito:', comDigito.length, comDigito.join(' / '));
  await browser.close();
})();
