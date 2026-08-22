// GERA A PÁGINA "O GLOSSÁRIO" — a segunda seção da plataforma (19/08, publicada).
//
// IRMÃO de `gerar-historia.js`, mesma disciplina: UMA FONTE, DUAS SAÍDAS. O conteúdo é o mesmo
// `GLOSSARIO` que o jogo desenha na tela do glossário — 181 verbetes em 17 grupos. Esta
// ferramenta roda o jogo headless, extrai, e gera `glossario/index.html`. Nunca há duas cópias.
//
// PUBLICADA em 19/08: o dono aprovou o padrão visual da /historia e mandou publicar as outras
// duas no mesmo molde. O build copia `glossario/` para `dist/glossario/` (loop de seções em
// `ferramentas/construir.js`), e a Vercel serve matheusferreira.cc/glossario.
//
// O §2 e o §1 valem igual à /historia: cada verbete mostra a fonte, e a página é uma obra de
// referência, não um manifesto. O glossário já é a superfície onde o jogo EXPLICA a palavra — o
// verbete AS PALAVRAS QUE ESTE JOGO ESCOLHE (invasão, não descobrimento) é a espinha do §2.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('../test/abrir.js');
// O endereço mora numa linha só (ferramentas/dominio.js) — agora também nas seções.
const { BASE } = require('./dominio.js');
// A MEDIÇÃO DA SEÇÃO (22/08). Um evento anônimo por abertura, o mesmo bloco das cinco páginas,
// escrito uma vez em ferramentas/medir-secao.js — e o interruptor no rodapé, que é o mesmo do
// jogo (mesma origem, mesma chave de localStorage). O §3 do CLAUDE.md vale inteiro.
const MED = require('./medir-secao.js');
// O CARTÃO DO LINK (22/08). Sem `og:image` esta página vira retângulo cinza no WhatsApp — a
// growth mediu isso por curl em três rodadas. O cartão é um print 1200×630 da PRÓPRIA página,
// pelo molde do território: uma fonte, duas saídas, também para a imagem da prévia.
const CARTAO = require('./cartao-secao.js');

const RAIZ = path.resolve(__dirname, '..');
const ALVO = ABRIR('file:///' + path.join(RAIZ, 'index.html').split(path.sep).join('/'));
const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.goto(ALVO);
  await pg.waitForTimeout(1800);

  // GLOSSARIO é uma lista plana: um cabeçalho de grupo (campo `g`) é seguido pelos seus verbetes
  // (campo `t`) até o próximo cabeçalho. Reconstruo os grupos preservando essa ordem.
  const grupos = await pg.evaluate(() => {
    const out = []; let atual = null;
    for (const v of GLOSSARIO) {
      if (v.g) { atual = { nome: v.g, sub: v.sub || '', itens: [] }; out.push(atual); }
      else if (v.t && atual) { atual.itens.push({ t: v.t, o: v.o || '', d: v.d || '', f: v.f || '' }); }
    }
    return out;
  });
  await nav.close();

  const nVerb = grupos.reduce((s, g) => s + g.itens.length, 0);

  const secoes = grupos.map((g) => `
    <section class="grupo">
      <h2>${esc(g.nome)}</h2>
      ${g.sub ? `<p class="gsub">${esc(g.sub)}</p>` : ''}
      <div class="verbetes">
        ${g.itens.map((v) => `
        <article class="verbete">
          <h3>${esc(v.t)}</h3>
          ${v.o ? `<p class="orig">${esc(v.o)}</p>` : ''}
          <p class="def">${esc(v.d)}</p>
          ${v.f ? `<p class="fonte">${esc(v.f)}</p>` : ''}
        </article>`).join('\n')}
      </div>
    </section>`).join('\n');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="O glossário do Brasil: ${nVerb} palavras da nossa história explicadas, com fonte — e as que este jogo recusa, e por quê.">
