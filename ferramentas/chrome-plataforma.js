// CHROME DA PLATAFORMA — a mesma língua visual do jogo, nas páginas de fora dele.
//
// POR QUÊ (arte, 22/08). A plataforma falava três línguas visuais e nenhuma era a do jogo: nav
// de texto com alvo de toque de 21 px, três famílias do Google Fonts contra a serifa da casa, e
// uma tábua JOGAR que era gradiente CSS liso — o mesmo defeito "vetor sobre pixel" que a Onda 11
// matou dentro do jogo. Este módulo é a fonte única do chrome: os tokens exatos, a textura de
// madeira e de papel PRÉ-ASSADAS em data-URI (grão de 2 px, veio horizontal escuro-e-mel,
// portadas de texturaChrome() do src/jogo.ts), a barra de tábuas que substitui a nav de texto, e
// a serifa da casa. Uma fonte, cinco páginas: a porta e os quatro geradores de seção o consomem.
//
// AS TEXTURAS NASCEM EM NODE, sem navegador: o mesmo ruído determinístico do jogo (hash01),
// pintado num buffer RGBA e embrulhado num PNG mínimo. Determinístico byte a byte — sem arte
// nova, sem blob commitado, regenerável. O fallback é sempre `none`, então nada some se algo
// falhar.
const zlib = require('zlib');
// O INTERRUPTOR DA MEDIÇÃO É UMA TÁBUA DESTA BARRA desde 23/08 — a roupa é daqui, a fiação é
// do módulo da medição. Ver `botaoHtml()` lá e `.barra .medida` no `barraCss()` aqui.
const MED = require('./medir-secao.js');

// ---- os tokens EXATOS (arte, 22/08) — os mesmos que a página O TERRITÓRIO já usava ----
const TOKENS = {
  papel: '#e9d8ae', papel2: '#d8c391', tinta: '#33240f',
  madeira: '#7a5430', madeira2: '#6d4b28', madeira3: '#503319',
  contorno: '#191510', ouro: '#eba748', ouro2: '#f3c05c',
};
// A serifa da casa. Leitura e título; o mono é de sistema (nunca Google).
const LEITURA = 'Georgia,"Iowan Old Style","Times New Roman","Noto Serif",serif';
const TITULO = '"Palatino Linotype",Palatino,Georgia,serif';
const MONO = 'ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace';

// ---- hash01: o MESMO ruído do jogo (src/jogo.ts) ----
function hash01(k) {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ---- PNG mínimo (RGBA, sem filtro, deflate) ----
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function png(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}
function novoBuf(w, h) { return Buffer.alloc(w * h * 4); } // tudo transparente
function pinta(buf, W, px, py, pw, ph, r, g, b, a) {
  const A = Math.max(0, Math.min(255, Math.round(a * 255)));
  for (let y = py; y < py + ph; y++) {
    for (let x = px; x < px + pw; x++) {
      const o = (y * W + x) * 4;
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = A;
    }
  }
}
function uri(w, h, buf) {
  return 'url(data:image/png;base64,' + png(w, h, buf).toString('base64') + ')';
}

// --veioPx: TÁBUA SERRADA — riscos horizontais em runs irregulares, escuro e mel.
// Portado de texturaChrome() do jogo, cel=2 (1 grão = 2 px). 64x48 células -> 128x96 px.
function texVeio() {
  const cel = 2, cols = 64, lins = 48, W = cols * cel, H = lins * cel;
  const buf = novoBuf(W, H);
  for (let y = 0; y < lins; y++) {
    let x = 0;
    while (x < cols) {
      const run = 3 + Math.floor(hash01(y * 17.9 + x * 3.7 + 4.2) * 8);
      const s = hash01(y * 131.7 + x * 7.3 + 9.1);
      const w = Math.min(run, cols - x);
      if (s < 0.20) {
        pinta(buf, W, x * cel, y * cel, w * cel, cel, 26, 13, 3,
          0.10 + hash01(x * 5.1 + y * 2.7 + 1.3) * 0.10);
      } else if (s < 0.33) {
        pinta(buf, W, x * cel, y * cel, w * cel, cel, 255, 199, 112,
          0.05 + hash01(x * 6.7 + y * 3.9 + 2.6) * 0.07);
      }
      x += run;
    }
  }
  return { uri: uri(W, H, buf), w: W, h: H };
}
// --graoPx: PEDRA/PAPEL LAVRADO — speckle disperso, poro escuro e cisco claro. 48x48 -> 96x96.
function texGrao(forca) {
  const cel = 2, n = 48, W = n * cel, H = n * cel;
  const buf = novoBuf(W, H);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const s = hash01(x * 57.7 + y * 131.3 + 5.5);
    if (s < 0.11) {
      pinta(buf, W, x * cel, y * cel, cel, cel, 28, 22, 11,
        (0.09 + hash01(x * 9.1 + y * 4.3 + 3.7) * 0.11) * forca);
    } else if (s > 0.945) {
      pinta(buf, W, x * cel, y * cel, cel, cel, 255, 250, 232,
        (0.08 + hash01(x * 7.9 + y * 5.7 + 6.1) * 0.10) * forca);
    }
  }
  return { uri: uri(W, H, buf), w: W, h: H };
}

