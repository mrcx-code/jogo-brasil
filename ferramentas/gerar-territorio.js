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
  const dir = path.join(RAIZ, 'node_modules', 'three', 'build');
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

(async () => {
  const three = lerThree();

  // ------------------------------------------------------------ a frase da honestidade, verbatim
  const fonteTs = fs.readFileSync(path.join(RAIZ, 'src', 'jogo.ts'), 'utf8');
  const mHon = fonteTs.match(/linha\(rod,\s*"(O contorno é desenhado à mão[^"]*)"/);
  if (!mHon) throw new Error('RECUSADO: não achei a frase do contorno em src/jogo.ts — ela não pode ser redigitada');
  const honestidade = mHon[1];

  // ------------------------------------------------------------------- os dados, do jogo rodando
  const nav = await chromium.launch();
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
  :root {
    --fundo:#0a0806; --mesa:#120d08;
    --topo:#e9d8ae; --topo2:#d8c391; --sombra:#33240f;
    --pino:#eba748; --pino2:#f3c05c;
    --papel:#efe6d2; --papelB:#ded2b6; --tinta:#211a10; --tinta2:#5a4c36; --pedra:#857658;
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

  .nav { display:flex; flex-wrap:wrap; gap:.3rem .95rem; margin:0 0 .55rem;
    font:600 .68rem/1.4 ui-monospace,"SFMono-Regular",Menlo,monospace; letter-spacing:.1em;
    text-transform:uppercase; }
  .nav a { text-decoration:none; color:#9c8f74; }
  .nav a:hover { color:var(--pino2); }
  .nav a.marca { color:var(--topo); font-weight:700; letter-spacing:.14em; }
  .nav a.aqui { color:var(--pino); cursor:default; }

  /* width:fit-content nos blocos do cabeçalho não é estética: é o que faz o retângulo deles
     medir o TEXTO. A câmera enquadra a placa na área livre MEDIDA no DOM, e um <h1> que ocupa
     a largura inteira (como todo bloco ocupa) diria que não sobrou área nenhuma. */
  .nav, h1, .sub, .lista { width:fit-content; max-width:100%; }
  h1 { margin:0; font:400 clamp(1.35rem,5.2vw,2.1rem)/1.15 Georgia,serif; letter-spacing:.01em;
    color:var(--topo); }
  .sub { margin:.25rem 0 0; max-width:min(34ch,100%); font-size:clamp(.82rem,3.1vw,.95rem);
    color:#9c8f74; line-height:1.45; }

  .lista { display:flex; flex-wrap:wrap; gap:.4rem; margin:.7rem 0 0; }
  .pl { appearance:none; font:400 .82rem/1 Georgia,serif; letter-spacing:.01em;
    background:rgba(233,216,174,.06); border:1px solid rgba(233,216,174,.18);
    color:#c4b492; border-radius:2px; padding:.44rem .62rem; cursor:pointer; }
  .pl .uf { color:var(--pino); font:600 .68rem/1 ui-monospace,monospace; letter-spacing:.06em; }
  .pl:hover, .pl:focus-visible { border-color:var(--pino); color:var(--topo); outline:none; }
  .pl[aria-pressed="true"] { background:rgba(235,167,72,.16); border-color:var(--pino); color:var(--topo); }

  .cresce { flex:1 1 auto; min-height:0; }

  /* O CENSO EM PAPEL — painel, não HUD. Ele fica no canto de baixo e não flutua sobre o mapa
     como um número solto: é uma folha apoiada na mesa, com a fonte impressa embaixo. */
  .papel { background:linear-gradient(180deg,var(--papel),var(--papelB));
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
  body.sem #palco { display:none; }
  body.sem #semwebgl { display:block; }

  @media (min-width:820px) {
    .env { padding:1.5rem 1.6rem; }
    /* COLUNA DE TEXTO À ESQUERDA, PLACA À DIREITA. A largura da coluna é travada em 24rem
       porque é ela que decide onde a área livre da placa começa — deixar a fila de lugares
       correr solta empurrava a placa para 71% da largura e abria um vazio no meio da tela. */
    .nav, h1, .sub, .lista { max-width:24rem; }
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
    <nav class="nav">
      <a href="/" class="marca">BRASIL</a>
      <a href="/historia">A História</a>
      <a href="/glossario">Glossário</a>
      <a href="/de-onde-vem">De Onde Vem</a>
      <a href="/territorio" class="aqui">O Território</a>
    </nav>
    <h1>O território</h1>
    <p class="sub">Os lugares onde cada capítulo do jogo aconteceu. Toque num pino.</p>
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
  </section>

  <section class="papel" id="semwebgl">
    <h2>Este aparelho não desenha em 3D.</h2>
    <p>A placa em relevo precisa de WebGL, e o navegador aqui não o oferece. Os lugares
      continuam acima: toque no nome de qualquer um para ler o cartão.</p>
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
document.addEventListener("keydown", function (e) { if (e.key === "Escape") { escolher(-1); if (window.__mirar) window.__mirar(-1); } });

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

/* ---- o grão do topo: o MESMO hash01 e as MESMAS doses da Onda 11 (poro 11%, cisco 5,5%),
   e é por isso que a placa parece do mesmo material que o chrome do jogo. Zero byte de arte. */
function hash01(k) { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function texturaTopo() {
  const N = 512, CEL = 2;
  const c = document.createElement("canvas");
  c.width = N; c.height = N;
  const g = c.getContext("2d");
  g.fillStyle = "#e9d8ae"; g.fillRect(0, 0, N, N);
  // mancha larga na segunda cor travada — ruído de valor sobre uma malha de 8, interpolado,
  // para o topo não ser uma chapa lisa de uma cor só
  const M = 8, lat = [];
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
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.offset.set(0.5, 0.5);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(4, render.capabilities.getMaxAnisotropy());
  return t;
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
  const cab = [".nav", "h1", ".sub", ".lista"].map(r);
  const censo = r("#censo");
  const folga = 14;
  if (W >= 820) {
    // tela larga: o texto fica na coluna da esquerda e a placa toma o resto
    let esq = censo.right;
    for (let i = 0; i < cab.length; i++) esq = Math.max(esq, cab[i].right);
    const x = Math.min(esq + folga * 2, W * 0.5);
    return { x: x, y: folga, w: W - x - folga * 2.5, h: H - folga * 2 };
  }
  // tela estreita: a placa vive na faixa entre a última linha do cabeçalho e o painel
  const topo = cab[cab.length - 1].bottom + folga;
  const base = censo.top - folga;
  if (base - topo < H * 0.28) return { x: folga, y: H * 0.22, w: W - folga * 2, h: H * 0.5 };
  return { x: folga, y: topo, w: W - folga * 2, h: base - topo };
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
   readPixels devolve preto e o instrumento acusaria uma placa preta que ninguém vê. */
window.__cor = function (fx, fy) {
  render.render(cena, camera);
  const g = render.getContext();
  const px = new Uint8Array(4);
  g.readPixels(Math.round(render.domElement.width * fx), Math.round(render.domElement.height * (1 - fy)),
    1, 1, g.RGBA, g.UNSIGNED_BYTE, px);
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
const palco = render.domElement;
let toqueX = 0, toqueY = 0, toqueT = 0;
palco.addEventListener("pointerdown", function (e) { toqueX = e.clientX; toqueY = e.clientY; toqueT = performance.now(); });
palco.addEventListener("pointerup", function (e) {
  if (performance.now() - toqueT > 700) return;
  if (Math.abs(e.clientX - toqueX) > 12 || Math.abs(e.clientY - toqueY) > 12) return;
  const r = palco.getBoundingClientRect();
  const i = pinoPerto(e.clientX - r.left, e.clientY - r.top);
  escolher(i >= 0 && i !== selecionado ? i : -1);
  window.__mirar(selecionado);
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
  const nav2 = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const pg2 = await nav2.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const errosPag = [];
  pg2.on('pageerror', (e) => errosPag.push('pageerror: ' + e));
  pg2.on('console', (m) => { if (m.type() === 'error') errosPag.push('console: ' + m.text()); });
  await pg2.goto(ALVO_PAG);
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
  const semWebGL = await pg2.evaluate(() => document.body.classList.contains('sem'));
  if (semWebGL) throw new Error('RECUSADO: a página caiu no recuo sem WebGL — o cartão sairia sem mapa (medido: 54 KB, dentro da faixa de peso)');
  const acesos = await pg2.evaluate(() => window.__acesos());
  if (acesos !== D.pontos.length) {
    throw new Error('RECUSADO: só ' + acesos + ' de ' + D.pontos.length
      + ' pinos acesos no instante do print — a brasa não terminou (medido: aos 300 ms são 0, e o JPEG pesa 62 KB)');
  }
  await pg2.screenshot({ path: shot, type: 'jpeg', quality: 85 });
  await nav2.close();
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
