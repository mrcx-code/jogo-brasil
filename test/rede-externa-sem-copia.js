// O PORTÃO QUE IMPEDE A RECOPIA — item `filtro-de-console-copiado-por-arquivo` (nuvem-20260905T0023),
// ampliado em 05/09 pelos itens `anti-recopia-nao-ve-arquivo-que-nao-filtra-nada` e
// `anti-recopia-burlavel-em-10-de-13-formas`.
//
// POR QUE ELE EXISTE. Em 04/09 o QA achou que `ver-territorio.js` e `qa-salvador-vivo.js`
// decidiam se um erro de console era "a máquina, não o jogo" casando SUBSTRING DE TEXTO
// (`/posthog|ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/`) contra `m.text()`, sem olhar de onde o
// erro veio — e essa regra engoliu 2 de 3 erros REAIS fabricados de propósito (um erro do
// próprio jogo que só MENCIONASSE uma dessas palavras desaparecia igual ao ruído de verdade).
// `test/rede-externa.js` nasceu para consertar isso decidindo pela ORIGEM (`m.location().url`
// contra `MEDIDA_HOST`), mas medido em 04/09 e de novo em 05/09: só 3 de 46 arquivos que
// escutam console de navegador o usavam.
//
// ————— O QUE MUDOU EM 05/09, E POR QUÊ —————
//
// A primeira versão deste portão cobrava UMA FORMA SINTÁTICA: uma expressão regular contendo
// `ERR_`/`posthog`/`Failed to load resource` usada direto num `.test(`, em arquivos do primeiro
// nível de `test/`. O QA mediu isso contra ele mesmo (`test/qa-rede-externa-burla.js`) e achou
// DOIS buracos, os dois pagos:
//
//   1. ELE NÃO VIA O ARQUIVO QUE NÃO FILTRA NADA — e esse é o caso que ACONTECEU, na mesma hora
//      em que a entrega era integrada: `test/qa-gente-quadro-que-chega.js` chegou de outra
//      máquina com `page.on('console')` sem filtro nenhum e derrubou o `npm test` do merge com
//      ruído de rede da máquina. O portão criado para essa classe saiu exit 0 nas duas
//      situações, antes e depois do conserto. "Não reimplementou o filtro" não é a pergunta:
//      a pergunta é se o arquivo DECIDE por erro de console sem passar pelo helper.
//   2. ELE PEGAVA 3 DE 13 FORMAS de reescrever o filtro à mão. Passavam `indexOf`, `includes`,
//      `.match()`, `.exec()`, `.search()`, regex guardada em constante, `new RegExp(string)`,
//      array de palavras + `.some()`, comparação de `.url()` por substring, e ARQUIVO EM
//      SUBPASTA (o `readdirSync` não era recursivo).
//
// E ele tinha um TERCEIRO defeito, que era o incentivo invertido: como a busca era por texto no
// arquivo inteiro, ele reprovava a SONDA que carrega o padrão como CARGA DE TEXTO, e quem foi
// testar esta área teve de montar as palavras por concatenação (`'ERR' + '_'`) para contornar o
// próprio portão. Portão que obriga a burlá-lo ensina a burlá-lo.
//
// ————— COMO ELE DECIDE AGORA —————
//
// A pergunta deixou de ser "este texto aparece no arquivo?" e passou a ser "este arquivo DECIDE
// sobre erro de console, e como?". Para isso ele lê o arquivo como CÓDIGO, não como texto:
// um analisador léxico (`analisar`) marca onde estão os comentários, os literais de texto e os
// literais de expressão regular. Daí saem três coisas:
//
//   · UM ESCUTADOR DE CONSOLE só conta se o `.on('console'` estiver em CÓDIGO. Numa sonda que
//     escreve o filtro proibido dentro de uma string para gravar em disco, ele está DENTRO de um
//     literal — e a sonda deixa de ser assunto deste portão, sem precisar concatenar nada.
//   · O ALCANCE DE UM ESCUTADOR é a lista de argumentos do `.on(...)` (por balanceamento de
//     parênteses, ignorando literais) MAIS a declaração de topo de cada identificador que o corpo
//     usa. É isso que pega a regex guardada em constante, o `new RegExp(string)`, o array de
//     palavras e o helper local com outro nome: o corpo os NOMEIA, então eles entram no alcance.
//   · DENTRO DESSE ALCANCE, a palavra proibida é procurada no código CRU — inclusive dentro de
//     string, porque `indexOf('ERR_TUNNEL...')` é exatamente a forma que passava antes.
//
// AS DUAS REGRAS, e cada uma tem a sua mensagem:
//
//   B. RECOPIA À MÃO — arquivo com escutador de console cujo alcance menciona `ERR_`, `posthog`
//      ou `Failed to load resource`, e que não chama `ehRuidoDeRedeExterna` de
//      `test/rede-externa.js`. Qualquer uma das 13 formas medidas cai aqui.
//   C. DECIDE SEM FILTRO — arquivo com escutador de console que DECIDE (o erro guardado no corpo
//      do escutador reaparece numa expressão que muda o veredito: `process.exit`, contador de
//      falhas, `ok(...)`, `assert`, `throw`) e não passa pelo helper. É o buraco (1) acima.
//      A heurística de "decide" é a de `test/qa-rede-externa-quem-decide.js`, escrita pelo QA e
//      medida por ele contra os 46 arquivos.
//      Um arquivo que só LOGA (guarda e imprime, sem virar veredito) continua exit 0 — de
//      propósito: um print de diagnóstico não pode ser reprovado por ruído de máquina.
//
//   A. E continua valendo a trava de REGRESSÃO nos GOVERNADOS: quem foi convertido de propósito
//      tem de continuar exigindo `./rede-externa.js`. Medida pelo QA em 05/09: tirar o `require`
//      de `smoke.js` dá exit 1 nomeando o arquivo, restaurar dá exit 0.
//
// ————— O QUE ELE AINDA NÃO PEGA, dito por extenso para a promessa não ser maior que a medida ——
//
//   · Indireção de DOIS níveis: o corpo chama `f()`, e `f` chama `g()`, e é `g` que tem a
//     palavra. O alcance resolve UM nível de identificador de topo.
//   · A palavra montada por concatenação ou por código (`'ERR' + '_'`, `String.fromCharCode`).
//     Isso não é acidente de quem escreve um filtro à mão — é burla deliberada, e portão nenhum
//     de análise léxica pega isso. O que segura essa porta é a regra C, que não olha palavra
//     nenhuma: se o arquivo DECIDE e não usa o helper, ele reprova de qualquer jeito.
//   · Arquivo que usa o helper E, além dele, mantém um filtro por texto à mão. A regra B só
//     morde quem NÃO usa o helper; medido em 05/09, endurecer isso reprovava arquivo verde por
//     motivo que não é este item.
//   · O repositório inteiro: este portão varre `test/` (agora RECURSIVAMENTE). As páginas da
//     PLATAFORMA continuam em `EXEMPTO`, cada uma com o motivo — são território do
//     dev-plataforma e decidir a forma delas não é deste ticket.
//
// COMO USAR
//   node test/rede-externa-sem-copia.js     # exit 0 = ninguém recopiou nem decide sem filtro
'use strict';

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

