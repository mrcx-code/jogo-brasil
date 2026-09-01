// AVENIDA A, FASE 1 — CONFERIR: as duas cópias do glossário são o mesmo texto?
//
// O PROBLEMA QUE ELE RESOLVE. Desde a fase 0 o glossário existe em DOIS lugares: dentro do
// jogo (`src/jogo.ts`, que continua sendo a fonte nesta fase) e no banco (o espelho, onde a
// revisão e o alerta de validade moram). Duas cópias do mesmo texto sem portão é o modo de
// falha mais caro que este repositório conhece — duas verdades que divergem em silêncio e
// ninguém percebe por semanas. O `conteudo-espelho.js` já cobrava isso, mas exigia que alguém
// com MCP exportasse o banco à mão. A fase 1 tira a mão do meio: o banco vira arquivo
// versionado (`conteudo-puxar.js`), e este script compara o arquivo com o jogo.
//
// A DIFERENÇA PARA O ESPELHO, e é por isso que este arquivo existe em vez de uma flag lá: o
// espelho devolve a PRIMEIRA divergência e para. Isso basta para um portão verde/vermelho e
// não basta para TRABALHAR — quem vai aplicar as revisões no banco precisa da lista inteira,
// por chave, com o que cada lado tem. É esse relatório que é a entrega.
//
// A FORMA CANÔNICA É A DO ESPELHO, importada, nunca reescrita. Duas definições de "igual" é o
// mesmo defeito que este portão existe para pegar, um nível acima.
//
// COMO USAR
//   npm run conteudo:conferir                       # exit 0 só com igualdade byte a byte
//   node ferramentas/conteudo-conferir.js --relatorio ferramentas/conteudo/DIVERGENCIA.md
//   node ferramentas/conteudo-conferir.js --autoteste   # PROVA que ele reprova (lição 2.8)
//
// ELE LÊ O `index.html` DA RAIZ, que é SAÍDA. Mexeu em `src/`? Rode `npm run build` antes, ou
// estará comparando o banco com o jogo de ontem — a armadilha registrada no CLAUDE.md §6. O
// script avisa quando desconfia disso.
//
// ESTADO CONHECIDO EM 22/08, e é por isso que ele entra no CI como PASSO INFORMATIVO e não
// como portão: o historiador revisou verbetes no jogo em 21/08 e o banco ainda tem o texto
// anterior. O vermelho de hoje é ESPERADO e é justamente o material de trabalho do plantão.
// Quando o banco alcançar o jogo, o passo do CI vira portão (o comentário está lá, no
// .github/workflows/teste.yml).
'use strict';

const fs = require('fs');
const path = require('path');

const ESPELHO = require('./conteudo-espelho.js');
const { DESTINO, TABELAS } = require('./conteudo-puxar.js');

const RAIZ = path.resolve(__dirname, '..');

// ————— 1. O LADO B: os JSON commitados, na forma que o espelho já sabe canonizar —————
function lerDoDisco() {
  const porTabela = {};
  for (const tab of TABELAS) {
    const alvo = path.join(DESTINO, tab.arquivo);
    if (!fs.existsSync(alvo)) {
      throw new Error('falta ' + path.relative(RAIZ, alvo).split(path.sep).join('/')
        + ' — rode `npm run conteudo:puxar` primeiro.');
    }
    const corpo = JSON.parse(fs.readFileSync(alvo, 'utf8'));
    if (!corpo || !Array.isArray(corpo.linhas)) {
      throw new Error(tab.arquivo + ': não tem a lista `linhas`.');
    }
    porTabela[tab.nome] = corpo.linhas;
  }
  return {
    grupo: porTabela.conteudo_glossario_grupo,
    glossario: porTabela.conteudo_glossario,
    rel: porTabela.conteudo_glossario_rel,
  };
}

// ————— 2. A DIVERGÊNCIA INTEIRA, por chave —————
//
// O espelho compara POSICIONALMENTE (grupo i contra grupo i), o que é certo para dizer
// "iguais ou não" e péssimo para dizer "o que mudou": um verbete inserido no meio desalinha
// tudo depois dele e o relatório viraria ruído. Aqui a comparação é POR CHAVE, dos dois lados,
// e a posição (`ordem`) é só mais um campo comparado.
function porChaveGrupos(c) {
  const m = new Map();
  for (const g of c.grupos) m.set(g.chave, g);
  return m;
}
function porChaveVerbetes(c) {
  const m = new Map();
  for (const g of c.grupos) for (const v of g.verbetes) m.set(v.chave, Object.assign({ grupo: g.chave }, v));
  return m;
}
function porChaveRel(c) {
  const m = new Map();
  for (const r of c.rel) m.set(r.termo + ' → ' + r.relacionado, r);
  return m;
}

// Resumo de campo longo: mostra a JANELA onde os dois textos começam a diferir, com contexto.
// Truncar pelo começo é o jeito garantido de o relatório mostrar 120 caracteres idênticos e
// esconder a palavra que mudou.
function resumo(a, b) {
  const A = String(a), B = String(b);
  if (A.length <= 90 && B.length <= 90) return [JSON.stringify(A), JSON.stringify(B)];
  let i = 0;
  while (i < A.length && i < B.length && A[i] === B[i]) i++;
  const de = Math.max(0, i - 35);
  const corte = (s) => (de > 0 ? '…' : '') + s.slice(de, i + 55) + (i + 55 < s.length ? '…' : '');
  return [JSON.stringify(corte(A)), JSON.stringify(corte(B))];
}

