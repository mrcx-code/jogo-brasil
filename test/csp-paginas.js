// O PORTAO DA CSP DAS PAGINAS PUBLICAS — item `csp-paginas-publicas`, 02/09.
//
//   node test/csp-paginas.js        (exige `npm run build` antes: ele le dist/, que e a saida)
//
// O QUE ELE FECHA. Ate 02/09 a Content-Security-Policy existia em exatamente DOIS lugares
// deste repositorio: no <head> do jogo (desde 10/08, CLAUDE.md §3) e no <head> do dashboard
// (pregada no build por `conferirCspDashboard`). As cinco paginas publicas da plataforma
// — a PORTA (`/`), A HISTORIA, o GLOSSARIO, DE ONDE VEM e O TERRITORIO — nasceram depois e
// **nunca tiveram CSP nenhuma**, nem no HTML nem no cabecalho de servidor. Medido:
//
//     grep -c -i Content-Security-Policy plataforma/index.html glossario/index.html \
//         historia/index.html de-onde-vem/index.html territorio/index.html     -> 0, 0, 0, 0, 0
//
// e o `vercel.json` so declarava cabecalho para `/dashboard`. Cinco paginas de PRODUCAO
// descobertas nas duas pontas, num repositorio em que push na `main` publica sozinho.
//
// POR QUE POR CABECALHO E NAO POR <meta>, e as tres razoes se conferem:
//   1. um cabecalho cobre as cinco paginas de uma vez, sem tocar cinco geradores diferentes
//      (`ferramentas/gerar-*.js`), que sao a fonte de cada uma delas;
//   2. `frame-ancestors` — a defesa contra clickjacking — **so funciona por cabecalho**. Num
//      <meta http-equiv> o navegador a IGNORA, em silencio. Idem `report-uri`. Uma CSP de
//      <meta> nao teria como proteger a moldura de nenhuma das cinco;
//   3. o `/dashboard` ja e servido assim desde 21/08, entao a casa ja tem o padrao e o formato
//      do `vercel.json` ja esta provado em producao.
//
// O QUE ESTE PORTAO COBRA, e cada cobranca falha com exit 1:
//   A. TODA pagina publicada em dist/ (todo index.html) tem CSP — por cabecalho no vercel.json
//      OU por <meta http-equiv> no proprio HTML. Pagina publicada nova sem CSP reprova.
//   B. A CSP de cada rota bate, DIRETIVA POR DIRETIVA, com a tabela pregada aqui embaixo. E a
//      mesma disciplina de `CSP_ESPERADA` (construir.js) e de `conferirCspDashboard`: a CSP
//      mudar sem a tabela acompanhar e um build vermelho, de proposito. CSP que se afrouxa por
//      conveniencia e o comeco de nao ter CSP.
//   C. NENHUM CURINGA, em valor nenhum (CLAUDE.md §3, escrito por extenso, com esquema).
//   D. A forma dos `source` do vercel.json e conferivel: literal, ou literal + `(.*)`. Um
//      `source` com sintaxe que este portao nao sabe resolver reprova, em vez de passar verde
//      sobre uma cobertura que ninguem verificou.
//   E. AS PAGINAS NAO QUEBRAM. Sobe um servidor local que aplica os cabecalhos do vercel.json
//      pelo MESMO resolvedor, abre cada pagina no Chromium e falha com QUALQUER erro de console
//      ou QUALQUER `securitypolicyviolation`. Uma CSP que passa no portao e branqueia a pagina
//      em producao seria o pior desfecho possivel — e push na main publica sozinho.
//
// O POSTHOG E ATENDIDO LOCALMENTE (`page.route`), e isso e medicao, nao maquiagem: a maquina de
// nuvem em que este portao roda bloqueia `us.i.posthog.com` no proxy, o que somaria um
// ERR_TUNNEL_CONNECTION_FAILED por pagina que nao e defeito de pagina nenhuma. Se a CSP proibir
// a conexao, o `route` NAO chega a disparar e a violacao de `connect-src` aparece assim mesmo —
// que e exatamente o que se quer medir. O contador `medicoes` e impresso por isso.
//
// F. O ELO QUE NENHUMA CHECAGEM LOCAL FECHA — o cabecalho que a VERCEL de fato serve.
//
// Tudo acima prova que o vercel.json esta certo e que a politica nao quebra as paginas. Nada
// disso prova que a Vercel APLICOU o cabecalho: um `source` que ela case diferente do que este
// portao resolve daria portao verde e producao descoberta, em silencio — que e exatamente o
// modo de falha que o CLAUDE.md §3 descreve para a CSP do jogo ("falha em SILENCIO").
//
// Entao o portao sabe olhar um endereco de verdade:
//
//     CSP_AO_VIVO=https://matheusferreira.cc node test/csp-paginas.js
//
// Ele pede cada rota publicada e cobra o cabecalho Content-Security-Policy que veio na
// RESPOSTA, contra a MESMA tabela. Nao entra no CI: depende de deploy pronto e de rede. E o
// comando de UMA LINHA que o plantao roda depois do primeiro deploy — e que ele pode repetir
// a qualquer momento sem credencial nenhuma.
//
// PROVA DE MORDIDA DELE: apontado para um servidor que NAO manda o cabecalho, ele reprova.
//     node ferramentas/servir.js 8199 dist &
//     CSP_AO_VIVO=http://127.0.0.1:8199 node test/csp-paginas.js   -> exit 1
//
// PROVA DE MORDIDA (EQUIPE.md 2.8: instrumento que nunca foi visto reprovando e decoracao):
//   CSP_INJETAR_FALHA=/glossario/  node test/csp-paginas.js    -> exit 1
//   node test/csp-paginas.js                                    -> exit 0
// A variavel apaga a CSP daquela rota EM MEMORIA, sem tocar no disco.
//
// ARMADILHA DO GIT BASH NO WINDOWS, e ela ja fez este portao mentir (item
// `csp-injetar-falha-no-op-windows`, achado pelo QA em 04/09 auditando a entrega de
// /privacidade/). O MSYS converte todo argumento que PARECE caminho absoluto, e a variavel acima
// e exatamente isso. Medido nesta maquina:
//
//     CSP_INJETAR_FALHA=/privacidade/ node -e "console.log(process.env.CSP_INJETAR_FALHA)"
//     -> C:/Program Files/Git/privacidade/
//
// Ate 04/09 o portao aceitava esse valor calado: imprimia "INJECAO DE DEFEITO ATIVA" para uma
// rota inventada pelo MSYS, nao apagava CSP nenhuma, e saia **exit 0** — a pior saida possivel
// para uma prova de mordida, porque ela parece a prova e nao e. O bloco `CONFERIR A INJECAO`
// mais abaixo passou a RECUSAR (exit 2) rota que nao esteja em CSP_ESPERADA. O exit e 2, e nao
// 1, de proposito: 1 significa "o portao mordeu" e e o que a prova de mordida procura; 2
// significa "o portao foi mal chamado e nao mediu nada". Confundir os dois e o defeito de novo.
// Como passar a rota sem o MSYS comer:
//     MSYS_NO_PATHCONV=1 CSP_INJETAR_FALHA=/privacidade/ node test/csp-paginas.js   (Git Bash)
//     $env:CSP_INJETAR_FALHA='/privacidade/'; node test/csp-paginas.js              (PowerShell)
// As duas formas foram medidas: chegam intactas em process.env.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const VERCEL = path.join(RAIZ, 'vercel.json');
const INJETAR = process.env.CSP_INJETAR_FALHA || '';
const AO_VIVO = (process.env.CSP_AO_VIVO || '').replace(/\/$/, '');
// PROVA DE MORDIDA DO ITEM `jogo-connect-src-sem-portao` (02/09): o cabecalho de /jogo/ hoje e
// SO_MOLDURA (so `frame-ancestors`), sem `connect-src` nenhum -- e e por isso que o fetch do
// pack-*.json (mesma origem) passa. O risco real e alguem acrescentar `connect-src` aquela
// tabela um dia e esquecer o `'self'` dos pacotes (exatamente o erro que a CSP do JOGO evita
// desde 10/08, CLAUDE.md paragrafo 3). Esta variavel simula isso EM MEMORIA, sem tocar o
// vercel.json em disco: acrescenta um `connect-src` restritivo (sem 'self') ao cabecalho que o
// servidor local manda para /jogo/, e o bloco E abaixo tem de reprovar.
//   CSP_JOGO_CONNECT_TESTE="https://us.i.posthog.com"  node test/csp-paginas.js   -> exit 1
const CONNECT_TESTE = process.env.CSP_JOGO_CONNECT_TESTE || '';
// PROVA DE MORDIDA DA ROTA /privacidade/ (04/09, item `pagina-privacidade`). A política afirma,
// no rodapé dela e por omissão de `connect-src` na tabela acima, que aquela página NAO manda
// evento nenhum. Uma afirmação dessas precisa de portão, senão ela é só uma frase — e o modo de
// falha é silencioso: alguém acrescenta `MED.script(...)` ao gerador um dia e a página passa a
// medir sem que nada quebre. Esta variável injeta EM MEMORIA (o disco nunca é tocado) um `fetch`
// para o host da medição dentro de /privacidade/, e o portão tem de reprovar por DOIS caminhos
// independentes: a violação de CSP (o `default-src 'none'` barra a conexão antes de ela sair) e,
// se um dia a CSP afrouxar, a contagem de `medicoes` daquela rota.
//   CSP_PRIV_MEDE_TESTE=1 node test/csp-paginas.js   -> exit 1 (a CSP barra: violacao de connect-src)
//   CSP_PRIV_MEDE_TESTE=2 node test/csp-paginas.js   -> exit 1 (a CSP tambem afrouxada SO no
//                                                     servidor local: o pedido sai e quem morde e
//                                                     a contagem de `medicoes`)
// O modo 2 existe porque, com a CSP inteira, a segunda asserção NUNCA seria vista reprovando —
// ela é a rede de baixo, e rede que ninguém viu segurar é decoração (EQUIPE.md 2.8).
const PRIV_MEDE = process.env.CSP_PRIV_MEDE_TESTE || '';

