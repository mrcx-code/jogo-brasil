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
  console.log('AUTOTESTE OK — o conferidor reprova quando tem de reprovar, e diz de quem é a culpa.');
}

module.exports = { diferencas, lerDoDisco, montarRelatorio };

if (require.main === module) {
  principal().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
}
