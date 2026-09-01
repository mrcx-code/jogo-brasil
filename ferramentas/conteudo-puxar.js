// AVENIDA A, FASE 1 — PUXAR: o banco vira ARQUIVO VERSIONADO neste repositório.
//
// O QUE ISTO FAZ, EM UMA LINHA: baixa as três tabelas de conteúdo do Supabase por REST anônimo
// e escreve um JSON canônico por tabela em `ferramentas/conteudo/`, para o git versionar.
//
// POR QUE ELE É EXPLÍCITO E NUNCA RODA DENTRO DO BUILD. O `npm run build` é offline por
// construção — é o que faz o jogo caber num `index.html` autocontido e é o que faz o CI ser
// reprodutível. Se o build puxasse da rede, um projeto fora do ar (ou uma chave girada, ou um
// runner sem saída) passaria a quebrar a produção; pior, uma revisão aprovada no banco entraria
// no jogo sem nenhum humano ter lido o diff. Então a ordem é esta, e ela é a espinha da fase 1:
//
//     npm run conteudo:puxar   →  escreve/atualiza ferramentas/conteudo/*.json   (rede, à mão)
//     git diff                 →  UM humano lê o que mudou no texto histórico
//     git commit               →  o JSON entra no repositório
//     npm run build            →  100% OFFLINE, lendo só o que está commitado
//
// O QUE ELE NÃO FAZ, e cada uma é uma trava:
//   · NÃO escreve no banco. Só GET. Escrita administrativa é do plantão, via MCP.
//   · NÃO usa credencial nova. A chave é a MESMA publicável do dashboard (CLAUDE.md §8): ela é
//     publicável por construção e, pelas policies de `conteudo-esquema.sql`, só sabe LER o que
//     está publicado e vigente. Chave de serviço aqui seria a conta inteira num arquivo do
//     repositório.
//   · NÃO toca o jogo, nem a CSP dele. O `index.html` continua sem buscar conteúdo em runtime;
//     isso é fase futura e é outra decisão.
//
// IDEMPOTÊNCIA É PROPRIEDADE, NÃO SORTE. Rodar duas vezes com o banco parado tem de deixar
// `git status` limpo — por isso NENHUM carimbo de tempo entra nos arquivos (a hora do puxão
// sai no terminal e no commit; a hora de cada linha já está em `vigente_de`). Um arquivo com
// "puxado_em" mudaria a cada execução e o diff deixaria de significar "o texto mudou", que é a
// única coisa que se quer ler num diff de conteúdo histórico.
//
// COMO USAR
//   npm run conteudo:puxar                 # escreve ferramentas/conteudo/*.json
//   node ferramentas/conteudo-puxar.js --conferir   # NÃO escreve; sai 1 se o disco divergir do banco
//
// O `--conferir` é o modo do plantão: responde "o que está commitado ainda é o que o banco
// diz?" sem sujar a árvore.
'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const DESTINO = path.join(__dirname, 'conteudo');

// ————— 1. O ENDEREÇO E A CHAVE —————
//
// Os dois saem daqui e de mais lugar nenhum. São exatamente os que o `dashboard/index.html`
// usa (linhas SB_URL/SB_KEY) e os que o `test/fila-auth.js` repete: um projeto, uma chave
// publicável. Se um dia forem três lugares, vira constante compartilhada; hoje repetir com o
// comentário é mais honesto que inventar um módulo de configuração para duas strings.
const SB_URL = 'https://hdhqziqvrthxtgyraemk.supabase.co';
const SB_KEY = 'sb_publishable_kR7pCuqZrPAr24Xdr0F4Nw_t1j5YUKN';

// A trava mecânica: chave que não é publicável não sai daqui. É a mesma regra que o
// `ferramentas/construir.js` aplica à `phc_` do PostHog — e ela existe porque o erro que se
// quer impedir (colar a `service_role` num arquivo versionado) é cometido em dois segundos e
// custa a conta inteira.
if (!/^sb_publishable_/.test(SB_KEY)) {
  console.error('RECUSADO: a chave do conteudo-puxar tem de ser PUBLICÁVEL (sb_publishable_…).');
  console.error('Chave de serviço em arquivo versionado é a conta inteira entregue. CLAUDE.md §8.');
  process.exit(1);
}

// ————— 2. AS COLUNAS, tabela por tabela —————
//
// A lista é ESCRITA, não descoberta em tempo de execução, e isso é decisão: `select=*` faria o
// arquivo mudar sozinho quando alguém acrescentasse coluna no banco, e o diff apareceria num
// commit que não sabe por quê. Escrita, a coluna nova só entra quando alguém a põe aqui.
//
// Mas há um guarda para o lado oposto: depois de baixar, o script compara as colunas que o
// banco DEVOLVEU com esta lista e RECUSA se o banco tiver coluna que ninguém está puxando.
// Assim, "escrita" não vira "desatualizada em silêncio" — que é o modo de falha caro.
//
// `id` é a única exclusão deliberada: o `conteudo-esquema.sql` diz, por extenso, que o uuid
// "NÃO é a identidade do conteúdo; a identidade é `chave`". Ele é sorteado, muda a cada revisão
// (revisar é fechar a linha velha e inserir outra) e encheria o diff de ruído sem dizer nada.
const IGNORADAS = ['id'];

