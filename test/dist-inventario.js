// O PORTAO DO INVENTARIO DE `dist/` — item `portao-conjunto-publicado-por-secao`, 04/09.
//
//   node test/dist-inventario.js        (exige `npm run build` antes: ele le dist/, que e a saida)
//
// ============================================================================
// O QUE ELE FECHA, e a diferenca entre INSTANCIA e CLASSE e o assunto inteiro deste arquivo.
//
// 23/08: `territorio/PINOS-PROPOSTA.md` — rascunho da historiadora, 49 pinos NAO aprovados, cinco
// marcados PARE — respondia 200 em producao, fora de qualquer Disallow, sem nenhuma pagina que o
// buscasse. O conserto de entao foi bloquear a EXTENSAO `.md` no laco das secoes do
// `ferramentas/construir.js`.
//
// 04/09, doze dias depois: a GEMEA do mesmo rascunho, `territorio/pinos-proposta.json`, 27 KB com
// o texto candidato dos mesmos 49 pinos e os mesmos 5 PARE, continuava publicada — porque nao
// termina em `.md`. O conserto de 04/09 (item `territorio-rico`) trocou a regra de EXTENSAO por
// uma regra de USO: publica-se o `index.html` e o que ELE cita.
//
// Isso conserta a INSTANCIA e NAO conserta a CLASSE, e a distincao e a razao deste arquivo:
//
//   a) a regra de uso vive DENTRO do laco de cinco secoes do build. `dist/dashboard/`,
//      `dist/jogo/`, `dist/mesa/` e a RAIZ de `dist/` sao montados por outros trechos, cada um
//      com o seu criterio, e nenhum deles pergunta "alguma pagina pede este arquivo?";
//   b) regra dentro do build e o build se conferindo. Os dois consertos anteriores foram achados
//      por auditoria humana, doze dias e um vazamento depois. Um portao que le o DISCO e pergunta
//      o conjunto e independente do trecho de build que escreveu cada byte — e e o unico jeito de
//      um trecho NOVO de build, escrito daqui a um mes, nascer ja coberto.
//
// A REGRA, e ela cabe numa linha: **em cada pasta de `dist/`, o unico arquivo que pode existir e
// o `index.html` e o que ele cita** — mais um punhado de excecoes PREGADAS aqui, cada uma com o
// porque escrito E com uma cobranca que este portao verifica. Excecao sem cobranca e lista de
// perdao, e lista de perdao e como portao apodrece.
//
// ============================================================================
// AS DUAS FORMAS DE CITACAO ACEITAS, e as duas foram MEDIDAS nos 30 arquivos de hoje:
//
//   1. `/nome`  — referencia por CAMINHO. E a forma do `og:image` (`/compartilhar.jpg`, em 5 das
//      6 paginas), de `href=` e de `src=`. E a unica forma que o laco das secoes do build aceita,
//      de proposito: a pagina do TERRITORIO cita `malha-ibge.json` em PROSA, num comentario que
//      explica de onde a geografia vem, e sem a barra essa mencao bastaria para publicar 100 KB
//      que ninguem pede.
//   2. `"nome"` ou `'nome'` — referencia RELATIVA entre aspas. E a forma do
//      `fetch("backlog.json")` do dashboard, que nao leva barra porque precisa resolver debaixo
//      de `/dashboard/` onde quer que a pagina esteja. Medido: sem esta forma, `backlog.json` so
//      passaria por acidente (a string `/backlog.json` aparece num COMENTARIO da pagina, e portao
//      que depende de um comentario e portao que quebra na primeira faxina de comentario).
//
// ESTE PORTAO E DE PROPOSITO MAIS FROUXO QUE O LACO DO BUILD, e isso nao e descuido. Quem decide
// o que VIAJA e o build; quem decide o que pode ESTAR NO DISCO depois e este arquivo. Se ele
// fosse mais estrito que o build, um build verde daria portao vermelho e a saida seria afrouxar
// um dos dois. Sendo mais frouxo, ele nunca contradiz o build — e ainda assim morde tudo que
// chega em `dist/` por um caminho que o laco do build nao cobre, que e o buraco de 12 dias.
//
// ============================================================================
// PROVA DE MORDIDA (EQUIPE.md 2.8: instrumento que nunca foi visto reprovando e decoracao).
// Depois de `npm run build`:
//
//   node -e "require('fs').writeFileSync('dist/territorio/algo-esquecido.json','{}')"
//   node test/dist-inventario.js     -> exit 1, nomeando dist/territorio/algo-esquecido.json
//   node -e "require('fs').unlinkSync('dist/territorio/algo-esquecido.json')"
//   node test/dist-inventario.js     -> exit 0
//
// E ele mordeu conteudo DE VERDADE na primeira execucao, antes de qualquer injecao:
// `dist/dashboard/precos-modelo.json` era copiado pelo build e NENHUMA pagina o buscava desde
// 01/09 (o commit ba3f609 tirou o leitor do dashboard e deixou a copia do build de pe). Tres dias
// de arquivo orfao respondendo 200 — a mesma classe do `pinos-proposta.json`, achada por este
// portao em vez de por auditoria.
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');

