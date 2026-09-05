// O GLOSSÁRIO É 64% DO TEXTO E TINHA UMA PORTA SÓ (19/08 · a SEGUNDA porta abriu em 19/08).
//
// ATUALIZADO no commit que abriu a porta do fecho. O que estava escrito abaixo continua sendo
// a medição da FALTA — quantos verbetes o jogo diz em voz alta sem oferecer — e o bloco novo
// no fim mede o CONSERTO: o que a porta do fecho passou a oferecer, capítulo por capítulo,
// perguntado ao próprio jogo (`capPalavras`) e não a uma lista escrita aqui. Se as falas
// mudarem, os dois números mudam juntos, que é a única forma de isto continuar verdadeiro.
//
// O `medir-leitura.js` mediu que o glossário sozinho é 17.918 das 27.843 palavras do jogo — dois
// terços de tudo o que foi escrito — e que ele é a única superfície que ninguém precisa abrir
// para terminar a travessia. Este instrumento mede a outra metade do problema: **quantas portas
// ele tem, e quantas vezes o jogo passa na frente de uma sem abrir**.
//
// A busca no código diz que a porta é uma: o botão GLOSSÁRIO do menu. Nenhuma fala, nenhuma
// placa e nenhum momento da linha do tempo leva a um verbete. O `GLOSSARIO_REL` liga verbete a
// verbete — por dentro —, e nada liga de fora para dentro.
//
// O QUE ELE CONTA: quantos verbetes são NOMEADOS por alguma fala de capítulo. Cada um desses é
// uma vez em que o jogo disse a palavra, tem 97 palavras escritas explicando-a, e não disse que
// elas existem. Não é métrica de estilo: é a distância entre o que foi escrito e o que é lido.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));