// ————— 1. GOVERNADOS — arquivos que DECIDEM por erro de console e foram apontados, de
// propósito, para `ehRuidoDeRedeExterna`. Regressão aqui é: alguém desfaz o `require` ou volta
// a escrever um filtro à mão sem tirar o arquivo desta lista. —————
const GOVERNADOS = [
  // já usavam o helper antes deste item (04/09):
  'aceiro-sem-coleta.js', 'qa-salvador-vivo.js', 'ver-territorio.js',
  // convertidos por este item (05/09), com a prova de mordida nos dois sentidos no placar:
  'smoke.js', 'robusto-tudo.js', 'qa-praca-quadro-vazio-vira-objeto.js',
  'ver-capitulo.js', 'qa-caminho-do-ceu.js', 'medir-caminho-do-ceu.js',
  'medir-acolher.js', 'medir-acompanhar.js', 'medir-pixel.js',
  'olhar-drop-salvador.js', 'peso-prototipo.js',
  'prints-cap4.js', 'prints-consistencia.js', 'prints-grao.js',
  'prints-onda2.js', 'prints-onda3.js', 'prints-onda5.js', 'prints-onda7.js',
];

// ————— 2. EXEMPTO — arquivos que TÊM um filtro escrito à mão e continuam tendo, cada um com
// o motivo. Nenhuma entrada aqui é "esqueci de converter": ou é território de outro agente, ou
// o helper genuinamente não cobre o caso (e mudar isso é decisão de quem mede, não deste
// portão). —————
const EXEMPTO = {
  // Território do dev-plataforma (páginas fora do jogo) — não é deste ticket, e forçar aqui
  // reprovaria hoje mesmo `npm test` (que roda `qa-eca-escolar-paginas.js`) por um filtro que
  // não é meu para decidir. Achado, não corrigido: ver o relatório de 05/09.
  'fila-auth.js': 'dashboard/plataforma — dev-plataforma decide a forma do filtro, não este item',
  'painel-sem-sinal.js': 'dashboard — dev-plataforma decide a forma do filtro, não este item',
  'medir-paginas.js': 'páginas da plataforma — dev-plataforma decide a forma do filtro',
  'rodape-verdadeiro.js': 'rodapé do dashboard — dev-plataforma decide a forma do filtro',
  'qa-eca-escolar-paginas.js': 'seis páginas da plataforma — dev-plataforma decide a forma do filtro',
  // O helper só ignora falha de ALCANÇAR o host (`net::ERR_...`). O bloco 17 do `encaixe.js`
  // testa RESILIÊNCIA a um posthog que responde 503 de propósito — medido em 05/09 (probe em
  // `test/tmp-probe503.js`, descartado): isso produz
  // "Failed to load resource: the server responded with a status of 503", que NÃO bate
  // `net::ERR_` e o helper contaria como erro real — mudaria o veredito de um teste que está
  // certo hoje. Estender o helper para cobrir "resposta HTTP do MEDIDA_HOST em teste de
  // resiliência" é uma extensão de contrato, não uma conversão mecânica; fica para quem decidir
  // isso de propósito. Também é o arquivo que `filtro-console-controle.js` EXTRAI por texto
  // (âncora `page.on('console', m => {`) — trocar o corpo por uma chamada de função quebraria
  // essa extração (a função ficaria fora do escopo de `new Function`).
  'encaixe.js': 'bloco 17 testa 503 do MEDIDA_HOST de propósito; extraído por filtro-console-controle.js',
  // Lê e recompila o CORPO do primeiro filtro de `encaixe.js` via `new Function`, com o texto
  // do diff no comentário — as duas coisas soam "regex + .test(" para uma varredura de texto,
  // e as duas são prosa/mecanismo de extração, não um filtro à mão duplicado em produção.
  'filtro-console-controle.js': 'extrai e recompila o filtro de encaixe.js; não decide por si',
  // Não conta erro de console de navegador (confirmado pelo Claude/coordenador em 05/09):
  // são portões do RITUAL, território de outro agente nesta rodada — não tocar.
  'salvador-drop-sem-ritual.js': 'não conta erro de console; território do ritual, outro agente',
  'qa-ritual-varredura.js': 'não conta erro de console; território do ritual, outro agente',
};

