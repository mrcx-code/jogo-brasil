// A PROVA DE MORDIDA DO QUADRO DE ROTAS — item `csp-tabela-de-rotas-e-conjunto`, 03/09.
//
//   node test/qa-vercel-quadro.js
//
// POR QUE ELE EXISTE. Em 03/09 o `conferirVercelJson()` do `ferramentas/construir.js` passou a
// cobrar as 22 regras do `vercel.json` contra um QUADRO_DE_ROTAS: a lista de `source` na ORDEM e
// com repetição, e a CSP de cada uma diretiva por diretiva. Asserção nova sem controle é
// decoração, e decoração assinada de verde é pior que teste nenhum (EQUIPE.md 2.8) — este arquivo
// é o controle.
//
// COMO ELE MEDE, e é de propósito que seja caro: ele injeta o defeito NO ARQUIVO DE VERDADE, roda
// `node ferramentas/construir.js` como processo separado, lê o **exit code real** do processo
// (nunca de um tubo) e restaura o arquivo — em `finally` e também num gancho de `process.on
// ('exit')`, para que uma interrupção no meio não deixe o `vercel.json` quebrado. Não há injeção
// em memória aqui porque não é o parser que está sendo provado: é O PORTÃO, com o arquivo que a
// Vercel vai ler.
//
// O CONTROLE DO CONTROLE: o último caso não tem defeito nenhum e tem de sair **0**. Sem ele, um
// harness que reprovasse por qualquer motivo (uma dependência faltando, um erro de digitação
// neste arquivo) mostraria 13 vermelhos e passaria por prova de mordida.
//
// AS TRÊS CLASSES QUE O ITEM NOMEIA, medidas ANTES do conserto com este mesmo método (build exit
// 0 nas três): rotas trocadas · rota duplicada, que ainda imprimia "14 rota(s) … (tabela
// ROTAS_QUE_MEDEM, 13 rotas)" · `script-src https://exfil.example.com` numa regra que mede. As
// cinco que a rodada anterior já cobrava (região, esquema, dedo, escape unicode, connect-src
// removido) são re-medidas aqui para nenhuma delas deixar de morder em silêncio.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'vercel.json');
const HOST = require('../ferramentas/medir-secao.js').MEDIDA_HOST;
const escapar = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };

const ORIGINAL = fs.readFileSync(ARQ, 'utf8');
const COPIA = path.join(os.tmpdir(), 'vercel.json.qa-quadro.' + process.pid);
fs.writeFileSync(COPIA, ORIGINAL);
function restaurar() {
  if (fs.readFileSync(ARQ, 'utf8') !== ORIGINAL) fs.writeFileSync(ARQ, ORIGINAL);
}
process.on('exit', restaurar);
process.on('SIGINT', function () { restaurar(); process.exit(130); });

// A regra atacada é quase sempre `/historia` (sem barra final): nenhuma rota publicada a resolve,
// então ela é o ponto cego do `test/csp-paginas.js` e o lugar onde o quadro é o único portão.
function comObjeto(mudar) {
  const v = JSON.parse(ORIGINAL);
  const i = v.headers.findIndex(function (r) { return String(r.source) === '/historia'; });
  if (i < 0) throw new Error('a regra /historia sumiu do vercel.json — a injeção não tem onde morder');
  mudar(v, i);
  return JSON.stringify(v, null, 2) + '\n';
}
function naCsp(i, trocar) {
  return comObjeto(function (v, idx) {
    const alvo = i === undefined ? idx : i;
    const h = v.headers[alvo].headers.find(function (x) { return x.key === 'Content-Security-Policy'; });
    h.value = trocar(h.value);
  });
}
// As quatro do texto atacam a SEGUNDA ocorrência do host, que é a da regra `/historia`.
function noTexto(de, para) {
  let n = -1;
  return ORIGINAL.replace(new RegExp(de, 'g'), function (m) { n++; return n === 1 ? para : m; });
}