const VEIO = texVeio();
const GRAO = texGrao(1);

// ---- CSS: os tokens do chrome, como um :root que soma aos que a página já tem ----
function tokensCss() {
  return `  /* chrome-plataforma.js — a língua visual do jogo (arte, 22/08). NÃO editar aqui:
     a fonte é ferramentas/chrome-plataforma.js e o build regenera. */
  :root{
    --ch-papel:${TOKENS.papel}; --ch-papel2:${TOKENS.papel2}; --ch-tinta:${TOKENS.tinta};
    --madeira:${TOKENS.madeira}; --madeira2:${TOKENS.madeira2}; --madeira3:${TOKENS.madeira3};
    --contorno:${TOKENS.contorno}; --ouro:${TOKENS.ouro}; --ouro2:${TOKENS.ouro2};
    --leitura:${LEITURA}; --titulo:${TITULO}; --mono:${MONO};
    --veioPx:${VEIO.uri};
    --graoPx:${GRAO.uri};
    /* A PAUTA DO CADERNO — portada de src/estilo.css (a mesma receita da caixa de fala do
       jogo): risco de 1px a cada 11px, e 11 é METADE da entrelinha de 22 do corpo de leitura,
       o que faz a linha de texto POUSAR na pauta em vez de flutuar sobre ela (onda 6 do jogo).
       É MEDIDA, não cópia — o valor viajou, o arquivo não. */
    --pauta:repeating-linear-gradient(0deg, rgba(120,90,40,.06) 0 1px, transparent 1px 11px);
  }
`;
}

// ---- O VÉU DO MENU — a luz do jogo, para quem tem MATA atrás (onda 4 da costura, 22/08) ----
// A mesma luz que o jogo baixa sobre a pintura na tela de abertura, portada de `#telaMenu`
// (src/estilo.css): .30 no céu, .06 no meio, .10 aos 62% e .52 no pé, na tinta rgba(10,9,6).
// É MEDIDA, não cópia — o valor viajou, o arquivo não, como o `--pauta` acima.
//
// POR QUE FORA DO tokensCss(), e é decisão: só a PORTA tem hero de mata; as quatro seções de
// leitura são papel e nunca usariam este token. Um token que ninguém usa em 4 de 5 páginas é
// peso e ruído nelas — e mexer nos bytes delas para servir a porta é a definição de acoplar
// sem motivo. Fica aqui, na fonte única, para a próxima página com pintura atrás achá-lo.
function veuCss() {
  return `  /* A COSTURA PORTA->JOGO (onda 4, 22/08): a porta é a CLAREIRA antes do poste, então ela
     usa o VÉU DO POSTE em vez de inventar um escurecimento próprio. Fonte: chrome-plataforma.js */
  :root{
    --veuMenu:linear-gradient(180deg, rgba(10,9,6,.30) 0%, rgba(10,9,6,.06) 34%,
                                      rgba(10,9,6,.10) 62%, rgba(10,9,6,.52) 100%);
  }
`;
}

// ---- O PAPEL DE CAMPO — a matéria de leitura das seções (onda 3 da arte, 22/08) ----
// A disciplina que a arte cravou, virada em três regras de CSS reusáveis pelas 3 seções:
//   .fundoCampo  — o FUNDO da página (o body): papel + pauta discreta + grão SUTIL. É o "desk".
//                  O grão vive aqui e nas faixas/cartões, NUNCA sozinho atrás de coluna longa.
//   .cartaoCampo — o cartão (verbete/momento): papel + pauta, FIO DE MADEIRA (inset da casa) e
//                  SEM grão. É ele que MASCARA o grão do fundo atrás do texto corrido — a
//                  coluna de leitura senta em papel limpo, com a pauta como única textura.
//   .faixaCampo  — faixa/realce curto (a nota "quem lê hoje", um selo): papel2 + grão. Material,
//                  não coluna — texto curto, então o grão pode estar atrás sem cansar o olho.
// A CITAÇÃO/FONTE é itálico serifado (não mais o mono): a voz de quem cita, não de máquina.
function campoCss() {
  return `  /* onda 3 da arte (22/08): papel de campo nas seções de leitura. Fonte: chrome-plataforma.js */
  .fundoCampo{ background:var(--graoPx,none), var(--pauta), var(--papel); }
  .cartaoCampo{ position:relative; background:var(--pauta), linear-gradient(180deg,var(--papel),var(--papel2));
    border:0; border-radius:3px;
    box-shadow: inset 0 0 0 2px var(--contorno,#191510), inset 0 0 0 4px var(--madeira,#7a5430),
                0 3px 0 rgba(10,8,6,.28), 0 6px 14px rgba(0,0,0,.16); }
  .faixaCampo{ background:var(--graoPx,none), var(--papel2); }
  .citaCampo{ font-family:var(--leitura); font-style:italic; }
`;
}

