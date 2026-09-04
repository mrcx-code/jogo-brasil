// QA — O CONTROLE DOS MODOS DE INJEÇÃO DO `qa-vercel-host.js` (04/09)
//
//   node test/qa-vercel-host-controle.js
//
// POR QUE ELE EXISTE, e é a lição 2.8 do EQUIPE.md aplicada ao portão que a invocou.
//
// O `test/qa-vercel-host.js` tem DEZ modos de injeção (`QA_VERCEL_DEFEITO=<modo>`), e cada um
// existe para provar que uma asserção morde. Medido em 04/09, auditando a entrega do 10º modo,
// com grep por `QA_VERCEL_DEFEITO` no repositório inteiro fora do próprio arquivo:
//
//   package.json .......... 0 ocorrência(s)
//   .github/workflows/ .... 0     (o workflow roda `node test/qa-vercel-host.js` LIMPO, e só)
//   test/encaixe.js ....... 0
//   ferramentas/integrar.js 0
//
// Ou seja: as dez provas de mordida só aconteciam se alguém DIGITASSE a variável de ambiente. Uma
// asserção some do arquivo, os dez modos passam a sair 0, e nenhuma rodada automática nota — que é
// exatamente a doença que os modos foram escritos para curar, um nível acima. "Instrumento nunca
// visto reprovando é decoração"; um instrumento cuja prova de mordida ninguém roda é a mesma coisa
// com um passo a mais.
//
// O molde não é invenção: `test/qa-vercel-quadro.js` já faz isto pelo QUADRO_DE_ROTAS do build
// (13 defeitos, exit != 0 em cada, mais um caso limpo), e está pendurado no CI. Este arquivo é o
// equivalente para os modos do `qa-vercel-host.js`.
//
// O QUE ELE COBRA, e cada linha existe por uma forma de o controle apodrecer em silêncio:
//   1. a lista de modos sai do CÓDIGO-FONTE do portão (regex sobre `const MODOS = [...]`), nunca
//      de uma cópia daqui — modo 11 acrescentado lá passa a ser exigido aqui no mesmo commit, e
//      modo apagado lá derruba a leitura em vez de virar cobertura fantasma;
//   2. o caso LIMPO (sem a variável) sai 0. Sem isto, um portão que reprova sempre passaria nos
//      dez modos e não provaria nada;
//   3. cada modo sai 1 **e imprime ao menos uma linha `X`** — um modo que sai 1 porque o arquivo
//      EXPLODIU (stack, JSON inválido, `process.exit(2)`) não é asserção mordendo, é acidente;
//   4. modo inexistente sai 2, que é o caminho de erro de digitação;
//   5. o `vercel.json` do disco não muda — sha256 antes e depois de rodar os dez. A versão
//      anterior de um portão vizinho MUTAVA o arquivo e restaurava num gancho que não sobrevive a
//      sinal (medido no cabeçalho do `qa-vercel-quadro.js`: `timeout -s KILL` deixava a regra
//      `/historia` duplicada no arquivo que a Vercel publica). Aqui a injeção é em memória, e esta
//      linha é o que impede a regressão para o jeito antigo;
//   6. o modo `privacidade` reprova NOMEANDO `SEM_CONTAGEM`. Medido em 04/09 na auditoria: ele
//      deixa DUAS linhas vermelhas — a 4b e o agregado `comConnect === familiaSecao` —, e um
//      vermelho de duas causas pode virar um vermelho de uma causa errada sem ninguém ver. Com o
//      agregado removido à mão (mutante de auditoria), o modo continuou saindo 1 com UMA linha, a
//      da `SEM_CONTAGEM`: a asserção morde SOZINHA, e é isso que esta cobrança prega no lugar;
//   7. duas rodadas do caso limpo dão a MESMA saída byte a byte. Piso de ruído medido antes de
//      acreditar em qualquer um dos números acima (medido: sha256 do stdout igual nas duas).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PORTAO = path.join(__dirname, 'qa-vercel-host.js');
const VERCEL = path.join(RAIZ, 'vercel.json');

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok  ' : '  X   ') + msg); if (!cond) falhas++; return !!cond; }

