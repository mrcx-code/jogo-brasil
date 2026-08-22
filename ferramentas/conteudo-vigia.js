// AVENIDA A — O VIGIA DE VALIDADE: "quando isto vence?", respondido por comando.
//
// O QUE ISTO FAZ, EM UMA LINHA: lê os JSON versionados de `ferramentas/conteudo/` e devolve,
// POR URGÊNCIA, tudo o que o acervo afirma e que tem prazo — o que já venceu, o que vence na
// janela, o que está datado e longe, e o que não tem data mas tem REGRA.
//
// POR QUE ELE EXISTE. O alvo dito pelo dono em 19/08 é "evolução ano a ano", e o §8 do
// CLAUDE.md transformou isso em requisito técnico: *cada coisa que o jogo afirma passa a
// precisar responder "quando isto vence?"*. Em 21/08 o historiador respondeu a pergunta para
// 20 verbetes (`vence_em` + `vence_regra`) e o dono ligou o alerta. Em 22/08 a fase 1 da
// Avenida A tirou esse dado de dentro do banco e o pôs em arquivo versionado. Faltava a
// terceira perna: alguém OLHAR. Item recorrente no PENDENTES (nº 45) e uma tarefa mensal
// agendada (`alerta-validade-brasil`, dia 1, 9h13) dependiam, os dois, de uma pessoa lembrar
// de quais verbetes conferir — e "lembrar" é o mecanismo que o resto deste repositório passou
// meses substituindo por portão.
//
// ELE É OFFLINE, E ISSO É DECISÃO, NÃO PREGUIÇA. A verdade que ele lê é a VERSIONADA: os
// arquivos que passaram por `npm run conteudo:puxar`, por um `git diff` lido por um humano e
// por um commit. Ler o banco direto daria a resposta de hoje sobre linhas que ninguém revisou
// — e faria este script quebrar quando o projeto estivesse fora do ar, quando a chave girasse
// ou num runner sem saída. Quem responde "o disco ainda é o que o banco diz?" já existe e é
// outro comando: `node ferramentas/conteudo-puxar.js --conferir`. Um script, uma pergunta.
//
// ELE NÃO CORRIGE NADA, e a fronteira é a do squad ACERVO: quem muda o TEXTO é o historiador
// (licença do §2, com as três condições de lugar de fala); quem aplica a rev+1 no banco é o
// plantão, via MCP. Este arquivo só aponta. Apontar é o trabalho inteiro dele.
//
// COMO USAR
//   npm run conteudo:vigia                              # relógio do sistema
//   npm run conteudo:vigia -- --hoje 2026-10-05         # determinístico (é assim que se testa)
//   node ferramentas/conteudo-vigia.js --json           # para máquina; nada mais no stdout
//   node ferramentas/conteudo-vigia.js --janela 30      # aperta a janela de aviso (padrão 60)
//   node ferramentas/conteudo-vigia.js --dir <pasta>    # outra pasta de JSON (os fixtures do teste)
//
// OS CÓDIGOS DE SAÍDA, e o 2 é de propósito:
//   0  nada vencido, nada malformado. É o silêncio que a rotina espera.
//   1  HÁ VENCIDO. É o portão em potencial — o dia em que o CI cobrar isto, é este exit.
//   2  RECUSADO: o vigia não consegue vigiar. `vence_em` que não é data, ou `vence_em` SEM
//      `vence_regra` (a data órfã). Dois erros que, tratados como "nada vencido", fariam o
//      alerta ficar verde exatamente sobre a linha que ele existe para pegar. Silêncio por
//      dado quebrado é o pior resultado possível para um vigia, então ele grita num código
//      diferente do vencido — quem chama sabe distinguir "tem trabalho" de "o instrumento
//      está cego".
'use strict';

const fs = require('fs');
const path = require('path');