// ---- A BARRA DE TÁBUAS — substitui a nav de texto. Alvo >=44px, uma linha, rola no estreito ----
function barraCss() {
  return `  /* A BARRA DE TÁBUAS (arte, 22/08): fileira de tábuas de madeira com o veio como
     PRIMEIRA camada de background e o contorno da casa. JOGAR sempre presente e primeiro depois
     da marca; a página atual é a tábua escura "pressionada". Alvo de toque >=44x44; UMA linha
     sempre (nowrap); em tela estreita rola na horizontal, nunca quebra. */
  .barra{ display:flex; flex-wrap:nowrap; align-items:stretch; gap:6px; margin:0 0 1.7rem;
    padding:7px; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch;
    scrollbar-width:none; background:transparent; }
  .barra::-webkit-scrollbar{ height:0; display:none; }
  .barra a{ flex:0 0 auto; display:flex; align-items:center; justify-content:center;
    min-height:44px; padding:0 15px; text-decoration:none; white-space:nowrap;
    font:600 .82rem/1 "Palatino Linotype",Palatino,Georgia,serif; letter-spacing:.02em;
    color:#fff4e0; border-radius:3px;
    background:var(--veioPx,none), linear-gradient(180deg,var(--madeira),var(--madeira2) 55%,var(--madeira3));
    box-shadow: inset 0 2px 0 rgba(255,222,170,.24), inset 0 -3px 0 rgba(0,0,0,.34),
                inset 0 0 0 2px var(--contorno), 0 3px 0 rgba(0,0,0,.4);
    text-shadow:0 2px 0 rgba(0,0,0,.45); transition:filter .14s,transform .1s; }
  .barra a:hover{ filter:brightness(1.08); }
  .barra a:active{ transform:translateY(1px); }
  /* TINTA ÚNICA (arte, 22/08): uma regra só na barra — o dourado marca AÇÃO (JOGAR) e
     ONDE-VOCÊ-ESTÁ (.aqui); todo o resto, inclusive a marca BRASIL, é creme. A marca se
     distingue por peso e espaçamento, não por cor, para o dourado ter um único significado. */
  .barra a.marca{ font-weight:700; letter-spacing:.16em; }
  .barra a.jogar{ font-weight:700; color:var(--ouro2); }
  .barra a.aqui{ color:var(--ouro2); cursor:default;
    background:var(--veioPx,none), linear-gradient(180deg,#2c1c0b,#20140a);
    box-shadow: inset 0 3px 7px rgba(0,0,0,.6), inset 0 0 0 2px var(--contorno);
    transform:translateY(1px); text-shadow:0 1px 0 rgba(0,0,0,.6); }
  .barra a.aqui:hover{ filter:none; }

  /* O INTERRUPTOR DA MEDIÇÃO (23/08) — a única tábua que não é link, e a única GRUDADA.
     POR QUE ELE SUBIU: o jurídico mediu que, no rodapé, ele ficava a 116 telas de rolagem do
     topo em algumas páginas. O dono decidiu manter a medição ligada por padrão, e a condição
     para isso ser defensável é desligar ser fácil — o que quer dizer alcançável de qualquer
     página, sem procurar.
     POR QUE ELE E STICKY E NAO A SETIMA TABUA DA FILA: a 390 px a barra transborda, e uma sétima tábua no
     fim nasceria FORA da vista — exatamente o defeito que a .aqui já pagou (ver o
     scrollIntoView abaixo). Grudado à direita ele fica visível em qualquer posição de rolagem
     da barra, e sem wrapper nenhum: a barra continua sendo UM elemento, que é o que o
     areaUtil() do TERRITÓRIO mede e o que o portão conta como uma linha.
     O CUSTO, DITO: ele cobre ~80 px da direita da barra enquanto ela está rolada; as tábuas
     por baixo continuam alcançáveis rolando, e nenhuma delas some — só o vão da direita
     encolhe. Era isso ou a sétima tábua invisível.
     DUAS LINHAS porque o estado tem de ser LEGÍVEL SEM TOCAR: rótulo fixo em cima, estado
     embaixo. Alvo >=44x44 como as outras, e sem uma cor nova: ligada é a tábua levantada,
     desligada é a tábua afundada (a mesma gramática do .aqui). O dourado continua com um
     significado só — ação e onde-você-está —, então ele não entra aqui. */
  .barra .medida{ flex:0 0 auto; position:sticky; right:0; z-index:2;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    min-height:44px; min-width:44px; padding:0 11px; border:0; cursor:pointer;
    color:#fff4e0; border-radius:3px;
    font-family:"Palatino Linotype",Palatino,Georgia,serif;
    background:var(--veioPx,none), linear-gradient(180deg,var(--madeira),var(--madeira2) 55%,var(--madeira3));
    box-shadow: inset 0 2px 0 rgba(255,222,170,.24), inset 0 -3px 0 rgba(0,0,0,.34),
                inset 0 0 0 2px var(--contorno), 0 3px 0 rgba(0,0,0,.4),
                -9px 0 12px rgba(10,8,6,.55);
    text-shadow:0 2px 0 rgba(0,0,0,.45); transition:filter .14s; }
  .barra .medida .medRot{ font-size:.55rem; line-height:1.1; letter-spacing:.1em;
    text-transform:uppercase; opacity:.72; }
  .barra .medida .medEst{ font-size:.78rem; line-height:1.15; font-weight:700; letter-spacing:.01em; }
  .barra .medida:hover{ filter:brightness(1.08); }
  .barra .medida:active{ transform:translateY(1px); }
  .barra .medida[aria-pressed="false"]{
    background:var(--veioPx,none), linear-gradient(180deg,#2c1c0b,#20140a);
    box-shadow: inset 0 3px 7px rgba(0,0,0,.6), inset 0 0 0 2px var(--contorno),
                -9px 0 12px rgba(10,8,6,.55); }
  .barra .medida[aria-pressed="false"] .medEst{ color:#c3b096; }
  /* O VÃO ATRÁS DO INTERRUPTOR, e ele conserta um defeito que o primeiro print mostrou: na
     página O TERRITÓRIO a tábua .aqui é a ÚLTIMA, a barra rola até ela na carga, e ela parava
     EMBAIXO do interruptor grudado — sobrava a letra "O" de "O Território". Ou seja, a mesma
     falha de "ninguém sabia onde estava" que o scrollIntoView tinha resolvido, de volta por
     outra porta. São duas peças e as duas são necessárias: o VÃO cria a rolagem extra para
     existir uma posição em que a última tábua não fica sob o interruptor, e o
     scroll-padding-right faz o scrollIntoView PARAR nessa posição em vez de encostar a tábua
     na borda. Sem o vão o navegador grampeia no fim e a tábua volta para baixo do botão. */
  .barra{ scroll-padding-right:86px; }
  .barra .vaoMedida{ flex:0 0 78px; }
`;
}

