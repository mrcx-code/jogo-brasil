// O TESTE DO VIGIA DE VALIDADE — e o CONTROLE que tenta derrubá-lo.
//
// O QUE ELE COBRE, e por que cada coisa está aqui:
//
//   1. AS BORDAS. Um vigia é uma função de comparação de datas, e função de comparação de
//      datas erra sempre no mesmo lugar: no dia exato. Então as bordas vão medidas uma a uma,
//      com fixtures cravados numa data de referência fixa (`--hoje 2026-08-22`), e não contra
//      o corpus de verdade — corpus é conteúdo, e conteúdo muda quando o historiador revisa.
//      Um teste que crava "2 vencem em outubro" reprova no dia em que o acervo melhorar, e um
//      portão que reprova por motivo errado é o que faz as pessoas pararem de olhar portão.
//
//   2. O QUE VALE SOBRE O CORPUS DE VERDADE é só o que é ESTRUTURAL e não envelhece: toda
//      linha com `vence_em` tem `vence_regra` (a trava da data órfã) e toda data é uma data.
//      Isso pode ser cobrado do acervo real para sempre, porque é regra de esquema, não de
//      texto.
//
//   3. O CONTROLE (EQUIPE.md 2.8: "um instrumento que nunca foi visto reprovando é
//      decoração"). Três defeitos são INJETADOS numa cópia do vigia, um por vez, e o teste
//      exige que a cópia defeituosa DEIXE PASSAR o que a boa pega. Se uma cópia estragada
//      continuar acusando, o problema não é a cópia: é que o teste está medindo outra coisa —
//      e aí este arquivo sai 1.
//
// COMO RODAR:  node test/conteudo-vigia-teste.js
// Não precisa de rede, de navegador nem de build: é o vigia contra arquivos de mentira.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const VIGIA = path.join(RAIZ, 'ferramentas', 'conteudo-vigia.js');
const V = require(VIGIA);
const { TABELAS } = require(path.join(RAIZ, 'ferramentas', 'conteudo-puxar.js'));

// A data de referência é o dia da entrega, e ela é FIXA de propósito: sem `--hoje` este
// arquivo passaria hoje e reprovaria amanhã, que é o defeito clássico de teste de data.
const HOJE = '2026-08-22';

let falhas = 0, ok = 0;
function conferir(nome, condicao, detalhe) {
  if (condicao) { ok++; console.log('  ok   · ' + nome); return true; }
  falhas++;
  console.log('  FALHA· ' + nome + (detalhe ? '   → ' + detalhe : ''));
  return false;
}
function igual(nome, obtido, esperado) {
  return conferir(nome, JSON.stringify(obtido) === JSON.stringify(esperado),
    'obtido ' + JSON.stringify(obtido) + ', esperado ' + JSON.stringify(esperado));
}

// ————— fixtures —————
//
// Escritos em `test/tmp-*` porque é a pasta que o .gitignore já cobre (EQUIPE.md 2.5: sonda
// descartável não entra no histórico), e recriados a cada execução para que uma sobra de
// ontem nunca explique um verde de hoje.
const TMP = path.join(__dirname, 'tmp-vigia');
function limpar() { fs.rmSync(TMP, { recursive: true, force: true }); }

// Uma linha de fixture só precisa dos campos que o vigia lê. As demais colunas do esquema
// ficam de fora de propósito: se um dia o vigia passar a depender de outra, o teste quebra
// aqui, alto, em vez de o fixture "por acaso" ter o campo certo.
function verbete(chave, vence_em, vence_regra, vigente_ate) {
  return { chave, vence_em: vence_em || null, vence_regra: vence_regra || null,
    vigente_ate: vigente_ate || null };
}

function escrever(nome, linhasPorTabela) {
  const dir = path.join(TMP, nome);
  fs.mkdirSync(dir, { recursive: true });
  for (const tab of TABELAS) {
    fs.writeFileSync(path.join(dir, tab.arquivo), JSON.stringify({
      tabela: tab.nome, linhas: linhasPorTabela[tab.nome] || [],
    }, null, 2) + '\n', 'utf8');
  }
  return dir;
}

