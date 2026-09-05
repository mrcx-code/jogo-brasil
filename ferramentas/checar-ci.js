// CHECAR O CI DA MAIN — o sinal que faltava no laço do plantão (item `plantao-nao-le-o-ci`,
// PENDENTES.md / backlog, medido por nuvem-20260905T0023 em 05/09: a main ficou VERMELHA no
// CI por 2h35 e quatro pushes seguidos, e nenhuma rodada olhou, porque nenhuma etapa do laço
// olhava. O `npm test` desta máquina mede o disco local; isto aqui mede o GitHub Actions.
//
//   node ferramentas/checar-ci.js
//
// Sai 1 se o veredito for VERMELHO (o último run COMPLETO do workflow `teste` na `main`
// reprovou). Sai 2 se a CONSULTA falhou de verdade (rede, API, forma inesperada — ver a
// SEGUNDA VOLTA abaixo). Sai 0 nos outros dois casos (VERDE, ou DESCONHECIDO — nenhum run
// completo ainda). A REGRA QUE ESTE ARQUIVO EXISTE PARA CUMPRIR: julgar pelo campo
// `conclusion` de um run `completed`, NUNCA pela última linha de log e NUNCA tratando
// `status: in_progress` como veredito — um run em andamento não é verde nem vermelho, é
// indefinido, e confundi-lo com verde é exatamente a armadilha que deixou a main vermelha
// sem ninguém notar.
//
// A SEGUNDA VOLTA, e ela é a lição mais cara desta ferramenta até aqui: a 1ª versão (05/09,
// madrugada) chamava `gh run list` via `execFileSync`. A nuvem tentou usá-la horas depois e
// não tem `gh` instalado (usa o MCP do GitHub, não o CLI, e o CLAUDE.md dela diz isso por
// extenso) — a falha saiu SILENCIOSA, o processo composto terminou exit 0, "de longe parecia
// que rodou". É a mesma doença que a ferramenta existe para curar (main vermelha sem ninguém
// notar), reproduzida dentro dela mesma, na única das três máquinas que roda sem ninguém por
// perto — que é justamente a que não olhou o CI da vez anterior. Reescrita para não depender
// de CLI nenhum: só o módulo `https` embutido do Node, que existe em qualquer máquina que já
// rode este repositório. E qualquer falha de consulta agora é um ESTADO PRÓPRIO ('erro',
// exit 2) — nunca mais silenciosamente igual a "desconhecido" nem a "verde".
//
// TESTÁVEL SEM REDE: CI_INJETAR=<caminho.json> substitui a consulta por um array de runs lido
// de arquivo (mesma forma que a API devolve, já traduzida) — é o que
// `test/checar-ci-veredito.js` usa, com fixtures gravadas de runs REAIS desta rodada.
// CI_INJETAR_ERRO=<motivo> força o caminho de erro sem tocar rede, para provar que ele nunca
// vira "desconhecido" nem "verde" por acidente.
const https = require('https');
const http = require('http');
const fs = require('fs');

// O repositório do GitHub — UMA constante, no espírito do MEDIDA_HOST/ferramentas/dominio.js
// (CLAUDE.md §3.2/§8): mude aqui, nunca em cada chamada.
const OWNER_REPO = 'mrcx-code/jogo-brasil';

// O SENTINELA DO PROXY, e por que ele tem nome aqui (medido pela nuvem em 05/09).
// Na maquina da nuvem, GH_TOKEN e GITHUB_TOKEN EXISTEM e valem a string literal
// "proxy-injected": quem tem a credencial de verdade e o proxy de saida, que a injeta na
// passagem. Mandar esse sentinela como Bearer para o GitHub da 401 -- e foi exatamente isso
// que esta ferramenta fazia, porque o modulo `https` do Node NAO honra HTTPS_PROXY sozinho.
// Medido nos quatro caminhos: pelo proxy com header 200 - pelo proxy sem header 200 (ele
// injeta) - https cru com o sentinela 401 - https cru sem header 403.
const SENTINELA_PROXY = 'proxy-injected';

function tokenDeVerdade() {
  const t = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  return t && t !== SENTINELA_PROXY ? t : '';
}

// Abre um tunel CONNECT quando ha proxy configurado. Sem proxy, devolve null e o pedido sai
// direto, identico ao que era antes -- a maquina de quem tem credencial propria nao muda.
function proxyConfigurado() {
  const u = process.env.HTTPS_PROXY || process.env.https_proxy || '';
  if (!u) return null;
  try {
    const p = new URL(u);
    return { host: p.hostname, port: Number(p.port) || 80 };
  } catch (e) {
    return null;
  }
}

function abrirTunel(proxy, destino) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: proxy.host,
      port: proxy.port,
      method: 'CONNECT',
      path: destino + ':443',
      timeout: 10000,
    });
    req.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        reject(new Error('o proxy recusou o tunel para ' + destino + ': HTTP ' + res.statusCode));
        return;
      }
      resolve(socket);
    });
    req.on('timeout', () => req.destroy(new Error('o proxy nao respondeu ao CONNECT em 10s')));
    req.on('error', reject);
    req.end();
  });
}

