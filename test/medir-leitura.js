// QUANTO TEMPO DE LEITURA O JOGO TEM (19/08).
//
// POR QUE ELE EXISTE: o `medir-arco.js` mediu o JOGO e disse, na própria cabeça, que não media a
// LEITURA — e o número que ele devolveu foi 8 a 10 minutos para os treze capítulos. Isso elimina
// a curva de custo como resposta para a pergunta de três dias. Sobra a leitura. Então a leitura
// deixa de ser "o texto do jogo" e passa a ser a única candidata a segurar alguém até o dia 3,
// o que a torna medível e obriga a medi-la.
//
// O QUE ELE CONTA, e a separação é o ponto: existe texto que TODO MUNDO lê (a abertura e o fecho
// de cada capítulo abrem sozinhos, a placa fica fincada na estrada) e texto que só existe para
// quem ABRE uma tela (A HISTÓRIA, o glossário, DE ONDE VEM). Somar os dois num total só produz
// um número bonito e falso. Quem nunca abre um menu vê a coluna OBRIGATÓRIO e mais nada.
//
// A VELOCIDADE É SUPOSIÇÃO, e está dita: 180 a 220 palavras por minuto, a faixa comum de leitura
// silenciosa de adulto. Não é fato deste jogo e não entra em tela nenhuma — é régua de
// instrumento. O que o instrumento afirma de verdade é a CONTAGEM DE PALAVRAS, que é exata.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));
const LENTO = 180, RAPIDO = 220;

const palavras = (t) => !t ? 0 : String(t).trim().split(/\s+/).filter(Boolean).length;

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(ALVO);
  await pg.waitForTimeout(2000);

  const bruto = await pg.evaluate(() => {
    const junta = (a) => (a || []).join(' ');
    const caps = EPOCAS.map((e, i) => ({
      nome: e.nome,
      querer: e.querer || '',
      abertura: junta(e.abertura),
      fecho: junta(e.fecho),
      marcos: tetoMarcos(i),
    }));
    // A tela A HISTÓRIA: título, texto e o comentário de quem lê hoje.
    const linha = LINHA_TEMPO.filter(n => n.tipo === 'momento')
      .map(n => [n.t || '', n.d || '', n.com || ''].join(' '));
    const glos = (typeof GLOSSARIO !== 'undefined' ? GLOSSARIO : [])
      .map(g => Object.keys(g).map(k => typeof g[k] === 'string' ? g[k] : '').join(' '));
    const fontes = (typeof FONTES !== 'undefined' ? FONTES : [])
      .map(f => Object.keys(f).map(k => typeof f[k] === 'string' ? f[k] : '').join(' '));
    const mom = LINHA_TEMPO.filter(n => n.tipo === 'momento');
    // 53 nós do tipo `momento`, 47 deles com fonte — e são os 47 que podem virar placa. Contar
    // os 53 e chamar de "momentos com fonte" seria inflar o número em 13%.
    return { caps, linha, glos, fontes, totalMomentos: mom.length, comFonte: mom.filter(n => n.f).length };
  });

  const somaCaps = (campo) => bruto.caps.reduce((s, c) => s + palavras(c[campo]), 0);
  const obrig = somaCaps('querer') + somaCaps('abertura') + somaCaps('fecho');
  const nLinha = bruto.linha.reduce((s, t) => s + palavras(t), 0);
  const nGlos = bruto.glos.reduce((s, t) => s + palavras(t), 0);
  const nFontes = bruto.fontes.reduce((s, t) => s + palavras(t), 0);
  const marcos = bruto.caps.reduce((s, c) => s + c.marcos, 0);

  const min = (p) => [ (p / RAPIDO), (p / LENTO) ];
  const janela = (p) => { const [a, b] = min(p); return a.toFixed(0) + ' a ' + b.toFixed(0) + ' min'; };

  console.log('QUANTO TEMPO DE LEITURA O JOGO TEM');
  console.log('velocidade suposta: ' + LENTO + ' a ' + RAPIDO + ' palavras/min (leitura silenciosa)\n');

  console.log('OBRIGATÓRIO — abre sozinho, todo mundo lê');
  console.log('  abertura dos 13 capítulos    ' + String(somaCaps('abertura')).padStart(6) + ' palavras');
  console.log('  fecho dos 13 capítulos       ' + String(somaCaps('fecho')).padStart(6) + ' palavras');
  console.log('  a linha do QUERER            ' + String(somaCaps('querer')).padStart(6) + ' palavras');
  console.log('  --------------------------------------------------');
  console.log('  soma                         ' + String(obrig).padStart(6) + ' palavras  ->  ' + janela(obrig));
  console.log('  (mais ' + marcos + ' placas fincadas na estrada, texto vindo da linha do tempo)\n');

  console.log('SÓ PARA QUEM ABRE A TELA');
  console.log('  A HISTÓRIA (' + bruto.totalMomentos + ' nós, ' + bruto.comFonte + ' com fonte) ' + String(nLinha).padStart(6) + ' palavras  ->  ' + janela(nLinha));
  console.log('  o glossário (' + bruto.glos.length + ' verbetes)      ' + String(nGlos).padStart(6) + ' palavras  ->  ' + janela(nGlos));
  console.log('  DE ONDE VEM (' + bruto.fontes.length + ' fontes)       ' + String(nFontes).padStart(6) + ' palavras  ->  ' + janela(nFontes));
  console.log('  --------------------------------------------------');
  const opc = nLinha + nGlos + nFontes;
  console.log('  soma                         ' + String(opc).padStart(6) + ' palavras  ->  ' + janela(opc) + '\n');

  console.log('O JOGO INTEIRO, lendo tudo   ' + String(obrig + opc).padStart(6) + ' palavras  ->  ' + janela(obrig + opc));
  console.log('\nPOR CAPÍTULO (abertura + fecho + querer)');
  bruto.caps.forEach(c => {
    const p = palavras(c.abertura) + palavras(c.fecho) + palavras(c.querer);
    const [a, b] = min(p);
    console.log('  ' + c.nome.padEnd(26) + String(p).padStart(5) + ' palavras   ' +
      (a * 60).toFixed(0) + ' a ' + (b * 60).toFixed(0) + ' s   · ' + c.marcos + ' placas');
  });

  console.log('\nerros de console: ' + (erros.length ? erros[0] : '(nenhum)'));
  await nav.close();
})();