// Os nomes de arquivo, as colunas e a chave natural de cada tabela saem de UM lugar só, que é
// o mesmo que escreve os arquivos. Duplicar a lista aqui seria criar a segunda verdade que a
// fase 0 inteira existiu para impedir.
const { TABELAS, DESTINO } = require('./conteudo-puxar.js');

const RAIZ = path.resolve(__dirname, '..');

// A janela de aviso. 60 dias não é número mágico: as três fontes datadas do acervo hoje
// (PRODES ~outubro, RAD do MapBiomas ~maio, decisão da UNESCO em dezembro) publicam dentro de
// um mês da data prevista, e a tarefa mensal roda no dia 1 — então dois meses de antecedência
// garantem que o item apareça em PELO MENOS duas execuções antes de virar vencido. Uma janela
// de 30 daria uma só, e uma execução perdida (app fechado, máquina desligada) viraria vencido
// sem aviso nenhum.
const JANELA_PADRAO = 60;

// ————— 1. DATA, sem tolerância —————
//
// `Date.parse('2026-02-30')` não existe em ISO estrito, mas o construtor do JS é criativo com
// entrada quase certa e devolveria 2 de março sem reclamar. Aqui a data é lida no braço e
// CONFERIDA de volta: se os três números não voltarem iguais, não é data.
function parseData(s) {
  if (typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const a = Number(m[1]), mes = Number(m[2]), d = Number(m[3]);
  const t = Date.UTC(a, mes - 1, d);
  const v = new Date(t);
  // O round-trip é o teste: 2026-02-30 vira 2 de março e o dia deixa de bater.
  if (v.getUTCFullYear() !== a || v.getUTCMonth() !== mes - 1 || v.getUTCDate() !== d) return null;
  return t;
}

// Tudo em UTC de meia-noite, então a diferença é sempre múltiplo exato de um dia — nenhum
// horário de verão entra na conta e "59 dias" quer dizer 59 dias em qualquer máquina.
function diasEntre(deMs, ateMs) {
  return Math.round((ateMs - deMs) / 86400000);
}

// A data de hoje pelo relógio LOCAL (é o "hoje" da pessoa que roda), escrita em ISO para
// atravessar o resto do script como texto e ser reparseada pela mesma função de cima.
function hojeLocalISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

// ————— 2. ONDE SE CONFERE — a lista de sinais é DECLARADA, e o resto fica visível —————
//
// A tentação era classificar a regra por uma lista fixa de famílias ("decenal-IBGE",
// "acompanhar-DOU"). Não: uma taxonomia escrita à mão sobre um corpus que o historiador
// edita fica velha em silêncio, e o item novo cai numa gaveta "outros" que ninguém abre.
//
// Então são DUAS classificações, e cada uma responde a uma pergunta diferente:
//   · A FAMÍLIA é DERIVADA do texto da regra (o trecho antes do travessão ou dos dois-pontos).
//     Ela não pode envelhecer porque não é escrita aqui — ela é a própria regra, resumida.
//   · O SINAL é declarado, e é a lista abaixo: qual órgão/publicação a pessoa vai abrir.
//     É o que a tarefa mensal precisa saber ("este mês eu confiro INPE ou IBGE?"). Regra que
//     não bate com nenhum sinal NÃO some: aparece como `(sem sinal reconhecido)`, que é o
//     convite para acrescentar um sinal aqui — visível, e não uma gaveta.
const SINAIS = [
  { nome: 'IBGE', re: /\bIBGE\b|\bCenso\b/i },
  { nome: 'INPE', re: /\bINPE\b|\bPRODES\b/i },
  { nome: 'MapBiomas', re: /\bMapBiomas\b|\bRAD\b/i },
  { nome: 'DOU', re: /\bDOU\b|\bDi[áa]rio Oficial\b/i },
  { nome: 'STF', re: /\bSTF\b/i },
  { nome: 'INCRA', re: /\bINCRA\b/i },
  { nome: 'UNESCO', re: /\bUNESCO\b/i },
];

function sinaisDe(regra) {
  const s = String(regra || '');
  return SINAIS.filter((x) => x.re.test(s)).map((x) => x.nome);
}

// Acento e caixa não podem separar duas linhas que dizem a mesma regra; o texto do banco vem
// ora acentuado, ora não (o parecer de 21/08 entrou em ASCII).
function normalizar(s) {
  return String(s)
    // A faixa é comparada por CÓDIGO, e não escrita como uma classe de caractere: marca
    // combinante num arquivo-fonte é invisível, e a primeira ferramenta que normalizar o
    // arquivo apaga a classe inteira — a normalização passaria a não normalizar, em silêncio,
    // e o agrupamento por família se partiria em dois grupos idênticos aos olhos.
    .normalize('NFD').split('').filter((c) => {
      const n = c.charCodeAt(0);
      return n < 0x300 || n > 0x36f;   // 0300-036F: as marcas combinantes
    }).join('')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

// A família: o que vem ANTES do primeiro travessão OU dos primeiros dois-pontos, o que vier
// primeiro. É onde a regra diz o seu tipo ("decenal, IBGE", "acompanhar DOU", "~outubro,
// INPE") antes de explicar o caso. Sem o corte nos dois-pontos, a regra do verbete SÔNIA
// GUAJAJARA (que abre com "NAO e numero, e cargo de pessoa VIVA:" e só usa travessão no fim)
// viraria uma família de 200 caracteres, própria dela, e o agrupamento não agruparia nada.
function familia(regra) {
  const s = String(regra || '').trim();
  if (!s) return '(sem regra)';
  let corte = s.length;
  // O parêntese entra na lista de marcas por um caso real e medido: a regra do verbete
  // QUILOMBOLA é "decenal, IBGE (Censo 2022, 1.327.802 quilombolas — primeira contagem) +
  // acompanhar DOU para titulacoes." — o primeiro travessão está DENTRO do parêntese, e cortar
  // por ele dava a família "decenal, IBGE (Censo 2022, 1.327.802 quilombolas", uma família de
  // um membro só, separada dos outros nove "decenal, IBGE" que dizem exatamente a mesma coisa.
  // O "+ acompanhar DOU" que se perde no rótulo não se perde no relatório: o eixo dos SINAIS
  // continua marcando DOU nessa linha, que é o outro lugar onde o plantão a procura.
  for (const marca of ['—', ' - ', ':', ';', '(']) {
    const i = s.indexOf(marca);
    if (i > 0 && i < corte) corte = i;
  }
  let p = s.slice(0, corte).trim().replace(/[.,;]+$/, '');
  // Teto de segurança: regra sem nenhuma marca vira uma família só dela, o que é ruído. Cortar
  // e marcar com reticência deixa visível que foi cortado, em vez de fingir que era curta.
  if (p.length > 70) p = p.slice(0, 70).trim() + '…';
  return p;
}

// ————— 3. LER OS ARQUIVOS —————
//
// A pasta é parâmetro para que o teste possa apontar para fixtures. O padrão é a verdade
// versionada, e é ela que a rotina lê.
function lerDoDisco(dir) {
  const base = dir ? path.resolve(dir) : DESTINO;
  const linhas = [];
  const contagem = {};
  for (const tab of TABELAS) {
    const alvo = path.join(base, tab.arquivo);
    if (!fs.existsSync(alvo)) {
      throw new Error('falta ' + alvo.split(path.sep).join('/')
        + ' — rode `npm run conteudo:puxar` primeiro.');
    }
    const corpo = JSON.parse(fs.readFileSync(alvo, 'utf8'));
    if (!corpo || !Array.isArray(corpo.linhas)) {
      throw new Error(tab.arquivo + ': não tem a lista `linhas`.');
    }
    contagem[tab.nome] = corpo.linhas.length;
    for (const l of corpo.linhas) {
      linhas.push({
        tabela: tab.nome,
        // A identidade legível: `chave` nos dois primeiros, `termo → relacionado` nos pares.
        // Sai da mesma `chaveOrdem` que ordena o arquivo, então nunca desencontra dele.
        chave: tab.chaveOrdem.map((c) => String(l[c] == null ? '' : l[c])).join(' → '),
        vence_em: l.vence_em == null ? null : l.vence_em,
        vence_regra: l.vence_regra == null ? null : l.vence_regra,
        vigente_ate: l.vigente_ate == null ? null : l.vigente_ate,
      });
    }
  }
  return { linhas, contagem, base };
}

// ————— 4. A CLASSIFICAÇÃO —————
//
// Uma linha só cai numa categoria, e as bordas estão escritas aqui em vez de espalhadas:
//   dias < 0      VENCIDO
//   0 ≤ dias ≤ J  vence na janela (o dia de hoje conta como "vence hoje", não como vencido —
//                 uma nota publicada HOJE ainda está válida hoje)
//   dias > J      datado, ainda longe
//   sem data      sem data, com regra
function classificar(linhas, opts) {
  const o = opts || {};
  const janela = o.janela == null ? JANELA_PADRAO : Number(o.janela);
  const hojeISO = o.hoje || hojeLocalISO();
  const hojeMs = parseData(hojeISO);
  if (hojeMs == null) throw new Error('--hoje precisa ser YYYY-MM-DD (recebi ' + JSON.stringify(hojeISO) + ')');
  if (!Number.isFinite(janela) || janela < 0) throw new Error('--janela precisa ser um número de dias >= 0');

  const r = {
    hoje: hojeISO, janela: janela,
    total_linhas: linhas.length, total_com_validade: 0, fechadas_ignoradas: 0,
    recusas: [], vencido: [], janela_aviso: [], futuro: [], sem_data: [],
    familias: [], por_sinal: {},
  };

  for (const l of linhas) {
    // Linha fechada não devia estar no arquivo (o puxão filtra `vigente_ate is null`), mas se
    // estiver, ela é histórico e não vence — contar seria alarme falso. Fica no contador para
    // não sumir em silêncio.
    if (l.vigente_ate != null) { r.fechadas_ignoradas++; continue; }
    const temData = l.vence_em != null && String(l.vence_em) !== '';
    const temRegra = l.vence_regra != null && String(l.vence_regra).trim() !== '';
    if (!temData && !temRegra) continue;
    r.total_com_validade++;

    const item = {
      tabela: l.tabela, chave: l.chave,
      vence_em: temData ? String(l.vence_em) : null,
      vence_regra: temRegra ? String(l.vence_regra) : null,
      familia: temRegra ? familia(l.vence_regra) : '(sem regra)',
      sinais: sinaisDe(l.vence_regra),
      dias: null,
    };

    // A DATA ÓRFÃ. Regra do papel, e ela é do dono do esquema: "vence_em sem vence_regra é
    // data órfã — a regra em PALAVRAS é o que torna o alerta executável no ano seguinte".
    // Uma data sem a frase que diz ONDE conferir chega em outubro de 2027 sem dizer a ninguém
    // o que abrir; é um alarme que toca sem endereço.
    if (temData && !temRegra) {
      r.recusas.push(Object.assign({ motivo: 'vence_em SEM vence_regra (data órfã)' }, item));
      continue;
    }
    if (temData) {
      const ms = parseData(String(l.vence_em));
      if (ms == null) {
        r.recusas.push(Object.assign({ motivo: 'vence_em não é uma data YYYY-MM-DD válida' }, item));
        continue;
      }
      item.dias = diasEntre(hojeMs, ms);
      if (item.dias < 0) r.vencido.push(item);
      else if (item.dias <= janela) r.janela_aviso.push(item);
      else r.futuro.push(item);
    } else {
      r.sem_data.push(item);
    }
  }

  const porDia = (a, b) => (a.dias - b.dias) || (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0);
  r.vencido.sort(porDia);
  r.janela_aviso.sort(porDia);
  r.futuro.sort(porDia);
  r.sem_data.sort((a, b) => (a.familia < b.familia ? -1 : a.familia > b.familia ? 1
    : a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0));

  // As famílias agrupam SÓ o que não tem data: quem tem data já é cobrado pela data, e
  // misturar os dois faria o grupo "decenal, IBGE" parecer uma pendência de calendário.
  const mapa = new Map();
  for (const it of r.sem_data) {
    const k = normalizar(it.familia);
    if (!mapa.has(k)) mapa.set(k, { familia: it.familia, sinais: [], n: 0, chaves: [] });
    const f = mapa.get(k);
    f.n++;
    f.chaves.push(it.chave);
    for (const s of it.sinais) if (f.sinais.indexOf(s) < 0) f.sinais.push(s);
  }
  r.familias = Array.from(mapa.values()).sort((a, b) => (b.n - a.n)
    || (a.familia < b.familia ? -1 : a.familia > b.familia ? 1 : 0));

  // O rollup por sinal conta TODAS as linhas com validade — é a pergunta da tarefa mensal
  // ("o que eu abro este mês?"), e ela não distingue datada de não datada.
  const todas = r.vencido.concat(r.janela_aviso, r.futuro, r.sem_data);
  for (const it of todas) {
    const chaves = it.sinais.length ? it.sinais : ['(sem sinal reconhecido)'];
    for (const s of chaves) r.por_sinal[s] = (r.por_sinal[s] || 0) + 1;
  }

  return r;
}

// ————— 5. A SAÍDA DE TERMINAL —————
function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

// A regra vai truncada no terminal (ela tem 200 caracteres e o terminal não é o lugar de
// lê-la inteira) — mas nunca no `--json`, que é de onde se copia.
function curta(s, n) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1).trim() + '…';
}

