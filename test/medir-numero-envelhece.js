// PORTÃO "o número envelheceu" — o gatilho que OBRIGA a rodar o gerador.
//
// POR QUÊ (02/09, PENDENTES 101a). O `medir-porta-secao.js` compara a PORTA com a SEÇÃO. As duas
// são geradas, as duas copiam o mesmo número, e quando ninguém roda o gerador as duas envelhecem
// JUNTAS: duas cópias que concordam entre si e discordam da FONTE. Medido: a porta e o glossário
// afirmavam **181 verbetes** enquanto o `GLOSSARIO` do jogo tinha **184** — e aquele portão ficava
// VERDE, porque 181 === 181. Cópia contra cópia não é verificação; é eco.
//
// A DIFERENÇA DESTE PORTÃO, e é a única que importa: ele não compara página com página. Ele
// compara o número **AFIRMADO** em cada página pública com o número **EXTRAÍDO do jogo headless**,
// que é a fonte (`src/jogo.ts` compilado no `index.html` da raiz). Regra de ouro da fronteira: dado
// do jogo se EXTRAI, nunca se redigita — e um portão que confere o dado tem de ler da mesma fonte
// de onde o gerador leu, senão ele é mais uma cópia.
//
// O QUE ELE COBRE, e por que o JSON-LD entra separado. Três coisas, em camadas:
//   1. O NÚMERO em texto corrido (`<p class="conta">`, meta description, og:description, a porta).
//   2. O CORPO da página — quantos `<article class="verbete">` existem de fato, e com que nome.
//   3. Os DADOS ESTRUTURADOS — cada `DefinedTerm` do `DefinedTermSet` do glossário, POR NOME.
// A camada 3 é de outra ordem de risco e foi o agravante medido em 02/09: o JSON-LD commitado
// tinha 181 `DefinedTerm` para 184 verbetes reais. Três verbetes existiam no repositório e não
// existiam para nenhum crawler que lê schema.org — ECONOMIA DO OURO, A CONTA DA ESCRAVIDÃO e
// CRITÉRIO BRASIL. Um número feio em texto corrido é feio; conteúdo fora do índice é invisível.
//
// COMO CONSERTAR quando ele reprovar: rode os geradores das páginas que ele apontou e refaça o
// build. Ele imprime a linha de comando exata no fim.
//
// PROVA DE QUE REPROVA (lição 2.8 do EQUIPE.md). Duas, e a primeira é real, não simulada:
//   * o defeito HISTÓRICO: `git stash` das páginas regeradas e este portão sai **1** com o
//     181 commitado; regerado, sai **0** com 184.
//   * o defeito SOB DEMANDA, para quando as páginas estiverem em dia: `NUMERO_DEFEITO=verbetes`
//     envelhece em memória o número EXTRAÍDO (a fonte), e todas as afirmações sobre verbetes têm
//     de divergir. Valores aceitos: qualquer chave de VERDADE (verbetes, momentos, fontes,
//     capitulos, gruposGloss, gruposFontes, momentosFonte, momentosHoje) — as 8 foram vistas
//     saindo 1, uma a uma.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const DEFEITO = process.env.NUMERO_DEFEITO || '';

// AS AFIRMAÇÕES. Cada linha: em que página, qual rótulo, contra qual verdade extraída, e quantas
// ocorrências no MÍNIMO. O mínimo não é enfeite — é o que impede o portão de passar por vazio no
// dia em que alguém apagar a frase que cita o número. Portão que não acha o que medir e diz "ok"
// é o modo de falha mais caro que este repositório já pagou (lição 2.1).
const AFIRMACOES = [
  { pagina: 'plataforma/index.html', rotulo: 'verbetes', verdade: 'verbetes', minimo: 2 },
  { pagina: 'plataforma/index.html', rotulo: 'momentos', verdade: 'momentos', minimo: 2 },
  { pagina: 'plataforma/index.html', rotulo: 'fontes', verdade: 'fontes', minimo: 2 },
  { pagina: 'plataforma/index.html', rotulo: 'capítulos', verdade: 'capitulos', minimo: 1 },
  { pagina: 'glossario/index.html', rotulo: 'verbetes', verdade: 'verbetes', minimo: 1 },
  // "N palavras da história do Brasil" — meta description, og:description e a description do
  // JSON-LD. É o mesmo número com outro substantivo, e ele envelhecia junto, calado.
  { pagina: 'glossario/index.html', rotulo: 'palavras', verdade: 'verbetes', minimo: 3 },
  { pagina: 'glossario/index.html', rotulo: 'grupos', verdade: 'gruposGloss', minimo: 1 },
  { pagina: 'historia/index.html', rotulo: 'momentos', verdade: 'momentos', minimo: 1 },
  { pagina: 'historia/index.html', rotulo: 'com fonte', verdade: 'momentosFonte', minimo: 1 },
  // O terceiro número da /historia: quantos momentos trazem a LEITURA DE HOJE (campo `com`), que
  // entra na página como interpretação e não como fato. Envelhece igual aos outros.
  { pagina: 'historia/index.html', rotulo: 'com a leitura de hoje', verdade: 'momentosHoje', minimo: 1 },
  { pagina: 'de-onde-vem/index.html', rotulo: 'fontes', verdade: 'fontes', minimo: 3 },
  { pagina: 'de-onde-vem/index.html', rotulo: 'grupos', verdade: 'gruposFontes', minimo: 1 },
];