// A fileira de tábuas. atual marca a pressionada: porta | jogo | historia | glossario |
// de-onde-vem | territorio. JOGAR é sempre a primeira depois da marca (5/5 páginas), e o
// INTERRUPTOR DA MEDIÇÃO é sempre o último — grudado à direita, em 5/5 (ver .barra .medida).
function barraHtml(atual) {
  const marcado = (k) => (k === atual ? ' aqui' : '');
  const tabuas = [
    ['jogo', '/jogo/', 'Jogar', ' jogar'],
    ['historia', '/historia', 'A História', ''],
    ['glossario', '/glossario', 'Glossário', ''],
    ['de-onde-vem', '/de-onde-vem', 'De Onde Vem', ''],
    ['territorio', '/territorio', 'O Território', ''],
  ];
  const linhas = tabuas.map(function (t) {
    return `      <a href="${t[1]}" class="tabua${t[3]}${marcado(t[0])}">${t[2]}</a>`;
  }).join('\n');
  // A TÁBUA ATUAL SEMPRE VISÍVEL (arte, 22/08): a 390px a barra transborda e a .aqui do
  // TERRITÓRIO (5ª) e do DE ONDE VEM (4ª) nasce FORA da vista — ninguém sabia "você está aqui".
  // Um scrollIntoView na carga rola SÓ a barra (inline:nearest), nunca a página (block:nearest).
  // O script vem logo após o <nav>, então o alvo já existe quando ele roda; o try/catch e a
  // guarda de scrollIntoView deixam a barra intacta se algo faltar.
  return `    <nav class="barra" aria-label="Seções da plataforma BRASIL">
      <a href="/" class="marca${marcado('porta')}">BRASIL</a>
${linhas}
      ${MED.botaoHtml()}<span class="vaoMedida" aria-hidden="true"></span>
    </nav>
    <script>(function(){try{var a=document.querySelector('.barra a.aqui');if(a&&a.scrollIntoView)a.scrollIntoView({inline:'nearest',block:'nearest'});}catch(e){}})();</script>`;
}

module.exports = {
  TOKENS, LEITURA, TITULO, MONO,
  VEIO, GRAO,
  tokensCss, barraCss, barraHtml, campoCss, veuCss,
};
