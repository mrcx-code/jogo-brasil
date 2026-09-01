// O PORTÃO QUE COBRA ONDE O CHROMIUM ESTÁ — estático, sem navegador, ~40 ms.
//
// ============================================================================
// O QUE ELE EXISTE PARA IMPEDIR, e não é hipótese: aconteceu em 31/08.
// ============================================================================
//
// Este repositório tem 125 lugares que abrem um Chromium. O `smoke.js` e o `encaixe.js`
// passam `executablePath` — e cada um dos 63 arquivos que acertava carregava a SUA PRÓPRIA
// cópia da função que resolve esse caminho. Os outros 62 lançavam nus: `chromium.launch()`.
//
// Enquanto a máquina roda `npx playwright install`, nu e vestido dão no mesmo e ninguém vê
// diferença — é por isso que o defeito viveu meses. Onde o navegador vem PROVISIONADO numa
// build diferente da que o Playwright espera (uma máquina de nuvem; qualquer máquina cujo
// Playwright subiu de versão sem reinstalar o navegador), o lançamento nu morre assim:
//
//     browserType.launch: Executable doesn't exist at
//     /opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/...
//     ╔═══ Looks like Playwright was just installed or updated. ═══╗
//
// E a mensagem aponta para o lugar errado: manda instalar navegador, quando o navegador está
// no disco e o que falta é dizer onde.
//
// O ESTRAGO MEDIDO EM 31/08, e é ele que justifica um portão em vez de um remendo:
//   · `npm test` saía **1** — e NÃO no smoke, que passava e imprimia "PASS — no errors".
//     Morria depois, no `regua-larga.js`. Quem lesse a última linha do log do smoke leria
//     PASS e empurraria com o `npm test` vermelho.
//   · morriam junto `medir-save-hostil.js` e `medir-telas-altura.js` — DOIS dos quatro
//     portões que o plantão roda por regra a cada ciclo.
//   · morria o `conteudo-espelho.js`, que é o portão do FUNIL para todo diff de glossário
//     (PENDENTES 87). Um diff de texto histórico seria revertido por falta de navegador,
//     com a mensagem dizendo que o banco divergiu.
//
// ============================================================================
// A LISTA DE PORTÕES É DERIVADA, NUNCA ESCRITA À MÃO
// ============================================================================
//
// Lista chumbada envelhece em silêncio — é a mesma doença que o `caminhos-do-backlog.js`
// existe para curar (o painel oferecia ao dono 28 caminhos escritos à mão contra 15 itens
// livres de verdade). Então a lista sai de onde os portões REALMENTE são invocados:
//
//   1. `.github/workflows/*.yml` — todo `node <arquivo>.js` e todo `npm run <script>`;
//   2. `package.json` — o corpo dos scripts que o CI e o ciclo chamam;
//   3. um nível de `require` local a partir de cada um deles, que é o que alcança o
//      `conteudo-espelho.js` (ninguém o chama direto: quem o chama é o `conteudo-conferir`).
//
// Se amanhã o CI ganhar um portão novo, ele entra nesta cobrança sozinho. Se o CI PERDER um,
// esta lista encolhe junto — e é por isso que o portão também imprime quantos achou: uma
// lista que despenca de 15 para 2 é um sinal, não um alívio.
//
// ============================================================================
// COMO USAR
//   node test/portao-navegador.js              # exit 0 = nenhum portão lança nu
//   node test/portao-navegador.js --autoteste  # PROVA que ele reprova (a lição 2.8 da casa)
// ============================================================================
'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const AUTOTESTE = process.argv.includes('--autoteste');

// ————— 1. DE ONDE SAI A LISTA —————

