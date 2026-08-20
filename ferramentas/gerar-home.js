// GERA A HOME DA PLATAFORMA — a proposta como página, decidida pelo dono em 19/08.
//
// O dono decidiu que as páginas são A CARA da plataforma, e que a home "deveria ser um pouco da
// proposta em si". Esta é essa página: apresenta o que a plataforma é e aponta para as quatro
// entradas — o jogo (o chamariz), e as três seções de leitura (A HISTÓRIA, O GLOSSÁRIO, DE ONDE
// VEM). Cada cartão traz um número real, extraído do jogo (uma fonte, duas saídas).
//
// RASCUNHO, e por um motivo de arquitetura que é do dono, não meu: hoje matheusferreira.cc/ é o
// JOGO (index.html da raiz, com os pack-*.json ao lado). Pôr esta home na raiz moveria o jogo
// para outra URL — decisão de estrutura que o dono precisa tomar. Por isso o gerador escreve em
// `plataforma/index.html` e NÃO está no loop de seções do build. Quando ele decidir onde ela
// mora (raiz com o jogo em /jogo, ou um subcaminho como /inicio), aí publica.
//
// O §1 vale (mão leve, a proposta não é palanque) e o §2 também: o texto de proposta é o mesmo
// que o dono já aprovou para a faixa da home do jogo.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('../test/abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const ALVO = ABRIR('file:///' + path.join(RAIZ, 'index.html').split(path.sep).join('/'));

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.goto(ALVO);
  await pg.waitForTimeout(1800);
  const num = await pg.evaluate(() => ({
    capitulos: EPOCAS.length,
    momentos: LINHA_TEMPO.filter((x) => x.tipo === 'momento' && x.f).length,
    verbetes: GLOSSARIO.filter((v) => v.t).length,
    fontes: FONTES.filter((f) => f.t).length,
  }));
  await nav.close();

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="BRASIL — uma plataforma de conhecimento sobre a história do Brasil, de quem já estava aqui até hoje. Um jogo, uma linha do tempo, um glossário e as fontes de tudo.">
<meta property="og:title" content="BRASIL — uma plataforma de conhecimento">
<meta property="og:description" content="A história do Brasil, de quem já estava aqui até hoje. Jogue, leia, descubra — cada afirmação com fonte.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,500;0,700;1,500&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap">
<title>BRASIL — uma plataforma de conhecimento</title>
<style>
  :root {
    --papel:#f3eee2; --papel2:#e9e2d1; --tinta:#1d2119; --tinta2:#4a5147;
    --pedra:#7d8479; --mata:#2f5230; --terra:#7a4a24; --brasa:#b5541f;
    --linha:#d3cab5; --realce:#ffffff; --sombra:rgba(29,33,25,.07);
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --papel:#14170f; --papel2:#1c2016; --tinta:#ece6d6; --tinta2:#b0b5a6;
    --pedra:#838a7c; --mata:#8fbf7f; --terra:#d09a63; --brasa:#e8834a;
    --linha:#2e3427; --realce:#222719; --sombra:rgba(0,0,0,.3);
  } }
  :root[data-theme="dark"] {
    --papel:#14170f; --papel2:#1c2016; --tinta:#ece6d6; --tinta2:#b0b5a6;
    --pedra:#838a7c; --mata:#8fbf7f; --terra:#d09a63; --brasa:#e8834a;
    --linha:#2e3427; --realce:#222719; --sombra:rgba(0,0,0,.3);
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--papel); color:var(--tinta);
    font:400 17px/1.6 "Source Sans 3", system-ui, sans-serif; -webkit-text-size-adjust:100%; }
  .env { max-width:46rem; margin:0 auto; padding:3.5rem 1.25rem 5rem; }

  .hero { text-align:center; margin-bottom:3rem; }
  .selo { font:600 .74rem/1 "IBM Plex Mono",ui-monospace,monospace; letter-spacing:.22em;
    text-transform:uppercase; color:var(--terra); display:block; margin-bottom:1.1rem; }
  h1 { font:700 clamp(3.2rem,17vw,6rem)/.92 "Bitter",Georgia,serif; margin:0;
    letter-spacing:-.03em; color:var(--tinta); }
  .prop { font:500 clamp(1.15rem,4.5vw,1.5rem)/1.4 "Bitter",Georgia,serif; font-style:italic;
    color:var(--tinta2); margin:1.3rem auto 0; max-width:28rem; text-wrap:balance; }
  .cta { font:600 .78rem/1 "IBM Plex Mono",ui-monospace,monospace; letter-spacing:.14em;
    text-transform:uppercase; color:var(--pedra); margin-top:1rem; }

  .grade { display:grid; gap:1rem; grid-template-columns:1fr; }
  @media (min-width:34rem) { .grade { grid-template-columns:1fr 1fr; } }
  a.card { display:block; text-decoration:none; color:inherit; background:var(--realce);
    border:1px solid var(--linha); border-left:3px solid var(--mata); border-radius:2px;
    padding:1.25rem 1.35rem; box-shadow:0 1px 2px var(--sombra); transition:border-color .15s, transform .15s; }
  a.card:hover { border-left-color:var(--terra); transform:translateY(-2px); }
  a.card:focus-visible { outline:2px solid var(--brasa); outline-offset:3px; }
  a.jogar { border-left-color:var(--brasa); grid-column:1/-1; background:var(--papel2); }
  a.jogar:hover { border-left-color:var(--brasa); }
  .card .rot { font:600 .68rem/1.3 "IBM Plex Mono",ui-monospace,monospace; letter-spacing:.1em;
    text-transform:uppercase; color:var(--pedra); display:block; margin-bottom:.4rem; }
  .card h2 { font:700 1.5rem/1.1 "Bitter",Georgia,serif; margin:0 0 .5rem; letter-spacing:-.015em; }
  a.jogar h2 { font-size:2rem; }
  .card p { margin:0; font-size:.98rem; color:var(--tinta2); }
  .card .n { font:600 .82rem/1.5 "IBM Plex Mono",ui-monospace,monospace; color:var(--terra);
    display:block; margin-top:.6rem; letter-spacing:.02em; }

  footer.rod { margin-top:3rem; padding-top:1.3rem; border-top:1px solid var(--linha);
    font-size:.86rem; color:var(--pedra); text-align:center; }
  @media (prefers-reduced-motion:reduce) { * { animation:none!important; transition:none!important; } }
