// MESA DE ENTREGA — fora do jogo, de propósito.
//
// O jogo é `index.html`: um arquivo, zero rede, CSP fechada. Isto aqui não é o jogo. É uma
// ferramenta de sessão que roda só em localhost, nunca é publicada, e existe para uma coisa
// só: o dono gera uma imagem em outra ferramenta, COLA aqui, e o arquivo aparece no disco
// onde o pipeline consegue pegar. Sem isso, cada imagem custa uma ida e volta de link.
//
// Da mesma natureza do test/smoke.js, que também sobe um servidor Node. Não muda o jogo.
//
//   node ferramentas/receber.js      ->  http://localhost:8200

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const pinLocal = require('./pin-local.js');

const RAIZ = path.resolve(__dirname, '..');
const ENTRADA = path.join(RAIZ, 'assets', 'entrada');
const PEDIDOS = path.join(__dirname, 'pedidos.json');
const ARQ_BACKLOG = path.join(__dirname, 'backlog.json');
// 8200 e a porta de sempre; MESA_PORTA existe para conferir uma rota com a mesa do dono no ar
// (subir uma segunda copia em 8200 so devolve EADDRINUSE, e derrubar a dele para testar e pior).
const PORTA = Number(process.env.MESA_PORTA) || 8200;

// O hash e dos BYTES EM DISCO, nao do objeto: e o disco que duas mesas disputam, e reserializar
// para comparar introduziria um jeito de dois estados diferentes darem o mesmo carimbo.
function lerBacklog() { try { return fs.readFileSync(ARQ_BACKLOG, 'utf8'); } catch (e) { return ''; } }
function hashBacklog(bruto) { return crypto.createHash('sha1').update(bruto, 'utf8').digest('hex'); }

fs.mkdirSync(ENTRADA, { recursive: true });

// Um nome de arquivo vindo do navegador é entrada não confiável, pela mesma razão que o save
// é: dá para escrever à mão. Só sobrevive o que eu mesmo poderia ter escrito.
function nomeSeguro(s) {
  return String(s || 'sem-nome').toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60) || 'sem-nome';
}

// HORA LOCAL, sempre. As datas de `processadas.json` vieram do histórico do git, que são
// locais; `mtime.toISOString()` é UTC. Misturar as duas dá três horas de diferença nesta
// máquina — e três horas bastavam para TODA entrega da noite parecer "re-entrega", que é
// justamente o alarme que este painel usa para chamar a atenção. Um alarme que toca sempre
// não é alarme.
function dataLocal(d) {
  const z = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) +
    ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
}

function lerJson(nome, vazio) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, nome), 'utf8')); }
  catch (e) { return vazio; }
}

// ---------------------------------------------------------------------------
// A ATIVIDADE, LIDA DO GIT — e por que ela NÃO vem mais de `equipe.json`.
//
// O painel "trabalhando agora" lia um JSON escrito à mão. Ninguém atualiza um arquivo desses
// no meio do trabalho, então ele mostrava para sempre a última frase que alguém digitou: em
// 10/08 ele ainda dizia "o grão do chrome em voo", de 09/08, com dezenas de commits depois.
// Painel de atividade que não é alimentado pela atividade é PIOR que painel nenhum — foi
// esse tipo de mentira que fez a fila de arte ficar dias invisível.
//
// A fonte nova não depende de ninguém lembrar de escrever:
//   · `git log`    — o que aconteceu, com hora e arquivos tocados. Nunca desatualiza.
//   · `git status` — o que está aberto na árvore NESTE minuto.
//   · mtime do `index.html` — quando o jogo publicado foi construído pela última vez.
// Se as três estiverem paradas, o painel DIZ que está parado. "Nada em curso" é informação.
function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: RAIZ, encoding: 'utf8', timeout: 5000, windowsHide: true,
      maxBuffer: 4 * 1024 * 1024
    });
  } catch (e) { return ''; }
}

