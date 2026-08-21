// O PORTÃO DA AVENIDA A, FASE 0 — o espelho de LEITURA do glossário.
//
// POR QUE ELE EXISTE. A fase 0 tira uma cópia do conteúdo do jogo e a põe num banco, para que
// a revisão (aba REVISÃO do dashboard, fase 2) e o alerta de validade (`vence_em`) tenham onde
// morar. Enquanto o jogo continua sendo a fonte, existir DUAS cópias do mesmo texto é
// exatamente o modo de falha que este repositório mais paga: duas verdades que divergem em
// silêncio e ninguém percebe por semanas. Este arquivo é a resposta — um portão que compara as
// duas BYTE A BYTE e reprova nomeando o primeiro verbete divergente.
//
// A REGRA SUPREMA DA FASE 0: o jogo NÃO muda um byte, e a CSP do jogo é INTOCADA. O banco
// alimenta FERRAMENTA, nunca o navegador de quem joga. Nada aqui é embutido no `index.html`.
//
// O LADO A é o jogo, lido headless pelo caminho da pessoa (test/abrir.js + Playwright — nunca
// `file://`, lição 2.7 do EQUIPE.md). O LADO B é o export do banco, que chega como arquivo
// JSON porque esta ferramenta não tem MCP: quem integra roda o SELECT via MCP e passa o
// arquivo em `--banco`. SEM o arquivo, o script roda só o lado A e imprime o hash canônico —
// que já serve para conferir de fora.
//
// COMO USAR
//   node ferramentas/conteudo-espelho.js                    # lado A: extrai, valida, imprime o hash
//   node ferramentas/conteudo-espelho.js --emitir-banco x.json  # escreve o lado A na FORMA do export
//   node ferramentas/conteudo-espelho.js --banco x.json      # compara A com B (exit 1 se divergir)
//   node ferramentas/conteudo-espelho.js --autoteste         # PROVA que ele reprova (lição 2.8)
//
// O `--autoteste` existe por causa da lição 2.8 do EQUIPE.md: "um instrumento que nunca foi
// visto reprovando é decoração". Ele monta o lado B a partir do próprio lado A, vira UM campo
// `dv` de cabeça para baixo, e exige que a comparação acuse. Se a comparação passar, o
// autoteste é que sai 1 — porque aí o portão é enfeite.
//
// A FORMA DO EXPORT (lado B) é uma só, e é esta — três listas com o nome da tabela, sem o
// prefixo `conteudo_glossario`:
//   { "grupo": [linhas de conteudo_glossario_grupo],
//     "glossario": [linhas de conteudo_glossario],
//     "rel": [linhas de conteudo_glossario_rel] }
// Colunas a mais (id, rev, estado, …) são ignoradas; `estado` e `vigente_ate`, quando vêm,
// filtram para o publicado vigente. O SELECT exato sai impresso por `--sql-export`.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const RAIZ = path.resolve(__dirname, '..');

// ————— 1. O LADO A: o jogo, headless, pelo caminho da pessoa —————
async function extrairDoJogo() {
  const { chromium } = require('playwright');
  const ABRIR = require('../test/abrir.js');
  const ALVO = ABRIR('file:///' + path.join(RAIZ, 'index.html').split(path.sep).join('/'));
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.goto(ALVO);
  await pg.waitForTimeout(1800);
  const cru = await pg.evaluate(() => {
    if (typeof GLOSSARIO === 'undefined') throw new Error('GLOSSARIO não existe nesta página');
    if (typeof GLOSSARIO_REL === 'undefined') throw new Error('GLOSSARIO_REL não existe nesta página');
    return {
      lista: GLOSSARIO.map((v) => Object.assign({}, v)),
      rel: Object.keys(GLOSSARIO_REL).map((k) => ({ termo: k, itens: GLOSSARIO_REL[k].slice() })),
    };
  });
  await nav.close();
  return cru;
}