// ————— 3. IMUNE POR ROTA — arquivo que DECIDE, não usa o helper, e mede certo assim mesmo
// porque intercepta a rota do host da medição ANTES de ela virar erro de console. Medido pelo
// QA em 05/09, não suposto. A imunidade NÃO é dada de graça: o portão confere que a
// interceptação continua no arquivo (`route(` + o host), porque se alguém tirar o mock o
// arquivo passa a decidir sobre ruído de máquina sem filtro nenhum — e era exatamente esse o
// aviso que o QA deixou escrito e que nada cobrava. —————
const IMUNE_POR_ROTA = {
  // pg.route('https://us.i.posthog.com/**') com route.fulfill(200) em medirPagina(): o pedido
  // nunca sai da máquina. Medido em 05/09: node test/csp-paginas.js -> exit 0, erros=0 nas 7 rotas.
  'csp-paginas.js': 'route mock do MEDIDA_HOST (fulfill 200) — o ruído não chega ao console',
};

// as palavras que definem "filtro de rede externa escrito à mão"
const PALAVRAS_PROIBIDAS = ['ERR_', 'posthog', 'Failed to load resource'];

// ————————————————————————————————————————————————————————————————————————————————————————
// ANALISADOR LÉXICO — o que separa CÓDIGO de CARGA DE TEXTO.
//
// Devolve `codigo` (mesmo comprimento do original, com os comentários virados em espaço) e as
// faixas [ini, fim) ocupadas por conteúdo de literal de texto e por literal de expressão
// regular. Tudo o mais do portão trabalha sobre índices desse `codigo`.
// ————————————————————————————————————————————————————————————————————————————————————————
function podeSerRegex(src, i) {
  const antes = src.slice(Math.max(0, i - 40), i).replace(/\s+$/, '');
  if (!antes) return true;
  const c = antes[antes.length - 1];
  if ('(,=:[!&|?{};+-*%^~<>'.indexOf(c) >= 0) return true;
  return /\b(return|typeof|case|in|of|new|delete|void|do|else|yield|await)$/.test(antes);
}

