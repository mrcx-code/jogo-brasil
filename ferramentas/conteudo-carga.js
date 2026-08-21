// AVENIDA A, FASE 0 — A CARGA INICIAL DO GLOSSÁRIO.
//
// Extrai o glossário DO JOGO RODANDO (headless, por http — nunca `file://`, lição 2.7) e emite
// `ferramentas/conteudo-carga.sql`: os INSERTs que enchem as três tabelas de
// `ferramentas/conteudo-esquema.sql` com o texto que o jogo hoje afirma.
//
// A REGRA DE OURO DA FRONTEIRA, e ela é a razão de esta ferramenta existir em vez de alguém
// digitar o SQL: quando uma ferramenta precisa de dado do jogo, ela RODA O JOGO E EXTRAI.
// Redigitar 181 verbetes com fonte à mão é como se inventa geografia sem perceber — e aqui
// seria pior, porque o texto é histórico e tem fonte citada.
//
// UMA DEFINIÇÃO SÓ DA FORMA CANÔNICA: a extração e a canonização vêm de
// `conteudo-espelho.js`, que é o portão. Se a carga tivesse a própria cópia da regra, as duas
// poderiam divergir — que é exatamente o defeito que a fase 0 inteira existe para impedir.
//
//   node ferramentas/conteudo-carga.js            # gera o SQL e imprime as contagens
//   node ferramentas/conteudo-carga.js --seco     # só confere e conta, não escreve
//
// O QUE A CARGA NÃO DECIDE, e é decisão consciente:
//   · `tag_s2` sai FALSE em tudo. Marcar o que toca o §2 do CLAUDE.md é leitura de
//     representação, e representação não se adivinha por regex — é do historiador, e o §2 diz
//     que na dúvida se para. Um script que chutasse isso estaria dando um parecer.
//   · `vence_em` sai NULL em tudo. A data em que um texto precisa ser reconferido depende da
//     fonte dele (o PRODES sai todo outubro; um verbete de 1570 não vence), e ninguém aprovou
//     data nenhuma ainda. Coluna vazia é honesta; data inventada liga alarme falso para sempre.
//   · `tem_numero` sai calculado, porque é MECÂNICO: "a definição contém dígito". Não é juízo
//     sobre o conteúdo, é triagem de o que pode envelhecer.
const path = require('path');
const fs = require('fs');
const espelho = require('./conteudo-espelho.js');

const RAIZ = path.resolve(__dirname, '..');
const SAIDA = path.join(RAIZ, 'ferramentas', 'conteudo-carga.sql');
const APROVADOR = 'carga-inicial-21/08';
const SECO = process.argv.indexOf('--seco') >= 0;

// ————— A ESCAPADA, e por que não é `replace(/'/g, "''")` —————
//
// O texto histórico é cheio de apóstrofo e de aspas curvas, e um verbete traz citação dentro de
// citação. Duplicar aspas simples funciona, mas transforma o SQL num campo minado ilegível e
// erra na primeira vez que alguém editar o arquivo à mão. O dólar-quoting do Postgres não tem
// esse problema: nada dentro do corpo é interpretado.
//
// A ARMADILHA DO DÓLAR-QUOTING, que é sutil e por isso está conferida aqui: se o texto TERMINA
// em `$`, o corpo colado ao terminador forma o delimitador cedo demais e o Postgres fecha a
// string comendo o último caractere. Por isso o teste não é "o texto contém o delimitador" e
// sim "a PRIMEIRA ocorrência do delimitador em texto+delimitador está no fim" — que pega os
// dois casos de uma vez.
function escolherTag(textos) {
  for (const tag of ['$b$', '$b1$', '$b2$', '$txt$', '$brasil$']) {
    if (textos.every((t) => (t + tag).indexOf(tag) === t.length)) return tag;
  }
  throw new Error('nenhum delimitador de dólar-quoting é seguro para este texto');
}
let TAG = '$b$';
const dq = (s) => TAG + String(s == null ? '' : s) + TAG;
const bool = (b) => (b ? 'true' : 'false');
const nulo = (s) => (s == null ? 'null' : dq(s));
// MECÂNICO, não juízo: a definição afirma um dígito?
const temNumero = (s) => /[0-9]/.test(String(s || ''));