const falhas = [];
const reprovar = m => falhas.push(m);

// ============================================================================
// AS EXCECOES PREGADAS. Uma entrada por arquivo que existe em `dist/` sem nenhuma pagina o citar
// pelo nome, com o PORQUE e com a COBRANCA — a asserção que faz a excecao continuar valendo. Se a
// cobranca cair, a excecao cai junto e o arquivo volta a reprovar. Mexer aqui tem de ser chato de
// fazer por acidente: e o mesmo espirito da tabela da CSP em `ferramentas/construir.js`.
const SEM_CITACAO = {
  '/': [
    {
      // Arquivo de PROTOCOLO: o robo o pede pelo nome bem-conhecido, na raiz, sem link nenhum.
      // Nenhuma pagina o cita porque nenhuma pagina PODE cita-lo — e o robo que sabe o nome.
      nome: 'robots.txt',
      porque: 'arquivo de protocolo pedido pelo nome bem-conhecido; nenhuma pagina o linka',
      // COBRANCA: ele so e "o robots.txt" enquanto disser o que o build promete que ele diz. Um
      // robots.txt que perdeu o `Disallow: /dashboard` deixou de ser a trava que a fila interna
      // (24 KB de material de trabalho em /dashboard/backlog.json) depende, e ai a excecao que o
      // deixa existir aqui deixou de ter fundamento.
      cobrar: (txt) => (/^Disallow:\s*\/dashboard\s*$/m.test(txt) && /^Sitemap:\s*https?:\/\/\S+$/m.test(txt))
        ? null
        : 'perdeu o `Disallow: /dashboard` ou a linha `Sitemap:` — deixou de ser o robots.txt que o build promete',
    },
    {
      nome: 'sitemap.xml',
      porque: 'arquivo de protocolo lido pelo buscador a partir da linha Sitemap: do robots.txt',
      // COBRANCA: tem de ser o urlset que o build escreve, e o `robots.txt` ao lado tem de
      // aponta-lo. Sitemap que nao e urlset e um arquivo qualquer com nome de sitemap.
      cobrar: (txt) => /<urlset\b/.test(txt) && /<loc>https?:\/\//.test(txt)
        ? null
        : 'nao e um <urlset> com <loc> — deixou de ser o sitemap que o robots.txt aponta',
    },
  ],
  '/jogo/': [
    {
      // O NOME DO PACOTE E MONTADO EM TEMPO DE EXECUCAO — `caminhoPacote(nome)` devolve
      // `"pack-" + nome + ".json"`, entao a string `pack-cais.json` NAO EXISTE no HTML e nenhuma
      // busca por citacao a acharia. E a excecao do arquivo unico (CLAUDE.md §3), a unica.
      padrao: /^pack-([\w-]+)\.json$/,
      porque: 'arte sob demanda: o nome e montado por caminhoPacote(nome) e nao aparece literal no HTML',
      // COBRANCA, e ela e o que separa esta excecao de um passe livre para `pack-*.json`:
      //   (a) a funcao que monta o caminho tem de continuar montando um caminho RELATIVO do
      //       proprio dominio — a mesma forma exata que o build ja prega em `construir.js`;
      //   (b) o NOME NU do capitulo (o argumento que a funcao recebe) tem de aparecer entre aspas
      //       no HTML. Medido nos 11 pacotes de hoje: os 11 aparecem. E isso que faz um
      //       `pack-de-um-capitulo-removido.json` esquecido no disco REPROVAR em vez de passar
      //       por ser `pack-*`.
      cobrar: (txt, nome, html) => {
        const f = html.match(/function caminhoPacote\([^)]*\)\s*\{[^{}]*\}/);
        if (!f) return 'nao ha funcao caminhoPacote() no jogo — a excecao dos pacotes perdeu o fundamento';
        if (!/^function caminhoPacote\(([A-Za-z_$][\w$]*)\)\s*\{\s*return "pack-" \+ \1 \+ "\.json";\s*\}$/.test(f[0])) {
          return 'caminhoPacote() deixou de montar um caminho relativo do proprio dominio: ' + f[0];
        }
        const capitulo = /^pack-([\w-]+)\.json$/.exec(nome)[1];
        if (html.indexOf('"' + capitulo + '"') < 0 && html.indexOf("'" + capitulo + "'") < 0) {
          return 'o jogo nao menciona o capitulo "' + capitulo + '" em lugar nenhum — pacote de um'
            + ' capitulo que deixou de existir, esquecido no disco';
        }
        return null;
      },
    },
  ],
};

