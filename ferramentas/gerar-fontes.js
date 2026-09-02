// GERA A PÁGINA "DE ONDE VEM" — a terceira seção da plataforma (19/08, aprovada pelo dono).
//
// IRMÃ de gerar-historia.js e gerar-glossario.js, mesma disciplina: UMA FONTE, DUAS SAÍDAS. O
// conteúdo é o mesmo `FONTES` que o jogo mostra na tela DE ONDE VEM. Roda o jogo headless,
// extrai, gera `de-onde-vem/index.html`. Nunca há duas cópias.
//
// O NÚMERO NÃO FICA ESCRITO AQUI, e a razão é que o que estava escrito estava errado: o
// comentário dizia "71 fontes" e 71 é o TAMANHO DO ARRAY — 11 dessas entradas são cabeçalhos
// de grupo (`g`), não fontes (`t`). Medido em 21/08 rodando o próprio jogo: **60 fontes em 11
// grupos**, que é exatamente o que a página imprime sozinha na linha `.conta` lá embaixo
// (`${nFontes} fontes · ${grupos.length} grupos`). Número em comentário envelhece e ninguém
// percebe; número calculado da fonte não tem como mentir. Se você veio até aqui para atualizar
// a contagem depois de acrescentar uma ficha: não precisa — a página já conta.
//
// POR QUE ESTA SEÇÃO É A PROVA DA PLATAFORMA. A /historia conta e o glossário explica; esta
// MOSTRA de onde cada afirmação veio. É a página que torna o resto verificável — a régua do §2
// ("nenhum número sem fonte") vira uma seção pública que qualquer pessoa pode conferir. Prioriza,
// como o jogo, autoria indígena e negra e as pesquisadoras de cada período (a lista já vem
// organizada assim em `FONTES`, por grupo).
//
// Cada entrada tem `t` (a fonte, com autoria e veículo) e `q` (o que ela sustenta no jogo). O §1
// vale: é uma bibliografia comentada, não um manifesto.
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
// O CHROME DA PLATAFORMA (arte, 22/08) — a língua visual do jogo, fonte única (ver gerar-historia).
const CHROME = require('./chrome-plataforma.js');

const RAIZ = path.resolve(__dirname, '..');
const ALVO = ABRIR('file:///' + path.join(RAIZ, 'index.html').split(path.sep).join('/'));
const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