const falhas = [];
const reprovar = m => falhas.push(m);

// ============================================================================
// A TABELA PREGADA. Uma linha por rota publicada, e cada diretiva por extenso.
// Mexer aqui tem de ser chato de fazer por acidente — e o mesmo espirito da tabela da CSP do
// jogo em ferramentas/construir.js. O comentario ao lado de cada grupo diz POR QUE aquela
// pagina precisa daquilo; diretiva sem porque escrito nao entra.
const SECAO = {
  // A PORTA, A HISTORIA, O GLOSSARIO, DE ONDE VEM.
  'default-src': "'none'",              // nada e permitido por omissao; cada abertura e explicita
  'script-src': "'unsafe-inline'",      // 2 a 3 <script> INLINE por pagina e ZERO `src=` externo
  //                                       (medido: `grep -o '<script[^>]*src='` nao casa em
  //                                       nenhuma das cinco). Nao ha script externo a permitir;
  //                                       'unsafe-inline' aqui nao e conveniencia, e a unica
  //                                       forma sem hash, e o hash teria de ser recalculado a
  //                                       cada regeracao pelos `ferramentas/gerar-*.js`.
  'style-src': "'unsafe-inline'",       // 1 a 2 <style> inline por pagina, zero folha externa
  'img-src': 'data:',                   // toda imagem e data:image/webp;base64 embutida.
  //                                       SEM 'self': nenhuma pagina carrega arquivo de imagem
  //                                       (o compartilhar.jpg e og:image, lido pelo robo do
  //                                       cartao do link, nunca pela pagina)
  'connect-src': 'https://us.i.posthog.com', // a contagem anonima do §3, o MEDIDA_HOST, por
  //                                       extenso e com esquema. SEM 'self': nenhuma das quatro
  //                                       faz fetch de mesma origem (o jogo faz, por causa dos
  //                                       pack-*.json; estas nao)
  'base-uri': "'none'",                 // <base> injetado nao reescreve link nenhum
  'form-action': "'none'",              // zero <form> nas cinco (medido)
  'frame-ancestors': "'none'",          // clickjacking. SO FUNCIONA POR CABECALHO
};
const TERRITORIO = Object.assign({}, SECAO, {
  // O TERRITORIO e a UNICA das cinco que precisa de algo a mais, e por isso NAO divide a regra
  // com as outras: ela monta os dois modulos do three.js em tempo de execucao
  // (`URL.createObjectURL(new Blob([...], {type:"text/javascript"}))`) e os importa por `blob:`.
  // Medido: 2 pedidos de resourceType `script` com URL `blob:` a cada carga. Sem `blob:` a
  // placa 3D nao desenha. Dar `blob:` as outras quatro seria fazer da CSP unica a mais frouxa
  // das cinco, que e o comeco de nao ter CSP.
  'script-src': "'unsafe-inline' blob:",
});
const PRIVACIDADE = {
  // A POLÍTICA DE PRIVACIDADE (04/09). É a SECAO menos o `connect-src`, e a ausência é o ponto:
  // esta é a única página pública que não manda evento nenhum. A seção 3 do texto dela descreve
  // o `secao aberta` como "qual das CINCO seções foi aberta" — medir a própria política tornaria
  // essa frase falsa no mesmo commit. Sem `connect-src`, quem barra é o `default-src 'none'`, e
  // quem cobra é o navegador: se algum dia alguém puser um `fetch` aqui, o bloco E abaixo acusa
  // uma violação de CSP em vez de deixar passar. Ela carrega o INTERRUPTOR da medição (que só
  // lê e grava `localStorage`), porque o texto promete que ele está na barra de qualquer página.
  'default-src': "'none'",
  'script-src': "'unsafe-inline'",
  'style-src': "'unsafe-inline'",
  'img-src': 'data:',
  'base-uri': "'none'",
  'form-action': "'none'",
  'frame-ancestors': "'none'",
};
const MESA = {
  // /mesa/ e um coto de 3 linhas que redireciona para /dashboard/ por <meta refresh>. Zero
  // script, zero style, zero imagem: a CSP mais fechada que existe cabe nela inteira.
  'default-src': "'none'",
  'base-uri': "'none'",
  'form-action': "'none'",
  'frame-ancestors': "'none'",
};
const SO_MOLDURA = {
  // /jogo/ e /dashboard/ ja carregam a CSP DELES no <head>, e a do jogo e sagrada (CLAUDE.md §3).
  // O cabecalho aqui acrescenta a UNICA diretiva que o <meta> nao consegue expressar —
  // `frame-ancestors` — e nada mais. Duas politicas valem por INTERSECCAO, entao um cabecalho
  // com so essa diretiva nao tem como restringir script, style, img nem connect: o fetch dos
  // pack-*.json do jogo continua governado so pelo <meta> dele.
  'frame-ancestors': "'none'",
};
const CSP_ESPERADA = {
  '/': SECAO,
  '/historia/': SECAO,
  '/glossario/': SECAO,
  '/de-onde-vem/': SECAO,
  '/territorio/': TERRITORIO,
  '/privacidade/': PRIVACIDADE,
  '/mesa/': MESA,
  '/jogo/': SO_MOLDURA,
  '/dashboard/': SO_MOLDURA,
};