// O caso completo. As distâncias em dias saem contadas a partir de 2026-08-22:
//   2026-10-20 = +59  ·  2026-10-21 = +60 (a borda inclusiva)  ·  2026-10-22 = +61
const BASE = {
  conteudo_glossario: [
    verbete('VENCIDO-ONTEM', '2026-08-21', 'acompanhar DOU — vence por publicacao.'),
    verbete('VENCIDO-ANTIGO', '2025-10-01', '~outubro, INPE — nota do PRODES do ciclo.'),
    verbete('BORDA-HOJE', '2026-08-22', 'UNESCO — decisao do comite sai hoje.'),
    verbete('DIAS-59', '2026-10-20', '~outubro, INPE — dentro da janela por um dia.'),
    verbete('DIAS-60', '2026-10-21', '~outubro, INPE — a borda, e ela e INCLUSIVA.'),
    verbete('DIAS-61', '2026-10-22', '~outubro, INPE — um dia fora da janela.'),
    verbete('SEM-DATA-IBGE-A', null, 'decenal, IBGE — Censo 2022, cor ou raca.'),
    verbete('SEM-DATA-IBGE-B', null, 'decenal, IBGE — outro numero do mesmo censo.'),
    verbete('SEM-DATA-DOU', null, 'acompanhar DOU — titulacao sai publicada.'),
    verbete('SEM-DATA-SEM-SINAL', null, 'reconferir com a propria comunidade a cada edicao.'),
    verbete('SEM-VALIDADE-NENHUMA', null, null),
    verbete('FECHADA', '2020-01-01', 'acompanhar DOU — ja substituida.', '2026-01-01'),
  ],
  // O par existe para provar que o vigia varre AS TRÊS tabelas e que a chave composta
  // (`termo → relacionado`) chega legível no relatório — não só a `chave` do glossário.
  conteudo_glossario_rel: [
    { termo: 'DESMATAMENTO', relacionado: 'INPE', vence_em: '2026-08-01',
      vence_regra: '~outubro, INPE — o par tambem envelhece.', vigente_ate: null },
  ],
};

function semOsVencidos() {
  const c = JSON.parse(JSON.stringify(BASE));
  c.conteudo_glossario = c.conteudo_glossario.filter((l) => l.chave.indexOf('VENCIDO') < 0);
  c.conteudo_glossario_rel = [];
  return c;
}

// ————— rodar o vigia como PROGRAMA, que é como a rotina o usa —————
function rodar(args) {
  try {
    const saida = execFileSync(process.execPath, [VIGIA].concat(args),
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out: saida };
  } catch (e) {
    return { code: e.status == null ? -1 : e.status, out: String(e.stdout || ''), err: String(e.stderr || '') };
  }
}

// ————————————————————————————————————————————————————————————————————————
limpar();
console.log('VIGIA DE VALIDADE — teste das bordas e controle do portão');
console.log('data de referência fixa: ' + HOJE + '\n');

const dirBase = escrever('base', BASE);
const dirLimpo = escrever('limpo', semOsVencidos());
const dirInvalida = escrever('invalida', {
  conteudo_glossario: [verbete('DATA-INVALIDA', '2026-02-30', 'decenal, IBGE — 30 de fevereiro nao existe.')],
});
const dirOrfa = escrever('orfa', {
  conteudo_glossario: [verbete('DATA-ORFA', '2026-09-01', null)],
});

// ————— 1. as categorias e as bordas, pela API —————
console.log('1. AS BORDAS (classificar, hoje=' + HOJE + ', janela=60)');
const r = V.classificar(V.lerDoDisco(dirBase).linhas, { hoje: HOJE, janela: 60 });

igual('VENCIDO lista as 3 (2 verbetes + 1 par), da mais velha para a mais nova',
  r.vencido.map((i) => i.chave), ['VENCIDO-ANTIGO', 'DESMATAMENTO → INPE', 'VENCIDO-ONTEM']);
igual('o par vencido chega com a chave composta e a tabela certa',
  r.vencido.filter((i) => i.tabela === 'conteudo_glossario_rel').map((i) => i.chave),
  ['DESMATAMENTO → INPE']);
igual('dias negativos: -325, -21, -1', r.vencido.map((i) => i.dias), [-325, -21, -1]);

igual('JANELA pega hoje(0), 59 e 60 — e a borda de 60 é INCLUSIVA',
  r.janela_aviso.map((i) => i.chave + '=' + i.dias),
  ['BORDA-HOJE=0', 'DIAS-59=59', 'DIAS-60=60']);