// Cada item guarda os valores CRUS dos dois lados. Quem resume é o consumidor, e os dois
// consumidores querem coisas opostas: o terminal quer a janela onde o texto começa a diferir
// (ler 120 caracteres idênticos no console é ruído), e o relatório quer o texto INTEIRO —
// porque é dele que o plantão copia o texto novo para o `insert` da rev+1. Um relatório com
// reticências obrigaria a pessoa a voltar ao jogo e ler de novo, que é o trabalho que ele
// existe para poupar.
function diferencas(A, B) {
  const itens = [];
  const add = (tipo, chave, campo, jogo, banco) => itens.push({ tipo, chave, campo, jogo, banco });
  const AUSENTE = Symbol('ausente');

  // — grupos —
  const gA = porChaveGrupos(A), gB = porChaveGrupos(B);
  for (const [k, a] of gA) {
    const b = gB.get(k);
    if (!b) { add('grupo', k, '(a linha inteira)', 'existe só no jogo', AUSENTE); continue; }
    for (const campo of ['g', 'curto', 'sub', 'ordem']) {
      if (a[campo] !== b[campo]) add('grupo', k, campo, a[campo], b[campo]);
    }
  }
  for (const k of gB.keys()) if (!gA.has(k)) add('grupo', k, '(a linha inteira)', AUSENTE, 'existe só no banco');

  // — verbetes —
  const vA = porChaveVerbetes(A), vB = porChaveVerbetes(B);
  for (const [k, a] of vA) {
    const b = vB.get(k);
    if (!b) { add('verbete', k, '(a linha inteira)', 'existe só no jogo', AUSENTE); continue; }
    for (const campo of ['t', 'o', 'd', 'f', 'dv', 'ordem', 'grupo']) {
      if (a[campo] !== b[campo]) add('verbete', k, campo, a[campo], b[campo]);
    }
  }
  for (const k of vB.keys()) if (!vA.has(k)) add('verbete', k, '(a linha inteira)', AUSENTE, 'existe só no banco');

  // — pares relacionados —
  const rA = porChaveRel(A), rB = porChaveRel(B);
  for (const [k, a] of rA) {
    const b = rB.get(k);
    if (!b) { add('par', k, '(o par inteiro)', 'existe só no jogo', AUSENTE); continue; }
    if (a.ordem !== b.ordem) add('par', k, 'ordem', a.ordem, b.ordem);
  }
  for (const k of rB.keys()) if (!rA.has(k)) add('par', k, '(o par inteiro)', AUSENTE, 'existe só no banco');

  for (const i of itens) {
    if (i.jogo === AUSENTE) i.jogo = '(não existe deste lado)';
    if (i.banco === AUSENTE) i.banco = '(não existe deste lado)';
  }
  return itens;
}

// ————— 3. O NOME DOS CAMPOS, para o relatório não exigir decorar o esquema —————
const NOME = {
  t: 't (o termo)', o: 'o (a abertura)', d: 'd (a definição)', f: 'f (a fonte)',
  dv: 'dv (é palavra que o jogo RECUSA)', ordem: 'ordem (a posição curada)',
  grupo: 'grupo (a que grupo pertence)', g: 'g (o nome do grupo)',
  curto: 'curto (o rótulo curto)', sub: 'sub (a linha de apoio)',
};
const nomeCampo = (c) => NOME[c] || c;

// ————— 4. O relatório —————
function montarRelatorio(itens, A, B, hA, hB) {
  const nVA = A.grupos.reduce((s, g) => s + g.verbetes.length, 0);
  const nVB = B.grupos.reduce((s, g) => s + g.verbetes.length, 0);
  const L = [];
  L.push('# DIVERGÊNCIA — o glossário do JOGO contra o do BANCO');
  L.push('');
  L.push('Gerado por `node ferramentas/conteudo-conferir.js --relatorio` (Avenida A, fase 1).');
  L.push('**Este arquivo é material de trabalho do plantão**: cada linha abaixo é uma revisão que');
  L.push('o historiador já aplicou no jogo e que o banco ainda não tem. Aplicar é do plantão, via');
  L.push('MCP — nenhuma ferramenta de agente escreve no banco.');
  L.push('');
  L.push('| lado | verbetes | grupos | pares | hash canônico |');
  L.push('|---|---:|---:|---:|---|');
  L.push('| JOGO (`index.html`, extraído headless) | ' + nVA + ' | ' + A.grupos.length + ' | ' + A.rel.length + ' | `' + hA + '` |');
  L.push('| BANCO (`ferramentas/conteudo/*.json`) | ' + nVB + ' | ' + B.grupos.length + ' | ' + B.rel.length + ' | `' + hB + '` |');
  L.push('');
  if (!itens.length) {
    L.push('**ESPELHO ÍNTEGRO** — nenhuma divergência. Os dois lados são o mesmo texto, byte a byte.');
    L.push('');
    return L.join('\n');
  }
  const chaves = new Set(itens.map((i) => i.tipo + '|' + i.chave));
  L.push('**' + itens.length + ' divergência(s) em ' + chaves.size + ' chave(s).**');
  L.push('');
  L.push('O texto abaixo vai INTEIRO, dos dois lados, de propósito: é dele que se copia o valor');
  L.push('novo para o `insert` da rev+1. Relatório com reticências manda a pessoa de volta ao jogo');
  L.push('para ler o que ele deveria ter poupado.');
  L.push('');
  L.push('O resumo em uma linha por chave:');
  L.push('');
  L.push('| tipo | chave | campos que divergem |');
  L.push('|---|---|---|');
  const porChave = new Map();
  for (const i of itens) {
    const k = i.tipo + '|' + i.chave;
    if (!porChave.has(k)) porChave.set(k, []);
    porChave.get(k).push(i);
  }
  for (const [k, grupo] of porChave) {
    const [tipo, chave] = [k.slice(0, k.indexOf('|')), k.slice(k.indexOf('|') + 1)];
    L.push('| ' + tipo + ' | ' + chave.split('|').join('\\|') + ' | '
      + grupo.map((i) => i.campo).join(', ') + ' |');
  }
  L.push('');
  for (const tipo of ['grupo', 'verbete', 'par']) {
    const doTipo = itens.filter((i) => i.tipo === tipo);
    if (!doTipo.length) continue;
    const nomes = { grupo: 'GRUPOS', verbete: 'VERBETES', par: 'PARES RELACIONADOS' };
    L.push('## ' + nomes[tipo] + ' — ' + new Set(doTipo.map((i) => i.chave)).size + ' chave(s)');
    L.push('');
    let atual = null;
    for (const i of doTipo) {
      if (i.chave !== atual) { atual = i.chave; L.push('### ' + i.chave); L.push(''); }
      L.push('**campo ' + nomeCampo(i.campo) + '**');
      L.push('');
      L.push('JOGO (o que vale hoje):');
      L.push('');
      L.push(bloco(i.jogo));
      L.push('');
      L.push('BANCO (o que está lá):');
      L.push('');
      L.push(bloco(i.banco));
      L.push('');
    }
  }
  return L.join('\n');
}

