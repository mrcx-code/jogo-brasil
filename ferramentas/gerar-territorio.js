// GERA A PÁGINA "O TERRITÓRIO" — a placa 3D do Brasil, quarta seção da plataforma.
//
// A DECISÃO. O dono olhou o mapa de pinos dentro do jogo e disse que estava "taaaao basiquinho";
// escolheu three.js e uma página separada. Ela NÃO toca o jogo, NÃO toca a CSP do jogo e NÃO
// entra no arquivo único: é irmã de `historia/`, `glossario/` e `de-onde-vem/`, carregada só
// quando alguém abre o endereço.
//
// UMA FONTE, DUAS SAÍDAS — a mesma disciplina dos irmãos `gerar-historia.js` e
// `gerar-glossario.js`. Nada de dado é redigitado aqui. A ferramenta roda o JOGO headless e
// extrai `MAPA_CONTORNO`, `MAPA_LUGARES`, `MAPA_PONTOS`, `MAPA_CENSO`, `MAPA_CENSO_FONTE`,
// `MAPA_N/S/O/L` e o `nome`/`quando` de `EPOCAS` — que são a ZONA DO DONO no `TERRITORIO.md`,
// e por isso esta ferramenta só LÊ. Se o mapa do jogo ganhar um pino, esta página ganha o
// mesmo pino no próximo `node ferramentas/gerar-territorio.js`; não há duas cópias do dado
// para desencontrar, que é o modo de falha que o §2 não pode permitir num mapa (pino no lugar
// errado é afirmação falsa sobre onde a história aconteceu).
//
// A FRASE DA HONESTIDADE sai do `src/jogo.ts` por regex, VERBATIM, e a ferramenta RECUSA gerar
// se não a achar. Ela é o que impede a página de afirmar precisão que o contorno não tem —
// reescrevê-la à mão aqui seria criar a segunda cópia que o parágrafo acima proíbe.
//
// O QUE ENTRA (§2, opção 1, fechada com o dono): os lugares dos capítulos e o censo. Nada além.
// Nenhum texto novo: cidade, UF, nome do capítulo e `quando` já existem e já foram verificados.
//
// AUTOCONTIDA, ZERO REDE. O three.js entra minificado, inline, dos bytes que o npm baixou. A
// página não busca uma fonte do Google, um CDN nem uma imagem — o grão do topo é gerado no
// canvas com o MESMO `hash01` e as MESMAS doses da Onda 11 (poro 11%, cisco 5,5%).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const ABRIR = require('../test/abrir.js');
// O endereço mora numa linha só (ferramentas/dominio.js) — agora também nas seções.
const { BASE } = require('./dominio.js');
// A MEDIÇÃO DA SEÇÃO (22/08). O mesmo bloco das outras quatro páginas. AQUI O RODAPÉ NÃO É UM
// <footer>: esta página é uma tela cheia sem rolagem, e o lugar de rodapé dela é o pé do painel
// de papel do censo — que é onde as duas outras linhas de crédito (fonte e honestidade) já
// moram. Ele NÃO entra em .env como bloco novo de propósito: `areaUtil()` mede `#censo` para
// enquadrar a placa, e um bloco novo no fluxo mudaria o enquadramento dos pinos.
const MED = require('./medir-secao.js');
// O CHROME DA PLATAFORMA (arte, 22/08) — a barra de tábuas e as texturas. O TERRITÓRIO já usava
// a paleta exata da casa (foi dela que os tokens saíram); aqui entra a mesma nav das outras 4.
const CHROME = require('./chrome-plataforma.js');
// O CENSO DO CARTÃO (PENDENTES 67 · 68 · 100). Uma fonte só: a mesma função que o gerador usa
// para RECUSAR construir é a que `test/medir-cartao-controle.js` usa para recusar aprovar o
// `compartilhar.jpg` já commitado. Os mutantes que a provam moram lá também.
const CENSO = require('./cartao-censo.js');
// A FONTE QUE VIAJA COM O CARTÃO (item cartoes-tipografia-defasada, 02/09). Este cartão
// NUNCA teve a mesma proteção que `cartao-secao.js` ganhou em 872ed92 — ele tira o próprio
// print (não passa por `cartao-secao.js`, porque o censo exige o crivo por RETÂNGULO que só
// `cartao-censo.js` sabe fazer). O gerador reusa o MÓDULO da fonte (mesmo @font-face, mesma
// licença, mesma lista de famílias derivada de CHROME.TITULO/LEITURA) sem tocar em
// `cartao-secao.js` nem em `chrome-plataforma.js` — os dois são território de outro item em
// voo nesta rodada. Nenhum byte de `territorio/index.html` muda por causa disto: a fonte
// entra SÓ na página em memória, na hora do print, exatamente como a irmã já faz.
const TIPO = require('./tipografia-cartao.js');

const RAIZ = path.resolve(__dirname, '..');
const ALVO = ABRIR('file:///' + path.join(RAIZ, 'index.html').split(path.sep).join('/'));

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- o three.js, dos bytes do npm
// Ele vem em DOIS módulos ESM (r0.185 não publica mais UMD): `three.module.min.js` importa de
// `./three.core.min.js`. Como não pode haver arquivo externo, os dois viajam dentro da página
// em <script type="text/plain"> e o boot os transforma em Blob URL para o `import()` dinâmico
// resolver um no outro. É o único jeito de manter ESM sem CDN e sem bundler — e a ferramenta
// confere que nenhum dos dois contém "</script", que quebraria a página em silêncio.
function lerThree() {
  // `require.resolve` e não só o caminho montado à mão: num WORKTREE do git o `node_modules`
  // não é copiado, e `RAIZ/node_modules/three` some — a ferramenta morria com ENOENT num
  // diretório onde `require('three')` funciona, porque o Node resolve subindo a árvore e esta
  // linha não resolvia. É a MESMA armadilha que o `construir.js` já pagou com o `tsc`, e o
  // caminho montado fica como primeiro palpite só porque é o caso comum.
  let dir = path.join(RAIZ, 'node_modules', 'three', 'build');
  if (!fs.existsSync(path.join(dir, 'three.core.min.js'))) {
    // Resolve o PONTO DE ENTRADA e não o `package.json`: o pacote do three declara `exports`,
    // e o Node recusa `three/package.json` com ERR_PACKAGE_PATH_NOT_EXPORTED (medido). O ponto
    // de entrada é `build/three.cjs`, então a pasta dele já É a `build/` que se quer.
    try { dir = path.dirname(require.resolve('three')); }
    catch (e) { /* fica o caminho de sempre, e o ENOENT diz o que falta instalar */ }
  }
  const core = fs.readFileSync(path.join(dir, 'three.core.min.js'), 'utf8');
  const mod = fs.readFileSync(path.join(dir, 'three.module.min.js'), 'utf8');
  for (const [nome, txt] of [['core', core], ['module', mod]]) {
    if (/<\/script/i.test(txt)) throw new Error('RECUSADO: three.' + nome + ' contém </script');
  }
  if (!mod.includes('./three.core.min.js')) {
    throw new Error('RECUSADO: three.module.min.js não importa mais de ./three.core.min.js — o boot precisa mudar');
  }
  return { core, mod };
}

// ------------------------------------------------- a geografia do IBGE, do arquivo commitado
// Ela NÃO é buscada aqui. `ferramentas/baixar-malha.js` fala com o IBGE à mão, escreve
// `territorio/malha-ibge.json` com a data e o crédito dentro, e é esse arquivo que entra na
// página. O gerador continua sem rede — a mesma regra que faz o build não depender da contagem
// anônima (CLAUDE.md §3) vale aqui: um host de fora não decide se a página existe.
//
// O CRÉDITO É LIDO, NUNCA REDIGITADO — mesma disciplina da frase da honestidade logo abaixo.
// Se a malha for baixada de novo com outra data ou outra qualidade, a linha impressa muda
// junto. Uma segunda cópia do crédito envelheceria em separado, e crédito errado num mapa é
// afirmação falsa sobre quem mediu o país.
const CAMINHO_MALHA = path.join(RAIZ, 'territorio', 'malha-ibge.json');
function lerMalha() {
  if (!fs.existsSync(CAMINHO_MALHA)) {
    throw new Error('RECUSADO: falta territorio/malha-ibge.json — rode: node ferramentas/baixar-malha.js');
  }
  const m = JSON.parse(fs.readFileSync(CAMINHO_MALHA, 'utf8'));
  if (!m.procedencia || !m.procedencia.credito || !m.procedencia.baixado_em) {
    throw new Error('RECUSADO: malha-ibge.json sem bloco `procedencia` — a página não pode creditar o que não sabe de onde veio');
  }
  if (!Array.isArray(m.ufs) || m.ufs.length !== 27) {
    throw new Error('RECUSADO: malha-ibge.json tem ' + ((m.ufs || []).length) + ' unidades da federação, e o Brasil tem 27');
  }
  for (const uf of m.ufs) {
    if (!uf.sigla || !uf.nome || !Array.isArray(uf.aneis) || !uf.aneis.length) {
      throw new Error('RECUSADO: unidade da federação incompleta na malha: ' + JSON.stringify(uf.sigla || uf.codigo));
    }
    if (typeof uf.pop2022 !== 'number' || !(uf.pop2022 > 0)) {
      throw new Error('RECUSADO: ' + uf.sigla + ' sem população do Censo 2022 na malha');
    }
  }
  return m;
}

// ------------------------------------------------------ SÓ AS DIVISAS INTERNAS, e o porquê
//
// O PRIMEIRO DESENHO TRAÇOU O ANEL INTEIRO DE CADA ESTADO e ficou com um defeito visível no
// litoral do Nordeste: onde a costa do IBGE cai DENTRO do contorno desenhado à mão, o anel do
// estado era traçado ali e sobrava uma tira de placa sem estado nenhum entre a linha e a borda
// — que lê como erro de desenho, porque é.
//
// A CORREÇÃO NÃO É APARAR A TIRA, É NÃO DESENHAR AQUELA LINHA. A borda oceânica de um estado
// não é divisa de nada: a divisa ali é o litoral, e o litoral já está desenhado — é a própria
// silhueta da placa. O que a lista de aceite pede são as DIVISAS, e divisa é o que separa dois
// estados.
//
// E DÁ PARA SABER QUAL É QUAL SEM CHUTAR, porque a malha do IBGE é topologicamente limpa.
// MEDIDO nesta malha: 5.588 arestas, 3.815 distintas, e o histograma tem exatamente dois
// valores — 2.042 arestas aparecem UMA vez (fronteira do país: oceano ou país vizinho) e 1.773
// aparecem DUAS (a mesma aresta percorrida pelos dois estados que ela separa). Nenhuma aparece
// três vezes ou mais. Então "compartilhada por dois" é o teste, e ele é exato, não heurístico.
//
// AS ARESTAS VIRAM LINHAS ENCADEADAS em vez de 1.773 segmentos soltos: com segmento solto cada
// junta é um toco, e num traço de 1,7 texel os tocos aparecem como serrilha nos cantos. Ligadas,
// o lineJoin:round faz o seu trabalho.
function divisasInternas(malha) {
  const chave = (a, b) => {
    const ka = a[0] + ',' + a[1], kb = b[0] + ',' + b[1];
    return ka < kb ? ka + '|' + kb : kb + '|' + ka;
  };
  const conta = new Map();
  for (const uf of malha.ufs) for (const anel of uf.aneis) {
    for (let i = 0; i + 1 < anel.length; i++) {
      const k = chave(anel[i], anel[i + 1]);
      conta.set(k, (conta.get(k) || 0) + 1);
    }
  }
  const tresOuMais = [...conta.values()].filter((v) => v > 2).length;
  if (tresOuMais) {
    throw new Error('RECUSADO: ' + tresOuMais + ' aresta(s) da malha são compartilhadas por mais '
      + 'de dois estados — a malha deixou de ser topologicamente limpa e o teste "compartilhada '
      + '= divisa interna" parou de valer. Confira a qualidade baixada em ferramentas/baixar-malha.js.');
  }
  // adjacência só com as compartilhadas, cada aresta uma vez
  const pos = new Map(), adj = new Map();
  const vistas = new Set();
  const nome = (p) => p[0] + ',' + p[1];
  for (const uf of malha.ufs) for (const anel of uf.aneis) {
    for (let i = 0; i + 1 < anel.length; i++) {
      const a = anel[i], b = anel[i + 1], k = chave(a, b);
      if (conta.get(k) < 2 || vistas.has(k)) continue;
      vistas.add(k);
      const na = nome(a), nb = nome(b);
      pos.set(na, a); pos.set(nb, b);
      if (!adj.has(na)) adj.set(na, []);
      if (!adj.has(nb)) adj.set(nb, []);
      adj.get(na).push(nb); adj.get(nb).push(na);
    }
  }
  const usada = new Set();
  const linhas = [];
  const anda = (comeco) => {
    const linha = [pos.get(comeco)];
    let atual = comeco;
    for (;;) {
      const vizinhos = adj.get(atual) || [];
      let proximo = null;
      for (const v of vizinhos) {
        const k = atual < v ? atual + '|' + v : v + '|' + atual;
        if (!usada.has(k)) { usada.add(k); proximo = v; break; }
      }
      if (!proximo) break;
      linha.push(pos.get(proximo));
      atual = proximo;
    }
    if (linha.length > 1) linhas.push(linha);
  };
  // começa pelas PONTAS (grau ímpar): quem começa no meio de um caminho o parte em dois e
  // devolve duas linhas onde havia uma. Só depois os ciclos, que não têm ponta.
  for (const [n, vs] of adj) if (vs.length % 2 === 1) anda(n);
  for (const [n] of adj) {
    const vs = adj.get(n) || [];
    const sobrou = vs.some((v) => !usada.has(n < v ? n + '|' + v : v + '|' + n));
    if (sobrou) anda(n);
  }
  return { linhas, arestas: vistas.size };
}

