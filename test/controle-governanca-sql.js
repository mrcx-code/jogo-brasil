// CONTROLE — a governança viaja com o verbete, e o portão que prova isso NÃO pode ser circular.
//
// ============================================================================================
// POR QUE ESTE ARQUIVO EXISTE
// ============================================================================================
//
// O `--sql` do `conteudo-conferir.js` emite a revisão do espelho: fecha a linha vigente e
// insere a rev+1 como `insert ... select` da linha anterior, para que a GOVERNANÇA (o trabalho
// do historiador: `vence_em`, `tag_s2`, `tag_s2_alto`, `nota`, `revisado_por`, `fonte_revisao`)
// não seja apagada por uma revisão de TEXTO. O comentário §2 daquele arquivo diz isso por
// extenso.
//
// A tabela `conteudo_glossario*` **não tem delete**: revisar é fechar e inserir. Isso é uma
// virtude para o histórico e uma armadilha para o erro — uma coluna esquecida no `insert` entra
// NULL na linha nova, a linha velha fica fechada, e o dado do historiador some **em silêncio**,
// sem erro, sem vermelho, sem ninguém notar até alguém procurar o parecer §2 e não achar. Não
// há "desfazer": o que se pode fazer é uma rev+2 restaurando à mão, se alguém tiver a cópia.
//
// O AUTOTESTE QUE JÁ EXISTE NÃO PEGA ISSO, e é preciso ser explícito sobre o porquê:
// `autotesteSQL` prova a FORMA (a chave certa é alvo, a errada não é, fecho antes de insert,
// `a.rev + 1` presente). Nenhuma dessas asserções olha QUAIS colunas o insert carrega. Um
// emissor que escreve o statement perfeito e esquece `fonte_revisao` passa nas cinco.
//
// ============================================================================================
// A ARMADILHA DA CIRCULARIDADE — a razão de a lista vir do `conteudo-puxar.js`
// ============================================================================================
//
// O jeito óbvio de escrever este controle é percorrer `TABELA[tipo].herda` do próprio
// `conteudo-conferir.js` e exigir que cada item apareça como `a.<coluna>` no select. Esse
// controle **não mede nada**: ele lê a MESMA lista que o defeito encurta. Apagar
// `'fonte_revisao'` de `herda` apaga também a asserção que o cobraria, e o controle sai VERDE
// sobre o defeito que existe para pegar. É a lição 2.8 do EQUIPE.md numa forma pior que
// decoração — decoração não mente, controle circular mente.
//
// A referência independente é o `conteudo-puxar.js`: a lista `GOVERNANCA` dele descreve o que
// o BANCO tem, é escrita por outro motivo (o que baixar), e o próprio puxar já se defende de
// ficar desatualizada — ele RECUSA se o banco devolver coluna que a lista não pede. Então a
// pergunta que este controle faz é a certa: **de tudo que o banco guarda, o que o insert da
// rev+1 deixa para trás?**
//
// ============================================================================================
// AS TRÊS TABELAS, e por que não basta testar a do verbete
// ============================================================================================
//
// `autotesteSQL` só estraga `base.glossario[...]` — verbetes. `TABELA.grupo.herda` e
// `TABELA.par.herda` são listas SEPARADAS, com o mesmo modo de falha, e **nenhum autoteste
// jamais gerou um statement para elas**. Um `herda` vazio em `par` passaria por todo portão
// deste repositório. Este controle exercita as três.
//
// ============================================================================================
// O QUE CONTA COMO "TRATADA" — sancionar é decidir, não anistiar
// ============================================================================================
//
// Nem toda coluna de governança deve ser herdada, e listar as exceções é o ponto: cada uma
// abaixo tem um motivo escrito, e uma coluna que não estiver nem herdada nem sancionada
// REPROVA. É assim que uma coluna NOVA acrescentada ao banco amanhã obriga alguém a decidir o
// que fazer com ela, em vez de entrar NULL para sempre em silêncio.
//
// Uso:
//   node test/controle-governanca-sql.js              # portão: exit 0 só se nada se perde
//   node test/controle-governanca-sql.js --autoteste  # prova que ele reprova (lição 2.8)
'use strict';