function linhaItem(it) {
  const quando = it.vence_em
    ? it.vence_em + '  ' + (it.dias < 0 ? 'há ' + (-it.dias) + ' dia(s)'
      : it.dias === 0 ? 'HOJE' : 'em ' + it.dias + ' dia(s)')
    : 'sem data';
  return '  · ' + pad(it.chave, 24) + ' ' + pad(quando, 26) + ' [' + it.tabela + ']';
}

function imprimir(r, base, contagem) {
  const rel = path.relative(RAIZ, base).split(path.sep).join('/') || base;
  console.log('VIGIA DE VALIDADE — ' + rel + ' (offline: a verdade versionada, nunca a rede)');
  console.log('hoje: ' + r.hoje + '  ·  janela de aviso: ' + r.janela + ' dias');
  const tot = Object.keys(contagem).map((k) => contagem[k] + ' ' + k).join(' · ');
  console.log(r.total_com_validade + ' linha(s) com validade, de ' + r.total_linhas + ' vigentes (' + tot + ')');
  if (r.fechadas_ignoradas) console.log('(' + r.fechadas_ignoradas + ' linha(s) fechadas ignoradas — vigente_ate não é null)');
  console.log('');

  if (r.recusas.length) {
    console.log('RECUSADO — ' + r.recusas.length + ' linha(s) que o vigia não consegue vigiar:');
    for (const it of r.recusas) {
      console.log('  · ' + pad(it.chave, 24) + ' ' + it.motivo + ' [' + it.tabela + ']');
      console.log('      vence_em=' + JSON.stringify(it.vence_em) + '  vence_regra=' + JSON.stringify(curta(it.vence_regra, 60)));
    }
    console.log('    Conserto: a validade entra com os DOIS campos, ou não entra. Quem escreve a');
    console.log('    regra é o historiador; quem aplica a rev+1 no banco é o plantão, via MCP.');
    console.log('');
  }

  console.log('VENCIDO — ' + r.vencido.length + (r.vencido.length ? '' : '  (nada)'));
  for (const it of r.vencido) {
    console.log(linhaItem(it));
    console.log('      ' + curta(it.vence_regra, 150));
  }
  console.log('');

  console.log('VENCE EM ATÉ ' + r.janela + ' DIAS — ' + r.janela_aviso.length + (r.janela_aviso.length ? '' : '  (nada)'));
  for (const it of r.janela_aviso) {
    console.log(linhaItem(it));
    console.log('      ' + curta(it.vence_regra, 150));
  }
  console.log('');

  console.log('DATADO, AINDA LONGE — ' + r.futuro.length + (r.futuro.length ? '' : '  (nada)'));
  for (const it of r.futuro) console.log(linhaItem(it));
  console.log('');

  console.log('SEM DATA, COM REGRA — ' + r.sem_data.length
    + '   (a regra é o que torna o alerta executável; agrupada pelo que ela diz)');
  for (const f of r.familias) {
    console.log('  ' + pad(curta(f.familia, 46), 46) + ' ' + String(f.n).padStart(2) + '   '
      + (f.sinais.length ? f.sinais.join(', ') : '(sem sinal reconhecido)'));
    console.log('      ' + curta(f.chaves.join(', '), 150));
  }
  console.log('');

  const sinais = Object.keys(r.por_sinal).sort((a, b) => (r.por_sinal[b] - r.por_sinal[a]) || (a < b ? -1 : 1));
  console.log('ONDE SE CONFERE — o que abrir (uma linha pode citar mais de um)');
  for (const s of sinais) console.log('  ' + pad(s, 24) + String(r.por_sinal[s]).padStart(3));
  console.log('');
}