// A DIVISA NÃO PODE ENCOSTAR NO PONTO QUE O INSTRUMENTO LÊ, e esta guarda existe porque as duas
// coisas passaram a dividir a mesma superfície. O `test/ver-territorio.js` julga a paleta travada
// pela MEDIANA de um retalho de 5x5 no centro do quadrado da projeção — um ponto que hoje cai em
// Mato Grosso, longe de tudo. Uma divisa é tinta ESCURA: se um dia a malha mudar (o IBGE publica
// nova divisão territorial, alguém troca a tolerância) e uma linha passar perto dali, o portão da
// cor cairia com uma mensagem sobre LUZ — e a causa seria geografia. Um dia inteiro de diagnóstico
// no lugar errado. Medido hoje: a divisa mais próxima está a 69,7 texels (6,80% da largura da
// placa). A régua é 8 texels, que é o retalho de 5 mais a largura do traço com folga.
const FOLGA_SONDA_TEXELS = 8;
function conferirSonda(malha, TEX, lim) {
  let perto = Infinity, quem = null;
  for (const uf of malha.ufs) {
    for (const anel of uf.aneis) {
      for (const c of anel) {
        // o mesmo `proj` da página, na fração 0..1 da placa; a sonda lê o centro, (0,5 · 0,5)
        const x = (c[0] - lim.O) / (lim.L - lim.O), y = (lim.N - c[1]) / (lim.N - lim.S);
        const d = Math.hypot(x - 0.5, y - 0.5);
        if (d < perto) { perto = d; quem = uf.sigla; }
      }
    }
  }
  const texels = perto * TEX;
  if (texels < FOLGA_SONDA_TEXELS) {
    throw new Error('RECUSADO: uma divisa (' + quem + ') passa a ' + texels.toFixed(1)
      + ' texels do ponto em que test/ver-territorio.js lê a cor do topo — abaixo da folga de '
      + FOLGA_SONDA_TEXELS + '. O portão da cor reprovaria falando de LUZ, e a causa seria a GEOGRAFIA.');
  }
  return { texels, quem };
}