function haQuanto(ms) {
  if (!(ms >= 0)) return '';
  const m = Math.round(ms / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
  return Math.floor(h / 24) + ' d';
}

// Uma linha por commit é o pedido; a PASTA é o que faz a linha valer alguma coisa. "4 arquivos"
// não diz nada, "src · 4 arquivos" diz que alguém mexeu no jogo e não na papelada.
function pastasDe(arquivos) {
  const p = [];
  arquivos.forEach(function (a) {
    const t = a.indexOf('/') > 0 ? a.slice(0, a.indexOf('/')) : '(raiz)';
    if (p.indexOf(t) < 0) p.push(t);
  });
  return p.slice(0, 3);
}

// Separadores de controle, nunca virgula nem barra: assunto de commit tem de tudo, e um
// separador que pode aparecer no dado e um parser quebrado esperando a hora.
const SEP = '\x01', UN = '\x1f';

function atividade() {
  const agora = Date.now();

  const bruto = git(['log', '-40', '--date=iso-strict',
    '--pretty=format:' + SEP + '%h' + UN + '%ad' + UN + '%s' + UN + '%p', '--name-only']);
  const commits = bruto.split(SEP).filter(function (b) { return b.trim(); }).map(function (b) {
    const linhas = b.split('\n');
    const cab = linhas[0].split(UN);
    const arquivos = linhas.slice(1).map(function (s) { return s.trim(); }).filter(Boolean);
    const d = new Date(cab[1]);
    // JUNCAO (merge) sai do `--name-only` com ZERO arquivos — o git so lista diferenca contra
    // um pai, e a juncao tem dois. Sem marcar, a linha lê "0 arquivos" e parece commit vazio,
    // que e justamente o tipo de numero errado que faz o painel perder a confianca.
    const juncao = String(cab[3] || '').trim().indexOf(' ') > 0;
    return {
      h: cab[0], quando: dataLocal(d), hora: dataLocal(d).slice(11),
      dia: dataLocal(d).slice(5, 10).split('-').reverse().join('/'),
      assunto: cab[2] || '', n: arquivos.length, pastas: pastasDe(arquivos), juncao: juncao,
      ha: haQuanto(agora - d.getTime()), minutos: Math.round((agora - d.getTime()) / 60000)
    };
  });

  // O QUE ESTÁ ABERTO AGORA. `git status --porcelain` tem os dois códigos nas colunas 0-1 e o
  // caminho a partir da 3 — cortar por posição, nunca por espaço, senão nome com espaço quebra.
  const emCurso = git(['status', '--porcelain']).split('\n').filter(function (l) {
    return l.length > 3;
  }).map(function (l) {
    const cod = l.slice(0, 2), arq = l.slice(3).replace(/^"|"$/g, '');
    let ha = '', min = 1e9;
    try {
      const st = fs.statSync(path.join(RAIZ, arq));
      min = Math.round((agora - st.mtimeMs) / 60000);
      ha = haQuanto(agora - st.mtimeMs);
    } catch (e) {}
    return {
      arquivo: arq, ha: ha, minutos: min,
      estado: /\?\?/.test(cod) ? 'novo' : /D/.test(cod) ? 'apagado'
        : /^[MARC]/.test(cod) ? 'em fila' : 'mexido'
    };
  }).sort(function (a, b) { return a.minutos - b.minutos; });

  let build = null;
  try {
    const st = fs.statSync(path.join(RAIZ, 'index.html'));
    build = { quando: dataLocal(st.mtime), ha: haQuanto(agora - st.mtimeMs),
      kb: Math.round(st.size / 1024) };
  } catch (e) {}

  // "Mexido nos últimos 20 min" é o que separa trabalho de árvore suja esquecida de ontem.
  const quentes = emCurso.filter(function (a) { return a.minutos <= 20; }).length;
  const ultimo = commits[0] || null;

  return {
    lidoEm: dataLocal(new Date(agora)),
    trabalhando: quentes > 0 || !!(ultimo && ultimo.minutos <= 20),
    quentes: quentes,
    emCurso: emCurso.slice(0, 12),
    totalEmCurso: emCurso.length,
    // OITO COMMITS, não catorze. O painel responde "o que está acontecendo agora"; catorze
    // linhas eram meia página de história para uma pergunta de uma linha, e o dono pediu
    // menos coisa na mesa, não mais. Quem quer o histórico inteiro tem o `git log`.
    commits: commits.slice(0, 8),
    ultimo: ultimo,
    build: build
  };
}

// ---------------------------------------------------------------------------
// A ORDEM DE APARIÇÃO NO JOGO — LIDA DO JOGO, nunca de uma tabela escrita à mão.
//
// O manifesto não tem campo de ordem, então ela é DERIVADA do nome. A versão anterior
// derivava por uma tabela fixa, `{1:0, 2:1, 3:3, 4:2}`, escrita quando o jogo tinha QUATRO
// capítulos. O jogo passou a ter TREZE e a tabela não ficou sabendo: os sete capítulos novos
// (`cap-jabaquara-*`, `cap-praca-*`, `cap-segurou-*`…) não casavam com nenhuma regra e caíam
// todos no balde "sem ordem derivável", ordem 9000, empilhados no fim da página — justamente
// os capítulos cuja arte a fila está pedindo AGORA. É a mesma classe de defeito do painel de
// atividade que lia `equipe.json`: não erra alto, erra em silêncio.
//
// Agora a ordem sai de `EPOCAS` no `src/jogo.ts`, que é a ordem em que a pessoa atravessa os
// capítulos, e o nome de cada época sai de lá junto. SÓ LEITURA — esta ferramenta nunca
// escreve em `src/`. Cache pela mtime: o arquivo tem 5 MB e ninguém precisa relê-lo a cada
// pedido, mas ele muda toda sessão e um cache eterno seria a tabela à mão de novo.
//
// O que continua sendo convenção e não tem como ser derivado: qual capítulo cada NÚMERO de
// nome de arquivo quer dizer. A arte foi batizada antes de a ordem existir, e por isso
// `cap4-*` é SALVADOR e `cap3-*` é o presente. A tabela abaixo mapeia número → `id`, e o id
// é que vira posição — assim, quando um capítulo se move em EPOCAS, a mesa se move junto.
const FONTE_JOGO = path.join(RAIZ, 'src', 'jogo.ts');
const ID_DO_CAP = { 1: 'pindorama', 2: 'palmares', 3: 'hoje', 4: 'salvador' };

let epocasCache = { mtime: -1, lista: [], depoisDe: '' };

function epocas() {
  let st;
  try { st = fs.statSync(FONTE_JOGO); } catch (e) { return epocasCache; }
  if (st.mtimeMs === epocasCache.mtime) return epocasCache;
  let js = '';
  try { js = fs.readFileSync(FONTE_JOGO, 'utf8'); } catch (e) { return epocasCache; }
  const ini = js.indexOf('const EPOCAS = [');
  const fim = js.indexOf('const TRAVESSIAS = [');
  const bloco = ini < 0 ? '' : js.slice(ini, fim > ini ? fim : ini + 200000);
  const lista = [];
  // Indentação de quatro espaços = campo de primeiro nível de uma entrada de EPOCAS. Casar
  // `id:` solto pegaria id de qualquer objeto aninhado e embaralharia a ordem inteira.
  const re = /\n    id:\s*"([\w-]+)"/g;
  let m;
  while ((m = re.exec(bloco))) {
    const nm = /\n    nome:\s*"([^"]*)"/.exec(bloco.slice(m.index, m.index + 800));
    lista.push({ id: m[1], nome: nm ? nm[1] : m[1] });
  }
  // A TRAVESSIA é interstício: está em EPOCAS mas não tem cena própria — roda ENTRE dois
  // capítulos, e é `TRAVESSIAS` quem diz entre quais. Ler dali é o que mantém a arte do mar
  // no lugar certo se um dia a travessia mudar de lugar.
  const t = fim > 0 ? /\bde:\s*"([\w-]+)"\s*,\s*para:\s*"([\w-]+)"/.exec(js.slice(fim, fim + 6000)) : null;
  epocasCache = { mtime: st.mtimeMs, lista: lista, depoisDe: t ? t[1] : '' };
  return epocasCache;
}

