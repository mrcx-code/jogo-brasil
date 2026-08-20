// GERA A PÁGINA "A HISTÓRIA" — a primeira seção da plataforma, decidida pelo dono em 19/08.
//
// A DECISÃO. O jogo passou a ser UMA seção de uma plataforma de conhecimento sobre o Brasil, e a
// home virou a proposta. A ordem que o dono deu: dar endereço próprio às seções que JÁ existem,
// antes de qualquer migração. Esta é a primeira — a linha do tempo — e ela define o padrão
// visual das outras (DE ONDE VEM, o glossário).
//
// UMA FONTE, DUAS SAÍDAS. O conteúdo NÃO é reescrito aqui: é o mesmo `LINHA_TEMPO` que o jogo
// desenha na tela A HISTÓRIA. Esta ferramenta roda o jogo headless, extrai os momentos, e gera
// `historia/index.html`. Quando o jogo muda, a página regenera — nunca há duas cópias do texto
// para desencontrar. É a mesma disciplina do build do jogo: a fonte é `src/`, a saída é montada.
//
// O §2 VALE IGUAL. A página afirma história, então cada momento carrega a fonte que o jogo já
// verificou — e a página a MOSTRA, do lado do texto, como o banner REAL DATA faz. Nada entra sem
// fonte: os nós sem título/texto (separadores) são filtrados. A voz de "quem lê hoje" (o campo
// `com`) entra como o que é — leitura de hoje, não fato —, destacada e atribuível.
//
// A MÃO LEVE (§1). É uma linha do tempo, não um manifesto. O texto fala por si; a página só o
// apresenta com cuidado. Sem palanque.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('../test/abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const ALVO = ABRIR('file:///' + path.join(RAIZ, 'index.html').split(path.sep).join('/'));

// escapa texto para HTML — a página é gerada, então nada de conteúdo vira marcação por acidente
const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.goto(ALVO);
  await pg.waitForTimeout(1800);

  const momentos = await pg.evaluate(() => LINHA_TEMPO
    .filter((x) => x.tipo === 'momento' && x.t && x.d)
    .map((x) => ({ quando: x.q || '', titulo: x.t, texto: x.d, fonte: x.f || '', hoje: x.com || '' })));
  await nav.close();

  const comFonte = momentos.filter((m) => m.fonte).length;
  const comHoje = momentos.filter((m) => m.hoje).length;

  const itens = momentos.map((m, i) => `
    <article class="momento">
      <div class="marco" aria-hidden="true"><span class="ponto"></span></div>
      <div class="corpo">
        ${m.quando ? `<p class="quando">${esc(m.quando)}</p>` : ''}
        <h2>${esc(m.titulo)}</h2>
        <p class="texto">${esc(m.texto)}</p>
        ${m.hoje ? `<p class="hoje"><span class="hojeR">quem lê hoje</span>${esc(m.hoje)}</p>` : ''}
        ${m.fonte ? `<p class="fonte">${esc(m.fonte)}</p>` : ''}
      </div>
    </article>`).join('\n');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="A história do Brasil em linha do tempo — de quem já estava aqui até hoje, cada momento com a fonte ao lado.">