// Texto histórico tem asterisco, sublinhado, colchete e cifrão. Fora de um bloco de código o
// Markdown come parte disso e o que a pessoa copiaria não seria o que está no jogo.
function bloco(v) {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  const cerca = s.indexOf('```') >= 0 ? '~~~~' : '```';
  return cerca + '\n' + s + '\n' + cerca;
}

// ————— 4.1 O SQL DA REVISÃO — a metade que faltava, e que custou uma noite em 24/08 —————
//
// POR QUE ISTO EXISTE. O `PENDENTES 87` mandou o funil COBRAR o espelho, e ele cobra: mexeu no
// glossário do jogo, `conteudo:conferir` fica vermelho e o merge é desfeito. O que nunca foi
// escrito é o outro lado do portão — **como se alcança o verde**. A resposta era, literalmente,
// "quem aplica é o plantão, via MCP: fechar a linha vigente e inserir a nova com rev+1", à mão,
// verbete por verbete. Uma edição de três verbetes desloca a `ordem` de tudo que vem depois
// deles no grupo, então "três verbetes" viram uma dúzia de pares de statements digitados —
// e texto histórico redigitado à mão é exatamente o que o `conteudo-carga.js` existe para não
// fazer ("quando uma ferramenta precisa de dado do jogo, ela RODA O JOGO E EXTRAI").
//
// Portão que reprova sem dizer como sair é portão que se aprende a contornar. Este emissor é
// a saída, gerada da MESMA comparação por chave que imprime o vermelho — sem segunda definição
// de "o que mudou", que é a doença que a Avenida A inteira existe para caçar.
//
// AS TRÊS COISAS QUE O SQL PRECISA ACERTAR, e cada uma é um jeito de perder dado:
//
//   1. FECHAR TUDO ANTES DE INSERIR QUALQUER COISA. Não é estilo: `conteudo-esquema.sql` tem
//      índice único PARCIAL em `(chave) where vigente_ate is null` **e outro em
//      `(grupo_chave, ordem) where vigente_ate is null`**. Inserir o verbete novo antes de
//      fechar quem ocupa aquela `ordem` bate no segundo índice e a transação inteira morre.
//      Por isso o arquivo sai em duas fases: todos os `update` de fecho, depois os `insert`.
//      (E é também por isso que o fecho e o insert NÃO vão num CTE só: statements de um
//      data-modifying CTE não enxergam o efeito um do outro, mas os índices são atualizados
//      no meio do caminho — o unique violation aí depende de ordem que o Postgres não promete.)
//
//   2. A GOVERNANÇA VIAJA COM O VERBETE. `vence_em`, `vence_regra`, `tag_s2`, `tag_s2_alto` e
//      `nota` são trabalho do historiador, não do texto: revisar a definição de um verbete não
//      apaga a data em que ele vence nem a marca de §2 que alguém pôs nele. Por isso o insert
//      da rev+1 é um `insert ... select` da própria linha anterior (a que acabou de ser
//      fechada, `order by rev desc limit 1`) em vez de um `values` com null. Um `values` teria
//      zerado, em silêncio, o dado que a fase 1 inteira existe para poder ler.
//
//   3. `rev + 1` SAI DO BANCO, NUNCA DAQUI. O gerador não sabe em que revisão cada linha está,
//      e chutar seria inventar. O `select` lê a rev da linha anterior e soma um.
//
// `tem_numero` é a única coluna recalculada, e é mecânica ("a definição afirma algum dígito"),
// a mesma regra do `conteudo-carga.js` §26. Ela pode mudar com o texto novo — carregá-la para
// a frente seria carregar uma resposta velha para uma pergunta nova.
//
// O QUE ELE NÃO FAZ, e é trava: **não escreve no banco**. Emite arquivo. Quem aplica é o
// plantão, via MCP, depois de LER o SQL — a mesma fronteira que o `conteudo-puxar.js` guarda
// do outro lado ("NÃO escreve no banco. Só GET").
//
//   node ferramentas/conteudo-conferir.js --sql ferramentas/conteudo/REVISAO.sql --por "nome"

