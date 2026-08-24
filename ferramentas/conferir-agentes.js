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
// COMO ELE LÊ A TABELA: pelo REST com a chave publicável, que é a mesma que o painel usa. Sem
// rede, ele **não reprova** — devolve 0 com um aviso. Portão que exige internet para passar vira
// vermelho de aeroporto, e vermelho que não é defeito ensina todo mundo a ignorar vermelho.
'use strict';
const fs = require('fs');
const path = require('path');

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

(async () => {
  const pasta = daPasta();
  if (!pasta) { console.error('não achei `.claude/agents/` — nada a conferir'); process.exit(1); }

  const alvo = doPainel();
  if (!alvo) {
    console.log('AVISO: não achei endereço/chave do banco no dashboard — conferência pulada.');
    process.exit(0);
  }

  let tabela;
  try {
    const r = await fetch(alvo.url + '/rest/v1/mesa_agente?select=nome', {
      headers: { apikey: alvo.chave, Authorization: 'Bearer ' + alvo.chave },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    tabela = (await r.json()).map((x) => x.nome).sort();
  } catch (e) {
    // Sem rede não é defeito do repositório. Avisa e passa — ver o cabeçalho.
    console.log('AVISO: não consegui ler `mesa_agente` (' + e.message + ') — conferência pulada.');
    process.exit(0);
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