const CASOS = [
  // --- as três classes deste item ---
  {
    nome: 'troca',
    porque: '/territorio e /glossario trocam de `source`: o território perde o `blob:` que faz a placa 3D desenhar e o glossário ganha CSP mais frouxa. O CONJUNTO de rotas não muda — só a ordem e o par rota/política',
    espero: 'nao e a do QUADRO_DE_ROTAS',
    texto: function () {
      return comObjeto(function (v) {
        const a = v.headers.findIndex(function (r) { return r.source === '/territorio'; });
        const b = v.headers.findIndex(function (r) { return r.source === '/glossario'; });
        v.headers[a].source = '/glossario';
        v.headers[b].source = '/territorio';
      });
    },
  },
  {
    nome: 'duplicata',
    porque: 'a regra /historia entra duas vezes. Conjunto idêntico, multiconjunto não — e era aqui que o portão imprimia "14 rota(s) … (tabela de 13 rotas)" e saía 0',
    espero: 'nao e a do QUADRO_DE_ROTAS',
    texto: function () {
      return comObjeto(function (v, i) { v.headers.splice(i + 1, 0, JSON.parse(JSON.stringify(v.headers[i]))); });
    },
  },
  {
    nome: 'exfil',
    porque: 'host estranho em OUTRA diretiva de uma regra que mede — a cobrança antiga só procurava a string "posthog"',
    espero: 'script-src',
    texto: function () {
      return naCsp(undefined, function (v) { return v.replace("script-src 'unsafe-inline'", "script-src 'unsafe-inline' https://exfil.example.com"); });
    },
  },
  // --- o resto do que o quadro passou a cobrar ---
  {
    nome: 'reordenada',
    porque: 'duas regras trocam de POSIÇÃO sem mudar de conteúdo: multiconjunto idêntico, ordem não. A ordem decide qual regra a Vercel aplica (last-match-wins)',
    espero: 'nao e a do QUADRO_DE_ROTAS',
    texto: function () {
      return comObjeto(function (v) {
        const a = v.headers.findIndex(function (r) { return r.source === '/historia/'; });
        const b = v.headers.findIndex(function (r) { return r.source === '/historia/(.*)'; });
        const t = v.headers[a]; v.headers[a] = v.headers[b]; v.headers[b] = t;
      });
    },
  },
  {
    nome: 'curinga',
    porque: 'curinga em img-src — o §3 manda escrever por extenso, com esquema, nenhum curinga, nunca',
    espero: 'CURINGA',
    texto: function () {
      return naCsp(undefined, function (v) { return v.replace('img-src data:', 'img-src data: https://*.exemplo.com'); });
    },
  },
  {
    nome: 'repetida',
    porque: 'a MESMA diretiva duas vezes, com o mesmo valor: a comparação de valor não tem o que reprovar e sobra só a cobrança de forma. Sem ela, uma segunda `script-src` frouxa antes da conferida seria invisível para quem monta objeto — o navegador aplica a PRIMEIRA',
    espero: 'repete a(s) diretiva(s)',
    texto: function () {
      return naCsp(undefined, function (v) { return v.replace("script-src 'unsafe-inline';", "script-src 'unsafe-inline'; script-src 'unsafe-inline';"); });
    },
  },
  {
    nome: 'rota-nova',
    porque: 'rota nova com CSP fora da forma família-de-seção e SEM connect-src: a asserção da família não a vê, porque ela não é da família',
    espero: 'nao e a do QUADRO_DE_ROTAS',
    texto: function () {
      return comObjeto(function (v, i) {
        v.headers.splice(i, 0, {
          source: '/quilombos',
          headers: [{ key: 'Content-Security-Policy', value: "script-src 'unsafe-inline'; frame-ancestors 'none'" }],
        });
      });
    },
  },
  {
    nome: 'mencao-solta',
    porque: 'o host escrito num campo que NÃO é CSP: a comparação de diretivas não olha para lá, e é a contagem de menções contra o QUADRO que pega',
    espero: '"posthog" aparece',
    texto: function () {
      return comObjeto(function (v, i) {
        v.headers[i].headers.push({ key: 'X-Nota', value: 'ver painel do posthog' });
      });
    },
  },
  // --- as cinco que a rodada anterior já cobrava: nenhuma pode deixar de morder ---
  {
    nome: 'regiao', porque: 'região trocada (eu em vez de us) — os dois respondem 200 OK a qualquer chave',
    espero: 'connect-src', texto: function () { return noTexto(escapar(HOST), 'https://eu.i.posthog.com'); },
  },
  {
    nome: 'esquema', porque: 'esquema rebaixado para http://',
    espero: 'connect-src', texto: function () { return noTexto(escapar(HOST), 'http://us.i.posthog.com'); },
  },
  {
    nome: 'erro-de-dedo', porque: 'psthog em vez de posthog',
    espero: 'connect-src', texto: function () { return noTexto(escapar(HOST), 'https://us.i.psthog.com'); },
  },
  {
    nome: 'escape-unicode', porque: 'o `p` escrito como \\u0070: só o JSON.parse desfaz, e a varredura de texto não vê',
    espero: 'connect-src', texto: function () { return noTexto(escapar(HOST), 'https://eu.i.\\u0070osthog.com'); },
  },
  {
    nome: 'connect-src-removido', porque: 'a rota perde a contagem anônima inteira, em silêncio',
    espero: 'connect-src', texto: function () { return noTexto('connect-src ' + escapar(HOST) + '; ', ''); },
  },
  // --- o controle do controle ---
  { nome: '(sem defeito)', porque: 'o arquivo como está no repositório — tem de sair 0', espero: null, texto: function () { return ORIGINAL; } },
];

function construir() {
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'ferramentas', 'construir.js')],
    { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, saida: String(r.stdout || '') + String(r.stderr || '') };
}

let falhas = 0;
console.log('PROVA DE MORDIDA DO QUADRO_DE_ROTAS — ' + CASOS.length + ' caso(s), cada um roda o build de verdade');
console.log('');
try {
  for (const c of CASOS) {
    fs.writeFileSync(ARQ, c.texto());
    const r = construir();
    const querVermelho = c.espero !== null;
    const passou = querVermelho ? (r.code !== 0 && r.saida.indexOf(c.espero) >= 0) : r.code === 0;
    if (!passou) falhas++;
    console.log((passou ? '  ok  ' : '  X   ') + c.nome.padEnd(22) + ' build exit ' + r.code
      + (querVermelho ? '  (esperado != 0, com "' + c.espero + '" na mensagem)' : '  (esperado 0)'));
    console.log('        ' + c.porque);
    if (!passou) {
      console.log('        SAIDA DO BUILD (últimas 12 linhas):');
      for (const l of r.saida.trim().split('\n').slice(-12)) console.log('        | ' + l);
    }
    fs.writeFileSync(ARQ, ORIGINAL);
  }
} finally {
  restaurar();
}

console.log('');
if (fs.readFileSync(ARQ, 'utf8') !== ORIGINAL) {
  console.error('FALHA: o vercel.json não voltou ao original — restaure à mão a partir de ' + COPIA);
  process.exit(1);
}
fs.unlinkSync(COPIA);
if (falhas) { console.error('REPROVADO — ' + falhas + ' caso(s) não morderam'); process.exit(1); }
console.log('ok — ' + (CASOS.length - 1) + ' injeção(ões) mordem e o arquivo limpo passa; vercel.json restaurado');
process.exit(0);