// ————— 2. A FORMA CANÔNICA — a única definição, usada pelos dois lados —————
//
// GLOSSARIO é uma lista PLANA: um cabeçalho de grupo (campo `g`) e, depois dele, os verbetes
// (campo `t`) até o próximo cabeçalho. A chave de um verbete é o próprio termo `t` e a chave de
// um grupo é o próprio nome `g` — nenhum identificador inventado, porque inventar chave é
// inventar dado (os dois foram conferidos únicos: 181 termos, 17 grupos, zero repetição).
//
// A `ordem` é DENTRO do grupo, e a do grupo é dentro da lista. Isso reconstrói o array plano
// original exatamente — e `conferir()` abaixo prova que reconstrói, em vez de supor.
function canonizarJogo(cru) {
  const grupos = [];
  let atual = null;
  for (const v of cru.lista) {
    if (v.g) {
      atual = {
        chave: String(v.g), g: String(v.g), curto: String(v.curto || ''),
        sub: String(v.sub || ''), ordem: grupos.length + 1, verbetes: [],
      };
      grupos.push(atual);
    } else if (v.t) {
      if (!atual) throw new Error('verbete antes de qualquer grupo: ' + v.t);
      atual.verbetes.push({
        chave: String(v.t), t: String(v.t), o: String(v.o || ''), d: String(v.d || ''),
        f: String(v.f || ''), dv: !!v.dv, ordem: atual.verbetes.length + 1,
      });
    }
  }
  const rel = [];
  for (const r of cru.rel) {
    r.itens.forEach((x, i) => rel.push({ termo: String(r.termo), relacionado: String(x), ordem: i + 1 }));
  }
  return ordenar({ grupos, rel });
}

// O lado B chega como linhas soltas de três tabelas; aqui elas voltam a ter forma.
function canonizarBanco(exp) {
  const vigente = (r) => (r.estado === undefined || r.estado === 'publicado')
    && (r.vigente_ate === undefined || r.vigente_ate === null);
  const gs = (exp.grupo || []).filter(vigente);
  const vs = (exp.glossario || []).filter(vigente);
  const rs = (exp.rel || []).filter(vigente);
  const porChave = {};
  const grupos = gs.map((g) => {
    const o = {
      chave: String(g.chave), g: String(g.g || ''), curto: String(g.curto || ''),
      sub: String(g.sub || ''), ordem: Number(g.ordem), verbetes: [],
    };
    porChave[o.chave] = o;
    return o;
  });
  for (const v of vs) {
    const g = porChave[String(v.grupo_chave)];
    if (!g) throw new Error('verbete do banco aponta para grupo que não existe: '
      + v.chave + ' -> ' + v.grupo_chave);
    g.verbetes.push({
      chave: String(v.chave), t: String(v.t || ''), o: String(v.o || ''), d: String(v.d || ''),
      f: String(v.f || ''), dv: v.dv === true || v.dv === 1 || v.dv === 't', ordem: Number(v.ordem),
    });
  }
  const rel = rs.map((r) => ({
    termo: String(r.termo), relacionado: String(r.relacionado), ordem: Number(r.ordem),
  }));
  return ordenar({ grupos, rel });
}

// A ordem é parte da forma canônica: sem isto, duas listas iguais em conteúdo dariam hashes
// diferentes só porque o `select` do banco não promete ordem nenhuma.
function ordenar(c) {
  c.grupos.sort((a, b) => a.ordem - b.ordem);
  for (const g of c.grupos) g.verbetes.sort((a, b) => a.ordem - b.ordem);
  const peso = {};
  c.grupos.forEach((g, i) => g.verbetes.forEach((v, j) => { peso[v.chave] = i * 10000 + j; }));
  c.rel.sort((a, b) => (peso[a.termo] - peso[b.termo]) || (a.ordem - b.ordem)
    || (a.relacionado < b.relacionado ? -1 : 1));
  return c;
}

// JSON estável: chaves em ordem alfabética, sempre. É o que faz "byte a byte" querer dizer algo.
function estavel(x) {
  if (Array.isArray(x)) return '[' + x.map(estavel).join(',') + ']';
  if (x && typeof x === 'object') {
    return '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + estavel(x[k])).join(',') + '}';
  }
  return JSON.stringify(x === undefined ? null : x);
}
const hash = (c) => crypto.createHash('sha256').update(estavel(c), 'utf8').digest('hex');