</style>
</head>
<body>
<div class="env">
  <header class="hero">
    <span class="selo">uma plataforma de conhecimento</span>
    <h1>BRASIL</h1>
    <p class="prop">Uma travessia pela nossa história — de quem já estava aqui até hoje.</p>
    <p class="cta">jogue · leia · descubra</p>
  </header>

  <main class="grade">
    <a class="jogar card" href="/">
      <span class="rot">O jogo · o chamariz</span>
      <h2>Jogar</h2>
      <p>Atravesse o tempo, dos povos originários ao presente. ${num.capitulos} capítulos de ação em pixel art, cada um com história de verdade.</p>
      <span class="n">${num.capitulos} capítulos</span>
    </a>
    <a class="card" href="/historia">
      <span class="rot">Ler</span>
      <h2>A História</h2>
      <p>A linha do tempo do Brasil, de quem já estava aqui até hoje. Cada momento com a fonte ao lado.</p>
      <span class="n">${num.momentos} momentos com fonte</span>
    </a>
    <a class="card" href="/glossario">
      <span class="rot">Entender</span>
      <h2>O Glossário</h2>
      <p>As palavras da nossa história, explicadas — e as que este jogo recusa, e por quê.</p>
      <span class="n">${num.verbetes} verbetes</span>
    </a>
    <a class="card" href="/de-onde-vem">
      <span class="rot">Conferir</span>
      <h2>De Onde Vem</h2>
      <p>As fontes de tudo o que o jogo afirma, com autoria. Aqui a régua se mostra: nenhum número sem de onde veio.</p>
      <span class="n">${num.fontes} fontes</span>
    </a>
  </main>

  <footer class="rod">
    <p>Ninguém descobriu nada — havia gente aqui, com língua, roça, cidade e nome. Esta é a história delas, e a nossa.</p>
  </footer>
</div>
</body>
</html>
`;

  const dir = path.join(RAIZ, 'plataforma');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('plataforma/index.html gerado (RASCUNHO, não publicado) — '
    + (html.length / 1024).toFixed(0) + ' KB · cartões: jogo ' + num.capitulos + ' cap, '
    + num.momentos + ' momentos, ' + num.verbetes + ' verbetes, ' + num.fontes + ' fontes');
  const ext = (html.match(/(?:src|href)="https?:\/\/(?!fonts\.g)[^"]+"/g) || []);
  if (ext.length) { console.error('RECUSADO: referência externa: ' + ext[0]); process.exit(1); }
})();