// ============================================================================
// CONFERIR A INJECAO — antes de qualquer medicao, porque injecao que nao pega nada e um
// portao que mente verde. Ver a ARMADILHA DO GIT BASH no cabecalho deste arquivo.
if (INJETAR && !Object.prototype.hasOwnProperty.call(CSP_ESPERADA, INJETAR)) {
  console.error('RECUSADO — CSP_INJETAR_FALHA: rota desconhecida: "' + INJETAR + '"');
  console.error('  chaves validas: ' + Object.keys(CSP_ESPERADA).join(' '));
  if (/^[A-Za-z]:[\\/]/.test(INJETAR)) {
    console.error('');
    console.error('  Esse valor tem cara de caminho do Windows, entao provavelmente foi o Git Bash:');
    console.error('  o MSYS converte todo argumento que parece caminho absoluto, e "/privacidade/"');
    console.error('  chega aqui como "C:/Program Files/Git/privacidade/". Passe assim:');
    console.error('    MSYS_NO_PATHCONV=1 CSP_INJETAR_FALHA=<rota> node test/csp-paginas.js');
    console.error('    $env:CSP_INJETAR_FALHA=\'<rota>\'; node test/csp-paginas.js   (PowerShell)');
  }
  console.error('');
  console.error('  Nada foi medido. Este exit e 2, e nao 1, de proposito: 1 e "o portao mordeu",');
  console.error('  que e o que a prova de mordida procura; 2 e "o portao foi mal chamado".');
  process.exit(2);
}