// Qual gerador refaz qual página — é isto que a mensagem de erro devolve para quem reprovou.
const GERADOR = {
  'plataforma/index.html': 'node ferramentas/gerar-porta.js',
  'glossario/index.html': 'node ferramentas/gerar-glossario.js',
  'historia/index.html': 'node ferramentas/gerar-historia.js',
  'de-onde-vem/index.html': 'node ferramentas/gerar-fontes.js',
};

const cache = new Map();
function ler(rel) {
  if (!cache.has(rel)) {
    const p = path.join(RAIZ, rel);
    if (!fs.existsSync(p)) { console.error('REPROVADO: página pública ausente: ' + rel); process.exit(1); }
    cache.set(rel, fs.readFileSync(p, 'utf8'));
  }
  return cache.get(rel);
}
const desesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Toda ocorrência de "<número> <rótulo>" na página. Sem `<p class="conta">` no meio: o número
// mentiroso não mora só na linha da contagem — mora também no og:description, que é o que o
// WhatsApp mostra, e na description do JSON-LD, que é o que o Google lê.
function ocorrencias(html, rotulo) {
  const re = new RegExp('(\\d+)\\s' + rotulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
  const out = []; let m;
  while ((m = re.exec(html)) !== null) out.push(parseInt(m[1], 10));
  return out;
}

(async () => {
  // ---- A VERDADE, extraída do jogo headless. Uma só carga, uma só janela. ----
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto(ABRIR('file:///' + path.join(RAIZ, 'index.html').split(path.sep).join('/')));
  // O estado esperado é o DADO existir — é isso que se pergunta, não um tempo de espera
  // arbitrário. Teto de 30 s como detector de travamento (mesma escolha do medir-porta-secao).
  await pg.waitForFunction(
    () => typeof GLOSSARIO !== 'undefined' && GLOSSARIO.length > 0
      && typeof EPOCAS !== 'undefined' && EPOCAS.length > 0
      && typeof FONTES !== 'undefined' && typeof LINHA_TEMPO !== 'undefined',
    null, { timeout: 30000 },
  ).catch(() => {});
  const VERDADE = await pg.evaluate(() => {
    const mom = LINHA_TEMPO.filter((x) => x.tipo === 'momento' && x.t && x.d);
    return {
      momentos: mom.length,
      momentosFonte: mom.filter((m) => m.f).length,
      momentosHoje: mom.filter((m) => m.com).length,
      verbetes: GLOSSARIO.filter((v) => v.t && !v.g).length,
      gruposGloss: GLOSSARIO.filter((v) => v.g).length,
      fontes: FONTES.filter((v) => v.t && !v.g).length,
      gruposFontes: FONTES.filter((v) => v.g).length,
      capitulos: EPOCAS.length,
      // os TERMOS, por nome e em ordem — é com isto que o JSON-LD é conferido item a item.
      termos: GLOSSARIO.filter((v) => v.t && !v.g).map((v) => String(v.t)),
    };
  });
  await nav.close();

  if (!VERDADE.verbetes || !VERDADE.capitulos) {
    console.error('REPROVADO: o jogo headless não entregou os dados (verbetes=' + VERDADE.verbetes
      + ', capitulos=' + VERDADE.capitulos + '). Rode `npm run build` antes.');
    process.exit(1);
  }
  if (DEFEITO) {
    if (!(DEFEITO in VERDADE)) { console.error('NUMERO_DEFEITO desconhecido: ' + DEFEITO); process.exit(2); }
    VERDADE[DEFEITO] = VERDADE[DEFEITO] - 1;
    console.error('[DEFEITO] verdade.' + DEFEITO + ' envelhecida para ' + VERDADE[DEFEITO]);
  }
  console.log('jogo (fonte): ' + VERDADE.verbetes + ' verbetes em ' + VERDADE.gruposGloss
    + ' grupos · ' + VERDADE.momentos + ' momentos (' + VERDADE.momentosFonte + ' com fonte, '
    + VERDADE.momentosHoje + ' com a leitura de hoje) · '
    + VERDADE.fontes + ' fontes em ' + VERDADE.gruposFontes + ' grupos · '
    + VERDADE.capitulos + ' capítulos');

  const velhas = new Set();
  let falhas = 0; let checagens = 0;

  // ---- CAMADA 1: o número afirmado em texto ----
  for (const a of AFIRMACOES) {
    const html = ler(a.pagina);
    const esperado = VERDADE[a.verdade];
    const achados = ocorrencias(html, a.rotulo);
    checagens++;
    if (achados.length < a.minimo) {
      falhas++; velhas.add(a.pagina);
      console.log('SUMIU   ' + a.pagina + ' — "N ' + a.rotulo + '": '
        + achados.length + ' ocorrência(s), mínimo ' + a.minimo
        + ' (a página deixou de afirmar o número; o portão não mede o que não está lá)');
      continue;
    }
    const erradas = achados.filter((n) => n !== esperado);
    if (erradas.length) {
      falhas++; velhas.add(a.pagina);
      console.log('VELHO   ' + a.pagina + ' — ' + a.rotulo + ': afirma '
        + [...new Set(erradas)].join('/') + ' · jogo=' + esperado
        + ' (' + erradas.length + ' de ' + achados.length + ' ocorrência(s))');
    } else {
      console.log('OK      ' + a.pagina + ' — ' + a.rotulo + ': ' + esperado
        + ' em ' + achados.length + ' lugar(es)');
    }
  }

  // ---- CAMADA 2: o corpo do glossário, por nome ----
  const gloss = ler('glossario/index.html');
  const corpo = [...gloss.matchAll(/<article class="verbete[^"]*"[^>]*>\s*<h3>([^<]*)<\/h3>/g)]
    .map((m) => desesc(m[1]));
  checagens++;
  if (corpo.length !== VERDADE.verbetes) {
    falhas++; velhas.add('glossario/index.html');
    const noCorpo = new Set(corpo);
    const faltam = VERDADE.termos.filter((t) => !noCorpo.has(t));
    console.log('VELHO   glossario/index.html — corpo: ' + corpo.length + ' <article class="verbete">'
      + ' · jogo=' + VERDADE.verbetes
      + (faltam.length ? ' · FORA DA PÁGINA: ' + faltam.join(' | ') : ''));
  } else {
    console.log('OK      glossario/index.html — corpo: ' + corpo.length + ' verbetes desenhados');
  }

  // ---- CAMADA 3: os dados estruturados, por nome ----
  // É a camada de risco diferente: um verbete fora do DefinedTermSet não existe para quem lê
  // schema.org. Não basta contar — o nome importa, porque é o nome que some do índice.
  checagens++;
  const bloco = gloss.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!bloco) {
    falhas++; velhas.add('glossario/index.html');
    console.log('SUMIU   glossario/index.html — JSON-LD: nenhum bloco application/ld+json na página');
  } else {
    let ld = null;
    try { ld = JSON.parse(bloco[1].replace(/\\u003c/g, '<')); } catch (e) {
      falhas++; velhas.add('glossario/index.html');
      console.log('QUEBRADO glossario/index.html — JSON-LD não é JSON válido: ' + e.message);
    }
    if (ld) {
      const nomes = (ld.hasDefinedTerm || []).map((t) => String(t && t.name));
      const noLd = new Set(nomes);
      const faltam = VERDADE.termos.filter((t) => !noLd.has(t));
      const sobram = nomes.filter((t) => VERDADE.termos.indexOf(t) < 0);
      if (faltam.length || sobram.length || nomes.length !== VERDADE.verbetes) {
        falhas++; velhas.add('glossario/index.html');
        console.log('VELHO   glossario/index.html — JSON-LD DefinedTerm: ' + nomes.length
          + ' · jogo=' + VERDADE.verbetes);
        if (faltam.length) console.log('        FORA DOS DADOS ESTRUTURADOS (' + faltam.length + '): ' + faltam.join(' | '));
        if (sobram.length) console.log('        NO JSON-LD E NÃO NA FONTE (' + sobram.length + '): ' + sobram.join(' | '));
      } else {
        console.log('OK      glossario/index.html — JSON-LD: ' + nomes.length
          + ' DefinedTerm, nome por nome iguais à fonte');
      }
    }
  }

  console.log('---');
  if (falhas) {
    console.error('REPROVADO: ' + falhas + ' de ' + checagens + ' checagens afirmam um número que o'
      + ' jogo não confirma. A página envelheceu porque ninguém rodou o gerador.');
    console.error('CONSERTO: ' + [...velhas].map((p) => GERADOR[p] || ('(gerador de ' + p + ')')).join(' && '));
    process.exit(1);
  }
  console.log('número×fonte: ' + checagens + '/' + checagens + ' batem — nenhuma página envelheceu.');
})();