conferir('vencer HOJE não é vencido (o número publicado hoje ainda vale hoje)',
  r.vencido.every((i) => i.chave !== 'BORDA-HOJE'));

igual('FUTURO começa em 61', r.futuro.map((i) => i.chave + '=' + i.dias), ['DIAS-61=61']);

igual('SEM DATA lista as 4 que têm regra e nenhuma data',
  r.sem_data.map((i) => i.chave).sort(),
  ['SEM-DATA-DOU', 'SEM-DATA-IBGE-A', 'SEM-DATA-IBGE-B', 'SEM-DATA-SEM-SINAL']);
conferir('linha sem vence_em E sem vence_regra não entra em categoria nenhuma',
  JSON.stringify(r).indexOf('SEM-VALIDADE-NENHUMA') < 0);
conferir('linha FECHADA (vigente_ate != null) é ignorada e CONTADA, não some calada',
  r.fechadas_ignoradas === 1 && JSON.stringify(r).indexOf('"FECHADA"') < 0,
  'fechadas_ignoradas=' + r.fechadas_ignoradas);
igual('total com validade = 11 de 13 linhas', [r.total_com_validade, r.total_linhas], [11, 13]);
igual('nada malformado neste fixture', r.recusas.length, 0);

// ————— 2. o agrupamento pela regra —————
console.log('\n2. AGRUPAMENTO PELA REGRA (só o que não tem data)');
// O ponto final some do rótulo de propósito: "decenal, IBGE." e "decenal, IBGE" são a mesma
// regra, e pontuação de fim de frase não pode partir uma família em duas.
igual('as 4 sem data caem em 3 famílias, a maior primeiro, sem a pontuação final',
  r.familias.map((f) => f.familia + '=' + f.n),
  ['decenal, IBGE=2', 'acompanhar DOU=1', 'reconferir com a propria comunidade a cada edicao=1']);
igual('a família decenal-IBGE nomeia as duas chaves',
  r.familias[0].chaves, ['SEM-DATA-IBGE-A', 'SEM-DATA-IBGE-B']);
igual('regra sem órgão conhecido vira "(sem sinal reconhecido)", visível e não gaveta',
  r.por_sinal['(sem sinal reconhecido)'], 1);
igual('o rollup por sinal conta TODAS as linhas com validade, datadas ou não',
  Object.keys(r.por_sinal).sort().map((k) => k + '=' + r.por_sinal[k]),
  ['(sem sinal reconhecido)=1', 'DOU=2', 'IBGE=2', 'INPE=5', 'UNESCO=1']);
igual('a família NÃO agrupa quem tem data (data já é cobrada pela data)',
  r.familias.reduce((s, f) => s + f.n, 0), r.sem_data.length);

// ————— 3. família e sinal, unidade a unidade —————
console.log('\n3. A DERIVAÇÃO DA FAMÍLIA (o corte no primeiro travessão, dois-pontos ou parêntese)');
igual('corta no travessão', V.familia('decenal, IBGE — 391 etnias (Censo 2022).'), 'decenal, IBGE');
igual('corta nos dois-pontos quando eles vêm antes',
  V.familia('NAO e numero, e cargo de pessoa VIVA: o verbete afirma — e muda no DOU.'),
  'NAO e numero, e cargo de pessoa VIVA');
igual('corta no parêntese, o caso do verbete QUILOMBOLA',
  V.familia('decenal, IBGE (Censo 2022, 1.327.802 quilombolas — primeira contagem) + DOU.'),
  'decenal, IBGE');
igual('acento e caixa não separam duas regras que dizem o mesmo',
  V.normalizar('Decenal, IBGE'), V.normalizar('decenal, ibge'));
igual('o sinal pode ser mais de um', V.sinaisDe('acompanhar STF/DOU — RE 1.017.365'), ['DOU', 'STF']);
igual('regra sem órgão conhecido não inventa sinal', V.sinaisDe('reconferir com a comunidade'), []);

// ————— 4. a data, sem tolerância —————
console.log('\n4. A DATA (parse estrito, com round-trip)');
conferir('2026-02-30 NÃO é data (o construtor do JS a aceitaria como 2 de março)',
  V.parseData('2026-02-30') === null);
