// GERA A PORTA — plataforma/index.html, a página de entrada da plataforma BRASIL.
//
// POR QUÊ (22/08). A porta era ESTÁTICA e por isso MENTIA: dizia "60 fontes" enquanto a seção
// DE ONDE VEM, gerada do jogo, já dizia 61. É a mesma classe de erro que a growth mediu três
// vezes — número redigitado à mão que envelhece sozinho. A partir daqui a porta é GERADA, e os
// números que ela cita (momentos, verbetes, fontes, capítulos) são EXTRAÍDOS do jogo headless,
// nunca digitados. Se o acervo cresce, a porta acompanha no próximo build.
//
// IRMÃ dos gerar-historia/glossario/fontes/territorio, mesma disciplina: UMA FONTE. A diferença é
// que a porta tem arte de abertura (hero, logo, andarilho) que não vem do jogo — essa parte vive
// no MOLDE (plataforma/molde.html), com placeholders que este script preenche. O molde carrega os
// bytes da arte; o gerador carrega o chrome (ferramentas/chrome-plataforma.js) e os números.
//
// O PORTÃO porta×seção (test/medir-porta-secao.js) confere depois que o número que a porta afirma
// é o mesmo que a seção afirma — é ele que impede o "60 vs 61" de voltar.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('../test/abrir.js');
const CHROME = require('./chrome-plataforma.js');
// A MEDIÇÃO DA PORTA SAI DO MESMO MÓDULO DAS OUTRAS QUATRO desde 23/08. Ela era uma CÓPIA
// colada dentro do molde — setenta e três linhas byte a byte iguais ao `MED.script('porta')`,
// com a chave, o host, o teto e a frase repetidos. Cópia não erra hoje; erra no dia em que a
// regra do §3 mudar num lugar só, e o sintoma seria a porta medindo com uma lei antiga.
const MED = require('./medir-secao.js');
// o endereço mora numa linha só — mas a porta nao redigita numero nenhum, só arte e chrome.
const { BASE } = require('./dominio.js');

const RAIZ = path.resolve(__dirname, '..');
const ALVO = ABRIR('file:///' + path.join(RAIZ, 'index.html').split(path.sep).join('/'));

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.goto(ALVO);
  await pg.waitForTimeout(1800);

  // OS NÚMEROS, extraídos do MESMO jogo de onde as seções extraem os deles.
  // momentos: LINHA_TEMPO (igual a gerar-historia). verbetes: GLOSSARIO (igual a gerar-glossario).
  // fontes: FONTES (igual a gerar-fontes). capítulos: EPOCAS.length (igual ao que gerar-territorio
  // lê). Nenhum destes é digitado na porta.
  const num = await pg.evaluate(() => {
    const mom = LINHA_TEMPO.filter((x) => x.tipo === 'momento' && x.t && x.d);
    return {
      momentos: mom.length,
      momentosFonte: mom.filter((m) => m.f).length,
      verbetes: GLOSSARIO.filter((v) => v.t && !v.g).length,
      fontes: FONTES.filter((v) => v.t && !v.g).length,
      capitulos: EPOCAS.length,
    };
  });
  await nav.close();

  // O CHROME, a mesma fonte única das cinco páginas. O bloco vai embutido com o mesmo id que o
  // resto da plataforma usa, para o build reconhecê-lo e as ferramentas de arte não o tocarem.
  // O `veuCss()` é só da porta: é ela que tem MATA atrás (a costura da onda 4). As quatro
  // seções de leitura são papel e não recebem o token — ver o comentário dele no módulo.
  const chromeStyle = '<style id="chrome-plataforma">\n'
    + CHROME.tokensCss() + CHROME.veuCss() + CHROME.barraCss() + '</style>';
  const barra = CHROME.barraHtml('porta');

  let html = fs.readFileSync(path.join(RAIZ, 'plataforma', 'molde.html'), 'utf8');
  const trocas = {
    '{{CHROME_STYLE}}': chromeStyle,
    '{{BARRA}}': barra,
    '{{MED_ESTILO}}': MED.estilo(),
    '{{MED_RODAPE}}': MED.rodape(),
    '{{MEDICAO}}': MED.script('porta'),
    '{{N_MOMENTOS}}': String(num.momentos),
    '{{N_MOMENTOS_FONTE}}': String(num.momentosFonte),
    '{{N_VERBETES}}': String(num.verbetes),
    '{{N_FONTES}}': String(num.fontes),
    '{{N_CAPITULOS}}': String(num.capitulos),
  };
  for (const k of Object.keys(trocas)) {
    if (html.indexOf(k) < 0) { console.error('RECUSADO: placeholder ausente no molde: ' + k); process.exit(1); }
    html = html.split(k).join(trocas[k]);
  }
  const sobra = html.match(/\{\{[A-Z_]+\}\}/g);
  if (sobra) { console.error('RECUSADO: placeholder não preenchido: ' + sobra[0]); process.exit(1); }

  fs.writeFileSync(path.join(RAIZ, 'plataforma', 'index.html'), html);
  console.log('plataforma/index.html gerado — ' + num.momentos + ' momentos, '
    + num.verbetes + ' verbetes, ' + num.fontes + ' fontes, ' + num.capitulos + ' capítulos, '
    + (html.length / 1024).toFixed(0) + ' KB');

  // MESMA guarda dos irmãos: nenhuma referência externa por src=/href= (o próprio domínio passa).
  const ext = (html.match(/(?:src|href)="https?:\/\/[^"]+"/g) || []).filter((u) => u.indexOf(BASE) < 0);
  if (ext.length) { console.error('RECUSADO: referência externa: ' + ext[0]); process.exit(1); }
})();
