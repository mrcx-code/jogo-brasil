#!/usr/bin/env node
// LER A MEDIÇÃO — a resposta da pergunta de três dias, buscada de verdade.
//
//   node ferramentas/ler-medicao.js            últimos 30 dias
//   node ferramentas/ler-medicao.js --dias 7   outra janela
//   node ferramentas/ler-medicao.js --escrever grava o bloco datado no NOTES.md
//
// POR QUE ELA EXISTE. O jogo conta eventos anônimos desde 21/08 e, até 23/08, **ninguém nunca
// leu esses números** — três dias medindo, zero leituras. A pergunta de três dias (*alguém
// volta?*) é a única que este projeto existe para responder, e enquanto ela estiver intacta
// toda priorização é palpite bem-argumentado: endurecer portão e escrever capítulo podem ser,
// os dois, a coisa errada.
//
// A CREDENCIAL, e ela é de outra natureza que a do jogo. A chave embutida no `index.html` é a
// PUBLICÁVEL (`phc_`): ela só MANDA evento, e é por isso que pode viajar no navegador de outra
// pessoa. Ler exige chave PESSOAL (`phx_`), que é segredo — **nunca entra no repositório, nunca
// entra no build, e nenhuma sessão de Claude a vê**. Esta ferramenta a lê do ambiente. Quem
// cria é o dono, no painel do PostHog, em *Personal API keys*.
//
//   export POSTHOG_LEITURA="phx_..."          (ou)
//   echo 'phx_...' > ferramentas/posthog.local   ← já está no .gitignore
//
// Sem chave ela NÃO quebra: explica o que falta e sai com 0. Isso é de propósito — a ferramenta
// existir antes da chave é o que faz o trabalho não esperar por ninguém.
//
// O QUE ELA NÃO FAZ, e não é limitação, é desenho: não há perfil de pessoa (o jogo manda
// `$process_person_profile: false`), não há IP (`$ip: null`) e não há cookie. Então "quantas
// pessoas" aqui é **quantos aparelhos distintos**, e isso é o teto do que se pode saber sem
// identificar ninguém. Preferimos o teto baixo.
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
// A API de LEITURA não é o mesmo host da ingestão. `us.i.posthog.com` recebe evento;
// `us.posthog.com` responde consulta. Errar aqui devolve 200 OK com corpo vazio — o mesmo modo
// de falhar em silêncio que a CSP do §3 documenta para a região.
const API = 'https://us.posthog.com';

function arg(nome, padrao) {
  const i = process.argv.indexOf(nome);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}
const DIAS = Math.max(1, parseInt(arg('--dias', '30'), 10) || 30);
const ESCREVER = process.argv.includes('--escrever');

function chave() {
  if (process.env.POSTHOG_LEITURA) return process.env.POSTHOG_LEITURA.trim();
  const p = path.join(__dirname, 'posthog.local');
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim().split('\n')[0].trim();
  return null;
}

// A chave publicável do jogo, extraída da SAÍDA — é ela que diz qual projeto do PostHog é o
// nosso. Assim a ferramenta não guarda um id de projeto que envelhece em silêncio.
function chavePublicavel() {
  const p = path.join(RAIZ, 'index.html');
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, 'utf8').match(/phc_[A-Za-z0-9]{20,}/);
  return m ? m[0] : null;
}