// ————— A IDA E VOLTA — a prova de que o SQL carrega o texto do jogo —————
//
// Não há Postgres nesta máquina, e "o SQL parece certo" não é medida. Então o gerador LÊ DE
// VOLTA o arquivo que acabou de escrever, remonta as três tabelas a partir dos VALUES e compara
// com o glossário do jogo pelo MESMO comparador do portão. Se um apóstrofo, um dólar ou uma
// quebra de linha estragarem um verbete, isto acusa aqui — antes de o texto entrar num banco de
// onde não se apaga (a tabela não tem DELETE, de propósito).
//
// O analisador é pequeno porque só precisa entender O QUE ESTE ARQUIVO EMITE: tokens são ou
// dólar-quoted, ou `true`/`false`/`null`/`now()`, ou número.
function destokenizar(linha) {
  const fora = []; let i = 0;
  while (i < linha.length) {
    while (linha[i] === ' ' || linha[i] === ',') i++;
    if (i >= linha.length) break;
    if (linha.startsWith(TAG, i)) {
      const fim = linha.indexOf(TAG, i + TAG.length);
      if (fim < 0) throw new Error('string aberta no SQL: ' + linha.slice(i, i + 60));
      fora.push({ txt: linha.slice(i + TAG.length, fim) });
      i = fim + TAG.length;
    } else {
      let j = i; let prof = 0;
      while (j < linha.length && (prof > 0 || linha[j] !== ',')) {
        if (linha[j] === '(') prof++; if (linha[j] === ')') prof--;
        j++;
      }
      fora.push({ cru: linha.slice(i, j).trim() });
      i = j;
    }
  }
  return fora;
}
function conferirIdaEVolta(sql, A) {
  const tabelas = { conteudo_glossario_grupo: [], conteudo_glossario: [], conteudo_glossario_rel: [] };
  const re = /insert into public\.(\w+) \(([^)]+)\) values\n([\s\S]*?);\n/g;
  let m;
  while ((m = re.exec(sql))) {
    const cols = m[2].split(',').map((s) => s.trim());
    const corpo = m[3];
    // Cada linha de VALUES começa com "  (" e termina com ")" — as strings podem conter
    // parêntese e vírgula, então corto pelo começo de linha, não por parêntese solto.
    for (const bruta of corpo.split(/,\n(?=  \()/)) {
      const dentro = bruta.trim().replace(/^\(/, '').replace(/\)$/, '');
      const toks = destokenizar(dentro);
      if (toks.length !== cols.length) {
        throw new Error(m[1] + ': linha com ' + toks.length + ' valores para ' + cols.length + ' colunas');
      }
      const linha = {};
      cols.forEach((c, k) => {
        const t = toks[k];
        linha[c] = t.txt !== undefined ? t.txt
          : (t.cru === 'null' ? null : t.cru === 'true' ? true : t.cru === 'false' ? false
            : /^\d+$/.test(t.cru) ? Number(t.cru) : t.cru);
      });
      tabelas[m[1]].push(linha);
    }
  }
  const B = espelho.canonizarBanco({
    grupo: tabelas.conteudo_glossario_grupo,
    glossario: tabelas.conteudo_glossario,
    rel: tabelas.conteudo_glossario_rel,
  });
  const d = espelho.comparar(A, B);
  if (d) throw new Error('IDA E VOLTA QUEBRADA — o SQL não devolve o texto do jogo: ' + d);
  if (espelho.hash(A) !== espelho.hash(B)) throw new Error('IDA E VOLTA: hashes diferentes');
  return B;
}