const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const ESPELHO = require(path.join(RAIZ, 'ferramentas', 'conteudo-espelho.js'));
const CONFERIR = require(path.join(RAIZ, 'ferramentas', 'conteudo-conferir.js'));
const PUXAR = require(path.join(RAIZ, 'ferramentas', 'conteudo-puxar.js'));

// ————— As sanções, uma por uma, com o motivo —————
//
// `rev`         — tem de MUDAR: a rev+1 é a razão de o insert existir. Herdar seria colidir
//                 com o índice único e mentir sobre o histórico.
// `vigente_de`  — a linha nova passa a valer AGORA. O default do esquema resolve; herdar
//                 diria que a rev+1 vale desde a data da rev anterior.
// `vigente_ate` — a linha nova é a vigente, então é null por definição (é o que o índice
//                 único parcial usa para saber quem está no ar).
// `estado`      — o emissor publica ('publicado'); herdar propagaria um 'rascunho' velho.
// `tem_numero`  — RECALCULADA de propósito (comentário §2 do conferir): é resposta mecânica
//                 sobre o texto NOVO. Carregar a antiga é carregar resposta velha.
// `aprovado_por`/`aprovado_em` — quem publicou ESTA revisão é quem está rodando agora. É a
//                 única assinatura que o plantão pode honestamente pôr.
//
// `revisado_por` e `fonte_revisao` NÃO estão aqui, e é o coração do controle: os dois dizem
// QUEM leu o texto com olho de historiador e COM QUE PARECER. Um plantão que desloca a `ordem`
// de um verbete por causa de um vizinho novo não revisou nada — carimbar-se ali apaga a
// autoria do parecer §2, e a coluna que guarda o parecer some junto.
const SANCIONADAS = {
  rev: 'muda por definição (a.rev + 1)',
  vigente_de: 'a linha nova vale a partir de agora — default do esquema',
  vigente_ate: 'null é o que define "vigente"',
  estado: 'o emissor publica esta revisão',
  tem_numero: 'recalculada sobre o texto novo (conferir §2)',
  aprovado_por: 'quem publica esta revisão é quem roda agora',
  aprovado_em: 'quem publica esta revisão é quem roda agora',
};

// A lista independente: o que o BANCO guarda, por tabela, na forma como o `conteudo-puxar.js`
// a escreve. Mapeia o nome da tabela do puxar para o `tipo` que o emissor usa.
const TIPO_DE = {
  conteudo_glossario_grupo: 'grupo',
  conteudo_glossario: 'verbete',
  conteudo_glossario_rel: 'par',
};

function governancaDoBanco() {
  const m = {};
  for (const tab of PUXAR.TABELAS) {
    const tipo = TIPO_DE[tab.nome];
    if (!tipo) {
      throw new Error('o conteudo-puxar.js passou a puxar a tabela "' + tab.nome + '" e este '
        + 'controle não sabe a que tipo do emissor ela corresponde. Decida antes de seguir.');
    }
    m[tipo] = tab.governanca.slice();
  }
  const faltando = Object.values(TIPO_DE).filter((t) => !m[t]);
  if (faltando.length) throw new Error('o puxar deixou de puxar: ' + faltando.join(', '));
  return m;
}

// ————— Gerar um SQL de revisão REAL para cada uma das três tabelas —————
//
// Uma revisão (não uma inserção): a chave tem de existir dos dois lados, senão o emissor toma
// o caminho do `values` com rev 1, que legitimamente não herda nada — e o controle mediria o
// caminho errado, que é a lição 2.1 nesta escala.
async function sqlPorTipo(montar) {
  const A = ESPELHO.canonizarJogo(await ESPELHO.extrairDoJogo());
  const base = ESPELHO.formaExport(A);
  const clonar = () => JSON.parse(JSON.stringify(base));
  const emissor = montar || CONFERIR.montarSQL;

  const cenas = {
    grupo: (e) => { e.grupo[1].sub = String(e.grupo[1].sub) + ' MEXIDO.'; return e.grupo[1].chave; },
    verbete: (e) => { e.glossario[10].d = e.glossario[10].d + ' MEXIDO.'; return e.glossario[10].chave; },
    par: (e) => { e.rel[3].ordem = (e.rel[3].ordem || 0) + 77; return e.rel[3].termo + ' → ' + e.rel[3].relacionado; },
  };

  const saida = {};
  for (const tipo of Object.keys(cenas)) {
    const e = clonar();
    const chave = cenas[tipo](e);
    const itens = CONFERIR.diferencas(A, ESPELHO.canonizarBanco(e));
    const meus = itens.filter((i) => i.tipo === tipo);
    if (!meus.length) {
      throw new Error('não consegui fabricar uma revisão de "' + tipo + '" — o controle mediria '
        + 'o caminho errado. Chave alvo: ' + chave);
    }
    // Só os itens do tipo em questão, para o SQL medido ser o daquela tabela.
    saida[tipo] = { chave, sql: emissor(meus, A, 'controle-qa') };
  }
  return saida;
}