function analisar(src) {
  const out = src.split('');
  const faixasTexto = [];
  const faixasRegex = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') { out[i] = ' '; i++; }
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { out[i] = ' '; i++; }
      if (i < n) { out[i] = ' '; out[i + 1] = ' '; i += 2; }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      const ini = ++i;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === q) break;
        if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
          // expressão dentro de template: é CÓDIGO, então a faixa de texto é cortada aqui
          faixasTexto.push([ini, i]);
          let d = 0;
          i += 2;
          while (i < n) {
            if (src[i] === '{') d++;
            else if (src[i] === '}') { if (d === 0) break; d--; }
            i++;
          }
          i++;
          return analisarResto(src, out, faixasTexto, faixasRegex, i);
        }
        i++;
      }
      faixasTexto.push([ini, i]);
      i++;
      continue;
    }
    if (c === '/' && podeSerRegex(src, i)) {
      const ini = ++i;
      let emClasse = false, fechou = false;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '\n') break;                 // regex não atravessa linha: era divisão
        if (src[i] === '[') emClasse = true;
        else if (src[i] === ']') emClasse = false;
        else if (src[i] === '/' && !emClasse) { fechou = true; break; }
        i++;
      }
      if (fechou) { faixasRegex.push([ini, i]); i++; } else { i = ini; }
      continue;
    }
    i++;
  }
  return { codigo: out.join(''), faixasTexto, faixasRegex };
}

// Caso raro (template com `${}`): retoma a análise do ponto em que parou, sem recursão profunda.
function analisarResto(src, out, faixasTexto, faixasRegex, desde) {
  const r = analisar(src.slice(desde));
  const cod = out.join('').slice(0, desde) + r.codigo;
  const desloca = (f) => f.map(p => [p[0] + desde, p[1] + desde]);
  return {
    codigo: cod,
    faixasTexto: faixasTexto.concat(desloca(r.faixasTexto)),
    faixasRegex: faixasRegex.concat(desloca(r.faixasRegex)),
  };
}

function fazEmLiteral(a) {
  const fs2 = a.faixasTexto.concat(a.faixasRegex);
  return function (i) { return fs2.some(p => i >= p[0] && i < p[1]); };
}

// ————— alcance de um escutador: a lista de argumentos do `.on('console', ...)` —————
function faixaDosArgumentos(codigo, emLiteral, aberturaDoParen) {
  let d = 0;
  for (let i = aberturaDoParen; i < codigo.length; i++) {
    if (emLiteral(i)) continue;
    if (codigo[i] === '(') d++;
    else if (codigo[i] === ')') { d--; if (d === 0) return [aberturaDoParen, i + 1]; }
  }
  return [aberturaDoParen, codigo.length];
}