// As colunas de governança, comuns às três tabelas. `tag_s2`, `tag_s2_alto`, `vence_em` e
// `vence_regra` já carregam dado real posto pelo historiador em 21/08 — é para poder ler esse
// dado FORA do banco (alerta de validade, triagem de §2, painel) que a fase 1 existe.
const GOVERNANCA = [
  'rev', 'vigente_de', 'vigente_ate', 'estado',
  'vence_em', 'vence_regra', 'tag_s2', 'tem_numero',
  'nota', 'revisado_por', 'fonte_revisao', 'aprovado_por', 'aprovado_em',
];

const TABELAS = [
  {
    nome: 'conteudo_glossario_grupo',
    arquivo: 'conteudo_glossario_grupo.json',
    conteudo: ['chave', 'g', 'curto', 'sub', 'ordem'],
    governanca: GOVERNANCA,
    // A ordenação do ARQUIVO é pela chave natural, e não por `ordem`. Parece detalhe e não é:
    // ordenar pelo campo `ordem` faria uma reordenação de grupos mover blocos inteiros de
    // linhas no diff, escondendo a mudança real. Pela chave, mudar `ordem` aparece como o que
    // é — um campo que mudou, numa linha só.
    chaveOrdem: ['chave'],
  },
  {
    nome: 'conteudo_glossario',
    arquivo: 'conteudo_glossario.json',
    conteudo: ['chave', 't', 'o', 'd', 'f', 'dv', 'grupo_chave', 'ordem'],
    // `tag_s2_alto` existe SÓ nesta tabela (conferido no banco em 22/08: as outras duas não a
    // têm). Pedi-la para as três daria 400 e o puxão morreria inteiro.
    governanca: GOVERNANCA.concat(['tag_s2_alto']),
    chaveOrdem: ['chave'],
  },
  {
    nome: 'conteudo_glossario_rel',
    arquivo: 'conteudo_glossario_rel.json',
    conteudo: ['termo', 'relacionado', 'ordem'],
    governanca: GOVERNANCA,
    chaveOrdem: ['termo', 'relacionado'],
  },
];

// ————— 3. O GET —————
//
// PostgREST pagina; 661 pares cabem numa resposta hoje, mas "cabe hoje" é como se perde linha
// depois. A paginação é explícita, com `order` estável — sem ordem declarada, duas páginas
// podem repetir e pular linhas, e o arquivo sairia errado sem erro nenhum.
const PAGINA = 1000;

async function baixar(tab) {
  const cols = tab.conteudo.concat(tab.governanca);
  const ordem = tab.chaveOrdem.map((c) => c + '.asc').join(',');
  const linhas = [];
  for (let de = 0; ; de += PAGINA) {
    const u = SB_URL + '/rest/v1/' + tab.nome
      + '?select=' + encodeURIComponent(cols.join(','))
      // SÓ AS VIGENTES. A policy de `anon` já filtra publicado+vigente, mas o filtro está
      // escrito aqui também: portão que depende só do outro lado é portão que some quando o
      // outro lado muda.
      + '&vigente_ate=is.null'
      + '&order=' + encodeURIComponent(ordem);
    const r = await fetch(u, {
      headers: {
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        Accept: 'application/json',
        Range: de + '-' + (de + PAGINA - 1),
        'Range-Unit': 'items',
      },
      // sem cookie, como todo pedido deste repositório para fora
      credentials: 'omit',
    });
    if (r.status !== 200 && r.status !== 206) {
      throw new Error(tab.nome + ': HTTP ' + r.status + ' — ' + (await r.text()).slice(0, 300));
    }
    const lote = await r.json();
    if (!Array.isArray(lote)) throw new Error(tab.nome + ': resposta não é lista');
    linhas.push.apply(linhas, lote);
    if (lote.length < PAGINA) break;
  }
  return linhas;
}

// O guarda contra coluna nova que ninguém está puxando (ver comentário do bloco 2).
async function conferirColunas(tab) {
  const r = await fetch(SB_URL + '/rest/v1/' + tab.nome + '?select=*&limit=1', {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Accept: 'application/json' },
    credentials: 'omit',
  });
  if (r.status !== 200 && r.status !== 206) return null;   // sem linha, sem o que conferir
  const amostra = await r.json();
  if (!Array.isArray(amostra) || !amostra.length) return null;
  const noBanco = Object.keys(amostra[0]);
  const pedidas = tab.conteudo.concat(tab.governanca).concat(IGNORADAS);
  const sobrando = noBanco.filter((c) => pedidas.indexOf(c) < 0);
  const faltando = tab.conteudo.concat(tab.governanca).filter((c) => noBanco.indexOf(c) < 0);
  return { sobrando, faltando };
}

