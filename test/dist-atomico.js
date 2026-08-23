// O `dist/` SE PUBLICA INTEIRO OU NÃO SE PUBLICA — e a prova de que é verdade.
//
// POR QUE EXISTE (achado da segurança, 22/08). O build escrevia direto em `dist/`, arquivo a
// arquivo, e ele tem vários motivos DE PROPÓSITO para morrer no meio: o guarda de segredo, a
// tabela da CSP, a cobrança de a chave começar com `phc_`. Quando morria, o que já tinha sido
// escrito ficava lá misturado com os bytes da build anterior — a pasta existe, as páginas
// abrem, e uma delas é de ontem. Na Vercel isso é inócuo (build vermelha não promove nada); no
// disco de quem desenvolve, `npm run servir` e o `cap sync` leem essa pasta e servem a mistura
// calados. É o modo de falha preferido deste repositório: nada quebra, e o errado circula.
//
// O CONSERTO está em `ferramentas/construir.js`: tudo é escrito na pasta de obra `dist.tmp/` e
// só o último passo troca `dist/` por ela num rename.
//
// O QUE ESTE ARQUIVO FAZ, e é o que separa portão de decoração (EQUIPE 2.8): ele QUEBRA o build
// de propósito, com uma falha REAL (uma isca com a forma de chave de serviço numa pasta que o
// build publica — o mesmo guarda que já derrubou uma entrega em 22/08 por um comentário), e
// cobra três coisas:
//   1. o build recusa mesmo — exit != 0;
//   2. o `dist/` continua BYTE A BYTE o de antes da tentativa (é a promessa inteira);
//   3. a pasta de obra ficou com a saída PELA METADE — que é a prova de que o build de fato
//      escreveu antes de morrer, e não de que ele parou cedo demais para sujar coisa alguma.
//      Sem o item 3 este teste passaria mesmo com a proteção desligada, por sorte de ordem.
// E fecha voltando a um build verde, para não deixar a árvore pior do que achou.
//
// O QUE ELE NÃO PROMETE: o `index.html` da RAIZ e os `pack-*.json` da raiz continuam sendo
// reescritos antes da pasta de obra, e um build que falha depois deles os deixa novos. É outra
// natureza de risco — a raiz é VERSIONADA, então `git status` mostra, e o smoke test lê justo
// esse arquivo. Não é silencioso, e por isso não é o que este portão resolve.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const OBRA = path.join(RAIZ, 'dist.tmp');
// A isca vai numa pasta de SEÇÃO (território do dev-plataforma), nunca em dashboard/ nem em
// src/. Nome com tmp- para ninguém a confundir com conteúdo.
const ISCA = path.join(RAIZ, 'historia', 'tmp-isca-segredo.json');

let falhas = 0, passes = 0;
function ok(cond, msg) {
  if (cond) { passes++; console.log('  ok  ' + msg); }
  else { falhas++; console.log('  X   ' + msg); }
  return !!cond;
}

// A impressão digital de uma pasta inteira: caminho relativo + sha1 de cada arquivo.
function impressao(dir) {
  const saida = [];
  (function anda(atual) {
    if (!fs.existsSync(atual)) return;
    for (const nome of fs.readdirSync(atual).sort()) {
      const cheio = path.join(atual, nome);
      const st = fs.statSync(cheio);
      if (st.isDirectory()) anda(cheio);
      else {
        saida.push(path.relative(dir, cheio).split(path.sep).join('/') + ' '
          + crypto.createHash('sha1').update(fs.readFileSync(cheio)).digest('hex'));
      }
    }
  })(dir);
  return saida;
}

function construir() {
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'ferramentas', 'construir.js')],
    { cwd: RAIZ, encoding: 'utf8' });
  return { code: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

console.log('\n=== dist/ atômico: um build que falha não deixa a pasta publicada pela metade\n');

// ---- 1. um build verde, e a impressão digital do dist/ que ele deixou ----
const verde1 = construir();
if (!ok(verde1.code === 0, 'o build de partida passa (exit ' + verde1.code + ')')) {
  console.log(verde1.saida.slice(-1500));
  process.exit(1);
}
const antes = impressao(DIST);
ok(antes.length > 10, 'dist/ tem ' + antes.length + ' arquivos depois do build verde');
ok(!fs.existsSync(OBRA), 'a pasta de obra dist.tmp/ não sobrou depois de um build verde');

// ---- 2. o build QUEBRADO, com uma falha real do guarda de segredo ----
try {
  fs.writeFileSync(ISCA, JSON.stringify({
    comentario: 'isca do test/dist-atomico.js — apagada no fim deste teste',
    chave: 'service_role'
  }));
  const vermelho = construir();
  ok(vermelho.code !== 0, 'o build RECUSA com a isca de segredo numa pasta publicada (exit '
    + vermelho.code + ')');
  ok(/SEGREDO indo para/.test(vermelho.saida),
    'e recusa pelo motivo esperado (o guarda de segredo), não por outro acidente');

  // A PROMESSA: o dist/ é o mesmo de antes, byte a byte.
  const depois = impressao(DIST);
  const iguais = antes.length === depois.length && antes.every((l, i) => l === depois[i]);
  ok(iguais, 'dist/ continua IDÊNTICO ao de antes da tentativa — '
    + antes.length + ' arquivos, mesmos sha1'
    + (iguais ? '' : ' (diferenças: ' + depois.filter((l) => !antes.includes(l)).slice(0, 3).join(' | ') + ')'));
  ok(!fs.existsSync(path.join(DIST, 'historia', 'tmp-isca-segredo.json')),
    'e a isca não chegou a dist/historia/');

  // A PROVA DE QUE O TESTE NÃO PASSA POR SORTE: o build escreveu de verdade antes de morrer.
  const obra = fs.existsSync(OBRA) ? impressao(OBRA) : [];
  ok(obra.length > 0, 'a pasta de obra dist.tmp/ ficou com ' + obra.length
    + ' arquivo(s) escritos antes da recusa — sem isto, o dist/ intacto seria sorte de ordem');
  ok(obra.length < antes.length, 'e ela está PELA METADE (' + obra.length + ' de ' + antes.length
    + ') — é exatamente esta metade que ia para dist/ antes do conserto');
} finally {
  fs.rmSync(ISCA, { force: true });
}

// ---- 3. e a árvore volta verde ----
const verde2 = construir();
ok(verde2.code === 0, 'depois de tirar a isca, o build volta a passar (exit ' + verde2.code + ')');
ok(!fs.existsSync(OBRA), 'e a pasta de obra some de novo');
const fim = impressao(DIST);
ok(fim.length === antes.length, 'dist/ voltou ao mesmo número de arquivos (' + fim.length + ')');

console.log('\n' + (falhas ? 'DIST ATÔMICO: ' + falhas + ' falharam de ' + (falhas + passes)
  : 'DIST ATÔMICO OK — ' + passes + ' verificações passaram, 0 falharam'));
process.exit(falhas ? 1 : 0);
