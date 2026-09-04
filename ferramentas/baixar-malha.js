// BAIXA A GEOGRAFIA DO IBGE — as 27 unidades da federação, com nome, região e população.
//
// POR QUE UM ARQUIVO COMMITADO, E NÃO UMA CHAMADA NO BUILD. O `gerar-territorio.js` não fala
// com a rede, e isso não é gosto: um build que depende de um host de fora quebra na máquina
// sem rede, quebra quando o IBGE muda a rota, e — o pior — quebra em SILÊNCIO no dia em que
// a resposta muda de forma. O §3 do CLAUDE.md já pagou essa lição com a contagem anônima
// ("o jogo NUNCA depende dela"). Então a rede é tocada AQUI, à mão, de propósito, e o que ela
// devolve vira um arquivo versionado com a data em que foi buscado.
//
// E ISSO É O REQUISITO DA "EVOLUÇÃO ANO A ANO" (CLAUDE.md §8), não zelo: toda coisa que o jogo
// afirma precisa responder *quando isto vence*. A malha vence quando o IBGE publicar outra; a
// população vence no próximo Censo. As duas datas ficam escritas no `procedencia` do arquivo,
// e a página IMPRIME essa linha de crédito em vez de uma frase redigitada à mão.
//
// NADA AQUI É REDIGITADO. O nome de cada UF, a sigla, a região, o rótulo da variável e a
// unidade saem da RESPOSTA do IBGE, campo a campo. É a mesma regra do gerador irmão: dado que
// existe numa fonte não ganha uma segunda cópia para desencontrar — e num mapa desencontrar é
// afirmar falsidade sobre onde as coisas ficam.
//
// Uso: node ferramentas/baixar-malha.js
//      node ferramentas/baixar-malha.js --tolerancia 0.02
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const DESTINO = path.join(RAIZ, 'territorio', 'malha-ibge.json');

// A QUALIDADE É "intermediaria", e a escolha foi medida: "minima" perde a foz do Amazonas e
// arredonda o litoral a ponto de a divisa AP/PA virar um traço reto; "maxima" traz 200 mil
// vértices, que é mais do que a placa consegue mostrar (ver a régua de meio texel abaixo).
const FONTES = {
  malha: 'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR'
    + '?formato=application/vnd.geo+json&intrarregiao=UF&qualidade=intermediaria',
  nomes: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
  // Censo 2022, agregado 4709, variável 93 (população residente), todas as UFs.
  populacao: 'https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022'
    + '/variaveis/93?localidades=N3[all]',
};

// A TOLERÂNCIA PADRÃO SAI DE UM TEXEL, e é por isso que ela é 0,02°.
// A placa é pintada numa textura de 1024 px de lado que cobre a caixa inteira da projeção
// (39,19° de longitude). Um texel vale 39,19/1024 = 0,0383°. Com tolerância de 0,02° nenhum
// vértice se desloca mais que 0,52 texel — ou seja, o erro é menor que o pixel que o desenha,
// e some antes de existir na tela.
//
// AS QUATRO DOSES FORAM MEDIDAS antes de escolher (cru / gzip / erro máximo em texel):
//     0,01° → 9.549 vértices · 164 KB · 47 KB · 0,26 texel
//     0,02° → 5.633 vértices ·  99 KB · 31 KB · 0,52 texel   ← esta
//     0,03° → 3.837 vértices ·  68 KB · 21 KB · 0,78 texel
//     0,05° → 2.358 vértices ·  44 KB · 14 KB · 1,30 texel
// 0,05 é a primeira que passa de um texel — aí o erro vira pixel e a divisa começa a mentir.
// Entre as três que cabem embaixo de um texel, 0,02 é a que ainda dá margem para a placa ser
// ampliada (a câmera aproxima 1,25x quando um pino é escolhido) sem chegar na borda.
const TOLERANCIA = (() => {
  const i = process.argv.indexOf('--tolerancia');
  return i > 0 ? Number(process.argv[i + 1]) : 0.02;
})();