<meta property="og:title" content="O GLOSSÁRIO — BRASIL">
<meta property="og:description" content="${nVerb} palavras da história do Brasil explicadas, cada uma com a fonte.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,500;0,700;1,500&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BRASIL">
<meta property="og:url" content="${BASE}/glossario/">
<meta property="og:locale" content="pt_BR">
${CARTAO.tags(BASE, 'glossario', 'A abertura do GLOSSÁRIO: o título "O glossário do Brasil" sobre papel, com a contagem de verbetes e os primeiros deles.')}
<link rel="canonical" href="${BASE}/glossario/">
<title>O Glossário do Brasil — as palavras da nossa história</title>
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
  header.topo { border-bottom:2px solid var(--tinta); padding-bottom:1.3rem; margin-bottom:2.4rem; }
  .selo { font:600 .72rem/1 "IBM Plex Mono",ui-monospace,monospace; letter-spacing:.16em;
    text-transform:uppercase; color:var(--terra); display:block; margin-bottom:.7rem; }
  h1 { font:700 clamp(2rem,8vw,2.9rem)/1.05 "Bitter",Georgia,serif; margin:0 0 .6rem;
    text-wrap:balance; letter-spacing:-.015em; }
  .intro { color:var(--tinta2); margin:0; font-size:1.05rem; max-width:36rem; }
  .conta { font:600 .74rem/1.5 "IBM Plex Mono",ui-monospace,monospace; color:var(--pedra);
    margin:1rem 0 0; letter-spacing:.03em; }

  .grupo { margin:0 0 2.6rem; }
  .grupo > h2 { font:700 1rem/1.3 "IBM Plex Mono",ui-monospace,monospace; letter-spacing:.06em;
    text-transform:uppercase; color:var(--terra); margin:0 0 .3rem;
    padding-bottom:.5rem; border-bottom:1px solid var(--linha); }
  .gsub { color:var(--pedra); font-size:.92rem; font-style:italic; margin:0 0 1.2rem; }
  .verbetes { display:grid; gap:1rem; }
  .verbete { background:var(--realce); border:1px solid var(--linha); border-left:3px solid var(--mata);
    padding:1rem 1.1rem; box-shadow:0 1px 2px var(--sombra); }
  .verbete h3 { font:700 1.16rem/1.25 "Bitter",Georgia,serif; margin:0 0 .4rem; letter-spacing:-.01em; }
  .orig { color:var(--tinta2); font-style:italic; font-size:.94rem; margin:0 0 .55rem; }
  .def { margin:0 0 .6rem; }
  .fonte { font:400 .82rem/1.5 "IBM Plex Mono",ui-monospace,monospace; color:var(--pedra);
    margin:0; padding-left:.9rem; border-left:2px solid var(--linha); }

  footer.rod { margin-top:2.5rem; padding-top:1.3rem; border-top:1px solid var(--linha);
    font-size:.86rem; color:var(--pedra); }
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
      <a href="/historia">A História</a>
      <a href="/glossario" class="aqui">Glossário</a>
      <a href="/de-onde-vem">De Onde Vem</a>
      <a href="/territorio">O Território</a>
    </nav>
    <h1>O glossário do Brasil</h1>
    <p class="intro">As palavras da nossa história, explicadas — e as que este jogo recusa, e por
      quê. Cada uma traz a fonte: invasão, e não descobrimento, é uma escolha com razão escrita.</p>
    <p class="conta">${nVerb} verbetes · ${grupos.length} grupos</p>
  </header>

  <main>
${secoes}
  </main>

  <footer class="rod">
    <p>Esta é a seção <strong>O GLOSSÁRIO</strong> da plataforma BRASIL. O mesmo conteúdo aparece
      dentro do jogo, onde cada capítulo oferece as palavras que disse. Aqui ele se lê inteiro.</p>
    ${MED.rodape()}
  </footer>
</div>
${MED.script('glossario')}
</body>
</html>
`;

  const dir = path.join(RAIZ, 'glossario');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('glossario/index.html gerado — ' + nVerb + ' verbetes em '
    + grupos.length + ' grupos, ' + (html.length / 1024).toFixed(0) + ' KB');
  const ext = (html.match(/(?:src|href)="https?:\/\/(?!fonts\.g)[^"]+"/g) || []).filter(function (u) { return u.indexOf(BASE) < 0; }); // o proprio dominio (canonical/og) nao e asset externo
  if (ext.length) { console.error('RECUSADO: referência externa: ' + ext[0]); process.exit(1); }

  // ---- o cartão do link, tirado da página que acabou de ser escrita ----
  const c = await CARTAO.tirar(dir);
  console.log('  glossario/compartilhar.jpg — ' + CARTAO.LARGURA + 'x' + CARTAO.ALTURA
    + ', qualidade ' + CARTAO.QUALIDADE + ', ' + c.kb.toFixed(0) + ' KB · abertura: "'
    + c.titulo + '" (topo ' + c.topo + '–' + c.base + ' px) · ' + c.escondidos + ' controle(s) fora do print');
})();
