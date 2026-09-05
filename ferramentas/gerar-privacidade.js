// GERA A PÁGINA /privacidade/ — a política de privacidade da plataforma BRASIL.
//
// IRMÃ de gerar-historia/glossario/fontes/porta, e a MESMA disciplina delas: UMA FONTE, DUAS
// SAÍDAS. A diferença é de onde a fonte vem. As quatro seções extraem do JOGO headless
// (LINHA_TEMPO, GLOSSARIO, FONTES, MAPA_*); esta extrai de `plataforma/privacidade-texto.md`,
// que é o texto fechado pelo jurídico em 03/09 e revisado contra o CÓDIGO linha a linha (a
// tabela "De onde veio cada afirmação", no fim daquele arquivo, diz onde conferir cada frase).
//
// POR QUE NÃO SE REDIGITA UMA VÍRGULA AQUI. É a regra de ouro da fronteira aplicada a texto
// jurídico: cada frase da seção 2 à 8 daquele arquivo foi conferida contra uma linha de código,
// e duas delas foram MEDIDAS em navegador (R6 e R7). Reescrever à mão para "caber melhor no
// HTML" é como se inventa geografia sem perceber — só que o custo aqui é uma afirmação de
// privacidade falsa, que o §3 do CLAUDE.md chama de pior que nenhuma. Então este arquivo não
// escreve texto: ele RENDERIZA o markdown e, antes de gravar, PROVA que não perdeu nem
// acrescentou uma palavra (ver `conferirFidelidade` — o `<main>` da página e o markdown, os dois
// reduzidos a texto puro, têm de ser a MESMA string).
//
// O QUE FICA DE FORA, e a falha é FECHADA. O arquivo fonte tem duas metades separadas pela linha
// `# NOTAS INTERNAS — não publicar`: acima, a política; abaixo, as ressalvas R1–R8, as quatro
// perguntas para um advogado e a tabela de conferência. Nada disso vai ao ar. Se o marcador
// sumir do arquivo fonte, este gerador RECUSA gerar em vez de adivinhar onde cortar — publicar
// nota interna por acidente é o modo de falha caro deste arquivo, e ele não pode depender de
// alguém lembrar.
//
// A DATA MORA NUMA LINHA SÓ (`DATA_PUBLICACAO`, logo abaixo), como o endereço mora em
// `ferramentas/dominio.js`. Ela preenche as DUAS ocorrências de `[DATA DA PUBLICAÇÃO]` — o topo
// e o histórico — e o gerador recusa se não achar exatamente essas duas.
//
// ESTA PÁGINA NÃO MEDE, E É DE PROPÓSITO. As cinco páginas públicas mandam um evento anônimo
// `secao aberta` com `secao` entre os CINCO nomes aprovados (ferramentas/medir-secao.js). A
// seção 3 desta política descreve esse evento com todas as letras — "qual das cinco seções foi
// aberta" — então acrescentar uma sexta seção medida seria tornar FALSA, no mesmo commit, uma
// frase da página que existe para dizer a verdade sobre a medição. Ela leva só a FIAÇÃO do
// interruptor (`MED.scriptInterruptor()`), porque a política promete, em duas seções, que o
// interruptor está "na barra do topo de qualquer página" — e uma página de privacidade sem o
// controle que ela promete seria a pior das duas escolhas. Consequência conferível: a CSP desta
// rota não tem `connect-src` nenhum (ver o QUADRO_DE_ROTAS em ferramentas/construir.js) — a
// página não tem para onde falar.
//
// SEM `og:image`, e também é decisão. O cartão do link (ferramentas/cartao-secao.js) existe
// porque link de SEÇÃO circula no WhatsApp e sem imagem vira retângulo cinza. Política de
// privacidade não é peça de circulação: ela é alcançada pelo rodapé de quem já está aqui. Gerar
// um cartão de 90 KB para ela seria peso e trabalho a mais sem uma pergunta que ele responda.
// `title`, `description`, `og:` de texto e `canonical` estão todos lá, coerentes entre si.
//
// COMO RODAR:  node ferramentas/gerar-privacidade.js
// QUEM COBRA QUE FOI RODADO: o `ferramentas/construir.js` — ele compara a página commitada com o
// que este módulo produz AGORA e recusa construir se divergirem. Editar o texto e esquecer de
// gerar deixou de ser possível em silêncio.
const path = require('path');
const fs = require('fs');
const CHROME = require('./chrome-plataforma.js');
const MED = require('./medir-secao.js');
const { BASE } = require('./dominio.js');