// O dólar-quoting, e o mesmo cuidado do `conteudo-carga.js`: se o texto TERMINA em `$`, o corpo
// colado ao terminador fecha a string cedo e come o último caractere. O teste certo é "a
// PRIMEIRA ocorrência do delimitador em texto+delimitador está no fim".
function escolherTag(textos) {
  for (const tag of ['$b$', '$b1$', '$b2$', '$txt$', '$brasil$']) {
    if (textos.every((t) => (String(t == null ? '' : t) + tag).indexOf(tag) === String(t == null ? '' : t).length)) return tag;
  }
  throw new Error('nenhum delimitador de dólar-quoting é seguro para este texto');
}
const temNumero = (s) => /[0-9]/.test(String(s || ''));

// As três tabelas, cada uma com a sua chave natural e as suas colunas de conteúdo. É a mesma
// lista do `conteudo-puxar.js`; escrita, não descoberta, pelo mesmo motivo que lá.
// A GOVERNANÇA HERDADA — e ela já saiu curta uma vez, no dia em que foi escrita.
//
// A primeira lista tinha cinco colunas e deixava `fonte_revisao` de fora, além de CARIMBAR
// `revisado_por` com o nome de quem aplicava. As duas coisas apagavam o mesmo dado: os 181
// verbetes têm `revisado_por` = "historiador" e `fonte_revisao` = "parecer 21/08/2026: triagem
// §2 dos 181 verbetes", que foi um item inteiro de backlog. Quatro linhas perderam isso antes
// de alguém olhar, e a tabela NÃO TEM DELETE.
//
// A lição do modelo, e ela é a razão de `revisado_por` ser herdado: **deslocar a `ordem` de um
// verbete não é revisar o verbete.** Quem o revisou continua sendo quem o revisou; quem aplicou
// vai em `aprovado_por`, que é o campo para isso. Carimbar `revisado_por` é assinar o parecer de
// outra pessoa.
//
// `tem_numero` NÃO entra aqui de propósito: é a única recalculada, porque é mecânica e depende
// do texto NOVO. `tag_s2_alto` existe só em `conteudo_glossario` — pedi-la nas outras daria erro
// de coluna.
const GOVERNANCA_HERDADA = ['vence_em', 'vence_regra', 'tag_s2', 'nota',
  'revisado_por', 'fonte_revisao'];

const TABELA = {
  grupo: {
    nome: 'public.conteudo_glossario_grupo',
    chaveCols: ['chave'],
    conteudo: ['chave', 'g', 'curto', 'sub', 'ordem'],
    herda: GOVERNANCA_HERDADA,
    numeroDe: 'sub',
  },
  verbete: {
    nome: 'public.conteudo_glossario',
    chaveCols: ['chave'],
    conteudo: ['chave', 't', 'o', 'd', 'f', 'dv', 'grupo_chave', 'ordem'],
    herda: GOVERNANCA_HERDADA.concat(['tag_s2_alto']),
    numeroDe: 'd',
  },
  par: {
    nome: 'public.conteudo_glossario_rel',
    chaveCols: ['termo', 'relacionado'],
    conteudo: ['termo', 'relacionado', 'ordem'],
    herda: GOVERNANCA_HERDADA,
    numeroDe: null,
  },
};

// As linhas do lado A (o jogo), já na forma das colunas do banco, indexadas pela chave que o
// relatório usa — para o emissor não ter a sua própria ideia de o que é uma chave.
function linhasDoJogo(A) {
  const m = { grupo: new Map(), verbete: new Map(), par: new Map() };
  A.grupos.forEach((g) => {
    m.grupo.set(g.chave, { chave: g.chave, g: g.g, curto: g.curto, sub: g.sub, ordem: g.ordem });
    g.verbetes.forEach((v) => m.verbete.set(v.chave, {
      chave: v.chave, t: v.t, o: v.o, d: v.d, f: v.f, dv: v.dv, grupo_chave: g.chave, ordem: v.ordem,
    }));
  });
  A.rel.forEach((r) => m.par.set(r.termo + ' → ' + r.relacionado, {
    termo: r.termo, relacionado: r.relacionado, ordem: r.ordem,
  }));
  return m;
}