conferir('2026-02-28 é data', V.parseData('2026-02-28') !== null);
conferir('2028-02-29 é data (ano bissexto)', V.parseData('2028-02-29') !== null);
conferir('2027-02-29 NÃO é data (2027 não é bissexto)', V.parseData('2027-02-29') === null);
conferir('"01/10/2026" não é data (só ISO entra)', V.parseData('01/10/2026') === null);
conferir('"2026-10-1" não é data (mês e dia com dois dígitos)', V.parseData('2026-10-1') === null);
conferir('null não é data', V.parseData(null) === null);
igual('a diferença é em dias inteiros, em UTC',
  V.diasEntre(V.parseData('2026-08-22'), V.parseData('2026-10-21')), 60);

// ————— 5. os códigos de saída, pelo PROGRAMA —————
console.log('\n5. OS EXIT CODES (o vigia rodado como comando, que é como a rotina o usa)');
const eBase = rodar(['--dir', dirBase, '--hoje', HOJE]);
igual('há vencido → exit 1', eBase.code, 1);
conferir('e o terminal nomeia as chaves vencidas',
  eBase.out.indexOf('VENCIDO-ONTEM') >= 0 && eBase.out.indexOf('VENCIDO-ANTIGO') >= 0);

const eLimpo = rodar(['--dir', dirLimpo, '--hoje', HOJE]);
igual('sem vencido → exit 0', eLimpo.code, 0);
conferir('e ele ainda avisa do que entra na janela',
  eLimpo.out.indexOf('VENCE EM ATÉ 60 DIAS — 3') >= 0, eLimpo.out.slice(0, 400));

const eInv = rodar(['--dir', dirInvalida, '--hoje', HOJE]);
igual('data inválida → exit 2 (RECUSADO), nunca 0', eInv.code, 2);
conferir('e ele diz que está CEGO, não que está tudo bem',
  (eInv.out + eInv.err).indexOf('RECUSADO') >= 0);

const eOrfa = rodar(['--dir', dirOrfa, '--hoje', HOJE]);
igual('vence_em sem vence_regra (data órfã) → exit 2', eOrfa.code, 2);
conferir('e o motivo é nomeado como data órfã',
  eOrfa.out.indexOf('data órfã') >= 0, eOrfa.out.slice(0, 600));

const eJanela = rodar(['--dir', dirLimpo, '--hoje', HOJE, '--janela', '58']);
conferir('--janela aperta a janela: com 58, o de 59 dias sai dela',
  eJanela.code === 0 && eJanela.out.indexOf('VENCE EM ATÉ 58 DIAS — 1') >= 0,
  'code=' + eJanela.code);

const eHojeRuim = rodar(['--dir', dirLimpo, '--hoje', 'ontem']);
igual('--hoje que não é data → exit 2, e não uma data silenciosamente inventada', eHojeRuim.code, 2);

// ————— 6. o --json —————
console.log('\n6. O --json (para a tarefa mensal, que é máquina)');
const eJson = rodar(['--dir', dirBase, '--hoje', HOJE, '--json']);
igual('o exit code do --json é o mesmo do modo humano', eJson.code, 1);
let j = null;
try { j = JSON.parse(eJson.out); } catch (e) { /* fica null e o teste abaixo reprova */ }
conferir('o stdout é JSON puro — nada de cabeçalho amigável no meio', j !== null,
  eJson.out.slice(0, 200));
if (j) {
  igual('o JSON traz as mesmas 3 vencidas', j.vencido.map((i) => i.chave),
    r.vencido.map((i) => i.chave));
  conferir('e a regra vai INTEIRA no JSON, sem reticência (é de lá que se copia)',
    j.vencido.every((i) => i.vence_regra.indexOf('…') < 0));
}

// ————— 7. o corpus DE VERDADE: só o que é estrutural —————
console.log('\n7. O ACERVO REAL (só invariantes de esquema — contagem de conteúdo não se crava)');
const real = V.lerDoDisco().linhas;
const comData = real.filter((l) => l.vence_em);
const orfas = comData.filter((l) => !l.vence_regra);
const datasRuins = comData.filter((l) => V.parseData(String(l.vence_em)) === null);
igual('nenhuma data órfã no acervo (vence_em sempre com vence_regra)',
  orfas.map((l) => l.chave), []);
igual('toda vence_em do acervo é uma data YYYY-MM-DD válida',
  datasRuins.map((l) => l.chave), []);