const RAIZ = path.resolve(__dirname, '..');
const FONTE = path.join(RAIZ, 'plataforma', 'privacidade-texto.md');
const DESTINO = path.join(RAIZ, 'privacidade', 'index.html');

// ---------------------------------------------------------------------------------------------
// A DATA DA PUBLICAÇÃO — uma constante, dois lugares na página, nenhum literal espalhado.
// Trocar o dia em que isto vai ao ar é trocar ESTA linha e rodar o gerador.
// 05/09: subiu de 2026-09-04 para 2026-09-05 porque a seção 9 mudou de texto (passou a
// descrever o caminho escolar `?origem=escola`, que já existia no código e não estava na
// página). A própria seção 12 promete que "a data no topo diz da última vez que isso
// aconteceu" — deixar a data velha depois de mexer no texto seria a página mentindo sobre
// si mesma, que é a classe de erro que este arquivo inteiro existe para evitar. O marcador
// `[DATA DA PUBLICAÇÃO]` continua aparecendo DUAS vezes na fonte (o topo e a linha nova do
// histórico); a linha da primeira versão passou a trazer 4 de setembro por extenso, porque
// ela é uma data fixa do passado e não acompanha esta constante.
const DATA_PUBLICACAO = '2026-09-05';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
function porExtenso(iso) {
  const p = String(iso).split('-');
  return Number(p[2]) + ' de ' + MESES[Number(p[1]) - 1] + ' de ' + p[0];
}
const MARCA_DATA = '[DATA DA PUBLICAÇÃO]';
const CORTE = '# NOTAS INTERNAS';        // daqui para baixo, nada é publicado
const ABERTURA = '\n# Privacidade\n';    // daqui para baixo, tudo é
const EMAIL = 'brasilpatinhas@gmail.com';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------------------------------------
// O TEXTO PUBLICÁVEL, recortado da fonte. Falha FECHADA nos dois marcadores.
function textoPublicavel(bruto) {
  // CRLF PRIMEIRO, e não é detalhe: o checkout no Windows entrega o arquivo com `\r\n`, e um
  // marcador procurado como `\n# Privacidade\n` não casa — o gerador recusaria um arquivo são.
  // É a mesma classe de armadilha que deixou um controle MUDO em test/medir-paginas.js (22/08).
  const md = String(bruto).replace(/\r\n/g, '\n');
  const i = md.indexOf(ABERTURA);
  const f = md.indexOf(CORTE);
  if (i < 0) throw new Error('RECUSADO: nao achei a abertura "' + ABERTURA.trim() + '" em '
    + 'plataforma/privacidade-texto.md — sem ela nao da para saber onde a politica comeca.');
  if (f < 0) throw new Error('RECUSADO: nao achei o marcador "' + CORTE + '" em '
    + 'plataforma/privacidade-texto.md. Ele e o que separa a politica das NOTAS INTERNAS '
    + '(ressalvas R1-R8, perguntas para advogado, tabela de conferencia). Sem ele eu nao '
    + 'adivinho onde cortar, e publicar nota interna por acidente e o pior desfecho deste arquivo.');
  if (f < i) throw new Error('RECUSADO: o marcador "' + CORTE + '" aparece ANTES da abertura.');
  let corpo = md.slice(i, f);
  // a fonte fecha a politica com uma regra dupla ("---\n---") antes das notas; some com ela
  corpo = corpo.replace(/(\s*^---\s*$)+\s*$/m, '\n');

  const quantas = corpo.split(MARCA_DATA).length - 1;
  if (quantas !== 2) throw new Error('RECUSADO: esperava 2 ocorrencias de "' + MARCA_DATA
    + '" (o topo e o historico) e achei ' + quantas + '.');
  corpo = corpo.split(MARCA_DATA).join(porExtenso(DATA_PUBLICACAO));

  const sobra = corpo.match(/\[[A-ZÀ-Ú][A-ZÀ-Ú \u00C0-\u00DA]{4,}\]/);
  if (sobra) throw new Error('RECUSADO: sobrou um marcador por preencher no texto: ' + sobra[0]);
  return corpo.trim() + '\n';
}