// ------------------------------------------------------------------ Douglas–Peucker, sem podar canto
// Simplificação por DISTÂNCIA PERPENDICULAR, e não por "pular um vértice a cada n": o segundo
// é mais simples e apaga justamente o que dá forma — a ponta de uma península some, e um
// contorno de estado sem as pontas vira uma mancha genérica. Aqui o que sai é só o vértice que
// está a menos de `tol` da reta que liga os vizinhos, isto é, o que ninguém veria faltar.
function perpendicular(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function simplificar(pts, tol) {
  if (pts.length < 3) return { saida: pts.slice(), erro: 0 };
  let pior = 0;
  const manter = new Uint8Array(pts.length);
  manter[0] = manter[pts.length - 1] = 1;
  const pilha = [[0, pts.length - 1]];
  while (pilha.length) {
    const [a, b] = pilha.pop();
    let dmax = 0, k = -1;
    for (let i = a + 1; i < b; i++) {
      const d = perpendicular(pts[i], pts[a], pts[b]);
      if (d > dmax) { dmax = d; k = i; }
    }
    if (dmax > tol && k > 0) { manter[k] = 1; pilha.push([a, k], [k, b]); }
    else if (dmax > pior) pior = dmax;   // o maior desvio EFETIVAMENTE aceito
  }
  const saida = [];
  for (let i = 0; i < pts.length; i++) if (manter[i]) saida.push(pts[i]);
  return { saida, erro: pior };
}

const r3 = (v) => Math.round(v * 1000) / 1000;   // 0,001° ≈ 110 m — 1/38 de texel

async function pegar(url, oQue) {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('RECUSADO: ' + oQue + ' respondeu ' + r.status + ' — ' + url);
  const txt = await r.text();
  let j;
  try { j = JSON.parse(txt); }
  catch (e) { throw new Error('RECUSADO: ' + oQue + ' não devolveu JSON (' + txt.slice(0, 120) + ')'); }
  return j;
}

(async () => {
  console.log('baixando do IBGE (é a única vez que este repositório fala com a rede para desenhar o mapa)');

  const [malha, nomes, pop] = await Promise.all([
    pegar(FONTES.malha, 'a malha das UFs'),
    pegar(FONTES.nomes, 'a lista de estados'),
    pegar(FONTES.populacao, 'a população do Censo 2022'),
  ]);

  if (!malha.features || malha.features.length !== 27) {
    throw new Error('RECUSADO: a malha veio com ' + ((malha.features || []).length)
      + ' feições e o Brasil tem 27 unidades da federação — a rota ou o parâmetro mudou');
  }
  if (!Array.isArray(nomes) || nomes.length !== 27) {
    throw new Error('RECUSADO: a lista de estados veio com ' + (nomes || []).length + ' itens, e não 27');
  }

  // O RÓTULO E A UNIDADE SAEM DA RESPOSTA, não daqui. Se o IBGE trocar a variável 93 por outra
  // coisa, o crédito impresso na página muda junto em vez de mentir com confiança.
  const serie = pop && pop[0];
  if (!serie || !serie.resultados || !serie.resultados[0]) {
    throw new Error('RECUSADO: a resposta da população não tem `resultados` — o agregado 4709 mudou de forma');
  }
  const porCodigo = new Map();
  for (const s of serie.resultados[0].series) {
    const v = s.serie && s.serie['2022'];
    if (v != null && v !== '-' && v !== '...') porCodigo.set(String(s.localidade.id), Number(v));
  }
  if (porCodigo.size !== 27) {
    throw new Error('RECUSADO: população veio para ' + porCodigo.size + ' UFs, e não 27');
  }

  const meta = new Map(nomes.map((e) => [String(e.id), e]));

  let antes = 0, depois = 0, erroMax = 0;
  const ufs = [];
  for (const f of malha.features) {
    const cod = String(f.properties.codarea);
    const m = meta.get(cod);
    if (!m) throw new Error('RECUSADO: a malha trouxe o código ' + cod + ' que não está na lista de estados');
    const pp = porCodigo.get(cod);
    if (pp == null) throw new Error('RECUSADO: sem população para o código ' + cod + ' (' + m.sigla + ')');

    const polis = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const aneis = [];
    for (const poly of polis) {
      for (const ring of poly) {
        antes += ring.length;
        const { saida, erro } = simplificar(ring, TOLERANCIA);
        erroMax = Math.max(erroMax, erro);
        // ANEL COM MENOS DE 4 PONTOS NÃO É ÁREA — é um risco, e um risco fechado desenha uma
        // linha de ida e volta. Ilhota que simplificou até virar isso sai fora, e a contagem
        // dela aparece no relatório para ninguém achar que a malha veio assim.
        if (saida.length < 4) continue;
        aneis.push(saida.map((c) => [r3(c[0]), r3(c[1])]));
        depois += saida.length;
      }
    }
    if (!aneis.length) throw new Error('RECUSADO: ' + m.sigla + ' ficou sem nenhum anel depois de simplificar');
    ufs.push({
      codigo: cod, sigla: m.sigla, nome: m.nome,
      regiao: m.regiao && m.regiao.nome, pop2022: pp, aneis,
    });
  }
  ufs.sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR'));

  const hoje = new Date().toISOString().slice(0, 10);
  const saida = {
    procedencia: {
      o_que: 'As 27 unidades da federação: contorno, nome, região e população residente. '
        + 'Baixado do IBGE por ferramentas/baixar-malha.js e commitado — o gerador da página '
        + 'não fala com a rede.',
      baixado_em: hoje,
      vence: 'A malha vence quando o IBGE publicar nova divisão territorial (mudança de limite '
        + 'ou criação de unidade). A população vence no próximo Censo Demográfico. '
        + 'Rode de novo ferramentas/baixar-malha.js e confira o diff.',
      fontes: [
        { o_que: 'contorno das UFs', url: FONTES.malha, qualidade: 'intermediaria' },
        { o_que: 'sigla, nome e região', url: FONTES.nomes },
        { o_que: serie.variavel + ' (' + serie.unidade + ')', url: FONTES.populacao, periodo: '2022' },
      ],
      // A LINHA QUE A PÁGINA IMPRIME. Ela é montada AQUI, com os rótulos que o IBGE devolveu,
      // para a página não ter uma segunda cópia do crédito envelhecendo em separado.
      //
      // CURTA DE PROPÓSITO, e a razão é medida: no celular o painel do censo é papel opaco e
      // cada linha dele empurra a placa para cima. A primeira versão desta frase tinha 160
      // caracteres, ocupava 3 linhas em 390 px e sozinha jogou a placa 67 px para trás do
      // painel. A qualidade da malha e as URLs continuam registradas no bloco `fontes` acima —
      // o que a página IMPRIME é o crédito, não a ficha técnica.
      credito: 'Divisas e população por estado: IBGE — malhas territoriais e Censo Demográfico '
        + '2022, baixados em ' + hoje + '.',
      simplificacao: {
        tolerancia_graus: TOLERANCIA,
        porque: 'A textura da placa tem 1024 px para 39,19° de longitude, então um texel vale '
          + '0,0383°. A tolerância é menor que um quarto de texel: o erro some antes de virar pixel.',
        vertices_antes: antes, vertices_depois: depois,
        erro_max_graus: Math.round(erroMax * 1e6) / 1e6,
      },
    },
    ufs,
  };

  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.writeFileSync(DESTINO, JSON.stringify(saida));
  const kb = (fs.statSync(DESTINO).size / 1024).toFixed(0);
  console.log('territorio/malha-ibge.json — 27 UFs, ' + depois + ' vértices (de ' + antes + '), ' + kb + ' KB');
  console.log('  simplificação: tolerância ' + TOLERANCIA + '°, maior desvio aceito '
    + saida.procedencia.simplificacao.erro_max_graus + '° ('
    + (saida.procedencia.simplificacao.erro_max_graus / 0.0383).toFixed(2) + ' texel)');
  console.log('  ' + saida.procedencia.credito);
})().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