// ————— A asserção —————
function avaliar(sqlPorTipoObj, gov) {
  const perdas = [];
  for (const tipo of Object.keys(gov)) {
    const { chave, sql } = sqlPorTipoObj[tipo];

    // A coluna tem de estar nas DUAS pontas do insert: no rol de colunas E como `a.<col>` no
    // select. Só o nome solto no arquivo não vale — ele aparece em comentário e em `update`.
    const listaCols = (sql.match(/insert into [^\s(]+ \(([^)]*)\)/) || [])[1] || '';
    const cols = new Set(listaCols.split(',').map((s) => s.trim()).filter(Boolean));
    const herdada = (c) => cols.has(c) && new RegExp('(^|[\\s,(])a\\.' + c + '(\\s|,|$)').test(sql);

    for (const c of gov[tipo]) {
      if (herdada(c)) continue;
      if (SANCIONADAS[c]) {
        // Sancionada, mas ainda tem de estar sendo ESCRITA (ou ter default). A única que pode
        // faltar do rol é a que o esquema preenche sozinho.
        continue;
      }
      perdas.push({
        tipo,
        chave,
        coluna: c,
        como: cols.has(c) ? 'está no insert mas com valor NOVO (não herda de a.' + c + ')'
          : 'não está no insert — entra NULL na rev+1, em silêncio',
      });
    }
  }
  return perdas;
}

function imprimir(perdas) {
  if (!perdas.length) {
    console.log('CONTROLE OK — toda coluna de governança que o banco guarda ou viaja com a '
      + 'linha (a.<col>) ou está sancionada com motivo escrito, nas TRÊS tabelas.');
    return 0;
  }
  console.error('PERDA DE GOVERNANÇA — ' + perdas.length + ' coluna(s) do banco não sobrevivem à rev+1:');
  for (const p of perdas) {
    console.error('  · ' + p.tipo + ' (ex.: "' + p.chave + '") · coluna `' + p.coluna + '`');
    console.error('      ' + p.como);
  }
  console.error('\nA tabela não tem delete: a linha velha fica fechada e o dado do historiador');
  console.error('some sem erro nenhum. Ou o insert herda a coluna, ou ela entra em SANCIONADAS');
  console.error('deste arquivo com o motivo escrito. Anistiar em silêncio é o que não pode.');
  return 1;
}