// ---------------------------------------------------------------------------------------------
// O RENDERIZADOR. Markdown pequeno e explícito — só o que a fonte usa: h1/h2, parágrafo, lista
// com marcador, lista numerada, tabela, negrito, itálico e código. Nada de biblioteca: uma
// dependência de runtime para converter 12 seções seria dependência a mais para auditar num
// arquivo que fala de privacidade.
function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // O e-mail vira mailto: o texto não muda (a conferência de fidelidade cobra isso), e quem
  // quer exercer um direito do art. 18 não precisa copiar à mão.
  t = t.split(EMAIL).join('<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>');
  return t;
}
const eSeparador = (l) => /^\s*---+\s*$/.test(l);
const eSepTabela = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
const eCabecalho = (l) => /^#{1,6}\s+/.test(l);
const eItem = (l) => /^[-*]\s+/.test(l);
const eNumero = (l) => /^\d+\.\s+/.test(l);

function blocos(md) {
  const linhas = md.replace(/\r\n/g, '\n').split('\n');
  const saida = [];
  let i = 0;
  while (i < linhas.length) {
    const l = linhas[i];
    if (!l.trim() || eSeparador(l)) { i++; continue; }
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) { saida.push({ t: 'h', n: h[1].length, txt: h[2].trim() }); i++; continue; }
    if (l.trim().startsWith('|')) {
      const linhasTab = [];
      while (i < linhas.length && linhas[i].trim().startsWith('|')) { linhasTab.push(linhas[i].trim()); i++; }
      saida.push({ t: 'tabela', linhas: linhasTab });
      continue;
    }
    if (eItem(l) || eNumero(l)) {
      const ordenada = eNumero(l);
      const marcador = ordenada ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/;
      const itens = [];
      while (i < linhas.length) {
        const cur = linhas[i];
        if (!cur.trim()) {
          // linha em branco DENTRO da lista: só continua se a próxima ainda for da lista
          const prox = linhas[i + 1] || '';
          if (/^\s{2,}\S/.test(prox) || (ordenada ? eNumero(prox) : eItem(prox))) { i++; continue; }
          break;
        }
        const mk = cur.match(marcador);
        if (mk) { itens.push(mk[1].trim()); i++; continue; }
        if (/^\s{2,}\S/.test(cur) && itens.length) { itens[itens.length - 1] += ' ' + cur.trim(); i++; continue; }
        break;
      }
      saida.push({ t: ordenada ? 'ol' : 'ul', itens });
      continue;
    }
    const p = [];
    while (i < linhas.length && linhas[i].trim() && !eSeparador(linhas[i]) && !eCabecalho(linhas[i])
      && !linhas[i].trim().startsWith('|') && !eItem(linhas[i]) && !eNumero(linhas[i])) {
      p.push(linhas[i].trim()); i++;
    }
    saida.push({ t: 'p', txt: p.join(' ') });
  }
  return saida;
}

const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

function tabelaHtml(linhasTab) {
  const celulas = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const corpo = [];
  let cabeca = null;
  linhasTab.forEach((l, k) => {
    if (eSepTabela(l)) return;
    if (k === 0) { cabeca = celulas(l); return; }
    corpo.push(celulas(l));
  });
  const th = cabeca ? '<thead><tr>' + cabeca.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead>' : '';
  const tb = '<tbody>' + corpo.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody>';
  return '<table class="tab">' + th + tb + '</table>';
}