// As paginas que o navegador abre de verdade neste portao. /dashboard/ fica de fora porque fala
// com o Supabase (bloqueado pelo proxy desta maquina) e ja tem portao proprio no build
// (`conferirCspDashboard`); /mesa/ entra por um caminho proprio, mais abaixo, porque ele navega.
const NO_NAVEGADOR = ['/', '/historia/', '/glossario/', '/de-onde-vem/', '/territorio/',
  '/privacidade/', '/jogo/'];

// ============================================================================
// D. O RESOLVEDOR — que cabecalho a Vercel vai servir para uma rota.
// So duas formas de `source` sao aceitas: o literal e o literal seguido de `(.*)`. Qualquer
// outra sintaxe reprova, em vez de ser adivinhada.
if (!fs.existsSync(VERCEL)) { console.error('FALHA: vercel.json nao existe'); process.exit(1); }
const vercel = JSON.parse(fs.readFileSync(VERCEL, 'utf8'));
const regras = vercel.headers || [];
for (const r of regras) {
  const s = String(r.source || '');
  const ok = /^\/[A-Za-z0-9\/._-]*$/.test(s) || /^\/[A-Za-z0-9\/._-]*\/\(\.\*\)$/.test(s);
  if (!ok) reprovar('D. `source` que este portao nao sabe resolver: "' + s + '". Use o literal'
    + ' ou o literal + "/(.*)" — ou ensine a forma nova a este arquivo. Cobertura que ninguem'
    + ' verifica nao passa verde.');
}
function cabecalhosDaRota(rota) {
  const saida = {};
  for (const r of regras) {
    const s = String(r.source || '');
    let casa = false;
    if (s.endsWith('/(.*)')) casa = rota.startsWith(s.slice(0, -4));
    else casa = rota === s;
    if (!casa) continue;
    for (const h of (r.headers || [])) saida[h.key] = h.value;   // a Vercel: a ultima casa vence
  }
  if (INJETAR && rota === INJETAR) delete saida['Content-Security-Policy'];
  if (CONNECT_TESTE && rota === '/jogo/' && saida['Content-Security-Policy']) {
    saida['Content-Security-Policy'] = saida['Content-Security-Policy'] + '; connect-src ' + CONNECT_TESTE;
  }
  return saida;
}
// O PACOTE DE ARTE, BAIXADO DE VERDADE. Ate 02/09 nenhum portao carregava /jogo/ e ficava tempo
// suficiente, ou fazia qualquer coisa, para exercitar o `fetch(caminhoPacote(nome))` de
// `src/jogo.ts` -- medido: /jogo/ parado no menu por 4s faz UM pedido de rede (o POST do
// PostHog) e ZERO pedido de mesma origem. O recuo de pacote que falha e SILENCIOSO por desenho
// (CLAUDE.md paragrafo 3, letra a: "o jogo nunca fica sem chao"), entao uma CSP que bloqueia o
// fetch nao aparece como erro de console nem como pagina branca -- so como capitulo 8 (Cais)
// pintado com a arte do capitulo 1, pra sempre, em producao. Isto chama o mesmo `fetch` que o
// jogo chama (relativo, sem cabecalho especial) e mede bytes de verdade.
async function medirPacoteJogo(nav, porta) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:' + porta + '/jogo/', { waitUntil: 'load', timeout: 45000 })
    .catch(function () { /* o proprio fetch abaixo relata o que faltou */ });
  const r = await pg.evaluate(async function () {
    try {
      const resp = await fetch('pack-cais.json');
      if (!resp.ok) return { ok: false, status: resp.status, bytes: 0 };
      const buf = await resp.arrayBuffer();
      return { ok: true, status: resp.status, bytes: buf.byteLength };
    } catch (e) {
      return { ok: false, erro: String((e && e.message) || e), bytes: 0 };
    }
  });
  await ctx.close();
  return r;
}
function partirCsp(txt) {
  const d = {};
  String(txt).split(';').forEach(function (p) {
    const t = p.trim(); if (!t) return;
    const i = t.indexOf(' ');
    d[i < 0 ? t : t.slice(0, i)] = i < 0 ? '' : t.slice(i + 1).trim();
  });
  return d;
}