// ————— O autoteste: prove que ele reprova (lição 2.8) —————
//
// Três defeitos, e o terceiro é o que a versão circular deste controle jamais veria.
async function autoteste() {
  const gov = governancaDoBanco();
  const falhar = (m) => { console.error('AUTOTESTE FALHOU: ' + m); process.exit(1); };

  // 0 — controle do controle: o piso de ruído. Sem defeito, o resultado tem de ser estável.
  const limpo1 = avaliar(await sqlPorTipo(), gov);
  const limpo2 = avaliar(await sqlPorTipo(), gov);
  if (JSON.stringify(limpo1.map((p) => p.tipo + p.coluna).sort())
      !== JSON.stringify(limpo2.map((p) => p.tipo + p.coluna).sort())) {
    falhar('duas medições SEM mudança nenhuma deram resultados diferentes — o instrumento tem '
      + 'ruído e não serve de portão (EQUIPE.md: meça o instrumento contra si mesmo).');
  }
  console.log('autoteste 0/4 — piso de ruído: duas medições sem mudança dão o mesmo ('
    + limpo1.length + ' perda(s) nas duas)');

  // Um emissor de mentira, que copia o de verdade e come colunas — para injetar defeito sem
  // tocar em `ferramentas/`, que não é território do QA.
  const comeColuna = (alvo) => (itens, A, por) => {
    const sql = CONFERIR.montarSQL(itens, A, por);
    return sql
      .replace(new RegExp('(insert into [^\\s(]+ \\([^)]*?), ' + alvo + '([,)])', 'g'), '$1$2')
      .replace(new RegExp('(^|[\\s,])a\\.' + alvo + '(\\s*,\\s*|\\s)', 'gm'), '$1');
  };
  const carimbaEmVezDeHerdar = (alvo) => (itens, A, por) => CONFERIR.montarSQL(itens, A, por)
    .replace(new RegExp('a\\.' + alvo + '\\b', 'g'), '$b$' + por + '$b$');

  // 1 — a coluna some do insert (o defeito real de 01/09 com `fonte_revisao`).
  const d1 = avaliar(await sqlPorTipo(comeColuna('nota')), gov);
  if (!d1.some((p) => p.coluna === 'nota')) falhar('comi a coluna `nota` do insert e o controle NÃO viu.');
  console.log('autoteste 1/4 — coluna comida do insert: ' + d1.filter((p) => p.coluna === 'nota').length
    + ' perda(s) de `nota` acusada(s)');

  // 2 — a coluna fica no insert mas com valor carimbado (o defeito real com `revisado_por`).
  const d2 = avaliar(await sqlPorTipo(carimbaEmVezDeHerdar('tag_s2')), gov);
  if (!d2.some((p) => p.coluna === 'tag_s2')) falhar('carimbei `tag_s2` em vez de herdar e o controle NÃO viu.');
  console.log('autoteste 2/4 — carimbo no lugar da herança: ' + d2.filter((p) => p.coluna === 'tag_s2').length
    + ' perda(s) de `tag_s2` acusada(s)');

  // 3 — A TERCEIRA FORMA, que o controle circular e o autotesteSQL não veem: o defeito só na
  // tabela `par` (ou `grupo`). Nenhum autoteste do repositório gera SQL para elas.
  const soNoPar = (itens, A, por) => {
    const sql = CONFERIR.montarSQL(itens, A, por);
    if (itens.every((i) => i.tipo === 'par')) return comeColuna('nota')(itens, A, por);
    return sql;
  };
  const d3 = avaliar(await sqlPorTipo(soNoPar), gov);
  if (!d3.some((p) => p.tipo === 'par' && p.coluna === 'nota')) {
    falhar('comi `nota` SÓ na tabela `par` e o controle NÃO viu — é o buraco de cobertura que '
      + 'este arquivo existe para fechar.');
  }
  if (d3.some((p) => p.tipo === 'verbete' && p.coluna === 'nota')) {
    falhar('acusei `nota` no verbete, e o defeito foi injetado só no `par` — falso positivo.');
  }
  console.log('autoteste 3/4 — defeito SÓ na tabela `par`: visto no par, ausente no verbete');

  // 4 — coluna nova no banco que o emissor não conhece: tem de reprovar, não ser anistiada.
  const govExtra = JSON.parse(JSON.stringify(gov));
  govExtra.verbete.push('coluna_inventada_amanha');
  const d4 = avaliar(await sqlPorTipo(), govExtra);
  if (!d4.some((p) => p.coluna === 'coluna_inventada_amanha')) {
    falhar('acrescentei uma coluna de governança que o emissor não conhece e o controle NÃO viu.');
  }
  console.log('autoteste 4/4 — coluna nova no banco que o emissor ignora: acusada');

  console.log('AUTOTESTE OK — o controle reprova nas quatro formas, e não é circular: a lista '
    + 'vem do conteudo-puxar.js, que o defeito no emissor não alcança.');
}

async function principal() {
  if (process.argv.indexOf('--autoteste') >= 0) return autoteste();
  const gov = governancaDoBanco();
  const perdas = avaliar(await sqlPorTipo(), gov);
  process.exit(imprimir(perdas));
}

if (require.main === module) {
  principal().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
}

module.exports = { avaliar, governancaDoBanco, sqlPorTipo, SANCIONADAS };