// Um parágrafo tem tratamento especial: o da data ganha um <time> legível por máquina. O TEXTO
// não muda — só a marcação. É o mesmo espírito do `datetime` de qualquer nota datada.
function paragrafoHtml(txt) {
  const m = txt.match(/^(Última atualização:\s*)(.+)$/);
  if (m) {
    return '<p class="data">' + inline(m[1]) + '<time datetime="' + DATA_PUBLICACAO + '">'
      + inline(m[2]) + '</time></p>';
  }
  return '<p>' + inline(txt) + '</p>';
}

// O corpo da política: a abertura (h1 + linha do controlador + data) solta, e cada `##` vira uma
// SEÇÃO em papel limpo — `.cartaoCampo` do chrome, que é a regra da casa para coluna de leitura
// longa (é ela que mascara o grão do fundo atrás do texto corrido).
function corpoHtml(md) {
  const bs = blocos(md);
  const partes = [];
  let aberta = false;
  const fechar = () => { if (aberta) { partes.push('    </section>'); aberta = false; } };
  for (const b of bs) {
    if (b.t === 'h' && b.n === 1) { fechar(); partes.push('    <h1>' + inline(b.txt) + '</h1>'); continue; }
    if (b.t === 'h' && b.n >= 2) {
      fechar();
      partes.push('    <section class="bloco cartaoCampo" id="' + slug(b.txt) + '">');
      partes.push('      <h2>' + inline(b.txt) + '</h2>');
      aberta = true;
      continue;
    }
    const ident = aberta ? '      ' : '    ';
    if (b.t === 'p') { partes.push(ident + paragrafoHtml(b.txt)); continue; }
    if (b.t === 'ul') { partes.push(ident + '<ul>' + b.itens.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul>'); continue; }
    if (b.t === 'ol') { partes.push(ident + '<ol>' + b.itens.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ol>'); continue; }
    if (b.t === 'tabela') { partes.push(ident + '<div class="rolaTab">' + tabelaHtml(b.linhas) + '</div>'); continue; }
  }
  fechar();
  return partes.join('\n');
}

// ---------------------------------------------------------------------------------------------
// A CONFERÊNCIA DE FIDELIDADE — o portão que faz "não redigitei nada" ser um número em vez de uma
// promessa. Os dois lados viram TEXTO PURO e são comparados caractere a caractere:
//   · o markdown, com a sintaxe removida (`#`, `**`, `*`, crase, `|`, marcadores de lista, as
//     réguas e a linha separadora da tabela);
//   · o `<main>` da página, com as etiquetas removidas e as entidades desfeitas.
// Se sobrar ou faltar uma palavra, o gerador RECUSA gravar e imprime onde as duas divergiram.
function textoDoMd(md) {
  return md.replace(/\r\n/g, '\n').split('\n')
    .filter((l) => !eSeparador(l) && !eSepTabela(l))
    // UM marcador por linha, nunca dois em cadeia — encadear tirava o "1." do título
    // "## 1. Quem responde por esta plataforma", que é TEXTO e continua na página. (Achado pelo
    // próprio portão, na primeira execução: ele reprovou o gerador antes de o gerador gravar.)
    .map((l) => {
      const h = l.match(/^\s*#{1,6}\s+(.*)$/); if (h) return h[1];
      const li = l.match(/^\s*[-*]\s+(.*)$/); if (li) return li[1];
      const ol = l.match(/^\s*\d+\.\s+(.*)$/); if (ol) return ol[1];
      return l;
    })
    .join(' ')
    .replace(/[|`*]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function textoDoHtml(h) {
  return h.replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}
function conferirFidelidade(md, html) {
  const main = (html.match(/<main class="politica"[^>]*>([\s\S]*?)<\/main>/) || [])[1];
  if (main == null) throw new Error('RECUSADO: nao achei o <main class="politica"> na pagina gerada.');
  const a = textoDoMd(md);
  const b = textoDoHtml(main);
  if (a === b) return { palavras: a.split(' ').length, caracteres: a.length };
  let k = 0;
  while (k < a.length && k < b.length && a[k] === b[k]) k++;
  throw new Error('RECUSADO: o HTML gerado NAO diz o mesmo que plataforma/privacidade-texto.md.\n'
    + '  divergem no caractere ' + k + ' de ' + a.length + '/' + b.length + '\n'
    + '  markdown: ...' + a.slice(Math.max(0, k - 60), k + 60) + '\n'
    + '  pagina  : ...' + b.slice(Math.max(0, k - 60), k + 60));
}

// ---------------------------------------------------------------------------------------------
// A PÁGINA. O chrome é o das outras cinco (fonte única: ferramentas/chrome-plataforma.js), a
// coluna de leitura é a mesma das seções de papel, e a única peça nova é a tabela da seção 3 —
// que a 390 px vira lista, porque tabela de duas colunas de texto não cabe em celular.
function pagina(md) {
  const corpo = corpoHtml(md);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="A política de privacidade da plataforma BRASIL: o que fica no seu aparelho, o que sai daqui, e o interruptor que desliga a contagem anônima em um toque. Sem cadastro, sem anúncio, sem venda de dados.">
<meta property="og:title" content="Privacidade — BRASIL">
<meta property="og:description" content="Sem cadastro, sem login, sem anúncio. O que sai daqui é uma contagem anônima, e dá para desligar em um toque.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BRASIL">
<meta property="og:url" content="${BASE}/privacidade/">
<meta property="og:locale" content="pt_BR">
<link rel="canonical" href="${BASE}/privacidade/">
<title>Privacidade — BRASIL</title>
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
  header.topo { margin-bottom:2rem; }
  h1 { font:700 clamp(2rem,8vw,2.9rem)/1.05 var(--titulo); margin:0 0 .6rem;
    text-wrap:balance; letter-spacing:-.015em; }
  .politica > p { color:var(--tinta2); margin:.2rem 0 .5rem; }
  .politica > p.data { font:600 .78rem/1.5 var(--mono); color:var(--pedra);
    letter-spacing:.03em; margin:.2rem 0 2.2rem; }

  /* Cada seção numerada é uma FOLHA de papel limpo (.cartaoCampo do chrome): é ela que mascara
     o grão do fundo atrás da coluna de leitura — a regra da onda 3 da arte, 22/08. */
  .bloco { padding:1.1rem 1.15rem 1.2rem; margin:0 0 1.1rem; }
  .bloco h2 { font:700 1.05rem/1.35 var(--mono); letter-spacing:.05em;
    text-transform:uppercase; color:var(--terra); margin:0 0 .9rem;
    padding-bottom:.5rem; border-bottom:1px solid var(--linha); }
  .bloco p { margin:0 0 .8rem; }
  .bloco p:last-child, .bloco ul:last-child, .bloco ol:last-child { margin-bottom:0; }
  .bloco ul, .bloco ol { margin:0 0 .9rem; padding-left:1.25rem; }
  .bloco li { margin:0 0 .5rem; }
  .bloco strong { color:var(--tinta); }
  code { font:400 .92em/1.4 var(--mono); background:var(--realce);
    padding:.05em .3em; border-radius:2px; overflow-wrap:anywhere; }
  a { color:var(--terra); }
  a:hover { color:var(--brasa); }

  /* A TABELA DA SEÇÃO 3 — "o que sai daqui". Duas colunas de texto não cabem em 390 px, então
     abaixo de 560 ela vira lista: cada linha é um par, com o "quando" acima em destaque. O
     cabeçalho continua no HTML (e para leitor de tela), só não ocupa duas colunas na tela
     estreita. Nenhuma palavra some — some a grade. */
  .rolaTab { margin:0 0 .9rem; }
  .tab { width:100%; border-collapse:collapse; font-size:.94rem; }
  .tab th { text-align:left; font:600 .74rem/1.4 var(--mono); letter-spacing:.06em;
    text-transform:uppercase; color:var(--terra); padding:.35rem .5rem .45rem;
    border-bottom:1px solid var(--linha); vertical-align:top; }
  .tab td { padding:.5rem; border-bottom:1px solid var(--linha); vertical-align:top;
    overflow-wrap:anywhere; }
  .tab td:first-child { color:var(--tinta); font-weight:600; width:34%; }
  @media (max-width:560px) {
    .tab, .tab thead, .tab tbody, .tab tr, .tab th, .tab td { display:block; width:auto; }
    .tab th { border:0; padding:0 0 .3rem; }
    .tab tr { border-bottom:1px solid var(--linha); padding:.55rem 0; }
    .tab td { border:0; padding:0 0 .25rem; }
    .tab td:first-child { width:auto; }
  }

  footer.rod { margin-top:2.2rem; padding-top:1.3rem; border-top:1px solid var(--linha);
    font-size:.86rem; color:var(--pedra); }
${MED.estilo()}${CHROME.barraCss()}${CHROME.campoCss()}  @media (prefers-reduced-motion:reduce) { * { animation:none!important; transition:none!important; } }
</style>
</head>
<body class="fundoCampo">
<div class="env">
  <header class="topo">
${CHROME.barraHtml('privacidade')}
  </header>

  <main class="politica" id="politica">
${corpo}
  </main>

  <footer class="rod">
    <p>Esta é a política de privacidade da plataforma <strong>BRASIL</strong>. O texto é gerado de
      uma fonte só (<code>plataforma/privacidade-texto.md</code>), e cada afirmação dele foi
      conferida contra o código que ela descreve.</p>
    <p class="med">Esta página não conta nada: ela é a única da plataforma que não envia evento
      nenhum. O interruptor da barra do topo vale para o resto do site e para o jogo.</p>
  </footer>
</div>
${MED.scriptInterruptor()}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------------------------
// A saída, e as duas guardas que todo gerador desta casa tem.
function gerar() {
  if (!fs.existsSync(FONTE)) throw new Error('RECUSADO: a fonte nao existe: plataforma/privacidade-texto.md');
  const md = textoPublicavel(fs.readFileSync(FONTE, 'utf8'));
  const html = pagina(md);
  const medida = conferirFidelidade(md, html);
  // NENHUMA REFERÊNCIA EXTERNA por src=/href= — a mesma guarda das irmãs. O próprio domínio
  // (canonical/og:url) passa; `mailto:` não é referência de rede e não casa com o padrão.
  const ext = (html.match(/(?:src|href)="https?:\/\/[^"]+"/g) || []).filter((u) => u.indexOf(BASE) < 0);
  if (ext.length) throw new Error('RECUSADO: referência externa: ' + ext[0]);
  // E nenhuma nota interna atravessou o corte.
  for (const proibido of ['NOTAS INTERNAS', 'Ressalvas legais', 'advogado de verdade', 'R6.', 'R7.']) {
    if (html.indexOf(proibido) >= 0) throw new Error('RECUSADO: a pagina publicada carrega texto das '
      + 'NOTAS INTERNAS ("' + proibido + '") — o corte em "' + CORTE + '" nao pegou.');
  }
  return { html, medida };
}

module.exports = { gerar, DATA_PUBLICACAO, DESTINO, FONTE };

if (require.main === module) {
  const r = gerar();
  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.writeFileSync(DESTINO, r.html);
  console.log('privacidade/index.html gerado — ' + (r.html.length / 1024).toFixed(0) + ' KB, '
    + 'data de publicação ' + porExtenso(DATA_PUBLICACAO) + ' (' + DATA_PUBLICACAO + ')');
  console.log('  fidelidade: o <main> e o markdown dizem a MESMA coisa — '
    + r.medida.palavras + ' palavras, ' + r.medida.caracteres + ' caracteres, zero divergência');
}