conferir('o acervo tem validade declarada em pelo menos uma linha (senão o vigia é decoração)',
  real.filter((l) => l.vence_em || l.vence_regra).length > 0);
console.log('       (medido agora: ' + real.filter((l) => l.vence_em || l.vence_regra).length
  + ' linha(s) com validade, ' + comData.length + ' datada(s), de ' + real.length + ')');

// ————— 8. O CONTROLE: o portão visto DEIXANDO PASSAR quando estragado —————
//
// Cada defeito é um par (trecho exato -> substituto). Se o trecho não for achado, o controle
// PARA: quer dizer que o vigia mudou de forma e este arquivo envelheceu — e um controle que
// "não acha o defeito" e passa é a decoração que ele existe para denunciar.
console.log('\n8. O CONTROLE (EQUIPE.md 2.8 — o defeito injetado, visto passando)');
const fonte = fs.readFileSync(VIGIA, 'utf8');
const DEFEITOS = [
  {
    id: 'a comparação de vencido some (dias < 0 nunca é verdade)',
    par: ['      if (item.dias < 0) r.vencido.push(item);',
      '      if (false && item.dias < 0) r.vencido.push(item);'],
    dir: () => dirBase,
    esperado: (e) => e.code !== 1 && e.out.indexOf('VENCIDO — 0') >= 0,
    porque: 'a cópia estragada tem de dizer "VENCIDO — 0" com 3 vencidos na frente',
  },
  {
    id: 'o round-trip da data some (2026-02-30 vira 2 de março e passa)',
    par: ['  if (v.getUTCFullYear() !== a || v.getUTCMonth() !== mes - 1 || v.getUTCDate() !== d) return null;',
      '  if (false) return null;'],
    dir: () => dirInvalida,
    esperado: (e) => e.code !== 2,
    porque: 'sem o round-trip, o 30 de fevereiro deixa de ser recusa',
  },
  {
    id: 'a trava da data órfã some (vence_em sem vence_regra passa batido)',
    par: ['    if (temData && !temRegra) {', '    if (false && temData && !temRegra) {'],
    dir: () => dirOrfa,
    esperado: (e) => e.code !== 2,
    porque: 'sem a trava, a data sem regra vira só mais um item datado',
  },
];

const COPIA = path.join(__dirname, 'tmp-vigia-defeito.js');
for (const d of DEFEITOS) {
  if (fonte.indexOf(d.par[0]) < 0) {
    console.log('  PARA · o trecho de "' + d.id + '" não existe mais no vigia.');
    console.log('         Este controle envelheceu; atualize o par antes de confiar no verde.');
    falhas++;
    continue;
  }
  // A cópia mora em test/, então o require de irmão precisa apontar para ferramentas/.
  const estragado = fonte.split(d.par[0]).join(d.par[1])
    .split("require('./conteudo-puxar.js')").join("require('../ferramentas/conteudo-puxar.js')");
  fs.writeFileSync(COPIA, estragado, 'utf8');
  let e;
  try {
    e = execFileSync(process.execPath, [COPIA, '--dir', d.dir(), '--hoje', HOJE],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    e = { code: 0, out: e };
  } catch (err) {
    e = { code: err.status == null ? -1 : err.status, out: String(err.stdout || '') };
  }
  conferir('estraguei: ' + d.id + ' → a cópia DEIXA PASSAR (exit ' + e.code + ')',
    d.esperado(e), d.porque);
}
fs.rmSync(COPIA, { force: true });

// e o contraprova: o vigia INTEIRO, nos mesmos três fixtures, continua mordendo.
conferir('e o vigia inteiro, nos mesmos fixtures, morde: 1 / 2 / 2',
  rodar(['--dir', dirBase, '--hoje', HOJE]).code === 1
  && rodar(['--dir', dirInvalida, '--hoje', HOJE]).code === 2
  && rodar(['--dir', dirOrfa, '--hoje', HOJE]).code === 2);

// ————————————————————————————————————————————————————————————————————————
limpar();
console.log('\n' + ok + ' verde(s), ' + falhas + ' falha(s).');
if (falhas) {
  console.error('TESTE DO VIGIA REPROVOU — ' + falhas + ' falha(s).');
  process.exit(1);
}
console.log('TESTE DO VIGIA OK — as bordas medidas e o portão visto deixando passar quando estragado.');
process.exit(0);