function lerSeExiste(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

// Os scripts do package.json, para expandir `npm run X` / `npm test` no que eles de fato rodam.
const SCRIPTS = (function () {
  try { return JSON.parse(lerSeExiste(path.join(RAIZ, 'package.json'))).scripts || {}; }
  catch (e) { return {}; }
})();

// `node algum/caminho.js` em qualquer texto (YAML do CI ou corpo de script do npm).
function arquivosDeComando(txt) {
  const achados = [];
  const re = /\bnode\s+((?:[\w.@/-]+\/)*[\w.@-]+\.js)/g;
  let m;
  while ((m = re.exec(txt))) achados.push(m[1]);
  return achados;
}

// `npm run X` e `npm test` -> o corpo do script, recursivamente (um npm script chama outro).
function expandirNpm(txt, vistos) {
  const achados = [];
  const re = /\bnpm\s+(?:run\s+([\w:-]+)|(test))\b/g;
  let m;
  while ((m = re.exec(txt))) {
    const nome = m[1] || 'test';
    if (vistos.has(nome)) continue;
    vistos.add(nome);
    const corpo = SCRIPTS[nome];
    if (!corpo) continue;
    achados.push.apply(achados, arquivosDeComando(corpo));
    achados.push.apply(achados, expandirNpm(corpo, vistos));
  }
  return achados;
}

function portoesDeclarados() {
  const dir = path.join(RAIZ, '.github', 'workflows');
  let fontes = [];
  try {
    fontes = fs.readdirSync(dir).filter((f) => /\.ya?ml$/i.test(f)).map((f) => lerSeExiste(path.join(dir, f)));
  } catch (e) { /* sem CI: a lista cai para os scripts do npm, e o total impresso denuncia */ }
  // O ciclo que o plantão roda por regra (CLAUDE.md §6) não está no YAML e é portão do mesmo
  // jeito. Estes quatro nomes são o ciclo, e continuam sendo os únicos que o CLAUDE.md nomeia.
  fontes.push('npm test\nnode test/encaixe.js\nnode test/medir-save-hostil.js\nnode test/medir-telas-altura.js');
  // FORA DO CICLO, MAS AINDA UM PORTÃO (dev-plataforma, 01/09, pedido pelo pré-integrador ao
  // devolver o item `perda-de-resposta-deixa-rastro`): `rodape-verdadeiro.js` não roda pelo CI
  // nem pelo ciclo do plantão — é chamado à mão por quem mexe em `dashboard/`. Ele MESMO já
  // pagou o preço de lançar nu (achado do pré-integrador, 01/09: as 11 cenas dinâmicas nunca
  // executavam nesta máquina, e só as 2 estáticas rodavam — silêncio, sem exit ≠ 0 denunciando).
  // Ele não vira "ciclo" só por entrar aqui; esta segunda linha existe para não misturar as
  // duas categorias na mesma frase.
  fontes.push('node test/rodape-verdadeiro.js');

  const brutos = new Set();
  for (const txt of fontes) {
    for (const a of arquivosDeComando(txt)) brutos.add(a);
    for (const a of expandirNpm(txt, new Set())) brutos.add(a);
  }
  return brutos;
}

// Um nível de `require` local: é o que alcança o conteudo-espelho.js pelo conteudo-conferir.js.
function requeridosLocais(rel) {
  const abs = path.join(RAIZ, rel);
  const txt = lerSeExiste(abs);
  const fora = [];
  const re = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(txt))) {
    let alvo = path.resolve(path.dirname(abs), m[1]);
    if (!/\.js$/.test(alvo)) alvo += '.js';
    if (fs.existsSync(alvo)) fora.push(path.relative(RAIZ, alvo).split(path.sep).join('/'));
  }
  return fora;
}

// ————— 2. A COBRANÇA —————
//
// Um lançamento está VESTIDO quando a chamada carrega `executablePath`. A leitura é da
// CHAMADA, não do arquivo: um arquivo com dois launches, um vestido e um nu, tem de reprovar
// — e foi por isso que a varredura de 31/08, que perguntava só se a palavra aparecia no
// arquivo, não serviria como portão.
//
// E ELE LÊ CÓDIGO, NÃO COMENTÁRIO — a primeira versão reprovou o PRÓPRIO `abrir.js` em duas
// linhas de prosa que citam a chamada para explicar o defeito. Um portão que não distingue o
// que o programa FAZ do que o comentário DIZ obriga quem documenta a escrever errado de
// propósito, e aí a documentação some.
//
// A SEGUNDA VERSÃO ERRAVA PARA O LADO PERIGOSO, e vale registrar porque foi medido. Ela
// apagava também as STRINGS, para não tropeçar nelas — e um scanner que não conhece literal
// de expressão regular lê o `"` de `.replace(/"/g, '&quot;')` (ferramentas/cartao-secao.js:102)
// como abertura de string e **engole as 50 linhas seguintes**, entre elas o
// `chromium.launch()` nu da linha 121. O portão passou de "3 achados, 2 falsos" para
// "0 achados" e ficou VERDE escondendo um defeito real. Falso positivo é barulhento e se
// conserta; falso negativo é mudo e assina o verde.
//
// ENTÃO ESTA VERSÃO NÃO TOCA EM STRING NENHUMA — só em comentário, que é a única coisa que
// ela precisa distinguir. `//` só conta como início de comentário quando não vem depois de
// `:`, o que preserva `http://`, `https://` e `file://` dentro de literal. Os espaços entram
// no lugar dos caracteres para as posições não andarem: o número da linha continua verdadeiro.
function semComentarios(txt) {
  let fora = '';
  let i = 0;
  while (i < txt.length) {
    const c = txt[i], d = txt[i + 1];
    if (c === '/' && d === '/' && txt[i - 1] !== ':') {
      while (i < txt.length && txt[i] !== '\n') { fora += ' '; i++; }
    } else if (c === '/' && d === '*') {
      while (i < txt.length && !(txt[i] === '*' && txt[i + 1] === '/')) { fora += (txt[i] === '\n' ? '\n' : ' '); i++; }
      fora += '  '; i += 2;
    } else { fora += c; i++; }
  }
  return fora;
}