// Acentos fora, minúsculas, pontuação virando espaço: "Lei Áurea" tem de casar com "lei áurea,".
const dobra = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9º]+/g, ' ').replace(/\s+/g, ' ').trim();

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(ALVO);
  await pg.waitForTimeout(2000);

  const d = await pg.evaluate(() => ({
    caps: EPOCAS.map(e => ({
      nome: e.nome,
      texto: [(e.abertura || []).join(' '), (e.fecho || []).join(' '), e.querer || ''].join(' '),
    })),
    verbetes: GLOSSARIO.map(g => ({ t: g.t, curto: g.curto || '', palavras: String(g.d || '').split(/\s+/).length })),
    linha: LINHA_TEMPO.filter(n => n.tipo === 'momento').map(n => [n.t, n.d, n.com].join(' ')),
  }));

  const falas = d.caps.map(c => ({ nome: c.nome, dobra: dobra(c.texto) }));
  const todaFala = falas.map(f => f.dobra).join(' ');
  const todaLinha = dobra(d.linha.join(' '));

  // Um verbete é "nomeado" quando o termo dele — ou a forma curta — aparece inteiro no texto.
  // Termos de uma letra ou de uma palavra curta demais seriam ruído; o piso é 4 caracteres.
  const nomeado = (v, alvo) => {
    const formas = [v.t, v.curto].filter(x => x && dobra(x).length >= 4).map(dobra);
    return formas.some(f => alvo.includes(f));
  };

  const naFala = d.verbetes.filter(v => nomeado(v, todaFala));
  const naLinha = d.verbetes.filter(v => nomeado(v, todaLinha));
  const soNoMenu = d.verbetes.filter(v => !nomeado(v, todaFala) && !nomeado(v, todaLinha));

  const palavras = (lista) => lista.reduce((s, v) => s + v.palavras, 0);

  console.log('A FALTA: quantos verbetes o jogo diz em voz alta numa fala de capítulo.');
  console.log('Era a medida de 19/08 com UMA porta (o botão do menu); continua aqui como linha');
  console.log('de base, e o bloco do fim diz quanto dela a porta do fecho passou a cobrir.\n');
  console.log('verbetes no total                       ' + String(d.verbetes.length).padStart(4));
  console.log('  nomeados por alguma FALA de capítulo   ' + String(naFala.length).padStart(4) +
    '   (' + palavras(naFala) + ' palavras escritas, zero caminho)');
  console.log('  nomeados por A HISTÓRIA                ' + String(naLinha.length).padStart(4));
  console.log('  não nomeados em lugar nenhum           ' + String(soNoMenu.length).padStart(4) +
    '   (' + palavras(soNoMenu) + ' palavras que só quem varre o menu encontra)\n');

  console.log('OS VERBETES QUE UMA FALA DIZ EM VOZ ALTA (por capítulo — cabeçalho de grupo incluído,');
  console.log('que é onde este bloco e o da porta divergem de propósito)');
  falas.forEach(f => {
    const meus = d.verbetes.filter(v => nomeado(v, f.dobra));
    if (!meus.length) { console.log('  ' + f.nome.padEnd(26) + '  —'); return; }
    console.log('  ' + f.nome.padEnd(26) + String(meus.length).padStart(3) + ' · ' +
      meus.map(v => v.curto || v.t).slice(0, 6).join(', ') + (meus.length > 6 ? '…' : ''));
  });

  // ============================================================
  // A SEGUNDA PORTA — o que o fecho de cada capítulo passou a oferecer.
  // Perguntado ao JOGO: `capPalavras(i)` é a mesma função que a tela usa, então isto mede o que
  // a pessoa vê e não o que o instrumento acha que ela veria (lição 2.1 do EQUIPE.md).
  const porta = await pg.evaluate(() => {
    const dobra2 = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9º]+/g, ' ').replace(/\s+/g, ' ').trim();
    const textos = EPOCAS.map(e => dobra2([(e.abertura || []).join(' '), (e.fecho || []).join(' '),
      e.querer || ''].join(' ')));
    // os que a regra dos 4+ capítulos derruba, com o nome de cada um — é a lista que o dev
    // tem de olhar quando o texto mudar, não a contagem
    const comuns = [];
    GLOSSARIO.forEach((v) => {
      if (v.g || !v.t) return;
      const formas = [String(v.t), String(v.curto || '')].map(dobra2).filter(f => f.length >= 4);
      if (!formas.length) return;
      const n = textos.filter(tx => formas.some(f => tx.indexOf(f) >= 0)).length;
      if (n >= 4) comuns.push(v.t + ' (' + n + ' capítulos)');
    });
    return {
      comuns,
      caps: EPOCAS.map((e, i) => ({
        nome: e.nome,
        termos: capPalavras(i).map(k => GLOSSARIO[k].t),
        palavras: capPalavras(i).reduce((s, k) => s + String(GLOSSARIO[k].d || '').split(/\s+/).length, 0),
      })),
    };
  });
  const alcancados = new Set();
  porta.caps.forEach(c => c.termos.forEach(t => alcancados.add(t)));
  const somaPal = porta.caps.reduce((s, c) => s + c.palavras, 0);
  console.log('\n============================================================');
  console.log('A SEGUNDA PORTA — as palavras que o FECHO de cada capítulo oferece');
  console.log('  capítulos com porta        ' + String(porta.caps.filter(c => c.termos.length).length).padStart(4) + ' de ' + porta.caps.length);
  console.log('  verbetes distintos abertos ' + String(alcancados.size).padStart(4) +
    '   (' + somaPal + ' palavras de definição, contando repetição entre capítulos)');
  console.log('  descartados por serem palavra comum (4+ capítulos): ' +
    (porta.comuns.length ? porta.comuns.join(', ') : 'nenhum'));
  porta.caps.forEach(c => {
    console.log('  ' + c.nome.padEnd(26) + String(c.termos.length).padStart(3) +
      (c.termos.length ? ' · ' + c.termos.join(', ') : ' · (sem porta — nenhum termo casa)'));
  });

  console.log('\nerros de console: ' + (erros.length ? erros[0] : '(nenhum)'));
  await nav.close();
})();