// ————— 3. A COMPARAÇÃO — devolve a PRIMEIRA divergência, com nome —————
function comparar(A, B) {
  if (A.grupos.length !== B.grupos.length) {
    return 'número de grupos: jogo tem ' + A.grupos.length + ', banco tem ' + B.grupos.length;
  }
  for (let i = 0; i < A.grupos.length; i++) {
    const a = A.grupos[i]; const b = B.grupos[i];
    for (const k of ['chave', 'g', 'curto', 'sub', 'ordem']) {
      if (a[k] !== b[k]) return 'grupo ' + (i + 1) + ' "' + a.chave + '" campo ' + k
        + ': jogo ' + JSON.stringify(a[k]) + ' · banco ' + JSON.stringify(b[k]);
    }
    if (a.verbetes.length !== b.verbetes.length) {
      return 'grupo "' + a.chave + '": jogo tem ' + a.verbetes.length + ' verbetes, banco tem '
        + b.verbetes.length;
    }
    for (let j = 0; j < a.verbetes.length; j++) {
      const va = a.verbetes[j]; const vb = b.verbetes[j];
      for (const k of ['chave', 't', 'o', 'd', 'f', 'dv', 'ordem']) {
        if (va[k] !== vb[k]) return 'verbete "' + va.chave + '" (grupo "' + a.chave
          + '") campo ' + k + ': jogo ' + JSON.stringify(va[k]) + ' · banco ' + JSON.stringify(vb[k]);
      }
    }
  }
  if (A.rel.length !== B.rel.length) {
    return 'número de pares relacionados: jogo tem ' + A.rel.length + ', banco tem ' + B.rel.length;
  }
  for (let i = 0; i < A.rel.length; i++) {
    const a = A.rel[i]; const b = B.rel[i];
    for (const k of ['termo', 'relacionado', 'ordem']) {
      if (a[k] !== b[k]) return 'par relacionado de "' + a.termo + '" campo ' + k
        + ': jogo ' + JSON.stringify(a[k]) + ' · banco ' + JSON.stringify(b[k]);
    }
  }
  return null;
}

// ————— 4. AS CONFERÊNCIAS QUE VALEM MESMO SEM BANCO —————
//
// Três coisas que, se quebrarem, quebram a carga em silêncio. Elas rodam sempre no lado A.
function conferir(cru, A) {
  const erros = [];
  // (a) a reconstrução volta ao array plano ORIGINAL — provada, não suposta.
  const refeita = [];
  for (const g of A.grupos) {
    refeita.push('G:' + g.chave);
    for (const v of g.verbetes) refeita.push('V:' + v.chave);
  }
  const orig = cru.lista.filter((v) => v.g || v.t).map((v) => (v.g ? 'G:' + v.g : 'V:' + v.t));
  if (refeita.join(' ') !== orig.join(' ')) {
    const i = orig.findIndex((x, k) => x !== refeita[k]);
    erros.push('a reconstrução por grupo+ordem NÃO devolve a lista original — diverge em ' + i
      + ': original ' + orig[i] + ' · refeita ' + refeita[i]);
  }
  // (b) chaves únicas: chave repetida é linha que some no banco sem avisar.
  const vistos = {};
  for (const g of A.grupos) {
    if (vistos['G' + g.chave]) erros.push('grupo repetido: ' + g.chave);
    vistos['G' + g.chave] = 1;
    for (const v of g.verbetes) {
      if (vistos['V' + v.chave]) erros.push('verbete repetido: ' + v.chave);
      vistos['V' + v.chave] = 1;
    }
  }
  // (c) todo par relacionado casa com um verbete existente, letra por letra.
  for (const r of A.rel) {
    if (!vistos['V' + r.termo]) erros.push('par relacionado de termo inexistente: ' + r.termo);
    if (!vistos['V' + r.relacionado]) erros.push('par relacionado aponta para verbete inexistente: '
      + r.termo + ' -> ' + r.relacionado);
  }
  return erros;
}

// ————— 5. O SELECT do lado B, para quem tem MCP —————
const SQL_EXPORT = [
  '-- Rode os três e junte no arquivo do --banco:',
  '--   { "grupo": [...], "glossario": [...], "rel": [...] }',
  "select chave, g, curto, sub, ordem, estado, vigente_ate from public.conteudo_glossario_grupo",
  "  where estado = 'publicado' and vigente_ate is null order by ordem;",
  "select chave, t, o, d, f, dv, grupo_chave, ordem, estado, vigente_ate from public.conteudo_glossario",
  "  where estado = 'publicado' and vigente_ate is null order by grupo_chave, ordem;",
  "select termo, relacionado, ordem, estado, vigente_ate from public.conteudo_glossario_rel",
  "  where estado = 'publicado' and vigente_ate is null order by termo, ordem;",
].join('\n');

// ————— 6. Linha de comando —————
function arg(nome) {
  const i = process.argv.indexOf(nome);
  return i < 0 ? null : (process.argv[i + 1] || '');
}
function formaExport(A) {
  return {
    grupo: A.grupos.map((g) => ({ chave: g.chave, g: g.g, curto: g.curto, sub: g.sub, ordem: g.ordem })),
    glossario: [].concat(...A.grupos.map((g) => g.verbetes.map((v) => ({
      chave: v.chave, t: v.t, o: v.o, d: v.d, f: v.f, dv: v.dv, grupo_chave: g.chave, ordem: v.ordem,
    })))),
    rel: A.rel.map((r) => ({ termo: r.termo, relacionado: r.relacionado, ordem: r.ordem })),
  };
}