(async () => {
  // PENDENTES 91/98: ver o comentario em gerar-porta.js — launch() nu procura a build que o
  // playwright FIXA e a nuvem tem outra; chromiumPath() devolve undefined onde nao ha o
  // diretorio, e undefined aqui e o mesmo que nao passar nada.
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto(ALVO);
  await pg.waitForTimeout(1800);

  // FONTES é uma lista plana: um cabeçalho de grupo (`g`) seguido das fontes (`t`) até o próximo.
  const grupos = await pg.evaluate(() => {
    const out = []; let atual = null;
    for (const v of FONTES) {
      if (v.g) { atual = { nome: v.g, itens: [] }; out.push(atual); }
      else if (v.t && atual) { atual.itens.push({ t: v.t, q: v.q || '' }); }
    }
    return out;
  });
  await nav.close();

  const nFontes = grupos.reduce((s, g) => s + g.itens.length, 0);

  const secoes = grupos.map((g) => `
    <section class="grupo">
      <h2>${esc(g.nome)}</h2>
      <ul class="fontes">
        ${g.itens.map((v) => `
        <li class="fonte cartaoCampo">
          <p class="ref">${esc(v.t)}</p>
          ${v.q ? `<p class="traz citaCampo">${esc(v.q)}</p>` : ''}
        </li>`).join('\n')}
      </ul>
    </section>`).join('\n');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="De onde vem cada afirmação do jogo BRASIL: ${nFontes} fontes, com autoria e o que cada uma sustenta. Nenhum número sem de onde veio.">
<meta property="og:title" content="DE ONDE VEM — BRASIL">
<meta property="og:description" content="${nFontes} fontes da história do Brasil, com o que cada uma sustenta. Aqui a régua do jogo se mostra.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BRASIL">
<meta property="og:url" content="${BASE}/de-onde-vem/">
<meta property="og:locale" content="pt_BR">
${CARTAO.tags(BASE, 'de-onde-vem', 'A abertura da seção DE ONDE VEM: o título sobre papel, com a contagem de fontes e as primeiras fichas, cada uma dizendo o que sustenta.')}
<link rel="canonical" href="${BASE}/de-onde-vem/">
<title>De Onde Vem — as fontes da história do Brasil</title>
<style>
${CHROME.tokensCss()}  :root {
    --papel:#e9d8ae; --papel2:#d8c391; --tinta:#33240f; --tinta2:#5a4c36;
    --pedra:#857658; --mata:#2f5230; --terra:#7a4a13; --brasa:#b5541f;
    --linha:#cbbc98; --realce:#f0e4c4; --sombra:rgba(29,20,10,.10);
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
  body { margin:0; color:var(--tinta);
    font:400 17px/1.62 var(--leitura); -webkit-text-size-adjust:100%; }
  .env { max-width:44rem; margin:0 auto; padding:2.6rem 1.25rem 5rem; }
  header.topo { border-bottom:2px solid var(--tinta); padding-bottom:1.3rem; margin-bottom:2.4rem; }
  .selo { font:600 .72rem/1 var(--mono); letter-spacing:.16em;
    text-transform:uppercase; color:var(--terra); display:block; margin-bottom:.7rem; }
  h1 { font:700 clamp(2rem,8vw,2.9rem)/1.05 var(--titulo); margin:0 0 .6rem;
    text-wrap:balance; letter-spacing:-.015em; }
  .intro { color:var(--tinta2); margin:0; font-size:1.05rem; max-width:36rem; }
  .conta { font:600 .74rem/1.5 var(--mono); color:var(--pedra);
    margin:1rem 0 0; letter-spacing:.03em; }

  .grupo { margin:0 0 2.4rem; }
  .grupo > h2 { font:700 1rem/1.3 var(--mono); letter-spacing:.06em;
    text-transform:uppercase; color:var(--terra); margin:0 0 1rem;
    padding-bottom:.5rem; border-bottom:1px solid var(--linha); }
  .fontes { list-style:none; margin:0; padding:0; display:grid; gap:.9rem; }
  /* onda 3: cada fonte é uma FICHA de papel de campo com fio de madeira (.cartaoCampo); a
     referência em serifa encorpada, e o que ela sustenta como nota de citação — itálico
     serifado (.citaCampo). O grão fica no fundo, nunca sob a ficha. */
  .fonte { padding:.8rem .95rem; }
  .ref { font:600 1.02rem/1.4 var(--titulo); margin:0 0 .3rem; color:var(--tinta); }
  .traz { margin:0; color:var(--tinta2); font-size:.96rem; }

  footer.rod { margin-top:2.5rem; padding-top:1.3rem; border-top:1px solid var(--linha);
    font-size:.86rem; color:var(--pedra); }
${CHROME.barraCss()}${CHROME.campoCss()}  @media (prefers-reduced-motion:reduce) { * { animation:none!important; transition:none!important; } }
</style>
</head>
<body class="fundoCampo">
<div class="env">
  <header class="topo">
${CHROME.barraHtml('de-onde-vem')}
    <h1>De onde vem</h1>
    <p class="intro">As fontes da nossa história — com autoria, e o que cada uma sustenta no jogo.
      Aqui a régua se mostra: nenhum número sem de onde veio. A prioridade é de quem tem lugar de
      fala sobre o que se conta.</p>
    <p class="conta">${nFontes} fontes · ${grupos.length} grupos</p>
  </header>

  <main>
${secoes}
  </main>

  <footer class="rod">
    <p>Esta é a seção <strong>DE ONDE VEM</strong> da plataforma BRASIL. É a bibliografia que
      sustenta cada afirmação do jogo e das outras seções — a parte que torna o resto verificável.</p>
    ${MED.rodape()}
  </footer>
</div>
${MED.script('de-onde-vem')}
</body>
</html>
`;

  const dir = path.join(RAIZ, 'de-onde-vem');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('de-onde-vem/index.html gerado — ' + nFontes + ' fontes em '
    + grupos.length + ' grupos, ' + (html.length / 1024).toFixed(0) + ' KB');
  const ext = (html.match(/(?:src|href)="https?:\/\/(?!fonts\.g)[^"]+"/g) || []).filter(function (u) { return u.indexOf(BASE) < 0; }); // o proprio dominio (canonical/og) nao e asset externo
  if (ext.length) { console.error('RECUSADO: referência externa: ' + ext[0]); process.exit(1); }

  // ---- o cartão do link, tirado da página que acabou de ser escrita ----
  const c = await CARTAO.tirar(dir);
  console.log('  de-onde-vem/compartilhar.jpg — ' + CARTAO.LARGURA + 'x' + CARTAO.ALTURA
    + ', qualidade ' + CARTAO.QUALIDADE + ', ' + c.kb.toFixed(0) + ' KB · abertura: "'
    + c.titulo + '" (topo ' + c.topo + '–' + c.base + ' px) · ' + c.escondidos + ' controle(s) fora do print');
})();