<meta property="og:title" content="A HISTÓRIA — BRASIL">
<meta property="og:description" content="Uma linha do tempo do Brasil, de quem já estava aqui até hoje. Cada momento traz a fonte.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,500;0,700;1,500&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap">
<title>A História do Brasil — uma linha do tempo</title>
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
    font:400 17px/1.62 "Source Sans 3", system-ui, sans-serif; -webkit-text-size-adjust:100%; }
  .env { max-width:44rem; margin:0 auto; padding:2.6rem 1.25rem 5rem; }

  header.topo { border-bottom:2px solid var(--tinta); padding-bottom:1.3rem; margin-bottom:2.6rem; }
  .selo { font:600 .72rem/1 "IBM Plex Mono",ui-monospace,monospace; letter-spacing:.16em;
    text-transform:uppercase; color:var(--terra); display:block; margin-bottom:.7rem; }
  h1 { font:700 clamp(2rem,8vw,2.9rem)/1.05 "Bitter",Georgia,serif; margin:0 0 .6rem;
    text-wrap:balance; letter-spacing:-.015em; }
  .intro { color:var(--tinta2); margin:0; font-size:1.05rem; max-width:36rem; }
  .conta { font:600 .74rem/1.5 "IBM Plex Mono",ui-monospace,monospace; color:var(--pedra);
    margin:1rem 0 0; letter-spacing:.03em; }

  /* A linha do tempo: um fio vertical à esquerda, marcos pontuando. */
  .linha { position:relative; margin-top:.5rem; }
  .linha::before { content:""; position:absolute; left:7px; top:6px; bottom:0; width:2px;
    background:linear-gradient(var(--linha), var(--linha) 85%, transparent); }
  .momento { position:relative; padding:0 0 2.4rem 2.4rem; }
  .marco { position:absolute; left:0; top:.3rem; width:16px; height:16px; }
  .ponto { display:block; width:16px; height:16px; border-radius:50%;
    background:var(--papel); border:3px solid var(--mata); box-shadow:0 0 0 3px var(--papel); }
  .quando { font:600 .73rem/1.4 "IBM Plex Mono",ui-monospace,monospace; letter-spacing:.05em;
    text-transform:uppercase; color:var(--terra); margin:0 0 .25rem; }
  .momento h2 { font:700 1.32rem/1.22 "Bitter",Georgia,serif; margin:0 0 .5rem;
    text-wrap:balance; letter-spacing:-.01em; }
  .texto { margin:0 0 .7rem; }
  .hoje { position:relative; background:var(--papel2); border-left:3px solid var(--terra);
    padding:.7rem .9rem; margin:0 0 .7rem; font-style:italic; font-size:.97rem; color:var(--tinta2);
    border-radius:0 4px 4px 0; }
  .hojeR { display:block; font:600 .62rem/1 "IBM Plex Mono",ui-monospace,monospace;
    letter-spacing:.12em; text-transform:uppercase; color:var(--pedra); font-style:normal;
    margin-bottom:.35rem; }
  .fonte { font:400 .82rem/1.5 "IBM Plex Mono",ui-monospace,monospace; color:var(--pedra);
    margin:0; padding-left:.9rem; border-left:2px solid var(--linha); }

  footer.rod { margin-top:3rem; padding-top:1.3rem; border-top:1px solid var(--linha);
    font-size:.86rem; color:var(--pedra); }
  footer.rod a { color:var(--terra); }
  .nav { display:flex; flex-wrap:wrap; gap:.35rem 1.1rem; margin-bottom:1.6rem;
    font:600 .72rem/1.4 "IBM Plex Mono",ui-monospace,monospace; letter-spacing:.08em;
    text-transform:uppercase; }
  .nav a { text-decoration:none; color:var(--pedra); border-bottom:2px solid transparent;
    padding-bottom:.15rem; transition:color .15s; }
  .nav a:hover { color:var(--terra); }
  .nav a.marca { color:var(--tinta); font-weight:700; letter-spacing:.12em; }
  .nav a.aqui { color:var(--terra); border-bottom-color:var(--terra); cursor:default; }
  @media (prefers-reduced-motion:reduce) { * { animation:none!important; transition:none!important; } }
</style>
</head>
<body>
<div class="env">
  <header class="topo">
    <nav class="nav">
      <a href="/" class="marca">BRASIL</a>
      <a href="/historia" class="aqui">A História</a>
      <a href="/glossario">Glossário</a>
      <a href="/de-onde-vem">De Onde Vem</a>
    </nav>
    <h1>A história do Brasil, em linha do tempo</h1>
    <p class="intro">De quem já estava aqui — há mais de onze mil anos — até hoje. Cada momento
      traz a fonte ao lado: aqui não há número sem de onde ele veio.</p>
    <p class="conta">${momentos.length} momentos · ${comFonte} com fonte · ${comHoje} com a leitura de hoje</p>
  </header>

  <main class="linha">
${itens}
  </main>

  <footer class="rod">
    <p>Esta é a seção <strong>A HISTÓRIA</strong> da plataforma BRASIL. O mesmo conteúdo aparece
      dentro do jogo — aqui ele se lê inteiro, de uma vez. As fontes são as que sustentam cada
      afirmação; a voz de “quem lê hoje” é leitura do presente, não fato.</p>
  </footer>
</div>
</body>
</html>
`;

  const dir = path.join(RAIZ, 'historia');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('historia/index.html gerado — ' + momentos.length + ' momentos, '
    + (html.length / 1024).toFixed(0) + ' KB');
  // guarda de §2: nenhuma referência externa além das fontes do Google
  const ext = (html.match(/(?:src|href)="https?:\/\/(?!fonts\.g)[^"]+"/g) || []);
  if (ext.length) { console.error('RECUSADO: referência externa fora do Google Fonts: ' + ext[0]); process.exit(1); }
})();