function pedidoGithub(caminho) {
  return new Promise(async (resolve, reject) => {
    const proxy = proxyConfigurado();
    let socket = null;
    if (proxy) {
      try {
        socket = await abrirTunel(proxy, 'api.github.com');
      } catch (e) {
        reject(e);
        return;
      }
    }
    const token = tokenDeVerdade();
    const opcoes = {
      hostname: 'api.github.com',
      path: caminho,
      headers: Object.assign(
        { 'User-Agent': 'jogo-brasil-checar-ci', 'Accept': 'application/vnd.github+json' },
        token ? { Authorization: 'Bearer ' + token } : {}
      ),
      timeout: 10000,
    };
    if (socket) {
      opcoes.socket = socket;
      opcoes.agent = false;
    }
    const req = https.get(opcoes, res => {
      let corpo = '';
      res.on('data', d => { corpo += d; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error('GitHub API respondeu ' + res.statusCode + ' em ' + caminho + ': ' + corpo.slice(0, 300)));
          return;
        }
        try {
          resolve(JSON.parse(corpo));
        } catch (e) {
          reject(new Error('GitHub API devolveu JSON inválido em ' + caminho + ': ' + e.message));
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('GitHub API não respondeu em 10s: ' + caminho)));
    req.on('error', reject);
  });
}

async function runsDoGithub(workflow, limite) {
  const json = await pedidoGithub(
    '/repos/' + OWNER_REPO + '/actions/workflows/' + workflow + '.yml/runs' +
    '?branch=main&per_page=' + (limite || 10)
  );
  if (!json || !Array.isArray(json.workflow_runs)) {
    throw new Error('GitHub API devolveu forma inesperada (sem workflow_runs) para "' + workflow + '"');
  }
  return json.workflow_runs.map(r => ({
    databaseId: r.id,
    conclusion: r.conclusion || '',
    status: r.status,
    headSha: r.head_sha,
    createdAt: r.created_at,
    workflowName: r.name,
    url: r.html_url,
  }));
}

async function runsParaVeredito(workflow) {
  if (process.env.CI_INJETAR_ERRO) {
    throw new Error('erro injetado para teste: ' + process.env.CI_INJETAR_ERRO);
  }
  if (process.env.CI_INJETAR) {
    const todos = JSON.parse(fs.readFileSync(process.env.CI_INJETAR, 'utf8'));
    return todos.filter(r => r.workflowName === workflow);
  }
  return runsDoGithub(workflow);
}

// A FUNÇÃO PURA — o que o teste exercita sem tocar rede. Recebe os runs de UM workflow,
// mais recente primeiro (é a ordem que a API já devolve), e devolve o veredito mais
// autoritativo: o `conclusion` do run mais recente cujo `status` é `completed`. Runs
// `in_progress`/`queued` mais recentes que esse são informativos (o `rodando` do retorno),
// nunca o veredito.
function veredito(runs) {
  const completo = runs.find(r => r.status === 'completed');
  const rodando = runs.find(r => r.status !== 'completed');
  if (!completo) {
    return { estado: 'desconhecido', run: null, rodando: rodando || null };
  }
  const estado = completo.conclusion === 'success' ? 'verde'
    : completo.conclusion === 'failure' ? 'vermelho'
    : 'desconhecido';
  return { estado, run: completo, rodando: (rodando && rodando.createdAt > completo.createdAt) ? rodando : null };
}

async function main() {
  let runs;
  try {
    runs = await runsParaVeredito('teste');
  } catch (e) {
    console.log('CI DA MAIN: ERRO AO CONSULTAR — ' + e.message);
    console.log('Isto NÃO é "verde" nem "desconhecido": a consulta falhou de verdade, e tratar');
    console.log('isso como sucesso foi exatamente o bug que a nuvem achou nesta ferramenta em 05/09.');
    process.exitCode = 2;
    return;
  }
  const v = veredito(runs);
  if (v.estado === 'vermelho') {
    console.log('CI DA MAIN: VERMELHO — ' + (v.run ? v.run.url : '(sem url)'));
    console.log('O último run completo do workflow "teste" em main REPROVOU. Antes de despachar');
    console.log('o primeiro agente da rodada, conserte isto ou registre por que não bloqueia.');
    if (v.rodando) console.log('(há um run mais novo ainda em andamento: ' + v.rodando.url + ')');
    process.exitCode = 1;
    return;
  }
  if (v.estado === 'desconhecido') {
    console.log('CI DA MAIN: DESCONHECIDO — nenhum run completo do workflow "teste" encontrado.');
    if (v.rodando) console.log('Run em andamento: ' + v.rodando.url);
  } else {
    console.log('CI DA MAIN: verde (' + (v.run ? v.run.url : '') + ')');
  }
  process.exitCode = 0;
}

module.exports = { veredito, runsDoGithub };
if (require.main === module) {
  main().catch(e => {
    console.log('CI DA MAIN: ERRO INESPERADO — ' + e.message);
    process.exitCode = 2;
  });
}