(async () => {
  const three = lerThree();
  const malha = lerMalha();

  // ------------------------------------------------------------ a frase da honestidade, verbatim
  const fonteTs = fs.readFileSync(path.join(RAIZ, 'src', 'jogo.ts'), 'utf8');
  const mHon = fonteTs.match(/linha\(rod,\s*"(O contorno é desenhado à mão[^"]*)"/);
  if (!mHon) throw new Error('RECUSADO: não achei a frase do contorno em src/jogo.ts — ela não pode ser redigitada');
  const honestidade = mHon[1];

  // ------------------------------------------------------------------- os dados, do jogo rodando
  // PENDENTES 91/98 — `chromium.launch()` NU falha nesta maquina (o navegador esta no disco,
  // em /opt/pw-browsers/chromium, e o que falta e dizer onde). `ABRIR.chromiumPath()` devolve
  // undefined onde ja funcionava, entao o lancamento continua identico no CI.
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage();
  const erros = [];
  pg.on('pageerror', (e) => erros.push(String(e)));
  await pg.goto(ALVO);
  await pg.waitForTimeout(1800);
  const D = await pg.evaluate(() => {
    const capitulo = (id) => {
      const e = EPOCAS.find((x) => x.id === id);
      return e ? { id: e.id, nome: e.nome, quando: e.quando || '' } : null;
    };
    return {
      N: MAPA_N, S: MAPA_S, O: MAPA_O, L: MAPA_L,
      contorno: MAPA_CONTORNO.map((p) => [p[0], p[1]]),
      censo: MAPA_CENSO.map((c) => [c[0], c[1]]),
      censoFonte: MAPA_CENSO_FONTE,
      pontos: MAPA_PONTOS.map((p) => ({
        uf: p.uf, cidade: p.cidade, onde: p.onde, lat: p.lat, lon: p.lon,
        caps: p.eps.map((ep) => {
          const c = capitulo(ep);
          const l = MAPA_LUGARES.find((x) => x.ep === ep);
          return c ? { nome: c.nome, quando: c.quando, onde: l ? l.onde : '' } : null;
        }).filter(Boolean),
      })),
    };
  });
  await nav.close();
  if (erros.length) throw new Error('RECUSADO: o jogo deu erro de console ao extrair: ' + erros[0]);
  if (!D.pontos.length || !D.contorno.length) throw new Error('RECUSADO: extração vazia');
  const semCap = D.pontos.filter((p) => !p.caps.length);
  if (semCap.length) throw new Error('RECUSADO: ponto sem capítulo em EPOCAS: ' + semCap[0].cidade);
  D.honestidade = honestidade;

  // A TEXTURA DO TOPO PASSOU A SER UM MAPA, então o número dela sai daqui e viaja para a página:
  // é ele que decide o tamanho do texel, e é contra o texel que a simplificação da malha foi
  // escolhida (ver ferramentas/baixar-malha.js). Um número só, nos dois lados.
  const TEX = 1024;
  D.tex = TEX;
  D.ufs = malha.ufs;
  D.creditoMalha = malha.procedencia.credito;
  const divisas = divisasInternas(malha);
  D.divisas = divisas.linhas;
  const sonda = conferirSonda(malha, TEX, { N: D.N, S: D.S, O: D.O, L: D.L });

  // ------------------------------------------------------------------------ a lista de lugares
  // Existe por DUAS razões e as duas são de acesso: teclado (o canvas não é focável) e o recuo
  // sem WebGL — nesse caso ela é a única forma de chegar ao conteúdo, e o conteúdo continua
  // inteiro na página, que é a diferença entre um recuo digno e uma tela de erro.
  const lista = D.pontos.map((p, i) =>
    `      <button type="button" class="pl" data-i="${i}">${esc(p.cidade)} <span class="uf">${esc(p.uf)}</span></button>`
  ).join('\n');

  const censoLinhas = D.censo.map((c) =>
    `        <div class="cLin"><span class="cR">${esc(c[0])}</span><span class="cV">${esc(c[1])}</span></div>`
  ).join('\n');

  // AS 27 UNIDADES EM TEXTO, para o recuo sem WebGL. Sem WebGL não há placa, e sem placa não há
  // como tocar num estado — a camada nova sumiria inteira justamente para quem já tem menos.
  // Vai como TEXTO e não como botão de propósito: o cartão do link é recortado em 1200x630 e o
  // censo de `cartao-censo.js` reprova elemento interativo que não esteja na lista de permitidos;
  // 27 botões novos ou alargariam aquela lista ou quebrariam o cartão. Texto informa e não entra
  // naquela conta. (O que fica em falta está escrito no relatório: teclado para os estados
  // QUANDO há WebGL — hoje eles só respondem ao ponteiro.)
  const milhar = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const ufsTexto = malha.ufs
    .map((u) => `${esc(u.nome)} (${esc(u.sigla)}) ${milhar(u.pop2022)}`)
    .join(' · ');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0a0806">
<meta name="description" content="O território do Brasil em relevo: os lugares onde a história do jogo aconteceu e os três números do Censo 2022.">
<meta property="og:title" content="O TERRITÓRIO — BRASIL">
<meta property="og:description" content="Uma placa do Brasil em relevo, com os lugares onde cada capítulo aconteceu e o Censo Demográfico de 2022.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BRASIL">
<meta property="og:url" content="${BASE}/territorio/">
<meta property="og:locale" content="pt_BR">
<meta property="og:image" content="${BASE}/territorio/compartilhar.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A placa do Brasil em relevo, com os pinos acesos nos lugares onde cada capítulo aconteceu.">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${BASE}/territorio/">
<title>O Território — os lugares da história do Brasil</title>
<style>
${CHROME.tokensCss()}  :root {
    --fundo:#0a0806; --mesa:#120d08;
    --topo:#e9d8ae; --topo2:#d8c391; --sombra:#33240f;
    --pino:#eba748; --pino2:#f3c05c;
    --papel:#efe6d2; --papelB:#ded2b6; --tinta:#211a10; --tinta2:#5a4c36; --pedra:#857658;
    /* OS BOTÕES DE LUGAR SÃO OPACOS, e as três cores abaixo são o que eles JÁ PARECIAM: o
       resultado exato de compor as translucências antigas sobre a mesa (--mesa #120d08), que é
       o que está atrás deles em quatro das cinco telas medidas.
         rgba(233,216,174,.06) sobre (18,13,8) = (30,25,17) = #1e1911   ← fundo
         rgba(233,216,174,.18) sobre (18,13,8) = (57,50,38) = #393226   ← borda
         rgba(235,167,72,.16)  sobre (18,13,8) = (53,38,18) = #352612   ← escolhido
       Por que deixaram de ser translúcidas: em 360x640 o areaUtil() faz a placa SUBIR sobre o
       cabeçalho de propósito (é melhor mapa menor e inteiro que mapa maior pela metade), e aí
       o que passava por trás dos botões deixava de ser a mesa escura e passava a ser o topo
       claro da placa. MEDIDO em 360x640 na página de antes, pixel a pixel com o texto apagado:
       4 dos 5 botões com o pior pixel em 1,00–1,01:1, mediana 1,38:1 no do Rio e 1,39:1 no de
       Brasília, e de 43% a 76% do retângulo abaixo de 4,5:1. Depois: 8,56:1 em todos os cinco.
       O conserto é aqui e não no enquadramento — a placa continua subindo, e o botão é que
       para de ser vidro. Cobrado por julgarSobreposicao() em test/ver-territorio.js. */
    --pl:#1e1911; --plB:#393226; --plOn:#352612;
  }
  * { box-sizing:border-box; }
  html, body { height:100%; }
  body {
    margin:0; background:var(--fundo); color:var(--topo);
    font:400 16px/1.55 Georgia,"Iowan Old Style","Palatino Linotype","Times New Roman",serif;
    -webkit-text-size-adjust:100%; overflow:hidden;
    -webkit-tap-highlight-color:transparent;
  }
  #palco { position:fixed; inset:0; width:100%; height:100%; display:block; touch-action:manipulation; }

  .env { position:fixed; inset:0; display:flex; flex-direction:column;
    padding:max(.9rem,env(safe-area-inset-top)) .9rem max(.9rem,env(safe-area-inset-bottom));
    pointer-events:none; }
  .env > * { pointer-events:auto; }

${CHROME.barraCss()}
  /* width:fit-content nos blocos do cabeçalho não é estética: é o que faz o retângulo deles
     medir o TEXTO. A câmera enquadra a placa na área livre MEDIDA no DOM, e um <h1> que ocupa
     a largura inteira (como todo bloco ocupa) diria que não sobrou área nenhuma. A barra de
     tábuas entra no mesmo contrato: fit-content, e rola na horizontal quando não cabe. */
  .barra, h1, .sub, .lista { width:fit-content; max-width:100%; }
  .barra { margin:0 0 .55rem; }
  h1 { margin:0; font:400 clamp(1.35rem,5.2vw,2.1rem)/1.15 Georgia,serif; letter-spacing:.01em;
    color:var(--topo); }
  .sub { margin:.25rem 0 0; max-width:min(34ch,100%); font-size:clamp(.82rem,3.1vw,.95rem);
    color:#9c8f74; line-height:1.45; }

  .lista { display:flex; flex-wrap:wrap; gap:.4rem; margin:.7rem 0 0; }
  .pl { appearance:none; font:400 .82rem/1 Georgia,serif; letter-spacing:.01em;
    background:var(--pl); border:1px solid var(--plB);
    color:#c4b492; border-radius:2px; padding:.44rem .62rem; cursor:pointer; }
  .pl .uf { color:var(--pino); font:600 .68rem/1 ui-monospace,monospace; letter-spacing:.06em; }
  .pl:hover, .pl:focus-visible { border-color:var(--pino); color:var(--topo); outline:none; }
  .pl[aria-pressed="true"] { background:var(--plOn); border-color:var(--pino); color:var(--topo); }

  .cresce { flex:1 1 auto; min-height:0; }

  /* O CENSO EM PAPEL — painel, não HUD. Ele fica no canto de baixo e não flutua sobre o mapa
     como um número solto: é uma folha apoiada na mesa, com a fonte impressa embaixo. */
  .papel { background:var(--graoPx,none), linear-gradient(180deg,var(--papel),var(--papelB));
    color:var(--tinta); border-radius:3px; padding:.75rem .85rem .7rem;
    box-shadow:0 1px 0 rgba(255,255,255,.35) inset, 0 10px 26px rgba(0,0,0,.55);
    max-width:32rem; }
  #censo { align-self:flex-start; width:min(24rem,100%); }
  #censo h2 { margin:0 0 .45rem; font:600 .66rem/1 ui-monospace,monospace; letter-spacing:.16em;
    text-transform:uppercase; color:var(--pedra); }
  .cLin { display:flex; justify-content:space-between; align-items:baseline; gap:1rem;
    padding:.16rem 0; border-bottom:1px dotted rgba(90,76,54,.28); }
  .cLin:last-of-type { border-bottom:0; }
  .cR { font-size:.87rem; color:var(--tinta2); }
  .cV { font:600 1.02rem/1 ui-monospace,"SFMono-Regular",Menlo,monospace; color:var(--tinta);
    letter-spacing:-.01em; white-space:nowrap; }
  .fonte { margin:.5rem 0 0; font-size:.72rem; line-height:1.42; color:var(--pedra); }
  .fonte + .fonte { margin-top:.3rem; }
${MED.estilo()}  /* no papel do censo a linha da medição é crédito, como as duas fontes acima:
     mesmo tamanho, mesma cor, sem pedir a vez. As duas cores que esta chamada passava
     (cor/apagada) vestiam o botão do rodapé, que subiu para a barra em 23/08. */
  #censo .med { margin:.45rem 0 0; font-size:.72rem; line-height:1.42; color:var(--pedra); }
  #censo .med strong { font-weight:600; color:var(--tinta2); }

  /* O CARTÃO — papel opaco que SOBE. Some por transform, não por display, para o movimento ser
     um só e a leitura não piscar. */
  /* o esconderijo é 100% DA PRÓPRIA ALTURA MAIS a distância até a borda — com "140%" o cartão
     vazio (que é baixo) sobrava 2 px de papel na beirada da tela, medido no print de 390×844 */
  #cartao { position:fixed; left:.9rem; right:.9rem; bottom:max(.9rem,env(safe-area-inset-bottom));
    z-index:5; transform:translateY(calc(100% + 3rem));
    transition:transform .34s cubic-bezier(.16,.84,.3,1); pointer-events:none; }
  #cartao.aberto { transform:translateY(0); pointer-events:auto; }
  #cartao .papel { padding:1rem 1rem .9rem; }
  .kCidade { margin:0; font:400 clamp(1.15rem,4.6vw,1.5rem)/1.2 Georgia,serif; color:var(--tinta); }
  .kCidade .uf { font:600 .7rem/1 ui-monospace,monospace; letter-spacing:.1em; color:var(--pedra);
    margin-left:.45rem; vertical-align:.18em; }
  .kOnde { margin:.12rem 0 .6rem; font-style:italic; font-size:.9rem; color:var(--tinta2); }
  .kCap { padding:.5rem 0; border-top:1px solid rgba(90,76,54,.22); }
  .kCap h3 { margin:0; font:600 .95rem/1.25 Georgia,serif; letter-spacing:.02em; color:var(--tinta); }
  .kQuando { margin:.1rem 0 0; font-size:.83rem; color:var(--tinta2); }
  .kEnd { margin:.12rem 0 0; font-size:.78rem; color:var(--pedra); }
  .kPe { display:flex; justify-content:space-between; align-items:center; gap:1rem;
    margin-top:.7rem; padding-top:.6rem; border-top:1px solid rgba(90,76,54,.22); }
  .kJogar { font:600 .84rem/1 Georgia,serif; color:#7a4a13; text-decoration:none;
    border-bottom:1px solid rgba(122,74,19,.45); padding-bottom:.15rem; }
  .kJogar:hover { color:#5c3608; }
  .kFecha { appearance:none; background:none; border:0; cursor:pointer; padding:.4rem .1rem;
    font:600 .68rem/1 ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase;
    color:var(--pedra); }
  .kFecha:hover { color:var(--tinta); }

  /* em tela estreita o cartão sobe POR CIMA do painel do censo; deixá-lo espiando por trás
     é a diferença entre uma folha apoiada e duas folhas amassadas. Em tela larga eles não
     disputam lugar nenhum (um em cada canto), e o censo fica. */
  #censo { transition:opacity .2s; }
  body.comCartao #censo { opacity:0; pointer-events:none; }
  #semwebgl { display:none; align-self:flex-start; margin-top:.9rem; width:min(30rem,100%); }
  #semwebgl h2 { margin:0 0 .35rem; font:400 1.05rem/1.25 Georgia,serif; }
  #semwebgl p { margin:0 0 .5rem; font-size:.88rem; color:var(--tinta2); }
  /* a lista das 27 é longa e é referência, não leitura corrida: menor, e rolando dentro do
     próprio bloco para não empurrar o link de voltar ao jogo para fora da tela */
  .ufsLista { font-size:.78rem !important; line-height:1.5; max-height:11rem; overflow-y:auto; }
  body.sem #palco { display:none; }
  body.sem #semwebgl { display:block; }

  /* TELA BAIXA: O PAINEL NÃO PODE COMER A PÁGINA.
     MEDIDO em 360x640: o painel do censo ocupava 395 px dos 640 — 62% da tela — e sobrava tão
     pouco que o enquadramento tinha de escolher entre uma placa minúscula e uma placa por cima
     do cabeçalho. A causa não é o mapa, é o painel: os três números do censo são o conteúdo, e
     abaixo deles vêm quatro parágrafos de CRÉDITO, que são para quem procura, não para quem
     chega. Com teto de altura, os números continuam à vista e os créditos rolam dentro do
     papel — que é o que se faz com nota de rodapé quando a página é pequena.
     Só onde o problema existe: tela estreita E baixa. Em 390x844 nada muda. */
  @media (max-width:819px) and (max-height:780px) {
    #censo { max-height:46vh; overflow-y:auto; }
  }

  @media (min-width:820px) {
    .env { padding:1.5rem 1.6rem; }
    /* COLUNA DE TEXTO À ESQUERDA, PLACA À DIREITA. A largura da coluna é travada em 24rem
       porque é ela que decide onde a área livre da placa começa — deixar a fila de lugares
       correr solta empurrava a placa para 71% da largura e abria um vazio no meio da tela. */
    .barra, h1, .sub, .lista { max-width:24rem; }
    #censo { order:0; margin-top:1.4rem; }
    body.comCartao #censo { opacity:1; pointer-events:auto; }
    .cresce { order:1; }
    #cartao { left:auto; right:1.6rem; bottom:1.6rem; width:24rem;
      transform:translateX(calc(100% + 3rem)); }
    #cartao.aberto { transform:translateX(0); }
    .sub { max-width:38ch; }
  }
  @media (prefers-reduced-motion:reduce) {
    #cartao { transition:none; }
  }
</style>
</head>
<body>
<canvas id="palco"></canvas>

<div class="env">
  <header>
${CHROME.barraHtml('territorio')}
    <h1>O território</h1>
    <p class="sub">Os lugares onde cada capítulo do jogo aconteceu, e as 27 unidades da
      federação. Toque num pino — ou num estado.</p>
    <nav class="lista" aria-label="lugares">
${lista}
    </nav>
  </header>

  <div class="cresce"></div>

  <section class="papel" id="censo" aria-label="Censo Demográfico 2022">
    <h2>o país no censo de 2022</h2>
${censoLinhas}
    <p class="fonte">${esc(D.censoFonte)}</p>
    <p class="fonte">${esc(D.honestidade)}</p>
    <p class="fonte">${esc(D.creditoMalha)}</p>
    ${MED.rodape()}
  </section>

  <section class="papel" id="semwebgl">
    <h2>Este aparelho não desenha em 3D.</h2>
    <p>A placa em relevo precisa de WebGL, e o navegador aqui não o oferece. Os lugares
      continuam acima: toque no nome de qualquer um para ler o cartão.</p>
    <p class="ufsLista"><strong>As 27 unidades da federação e a população de cada uma no Censo
      de 2022:</strong> ${ufsTexto}.</p>
    <p><a class="kJogar" href="/jogo/">abrir o mapa dentro do jogo →</a></p>
  </section>
</div>

<div id="cartao" role="dialog" aria-modal="false" aria-label="lugar"><div class="papel" id="cartaoP"></div></div>

<script type="text/plain" id="three-core">${three.core}</script>
<script type="text/plain" id="three-mod">${three.mod}</script>
<script type="module">
const D = ${JSON.stringify(D)};

/* ------------------------------------------------------------------ o cartão de papel
   Ele é HTML por cima do canvas, e não textura dentro da cena, por uma razão de leitura:
   tipografia serifada num canvas 3D ou fica borrada ou custa uma atlas de fonte. */
const elCartao = document.getElementById("cartao");
const elCartaoP = document.getElementById("cartaoP");
const botoes = [].slice.call(document.querySelectorAll(".pl"));
let selecionado = -1;

function texto(pai, tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  pai.appendChild(e);
  return e;
}

function montarCartao(i) {
  const p = D.pontos[i];
  elCartaoP.textContent = "";
  const h = texto(elCartaoP, "h2", "kCidade", p.cidade);
  texto(h, "span", "uf", p.uf);
  // QUANDO O PONTO CARREGA DOIS CAPÍTULOS, O ENDEREÇO NÃO SOBE PARA O TÍTULO. O jogo já pagou
  // por isso e deixou escrito no próprio código: o Rio herdava o endereço do primeiro capítulo e
  // a cidade inteira virava "Cais do Valongo" — o endereço de um dos dois e a cidade de nenhum.
  // Com dois, o endereço desce e vira do capítulo a que pertence.
  const muitos = p.caps.length > 1;
  if (!muitos && p.onde && p.onde !== p.cidade) texto(elCartaoP, "p", "kOnde", p.onde);
  for (let k = 0; k < p.caps.length; k++) {
    const c = p.caps[k];
    const bloco = texto(elCartaoP, "div", "kCap");
    texto(bloco, "h3", null, c.nome);
    if (c.quando) texto(bloco, "p", "kQuando", c.quando);
    if (muitos && c.onde && c.onde !== p.cidade) texto(bloco, "p", "kEnd", c.onde);
  }
  const pe = texto(elCartaoP, "div", "kPe");
  const a = texto(pe, "a", "kJogar", "jogar este capítulo \\u2192");
  a.href = "/jogo/";
  const b = texto(pe, "button", "kFecha", "fechar");
  b.type = "button";
  b.addEventListener("click", function () { escolher(-1); });
}

function escolher(i) {
  selecionado = i;
  if (i >= 0) ufEscolhida(-1, true);            // pino e estado não ficam abertos juntos
  for (let k = 0; k < botoes.length; k++) botoes[k].setAttribute("aria-pressed", k === i ? "true" : "false");
  document.body.classList.toggle("comCartao", i >= 0);
  if (i < 0) { elCartao.classList.remove("aberto"); return; }
  montarCartao(i);
  elCartao.classList.add("aberto");
}
for (let k = 0; k < botoes.length; k++) {
  botoes[k].addEventListener("click", function () {
    const i = +this.getAttribute("data-i");
    escolher(selecionado === i ? -1 : i);
    if (window.__mirar) window.__mirar(selecionado);
  });
}

/* ------------------------------------------------------------------ o cartão do ESTADO
   Mesma folha de papel do cartão do pino, outro conteúdo. O número é o do Censo 2022 e vem do
   malha-ibge.json; o crédito dele está impresso no painel do censo, embaixo, junto com o da
   malha — a página não afirma número sem dizer de onde ele saiu. */
let ufSel = -1;

// milhar com ponto, à mão e não por toLocaleString: a página é um artefato GERADO, e o cartão
// do link é tirado dela numa máquina que pode ter outro idioma instalado. Formatar aqui é o que
// faz o mesmo comando produzir os mesmos bytes em qualquer lugar.
function milhar(n) {
  const s = String(Math.round(n));
  let saida = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) saida += ".";
    saida += s[i];
  }
  return saida;
}

function montarCartaoUF(k) {
  const uf = D.ufs[k];
  elCartaoP.textContent = "";
  const h = texto(elCartaoP, "h2", "kCidade", uf.nome);
  texto(h, "span", "uf", uf.sigla);
  if (uf.regiao) texto(elCartaoP, "p", "kOnde", "Região " + uf.regiao);

  const bloco = texto(elCartaoP, "div", "kCap");
  texto(bloco, "h3", null, milhar(uf.pop2022) + " pessoas");
  texto(bloco, "p", "kQuando", "População residente, Censo Demográfico 2022");

  // OS CAPÍTULOS QUE ACONTECERAM AQUI — a costura entre a camada nova e a que já existia.
  // Sai de D.pontos, que é o MAPA_PONTOS do jogo: nenhum lugar novo é afirmado.
  const daqui = [];
  for (let i = 0; i < D.pontos.length; i++) {
    if (D.pontos[i].uf === uf.sigla) daqui.push(D.pontos[i]);
  }
  for (let i = 0; i < daqui.length; i++) {
    const p = daqui[i];
    for (let c = 0; c < p.caps.length; c++) {
      const b = texto(elCartaoP, "div", "kCap");
      texto(b, "h3", null, p.caps[c].nome);
      if (p.caps[c].quando) texto(b, "p", "kQuando", p.caps[c].quando);
      texto(b, "p", "kEnd", p.cidade);
    }
  }

  const pe = texto(elCartaoP, "div", "kPe");
  if (daqui.length) {
    const a = texto(pe, "a", "kJogar", "jogar \\u2192");
    a.href = "/jogo/";
  } else {
    texto(pe, "span", "kEnd", "nenhum capítulo do jogo se passa aqui — ainda");
  }
  const b = texto(pe, "button", "kFecha", "fechar");
  b.type = "button";
  b.addEventListener("click", function () { ufEscolhida(-1); });
}