// ————— 4. A FORMA CANÔNICA DO ARQUIVO —————
//
// Estável quer dizer: mesmas linhas, mesma ordem, mesmos campos, mesma ordem de campos, sempre.
// Sem isso "o diff é o que mudou no texto" seria mentira.
function comparaChave(tab, a, b) {
  for (const c of tab.chaveOrdem) {
    const x = String(a[c] == null ? '' : a[c]);
    const y = String(b[c] == null ? '' : b[c]);
    // comparação por unidade de código UTF-16, nunca `localeCompare`: locale do runner do CI
    // não é o locale desta máquina, e ordem que muda de máquina é diff fantasma.
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

function canonizarLinhas(tab, linhas) {
  const campos = tab.conteudo.concat(tab.governanca);
  const limpas = linhas.map((l) => {
    const o = {};
    for (const c of campos) o[c] = l[c] === undefined ? null : l[c];
    return o;
  });
  limpas.sort((a, b) => comparaChave(tab, a, b));
  // chave duplicada entre vigentes seria o índice único do banco furado — vale gritar.
  for (let i = 1; i < limpas.length; i++) {
    if (comparaChave(tab, limpas[i - 1], limpas[i]) === 0) {
      throw new Error(tab.nome + ': duas linhas vigentes com a mesma chave — '
        + tab.chaveOrdem.map((c) => limpas[i][c]).join(' · '));
    }
  }
  return limpas;
}

function textoDoArquivo(tab, linhas) {
  const corpo = {
    tabela: tab.nome,
    // O envelope é documentação executável: quem abrir o arquivo daqui a um ano lê nele o que
    // foi pedido ao banco, sem ter de achar este script.
    filtro: "vigente_ate is null (e, pela policy de anon, estado = 'publicado')",
    ordem_do_arquivo: tab.chaveOrdem.join(' + ') + ' (crescente, por unidade de código)',
    colunas: tab.conteudo.concat(tab.governanca),
    excluidas: IGNORADAS,
    linhas: linhas,
  };
  // 2 espaços, LF, sem BOM, com quebra final. O `.gitattributes` prega o LF no disco também.
  return JSON.stringify(corpo, null, 2).split('\r\n').join('\n') + '\n';
}

// ————— 5. Linha de comando —————
async function principal() {
  const soConferir = process.argv.indexOf('--conferir') >= 0;
  if (!fs.existsSync(DESTINO)) fs.mkdirSync(DESTINO, { recursive: true });

  console.log('PUXANDO O CONTEÚDO — ' + SB_URL + ' (chave publicável, só GET)');
  let mudou = 0;
  for (const tab of TABELAS) {
    const drift = await conferirColunas(tab);
    if (drift && drift.faltando.length) {
      console.error('RECUSADO: ' + tab.nome + ' não tem no banco a(s) coluna(s) '
        + drift.faltando.join(', ') + ' que este script pede.');
      process.exit(1);
    }
    if (drift && drift.sobrando.length) {
      console.error('RECUSADO: ' + tab.nome + ' tem no banco coluna que NINGUÉM está puxando: '
        + drift.sobrando.join(', ') + '.');
      console.error('  Acrescente-a à lista deste script (ou a IGNORADAS, com o porquê escrito)'
        + ' — coluna nova que fica de fora em silêncio é dado perdido sem aviso.');
      process.exit(1);
    }

    const cruas = await baixar(tab);
    const linhas = canonizarLinhas(tab, cruas);
    const texto = textoDoArquivo(tab, linhas);
    const alvo = path.join(DESTINO, tab.arquivo);
    const antes = fs.existsSync(alvo) ? fs.readFileSync(alvo, 'utf8') : null;
    const igual = antes === texto;
    if (!igual) mudou++;

    if (soConferir) {
      console.log('  ' + tab.nome + ': ' + linhas.length + ' linhas · disco '
        + (antes === null ? 'NÃO EXISTE' : igual ? 'igual' : 'DIVERGE'));
    } else {
      fs.writeFileSync(alvo, texto, 'utf8');
      console.log('  ' + tab.nome + ': ' + linhas.length + ' linhas -> '
        + path.relative(RAIZ, alvo).split(path.sep).join('/')
        + (antes === null ? ' (novo)' : igual ? ' (sem mudança)' : ' (ATUALIZADO)'));
    }
  }

  if (soConferir) {
    if (mudou) {
      console.error('\nDIVERGE — o que está no disco não é o que o banco diz hoje.');
      console.error('Rode `npm run conteudo:puxar`, LEIA o diff e commite.');
      process.exit(1);
    }
    console.log('\nEM DIA — os arquivos commitados são exatamente o que o banco devolve.');
    return;
  }

  console.log('\nfeito. ' + (mudou ? mudou + ' arquivo(s) mudaram — LEIA o `git diff` antes de commitar.'
    : 'nada mudou (o puxão é idempotente por construção).'));
  console.log('O build continua OFFLINE: ele lê estes arquivos do disco, nunca a rede.');
}

module.exports = { TABELAS, DESTINO, canonizarLinhas, textoDoArquivo, SB_URL };

if (require.main === module) {
  principal().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
}
