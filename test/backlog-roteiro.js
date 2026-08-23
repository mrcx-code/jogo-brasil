// O GUARDA DO ROTEIRO, visto mordendo — e visto DEIXANDO PASSAR o que tem de passar.
//
// POR QUE EXISTE (achado do jurídico, 22/08). A fila interna é publicada em
// `/dashboard/backlog.json`, um endereço que responde 200 a quem pedir — o `Disallow` do
// robots.txt pede ao robô que não indexe, não impede ninguém de abrir. Um item em estado
// `do-dono` explicava ali, em português claro, o que cada defesa AINDA NÃO aplicada permitia.
// O texto foi cortado no mesmo dia; conteúdo volta, portão não. A régua que virou portão em
// `ferramentas/construir.js` (guardaRoteiro) cabe numa linha: **nenhum item publicado pode
// descrever uma defesa que ainda não está no lugar**.
//
// UM PORTÃO ASSIM PODE ERRAR DOS DOIS LADOS, e este arquivo cobra os dois:
//   · MUDO — a lista não casa o que devia, e a fila volta a publicar o roteiro. Cena 2.
//   · HISTÉRICO — casa `pinos` dentro de `pin`, e o build fica vermelho por um item que fala
//     da placa do TERRITÓRIO. Cenas 3 e 4. Um portão que reprova qualquer coisa é desligado
//     na primeira semana, e aí ele não protege nada.
// E a anistia do item CONCLUÍDO (cena 5) é a parte com conteúdo: descrever defesa que JÁ ESTÁ
// DE PÉ é transparência, e é o que separa esta régua de uma mordaça.
//
// O build roda com `--sem-tsc`: o que está sob teste é o guarda, não o compilador, e o tsc
// custa a maior parte do relógio. Todas as cenas escrevem numa CÓPIA e o original volta no
// `finally` — se este arquivo morrer no meio, o backlog continua o que era.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const FILA = path.join(RAIZ, 'ferramentas', 'backlog.json');
const ORIGINAL = fs.readFileSync(FILA);

let falhas = 0, passes = 0;
function ok(cond, msg) {
  if (cond) { passes++; console.log('  ok  ' + msg); }
  else { falhas++; console.log('  X   ' + msg); }
  return !!cond;
}

function construir() {
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'ferramentas', 'construir.js'), '--sem-tsc'],
    { cwd: RAIZ, encoding: 'utf8' });
  return { code: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

// escreve a fila com um item a mais e devolve o resultado do build
function comItem(item) {
  const fila = JSON.parse(ORIGINAL.toString('utf8'));
  fila.itens.unshift(item);
  fs.writeFileSync(FILA, JSON.stringify(fila, null, 2));
  return construir();
}

console.log('\n=== o guarda do roteiro: item nao-concluido nao descreve defesa ausente\n');

try {
  // ---- 1. o estado real: a fila de hoje passa, e chega publicada ----
  const hoje = construir();
  ok(hoje.code === 0, 'a fila REAL de hoje constroi verde (exit ' + hoje.code + ')');
  const publicado = path.join(RAIZ, 'dist', 'dashboard', 'backlog.json');
  ok(fs.existsSync(publicado), 'e a fila chega em dist/dashboard/backlog.json');
  if (fs.existsSync(publicado)) {
    const n = (JSON.parse(fs.readFileSync(publicado, 'utf8')).itens || []).length;
    ok(n > 10, 'com os ' + n + ' itens — o guarda nao esta passando por a fila estar vazia');
  }

  // ---- 2. O CONTROLE: um item LIVRE com o roteiro dentro ----
  const mordeu = comItem({
    id: 'tmp-isca-roteiro',
    titulo: 'isca do test/backlog-roteiro.js',
    detalhe: 'Sem isto, um PIN acertado troca o e-mail e tranca o dono para fora.',
    agente: 'ninguem', estado: 'livre', camada: 'teste', territorio: 'nenhum'
  });
  ok(mordeu.code !== 0, 'CONTROLE: item LIVRE que descreve o que a falta permite RECUSA o build (exit '
    + mordeu.code + ')');
  ok(/ROTEIRO indo para/.test(mordeu.saida), 'e recusa pelo guarda do roteiro, nao por outro acidente');
  ok(/tmp-isca-roteiro/.test(mordeu.saida), 'a mensagem NOMEIA o item — sem isso ninguem acha qual e');
  ok(/"PIN"/.test(mordeu.saida), 'e NOMEIA a palavra que o derrubou');
  ok(/campo `detalhe`/.test(mordeu.saida), 'e o campo onde ela estava');

  // ---- 3. o falso positivo que o jurídico avisou: pinos, pintados ----
  const pinos = comItem({
    id: 'tmp-isca-pinos',
    titulo: 'Os pinos pintados da placa do TERRITORIO, com os pinos do lote 1',
    detalhe: 'Pintar os pinos e repintar a legenda; nada aqui fala de autenticacao.',
    agente: 'ninguem', estado: 'livre', camada: 'teste', territorio: 'territorio/'
  });
  ok(pinos.code === 0, 'CONTROLE NEGATIVO: "pinos"/"pintados" num item LIVRE NAO derruba o build (exit '
    + pinos.code + ') — \\b e o que separa portao de estorvo');

  // ---- 4. o outro lado do falso positivo: a palavra colada noutra ----
  const colada = comItem({
    id: 'tmp-isca-colada',
    titulo: 'Opinar sobre o pingo do i e o token... nao: sobre o acabamento',
    detalhe: 'Palavras que CONTEM as proibidas sem serem elas: opinar, pingo, pintura, senhora.',
    agente: 'ninguem', estado: 'livre', camada: 'teste', territorio: 'nenhum'
  });
  ok(colada.code !== 0, 'e "token" solto no titulo TAMBEM derruba (exit ' + colada.code
    + ') — a fronteira nao pode virar peneira');

  // ---- 5. A ANISTIA: o mesmo texto num item CONCLUIDO passa ----
  const anistia = comItem({
    id: 'tmp-isca-concluido',
    titulo: 'isca do test/backlog-roteiro.js, ja feita',
    detalhe: 'Sem isto, um PIN acertado troca o e-mail e tranca o dono para fora.',
    agente: 'ninguem', estado: 'concluido', camada: 'teste'
  });
  ok(anistia.code === 0, 'ANISTIA: o MESMO texto num item CONCLUIDO passa (exit ' + anistia.code
    + ') — defesa que ja esta de pe pode ser contada, e e essa a diferenca entre regua e mordaca');
} finally {
  fs.writeFileSync(FILA, ORIGINAL);
}

// ---- 6. e a arvore volta verde com a fila restaurada ----
const fim = construir();
ok(fim.code === 0, 'com a fila restaurada, o build volta a passar (exit ' + fim.code + ')');
ok(Buffer.compare(fs.readFileSync(FILA), ORIGINAL) === 0,
  'e ferramentas/backlog.json esta byte a byte como estava antes deste teste');

console.log('\n' + (falhas ? 'ROTEIRO: ' + falhas + ' falharam de ' + (falhas + passes)
  : 'ROTEIRO OK — ' + passes + ' verificacoes passaram, 0 falharam'));
process.exit(falhas ? 1 : 0);