function posDaEpoca(id) {
  const l = epocas().lista;
  for (let i = 0; i < l.length; i++) if (l[i].id === id) return i;
  return -1;
}
function nomeDaEpoca(id) {
  const l = epocas().lista;
  for (let i = 0; i < l.length; i++) if (l[i].id === id) return l[i].nome;
  return id;
}
// Meia posição: a travessia cabe no vão entre o capítulo de onde se sai e o seguinte.
function posDaTravessia() {
  const p = posDaEpoca(epocas().depoisDe);
  return p < 0 ? 0.5 : p + 0.5;
}

function ordemDe(nome) {
  const n = String(nome || '');
  const em = function (pos, sub, onde) { return { ordem: Math.round(pos * 1000) + sub, onde: onde }; };
  if (/^(menu|logo)/.test(n)) return { ordem: -1000, onde: 'menu · antes de tudo' };

  // DUAS FAMÍLIAS DE PÁGINA, e confundi-las era repetição visível na tela:
  //   `q-p<N>`           — página da tela A HISTÓRIA, numerada pela LINHA_TEMPO
  //   `q-p<N>-<assunto>` — página da TRAVESSIA, numerada por onde ela se encaixa
  // A regra antiga lia só o número, então `q-p10` (o açúcar) e `q-p10-travessia` (os
  // maus-tratos) saíam com o MESMO rótulo, "A HISTÓRIA · página 10", e no mesmo ponto da
  // ordem: duas artes diferentes que a mesa jurava serem o mesmo lugar. O sufixo é o que
  // separa as duas, e ele existe desde que a travessia entrou (bloco QUAD_B64 do jogo).
  const q = /^q-p0?(\d+)(-[a-z]+)?$/.exec(n);
  if (q) {
    const p = parseInt(q[1], 10);
    if (q[2]) return em(posDaTravessia(), p, 'A TRAVESSIA · página ' + p);
    // A faixa de página por época vem da LINHA_TEMPO: a p2 (Lagoa Santa) é dos primeiros
    // cinco minutos, a p26 é do fim.
    const id = p <= 6 ? 'pindorama' : p <= 13 ? 'palmares' : p <= 19 ? 'salvador' : 'hoje';
    return em(Math.max(0, posDaEpoca(id)), p, 'A HISTÓRIA · página ' + p);
  }
  if (/^trav-/.test(n)) return em(posDaTravessia(), 100, 'A TRAVESSIA · o interstício');
  if (/vao-cidade-africana/.test(n)) {
    return em(Math.max(0, posDaEpoca('salvador')), -1, 'marco do vão · antes de ' + nomeDaEpoca('salvador'));
  }
  // Convenção nova: `cap-<id>-…` e `ctx-<id>-…`, com o id igual ao de EPOCAS.
  const novo = /^(?:cap|ctx)-([a-z]+)-/.exec(n);
  if (novo && posDaEpoca(novo[1]) >= 0) {
    return em(posDaEpoca(novo[1]), 100, 'capítulo ' + nomeDaEpoca(novo[1]));
  }
  // Convenção antiga: um número no meio do nome (`cap4-sprite`, `ctx-cap1-mata`, `drop-cap3-1`).
  const c = /cap(\d)/.exec(n);
  if (c && ID_DO_CAP[c[1]] && posDaEpoca(ID_DO_CAP[c[1]]) >= 0) {
    return em(posDaEpoca(ID_DO_CAP[c[1]]), 100, 'capítulo ' + nomeDaEpoca(ID_DO_CAP[c[1]]));
  }
  return { ordem: 99000, onde: 'sem ordem derivável do nome' };
}

