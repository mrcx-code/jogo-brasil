#!/usr/bin/env node
// A PASTA E A TABELA TÊM DE CONTAR A MESMA HISTÓRIA — o portão do painel de agentes.
//
//   node ferramentas/conferir-agentes.js            confere e reprova (exit 1)
//   node ferramentas/conferir-agentes.js --sql      imprime o SQL que conserta
//
// POR QUE EXISTE. Pedido do dono em 24/08, com essas palavras: *"garanta que o painel esteja
// atualizado com todos nossos agentes… o dashboard deve sempre estar atualizado"*. O "sempre"
// é a parte que importa — e "sempre" não se cumpre lembrando, se cumpre medindo.
//
// O DESENCONTRO MEDIDO NO DIA: `.claude/agents/` declarava **12** agentes e `mesa_agente` tinha
// **9** deles. Faltavam `dev-dados`, `pesquisadora-fontes` e `pre-integrador`. Os dois primeiros
// eram apontados por itens `livre` do backlog — ou seja, **havia trabalho na fila endereçado a
// quem não tinha cartão na tela, e portanto não tinha botão**. O terceiro ninguém tinha notado,
// justamente porque nenhum item apontava para ele: sem o portão, o desencontro só aparece quando
// alguém procura o botão e não acha.
//
// O CLAUDE.md §5.2 já decidia quem manda: *"os agentes vivem em `.claude/agents/` — **a pasta é
// a verdade**"*. Este portão só cobra o que a lei já diz.
//
// `Claude` é a linha da própria sessão (o laço principal) e não tem arquivo de agente — é a
// única exceção, e ela é nomeada aqui em vez de virar exceção silenciosa.
//
// COMO ELE LÊ A TABELA: pelo REST com a chave publicável, que é a mesma que o painel usa.
//
// NAO CONFERIDO NAO E APROVADO — correcao de 24/08 (o proprio QA me pegou nisto no mesmo dia).
// Sem rede, ou com a chave fora do html, este portao NAO tem como saber se o elenco bate — e
// sair 0 ali e o exato padrao que a caca de gap nomeou: afirmar (passou) a partir de um sinal
// que faltou. Entao ele sai 2, um codigo PROPRIO para 'nao sei': o plantao re-tenta ou checa a
// rede, e o CI (que alcanca o banco) so ve o 2 quando ha problema de verdade. 0 = confere e bate;
// 1 = confere e NAO bate; 2 = nao consegui conferir. Tres estados, tres codigos.

'use strict';
const fs = require('fs');
const path = require('path');
// GAP 5 DO QA (05/09): um `require` cru aqui acopla este portão a um arquivo novo, e se ele
// sumir o processo morre com **exit 1** — que o cabeçalho acima reserva para "conferiu e NÃO
// bate". Seria uma mentira do mesmo tipo que este arquivo passou a existir para não contar: um
// código de saída afirmando algo que não foi medido. Falta de instrumento é 2, "não consegui
// conferir", e é o que o CI e o plantão leem.
let classificar;
try {
  ({ classificar } = require('./rede-da-casa.js'));
} catch (e) {
  // `e.message` estoura dentro do próprio catch quando o que foi lançado não é Error
  // (`throw "string"`, `throw null`) — e aí o processo sai 1, que é a mentira exata que este
  // bloco existe para não contar. Achado do QA na 2a rodada.
  const motivo = String((e && e.message) || e).split('\n')[0];
  console.log('AVISO: não achei `ferramentas/rede-da-casa.js` (' + motivo + ')');
  console.log('       — conferência pulada. Isto é falta de instrumento (2), não desacordo (1).');
  process.exit(2);
}

const RAIZ = path.resolve(__dirname, '..');
const SO_SQL = process.argv.includes('--sql');

// A linha do laço principal não tem arquivo em `.claude/agents/` — ela é a sessão, não um agente
// despachável. Exceção nomeada, para não virar buraco.
const SEM_ARQUIVO = new Set(['Claude']);

function daPasta() {
  const dir = path.join(RAIZ, '.claude', 'agents');
  if (!fs.existsSync(dir)) return null;
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

// A chave publicável e o endereço saem do próprio dashboard — não de uma constante daqui, que
// envelheceria em silêncio no dia em que o projeto mudasse. É o mesmo princípio do
// `ler-medicao.js`, que acha o projeto pela chave que está no `index.html`.
function doPainel() {
  const p = path.join(RAIZ, 'dashboard', 'index.html');
  if (!fs.existsSync(p)) return null;
  const html = fs.readFileSync(p, 'utf8');
  const url = (html.match(/https:\/\/[a-z0-9]+\.supabase\.co/) || [])[0];
  const chave = (html.match(/\b(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+)/) || [])[0];
  return url && chave ? { url, chave } : null;
}

// O MODELO DE CADA AGENTE — do frontmatter YAML de `.claude/agents/*.md`. A pasta e a verdade.
function modelosDaPasta() {
  const base = path.join(RAIZ, '.claude', 'agents');
  const mapa = {};
  for (const f of fs.readdirSync(base).filter((x) => x.endsWith('.md'))) {
    const nome = f.replace(/\.md$/, '');
    const m = fs.readFileSync(path.join(base, f), 'utf8').match(/^model:\s*(\S+)/m);
    mapa[nome] = m ? m[1] : 'herda';
  }
  return mapa;
}

// O MAPA DO DASHBOARD (META_AGENTE) — o painel mostra modelo por agente a partir de um mapa
// ESTATICO no HTML (o navegador nao le a pasta). Este bloco cobra que ele ESPELHE o frontmatter:
// se um agente troca de modelo e o mapa nao acompanha, o painel passa a mentir em silencio, que
// e exatamente o que o dono nao quer de um painel de gasto. `Claude` e a sessao principal e nao
// tem arquivo — nao entra na comparacao com a pasta.
function metaDoPainel() {
  const p = path.join(RAIZ, 'dashboard', 'index.html');
  if (!fs.existsSync(p)) return null;
  const html = fs.readFileSync(p, 'utf8');
  const bloco = html.match(/var META_AGENTE\s*=\s*\{([\s\S]*?)\};/);
  if (!bloco) return null;
  const mapa = {};
  const re = /"([^"]+)"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(bloco[1]))) mapa[m[1]] = m[2];
  return mapa;
}