// ============================================================================
// A + B + C. As paginas publicadas, uma por uma.
if (!fs.existsSync(DIST)) {
  console.error('FALHA: dist/ nao existe. Rode `npm run build` antes — este portao le a SAIDA,');
  console.error('       nao a fonte, porque e a saida que a Vercel publica.');
  process.exit(1);
}
function paginas(dir, prefixo) {
  let fora = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) fora = fora.concat(paginas(p, prefixo + f + '/'));
    else if (f === 'index.html') fora.push({ rota: prefixo, arquivo: p });
  }
  return fora;
}
const publicadas = paginas(DIST, '/').sort((a, b) => a.rota.localeCompare(b.rota));
console.log('PAGINAS PUBLICADAS EM dist/ — ' + publicadas.length);
if (INJETAR) console.log('*** INJECAO DE DEFEITO ATIVA: a CSP de "' + INJETAR + '" foi apagada em memoria ***');

for (const pg of publicadas) {
  const cab = cabecalhosDaRota(pg.rota);
  const html = fs.readFileSync(pg.arquivo, 'utf8');
  const meta = (html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/) || [])[1] || null;
  const cabCsp = cab['Content-Security-Policy'] || null;

  // A — cobertura
  if (!cabCsp && !meta) {
    reprovar('A. ' + pg.rota + ' e publicada e NAO tem CSP nenhuma: nem cabecalho no vercel.json,'
      + ' nem <meta http-equiv> no HTML. Pagina publicada sem CSP nao vai para a producao.');
    console.log('  ' + pg.rota.padEnd(15) + ' SEM CSP');
    continue;
  }
  // C — curinga
  for (const [onde, txt] of [['cabecalho', cabCsp], ['<meta>', meta]]) {
    if (txt && txt.indexOf('*') >= 0) {
      reprovar('C. ' + pg.rota + ' tem CURINGA na CSP do ' + onde + ': "' + txt + '". O CLAUDE.md'
        + ' §3 manda escrever por extenso, com esquema, nenhum curinga, nunca.');
    }
  }
  // B — a tabela pregada
  const esperada = CSP_ESPERADA[pg.rota];
  if (!esperada) {
    reprovar('B. ' + pg.rota + ' e uma pagina PUBLICADA que a tabela CSP_ESPERADA deste portao'
      + ' nao conhece. Acrescente a linha dela (com o porque de cada diretiva) antes de publicar.');
  } else if (!cabCsp) {
    reprovar('B. ' + pg.rota + ' perdeu o cabecalho Content-Security-Policy do vercel.json.');
  } else {
    const achada = partirCsp(cabCsp);
    const nomes = [...new Set(Object.keys(esperada).concat(Object.keys(achada)))].sort();
    for (const n of nomes) {
      if (achada[n] !== esperada[n]) {
        reprovar('B. a CSP de ' + pg.rota + ' mudou e a tabela deste portao nao sabe disso: `' + n
          + '` esta "' + (achada[n] === undefined ? '(ausente)' : achada[n]) + '" e a tabela espera "'
          + (esperada[n] === undefined ? '(ausente)' : esperada[n]) + '"');
      }
    }
  }
  console.log('  ' + pg.rota.padEnd(15) + ' cabecalho=' + (cabCsp ? 'sim' : 'nao')
    + '  <meta>=' + (meta ? 'sim' : 'nao')
    + '  XFO=' + (cab['X-Frame-Options'] || '-')
    + '  nosniff=' + (cab['X-Content-Type-Options'] ? 'sim' : 'nao'));
}