function montarSQL(itens, A, por) {
  const doJogo = linhasDoJogo(A);

  // O que o relatório achou, reduzido a UMA decisão por chave. `soNoBanco` é a linha que o jogo
  // não tem mais: ela FECHA e não volta — a tabela não tem delete, de propósito.
  const alvos = [];
  const vistas = new Set();
  for (const i of itens) {
    const k = i.tipo + '|' + i.chave;
    if (vistas.has(k)) continue;
    vistas.add(k);
    const linha = doJogo[i.tipo].get(i.chave);
    const soNoJogo = i.banco === '(não existe deste lado)';
    alvos.push({ tipo: i.tipo, chave: i.chave, linha, nova: soNoJogo, some: !linha });
  }

  const textos = [String(por)];
  for (const a of alvos) {
    if (!a.linha) { textos.push(a.chave); continue; }
    for (const c of TABELA[a.tipo].conteudo) textos.push(a.linha[c]);
  }
  const TAG = escolherTag(textos);
  const dq = (s) => TAG + String(s == null ? '' : s) + TAG;
  const val = (v) => (typeof v === 'boolean' ? (v ? 'true' : 'false')
    : typeof v === 'number' ? String(v) : dq(v));

  // A chave de uma linha que só existe no BANCO não vem do jogo (ele não a tem); ela vem do
  // texto da chave do relatório, que para os pares é "termo → relacionado".
  const ondeChave = (a) => {
    const t = TABELA[a.tipo];
    if (a.linha) return t.chaveCols.map((c) => c + ' = ' + dq(a.linha[c])).join(' and ');
    const partes = a.tipo === 'par' ? a.chave.split(' → ') : [a.chave];
    return t.chaveCols.map((c, i) => c + ' = ' + dq(partes[i])).join(' and ');
  };

  const L = [];
  L.push('-- ============================================================================================');
  L.push('-- REVISÃO DO ESPELHO — GERADO, NÃO ESCRITO À MÃO.');
  L.push('--');
  L.push('-- Fonte: a divergência que `node ferramentas/conteudo-conferir.js` acabou de imprimir entre o');
  L.push('-- glossário do JOGO (index.html, headless) e o do BANCO (ferramentas/conteudo/*.json).');
  L.push('-- NÃO EDITE ESTE ARQUIVO e não o guarde para depois: ele vale para o estado do banco de');
  L.push('-- AGORA. Gere de novo se o banco andar.');
  L.push('--');
  L.push('-- ' + alvos.length + ' chave(s): ' + alvos.filter((a) => a.nova).length + ' nova(s), '
    + alvos.filter((a) => !a.nova && !a.some).length + ' revisada(s), '
    + alvos.filter((a) => a.some).length + ' que só existe(m) no banco e fecha(m).');
  L.push('--');
  L.push('-- A ORDEM É OBRIGATÓRIA: todos os fechos ANTES de qualquer insert. Os índices únicos');
  L.push('-- parciais do esquema são por (chave) e por (grupo_chave, ordem) entre as vigentes — um');
  L.push('-- insert antes do fecho bate no índice e derruba a transação inteira.');
  L.push('-- ============================================================================================');
  L.push('');
  L.push('begin;');
  L.push('');
  L.push('-- ————— FASE 1: fechar as linhas vigentes que vão ser substituídas —————');
  for (const a of alvos) {
    if (a.nova) continue;
    L.push('update ' + TABELA[a.tipo].nome + ' set vigente_ate = now()');
    L.push(' where ' + ondeChave(a) + ' and vigente_ate is null;');
  }
  L.push('');
  L.push('-- ————— FASE 2: inserir o texto do jogo —————');
  for (const a of alvos) {
    if (a.some) continue;
    const t = TABELA[a.tipo];
    const tn = t.numeroDe ? temNumero(a.linha[t.numeroDe]) : false;
    if (a.nova) {
      // Chave que o banco nunca teve: rev 1, governança vazia — não há linha anterior de onde
      // herdar, e inventar `vence_em` aqui seria alarme falso para sempre (carga §26).
      const cols = t.conteudo.concat(['rev', 'estado', 'tem_numero', 'aprovado_por', 'aprovado_em']);
      const vals = t.conteudo.map((c) => val(a.linha[c]))
        .concat(['1', dq('publicado'), tn ? 'true' : 'false', dq(por), 'now()']);
      L.push('insert into ' + t.nome + ' (' + cols.join(', ') + ')');
      L.push('values (' + vals.join(', ') + ');');
    } else {
      // Revisão: rev+1 e a governança vêm da linha ANTERIOR (a que a fase 1 acabou de fechar).
      // Só `aprovado_por`/`aprovado_em` levam o carimbo de quem aplicou. `revisado_por` é
      // herdado com o resto — ver o comentário de GOVERNANCA_HERDADA.
      const cols = t.conteudo.concat(['rev', 'estado', 'tem_numero'], t.herda,
        ['aprovado_por', 'aprovado_em']);
      const sel = t.conteudo.map((c) => val(a.linha[c]))
        .concat(['a.rev + 1', dq('publicado'), tn ? 'true' : 'false'], t.herda.map((c) => 'a.' + c),
          [dq(por), 'now()']);
      L.push('insert into ' + t.nome + ' (' + cols.join(', ') + ')');
      L.push('select ' + sel.join(', '));
      L.push('  from ' + t.nome + ' a');
      L.push(' where ' + ondeChave(a));
      L.push(' order by a.rev desc limit 1;');
    }
  }
  L.push('');
  L.push('commit;');
  L.push('');
  L.push('-- CONFERÊNCIA — leia os números, não o "ok" (EQUIPE.md §4). Depois de aplicar:');
  L.push('--   npm run conteudo:puxar && npm run conteudo:conferir   -- exit 0 = espelho íntegro');
  return L.join('\n');
}

// ————— 5. Linha de comando —————
function arg(nome) {
  const i = process.argv.indexOf(nome);
  return i < 0 ? null : (process.argv[i + 1] || '');
}