function lote(linhas, tabela, colunas, tamanho) {
  const fora = [];
  for (let i = 0; i < linhas.length; i += tamanho) {
    fora.push('insert into public.' + tabela + ' (' + colunas.join(', ') + ') values\n'
      + linhas.slice(i, i + tamanho).map((l) => '  (' + l + ')').join(',\n') + ';\n');
  }
  return fora.join('\n');
}

(async () => {
  const cru = await espelho.extrairDoJogo();
  const A = espelho.canonizarJogo(cru);

  // As mesmas conferências do portão, ANTES de emitir uma linha de SQL: reconstrução fiel,
  // chaves únicas, nenhum relacionado órfão. Carga que entra com dado torto obriga a apagar
  // depois — e a tabela não tem DELETE de propósito.
  const erros = espelho.conferir(cru, A);
  if (erros.length) {
    console.error('RECUSADO — o glossário do jogo não fecha consigo mesmo:');
    for (const e of erros) console.error('  · ' + e);
    process.exit(1);
  }

  const verbetes = [].concat(...A.grupos.map((g) => g.verbetes.map((v) => ({ v, g }))));
  TAG = escolherTag([].concat(
    A.grupos.map((g) => g.chave), A.grupos.map((g) => g.g), A.grupos.map((g) => g.curto),
    A.grupos.map((g) => g.sub),
    verbetes.map((x) => x.v.t), verbetes.map((x) => x.v.o), verbetes.map((x) => x.v.d),
    verbetes.map((x) => x.v.f), verbetes.map((x) => x.v.chave),
    A.rel.map((r) => r.termo), A.rel.map((r) => r.relacionado), [APROVADOR]
  ));

  const COMUNS = ['rev', 'estado', 'vence_em', 'vence_regra', 'tag_s2', 'tem_numero',
    'nota', 'revisado_por', 'fonte_revisao', 'aprovado_por', 'aprovado_em'];
  const comuns = (tn) => ['1', dq('publicado'), 'null', 'null', 'false', bool(tn),
    'null', 'null', 'null', dq(APROVADOR), 'now()'].join(', ');

  const sqlGrupos = lote(A.grupos.map((g) => [
    dq(g.chave), dq(g.g), dq(g.curto), dq(g.sub), String(g.ordem), comuns(temNumero(g.sub)),
  ].join(', ')), 'conteudo_glossario_grupo',
  ['chave', 'g', 'curto', 'sub', 'ordem'].concat(COMUNS), 20);

  const sqlVerbetes = lote(verbetes.map(({ v, g }) => [
    dq(v.chave), dq(v.t), dq(v.o), dq(v.d), dq(v.f), bool(v.dv), dq(g.chave), String(v.ordem),
    comuns(temNumero(v.d)),
  ].join(', ')), 'conteudo_glossario',
  ['chave', 't', 'o', 'd', 'f', 'dv', 'grupo_chave', 'ordem'].concat(COMUNS), 20);

  const sqlRel = lote(A.rel.map((r) => [
    dq(r.termo), dq(r.relacionado), String(r.ordem), comuns(false),
  ].join(', ')), 'conteudo_glossario_rel',
  ['termo', 'relacionado', 'ordem'].concat(COMUNS), 100);

  const nVerb = verbetes.length;
  const nComNumero = verbetes.filter((x) => temNumero(x.v.d)).length;
  const nDv = verbetes.filter((x) => x.v.dv).length;
  const nTermosRel = new Set(A.rel.map((r) => r.termo)).size;

  const cab = `-- ============================================================================================
-- CARGA INICIAL DO GLOSSÁRIO — GERADO, NÃO ESCRITO À MÃO.
--
-- Fonte: o GLOSSARIO e o GLOSSARIO_REL do jogo, extraídos do \`index.html\` rodando headless por
-- \`node ferramentas/conteudo-carga.js\`. NÃO EDITE ESTE ARQUIVO: mudança de conteúdo se faz em
-- \`src/jogo.ts\`, e depois se roda o gerador de novo. Editar aqui é criar a segunda verdade que
-- o portão \`ferramentas/conteudo-espelho.js\` existe para caçar.
--
-- Aplique DEPOIS de \`ferramentas/conteudo-esquema.sql\`.
--
-- O QUE ENTRA:  ${nVerb} verbetes · ${A.grupos.length} grupos · ${A.rel.length} pares relacionados (${nTermosRel} termos com relacionados)
-- REV 1, estado 'publicado', aprovado_por '${APROVADOR}'.
-- \`tag_s2\` e \`vence_em\` entram VAZIOS de propósito — quem os preenche é o historiador na aba
-- REVISÃO (fase 2). Script não dá parecer de §2 e não inventa data de validade.
-- \`tem_numero\` está calculado: ${nComNumero} dos ${nVerb} verbetes afirmam algum dígito na definição.
-- \`dv\` (divergência entre fontes / falta de atestação) vem do jogo: ${nDv} verbetes.
--
-- Depois de aplicar, o portão fecha assim:
--   node ferramentas/conteudo-espelho.js --sql-export     # o SELECT do export
--   node ferramentas/conteudo-espelho.js --banco b.json   # exit 0 = jogo e banco idênticos
-- ============================================================================================

begin;

-- Carga é uma vez só. Sem isto, a segunda aplicação bateria no índice único parcial e daria
-- "duplicate key" — verdadeiro, e ilegível. Esta mensagem diz o que fazer.
do $guarda$
begin
  if exists (select 1 from public.conteudo_glossario where vigente_ate is null) then
    raise exception 'JÁ HÁ CONTEÚDO VIGENTE em conteudo_glossario. A carga inicial roda uma vez. Para recarregar, feche as linhas vigentes (update ... set vigente_ate = now()) e rode de novo.';
  end if;
end
$guarda$;

`;

  const rod = `
commit;

-- CONFERÊNCIA — leia os números, não o "ok" (EQUIPE.md §4).
--   select count(*) from public.conteudo_glossario_grupo where vigente_ate is null;  -- ${A.grupos.length}
--   select count(*) from public.conteudo_glossario       where vigente_ate is null;  -- ${nVerb}
--   select count(*) from public.conteudo_glossario_rel   where vigente_ate is null;  -- ${A.rel.length}
--   select count(*) from public.conteudo_glossario where dv;                         -- ${nDv}
`;

  const sql = cab + sqlGrupos + '\n' + sqlVerbetes + '\n' + sqlRel + rod;

  // O delimitador escolhido não pode aparecer no corpo de nenhuma string — já conferido acima,
  // mas conferir o ARQUIVO INTEIRO custa nada e pega erro de montagem, não só de dado.
  const abre = (sql.match(new RegExp('\\' + TAG.split('').join('\\'), 'g')) || []).length;
  if (abre % 2 !== 0) {
    console.error('RECUSADO: número ímpar de delimitadores ' + TAG + ' no SQL — string aberta.');
    process.exit(1);
  }

  const B = conferirIdaEVolta(sql, A);

  if (!SECO) fs.writeFileSync(SAIDA, sql, 'utf8');

  console.log('ida e volta: o SQL relido devolve os ' + B.grupos.reduce((s, g) => s + g.verbetes.length, 0)
    + ' verbetes e ' + B.rel.length + ' pares idênticos ao jogo');
  console.log((SECO ? '(seco, nada escrito) ' : 'ferramentas/conteudo-carga.sql · ')
    + (sql.length / 1024).toFixed(0) + ' KB · delimitador ' + TAG);
  console.log('  ' + A.grupos.length + ' grupos');
  console.log('  ' + nVerb + ' verbetes  (' + nDv + ' com dv · ' + nComNumero + ' com número na definição)');
  console.log('  ' + A.rel.length + ' pares relacionados em ' + nTermosRel + ' termos');
  console.log('  hash canônico do lado A: ' + espelho.hash(A));
})().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