function launchesNus(rel) {
  const txt = semComentarios(lerSeExiste(path.join(RAIZ, rel)));
  const nus = [];
  const re = /chromium\s*\.\s*launch(?:PersistentContext)?\s*\(/g;
  let m;
  while ((m = re.exec(txt))) {
    // Recorta a chamada equilibrando parênteses a partir do "(" — assim um `args: [...]`
    // com parêntese dentro de string não corta o argumento ao meio.
    let i = re.lastIndex - 1, prof = 0, fim = -1;
    for (; i < txt.length && i < re.lastIndex + 4000; i++) {
      if (txt[i] === '(') prof++;
      else if (txt[i] === ')') { prof--; if (prof === 0) { fim = i; break; } }
    }
    const chamada = txt.slice(re.lastIndex - 1, fim === -1 ? re.lastIndex + 200 : fim + 1);
    if (!/executablePath/.test(chamada)) {
      const linha = txt.slice(0, m.index).split('\n').length;
      nus.push(rel + ':' + linha);
    }
  }
  return nus;
}

function varrer() {
  const portoes = portoesDeclarados();
  const alcance = new Set();
  for (const p of portoes) {
    alcance.add(p);
    for (const r of requeridosLocais(p)) alcance.add(r);
  }
  const nus = [];
  for (const rel of alcance) nus.push.apply(nus, launchesNus(rel));
  return { portoes, alcance, nus };
}

// ————— 3. O AUTOTESTE: a prova de que ele MORDE —————
//
// Controle que não morde é decoração, e decoração assinada de verde é pior que teste nenhum.
// Injeta um lançamento nu num portão real, exige exit 1 apontando para ele, e restaura.
function autoteste() {
  const COBAIA = 'test/medir-save-hostil.js';
  const abs = path.join(RAIZ, COBAIA);
  const original = fs.readFileSync(abs, 'utf8');
  const DE = 'const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });';
  if (original.indexOf(DE) === -1) {
    console.log('AUTOTESTE INCONCLUSIVO — a âncora sumiu de ' + COBAIA + '; conserte o autoteste, não o portão.');
    process.exit(2);
  }
  let ok = true;
  try {
    const limpo = varrer();
    console.log('  antes da injeção  -> nus: ' + limpo.nus.length);
    if (limpo.nus.length !== 0) { console.log('  ✗ a árvore já estava suja; o autoteste não prova nada'); ok = false; }

    // O payload é montado por concatenação, e não escrito inteiro, porque este arquivo ENTRA na
    // própria varredura — ele é um portão do CI desde 31/08. Escrito inteiro, o literal do
    // defeito seria lido como um lançamento nu de verdade e a varredura reprovaria o próprio
    // instrumento. A saída óbvia seria isentar este arquivo, e ela é a errada: régua que se
    // exclui da medição é o buraco que o PENDENTES 68 nomeia. Então não há isenção nenhuma —
    // o que há é um specimen que não se parece com o bicho quando lido pela régua.
    const NU = 'const nav = await chromium' + '.launch();';
    fs.writeFileSync(abs, original.replace(DE, NU));
    const sujo = varrer();
    const pegou = sujo.nus.some((x) => x.indexOf(COBAIA) === 0);
    console.log('  com o defeito     -> nus: ' + sujo.nus.length + (pegou ? ' (pegou ' + COBAIA + ')' : ' (NÃO pegou)'));
    if (!pegou) { console.log('  ✗ o portão não mordeu'); ok = false; }
  } finally {
    fs.writeFileSync(abs, original);   // restaura SEMPRE, inclusive se algo acima lançar
  }
  const depois = varrer();
  console.log('  depois de restaurar -> nus: ' + depois.nus.length);
  if (depois.nus.length !== 0) { console.log('  ✗ a restauração não voltou ao verde'); ok = false; }
  console.log(ok ? 'AUTOTESTE OK — o portão morde e solta.' : 'AUTOTESTE FALHOU.');
  process.exit(ok ? 0 : 1);
}

// ————— 4. principal —————
if (AUTOTESTE) { autoteste(); }
else {
  const { portoes, alcance, nus } = varrer();
  console.log('portões derivados: ' + portoes.size + ' · com os requires locais: ' + alcance.size);
  if (!nus.length) {
    console.log('VERDE — todo portão diz onde o Chromium está.');
    process.exit(0);
  }
  console.log('');
  console.log('REPROVADO — ' + nus.length + ' lançamento(s) de Chromium sem executablePath:');
  for (const n of nus) console.log('  ' + n);
  console.log('');
  console.log('O conserto é uma linha, e a função canônica já existe:');
  console.log("  const ABRIR = require('./abrir.js');");
  console.log('  await chromium.launch({ executablePath: ABRIR.chromiumPath() })');
  console.log('Sem PW_CHROMIUM e sem /opt/pw-browsers/chromium ela devolve undefined, que é o');
  console.log('lançamento nu — então numa máquina que instalou o navegador nada muda.');
  process.exit(1);
}