// ---------------------------------------------------------------------------
// O GUARDA DA REPETIÇÃO. Um refazer costuma entrar no manifesto como nome NOVO (`-v2`,
// `-v3`) em vez de corrigir o pedido que já existe — e aí a MESMA arte passa a existir duas
// vezes: `cap4-fundo-alto` e `cap4-fundo-alto-v2` eram o mesmo quadro, `cap4-sprite`,
// `-v2` e `-v3` a mesma folha. Isso nunca dá erro; só enche a mesa de coisa repetida, que foi
// a queixa do dono em 10/08. Cinco pares foram juntados à mão nesse dia (o campo `substitui`
// de cada sobrevivente diz quais eram); daqui para a frente o servidor reclama sozinho.
// Ele não decide nada — só não deixa passar em silêncio, que é como isto se acumulou.
function repetidosNoManifesto(nec) {
  const itens = (nec && nec.itens) || [];
  const nomes = {};
  itens.forEach(function (i) { nomes[i.nome] = true; });
  const avisos = [];
  itens.forEach(function (i) {
    (i.substitui || []).forEach(function (v) {
      if (nomes[v]) avisos.push(i.nome + ' diz substituir ' + v + ' — e os dois ainda estão no manifesto');
    });
    const base = i.nome.replace(/-v\d+$/, '');
    if (base !== i.nome && nomes[base] && (i.substitui || []).indexOf(base) < 0) {
      avisos.push(i.nome + ' e ' + base + ' são o mesmo alvo — junte num só e anote em `substitui`');
    }
  });
  return avisos;
}