// 1. a lista de modos vem do próprio portão, não de uma cópia
const fonte = fs.readFileSync(PORTAO, 'utf8');
const bloco = fonte.match(/const MODOS = \[([\s\S]*?)\];/);
if (!bloco) {
  console.error('não achei `const MODOS = [...]` em test/qa-vercel-host.js — o portão mudou de forma;'
    + ' conserte ESTE arquivo, não desligue a cobrança');
  process.exit(2);
}
const MODOS = (bloco[1].match(/'[^']+'/g) || []).map(function (s) { return s.slice(1, -1); });
ok(MODOS.length >= 10, 'li ' + MODOS.length + ' modo(s) do código-fonte do portão: ' + MODOS.join(', '));

const sha = function (p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); };
const antes = sha(VERCEL);

function rodar(modo) {
  const env = Object.assign({}, process.env);
  if (modo) env.QA_VERCEL_DEFEITO = modo; else delete env.QA_VERCEL_DEFEITO;
  const r = spawnSync(process.execPath, [PORTAO], { cwd: RAIZ, env: env, encoding: 'utf8' });
  const linhas = String(r.stdout || '').split('\n');
  return { status: r.status, stdout: String(r.stdout || ''), vermelhas: linhas.filter(function (l) { return l.indexOf('  X   ') === 0; }) };
}

// 2. o caso limpo sai 0
const limpo = rodar('');
ok(limpo.status === 0, 'sem QA_VERCEL_DEFEITO o portão sai 0 contra o vercel.json de hoje — saiu ' + limpo.status);

// 3. cada modo sai 1 E imprime ao menos uma linha `X`
for (const m of MODOS) {
  const r = rodar(m);
  ok(r.status === 1 && r.vermelhas.length > 0,
    'modo `' + m + '` reprova por asserção — exit ' + r.status + ', ' + r.vermelhas.length + ' linha(s) X'
    + (r.status === 1 && r.vermelhas.length > 0 ? '' : ' — modo que não morde, ou que morde por acidente'
      + ' (explosão/exit 2) em vez de por asserção, é decoração assinada de verde'));
  // 6. o `privacidade` tem de reprovar NOMEANDO a lista que ele existe para exercitar
  if (m === 'privacidade') {
    const nomeia = r.vermelhas.some(function (l) { return l.indexOf('SEM_CONTAGEM') >= 0; });
    ok(nomeia, 'o modo `privacidade` reprova nomeando SEM_CONTAGEM (e não só pelo agregado)'
      + (nomeia ? '' : ' — as linhas vermelhas foram: ' + JSON.stringify(r.vermelhas.map(function (l) { return l.trim().slice(0, 80); }))
        + '. Se sobrou só o agregado, a asserção 4b parou de morder e o vermelho está mentindo sobre a causa'));
  }
}

// 4. modo inexistente sai 2
const errado = rodar('modo-que-nao-existe-' + process.pid);
ok(errado.status === 2, 'modo desconhecido sai 2 (caminho de erro de digitação) — saiu ' + errado.status);

// 5. o vercel.json do disco não mudou
const depois = sha(VERCEL);
ok(antes === depois, 'o vercel.json do disco não mudou ao rodar os ' + MODOS.length + ' modos (sha256 '
  + antes.slice(0, 16) + ')' + (antes === depois ? '' : ' — MUDOU, de ' + antes.slice(0, 16) + ' para '
    + depois.slice(0, 16) + ': a injeção voltou a escrever no arquivo que a Vercel publica'));

// 7. piso de ruído: duas rodadas do caso limpo, byte a byte
const limpo2 = rodar('');
ok(limpo.stdout === limpo2.stdout && limpo.status === limpo2.status,
  'duas rodadas do caso limpo dão a mesma saída byte a byte (piso de ruído zero)');

console.log('');
if (falhas) { console.error('REPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
console.log('ok — ' + MODOS.length + ' modo(s) de injeção mordem por exit code, o limpo sai 0, e o disco não muda');
process.exit(0);