// ————— 6. Linha de comando —————
function arg(nome) {
  const i = process.argv.indexOf(nome);
  return i < 0 ? null : (process.argv[i + 1] || '');
}
const tem = (nome) => process.argv.indexOf(nome) >= 0;

function principal() {
  if (tem('--ajuda') || tem('-h')) {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n')
      .filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
    return 0;
  }

  const dir = arg('--dir');
  const { linhas, contagem, base } = lerDoDisco(dir);
  const r = classificar(linhas, { hoje: arg('--hoje'), janela: arg('--janela') });

  if (tem('--json')) {
    // Só o JSON no stdout: quem consome é máquina, e um cabeçalho amigável no meio quebraria
    // o parse de quem chamar isto de dentro da tarefa mensal.
    process.stdout.write(JSON.stringify(Object.assign({ pasta: base }, r), null, 2) + '\n');
  } else {
    imprimir(r, base, contagem);
  }

  if (r.recusas.length) {
    if (!tem('--json')) {
      console.error('exit 2 — RECUSADO: ' + r.recusas.length + ' linha(s) com validade malformada.');
      console.error('  O vigia está CEGO sobre elas. Isto não é "nada vencido".');
    }
    return 2;
  }
  if (r.vencido.length) {
    if (!tem('--json')) {
      console.error('exit 1 — ' + r.vencido.length + ' afirmação(ões) VENCIDA(S) no ar.');
      console.error('  O texto é do historiador; a rev+1 no banco é do plantão, via MCP.');
      console.error('  O roteiro está em ferramentas/conteudo/VIGIA.md.');
    }
    return 1;
  }
  if (!tem('--json')) {
    console.log('exit 0 — nada vencido' + (r.janela_aviso.length
      ? ', mas ' + r.janela_aviso.length + ' entra(m) na janela de ' + r.janela + ' dias.' : '.'));
  }
  return 0;
}

module.exports = {
  parseData, diasEntre, familia, sinaisDe, normalizar,
  lerDoDisco, classificar, SINAIS, JANELA_PADRAO,
};

if (require.main === module) {
  try {
    process.exit(principal());
  } catch (e) {
    console.error(e && e.stack || e);
    process.exit(2);
  }
}