// ---------------------------------------------------------------------------
// O ESTADO DE CADA ITEM DO MANIFESTO. Três estados, e confundir dois deles é o bug
// que esvaziou a mesa: o dono abriu, o manifesto tinha 61 itens, e a tela não mostrou
// um só pedido.
//
//   GERAR  — não há arquivo em disco, OU há e ele foi RECUSADO depois de entregue.
//   CHEGOU — o arquivo está em disco e ainda não entrou no jogo. A bola é minha.
//   PRONTO — está registrado em processadas.json e nada mais novo chegou por cima.
//
// A CAUSA REAL, medida em 09/08: o `/revisar` decidia "já resolvido" só de existir um
// arquivo com aquele nome em `assets/entrada`. Como TODOS os 61 itens do manifesto já
// tinham recebido pelo menos uma entrega, a fila dava ZERO — inclusive para as três
// folhas de corrida recusadas por §2 e para o refazer da p19, que continuavam sendo
// trabalho do dono. Entregue não é aceito, e aceito não é integrado: agora são três
// estados, cruzados por DATA e por registro explícito, nunca por "o arquivo existe".
// O anexo de um pedido, deduzido do texto dele. Mesma regra do ferramentas/copiar.js: se o
// prompt manda anexar referencia, a folha de CAMINHADA daquele capitulo e o anexo.
function anexoDe(nome, prompt) {
  if (!/IMAGEM ANEXA|ANEXE A IMAGEM|imagem de referencia|imagem de refer\u00eancia/i.test(prompt)) return null;
  const cap = (nome.match(/^cap(\d+)/) || [])[1];
  if (!cap) return null;
  const cands = ['sprite-cap' + cap + '-andar-v2.png', 'sprite-cap' + cap + '-andar.png'];
  for (let k = 0; k < cands.length; k++) {
    if (fs.existsSync(path.join(ENTRADA, cands[k]))) return cands[k];
  }
  return null;
}
function estadoDaFila() {
  const nec = lerJson('necessario.json', { itens: [] });
  const proc = lerJson('processadas.json', { itens: [], quando: {} });
  const rec = lerJson('recusadas.json', { itens: [] });

  const feito = new Set(proc.itens || []);
  const procEm = proc.quando || {};
  const recusa = {};
  (rec.itens || []).forEach(function (r) {
    if (!recusa[r.n] || recusa[r.n].em < r.em) recusa[r.n] = r;
  });

  const arquivo = {};
  let disco = [];
  try { disco = fs.readdirSync(ENTRADA); } catch (e) {}
  disco.filter(function (f) { return !/\.txt$/i.test(f); }).forEach(function (f) {
    const nome = f.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    let quando = '', bytes = 0;
    try {
      const st = fs.statSync(path.join(ENTRADA, f));
      quando = dataLocal(st.mtime); bytes = st.size;   // o tamanho é a impressão digital barata
    } catch (e) {}
    if (!arquivo[nome] || arquivo[nome].quando < quando) arquivo[nome] = { f: f, quando: quando, bytes: bytes };
  });

  const itens = (nec.itens || []).map(function (i) {
    const arq = arquivo[i.nome] || null;
    const r = recusa[i.nome] || null;
    // Recusa só vale enquanto for MAIS NOVA que o arquivo: colar por cima resolve.
    // A RECUSA VALE PELOS BYTES, NÃO PELA DATA — e a data quase custou a fila de novo.
    // A regra original era "a recusa vale enquanto for mais nova que o arquivo". Bastou um
    // teste encostar nos quatro arquivos recusados para as mtimes irem para agora, e as
    // quatro artes que §2 tinha reprovado voltaram a aparecer como ENTREGUES — o defeito
    // exato que este registro existe para consertar, ressuscitado por um `touch`.
    // Com `bytes`, só uma imagem DIFERENTE levanta a recusa. Tocar no arquivo não muda nada,
    // que é o certo: quem não redesenhou não resolveu. A data continua valendo para as
    // recusas antigas que não têm o campo, e para elas o comportamento é o de antes.
    const recusadoAgora = !!(r && (!arq
      || (typeof r.bytes === "number" ? arq.bytes === r.bytes : arq.quando <= r.em)));
    const emProc = feito.has(i.nome);
    // Re-entrega: o arquivo é mais novo que a data em que o nome entrou no registro.
    const reentrega = !!(emProc && arq && procEm[i.nome] && arq.quando > procEm[i.nome]);
    const estado = (!arq || recusadoAgora) ? 'gerar'
      : (!emProc || reentrega) ? 'chegou' : 'pronto';
    const o = ordemDe(i.nome);
    return {
      nome: i.nome,
      arquivoEsperado: i.nome + '.png',
      titulo: i.titulo || i.nome,
      referencia: i.ref || '',
      tamanho: i.tam || '',
      estado: estado,
      quandoChegou: arq ? arq.quando : '',
      arquivo: arq ? arq.f : '',
      recusa: recusadoAgora ? { porque: r.porque || '', onde: r.onde || '', em: r.em || '' } : null,
      reentrega: reentrega,
      ordem: o.ordem,
      onde: o.onde,
      prompt: (nec._estilo || '') + "\n\n" + i.p + (i.semMagenta ? "" : (nec._magenta || '')),
      // QUAL IMAGEM VAI JUNTO. Sai do proprio prompt — se ele pede referencia, a folha de
      // caminhada daquele capitulo e o anexo. Sem lista a mao, sem chance de desencontrar.
      anexo: anexoDe(i.nome, i.p || '')
    };
  }).sort(function (a, b) { return a.ordem - b.ordem || (a.nome < b.nome ? -1 : 1); });

  // Chegou em disco SEM estar no manifesto: entrega que ninguém pediu, ou nome trocado.
  // Não some — é exatamente o caso que já custou duas entregas perdidas.
  const noManifesto = new Set((nec.itens || []).map(function (i) { return i.nome; }));
  const soltas = Object.keys(arquivo).filter(function (n) {
    return !noManifesto.has(n) && !feito.has(n);
  }).map(function (n) {
    return { nome: n, quando: arquivo[n].quando, arquivo: arquivo[n].f };
  }).sort(function (a, b) { return a.quando < b.quando ? 1 : -1; });

  return {
    itens: itens,
    soltas: soltas,
    ordemDerivada: true,
    contagem: {
      gerar: itens.filter(function (i) { return i.estado === 'gerar'; }).length,
      chegou: itens.filter(function (i) { return i.estado === 'chegou'; }).length,
      pronto: itens.filter(function (i) { return i.estado === 'pronto'; }).length,
      soltas: soltas.length,
      total: itens.length
    }
  };
}