// "calado" existe para escolher() poder fechar o estado sem reentrar: sem ele, fechar o
// estado a partir do pino chamaria escolher(-1) de volta e apagaria o pino recém-aberto.
function ufEscolhida(k, calado) {
  ufSel = k;
  if (window.__realce) window.__realce(k);
  if (k < 0) {
    if (!calado) { document.body.classList.remove("comCartao"); elCartao.classList.remove("aberto"); }
    return;
  }
  selecionado = -1;
  for (let i = 0; i < botoes.length; i++) botoes[i].setAttribute("aria-pressed", "false");
  montarCartaoUF(k);
  document.body.classList.add("comCartao");
  elCartao.classList.add("aberto");
}

document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  escolher(-1); ufEscolhida(-1);
  if (window.__mirar) window.__mirar(-1);
});

/* ------------------------------------------------------------------ WebGL, ou o recuo digno */
function temWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}
if (!temWebGL()) { document.body.classList.add("sem"); throw new Error("sem webgl"); }

/* O three.js viaja inline em dois módulos ESM. Blob URL é o que deixa um importar o outro sem
   arquivo no servidor — e o import é dinâmico porque o endereço só existe em tempo de execução. */
const urlCore = URL.createObjectURL(new Blob([document.getElementById("three-core").textContent], { type: "text/javascript" }));
const fonteMod = document.getElementById("three-mod").textContent.split("./three.core.min.js").join(urlCore);
const urlMod = URL.createObjectURL(new Blob([fonteMod], { type: "text/javascript" }));

let THREE;
try { THREE = await import(urlMod); }
catch (e) { document.body.classList.add("sem"); throw e; }

/* ================================================================== A PLACA
   Projeção: a MESMA equirretangular do jogo (mapaXY), com os mesmos quatro extremos. O contorno
   é estilizado e a página diz isso em voz alta no painel; os pinos são exatos. */
const proj = function (lat, lon) {
  return { x: (lon - D.O) / (D.L - D.O), y: (D.N - lat) / (D.N - D.S) };
};
const LARG = 1;                    // a placa tem 1 unidade de mundo de largura
const ALTURA = LARG * 0.026;       // 2,6% da largura — placa, não bloco
const BISEL = 8 * Math.PI / 180;   // o bisel é medido da PAREDE, não do topo: 8° de saída.
                                   // Do topo seria uma aba de 18% da largura, que não é bisel.
const sombraCor = 0x33240f;

const cena = new THREE.Scene();
cena.background = new THREE.Color(0x0a0806);

const alvoY = ALTURA * 0.5;
const camera = new THREE.PerspectiveCamera(33, 1, 0.05, 40);

const render = new THREE.WebGLRenderer({ canvas: document.getElementById("palco"), antialias: true });
render.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

/* ================================================================== O TOPO É UM MAPA
   O topo era uma chapa de grão repetida 2x2. Passou a ser uma CARTA: o mesmo grão, e por cima
   as divisas das 27 unidades da federação, do IBGE.

   POR QUE NA TEXTURA E NÃO EM GEOMETRIA. Uma divisa desenhada como THREE.Line custa uma
   chamada de desenho por estado, briga com o topo pelo mesmo Z (o z-fighting aparece como
   pontilhado que pisca ao girar) e tem 1 px de largura fixa, que some quando a placa é vista de
   longe e engorda quando a câmera aproxima. Pintada na textura, ela é anti-serrilhada pelo
   canvas, tem largura em TEXEL (ou seja, escala junto com a placa), não acrescenta um triângulo
   sequer e continua cabendo nas MESMAS 19 chamadas de desenho de antes.

   A TEXTURA DEIXOU DE REPETIR, e é isso que a faz virar mapa. O ExtrudeGeometry gera o UV do
   topo a partir do próprio x,y da forma, que vai de -0,5 a 0,5; com repeat 1 e offset 0,5
   esse intervalo vira 0..1 e um texel passa a ter endereço geográfico fixo. Com o repeat 2
   de antes, o mesmo texel aparecia em quatro lugares do país — o que é ótimo para grão e
   impossível para divisa.

   O GRÃO NÃO MUDOU DE ESCALA, e isso foi calculado, não tentado: antes eram 512 px repetidos
   2x, ou seja 1024 texels na largura da placa, com célula de 2 px (1/512 da placa) e 8 células
   de mancha por repetição (16 na placa). Agora são 1024 px sem repetição: célula de 2 px dá o
   MESMO 1/512, e M=16 dá as MESMAS 16 manchas na largura. Muda o sorteio, não o material.

   O QUE A CLIPAGEM RESOLVE DE GRAÇA. O contorno da placa é o desenhado à mão do jogo (zona do
   dono, e a página diz isso em voz alta); a malha do IBGE é geografia exata. Os dois não
   coincidem — medido: 0,40% da largura da placa em média, 3,61% no pior ponto — e o IBGE ainda
   traz as ilhas oceânicas, que caem fora da placa (a leste, até 6,1% além da borda). Um
   ctx.clip() no contorno da placa resolve os três casos de uma vez: o que passa da borda
   simplesmente não é pintado. Sobra o litoral desenhado à mão como litoral, e as divisas
   INTERNAS — que são as exatas, e são as que a lista de aceite pede — inteiras. */
