// A PROVA de que juntar as cores indistinguíveis não muda a tela.
//
//   node test/prova-cores.js gravar    fotografa o chrome ANTES (test/COR-antes-*.png)
//   node test/prova-cores.js conferir  refotografa e compara canal a canal
//
// Fotografa ELEMENTO por elemento, não a tela: o mundo anda atrás de tudo e o relógio do dia
// muda a luz, então dois prints de tela cheia em momentos diferentes divergem por motivo
// nenhum — foi o que atrapalhou a primeira tentativa de provar a limpeza das camadas de veio.
// Um elemento de chrome é parado por construção.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const DIR = __dirname;
const modo = process.argv[2] || 'gravar';
const ALVO = ABRIR('file:///' + path.resolve(DIR, '..', 'index.html').split(path.sep).join('/'));

// cada entrada: [nome, o que preparar na página, o seletor]
const PECAS = [
  ['menu-jogar', () => { fecharTelas(); abrirTela('telaMenu'); }, '#btnJogar'],
  ['menu-fontes', () => { fecharTelas(); abrirTela('telaMenu'); }, '#btnFontes'],
  ['cartao', () => { fecharTelas(); }, '#openUpgrades'],
  ['botao-ouro', () => { fecharTelas(); }, '#btnClique'],
  ['placar', () => { fecharTelas(); }, '#hudTop'],
  ['era', () => { fecharTelas(); montarCapitulos(); abrirTela('telaCapitulos'); }, '.capItem'],
  ['fonte-item', () => { fecharTelas(); montarFontes(); abrirTela('telaFontes'); }, '.fnItem'],
];

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  await pg.goto(ALVO);
  await pg.waitForTimeout(1300);
  // DUAS FONTES DE RUÍDO PRECISAM MORRER ANTES DE MEDIR COR, e a segunda custou uma
  // medição inteira: rodando o instrumento duas vezes SEM MUDANÇA NENHUMA, ele acusava
  // diferenças de 32 a 69 por canal. Não era a cor: era o GRÃO. As texturas `--veioPx`,
  // `--graoPx` e `--graoOuroPx` são geradas em runtime com sorteio, então cada carregamento
  // desenha um speckle diferente — e speckle é justamente o que um max-por-canal enxerga
  // melhor. Instrumento que não foi medido contra si mesmo não mede nada.
  await pg.evaluate(() => {
    relogio = DIA_SEG * 0.30;                       // a hora mexe na luz do chrome
    // e o placar pinta um NÚMERO: sem prender o impacto, a foto de agora tem outro dígito que
    // a de antes e a diferença sai 245 — que é preto contra papel, não cor contra cor.
    S.energia = 0; S.energiaTotal = 0; desenhar();
    // E O MUNDO SOME. Foto de elemento não recorta só o elemento: ela captura tudo o que foi
    // pintado naquele retângulo, inclusive a rua andando POR BAIXO das bordas e sob os véus
    // translúcidos das telas. Com as três camadas do mundo escondidas, o que sobra atrás do
    // chrome é uma cor chapada, e aí a medição é de COR e só de cor.
    ['scene', 'fundoHD', 'heroHD'].forEach(function (id) {
      const c = document.getElementById(id);
      if (c) c.style.visibility = 'hidden';
    });
    ['--veioPx', '--graoPx', '--graoOuroPx'].forEach(function (v) {
      document.documentElement.style.setProperty(v, 'none');
    });
  });

  let pior = 0, faltando = 0;
  for (const [nome, preparo, sel] of PECAS) {
    await pg.evaluate(preparo);
    await pg.waitForTimeout(420);
    const el = await pg.$(sel);
    if (!el) { console.log('  ' + nome.padEnd(12) + ' (elemento ausente)'); faltando++; continue; }
    const arq = path.join(DIR, 'COR-antes-' + nome + '.png');
    if (modo === 'gravar') {
      await el.screenshot({ path: arq });
      console.log('  ' + nome.padEnd(12) + ' gravado');
      continue;
    }
    if (!fs.existsSync(arq)) { console.log('  ' + nome.padEnd(12) + ' SEM foto anterior'); faltando++; continue; }
    const agora = await el.screenshot();
    const d = await pg.evaluate(async ([a, b]) => {
      const L = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
      const A = await L(a), B = await L(b);
      if (A.width !== B.width || A.height !== B.height) return -1;
      const cv = document.createElement('canvas'); cv.width = A.width; cv.height = A.height;
      const g = cv.getContext('2d');
      g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, cv.width, cv.height).data;
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, cv.width, cv.height).data;
      let max = 0;
      for (let i = 0; i < da.length; i += 4) for (let k = 0; k < 3; k++) {
        const v = Math.abs(da[i + k] - db[i + k]); if (v > max) max = v;
      }
      return max;
    }, ['data:image/png;base64,' + fs.readFileSync(arq).toString('base64'),
        'data:image/png;base64,' + agora.toString('base64')]);
    if (d < 0) { console.log('  ' + nome.padEnd(12) + ' TAMANHO MUDOU'); pior = 999; continue; }
    if (d > pior) pior = d;
    console.log('  ' + nome.padEnd(12) + ' diferença máxima por canal: ' + d);
  }
  await nav.close();
  if (modo === 'gravar') { console.log('\nFotos do ANTES gravadas. Aplique a mudança e rode `conferir`.'); return; }
  console.log(pior <= 2
    ? '\n✓ diferença máxima de ' + pior + ' em 255 — abaixo do que qualquer olho separa.'
    : '\n✗ diferença de ' + pior + ' — isso NÃO é indistinguível, confira o que mudou.');
  process.exit(pior <= 2 && !faltando ? 0 : 1);
})();