const servidor = http.createServer(function (req, res) {
  const url = req.url.split('?')[0];

  // /pin-local — o auto-login do dashboard na maquina do dono (PENDENTES 57). Quem nao chega
  // pelo loopback, ou chega sem o arquivo existir, cai no MESMO 404 do fim desta funcao: a rota
  // nao se anuncia, nao devolve 403 e nao diz que existe. O porque inteiro esta em pin-local.js,
  // inclusive por que este servidor nunca imprime o PIN no console.
  if (pinLocal.atender(req, res)) return;

  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    fs.readFile(path.join(__dirname, 'receber.html'), function (e, buf) {
      if (e) { res.writeHead(500).end('receber.html sumiu'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buf);
    });
    return;
  }

  // A FILA INTEIRA, num cálculo só. A tela não cruza nada: quem cruza é o servidor, que é
  // quem tem o disco. Antes a página lia /pedidos (um arquivo escrito à mão pelo REVISAR) e
  // /recebidas (nomes crus), e remontava o estado no navegador — três fontes para uma
  // verdade, e a verdade ficou perdida entre elas.
  // O ANEXO, SERVIDO (15/08). Pedido do dono: *"sempre que pedir pra gerar baseado em outra
  // imagem ou dizendo que tem algo anexado, me mostre a imagem tambem para eu enviar junto do
  // prompt"*. Antes disso a mesa DIZIA "anexe a folha de caminhada" e nao tinha como mostra-la —
  // ele teria de sair da mesa, achar o arquivo em assets/entrada e voltar. Pedido que manda
  // anexar sem entregar o anexo e pedido pela metade.
  // So serve de assets/entrada, e so PNG: a mesa e local, mas caminho vindo de URL sem cerca
  // vira leitura de disco inteiro no dia em que alguem a expuser.
  if (req.method === 'GET' && url.indexOf('/anexo/') === 0) {
    const nome = path.basename(decodeURIComponent(url.slice(7)));
    if (!/^[\w.-]+\.png$/i.test(nome)) { res.writeHead(400).end('nome invalido'); return; }
    const arq = path.join(ENTRADA, nome);
    if (!arq.startsWith(ENTRADA)) { res.writeHead(400).end('fora da pasta'); return; }
    fs.readFile(arq, function (e, buf) {
      if (e) { res.writeHead(404).end('sem anexo'); return; }
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
      res.end(buf);
    });
    return;
  }

  if (req.method === 'GET' && url === '/fila') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(estadoDaFila()));
    return;
  }

  // AQUI MORAVAM `/pedidos` E `/recebidas`, E ELES SAÍRAM COM A PÁGINA QUE OS LIA.
  // `/pedidos` servia o retrato em disco que o botão REVISAR grava, e a mesa o relia de três
  // em três segundos para pintar um veredito sobre a imagem colada — com barra de progresso
  // que subia sozinha até 95% sem ter como saber de nada. `/recebidas` devolvia os nomes
  // crus de `assets/entrada`, e quem cruza disco com manifesto é `/fila` desde 09/08.
  // O `pedidos.json` continua sendo escrito pelo REVISAR: ele é o que EU leio entre sessões,
  // e nunca foi para a tela do dono.

  // O que está parado esperando o dono. Substituiu o roadmap: para onde o jogo vai já mora
  // no BACKLOG.md e no PRODUTO.md — o que faltava era a lista do que eu não decido sozinho.
  if (req.method === 'GET' && url === '/pendencias') {
    let r = null;
    try { r = fs.readFileSync(path.join(__dirname, 'pendencias.json'), 'utf8'); } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(r || '{}');
    return;
  }

  // TRABALHANDO AGORA, medido — não declarado. Ver o comentário de `atividade()`.
  if (req.method === 'GET' && url === '/atividade') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'    // painel de atividade em cache é painel congelado de novo
    });
    res.end(JSON.stringify(atividade()));
    return;
  }

  // AQUI MORAVAM `/equipe` E `/chegadas`, E OS DOIS BLOCOS QUE ELES ALIMENTAVAM SAÍRAM DA
  // PÁGINA EM 10/08, a pedido do dono: "prefiro só o que tá pendente e boas. Tem coisa
  // repetida também".
  //
  // `/equipe` servia `equipe.json`, escrito à mão: PRÓXIMO PASSO e MARCOS. Era o pior caso
  // de repetição da mesa, porque dizia com outras palavras o que as listas já diziam com
  // dado — "q-p19 REFAZER" estava no bloco do que chegou, "3 folhas de corrida" eram três
  // cartões da fila, "deitado: travar em retrato" era uma pergunta da lista dele. Três
  // lugares, uma informação, e só um deles se atualiza sozinho.
  //
  // `/chegadas` listava o que está em disco e ainda não entrou no jogo. Não sumiu de
  // verdade: virou UMA LINHA com a contagem, no bloco REVISAR, tirada de `/fila`. A bola
  // desses itens é MINHA — o dono precisa saber que existem, não ler os nomes um a um.
  // O arquivo `equipe.json` fica onde está; deixou de ser servido, e é só isso.

  // REVISAR: compara o que o jogo precisa (necessario.json) com o que já chegou
  // (assets/entrada) e repõe na fila só o que falta. Existe porque a fila vinha sendo podada
  // à mão — por mim — e mão esquece. O servidor já sabia o que tem em disco; faltava saber o
  // que o jogo consome.
  // Guarda a resposta do dono junto da pergunta. Grava no MESMO arquivo, para a resposta e a
  // pendencia nunca se separarem.
  if (req.method === 'POST' && url === '/responder') {
    const pd = [];
    req.on('data', function (c) { pd.push(c); });
    req.on('end', function () {
      let corpo;
      try { corpo = JSON.parse(Buffer.concat(pd).toString('utf8')); }
      catch (e) { res.writeHead(400).end('json invalido'); return; }
      const arq = path.join(__dirname, 'pendencias.json');
      let d;
      try { d = JSON.parse(fs.readFileSync(arq, 'utf8')); }
      catch (e) { res.writeHead(500).end('pendencias.json ilegivel'); return; }
      const alvo = (d.itens || []).find(function (i) { return i.t === corpo.t; });
      if (!alvo) { res.writeHead(404).end('pendencia nao achada'); return; }
      // RESPONDIDA SAI DA LISTA. O dono: "quero poder escrever no campo e enviar, fazendo
      // com que a pendencia suma". A resposta nao se perde: vai para respondidas.json, que
      // e o meu material de leitura. Se a resposta GERAR outra pendencia, quem a cria sou
      // eu, com a pergunta nova escrita por inteiro.
      alvo.resposta = String(corpo.resposta || '').slice(0, 2000);
      alvo.respondidaEm = new Date().toISOString().slice(0, 16).replace('T', ' ');
      d.itens = (d.itens || []).filter(function (i) { return i.t !== corpo.t; });
      const arqLidas = path.join(__dirname, 'respondidas.json');
      let lidas = { _: 'Respostas do dono, tiradas da fila. Leio antes de cada sessao.', itens: [] };
      try { lidas = JSON.parse(fs.readFileSync(arqLidas, 'utf8')); } catch (e) {}
      (lidas.itens = lidas.itens || []).unshift(alvo);
      fs.writeFileSync(arqLidas, JSON.stringify(lidas, null, 2) + "\n");
      fs.writeFileSync(arq, JSON.stringify(d, null, 2) + "\n");
      console.log('RESPONDIDA e arquivada: ' + corpo.t);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, saiu: true, restam: d.itens.length }));
    });
    return;
  }

  // REVISAR deixou de DECIDIR a fila e passou a só GRAVÁ-LA. O cálculo é o mesmo de /fila,
  // que a página já lê sozinha a cada 15 s — o botão existe agora só para deixar em disco
  // (`pedidos.json`) o retrato do que falta, que é o que eu leio entre sessões. Enquanto ele
  // decidia, a fila só existia depois que alguém clicava: o `pedidos.json` estava com uma
  // lista VAZIA gravada, e a mesa abria dizendo "fila vazia" sem ter perguntado nada a
  // ninguém. Tela que só diz a verdade depois de um clique é tela que mente por padrão.
  if (req.method === 'POST' && url === '/revisar') {
    const e = estadoDaFila();
    const faltam = e.itens.filter(function (i) { return i.estado === 'gerar'; })
      .map(function (i, n) {
        return {
          nome: i.nome, titulo: (n + 1) + ' · ' + i.titulo, referencia: i.referencia,
          tamanho: i.tamanho, origem: '', prompt: i.prompt
        };
      });
    fs.writeFileSync(PEDIDOS, JSON.stringify(faltam, null, 2) + "\n");
    console.log('revisao: ' + faltam.length + ' a gerar · ' + e.contagem.chegou +
      ' chegaram e esperam · ' + e.contagem.pronto + ' no jogo');
    avisarRepetidos();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, n: faltam.length, contagem: e.contagem }));
    return;
  }

  // O BACKLOG (dono, 21/08): a fila oficial da plataforma, priorizada pelo pm e REORDENADA
  // por ele aqui. GET devolve; POST grava o documento inteiro (ferramenta local de uma pessoa
  // — a simplicidade e o desenho, nao preguica). A ordem do array E a prioridade.
  //
  // O HASH E O CONSERTO DO LOST UPDATE (PENDENTES 48). Visto em 21/08: uma mesa aberta havia
  // horas POSTou de volta o retrato que carregou e o backlog perdeu tres itens que o disco ja
  // tinha. Gravar "o array inteiro" sem olhar o disco e last-writer-wins — a aba mais VELHA
  // ganha, que e exatamente ao contrario do que qualquer um espera. Agora o GET carimba o
  // sha1 dos bytes em disco, o POST manda o carimbo que leu, e escrita cuja base nao bate
  // e RECUSADA com 409: a mesa recarrega e o dono reaplica em cima do que existe.
  // O POST devolve o hash NOVO, senao a segunda reordenacao seguida cairia em 409 sozinha.
  if (req.method === 'GET' && url === '/backlog') {
    const bruto = lerBacklog();
    let doc;
    try { doc = JSON.parse(bruto); } catch (e) { res.writeHead(500).end('backlog.json invalido'); return; }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    // Object.assign preserva o resto do documento (`_`, campos futuros): o cliente devolve o
    // que recebeu, e um campo que o servidor esquecesse de repassar sumiria do disco no POST.
    res.end(JSON.stringify(Object.assign({}, doc, { hash: hashBacklog(bruto) })));
    return;
  }
  if (req.method === 'POST' && url === '/backlog') {
    const pd = [];
    req.on('data', function (c) { pd.push(c); });
    req.on('end', function () {
      let doc;
      try { doc = JSON.parse(Buffer.concat(pd).toString('utf8')); }
      catch (e) { res.writeHead(400).end('json invalido'); return; }
      if (!doc || !Array.isArray(doc.itens)) { res.writeHead(400).end('sem itens'); return; }
      const atual = hashBacklog(lerBacklog());
      if (typeof doc.hash !== 'string' || !doc.hash) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, erro: 'sem hash de base — recarregue a mesa', hash: atual }));
        return;
      }
      if (doc.hash !== atual) {
        console.log('backlog: RECUSEI um POST com base velha (' + doc.hash.slice(0, 8) +
          ' contra ' + atual.slice(0, 8) + ') — a mesa vai recarregar');
        res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, erro: 'o backlog em disco mudou depois que esta tela leu — recarregue a mesa', hash: atual }));
        return;
      }
      delete doc.hash;   // o carimbo e do transporte; gravado no arquivo ele so se contradiria
      doc._ = 'O BACKLOG DA PLATAFORMA — a fila oficial, priorizada pelo pm e REORDENADA PELO DONO na mesa (localhost:8200). A ordem daqui e input para todos os agentes: o de cima e o proximo. Editado pela mesa via POST /backlog; a mao tambem vale.';
      const saida = JSON.stringify(doc, null, 2);
      fs.writeFileSync(ARQ_BACKLOG, saida);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, n: doc.itens.length, hash: hashBacklog(saida) }));
    });
    return;
  }

  if (req.method === 'POST' && url === '/salvar') {
    const pedacos = [];
    let total = 0;
    req.on('data', function (c) {
      total += c.length;
      if (total > 40 * 1024 * 1024) { req.destroy(); return; }   // teto: uma imagem, não um filme
      pedacos.push(c);
    });
    req.on('end', function () {
      let corpo;
      try { corpo = JSON.parse(Buffer.concat(pedacos).toString('utf8')); }
      catch (e) { res.writeHead(400).end('json inválido'); return; }

      const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(corpo.dados || '');
      if (!m) { res.writeHead(400).end('não é imagem png/jpeg/webp em data-uri'); return; }

      const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      const nome = nomeSeguro(corpo.nome) + '.' + ext;
      const alvo = path.join(ENTRADA, nome);
      if (!alvo.startsWith(ENTRADA)) { res.writeHead(400).end('caminho fora da pasta'); return; }

      const buf = Buffer.from(m[2], 'base64');
      fs.writeFileSync(alvo, buf);
      // A anotação vai junto: sem ela, daqui a dois dias ninguém sabe de que prompt veio.
      fs.writeFileSync(alvo + '.txt',
        'pedido: ' + (corpo.pedido || '(sem pedido)') + '\n' +
        'origem: ' + (corpo.origem || '(não informada)') + '\n' +
        'bytes: ' + buf.length + '\n');
      console.log('recebida: ' + nome + '  (' + buf.length + ' bytes)  pedido=' + (corpo.pedido || '-'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, arquivo: 'assets/entrada/' + nome, bytes: buf.length }));
    });
    return;
  }

  res.writeHead(404).end('404');
});

// O aviso vai para o CONSOLE e não para a tela, de propósito: pedido repetido é defeito da
// papelada, não trabalho do dono, e a mesa dele agora só mostra o que ele faz ou decide.
function avisarRepetidos() {
  const avisos = repetidosNoManifesto(lerJson('necessario.json', { itens: [] }));
  avisos.forEach(function (a) { console.log('REPETIDO no necessario.json: ' + a); });
  return avisos.length;
}

servidor.listen(PORTA, '127.0.0.1', function () {
  console.log('mesa de entrega em http://localhost:' + PORTA);
  console.log('salvando em ' + ENTRADA);
  const e = epocas();
  console.log('ordem lida de src/jogo.ts: ' + e.lista.length + ' épocas' +
    (e.depoisDe ? ' · travessia depois de ' + e.depoisDe : ''));
  if (!e.lista.length) {
    console.log('AVISO: não achei EPOCAS no src/jogo.ts — a ordem de aparição vai sair errada');
  }
  if (!avisarRepetidos()) console.log('nenhum pedido repetido no manifesto');
});