// A armadilha do CLAUDE.md §6: o `index.html` da raiz é SAÍDA. Comparar contra ele sem
// construir depois de mexer em `src/` é comparar com o jogo de ontem — e passar, ou reprovar,
// pelo motivo errado. Aviso alto em vez de portão: depois de um `git clone` as datas de
// arquivo não querem dizer nada, e um portão que morde por isso seria pior que o defeito.
function avisarSeVelho() {
  try {
    const saida = fs.statSync(path.join(RAIZ, 'index.html')).mtimeMs;
    const fonte = fs.statSync(path.join(RAIZ, 'src', 'jogo.ts')).mtimeMs;
    if (fonte > saida + 1000) {
      console.log('AVISO: src/jogo.ts é mais novo que o index.html da raiz.');
      console.log('       Rode `npm run build` — senão você compara o banco com o jogo de ontem.');
    }
  } catch (e) { /* sem os dois arquivos não há o que avisar */ }
}

async function principal() {
  avisarSeVelho();

  const cru = await ESPELHO.extrairDoJogo();
  const A = ESPELHO.canonizarJogo(cru);
  const problemas = ESPELHO.conferir(cru, A);
  if (problemas.length) {
    console.error('RECUSADO — o lado do JOGO não fecha consigo mesmo:');
    for (const e of problemas) console.error('  · ' + e);
    process.exit(1);
  }

  if (process.argv.indexOf('--autoteste') >= 0) return autoteste(A);

  const B = ESPELHO.canonizarBanco(lerDoDisco());
  const hA = ESPELHO.hash(A), hB = ESPELHO.hash(B);
  const nVA = A.grupos.reduce((s, g) => s + g.verbetes.length, 0);
  const nVB = B.grupos.reduce((s, g) => s + g.verbetes.length, 0);
  console.log('JOGO  : ' + nVA + ' verbetes · ' + A.grupos.length + ' grupos · ' + A.rel.length + ' pares · ' + hA);
  console.log('BANCO : ' + nVB + ' verbetes · ' + B.grupos.length + ' grupos · ' + B.rel.length + ' pares · ' + hB);

  const itens = diferencas(A, B);
  const rel = arg('--relatorio');
  if (rel) {
    const alvo = path.resolve(RAIZ, rel);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, montarRelatorio(itens, A, B, hA, hB).split('\r\n').join('\n') + '\n', 'utf8');
    console.log('relatório escrito: ' + path.relative(RAIZ, alvo).split(path.sep).join('/'));
  }

  const sql = arg('--sql');
  if (sql) {
    if (!itens.length) {
      console.log('--sql: nada a aplicar, o espelho já está íntegro. Nenhum arquivo escrito.');
    } else {
      const alvo = path.resolve(RAIZ, sql);
      fs.mkdirSync(path.dirname(alvo), { recursive: true });
      const por = arg('--por') || 'plantao';
      fs.writeFileSync(alvo, montarSQL(itens, A, por).split('\r\n').join('\n') + '\n', 'utf8');
      console.log('SQL da revisão escrito: ' + path.relative(RAIZ, alvo).split(path.sep).join('/'));
      console.log('  LEIA antes de aplicar. Ele NÃO escreve no banco — quem aplica é o plantão, via MCP.');
    }
  }

  if (!itens.length) {
    // Cinto e suspensório: o hash e o comparador posicional do espelho têm de concordar com o
    // diff por chave. Se discordarem, o bug é de um dos dois e não se pode dizer "íntegro".
    const posicional = ESPELHO.comparar(A, B);
    if (posicional || hA !== hB) {
      console.error('CONTRADIÇÃO — o diff por chave não achou nada, mas o espelho achou:');
      console.error('  ' + (posicional || 'hashes diferentes'));
      process.exit(1);
    }
    console.log('\nESPELHO ÍNTEGRO — jogo e banco são o mesmo texto, byte a byte.');
    return;
  }

  const chaves = new Set(itens.map((i) => i.tipo + '|' + i.chave));
  console.log('\nDIVERGE — ' + itens.length + ' diferença(s) em ' + chaves.size + ' chave(s):');
  let atual = null;
  for (const i of itens) {
    if (i.tipo + i.chave !== atual) { atual = i.tipo + i.chave; console.log('  · ' + i.tipo + ' "' + i.chave + '"'); }
    const [x, y] = resumo(i.jogo, i.banco);
    console.log('      ' + nomeCampo(i.campo));
    console.log('        jogo  : ' + x);
    console.log('        banco : ' + y);
  }
  console.log('\nO BANCO ESTÁ ATRÁS DO JOGO (ou o contrário). Quem aplica é o plantão, via MCP:');
  console.log('fechar a linha vigente (vigente_ate = now()) e inserir a nova com rev+1.');
  process.exit(1);
}