async function api(caminho, k, corpo) {
  const r = await fetch(API + caminho, {
    method: corpo ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const txt = await r.text();
  if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + caminho + ': ' + txt.slice(0, 300));
  try { return JSON.parse(txt); } catch { throw new Error('resposta não era JSON em ' + caminho); }
}

async function acharProjeto(k) {
  const pub = chavePublicavel();
  const lista = await api('/api/projects/?limit=100', k);
  const proj = (lista.results || []);
  if (!proj.length) throw new Error('a chave não enxerga projeto nenhum');
  if (pub) {
    const casa = proj.find((p) => p.api_token === pub);
    if (casa) return casa;
    console.log('  ⚠ nenhum projeto casa com a chave publicável do index.html (' + pub.slice(0, 12) + '…);'
      + ' usando o primeiro: ' + proj[0].name);
  }
  return proj[0];
}

async function consultar(k, id, hogql) {
  const r = await api('/api/projects/' + id + '/query/', k, { query: { kind: 'HogQLQuery', query: hogql } });
  return r.results || [];
}

// ===== O FILTRO QUE FAZ O NUMERO VALER ALGUMA COISA (23/08) =====
// `properties.local` vale 1 quando o evento saiu de localhost/127.0.0.1 — bancada e CI — e nao
// existe em producao. Sem este filtro a leitura mede a NOSSA propria rodada de teste: na
// primeira vez que rodei, 11.576 "aparelhos", 838 "terminaram o arco" e uma curva de retencao
// PLANA, com um `dia 20000` que so o robusto-tudo produz empurrando o relogio tres anos.
// Os eventos anteriores a 23/08 NAO tem a marca e por isso nao tem conserto: a janela padrao
// vai continuar contaminada ate 30 dias depois desta data. `--tudo` mostra o bruto, para a
// contaminacao ficar visivel em vez de virar lenda.
// ===== A MARCA E UM CORTE, NAO SO UM FILTRO (24/08) =====
// `isNull(properties.local)` INCLUI todo o passado — e o passado inteiro e contaminado, porque
// antes da marca o evento nao tinha como dizer de onde veio. Medido pelo QA com a chave do dono:
// dos 11.576 "aparelhos" da janela de 30 dias, **11.576 sao anteriores a marca**. O numero real
// depois dela era **ZERO**. A ferramenta imprimia 11.576 e 838 arcos terminados em texto limpo, e
// o `--escrever` gravaria isso no NOTES.md sob "A MEDICAO, LIDA" — como fato.
//
// Era o MESMO defeito que a ferramenta existe para denunciar, dentro dela.
//
// Agora a janela COMECA na marca por padrao. `--tudo` continua mostrando o bruto, e a saida diz
// quantos eventos ficaram de fora — a contaminacao vira numero visivel em vez de lenda.
const MARCA = '2026-08-23 17:56:00';   // quando `local:1` entrou no ar
const TUDO = process.argv.includes('--tudo');
const SO_GENTE = TUDO ? '' : " and isNull(properties.local) and timestamp >= toDateTime('" + MARCA + "')";
const J = 'timestamp > now() - interval ' + DIAS + ' day' + SO_GENTE;

(async () => {
  const k = chave();
  if (!k) {
    console.log([
      'SEM CHAVE DE LEITURA — e isto não é erro, é o estado esperado até o dono criar a dele.',
      '',
      'A chave que está no jogo é a PUBLICÁVEL (phc_): ela só manda evento. Ler exige a chave',
      'PESSOAL (phx_), que é segredo e não entra no repositório nem no build.',
      '',
      'Como criar, uma vez só:',
      '  1. No painel do PostHog: avatar (canto superior direito) → Personal API keys → New key',
      '  2. Escopo de LEITURA basta: marque `query:read` e `project:read`. Nada de escrita.',
      '  3. Guarde na máquina, FORA do repositório:',
      '       echo \'phx_a_sua_chave\' > ferramentas/posthog.local',
      '     (esse arquivo já está no .gitignore — confira com: git check-ignore -v ferramentas/posthog.local)',
      '',
      'Depois é só rodar de novo:  node ferramentas/ler-medicao.js',
    ].join('\n'));
    process.exit(0);
  }
  if (!/^phx_/.test(k)) {
    console.error('A chave não começa com `phx_`. A publicável (`phc_`) NÃO lê — ela só manda evento.');
    process.exit(1);
  }

  const proj = await acharProjeto(k);
  console.log('projeto: ' + proj.name + '  ·  janela: ' + DIAS + ' dias\n');
  
  // A CONTAMINACAO VIRA NUMERO VISIVEL, nao lenda. Sem esta linha a pessoa nao tem como saber
  // que a janela que ela pediu foi cortada — e ferramenta que corta em silencio e outra forma
  // de afirmar o que nao sabe.
  if (!TUDO) {
    const antes = await consultar(k, proj.id, `select count(distinct distinct_id) from events`
      + ` where timestamp > now() - interval ${DIAS} day and timestamp < toDateTime('${MARCA}')`);
    const n = (antes[0] || [0])[0] || 0;
    if (n) console.log('  ⚠ ' + n + ' aparelho(s) da janela sao ANTERIORES a ' + MARCA
      + ' — antes da marca o evento nao dizia de onde vinha, entao nao da para saber se eram gente.');
    console.log('  (a janela util comeca na marca; --tudo mostra o bruto)\n');
  }

  const [porEvento, aberturas, porDia, capitulos, respostas, terminaram] = await Promise.all([
    consultar(k, proj.id, `select event, count() as n, count(distinct distinct_id) as ap from events where ${J} group by event order by n desc`),
    consultar(k, proj.id, `select count(distinct distinct_id) from events where event = 'abriu' and ${J}`),
    consultar(k, proj.id, `select toInt(properties.dia) as dia, count(distinct distinct_id) as ap from events where event = 'voltou' and ${J} group by dia order by dia`),
    consultar(k, proj.id, `select toInt(properties.n) as cap, count(distinct distinct_id) as ap from events where event = 'capitulo' and ${J} group by cap order by cap`),
    consultar(k, proj.id, `select properties.resposta as r, count() as n from events where event = 'volta' and ${J} group by r order by n desc`),
    consultar(k, proj.id, `select count(distinct distinct_id) from events where event = 'terminou' and ${J}`),
  ]);

  const abriu = (aberturas[0] || [0])[0] || 0;
  const pct = (n) => (abriu ? ' (' + Math.round((n / abriu) * 100) + '%)' : '');
  const linhas = [];
  const p = (s) => { console.log(s); linhas.push(s); };

  p('APARELHOS QUE ABRIRAM: ' + abriu);
  p('');
  p('A PERGUNTA DE TRÊS DIAS — quantos VOLTARAM:');
  if (!porDia.length) p('  (nenhum evento `voltou` na janela)');
  for (const [dia, ap] of porDia) p('  dia ' + dia + ': ' + ap + ' aparelho(s)' + pct(ap));
  p('');
  p('ATÉ QUE CAPÍTULO CHEGARAM:');
  if (!capitulos.length) p('  (nenhum evento `capitulo` na janela)');
  for (const [cap, ap] of capitulos) p('  capítulo ' + cap + ': ' + ap + pct(ap));
  p('');
  p('TERMINARAM O ARCO: ' + ((terminaram[0] || [0])[0] || 0));
  p('');
  p('"VOCÊ VOLTARIA AMANHÃ?" — a pergunta da CHEGADA:');
  if (!respostas.length) p('  (ninguém respondeu ainda)');
  for (const [r, n] of respostas) p('  ' + (r == null ? '(sem resposta)' : r) + ': ' + n);
  p('');
  p('TODOS OS EVENTOS (total · aparelhos distintos):');
  for (const [ev, n, ap] of porEvento) p('  ' + String(ev).padEnd(24) + String(n).padStart(6) + '  ·  ' + ap);

  if (ESCREVER) {
    // GRAVAR NUMERO SUJO NO DIARIO E O PIOR DESFECHO POSSIVEL: o NOTES.md e o que a proxima
    // sessao le como fato, e numero errado la vira premissa de tudo o que vier depois. Com
    // `--tudo` a janela inclui o CI, entao a gravacao e recusada.
    if (TUDO) {
      console.error('\nRECUSADO: --escrever com --tudo gravaria o CI no Diario como se fosse gente.');
      process.exit(1);
    }
    const hoje = new Date().toISOString().slice(0, 10);
    const bloco = [
      '', '---', '',
      '## ' + hoje + ' — A MEDIÇÃO, LIDA (janela de ' + DIAS + ' dias)',
      '',
      'Primeira leitura dos números que o jogo conta desde 21/08. Gerado por',
      '`node ferramentas/ler-medicao.js --escrever` — o número não vive só na tela de alguém.',
      '',
      '```',
      ...linhas,
      '```',
      '',
    ].join('\n');
    fs.appendFileSync(path.join(RAIZ, 'NOTES.md'), bloco);
    console.log('\n→ escrito no NOTES.md sob "' + hoje + ' — A MEDIÇÃO, LIDA".');
  } else {
    console.log('\n(para gravar no NOTES.md com data: acrescente --escrever)');
  }
})().catch((e) => { console.error('FALHOU: ' + e.message); process.exit(1); });