// ————— alcance de uma declaração de topo: `const X = ...;` / `function X(...) {...}` —————
function fimDaDeclaracao(codigo, emLiteral, ini) {
  let d = 0;
  for (let i = ini; i < codigo.length; i++) {
    if (emLiteral(i)) continue;
    const c = codigo[i];
    if (c === '(' || c === '[' || c === '{') d++;
    else if (c === ')' || c === ']' || c === '}') {
      d--;
      if (d <= 0) {
        // MEDIDO em 05/09: parar no primeiro fecho de nível zero cortava o CORPO de
        // `function f(m) { ... }` fora do alcance — a lista de parâmetros fecha antes da chave —
        // e a forma "helper local com outro nome" burlava o portão por causa disso (1 de 13 na
        // sonda). Se o que vem depois continua a mesma declaração (`{` do corpo, `=>`, `.` de
        // encadeamento), o alcance segue.
        if (/^\s*(=>|[{(\[.])/.test(codigo.slice(i + 1, i + 40))) { d = 0; continue; }
        return i + 1;
      }
    }
    else if (d === 0 && (c === ';' || c === '\n')) return i;
  }
  return codigo.length;
}

function declaracoesDeTopo(codigo, emLiteral) {
  const mapa = {};
  const re = /^[ \t]{0,2}(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=|^[ \t]{0,2}(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/gm;
  let m;
  while ((m = re.exec(codigo))) {
    if (emLiteral(m.index)) continue;
    const nome = m[1] || m[2];
    if (!mapa[nome]) mapa[nome] = [m.index, fimDaDeclaracao(codigo, emLiteral, m.index)];
  }
  return mapa;
}

// ————— o coração: alcances de decisão sobre console de um arquivo —————
function alcancesDeConsole(codigo, a) {
  const emLiteral = fazEmLiteral(a);
  const alcances = [];
  const re = /\.on\(\s*['"`]console['"`]\s*,/g;
  let m;
  while ((m = re.exec(codigo))) {
    if (emLiteral(m.index)) continue;                 // está dentro de uma string: é carga, não código
    const abre = codigo.indexOf('(', m.index);
    alcances.push(faixaDosArgumentos(codigo, emLiteral, abre));
  }
  if (!alcances.length) return { temEscutador: false, faixas: [] };

  // um nível de indireção: cada identificador citado no corpo puxa a declaração de topo dele
  const decls = declaracoesDeTopo(codigo, emLiteral);
  const faixas = alcances.slice();
  for (const [ini, fim] of alcances) {
    const corpo = codigo.slice(ini, fim);
    const ids = corpo.match(/[A-Za-z_$][\w$]*/g) || [];
    for (const id of new Set(ids)) if (decls[id]) faixas.push(decls[id]);
  }
  return { temEscutador: true, faixas, corpos: alcances };
}

function palavraProibidaNoAlcance(codigo, faixas) {
  for (const [ini, fim] of faixas) {
    const t = codigo.slice(ini, fim);
    for (const p of PALAVRAS_PROIBIDAS) if (t.indexOf(p) >= 0) return p;
  }
  return null;
}

// ————— "este arquivo DECIDE por erro de console?" — heurística do QA (qa-rede-externa-quem-decide.js):
// o corpo do escutador alimenta uma variável, e essa variável reaparece numa expressão que muda
// o veredito. Onde não dá para dizer, o portão prefere NÃO acusar (falso negativo é buraco
// conhecido; falso positivo reprova arquivo verde e ensina a desligar o portão). —————
function decidePorErroDeConsole(codigo, corpos) {
  const vars = new Set();
  corpos.forEach(function ([ini, fim]) {
    const c = codigo.slice(ini, fim);
    (c.match(/([A-Za-z_$][\w$]*)\s*\.push\(/g) || []).forEach(s => vars.add(s.replace(/\s*\.push\($/, '')));
    (c.match(/([A-Za-z_$][\w$]*)\s*\+\+/g) || []).forEach(s => vars.add(s.replace(/\s*\+\+$/, '')));
    (c.match(/([A-Za-z_$][\w$]*)\s*\+=\s*1/g) || []).forEach(s => vars.add(s.replace(/\s*\+=\s*1$/, '')));
  });
  const linhas = codigo.split('\n');
  for (const v of vars) {
    if (!v || v === 'console' || v === 'm') continue;
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i];
      if (l.indexOf('.push(') >= 0 && new RegExp('\\b' + v + '\\s*\\.push\\(').test(l)) continue;
      if (!new RegExp('\\b' + v + '\\b').test(l)) continue;
      if (/process\.exit|falhas?\s*(\+\+|\+=)|\bok\s*\(|assert|REPROV|FALHA|throw /i.test(l)) {
        return (i + 1) + ': ' + l.trim().slice(0, 110);
      }
    }
  }
  return null;
}

function requerHelper(codigo) {
  return /require\(['"]\.\.?\/rede-externa\.js['"]\)/.test(codigo);
}

// ————— varredura RECURSIVA de test/ (o `readdirSync` raso deixava passar subpasta) —————
function varrer(dir, prefixo) {
  const achados = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const rel = prefixo ? prefixo + '/' + e.name : e.name;
    if (e.isDirectory()) achados.push(...varrer(path.join(dir, e.name), rel));
    else if (e.name.endsWith('.js')) achados.push(rel);
  }
  return achados;
}

const EU = path.basename(__filename);
const arquivos = varrer(DIR, '').filter(f => f !== 'rede-externa.js' && f !== EU);

let falhas = 0;
function acusar(msg) { console.error('  FALHA ' + msg); falhas++; }
function ok(msg) { console.log('  ok    ' + msg); }

// ————— A. Regressão nos GOVERNADOS —————
for (const nome of GOVERNADOS) {
  const p = path.join(DIR, nome);
  if (!fs.existsSync(p)) { acusar(nome + ': está na lista GOVERNADOS mas o arquivo sumiu — atualize a lista'); continue; }
  const txt = fs.readFileSync(p, 'utf8');
  if (!requerHelper(txt)) { acusar(nome + ': GOVERNADO deixou de requerer ./rede-externa.js — a conversão foi desfeita'); continue; }
  ok(nome + ': continua no helper');
}

// ————— B e C. Ninguém, fora de EXEMPTO, decide sobre erro de console por fora do helper —————
let comEscutador = 0, imunes = 0;
for (const nome of arquivos) {
  if (EXEMPTO[nome]) continue;
  const bruto = fs.readFileSync(path.join(DIR, nome), 'utf8');
  const a = analisar(bruto);
  const codigo = a.codigo;
  const alc = alcancesDeConsole(codigo, a);
  if (!alc.temEscutador) continue;
  comEscutador++;

  if (requerHelper(codigo)) continue;                 // passa pelo helper: nada a cobrar

  if (IMUNE_POR_ROTA[nome]) {
    // a imunidade é condicional: a interceptação tem de continuar lá
    const temRota = /\.route\(/.test(codigo) && /us\.i\.posthog\.com/.test(codigo);
    if (temRota) { imunes++; continue; }
    acusar(nome + ': está em IMUNE_POR_ROTA, mas o `route(` do host da medição sumiu do arquivo — '
      + 'sem o mock ele volta a decidir sobre ruído de máquina sem filtro nenhum. Use '
      + 'ehRuidoDeRedeExterna de ./rede-externa.js, ou devolva a interceptação.');
    continue;
  }

  // B — reimplementou o filtro à mão (qualquer das formas: regex literal, indexOf, includes,
  // match, exec, search, constante, new RegExp, array + some, comparação de .url())
  const palavra = palavraProibidaNoAlcance(codigo, alc.faixas);
  if (palavra) {
    acusar(nome + ': escreveu um filtro de rede-externa à mão — o escutador de console (ou uma '
      + 'declaração que ele usa) menciona "' + palavra + '" fora do helper. Use '
      + 'ehRuidoDeRedeExterna de ./rede-externa.js, ou, se o caso for genuinamente diferente, '
      + 'acrescente este arquivo a EXEMPTO aqui dizendo por quê.');
    continue;
  }

  // C — decide por erro de console e não filtra NADA (o caso que aconteceu em 05/09)
  const prova = decidePorErroDeConsole(codigo, alc.corpos);
  if (prova) {
    acusar(nome + ': DECIDE por erro de console (' + prova + ') e não passa por '
      + 'ehRuidoDeRedeExterna de ./rede-externa.js — sem filtro, um net::ERR_ do host da medição '
      + 'bloqueado pelo proxy da máquina reprova a entrega de outra pessoa. Requeira '
      + './rede-externa.js, ou acrescente este arquivo a EXEMPTO aqui dizendo por quê.');
  }
}

console.log('\n  arquivos de test/ (recursivo) com escutador de console em CÓDIGO: ' + comEscutador
  + '  ·  imunes por rota conferida: ' + imunes);
console.log((falhas ? 'REPROVOU (' + falhas + ')' : 'PASSOU — nenhuma recopia do filtro de rede externa, e ninguém decide sem ele'));
process.exit(falhas ? 1 : 0);