// ————— 6.1 O autoteste do EMISSOR, que é outra classe de decoração —————
//
// Um emissor de SQL erra de um jeito que o autoteste do conferidor não pega: ele pode acusar a
// divergência certa e escrever o statement errado. Pior, pode escrever statements DEMAIS — e
// mexer numa linha que ninguém pediu, num banco cuja tabela não tem delete, é o estrago que não
// se desfaz. Então o controle mais importante aqui não é "emitiu para a chave que mudou", é
// **"não emitiu para nenhuma que não mudou"**.
//
// Sem Postgres nesta máquina, o que se pode provar é a FORMA — e é o mesmo caminho que o
// `conteudo-carga.js` já escolheu para o SQL dele (ler de volta o que escreveu). A prova de que
// o SQL roda de verdade é o `conteudo:conferir` verde depois de aplicado, e é o plantão que a
// tira, uma vez, no banco.
function autotesteSQL(A, base, clonar) {
  const naoMexida = base.glossario[50].chave;    // uma chave qualquer que NÃO vai divergir
  const e = clonar();
  e.glossario[10].d = e.glossario[10].d + ' MEXIDO.';    // revisão: existe dos dois lados
  const mexida = e.glossario[10].chave;
  const nova = e.glossario.pop().chave;                  // só no jogo: entra com rev 1
  // AS OUTRAS DUAS TABELAS TAMBÉM, e esta é a terceira forma de burlar, achada pelo QA em
  // 01/09: até aqui NENHUM autoteste desta casa jamais gerou um statement para
  // `conteudo_glossario_grupo` nem para `conteudo_glossario_rel`. Um `herda: []` nessas duas
  // passaria por todo portão verde. Estragar uma linha de cada uma faz o emissor emitir para
  // as três, e é sobre as TRÊS que a cobrança de governança abaixo roda.
  e.grupo[2].sub = e.grupo[2].sub + ' MEXIDO.';
  e.rel[3].ordem = 99;
  const itens = diferencas(A, ESPELHO.canonizarBanco(e));
  const sql = montarSQL(itens, A, 'autoteste');

  const falhar = (m) => { console.error('AUTOTESTE DO --sql FALHOU: ' + m); process.exit(1); };

  // O teste é pela chave ALVO de um statement (`chave = $b$…$b$`), não pela chave em qualquer
  // lugar do arquivo: um termo aparece dentro do texto de outro verbete o tempo todo, e
  // procurar solto acusaria o emissor de tocar linha que ele nem menciona.
  const alvoDe = (k) => new RegExp('chave = \\$[a-z0-9]*\\$' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\$');
  if (alvoDe(naoMexida).test(sql)) {
    falhar('a chave "' + naoMexida + '" NÃO divergiu e mesmo assim é alvo de statement no SQL. '
      + 'Emissor que toca linha que ninguém pediu é pior que emissor nenhum.');
  }
  if (!alvoDe(mexida).test(sql)) falhar('a chave revisada "' + mexida + '" não é alvo de nenhum statement.');
  if (sql.indexOf(nova) < 0) falhar('a chave nova "' + nova + '" não aparece no SQL.');
  if (sql.indexOf('a.rev + 1') < 0) falhar('nenhum insert deriva a rev da linha anterior (rev+1).');

  // A ordem que o índice único parcial exige: todo fecho antes de todo insert.
  const ultimoUpdate = sql.lastIndexOf('\nupdate ');
  const primeiroInsert = sql.indexOf('\ninsert into ');
  if (ultimoUpdate < 0 || primeiroInsert < 0) falhar('faltou fase de fecho ou fase de insert.');
  if (ultimoUpdate > primeiroInsert) {
    falhar('há update DEPOIS de insert — isso bate no índice único parcial (grupo_chave, ordem) '
      + 'e derruba a transação inteira.');
  }
  // A chave nova não tem linha anterior: fechar o que não existe seria mentir sobre o banco.
  const linhasDaNova = sql.split('\n').filter((l) => l.indexOf(nova) >= 0);
  if (linhasDaNova.some((l) => /^\s*where .*and vigente_ate is null;/.test(l))) {
    falhar('a chave nova "' + nova + '" ganhou um fecho, e ela nunca existiu no banco.');
  }
  // ————— A GOVERNANÇA, cobrada TABELA POR TABELA e por uma lista de FORA —————
  //
  // Este é o controle que faltava no dia em que o emissor nasceu, e ele já nasceu errado uma
  // vez: a primeira versão percorria `GOVERNANCA_HERDADA`, isto é, exatamente a lista que o
  // defeito encurta. Injetado o defeito real (tirar `fonte_revisao` DAQUELA lista), o autoteste
  // saía **exit 0** — ele deixava de procurar a coluna junto com o emissor. Controle que lê a
  // mesma variável que o defeito estraga é decoração assinada de verde (EQUIPE.md 2.8).
  //
  // Então a lista vem do `conteudo-puxar.js`, que é OUTRO arquivo e a outra ponta do espelho:
  // toda coluna de governança que o puxão traz do banco tem de ser herdada aqui, MENOS as que
  // este emissor decide de propósito — cada uma nomeada com o motivo. Coluna nova no esquema
  // passa a reprovar até alguém decidir de que lado ela cai.
  const DECIDIDAS_AQUI = [
    'rev',          // a.rev + 1, derivada do banco
    'vigente_de',   // default now() — é a linha nova nascendo
    'vigente_ate',  // null: é ela que passa a ser a vigente
    'estado',       // 'publicado'
    'tem_numero',   // recalculada: é mecânica e depende do texto NOVO
    'aprovado_por', // o carimbo de quem aplicou
    'aprovado_em',
  ];
  // ⚠ O STATEMENT NÃO SE CORTA NO PRIMEIRO `;`, e esta armadilha foi paga aqui na mesma hora.
  // A primeira versão fatiava cada statement em `t.indexOf(';')` — e o texto histórico TEM
  // ponto-e-vírgula dentro das aspas. O corte caía no meio da definição de um verbete, antes do
  // `a.rev + 1`, e o controle concluía "nenhum insert de revisão foi emitido" sobre um SQL
  // perfeitamente correto. É a mesma classe do PENDENTES 92 (`semComentarios` lendo o `/*` de
  // uma string de rota como abertura de comentário): analisador ingênuo que confunde o
  // delimitador com o conteúdo. Aqui o único limite confiável é o começo de linha, porque é o
  // emissor logo acima que decide onde cada statement começa.
  const statements = [];
  for (const linha of sql.split('\n')) {
    if (/^(insert into |update )/.test(linha)) statements.push(linha);
    else if (statements.length) statements[statements.length - 1] += '\n' + linha;
  }
  const PUXAR = require('./conteudo-puxar.js');
  for (const tab of PUXAR.TABELAS) {
    const exigidas = tab.governanca.filter((c) => DECIDIDAS_AQUI.indexOf(c) < 0);
    // o insert-select daquela tabela, isolado: é nele que a herança tem de aparecer
    // o `nome` do puxao vem SEM o esquema (`conteudo_glossario`), e o emissor escreve COM
    // (`public.conteudo_glossario`) — casar os dois sem o prefixo faz o filtro nunca achar
    // nada e o controle acusar "nao emitiu" sobre um SQL correto. Custou uma volta.
    const alvo = 'insert into public.' + tab.nome + ' (';
    const revisao = statements.filter((t) => t.startsWith(alvo) && t.indexOf('a.rev + 1') >= 0);
    if (!revisao.length) {
      falhar('nenhum insert de REVISÃO foi emitido para public.' + tab.nome + ' — sem isso a herança '
        + 'de governança dessa tabela nunca é medida, que é como `grupo` e `par` ficaram '
        + 'descobertos até 01/09.');
    }
    const corpo = revisao[0];
    for (const col of exigidas) {
      if (corpo.indexOf('a.' + col) < 0) {
        falhar('em public.' + tab.nome + ', a coluna de governança "' + col + '" não é herdada da linha '
          + 'anterior no insert da rev+1. Coluna de governança que não viaja com o verbete é '
          + 'trabalho do historiador apagado em silêncio — foi assim que o parecer §2 de 4 '
          + 'verbetes se perdeu em 01/09.');
      }
    }
    // E o carimbo aparece UMA vez — `aprovado_por`, e mais nada. Duas ocorrências significam
    // que `revisado_por` (ou outra coluna de parecer) voltou a levar o nome de quem aplicou.
    const carimbos = corpo.split('$b$autoteste$b$').length - 1;
    if (carimbos !== 1) {
      falhar('em public.' + tab.nome + ', o insert da rev+1 carimba o nome de quem aplicou ' + carimbos
        + ' vez(es); tem de ser exatamente 1 (aprovado_por). Deslocar a ordem de um verbete não '
        + 'é revisá-lo: quem o revisou continua sendo quem o revisou.');
    }
  }

  console.log('autoteste do --sql — ' + itens.length + ' divergência(s) viram SQL nas TRÊS '
    + 'tabelas: a revisada e a nova aparecem, a não-mexida NÃO aparece, todo fecho vem antes de '
    + 'todo insert, e a governança inteira do puxão é herdada com um só carimbo por insert');
}

// ————— 6. O autoteste (lição 2.8: portão que nunca foi visto reprovando é decoração) —————
function autoteste(A) {
  const base = ESPELHO.formaExport(A);
  const clonar = () => JSON.parse(JSON.stringify(base));

  // controle: A contra A tem de dar zero.
  const zero = diferencas(A, ESPELHO.canonizarBanco(clonar()));
  if (zero.length) {
    console.error('AUTOTESTE 1/5 FALHOU: A contra A já acusa ' + zero.length + ' diferença(s).');
    process.exit(1);
  }
  console.log('autoteste 1/5 — controle: jogo contra si mesmo, 0 diferenças');

  const cenas = [
    ['definição mudada', (e) => { e.glossario[10].d = e.glossario[10].d + ' MEXIDO.'; return e.glossario[10].chave; }],
    ['fonte mudada', (e) => { e.glossario[20].f = 'FONTE TROCADA'; return e.glossario[20].chave; }],
    ['verbete que só existe no jogo', (e) => { const x = e.glossario.pop(); return x.chave; }],
    ['ordem curada de um par', (e) => { e.rel[3].ordem = 99; return e.rel[3].termo; }],
  ];
  let n = 1;
  for (const [nome, estragar] of cenas) {
    n++;
    const e = clonar();
    const alvo = estragar(e);
    const achou = diferencas(A, ESPELHO.canonizarBanco(e));
    if (!achou.length) {
      console.error('AUTOTESTE ' + n + '/5 FALHOU: estraguei "' + nome + '" em "' + alvo
        + '" e o conferidor NÃO viu. Portão que não reprova é decoração (EQUIPE.md 2.8).');
      process.exit(1);
    }
    const nomeia = achou.some((i) => String(i.chave).indexOf(String(alvo)) >= 0);
    if (!nomeia) {
      console.error('AUTOTESTE ' + n + '/5 FALHOU: viu diferença mas não nomeou a chave "' + alvo + '".');
      process.exit(1);
    }
    console.log('autoteste ' + n + '/5 — ' + nome + ': ' + achou.length
      + ' diferença(s), a chave "' + achou[0].chave + '" nomeada');
  }
  autotesteSQL(A, base, clonar);
  console.log('AUTOTESTE OK — o conferidor reprova quando tem de reprovar, e diz de quem é a culpa.');
}

module.exports = { diferencas, lerDoDisco, montarRelatorio, montarSQL, autotesteSQL };

if (require.main === module) {
  principal().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
}