// ============================================================================
// E. AS PAGINAS NAO QUEBRAM — o navegador, com os cabecalhos aplicados.
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8'
};
// Porta derivada do caminho da raiz, como no abrir.js e pelo mesmo motivo (ha dezenas de
// worktrees no disco e todos serviriam pastas diferentes na mesma porta fixa). Faixa propria,
// fora da 8201-8454 do abrir.js, para os dois poderem rodar juntos.
const PORTA = 9101 + (function (s) {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 254;
})(RAIZ.toLowerCase());

const servidor = http.createServer(function (req, res) {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  let alvo = path.normalize(path.join(DIST, rel));
  if (!alvo.startsWith(DIST)) { res.writeHead(403).end('fora da raiz'); return; }
  try {
    if (fs.statSync(alvo).isDirectory()) {
      if (!rel.endsWith('/')) { res.writeHead(301, { Location: rel + '/' }).end(); return; }
      alvo = path.join(alvo, 'index.html');
    }
  } catch (e) { /* o readFile abaixo responde 404 */ }
  fs.readFile(alvo, function (err, buf0) {
    if (err) { res.writeHead(404).end('404'); return; }
    let buf = buf0;
    if (PRIV_MEDE && rel === '/privacidade/') {
      buf = Buffer.from(String(buf0).replace('</body>',
        '<script>fetch("https://us.i.posthog.com/i/v0/e/",{method:"POST",body:"{}"})'
        + '["catch"](function(){});</' + 'script></body>'), 'utf8');
    }
    const cab = Object.assign({
      'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    }, cabecalhosDaRota(rel));
    // modo 2 do controle: afrouxa a CSP SÓ no que o servidor local manda (nunca na tabela que os
    // blocos A/B/C conferem), para o pedido injetado sair e a asserção de `medicoes` ser a que morde.
    if (PRIV_MEDE === '2' && rel === '/privacidade/' && cab['Content-Security-Policy']) {
      cab['Content-Security-Policy'] += '; connect-src https://us.i.posthog.com';
    }
    res.writeHead(200, cab); res.end(buf);
  });
});

async function medirPagina(nav, rota) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage();
  let medicoes = 0;
  await pg.route('https://us.i.posthog.com/**', r => {
    medicoes++;
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' });
  });
  const erros = [];
  pg.on('console', m => { if (m.type() === 'error') erros.push(m.text().slice(0, 160)); });
  pg.on('pageerror', e => erros.push('PAGEERROR ' + String(e).slice(0, 160)));
  pg.on('requestfailed', r => erros.push('REQFAIL ' + r.failure().errorText + ' ' + r.url().slice(0, 70)));
  await pg.addInitScript(() => {
    window.__viol = [];
    document.addEventListener('securitypolicyviolation', e =>
      window.__viol.push(e.effectiveDirective + ' <- ' + String(e.blockedURI).slice(0, 60)));
  });
  await pg.goto('http://127.0.0.1:' + PORTA + rota, { waitUntil: 'load', timeout: 45000 })
    .catch(e => erros.push('GOTO ' + e.message.slice(0, 100)));
  await pg.waitForTimeout(4000);
  const viol = await pg.evaluate(() => window.__viol || []).catch(() => []);
  const nos = await pg.evaluate(() => document.body ? document.body.querySelectorAll('*').length : -1).catch(() => -1);
  const texto = await pg.evaluate(() => document.body ? document.body.innerText.trim().length : -1).catch(() => -1);
  const url = pg.url();
  await ctx.close();
  return { erros, viol, nos, texto, medicoes, url };
}

(async function () {
  await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  console.log('');
  console.log('NO NAVEGADOR, com os cabecalhos do vercel.json aplicados (127.0.0.1:' + PORTA + ')');
  for (const rota of NO_NAVEGADOR) {
    const m = await medirPagina(nav, rota);
    console.log('  ' + rota.padEnd(15) + ' nos=' + String(m.nos).padEnd(6) + ' texto=' + String(m.texto).padEnd(7)
      + ' medicoes=' + m.medicoes + ' erros=' + m.erros.length + ' violacoes=' + m.viol.length);
    [...new Set(m.viol)].forEach(v => console.log('      VIOLACAO  ' + v));
    [...new Set(m.erros)].slice(0, 6).forEach(e => console.log('      ERRO  ' + e));
    if (m.viol.length) reprovar('E. ' + rota + ' teve ' + m.viol.length + ' violacao(oes) de CSP —'
      + ' a politica esta bloqueando algo que a pagina precisa: ' + [...new Set(m.viol)].join(' | '));
    if (m.erros.length) reprovar('E. ' + rota + ' teve ' + m.erros.length + ' erro(s) de console com a'
      + ' CSP aplicada: ' + [...new Set(m.erros)].slice(0, 3).join(' | '));
    // uma pagina branqueada tambem passa com zero erro; o conteudo e o que prova que ela abriu
    if (m.nos < 20) reprovar('E. ' + rota + ' rendeu so ' + m.nos + ' no(s) — a pagina branqueou.');
    // A POLITICA NAO MEDE, e aqui isso vira numero. Ver CSP_PRIV_MEDE_TESTE no topo.
    if (rota === '/privacidade/' && m.medicoes !== 0) {
      reprovar('E. /privacidade/ mandou ' + m.medicoes + ' evento(s) para a medicao. Ela e a unica'
        + ' pagina publica que nao mede: a secao 3 do proprio texto dela diz que o evento conta'
        + ' "qual das CINCO secoes foi aberta", e uma sexta secao medida tornaria essa frase falsa'
        + ' no mesmo commit. Se a decisao mudou, mude o TEXTO, a tabela PRIVACIDADE deste portao e'
        + ' as SECOES do ferramentas/medir-secao.js juntos.');
    }
  }

  // E (extra) — O PACOTE DE ARTE BAIXA DE VERDADE, item `jogo-connect-src-sem-portao`.
  if (CONNECT_TESTE) console.log('*** INJECAO DE CONNECT-SRC RESTRITIVO EM /jogo/: "' + CONNECT_TESTE + '" ***');
  const pacote = await medirPacoteJogo(nav, PORTA);
  console.log('  ' + '/jogo/ pack-cais.json'.padEnd(24)
    + (pacote.ok ? 'OK ' + pacote.bytes + ' bytes' : 'FALHOU ' + (pacote.erro || ('HTTP ' + pacote.status))));
  if (!pacote.ok || pacote.bytes <= 0) {
    reprovar('E. /jogo/ nao conseguiu baixar pack-cais.json (arte do capitulo, mesma origem): '
      + (pacote.erro || ('HTTP ' + pacote.status)) + '. O recuo e SILENCIOSO por desenho (CLAUDE.md'
      + ' §3, letra a) — sem este portao, uma CSP que bloqueia o fetch chegaria a producao sem'
      + ' erro de console nenhum, so com a arte do capitulo 1 em todo lugar.');
  }

  // /mesa/ navega sozinha por <meta refresh>. Aqui o que se mede e se a CSP dela DEIXA a
  // navegacao acontecer; os erros de console depois do salto sao do /dashboard/, que fala com o
  // Supabase e tem portao proprio no build, entao nao se contam a esta rota.
  const mesa = await medirPagina(nav, '/mesa/');
  console.log('  ' + '/mesa/'.padEnd(15) + ' redirecionou para ' + mesa.url.replace('http://127.0.0.1:' + PORTA, '')
    + '  violacoes=' + mesa.viol.length + '  (erros de console nao contam: sao do /dashboard/)');
  if (mesa.viol.length) reprovar('E. /mesa/ teve violacao de CSP: ' + [...new Set(mesa.viol)].join(' | '));
  if (!/\/dashboard\/$/.test(mesa.url)) reprovar('E. a CSP de /mesa/ quebrou o redirecionamento:'
    + ' esperava terminar em /dashboard/ e terminou em ' + mesa.url);

  await nav.close();
  servidor.close();

  // ============================================================================
  // F. AO VIVO — o cabecalho que o servidor de verdade manda. So quando pedido.
  if (AO_VIVO) {
    console.log('');
    console.log('AO VIVO — o cabecalho que ' + AO_VIVO + ' manda de verdade');
    for (const pg of publicadas) {
      const esperada = CSP_ESPERADA[pg.rota];
      let cab = null, situacao = '';
      try {
        const r = await fetch(AO_VIVO + pg.rota, { redirect: 'follow' });
        situacao = String(r.status);
        cab = r.headers.get('content-security-policy');
      } catch (e) {
        reprovar('F. ' + pg.rota + ' nao respondeu em ' + AO_VIVO + ': ' + String(e.message).slice(0, 90));
        console.log('  ' + pg.rota.padEnd(15) + ' NAO RESPONDEU');
        continue;
      }
      console.log('  ' + pg.rota.padEnd(15) + ' HTTP ' + situacao + '  CSP=' + (cab ? 'sim' : 'NAO'));
      if (!cab) {
        reprovar('F. ' + pg.rota + ' respondeu ' + situacao + ' SEM cabecalho Content-Security-Policy.'
          + ' O vercel.json diz que ela tem uma; o servidor de verdade nao a esta mandando.');
        continue;
      }
      if (cab.indexOf('*') >= 0) reprovar('F. ' + pg.rota + ' tem CURINGA na CSP servida: ' + cab);
      if (!esperada) continue;
      const achada = partirCsp(cab);
      for (const n of [...new Set(Object.keys(esperada).concat(Object.keys(achada)))].sort()) {
        if (achada[n] !== esperada[n]) {
          reprovar('F. a CSP SERVIDA em ' + pg.rota + ' nao e a que o vercel.json declara: `' + n
            + '` veio "' + (achada[n] === undefined ? '(ausente)' : achada[n]) + '" e a tabela espera "'
            + (esperada[n] === undefined ? '(ausente)' : esperada[n]) + '"');
        }
      }
    }
  }

  console.log('');
  if (falhas.length) {
    console.error('REPROVADO — ' + falhas.length + ' falha(s):');
    falhas.forEach(f => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('OK — ' + publicadas.length + ' pagina(s) publicada(s), todas com CSP, todas sem'
    + ' violacao e sem erro de console.');
  process.exit(0);
})();