async function principal() {
  if (process.argv.indexOf('--sql-export') >= 0) { console.log(SQL_EXPORT); return; }

  const cru = await extrairDoJogo();
  const A = canonizarJogo(cru);
  const nVerb = A.grupos.reduce((s, g) => s + g.verbetes.length, 0);
  const erros = conferir(cru, A);
  console.log('LADO A (o jogo): ' + nVerb + ' verbetes · ' + A.grupos.length + ' grupos · '
    + A.rel.length + ' pares relacionados em ' + new Set(A.rel.map((r) => r.termo)).size + ' termos');
  if (erros.length) {
    console.error('RECUSADO — o lado A não fecha consigo mesmo:');
    for (const e of erros) console.error('  · ' + e);
    process.exit(1);
  }
  console.log('hash canônico: ' + hash(A));

  const emitir = arg('--emitir-banco');
  if (emitir) {
    fs.writeFileSync(path.resolve(RAIZ, emitir), JSON.stringify(formaExport(A), null, 1), 'utf8');
    console.log('lado A escrito na forma do export: ' + emitir);
  }

  if (process.argv.indexOf('--autoteste') >= 0) {
    // A lição 2.8: prove que reprova. Monto o lado B a partir do próprio A (idêntico por
    // construção — tem de passar), depois viro UM `dv` e exijo que a comparação acuse.
    const igual = canonizarBanco(formaExport(A));
    const semDefeito = comparar(A, igual);
    if (semDefeito) {
      console.error('AUTOTESTE FALHOU: A comparado consigo mesmo já diverge — ' + semDefeito);
      process.exit(1);
    }
    console.log('autoteste 1/3 — controle: A contra A idêntico passa (nenhuma divergência)');

    const exp = formaExport(A);
    const alvo = exp.glossario.find((v) => v.dv === true) || exp.glossario[0];
    alvo.dv = !alvo.dv;
    const comDefeito = comparar(A, canonizarBanco(exp));
    if (!comDefeito) {
      console.error('AUTOTESTE FALHOU: virei o `dv` de "' + alvo.chave + '" e o portão PASSOU.'
        + ' Portão que não reprova é decoração (EQUIPE.md 2.8).');
      process.exit(1);
    }
    console.log('autoteste 2/3 — defeito injetado em `dv` de "' + alvo.chave + '": ' + comDefeito);

    const exp2 = formaExport(A);
    exp2.rel[3].ordem = 99;
    const comDefeito2 = comparar(A, canonizarBanco(exp2));
    if (!comDefeito2) {
      console.error('AUTOTESTE FALHOU: mexi na ordem curada de um par e o portão PASSOU.');
      process.exit(1);
    }
    console.log('autoteste 3/3 — defeito injetado na ordem de um par: ' + comDefeito2);
    console.log('AUTOTESTE OK — o portão reprova quando tem de reprovar.');
    return;
  }

  const banco = arg('--banco');
  if (!banco) {
    console.log('(sem --banco: só o lado A. Passe --banco <arquivo.json> para comparar;'
      + ' o SELECT do export sai em --sql-export)');
    return;
  }
  const B = canonizarBanco(JSON.parse(fs.readFileSync(path.resolve(RAIZ, banco), 'utf8')));
  const nB = B.grupos.reduce((s, g) => s + g.verbetes.length, 0);
  console.log('LADO B (o banco): ' + nB + ' verbetes · ' + B.grupos.length + ' grupos · '
    + B.rel.length + ' pares relacionados');
  console.log('hash canônico: ' + hash(B));
  const d = comparar(A, B);
  if (d) {
    console.error('ESPELHO QUEBRADO — o banco e o jogo divergem.');
    console.error('  primeira divergência: ' + d);
    process.exit(1);
  }
  if (hash(A) !== hash(B)) {
    console.error('ESPELHO QUEBRADO — hashes diferentes sem divergência nomeada (bug do comparador).');
    process.exit(1);
  }
  console.log('ESPELHO ÍNTEGRO — jogo e banco são o mesmo texto, byte a byte.');
}

module.exports = { extrairDoJogo, canonizarJogo, canonizarBanco, comparar, estavel, hash, conferir, formaExport };

if (require.main === module) {
  principal().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
}
