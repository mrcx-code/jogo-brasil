// PORTÃO porta×seção — a porta nunca mais mente por conta própria.
//
// POR QUÊ (22/08). A porta (plataforma/index.html) era estática e dizia "60 fontes" enquanto a
// seção DE ONDE VEM, gerada do jogo, dizia 61. Agora a porta é GERADA e extrai os números; este
// portão é a rede de segurança: ele confere que o número que a PORTA afirma é o mesmo que a
// SEÇÃO correspondente afirma, e que os capítulos batem com o jogo. Diverge → exit 1.
//
// Fontes de verdade, cada uma na sua superfície:
//   momentos   ← porta  vs  historia/index.html (<p class="conta">N momentos)
//   verbetes   ← porta  vs  glossario/index.html
//   fontes     ← porta  vs  de-onde-vem/index.html
//   capítulos  ← porta  vs  EPOCAS.length do jogo headless (não há página de "capítulos")
//
// PROVA DE QUE REPROVA (lição 2.8): PORTA_SECAO_DEFEITO=1 envelhece o número de fontes da porta
// em memória (como o "60 vs 61" real) e o portão tem de sair 1. Um portão que nunca foi visto
// reprovando é decoração.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const DEFEITO = !!process.env.PORTA_SECAO_DEFEITO;

function ler(rel) {
  const p = path.join(RAIZ, rel);
  if (!fs.existsSync(p)) throw new Error('página ausente: ' + rel);
  return fs.readFileSync(p, 'utf8');
}
// extrai TODAS as ocorrências de "N <rótulo>" e exige que sejam iguais entre si (a porta cita
// cada número duas vezes — portal e card — e as duas têm de bater também).
function nums(html, rotulo) {
  const re = new RegExp('(\\d+)\\s' + rotulo + '\\b', 'g');
  const achados = []; let m;
  while ((m = re.exec(html)) !== null) achados.push(parseInt(m[1], 10));
  return achados;
}
function unico(achados, onde, rotulo) {
  if (achados.length === 0) throw new Error('não achei "' + rotulo + '" em ' + onde);
  const u = [...new Set(achados)];
  if (u.length > 1) { console.error('DIVERGE dentro de ' + onde + ' — ' + rotulo + ': ' + achados.join(', ')); process.exit(1); }
  return u[0];
}
function contaSecao(html, rotulo, onde) {
  const m = html.match(new RegExp('<p class="conta">[^<]*?(\\d+)\\s' + rotulo));
  if (!m) throw new Error('conta de "' + rotulo + '" não achada em ' + onde);
  return parseInt(m[1], 10);
}

(async () => {
  const porta = ler('plataforma/index.html');

  let pFontes = unico(nums(porta, 'fontes'), 'porta', 'fontes');
  const pMomentos = unico(nums(porta, 'momentos'), 'porta', 'momentos');
  const pVerbetes = unico(nums(porta, 'verbetes'), 'porta', 'verbetes');
  const pCapitulos = unico(nums(porta, 'capítulos'), 'porta', 'capítulos');

  if (DEFEITO) { pFontes = pFontes - 1; console.error('[DEFEITO] porta.fontes envelhecido para ' + pFontes); }

  const sMomentos = contaSecao(ler('historia/index.html'), 'momentos', 'historia');
  const sVerbetes = contaSecao(ler('glossario/index.html'), 'verbetes', 'glossario');
  const sFontes = contaSecao(ler('de-onde-vem/index.html'), 'fontes', 'de-onde-vem');

  const nav = await chromium.launch();
  const pgn = await nav.newPage();
  await pgn.goto(ABRIR('file:///' + path.join(RAIZ, 'index.html').split(path.sep).join('/')));
  await pgn.waitForTimeout(1500);
  const sCapitulos = await pgn.evaluate(() => EPOCAS.length);
  await nav.close();

  const pares = [
    ['momentos', pMomentos, sMomentos, 'historia'],
    ['verbetes', pVerbetes, sVerbetes, 'glossario'],
    ['fontes', pFontes, sFontes, 'de-onde-vem'],
    ['capítulos', pCapitulos, sCapitulos, 'jogo (EPOCAS)'],
  ];
  let falhou = false;
  for (const [rot, p, s, onde] of pares) {
    const ok = p === s;
    if (!ok) falhou = true;
    console.log((ok ? 'OK  ' : 'DIVERGE ') + rot + ': porta=' + p + ' · ' + onde + '=' + s);
  }
  if (falhou) { console.error('REPROVADO: a porta afirma um número que a seção não confirma.'); process.exit(1); }
  console.log('porta×seção: 4/4 batem.');
})();