(async () => {
  const pasta = daPasta();
  if (!pasta) { console.error('não achei `.claude/agents/` — nada a conferir'); process.exit(1); }

  // O MAPA DE MODELO E LOCAL E DETERMINISTICO — confere ANTES da rede, e reprova (exit 1) mesmo
  // offline. Um painel de gasto que mostra o modelo errado e pior que nao mostrar nenhum.
  if (!SO_SQL) {
    const daPastaMod = modelosDaPasta();
    const noPainel = metaDoPainel();
    if (noPainel) {
      const diverg = [];
      for (const nome of Object.keys(daPastaMod)) {
        // apenas os apelidos-base sao comparaveis (opus/sonnet/haiku/fable); o painel usa apelido.
        if (!(nome in noPainel)) { diverg.push(nome + ': falta no META_AGENTE do painel'); continue; }
        if (noPainel[nome] !== daPastaMod[nome]) {
          diverg.push(nome + ': pasta diz `' + daPastaMod[nome] + '`, painel diz `' + noPainel[nome] + '`');
        }
      }
      if (diverg.length) {
        console.log('MODELO NO PAINEL: FALHOU — o mapa META_AGENTE nao espelha o frontmatter:');
        for (const d of diverg) console.log('  ✗ ' + d);
        console.log('  Conserte o `var META_AGENTE` em dashboard/index.html.');
        process.exit(1);
      }
      console.log('  modelo no painel: PASSOU — META_AGENTE espelha o frontmatter (' + Object.keys(daPastaMod).length + ' agentes).');
    }
  }

  const alvo = doPainel();
  if (!alvo) {
    console.log('AVISO: não achei endereço/chave do banco no dashboard — conferência pulada.');
    process.exit(2);
  }

  let tabela;
  try {
    const r = await fetch(alvo.url + '/rest/v1/mesa_agente?select=nome', {
      headers: { apikey: alvo.chave, Authorization: 'Bearer ' + alvo.chave },
      signal: AbortSignal.timeout(15000),
    });
    // O CORPO É A EVIDÊNCIA, e jogá-lo fora era o defeito (medido em 05/09 por
    // nuvem-20260905T0822). Esta linha imprimia "HTTP 403" e quem lia ia caçar chave do
    // Supabase, RLS, política — enquanto o corpo dizia, por extenso, "Host not in allowlist":
    // a máquina não tem egresso para o host, e nenhuma chave conserta rota que não existe.
    // Os dois casos saem com o MESMO número; só o corpo os separa. Ver ferramentas/rede-da-casa.js.
    if (!r.ok) {
      const corpo = await r.text().catch(() => '');
      const v = classificar(new URL(alvo.url).hostname, { status: r.status, corpo },
        { segredos: [alvo.chave] });
      const e = new Error(v.frase);
      e.tipoDeRede = v.tipo;
      throw e;
    }
    tabela = (await r.json()).map((x) => x.nome).sort();
  } catch (e) {
    // Sem rede não é defeito do repositório. Avisa e passa — ver o cabeçalho.
    console.log('AVISO: não consegui ler `mesa_agente` — conferência pulada.');
    console.log('       ' + (e.tipoDeRede ? '[' + e.tipoDeRede + '] ' : '') + e.message);
    process.exit(2);
  }

  const naTabela = new Set(tabela);
  const naPasta = new Set(pasta);
  const faltam = pasta.filter((n) => !naTabela.has(n));
  const sobram = tabela.filter((n) => !naPasta.has(n) && !SEM_ARQUIVO.has(n));

  console.log('  .claude/agents/ : ' + pasta.length + ' — ' + pasta.join(' · '));
  console.log('  mesa_agente     : ' + tabela.length + ' — ' + tabela.join(' · '));

  if (SO_SQL) {
    if (!faltam.length) { console.log('\nnada a inserir.'); process.exit(0); }
    console.log('\n-- cole no SQL do Supabase:');
    for (const n of faltam) {
      console.log("insert into mesa_agente (nome, papel, status, ordem, squad) values ('"
        + n + "', '(defina)', 'espera', 99, '(defina)') on conflict (nome) do nothing;");
    }
    process.exit(0);
  }

  const falhas = [];
  if (faltam.length) {
    falhas.push('SEM CARTÃO NO PAINEL: ' + faltam.join(', ')
      + ' — a pasta os declara e a tabela não os tem, então não há botão para acioná-los.');
  }
  if (sobram.length) {
    falhas.push('CARTÃO SEM AGENTE: ' + sobram.join(', ')
      + ' — a tabela os mostra e `.claude/agents/` não os declara. Ou o arquivo sumiu, ou a linha ficou.');
  }

  console.log('\n' + (falhas.length
    ? 'AGENTES: FALHOU\n  ✗ ' + falhas.join('\n  ✗ ')
      + '\n\n  Para o SQL que conserta: node ferramentas/conferir-agentes.js --sql'
    : 'AGENTES: PASSOU — a pasta e o painel contam a mesma história (' + pasta.length + ' agentes).'));
  process.exit(falhas.length ? 1 : 0);
})();