// ============================================================================
if (!fs.existsSync(DIST)) {
  console.error('FALHA: dist/ nao existe. Rode `npm run build` antes — este portao le a SAIDA,');
  console.error('       nao a fonte, porque e a saida que a Vercel publica.');
  process.exit(1);
}

// As pastas de `dist/`, cada uma com a rota que ela serve. A raiz e `/`.
function pastas(dir, rota) {
  let fora = [{ rota, dir }];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) fora = fora.concat(pastas(p, rota + f + '/'));
  }
  return fora;
}
const todas = pastas(DIST, '/').sort((a, b) => a.rota.localeCompare(b.rota));

console.log('INVENTARIO DE dist/ — ' + todas.length + ' pasta(s)');
let totalArquivos = 0;
let totalExcecoes = 0;

for (const { rota, dir } of todas) {
  const arquivos = fs.readdirSync(dir).filter(f => !fs.statSync(path.join(dir, f)).isDirectory()).sort();
  // Pasta que so contem outras pastas nao publica nada: nao ha o que conferir nela.
  if (!arquivos.length) { console.log('  ' + rota.padEnd(16) + ' (so subpastas)'); continue; }

  const idx = path.join(dir, 'index.html');
  if (!fs.existsSync(idx)) {
    reprovar(rota + ' publica ' + arquivos.length + ' arquivo(s) e NAO tem index.html: ['
      + arquivos.join(', ') + ']. Pasta publicada sem pagina e um punhado de arquivos respondendo'
      + ' 200 sem nada que os peca — que e exatamente a forma do vazamento de 23/08 e 04/09.');
    console.log('  ' + rota.padEnd(16) + ' SEM index.html');
    continue;
  }
  const html = fs.readFileSync(idx, 'utf8');
  const excecoes = SEM_CITACAO[rota] || [];

  const citados = [];
  const porExcecao = [];
  const extras = [];
  for (const f of arquivos) {
    totalArquivos++;
    if (f === 'index.html') { citados.push(f); continue; }
    // 1. a pagina o cita? (caminho com barra, ou nome relativo entre aspas)
    if (html.indexOf('/' + f) >= 0 || html.indexOf('"' + f + '"') >= 0 || html.indexOf("'" + f + "'") >= 0) {
      citados.push(f);
      continue;
    }
    // 2. ha excecao pregada para ele? E a cobranca dela ainda vale?
    const e = excecoes.find(x => x.nome === f || (x.padrao && x.padrao.test(f)));
    if (e) {
      const queixa = e.cobrar(fs.readFileSync(path.join(dir, f), 'utf8'), f, html);
      if (queixa) {
        reprovar(rota + f + ' esta na lista de excecoes deste portao, mas a COBRANCA da excecao'
          + ' caiu: ' + queixa + '. A excecao existia porque "' + e.porque + '" — se isso deixou de'
          + ' ser verdade, o arquivo deixou de ter motivo para ser publicado.');
      } else {
        porExcecao.push(f);
        totalExcecoes++;
      }
      continue;
    }
    // 3. ninguem o pede e ninguem o justificou.
    extras.push(f);
    reprovar(rota + f + ' e PUBLICADO e nenhuma pagina o cita: nao aparece em ' + rota + 'index.html'
      + ' nem como caminho (`/' + f + '`) nem como nome relativo entre aspas (`"' + f + '"`), e nao'
      + ' ha excecao pregada para ele em test/dist-inventario.js. Arquivo que ninguem busca nao tem'
      + ' por que responder 200 — foi assim que 49 pinos NAO aprovados (5 marcados PARE) ficaram'
      + ' 12 dias no ar. Se ele deve viajar, faca a pagina cita-lo; se nao deve, tire-o do build;'
      + ' se e caso de protocolo (robots.txt, sitemap.xml), pregue a excecao COM a cobranca.');
  }

  console.log('  ' + rota.padEnd(16) + ' ' + String(arquivos.length).padStart(2) + ' arquivo(s)'
    + '  citados=' + citados.length
    + '  excecao=' + porExcecao.length
    + '  SEM DONO=' + extras.length
    + (extras.length ? '  <- ' + extras.join(', ') : ''));
}

console.log('');
if (falhas.length) {
  console.error('REPROVADO — ' + falhas.length + ' falha(s):');
  falhas.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
console.log('OK — ' + totalArquivos + ' arquivo(s) em ' + todas.length + ' pasta(s) de dist/,'
  + ' todos citados por uma pagina ou cobertos por excecao pregada com cobranca conferida ('
  + totalExcecoes + ' por excecao).');
process.exit(0);