function hash01(k) { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const TEX = D.tex;

/* o contorno da placa em coordenadas de textura. É o MESMO D.contorno que extruda a placa —
   não há uma segunda cópia do litoral para desencontrar da primeira. */
function caminhoPlaca(g) {
  g.beginPath();
  for (let i = 0; i < D.contorno.length; i++) {
    const p = proj(D.contorno[i][0], D.contorno[i][1]);
    const x = p.x * TEX, y = p.y * TEX;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

function caminhoUF(g, uf) {
  g.beginPath();
  for (let a = 0; a < uf.aneis.length; a++) {
    const anel = uf.aneis[a];
    for (let i = 0; i < anel.length; i++) {
      const p = proj(anel[i][1], anel[i][0]);      // o GeoJSON guarda [lon, lat]
      const x = p.x * TEX, y = p.y * TEX;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
  }
}

/* AS DIVISAS — só as INTERNAS, já encadeadas pelo gerador (ver divisasInternas() no Node).
   A borda oceânica de cada estado não entra: ali a divisa é o litoral, e o litoral é a própria
   silhueta da placa. Cada linha aqui é uma aresta que dois estados dividem. */
function tracarDivisas(g) {
  g.lineJoin = "round"; g.lineCap = "round";
  g.strokeStyle = "#8a7147";
  g.lineWidth = 1.7;                                // 1,7 texel ≈ 1,2 px na tela a 1366
  g.beginPath();
  for (let k = 0; k < D.divisas.length; k++) {
    const linha = D.divisas[k];
    for (let i = 0; i < linha.length; i++) {
      const p = proj(linha[i][1], linha[i][0]);
      const x = p.x * TEX, y = p.y * TEX;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
  }
  g.stroke();
}

function fundoDoTopo() {
  const N = TEX, CEL = 2;
  const c = document.createElement("canvas");
  c.width = N; c.height = N;
  const g = c.getContext("2d");
  g.fillStyle = "#e9d8ae"; g.fillRect(0, 0, N, N);
  // mancha larga na segunda cor travada — ruído de valor sobre uma malha de 16, interpolado,
  // para o topo não ser uma chapa lisa de uma cor só
  const M = 16, lat = [];
  for (let j = 0; j <= M; j++) for (let i = 0; i <= M; i++) lat[j * (M + 1) + i] = hash01((i % M) * 41.3 + (j % M) * 97.7 + 13.1);
  const img = g.getImageData(0, 0, N, N), dd = img.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const fx = x / N * M, fy = y / N * M;
    const i0 = Math.floor(fx), j0 = Math.floor(fy), tx = fx - i0, ty = fy - j0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = lat[j0 * (M + 1) + i0], b = lat[j0 * (M + 1) + i0 + 1];
    const cc = lat[(j0 + 1) * (M + 1) + i0], d2 = lat[(j0 + 1) * (M + 1) + i0 + 1];
    const v = (a + (b - a) * sx) + ((cc + (d2 - cc) * sx) - (a + (b - a) * sx)) * sy;
    const k = Math.max(0, Math.min(1, (v - 0.35) * 1.1));       // 0 = #e9d8ae, 1 = #d8c391
    const o = (y * N + x) * 4;
    dd[o] = 233 + (216 - 233) * k; dd[o + 1] = 216 + (195 - 216) * k; dd[o + 2] = 174 + (145 - 174) * k;
  }
  g.putImageData(img, 0, 0);
  for (let y = 0; y < N / CEL; y++) for (let x = 0; x < N / CEL; x++) {
    const s = hash01(x * 57.7 + y * 131.3 + 5.5);
    if (s < 0.11) {
      g.fillStyle = "rgba(51,36,15," + (0.09 + hash01(x * 9.1 + y * 4.3 + 3.7) * 0.11).toFixed(3) + ")";
      g.fillRect(x * CEL, y * CEL, CEL, CEL);
    } else if (s > 0.945) {
      g.fillStyle = "rgba(255,250,232," + (0.08 + hash01(x * 7.9 + y * 5.7 + 6.1) * 0.10).toFixed(3) + ")";
      g.fillRect(x * CEL, y * CEL, CEL, CEL);
    }
  }
  g.save(); caminhoPlaca(g); g.clip(); tracarDivisas(g); g.restore();
  return c;
}

/* DOIS CANVAS, e o segundo é o que paga o realce por um preço que o dedo não sente.
   cvBase guarda grão + divisas e é desenhado UMA vez (é o caro: 1 M de pixels de ruído).
   cvTopo é o que a textura lê; realçar um estado é drawImage(cvBase) + um preenchimento +
   needsUpdate, sem refazer ruído nenhum. Medido no relatório do gerador, abaixo. */
let cvBase = null, cvTopo = null, texTopo = null;
function texturaTopo() {
  cvBase = fundoDoTopo();
  cvTopo = document.createElement("canvas");
  cvTopo.width = cvTopo.height = TEX;
  cvTopo.getContext("2d").drawImage(cvBase, 0, 0);
  const t = new THREE.CanvasTexture(cvTopo);
  // ClampToEdge e não Repeat: a textura deixou de ladrilhar, e um UV que escapasse por
  // arredondamento deve grudar na borda em vez de reaparecer do outro lado do país.
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.offset.set(0.5, 0.5);              // repeat continua 1: o UV -0,5..0,5 do extrude vira 0..1
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(4, render.capabilities.getMaxAnisotropy());
  texTopo = t;
  return t;
}

/* O REALCE. Pintado na MESMA textura, com o MESMO clip — então ele não vaza da placa nem
   quando a geografia do IBGE passa do litoral desenhado à mão, que é o caso em vários pontos
   do Nordeste. Regra "evenodd" no preenchimento porque um estado pode ter anel interno. */
function pintarTopo(iUf) {
  if (!cvTopo) return;
  const g = cvTopo.getContext("2d");
  g.clearRect(0, 0, TEX, TEX);
  g.drawImage(cvBase, 0, 0);
  if (iUf >= 0) {
    g.save();
    caminhoPlaca(g); g.clip();
    g.fillStyle = "rgba(235,167,72,.34)";
    caminhoUF(g, D.ufs[iUf]);
    g.fill("evenodd");
    tracarDivisas(g);                  // o traço volta por cima: realce não apaga divisa
    g.restore();
  }
  texTopo.needsUpdate = true;
}

/* ---- as bandas do toon: três degraus, e o de cima vale 1 para o topo sair EXATAMENTE na cor
   travada. Sem isso, "paleta travada" vira "paleta travada vezes um número qualquer". */
function rampa(passos) {
  const d = new Uint8Array(passos.length);
  for (let i = 0; i < passos.length; i++) d[i] = Math.round(passos[i] * 255);
  const t = new THREE.DataTexture(d, passos.length, 1, THREE.RedFormat);
  t.needsUpdate = true;
  t.minFilter = t.magFilter = THREE.NearestFilter;
  return t;
}
const RAMPA = rampa([0.34, 0.72, 1]);

const A_AMB = 0.34, A_DIR = 0.66;   // somam 1: a banda cheia devolve a cor da textura, sem sobra
cena.add(new THREE.AmbientLight(0xffffff, A_AMB * Math.PI));
// A LUZ É BRANCA de propósito: a paleta é TRAVADA, e luz colorida multiplica canal a canal —
// medido, um sol 0xfff2d8 puxava o azul do topo 15/255 para baixo e a placa saía de outra cor
// que ninguém veria no print. O calor vem da tinta, não da lâmpada.
const sol = new THREE.DirectionalLight(0xffffff, A_DIR * Math.PI);
sol.position.set(-0.55, 1.15, 0.62);
cena.add(sol);

/* ---- a mesa escura */
const mesa = new THREE.Mesh(
  new THREE.PlaneGeometry(9, 9),
  new THREE.MeshToonMaterial({ color: 0x120d08, gradientMap: RAMPA })
);
mesa.rotation.x = -Math.PI / 2;
mesa.position.y = -0.0015;
cena.add(mesa);

/* ---- o contorno vira forma, a forma vira placa */
const forma = new THREE.Shape();
for (let i = 0; i < D.contorno.length; i++) {
  const p = proj(D.contorno[i][0], D.contorno[i][1]);
  const sx = (p.x - 0.5) * LARG, sy = (0.5 - p.y) * LARG;
  if (i === 0) forma.moveTo(sx, sy); else forma.lineTo(sx, sy);
}
forma.closePath();

const espBisel = ALTURA * 0.4;
const geo = new THREE.ExtrudeGeometry(forma, {
  depth: ALTURA - espBisel, bevelEnabled: true, bevelSegments: 2, curveSegments: 1,
  bevelThickness: espBisel, bevelSize: espBisel * Math.tan(BISEL),
});
geo.rotateX(-Math.PI / 2);         // o extrudado sobe em Y; o norte da forma vira -Z

const matTopo = new THREE.MeshToonMaterial({ color: 0xffffff, map: texturaTopo(), gradientMap: RAMPA });
const matLado = new THREE.MeshToonMaterial({ color: sombraCor, gradientMap: RAMPA });
const placa = new THREE.Mesh(geo, [matTopo, matLado]);
cena.add(placa);

/* ---- a sombra: a MESMA silhueta, chapada na mesa, deslocada no sentido oposto ao sol. Um
   mapa de sombra custaria mais e daria a mesma coisa numa cena que não se move. */
const somb = new THREE.Mesh(
  new THREE.ShapeGeometry(forma),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
);
somb.rotation.x = -Math.PI / 2;
somb.position.set(sol.position.x * -0.022, 0.0005, sol.position.z * -0.022);
cena.add(somb);

/* ---- os pinos: brasa em cima de uma haste. A posição é EXATA (lat/lon reais). */
const geoHaste = new THREE.CylinderGeometry(0.0035, 0.0055, 0.05, 10);
const geoCabeca = new THREE.SphereGeometry(0.0125, 14, 10);
const geoBase = new THREE.CylinderGeometry(0.011, 0.013, 0.004, 12);
const pinos = [];
for (let i = 0; i < D.pontos.length; i++) {
  const p = D.pontos[i], q = proj(p.lat, p.lon);
  const g = new THREE.Group();
  g.position.set((q.x - 0.5) * LARG, ALTURA, (q.y - 0.5) * LARG);
  const matPino = new THREE.MeshToonMaterial({ color: 0xeba748, gradientMap: RAMPA });
  const base = new THREE.Mesh(geoBase, matPino); base.position.y = 0.002; g.add(base);
  const haste = new THREE.Mesh(geoHaste, matPino); haste.position.y = 0.029; g.add(haste);
  const matCab = new THREE.MeshBasicMaterial({ color: 0xf3c05c });
  const cab = new THREE.Mesh(geoCabeca, matCab); cab.position.y = 0.061; g.add(cab);
  g.scale.setScalar(0.0001);       // apagado: acende em sequência quando a câmera para
  cena.add(g);
  pinos.push({ grupo: g, cabeca: cab, mat: matCab, matPino: matPino, aceso: 0, mundo: new THREE.Vector3() });
  g.updateMatrixWorld();
  pinos[i].mundo.setFromMatrixPosition(g.matrixWorld).setY(ALTURA + 0.061);
}

/* ================================================================== A CÂMERA
   Um movimento só, 1,4 s, ease-out, e PARA. Sem autorrotação, sem órbita, sem pós. */
const ELEV = 57 * Math.PI / 180;    // 3/4: 57° do horizontal
const dir = new THREE.Vector3(0, Math.sin(ELEV), Math.cos(ELEV)).normalize();
const alvo = new THREE.Vector3(0, alvoY, 0);
let dist = 3, distBase = 3, alvoBase = alvo.clone();

/* A ÁREA LIVRE É MEDIDA NO DOM, não chutada por breakpoint. O cabeçalho e o painel de papel
   ocupam pedaços da tela que mudam de tamanho com a fonte, com o idioma e com a rotação do
   aparelho; um retângulo escrito à mão em % acerta num tamanho e erra em todos os outros —
   é a armadilha do "menu de celular esticado" que já custou uma sessão neste repositório. */
function areaUtil() {
  const W = window.innerWidth, H = window.innerHeight;
  const r = (s) => document.querySelector(s).getBoundingClientRect();
  const cab = [".barra", "h1", ".sub", ".lista"].map(r);
  const censo = r("#censo");
  const folga = 14;
  if (W >= 820) {
    // tela larga: o texto fica na coluna da esquerda e a placa toma o resto
    let esq = censo.right;
    for (let i = 0; i < cab.length; i++) esq = Math.max(esq, cab[i].right);
    const x = Math.min(esq + folga * 2, W * 0.5);
    return { x: x, y: folga, w: W - x - folga * 2.5, h: H - folga * 2 };
  }
  /* tela estreita: a placa vive na faixa entre a última linha do cabeçalho e o painel.

     O PISO É O PAINEL, E ELE NÃO CEDE. A versão anterior, quando a faixa ficava apertada,
     devolvia um retângulo FIXO (22% a 72% da altura) que ignorava onde o painel começava — e o
     painel é papel OPACO. MEDIDO na página publicada: em 390x844 a placa passava 67 px por
     baixo dele e em 360x640, 202 px; ou seja, o Rio Grande do Sul era desenhado atrás de uma
     folha e ninguém o via. Em 360x640 o defeito é ANTERIOR a esta camada (media 144 px sem o
     crédito novo), e a linha do IBGE só o aumentou — mas o conserto é o mesmo.

     A REGRA NOVA: o teto sobe, o piso nunca desce. Quando não cabe, a placa avança para cima —
     sobre o cabeçalho, que é texto claro em fundo escuro e continua legível por cima dela — em
     vez de mergulhar sob o papel. Mapa menor e inteiro vale mais que mapa maior pela metade. */
  const base = censo.top - folga;
  let topo = cab[cab.length - 1].bottom + folga;
  if (base - topo < H * 0.28) topo = Math.max(folga, base - H * 0.28);
  return { x: folga, y: topo, w: W - folga * 2, h: Math.max(60, base - topo) };
}

/* O enquadramento: desloca a lente (setViewOffset) para o centro óptico cair no meio da área
   livre — mover a PLACA em vez da lente a viraria de lado, porque perspectiva não perdoa — e
   depois aperta a distância até o contorno inteiro caber dentro da área, com margem. */
function enquadrar() {
  const W = window.innerWidth, H = window.innerHeight;
  const A = areaUtil();
  const cx = W / 2 - (A.x + A.w / 2), cy = H / 2 - (A.y + A.h / 2);
  camera.setViewOffset(W, H, cx, cy, W, H);

  // tudo medido A PARTIR DO CENTRO DA ÁREA, que é onde a lente deslocada põe o eixo da câmera:
  // é a distância ao eixo que encolhe proporcionalmente quando a câmera se afasta
  const cxN = ((A.x + A.w / 2) / W) * 2 - 1, cyN = 1 - ((A.y + A.h / 2) / H) * 2;
  const meioX = A.w / W, meioY = A.h / H;
  const pontos = [];
  for (let i = 0; i < D.contorno.length; i++) {
    const p = proj(D.contorno[i][0], D.contorno[i][1]);
    const x = (p.x - 0.5) * LARG, z = (p.y - 0.5) * LARG;
    pontos.push(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, ALTURA + 0.075, z));
  }
  let d = 3;
  for (let it = 0; it < 30; it++) {
    camera.position.copy(dir).multiplyScalar(d).add(alvoBase);
    camera.lookAt(alvoBase);
    camera.updateMatrixWorld();
    let pior = 0;
    for (let i = 0; i < pontos.length; i++) {
      const v = pontos[i].clone().project(camera);
      pior = Math.max(pior, Math.abs(v.x - cxN) / meioX, Math.abs(v.y - cyN) / meioY);
    }
    if (!(pior > 0.01)) break;
    d *= pior;
    if (Math.abs(pior - 1) < 0.002) break;
  }
  distBase = d * 1.03;
}

function ajustar() {
  const l = window.innerWidth, a = window.innerHeight;
  camera.aspect = l / a;
  render.setSize(l, a, false);
  camera.updateProjectionMatrix();
  enquadrar();
  if (!miraDe) { dist = distBase; alvo.copy(alvoBase); }
}

/* A mira: o dolly-in de 0,6 s quando um pino é escolhido. É o ÚNICO movimento de câmera depois
   da entrada, e ele também acaba e para.

   O DESTINO É CALCULADO A CADA QUADRO, e não guardado ao tocar — foi um defeito real, achado
   pelo próprio instrumento: girar o aparelho COM O CARTÃO ABERTO deixava a câmera mirando um
   alvo calculado do enquadramento ANTIGO, e 2 dos 5 pinos saíam da tela. Guardar o destino é
   guardar uma cópia do enquadramento; recalculá-lo faz o giro se resolver sozinho. */
let mira = -1, mira0 = 0, miraDe = null, miraDist0 = 0;
const miraPara = new THREE.Vector3();
function destino() {
  if (mira < 0) { miraPara.copy(alvoBase); return distBase; }
  const p = pinos[mira].mundo;
  // MEDIDO nos dois prints: 0,62 da distância (1,6x) transbordava a placa pelos quatro lados
  // e engolia a coluna de texto; 0,8 lê como "chegar perto" sem desmontar o enquadramento.
  miraPara.set(p.x * 0.45, alvoY + 0.02, p.z * 0.45);
  return distBase * 0.8;
}
window.__mirar = function (i) {
  mira0 = performance.now(); mira = i;
  miraDe = alvo.clone(); miraDist0 = dist;
};

/* ================================================================== O TOQUE
   44 px DE TELA, não o tamanho aparente do mesh: o pino do Rio tem poucos pixels e continuaria
   impossível de acertar com o dedo se o alvo fosse a geometria. Projeta cada pino para pixels
   de CSS e pega o mais perto dentro do raio. */
const RAIO = 44;
function pinoPerto(px, py) {
  const l = render.domElement.clientWidth, a = render.domElement.clientHeight;
  let achou = -1, melhor = RAIO * RAIO;
  for (let i = 0; i < pinos.length; i++) {
    const v = pinos[i].mundo.clone().project(camera);
    if (v.z > 1) continue;
    const x = (v.x * 0.5 + 0.5) * l, y = (-v.y * 0.5 + 0.5) * a;
    const d = (x - px) * (x - px) + (y - py) * (y - py);
    if (d < melhor) { melhor = d; achou = i; }
  }
  return achou;
}
/* A COR LIDA DO BUFFER, para o instrumento poder cobrar a paleta travada. Ela re-renderiza
   antes de ler porque o navegador apaga o buffer de desenho ao compor a tela — sem isso, o
   readPixels devolve preto e o instrumento acusaria uma placa preta que ninguém vê.

   O EIXO Y DO readPixels CONTA DE BAIXO, e ele ESTAVA ESPELHADO aqui (consertado em 23/08).
   fx/fy chegam de __centro(), que sai de Vector3.project(): são fração de NDC, e em NDC
   o y cresce PARA CIMA — fy=1 é o topo da tela. O readPixels do WebGL também conta de
   baixo, então a linha certa é altura * fy; a linha antiga era altura * (1 - fy), que é a
   conversão para y de CSS (que conta de cima). O resultado é que o instrumento lia o ESPELHO
   VERTICAL do ponto pedido, refletido no meio do canvas.
   POR QUE SÓ O CELULAR RETRATO ACUSOU, e a primeira explicação que escrevi estava ERRADA (o QA
   cruzado a derrubou com medida): não é "nos outros três a placa nasce no meio". Medida a
   distância entre o ponto e o reflexo em px de CSS — 1366x768: 10 · 1024x768: 8 · 768x1024:
   86 · 390x844: 83. Em 768x1024 o reflexo pula tão longe quanto no celular e mesmo assim lê
   dentro da faixa. O que decide não é a distância absoluta, é ela CONTRA O TAMANHO DA PLACA na
   altura do ponto: 10/396 = 3% · 8/298 = 3% · 86/288 = 30% · 83/169 = **49%**. Só em 390x844 o
   reflexo atravessa metade da placa e chega perto da borda sudoeste, onde lia #c9b78b —
   15/255 fora. Nos outros três ele cai em placa limpa, e o verde era sorte, não saúde.
   Medido depois do conserto: 0/255 nos quatro. */
window.__cor = function (fx, fy) {
  render.render(cena, camera);
  const g = render.getContext();
  const px = new Uint8Array(4);
  const W = render.domElement.width, H = render.domElement.height;
  const x = Math.max(0, Math.min(W - 1, Math.round(W * fx)));
  const y = Math.max(0, Math.min(H - 1, Math.round(H * fy)));   // fy=1 é o TOPO, e o topo do
  g.readPixels(x, y, 1, 1, g.RGBA, g.UNSIGNED_BYTE, px);        // readPixels é H-1
  return [px[0], px[1], px[2]];
};
// a posição do pino em px de CSS — é o que o instrumento (test/ver-territorio.js) precisa para
// mirar DE PROPÓSITO ao lado do mesh e provar que o raio de 44 px existe de verdade
window.__pos = function (i) {
  const l = render.domElement.clientWidth, a = render.domElement.clientHeight;
  const v = pinos[i].mundo.clone().project(camera);
  return { x: (v.x * 0.5 + 0.5) * l, y: (-v.y * 0.5 + 0.5) * a };
};
// o centro do quadrado da projeção cai em Mato Grosso, dentro da placa e longe de pino: é o
// ponto onde a cor do topo se lê sem contaminação
window.__centro = function () {
  const v = new THREE.Vector3(0, ALTURA, 0).project(camera);
  return { fx: v.x * 0.5 + 0.5, fy: v.y * 0.5 + 0.5 };
};
/* QUANTOS PINOS JÁ ACENDERAM. Quem tira o cartão do link (o próprio gerador) precisa provar
   que esperou a brasa terminar — um print tirado cedo mostra a placa certa com os pinos
   apagados, e nada no arquivo denunciaria isso depois. */
window.__acesos = function () { return pinos.filter(function (p) { return p.aceso > 0.9; }).length; };
/* ---------------------------------------------------------- ONDE O DEDO CAIU, EM LATITUDE
   O pino é achado em PIXELS (44 px de tela, porque o alvo é pequeno). O estado é achado em
   GEOGRAFIA: o raio da câmera é cruzado com o plano do topo da placa, o ponto vira lat/lon
   pela projeção inversa e a resposta sai de um ponto-em-polígono na malha do IBGE. É exato por
   construção e não depende de o estado ter um mesh próprio — nenhum estado tem.

   unproject e não um raycaster: a câmera usa setViewOffset para enquadrar a placa na área
   livre, e as duas coisas leem a MESMA projectionMatrixInverse. Um cálculo escrito à mão com
   fov e aspect ignoraria o deslocamento da lente e erraria o alvo exatamente onde a página
   trabalha mais — em tela larga, com a placa fora do centro. */
const planoY = ALTURA;
const auxNDC = new THREE.Vector3(), auxDir = new THREE.Vector3();
function ondeNaPlaca(px, py) {
  const l = render.domElement.clientWidth, a = render.domElement.clientHeight;
  auxNDC.set((px / l) * 2 - 1, -(py / a) * 2 + 1, 0.5).unproject(camera);
  auxDir.copy(auxNDC).sub(camera.position);
  if (Math.abs(auxDir.y) < 1e-9) return null;
  const t = (planoY - camera.position.y) / auxDir.y;
  if (t <= 0) return null;                       // o plano está atrás da câmera
  const x = camera.position.x + auxDir.x * t, z = camera.position.z + auxDir.z * t;
  const fx = x / LARG + 0.5, fy = z / LARG + 0.5;
  if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return null;
  return { lat: D.N - fy * (D.N - D.S), lon: D.O + fx * (D.L - D.O) };
}

/* a caixa de cada estado, calculada uma vez: 27 comparações baratas descartam quase tudo antes
   de a conta cara (5.633 arestas na malha inteira) rodar. É o que deixa o hover seguir o mouse
   sem custar quadro. */
const caixas = D.ufs.map(function (uf) {
  let o = 999, l = -999, n = -999, s = 999;
  for (let a = 0; a < uf.aneis.length; a++) for (let i = 0; i < uf.aneis[a].length; i++) {
    const c = uf.aneis[a][i];
    if (c[0] < o) o = c[0]; if (c[0] > l) l = c[0];
    if (c[1] < s) s = c[1]; if (c[1] > n) n = c[1];
  }
  return { o: o, l: l, n: n, s: s };
});

function ufEm(lat, lon) {
  for (let k = 0; k < D.ufs.length; k++) {
    const b = caixas[k];
    if (lon < b.o || lon > b.l || lat < b.s || lat > b.n) continue;
    // cruzamentos por PARIDADE sobre TODOS os anéis do estado: com anel interno (buraco) a
    // paridade se inverte de novo lá dentro, que é a resposta certa sem tratar buraco à parte.
    let dentro = false;
    const aneis = D.ufs[k].aneis;
    for (let a = 0; a < aneis.length; a++) {
      const anel = aneis[a];
      for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
        const xi = anel[i][0], yi = anel[i][1], xj = anel[j][0], yj = anel[j][1];
        if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) dentro = !dentro;
      }
    }
    if (dentro) return k;
  }
  return -1;
}

window.__realce = pintarTopo;
// o instrumento precisa perguntar "que estado está sob este pixel?" sem fingir um toque
window.__ufNoPixel = function (px, py) {
  const g = ondeNaPlaca(px, py);
  if (!g) return null;
  const k = ufEm(g.lat, g.lon);
  return { lat: g.lat, lon: g.lon, uf: k < 0 ? null : D.ufs[k].sigla };
};
window.__ufSel = function () { return ufSel < 0 ? null : D.ufs[ufSel].sigla; };
// A SILHUETA DA PLACA EM PIXELS DE TELA. O instrumento precisa dela para cobrar que nenhum
// pedaço do país fique atrás do painel de papel — e precisa da silhueta DE VERDADE, não da
// caixa da projeção: a caixa é um retângulo em lat/lon que sobra por todos os lados do
// contorno, e cobrar por ela acusa invasão de 2 px onde não há placa nenhuma (medido em
// 1024x768). Aqui sai o mesmo D.contorno que extruda a placa, ponto a ponto.
window.__contorno = function () {
  const fora = [];
  for (let i = 0; i < D.contorno.length; i++) {
    const p = proj(D.contorno[i][0], D.contorno[i][1]);
    const v = new THREE.Vector3((p.x - 0.5) * LARG, ALTURA, (p.y - 0.5) * LARG).project(camera);
    const l = render.domElement.clientWidth, a = render.domElement.clientHeight;
    fora.push([(v.x * 0.5 + 0.5) * l, (-v.y * 0.5 + 0.5) * a]);
  }
  return fora;
};
// lat/lon -> pixel de CSS. É a ida do caminho que ondeNaPlaca() faz na volta, e o instrumento
// precisa dela para mirar DENTRO de um estado escolhido pelo nome em vez de chutar coordenada
// de tela — que muda a cada largura de viewport.
window.__telaDe = function (lat, lon) {
  const p = proj(lat, lon);
  const v = new THREE.Vector3((p.x - 0.5) * LARG, ALTURA, (p.y - 0.5) * LARG).project(camera);
  const l = render.domElement.clientWidth, a = render.domElement.clientHeight;
  return { x: (v.x * 0.5 + 0.5) * l, y: (-v.y * 0.5 + 0.5) * a };
};
// um ponto BEM DENTRO de cada estado: o vértice da malha mais distante de qualquer divisa serve
// mal (fica no meio de nada mas pode ser numa ilha). Aqui é o ponto interno do polígono mais
// longe da borda entre os candidatos de uma grade grossa — barato e sempre dentro, inclusive
// para estados côncavos, onde o centro da caixa cai FORA (o Pará e o Amazonas são os casos).
window.__dentroDe = function (sigla) {
  let k = -1;
  for (let i = 0; i < D.ufs.length; i++) if (D.ufs[i].sigla === sigla) k = i;
  if (k < 0) return null;
  const b = caixas[k];
  let melhor = null, longe = -1;
  for (let i = 1; i < 24; i++) for (let j = 1; j < 24; j++) {
    const lon = b.o + (b.l - b.o) * i / 24, lat = b.s + (b.n - b.s) * j / 24;
    if (ufEm(lat, lon) !== k) continue;
    let d = Math.min(lon - b.o, b.l - lon, lat - b.s, b.n - lat);
    if (d > longe) { longe = d; melhor = { lat: lat, lon: lon }; }
  }
  return melhor;
};

const palco = render.domElement;
let toqueX = 0, toqueY = 0, toqueT = 0;
palco.addEventListener("pointerdown", function (e) { toqueX = e.clientX; toqueY = e.clientY; toqueT = performance.now(); });
palco.addEventListener("pointerup", function (e) {
  if (performance.now() - toqueT > 700) return;
  if (Math.abs(e.clientX - toqueX) > 12 || Math.abs(e.clientY - toqueY) > 12) return;
  const r = palco.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;
  // O PINO GANHA DO ESTADO, e não é preferência: o pino cabe dentro de um estado, então quem
  // desempatasse pelo estado tornaria todo pino inalcançável.
  const i = pinoPerto(px, py);
  if (i >= 0) { escolher(i !== selecionado ? i : -1); window.__mirar(selecionado); return; }
  const g = ondeNaPlaca(px, py);
  const k = g ? ufEm(g.lat, g.lon) : -1;
  if (selecionado >= 0) { escolher(-1); window.__mirar(-1); }
  ufEscolhida(k >= 0 && k !== ufSel ? k : -1);
});

/* HOVER É DO MOUSE, E SÓ DELE. No celular não existe passar por cima: pointerType de toque
   pinta o estado no instante do toque e o deixaria aceso ao levantar o dedo, o que lê como
   seleção que ninguém fez. O toque decide pelo pointerup acima; aqui é só o mouse. */
let hoverUF = -1;
palco.addEventListener("pointermove", function (e) {
  if (e.pointerType === "touch") return;
  const r = palco.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;
  const sobrePino = pinoPerto(px, py) >= 0;
  const g = sobrePino ? null : ondeNaPlaca(px, py);
  const k = g ? ufEm(g.lat, g.lon) : -1;
  palco.style.cursor = (sobrePino || k >= 0) ? "pointer" : "default";
  if (k === hoverUF) return;
  hoverUF = k;
  // o escolhido manda no realce; o hover só pinta quando não há estado aberto
  if (ufSel < 0) pintarTopo(k);
});
palco.addEventListener("pointerleave", function () {
  hoverUF = -1;
  if (ufSel < 0) pintarTopo(-1);
});

/* ================================================================== O LAÇO
   Nada se move sozinho além da brasa dos pinos — e ela pulsa devagar. */
const T0 = performance.now();
/* QUEM PEDE MENOS MOVIMENTO RECEBE MENOS MOVIMENTO. A entrada e o pulso da brasa são o único
   movimento desta página; com prefers-reduced-motion a câmera já nasce parada, os pinos já
   nascem acesos e a brasa não respira. Não é enfeite: movimento involuntário é gatilho. */
const PARADO = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ENTRADA = PARADO ? 1 : 1400, ESPERA_PINO = PARADO ? 0 : 1400, PASSO_PINO = PARADO ? 0 : 80;
const fora = new THREE.Vector3();
const claro = new THREE.Color(0xf3c05c), quente = new THREE.Color(0xffe0a0);
let quadros = 0, marcado = 0;

function passo(agora) {
  const t = agora - T0;

  // ENTRADA: um movimento só, ease-out, e a câmera para
  const e = Math.min(1, t / ENTRADA);
  const s = 1 - Math.pow(1 - e, 3);
  let d = dist, av = alvo;
  if (miraDe) {
    const dDest = destino();
    const m = Math.min(1, (agora - mira0) / (PARADO ? 1 : 600));
    const ms = 1 - Math.pow(1 - m, 3);
    av = miraDe.clone().lerp(miraPara, ms);
    d = miraDist0 + (dDest - miraDist0) * ms;
    alvo.copy(av); dist = d;
  } else { dist = distBase; alvo.copy(alvoBase); }

  const elev = ELEV + (1 - s) * (15 * Math.PI / 180);
  const dd = fora.set(0, Math.sin(elev), Math.cos(elev)).normalize();
  camera.position.copy(dd).multiplyScalar(dist * (1 + (1 - s) * 0.55)).add(alvo);
  camera.lookAt(alvo);

  // os pinos acendem em sequência, como brasa
  for (let i = 0; i < pinos.length; i++) {
    const p = pinos[i];
    const q = Math.max(0, Math.min(1, (t - ESPERA_PINO - i * PASSO_PINO) / 260));
    p.aceso = q * q * (3 - 2 * q);
    p.grupo.scale.setScalar(Math.max(0.0001, p.aceso));
    if (p.aceso > 0) {
      const pulso = PARADO ? 0.5 : 0.5 + 0.5 * Math.sin(agora / 1450 + i * 1.7);
      const forte = i === selecionado ? 1 : 0.42;
      p.mat.color.copy(claro).lerp(quente, pulso * forte);
      p.cabeca.scale.setScalar((i === selecionado ? 1.18 : 1) + pulso * (i === selecionado ? 0.22 : 0.07));
    }
  }

  render.render(cena, camera);
  quadros++;
  // o PRIMEIRO quadro é o número que importa nesta página: ele mede o custo de engolir 733 KB
  // de three.js inline antes de qualquer pixel. O instrumento o lê e o relatório o publica.
  if (quadros === 1) {
    window.__primeiro = performance.now();
    window.__info = { chamadas: render.info.render.calls, triangulos: render.info.render.triangles };
  }
  if (!marcado && t > ENTRADA + 600) { marcado = 1; window.__pronto = true; }
  window.__quadros = quadros;
  requestAnimationFrame(passo);
}

window.addEventListener("resize", ajustar);
window.addEventListener("orientationchange", ajustar);
ajustar();
dist = distBase;
requestAnimationFrame(passo);
</script>
${MED.script('territorio')}
</body>
</html>
`;

  // GUARDA: a página é autocontida. Nenhum src=/href= de rede, nem fonte do Google — ao
  // contrário das irmãs, esta não pode ter nem isso: ela já carrega o three.js inteiro e
  // uma fonte remota atrasaria o primeiro pixel de uma página que é PURA imagem.
  const externas = (html.match(/(?:src|href)\s*=\s*"(?!\/|#)[^"]*"/g) || [])
    // o próprio domínio (canonical/og:url, growth 21/08) é navegação, não asset — o navegador
    // não BUSCA um canonical; a régua "nada atrasa o primeiro pixel" continua inteira.
    .filter(function (u) { return u.indexOf(BASE) < 0; });
  if (externas.length) throw new Error('RECUSADO: referência externa na página: ' + externas[0]);

  const dir = path.join(RAIZ, 'territorio');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);

  const kb = (html.length / 1024).toFixed(0);
  const gz = (zlib.gzipSync(Buffer.from(html), { level: 9 }).length / 1024).toFixed(0);
  const kbThree = ((three.core.length + three.mod.length) / 1024).toFixed(0);
  console.log('territorio/index.html gerado — ' + D.pontos.length + ' lugares, '
    + D.pontos.reduce((a, p) => a + p.caps.length, 0) + ' capítulos, ' + D.contorno.length + ' pontos de contorno');
  console.log('  peso: ' + kb + ' KB cru, ' + gz + ' KB gzip (three.js inline = ' + kbThree + ' KB dos ' + kb + ')');
  const vert = malha.ufs.reduce((a, u) => a + u.aneis.reduce((b, r) => b + r.length, 0), 0);
  console.log('  geografia: 27 unidades da federação, ' + vert + ' vértices, textura de '
    + TEX + ' px (1 texel = ' + ((D.L - D.O) / TEX).toFixed(4) + '° de longitude)');
  console.log('  divisas internas: ' + divisas.arestas + ' arestas compartilhadas por dois estados, '
    + 'encadeadas em ' + divisas.linhas.length + ' linha(s) — a fronteira do país NÃO é traçada '
    + '(a silhueta da placa já é o litoral)');
  console.log('  ' + malha.procedencia.credito);
  console.log('  a divisa mais próxima da sonda de cor do test/ver-territorio.js está a '
    + sonda.texels.toFixed(1) + ' texels (' + sonda.quem + '), folga exigida ' + FOLGA_SONDA_TEXELS);

  // ------------------------------------------------------- a imagem do cartão do link, da PRÓPRIA página
  //
  // UMA FONTE, DUAS SAÍDAS outra vez, e aqui ela vale ainda mais: a prévia do WhatsApp é a
  // primeira coisa que alguém vê desta seção, e uma imagem desenhada à parte seria a segunda
  // cópia do mapa — o modo de falha que o cabeçalho deste arquivo proíbe (pino no lugar errado
  // é afirmação falsa sobre onde a história aconteceu, e num cartão de link ninguém confere).
  // Então o print é da página que acabou de ser escrita, no tamanho que as redes pedem.
  //
  // POR QUE REUSAR A DO JOGO ESTAVA ERRADO (growth, 21/08): a `compartilhar.jpg` da raiz é HUD
  // de partida. Ela não diz nada sobre mapa nem sobre censo, e um cartão que promete uma coisa
  // e entrega outra gasta o clique de graça.
  //
  // 1200x630 com deviceScaleFactor 1 porque o print sai em pixels de DISPOSITIVO: a 2 ele
  // sairia 2400x1260 e desmentiria as tags og:image:width/height logo acima.
  const shot = path.join(dir, 'compartilhar.jpg');
  const ALVO_PAG = ABRIR('file:///' + path.join(dir, 'index.html').split(path.sep).join('/'));
  // o mesmo flag do test/ver-territorio.js — sem ele o Chromium headless recusa WebGL e a
  // página cai no recuo digno, que é uma tela de texto: cartão vazio, e ninguém veria.
  const nav2 = await chromium.launch({ args: ['--enable-unsafe-swiftshader'], executablePath: ABRIR.chromiumPath() });
  const pg2 = await nav2.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const errosPag = [];
  // A BUILD NÃO PODE DEPENDER DA MEDIÇÃO, e isto foi MEDIDO nesta rodada (02/09). Com o
  // `chromium.launch()` nu consertado, o gerador passou a rodar nesta máquina — e passou a
  // RECUSAR, não pelo cartão, mas porque o POST anônimo para `MEDIDA_HOST` não sai daqui:
  //   RECUSADO: erro na página ao tirar o cartão: console: Failed to load resource: 404
  // O §3 do CLAUDE.md é explícito: "o jogo NUNCA depende dela (adblock, servidor mudo, 503)".
  // Uma build que quebra porque o host da contagem está fora inverte exatamente isso — e o
  // artefato em questão é um JPEG, que não tem nada a ver com o evento. Então a falha de rede
  // DAQUELE host (e só dele, pelo nome que `medir-secao.js` exporta — nada de string solta que
  // envelhece à parte) é anotada e ignorada. Qualquer outro erro continua recusando a build.
  // A ATRIBUIÇÃO NÃO É POR TEXTO, e isso importa: a linha de console do Chromium para um recurso
  // que falhou é "Failed to load resource: …" SEM a URL, então filtrar por ela às cegas engoliria
  // também um 404 de imagem que o cartão precisa. Em vez disso, os pedidos com falha são
  // RECOLHIDOS COM A URL, e as linhas de console de recurso só são perdoadas quando TODA URL que
  // falhou naquela carga é a da medição. Se qualquer outra falhar, tudo volta a recusar.
  const ruidoMedicao = [];
  const urlsFalhas = [];
  const doHostDaMedicao = (u) => u.indexOf(MED.MEDIDA_HOST) === 0;
  const consoleRecurso = [];
  pg2.on('pageerror', (e) => errosPag.push('pageerror: ' + e));
  pg2.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = 'console: ' + m.text();
    (/Failed to load resource/.test(t) ? consoleRecurso : errosPag).push(t);
  });
  pg2.on('requestfailed', (r) => urlsFalhas.push(r.url()));
  pg2.on('response', (r) => { if (r.status() >= 400) urlsFalhas.push(r.url()); });
  await pg2.goto(ALVO_PAG);
  // A FONTE ENTRA CEDO, como na irmã cartao-secao.js. Não toca em NENHUM byte de
  // `territorio/index.html` — vive só nesta página em memória, como o GRAO_FORA do
  // cartao-secao.js.
  //
  // MEDIDO NESTA RODADA (a corrida que só aparecia às vezes): `document.fonts.ready` SOZINHO
  // não basta aqui. Ele resolve "não há carregamento PENDENTE" — e nada fica pendente
  // enquanto nenhum texto da página pediu a família "Gelasio" ainda (a troca que faz isso só
  // acontece bem mais tarde, perto do print). Sem um `document.fonts.load(...)` explícito
  // aqui, duas regenerações seguidas do MESMO comando produziam cartões diferentes: numa a
  // largura já refletia a Gelasio quando a barra recalculava a rolagem, na outra ainda não —
  // e a tábua "O Território" saía cortada só na segunda. `document.fonts.load()` FORÇA a
  // decodificação do base64 (que não depende de rede, mas é assíncrona do mesmo jeito) antes
  // de qualquer leitura de layout depender dela.
  await pg2.addStyleTag({ content: TIPO.css({ defeito: process.env.CARTAO_TIPOGRAFIA_DEFEITO }) });
  await pg2.evaluate(async (familia) => {
    const q = '"' + familia + '"';
    try { await document.fonts.load('700 46px ' + q); } catch (e) { /* status conta a historia, mais abaixo */ }
    try { await document.fonts.load('italic 400 16px ' + q); } catch (e) { /* idem */ }
    try { await document.fonts.ready; } catch (e) { /* idem */ }
  }, TIPO.FAMILIA);
  // `__pronto` marca o fim da ENTRADA da câmera (1400 ms) + 600. Os pinos só terminam de
  // acender em 1400 + 4*80 + 260 = 1980 ms, e o pulso deles fica bom um respiro depois —
  // por isso a espera extra. Print tirado cedo mostraria a placa chegando e pinos apagados.
  await pg2.waitForFunction('window.__pronto === true', null, { timeout: 30000 });
  await pg2.waitForTimeout(900);
  // AS DUAS COBRANÇAS ABAIXO EXISTEM PORQUE O PESO NÃO PEGA NENHUMA DAS DUAS, e isso foi
  // MEDIDO antes de escrevê-las (EQUIPE.md 2.8 — portão que nunca foi visto reprovando é
  // decoração). Injetados os dois defeitos de propósito:
  //   · print aos 300 ms → 0 de 5 pinos acesos, e o JPEG pesa 62 KB;
  //   · Chromium sem WebGL → a página cai no recuo digno (sem mapa nenhum), e pesa 54 KB.
  // Os dois cabem folgados na faixa de 20 a 300 KB. Um cartão de link é a única coisa deste
  // repositório que ninguém revê depois de publicada — o robô da rede social busca uma vez e
  // guarda por semanas. Então quem cobra é o estado da CENA, não o tamanho do arquivo.
  // O DEFEITO ENFIADO DE PROPÓSITO (EQUIPE.md 2.8) — `CARTAO_MUTANTE=m100 node ferramentas/gerar-territorio.js`
  // injeta na página, ANTES das pós-condições, o mutante de mesmo nome de `ferramentas/cartao-censo.js`,
  // e a build TEM de sair 1. Régua de cartão que ninguém viu recusando é decoração, e esta já foi
  // decoração duas vezes: em 23/08 (cobrava esforço) e em 02/09 (cobrava nome). Sem a variável,
  // nada muda — a linha é inerte no caminho normal.
  const MUTANTE = process.env.CARTAO_MUTANTE || '';
  if (MUTANTE) {
    if (!CENSO.MUTANTES[MUTANTE]) throw new Error('CARTAO_MUTANTE desconhecido: ' + MUTANTE + ' (há: ' + Object.keys(CENSO.MUTANTES).join(', ') + ')');
    await pg2.evaluate(CENSO.MUTANTES[MUTANTE]);
    console.log('  !! CARTAO_MUTANTE=' + MUTANTE + ' injetado na página — a build TEM de recusar');
  }
  const semWebGL = await pg2.evaluate(() => document.body.classList.contains('sem'));
  if (semWebGL) throw new Error('RECUSADO: a página caiu no recuo sem WebGL — o cartão sairia sem mapa (medido: 54 KB, dentro da faixa de peso)');
  const acesos = await pg2.evaluate(() => window.__acesos());
  if (acesos !== D.pontos.length) {
    throw new Error('RECUSADO: só ' + acesos + ' de ' + D.pontos.length
      + ' pinos acesos no instante do print — a brasa não terminou (medido: aos 300 ms são 0, e o JPEG pesa 62 KB)');
  }
  // OS CONTROLES SAEM DO CARTÃO, E A EXCLUSÃO É GENÉRICA E BARULHENTA (revista em 23/08).
  //
  // ELA FALHOU UMA VEZ, E EM SILÊNCIO — é por isso que está escrita assim. A versão anterior
  // escondia "#censo .med", que é o PARÁGRAFO. Bastava enquanto o interruptor morava dentro
  // dele; no dia em que ele subiu para a barra de tábuas, a exclusão continuou "funcionando" e
  // parou de excluir o que importava: o JPEG publicado saiu com a tábua MEDIÇÃO/ligada dentro
  // do quadro e com a barra rolada, comendo "A História" e deixando "lossário". Achado pelo QA
  // cruzado comparando os dois JPEGs — nenhum portão olhava os cartões de link.
  //
  // POR QUE NÃO É A VARREDURA DO cartao-secao.js, que é a das outras três seções: lá o sweep
  // esconde TUDO que é fixed/sticky, e aqui isso apagaria a página inteira — nesta seção o
  // "#palco" (o canvas) e o ".env" (a casca do conteúdo) SÃO position:fixed. A generalização
  // certa aqui não é "tudo o que flutua", é "todo CONTROLE": a frase, o botão pelo MESMO id que
  // o módulo da medição exporta (nada de string solta que envelhece à parte), o vão que só
  // existe para reservar lugar a ele, e qualquer coisa que passe a flutuar DENTRO do chrome.
  //
  // E ELA GRITA SE NÃO ACHAR NADA: abaixo de dois alvos o build RECUSA. Exclusão que deixa de
  // excluir tem de quebrar a obra, não a prévia — este é o único artefato que ninguém revê
  // depois de publicado, porque o robô da rede social busca uma vez e guarda por semanas.
  const foraDoCartao = await pg2.evaluate((idBotao) => {
    const ALVOS_CONTROLE = "button, [role=\"button\"], input, select, summary";
    const fora = [];
    const esconder = (e, porque) => {
      if (e && e.style.display !== "none") { e.style.display = "none"; fora.push(porque); }
    };
    document.querySelectorAll(".med").forEach((e) => esconder(e, ".med"));
    esconder(document.getElementById(idBotao), "#" + idBotao);
    document.querySelectorAll(".vaoMedida").forEach((e) => esconder(e, ".vaoMedida"));
    // "FLUTUA E CONVIDA O DEDO" — a regra é do instrumento do QA (test/medir-cartao-controle.js)
    // e é a generalização certa, medida por ele antes de escrita. As duas metades são
    // necessárias: "flutua" (fixed/sticky) é a marca do que existe para acompanhar a ROLAGEM, e
    // rolagem é a única coisa que um JPEG não tem; "convida o dedo" é o que impede a varredura
    // de apagar a página inteira aqui, porque nesta seção o "#palco" (o canvas) e o ".env" (o
    // envelope) são fixed e não são controle de nada. A varredura corre o BODY, não só a barra:
    // o próximo controle a flutuar pode não nascer dentro do chrome.
    document.querySelectorAll("body *").forEach((e) => {
      const s = getComputedStyle(e);
      const flutua = s.position === "fixed" || s.position === "sticky";
      if (flutua && e.matches(ALVOS_CONTROLE)) esconder(e, "controle flutuante: " + (e.id || e.tagName));
    });
    // Com o botão e o vão fora, a barra encolheu, e o scroll-padding que existia SÓ para
    // desviar do botão deixa de ter dono: zerado antes de refazer a rolagem, para o cartão
    // enquadrar a tábua "você está aqui" como enquadrava antes do interruptor existir.
    document.querySelectorAll(".barra").forEach((b) => {
      b.style.scrollPaddingRight = "0px";
      // ZERAR A ROLAGEM ANTES DE REFAZER, e isto foi MEDIDO: inline:"nearest" nao mexe num
      // elemento que ja esta inteiro na vista, entao sem esta linha o cartao HERDA o
      // scrollLeft da carga (calculado com o vao e o scroll-padding ainda de pe) e a barra
      // sai 7 px mais a esquerda que a do cartao anterior. Do zero, o resultado nao depende
      // de nada que aconteceu antes.
      b.scrollLeft = 0;
    });
    // refaz a rolagem em vez de herdar um scrollLeft calculado para outra largura.
    const a = document.querySelector(".barra a.aqui");
    if (a && a.scrollIntoView) a.scrollIntoView({ inline: "nearest", block: "nearest" });
    return fora;
  }, MED.ID_BOTAO);
  console.log('  exclusão do cartão escondeu ' + foraDoCartao.length + ' nó(s): ' + foraDoCartao.join(', '));

  // PÓS-CONDIÇÃO POR CENSO — quem PODE aparecer, não quem é proibido (PENDENTES 67 · 68 · 100).
  //
  // A régua de 23/08 cobrava ESFORÇO ("escondeu pelo menos 2 nós"). A de 02/09 passou a cobrar
  // RESULTADO ("sobrou algum controle?"), e isso pegou os dois mutantes conhecidos — mas continuou
  // reconhecendo o alvo por COMO ELE SE CHAMA (id, `aria-label`, `position`), e o que se chama pode
  // ser renomeado: uma linha a mais (trocar o `id` E o `aria-label` juntos) devolvia a tábua
  // MEDIÇÃO ao recorte com os dois portões verdes. É o PENDENTES 100, com dump.
  //
  // AGORA A LISTA MUDOU DE LADO. O censo pergunta, de todo elemento interativo cujo RETÂNGULO cai
  // dentro do recorte 1200x630 — flutuando ou não, com id ou sem —, se ele está na lista do que
  // este cartão deve conter. A lista é derivada do dado que gerou a página: os links da barra saem
  // do `<nav>` que o `chrome-plataforma.js` acabou de escrever, e as tábuas de lugar saem de
  // `D.pontos`, o mesmo MAPA_PONTOS extraído do jogo lá em cima. Renomear deixou de ser fuga e
  // virou a forma mais rápida de cair FORA da lista.
  //
  // O porquê de não ser "zero interativo no recorte" está medido no cabeçalho de
  // `ferramentas/cartao-censo.js`: são NOVE os elementos interativos legítimos deste cartão (4
  // links da barra + 5 tábuas de lugar), e a régua ingênua reprovaria o desenho certo.
  //
  // UMA FONTE, DOIS CHAMADORES: `test/medir-cartao-controle.js` chama a MESMA função, em vez da
  // cópia que jurava ser idêntica a esta e não era.
  const permitidos = CENSO.permitidosTerritorio(CHROME.barraHtml('territorio'), D.pontos);
  const estranhos = await pg2.evaluate(CENSO.censoDoQuadro,
    [CENSO.L, CENSO.A, permitidos, CENSO.SELETOR_INTERATIVO]);
  if (estranhos.length) {
    throw new Error('RECUSADO: o cartão do TERRITÓRIO tem elemento interativo fora da lista de '
      + 'permitidos dentro do recorte ' + CENSO.L + 'x' + CENSO.A + ': ' + JSON.stringify(estranhos));
  }

  // O ALVO NOMEADO — que o censo acima JÁ SUBSUME, e por isso mesmo fica.
  //
  // Ele era a segunda metade quando a primeira exigia "flutua". Não é mais: o censo pega o
  // interruptor por retângulo, sem perguntar como ele se chama, e foi visto pegando os sete
  // mutantes. Mantê-lo custa um `evaluate` e paga por dois motivos concretos: (1) se algum dia a
  // lista de permitidos for alargada por engano — que é o modo de falha de toda lista positiva —,
  // este aqui continua nomeando o alvo que já quebrou o cartão uma vez; (2) a mensagem de erro
  // dele diz "o interruptor de medição", que é o diagnóstico, enquanto o censo diz "elemento fora
  // da lista", que é o sintoma. Duas leituras discordando é informação; uma só não é.
  //
  // O que ele NÃO é mais: suficiente. Trocar o `id` E o `aria-label` juntos passa por aqui limpo —
  // é o PENDENTES 100, e é o censo que fecha aquilo, não esta função.
  const alvoNomeado = await pg2.evaluate(([L, A, idBotao]) => {
    const porId = document.getElementById(idBotao);
    const porFrase = Array.from(document.querySelectorAll('[aria-label]'))
      .find((e) => /^Medição/.test(e.getAttribute('aria-label') || ''));
    const alvos = [porId, porFrase].filter((e, i, arr) => e && arr.indexOf(e) === i);
    return alvos.map((e) => {
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      const escondido = s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0
        || r.width < 1 || r.height < 1
        || r.right <= 0 || r.bottom <= 0 || r.left >= L || r.top >= A;
      return { alvo: (e.id ? '#' + e.id : e.tagName.toLowerCase()), escondido,
        x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
    });
  }, [1200, 630, MED.ID_BOTAO]);
  const interruptorVisivel = alvoNomeado.filter((a) => !a.escondido);
  if (interruptorVisivel.length) {
    throw new Error('RECUSADO: o interruptor de medição (achado por id ou pela frase "Medição") '
      + 'continua no quadro depois da exclusão: ' + JSON.stringify(interruptorVisivel));
  }
  // A TROCA — o MESMO mecanismo de `cartao-secao.js`: prepende a família embutida a todo
  // elemento cujo font-family declarado é a serifa da casa (nav, h1, corpo do censo — a
  // lista de famílias sai de TIPO.familias(), derivada de CHROME.TITULO/LEITURA, então
  // cobre a pilha exata da barra E as pilhas Georgia-primeiro do corpo desta página, sem
  // precisar listar os dois). IGUALDADE de token, nunca substring (sans-serif CONTÉM serif).
  const trocaT = await pg2.evaluate((cfg) => {
    const lista = (s) => String(s || '').split(',')
      .map((x) => x.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const daCasa = (fam) => lista(fam).some((t) => cfg.familias.indexOf(t) >= 0);
    const alvos = [document.documentElement, document.body,
      ...document.querySelectorAll('body *')]
      .filter((el) => !(cfg.pularTitulo && el.tagName === 'H1'));
    const colhido = alvos.map((el) => [el, getComputedStyle(el).fontFamily])
      .filter(([, fam]) => daCasa(fam));
    colhido.forEach(([el, fam]) => { el.style.fontFamily = '"' + cfg.familia + '",' + fam; });
    return colhido.length;
  }, { familia: TIPO.FAMILIA, familias: TIPO.familias(process.env.CARTAO_TIPOGRAFIA_DEFEITO),
       pularTitulo: TIPO.pularTitulo(process.env.CARTAO_TIPOGRAFIA_DEFEITO) });
  // A TROCA ALARGA A BARRA (a fonte embutida é mais larga que a do host, medido em
  // ferramentas/tipografia-cartao.js), e isso INVALIDA o scrollIntoView que a própria
  // página já tinha feito na carga — com a fonte estreita. Sem refazer, a tábua "aqui"
  // (O Território) sai cortada no cartão, no lugar exato onde antes era a PRIMEIRA que
  // saía (PENDENTES "O QUE SOBROU" item 2 — mesma família de defeito, gatilho novo). Mesma
  // receita que a exclusão de controles já usa: zera o scroll-padding e o scrollLeft antes
  // de refazer, para não herdar um deslocamento calculado para a largura antiga.
  if (trocaT > 0) {
    // POR ARITMÉTICA, NÃO POR `scrollIntoView` — medido nesta rodada: com o botão .medida
    // já escondido (display:none) pela exclusão acima, `scrollIntoView({inline:'nearest'})`
    // devolvia a tábua "aqui" ainda 48 px fora da borda direita da barra (aquiRight 458 x
    // barraRight 409), sem lançar erro — falha silenciosa. offsetLeft/offsetWidth não
    // dependem de heurística de scroll do motor: encostar a borda direita da tábua na borda
    // direita da barra é aritmética, e o clamp final impede um scrollLeft negativo ou além
    // do fim quando a tábua já cabe inteira sem rolar.
    await pg2.evaluate(() => {
      document.querySelectorAll('.barra').forEach((b) => { b.style.scrollPaddingRight = '0px'; });
      const b = document.querySelector('.barra');
      const a = document.querySelector('.barra a.aqui');
      if (!b || !a) return;
      const alvo = (a.offsetLeft + a.offsetWidth) - b.clientWidth;
      b.scrollLeft = Math.max(0, Math.min(alvo, b.scrollWidth - b.clientWidth));
    });
  }

  const fonteT = await pg2.evaluate(async (cfg) => {
    const q = '"' + cfg.familia + '"';
    try { await document.fonts.load('700 46px ' + q); } catch (e) { /* status conta a historia */ }
    try { await document.fonts.ready; } catch (e) { /* idem */ }
    const larg = (fam) => {
      const s = document.createElement('span');
      s.textContent = 'Territorio acoes RSTUVW gjpqy 0123456789';
      s.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:pre;'
        + 'font-size:96px;font-weight:400;font-style:normal;font-family:' + fam;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return Math.round(w * 100) / 100;
    };
    const h1 = document.querySelector('h1');
    const nome = (f) => f.family.replace(/^['"]|['"]$/g, '');
    return {
      carregadas: [...document.fonts].filter((f) => f.status === 'loaded').map(nome),
      estados: [...document.fonts].map((f) => nome(f) + '/' + f.style + ':' + f.status),
      larguraTitulo: h1 ? larg(getComputedStyle(h1).fontFamily) : null,
      larguraEmbutida: larg(q),
      larguraRecuo: larg('"__nenhuma familia com este nome 4f9c__"'),
    };
  }, { familia: TIPO.FAMILIA });

  if (trocaT === 0) {
    throw new Error('RECUSADO: nenhum elemento da página do TERRITÓRIO veste a serifa da casa,'
      + ' então não há o que fixar — o cartão sairia na fonte do host. Confira'
      + ' ferramentas/chrome-plataforma.js e ferramentas/tipografia-cartao.js (FAMILIAS_SERIFA).');
  }
  if (fonteT.carregadas.indexOf(TIPO.FAMILIA) < 0) {
    throw new Error('RECUSADO: a fonte embutida "' + TIPO.FAMILIA + '" não carregou no cartão do'
      + ' TERRITÓRIO — o cartão sairia com a tipografia desta máquina. Estado de document.fonts: '
      + JSON.stringify(fonteT.estados) + '. Confira ferramentas/tipografia/ (os .ttf e o OFL.txt existem?).');
  }
  if (fonteT.larguraTitulo !== fonteT.larguraEmbutida || fonteT.larguraTitulo === fonteT.larguraRecuo) {
    throw new Error('RECUSADO: o título "O território" não está sendo PINTADO na fonte embutida'
      + ' (largura da cadeia de prova: pilha do título ' + fonteT.larguraTitulo + ' px, "'
      + TIPO.FAMILIA + '" ' + fonteT.larguraEmbutida + ' px, recuo do host ' + fonteT.larguraRecuo
      + ' px). Iguais a primeira e a segunda, e diferente da terceira, é o que prova o glifo.');
  }

  await pg2.waitForTimeout(120);
  await pg2.screenshot({ path: shot, type: 'jpeg', quality: 85 });
  await nav2.close();
  // a atribuição das linhas "Failed to load resource", agora que a carga terminou e as URLs que
  // falharam estão todas recolhidas.
  const falhasForaDaMedicao = urlsFalhas.filter((u) => !doHostDaMedicao(u));
  falhasForaDaMedicao.forEach((u) => errosPag.push('recurso falhou: ' + u));
  if (falhasForaDaMedicao.length) errosPag.push.apply(errosPag, consoleRecurso);
  else ruidoMedicao.push.apply(ruidoMedicao, consoleRecurso);
  if (ruidoMedicao.length) {
    console.log('  (a medição não saiu desta máquina e isso NÃO recusa a build — §3: o jogo nunca '
      + 'depende dela: ' + ruidoMedicao.length + ' ocorrência(s), ex.: ' + ruidoMedicao[0] + ')');
  }
  if (errosPag.length) throw new Error('RECUSADO: erro na página ao tirar o cartão: ' + errosPag[0]);

  const kbShot = fs.statSync(shot).size / 1024;
  // e o peso continua valendo para o que ele SABE pegar: acima de 300 KB o robô da prévia
  // desiste de buscar a imagem, e abaixo de 20 KB o JPEG é uma chapa lisa.
  if (kbShot < 20 || kbShot > 300) {
    throw new Error('RECUSADO: territorio/compartilhar.jpg saiu com ' + kbShot.toFixed(0)
      + ' KB — fora da faixa de 20 a 300 KB');
  }
  console.log('  territorio/compartilhar.jpg — 1200x630, qualidade 85, ' + kbShot.toFixed(0) + ' KB · '
    + acesos + ' de ' + D.pontos.length + ' pinos acesos');
})();
