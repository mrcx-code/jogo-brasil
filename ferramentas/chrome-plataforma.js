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
  }
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
`;
}

// A fileira de tábuas. `atual` marca a pressionada: porta | jogo | historia | glossario |
// de-onde-vem | territorio. JOGAR é sempre a primeira depois da marca (5/5 páginas).
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
    </nav>
    <script>(function(){try{var a=document.querySelector('.barra a.aqui');if(a&&a.scrollIntoView)a.scrollIntoView({inline:'nearest',block:'nearest'});}catch(e){}})();</script>`;
}

module.exports = {
  TOKENS, LEITURA, TITULO, MONO,
  VEIO, GRAO,
  tokensCss, barraCss, barraHtml,
};
