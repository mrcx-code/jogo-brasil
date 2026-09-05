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
//      `conteudo-espelho.js` (ninguém o chama direto: quem o chama é o `conteudo-conferir`);
//   4. o DIRETÓRIO `ferramentas/`, para todo `gerar-*.js` (dev-plataforma, 02/09, item
//      `geradores-fora-do-portao`, PENDENTES 91/98/101d). Estes não estão no YAML nem no
//      `package.json` — publicam as páginas da plataforma à mão ou pela mesa — e um deles já
//      ficou meses sem rodar nesta nuvem por um `chromium.launch()` nu sem que nenhum portão
//      visse. Achados por GLOB, não por nome, para a mesma regra do parágrafo acima valer aqui
//      também: um `gerar-*.js` novo entra sozinho.
//
// Se amanhã o CI ganhar um portão novo, ele entra nesta cobrança sozinho. Se o CI PERDER um,
// esta lista encolhe junto — e é por isso que o portão também imprime quantos achou: uma
// lista que despenca de 15 para 2 é um sinal, não um alívio.
//
// E DESDE 05/09 O ALCANCE É MAIOR QUE ESTA LISTA: `test/` e `ferramentas/` entram INTEIRAS, por
// varredura recursiva de diretório. O porquê, com o número que o forçou, está no bloco 1b —
// resumido: o CI roda `npx playwright install` e por isso NÃO paga o preço do lançamento nu;
// quem paga é a máquina de nuvem, e nela o que morre é o instrumento chamado à mão, que esta
// lista por construção não vê. Eram 46, e o portão estava verde.
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
const AUTOTESTE = require.main === module && process.argv.includes('--autoteste');

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
  // FORA DO CICLO, MAS AINDA UM PORTÃO (dev-plataforma, 02/09, item `geradores-fora-do-portao`,
  // PENDENTES 91/98/101d): os `ferramentas/gerar-*.js` publicam as páginas da plataforma (porta,
  // glossário, história, fontes, território) e não são chamados nem pelo CI nem pelo
  // `package.json` — são disparados à mão, ou pela mesa, quando o conteúdo muda. Já pagaram o
  // preço do lançamento nu: PENDENTES 98 mediu `gerar-glossario.js` morto nesta nuvem meses
  // depois de o defeito existir, porque nenhum portão cobria o gerador e a página ficou velha em
  // silêncio. Achados por DIRETÓRIO — não por nome —, pela mesma razão do bloco de cima: um
  // `gerar-*.js` novo entra nesta cobrança sozinho, sem ninguém lembrar de atualizar uma lista, e
  // se a pasta perder um a lista encolhe junto (o total impresso denuncia, como em todo lugar
  // deste arquivo).
  try {
    const geradores = fs.readdirSync(path.join(RAIZ, 'ferramentas'))
      .filter((f) => /^gerar-.*\.js$/.test(f))
      .map((f) => 'node ferramentas/' + f);
    fontes.push(geradores.join('\n'));
  } catch (e) { /* sem a pasta: a lista cai para o resto, e o total impresso denuncia */ }

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
// A TERCEIRA VERSÃO (a que valeu até 01/09) NÃO TOCAVA EM STRING NENHUMA — e por isso confundia
// o `/*` de dentro de `'/**'` (o curinga de rota do Express/Playwright, usado em
// `test/rodape-verdadeiro.js` e `test/fila-auth.js`) e de `'**/*'` / `'**supabase.co/**'` (o
// "intercepta tudo" do Playwright, usado em `test/medir-leitura-secao.js`,
// `test/medir-paginas.js`, `test/medir-plataforma-chrome.js`, `test/caminhos-do-backlog.js`)
// com abertura de comentário de bloco DE VERDADE — PENDENTES 92. Medido antes deste conserto,
// com a função antiga, nos 8 arquivos do alcance do portão: de 12 ocorrências brutas de
// `chromium.launch` no texto, **só 2 sobreviviam** à varredura — as duas do próprio
// `portao-navegador.js`, o único dos 8 que não usa nenhum desses padrões de rota.
//
// ESTA QUARTA VERSÃO É UMA MÁQUINA DE ESTADOS — não duas regex empilhadas —, porque a lição da
// segunda versão continua valendo ao contrário: reconhecer aspas SEM saber que elas também
// aparecem dentro de literais de regex teria o mesmo risco (`requeridosLocais()`, algumas
// linhas acima, usa `['"]` duas vezes — regex com aspas dentro, no próprio arquivo do portão).
// A saída: strings (`'…'`, `"…"`, template `` `…` `` com `${…}` aninhado) são RECONHECIDAS mas
// NUNCA APAGADAS — o conteúdo atravessa sem mudar; só o reconhecimento de `//`/`/*` fica
// desligado enquanto o scanner acha que está "dentro" de uma. Isso torna a confusão de aspas
// **segura por construção**: mesmo que uma aspa escondida num literal de regex desequilibre a
// contagem por um trecho, nada é apagado ali — o pior efeito possível é um comentário de
// verdade deixar de ser reconhecido (falso positivo, barulhento) e NUNCA um engolimento
// silencioso. E cada string simples/dupla tem limite de uma linha: uma aspa sem fechar antes do
// `\n` é abandonada ali (JS de verdade já seria erro de sintaxe nesse caso) — o que impede a
// MESMA classe de bug (comentário de bloco falso comendo dezenas de linhas) de voltar por outra
// porta. Só o template literal, que PODE ser multi-linha de propósito (é a única sintaxe que
// É), atravessa `\n` sem abortar.
//
// O QUE ESTA VERSÃO NÃO RESOLVE, medido e registrado em vez de escondido: um literal de regex
// com barra escapada ainda pode formar um `//` ou `/*` de mentira que o scanner não reconhece
// como regex — `test/abrir.js:100` tem `/^file:\/\//i`, cujo `\/\/` final forma duas barras
// adjacentes lidas hoje como início de comentário de linha (o resto daquela linha some). Não
// muda o resultado de nenhum dos 8 arquivos do alcance porque não há `chromium.launch` na mesma
// linha, mas é uma lacuna real, não fechada por este conserto — desambiguar regex de divisão
// exige saber o token significativo anterior (palavra-chave, identificador, operador), e isso é
// escopo maior do que "string vs. comentário". Achado também: 9 arquivos em `test/*.js` (fora
// do alcance de hoje) têm o mesmo padrão `\/\/` dentro de regex — não é só o `abrir.js`.
//
// `//` só conta como início de comentário quando não vem depois de `:`, herdado da versão
// anterior para preservar `http://`, `https://` e `file://` fora de qualquer string — dentro de
// uma string a proteção já vem do estado, não desta checagem.
function semComentarios(txt) {
  const CODIGO = 0, LINHA = 1, BLOCO = 2, ASPA1 = 3, ASPA2 = 4, TEMPLATE = 5;
  // Pilha de contextos: o topo é o modo atual. Um quadro TEMPLATE que viu `${` empurra um
  // quadro CODIGO com `viaTemplate = true` e `chaves` — para saber quando o `}` fecha a
  // interpolação (e não um objeto declarado por dentro dela).
  const pilha = [{ modo: CODIGO }];
  let fora = '';
  let i = 0;
  const n = txt.length;
  while (i < n) {
    const topo = pilha[pilha.length - 1];
    const c = txt[i], d = i + 1 < n ? txt[i + 1] : '';

    if (topo.modo === LINHA) {
      if (c === '\n') { fora += '\n'; pilha.pop(); } else { fora += ' '; }
      i++; continue;
    }
    if (topo.modo === BLOCO) {
      if (c === '*' && d === '/') { fora += '  '; i += 2; pilha.pop(); }
      else { fora += (c === '\n' ? '\n' : ' '); i++; }
      continue;
    }
    if (topo.modo === ASPA1 || topo.modo === ASPA2) {
      const aspa = topo.modo === ASPA1 ? "'" : '"';
      if (c === '\\' && d !== '') { fora += c + d; i += 2; continue; }
      if (c === aspa) { fora += c; i++; pilha.pop(); continue; }
      if (c === '\n') { fora += '\n'; i++; pilha.pop(); continue; } // sem fechar antes da linha acabar: já seria erro de sintaxe
      fora += c; i++; continue;
    }
    if (topo.modo === TEMPLATE) {
      if (c === '\\' && d !== '') { fora += c + d; i += 2; continue; }
      if (c === '`') { fora += c; i++; pilha.pop(); continue; }
      if (c === '$' && d === '{') { fora += c + d; i += 2; pilha.push({ modo: CODIGO, viaTemplate: true, chaves: 0 }); continue; }
      fora += c; i++; continue;
    }

    // topo.modo === CODIGO (inclusive dentro de uma ${...} de template)
    if (c === '/' && d === '/' && txt[i - 1] !== ':') { pilha.push({ modo: LINHA }); fora += '  '; i += 2; continue; }
    if (c === '/' && d === '*') { pilha.push({ modo: BLOCO }); fora += '  '; i += 2; continue; }
    if (c === "'") { pilha.push({ modo: ASPA1 }); fora += c; i++; continue; }
    if (c === '"') { pilha.push({ modo: ASPA2 }); fora += c; i++; continue; }
    if (c === '`') { pilha.push({ modo: TEMPLATE }); fora += c; i++; continue; }
    if (topo.viaTemplate) {
      if (c === '{') { topo.chaves++; fora += c; i++; continue; }
      if (c === '}') {
        if (topo.chaves === 0) { pilha.pop(); fora += c; i++; continue; }
        topo.chaves--; fora += c; i++; continue;
      }
    }
    fora += c; i++;
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

// ————— 1b. O ALCANCE DEIXOU DE SER SÓ O QUE O CI CHAMA (dev-jogo, 05/09) —————
//
// Item `sem-lockfile-o-playwright-flutua-e-quebra-o-navegador-da-nuvem`, saída (c). MEDIDO
// antes de mexer, com a `launchesNus()` deste arquivo e não com um grep próprio: `test/` e
// `ferramentas/` têm **166 arquivos que abrem Chromium**; o alcance derivado do CI via **74**;
// e sobravam **46 lançamentos nus**, os 46 FORA do alcance e ZERO dentro dele. Ou seja: o
// portão estava verde e correto, e mesmo assim 46 instrumentos morriam na nuvem sem ninguém
// receber vermelho — exatamente o silêncio que ele foi escrito para acabar.
//
// POR QUE A LISTA DERIVADA DO CI NÃO BASTAVA, e não é falha do desenho dela: ela responde
// "quem é portão?", que é a pergunta certa para *saber o que quebra a `main`*. Só que o custo
// do lançamento nu não é pago pelo CI — o CI roda `npx playwright install` e ali nu e vestido
// dão no mesmo. Quem paga é a MÁQUINA com o navegador provisionado numa build que o Playwright
// não espera, e nela quem morre é o instrumento que alguém roda à mão. O `CLAUDE.md` manda
// rodar `test/medir-na-tela.js`, `test/tirar-icc.js`, `test/peso-file-fetch.js` e os
// `test/inline-*.js` — os quatro lançavam nus. A regra escrita no manual apontava para
// ferramentas mortas nesta nuvem.
//
// É O MESMO ARGUMENTO JÁ ACEITO EM 02/09 para os `ferramentas/gerar-*.js`, agora sem o
// recorte por nome: um gerador ficou meses morto porque nenhum portão o via (PENDENTES 98), e
// a saída foi achá-lo por DIRETÓRIO em vez de por lista. Estender o diretório de um prefixo
// (`gerar-*`) para as duas pastas inteiras é a generalização dessa mesma lição — e a varredura
// RECURSIVA existe para que `test/uma-pasta-nova/instrumento.js` entre sozinho, sem ninguém
// lembrar de nada. Medido hoje: nenhum subdiretório de `test/` ou `ferramentas/` abre Chromium,
// e não há um único `chromium.launch` FORA dessas duas pastas — então a varredura é completa,
// e não "completa até onde alguém lembrou".
//
// O NÚMERO DE PORTÕES DERIVADOS CONTINUA SENDO IMPRESSO, e continua sendo o sinal que era: uma
// lista de portões que despenca de 60 para 2 é um CI que sumiu. Ele só deixou de ser o alcance.
function varreDiretorio(dir) {
  const fora = [];
  const raizDir = path.join(RAIZ, dir);
  let entradas = [];
  try { entradas = fs.readdirSync(raizDir, { withFileTypes: true }); } catch (e) { return fora; }
  for (const e of entradas) {
    const rel = dir + '/' + e.name;
    if (e.isDirectory()) fora.push.apply(fora, varreDiretorio(rel));
    else if (/\.js$/.test(e.name)) fora.push(rel);
  }
  return fora;
}

function instrumentos() {
  return varreDiretorio('test').concat(varreDiretorio('ferramentas'));
}

function varrer() {
  const portoes = portoesDeclarados();
  const alcance = new Set();
  for (const p of portoes) {
    alcance.add(p);
    for (const r of requeridosLocais(p)) alcance.add(r);
  }
  // Todo instrumento das duas pastas entra, seja ele chamado pelo CI ou pela mão de alguém.
  for (const i of instrumentos()) alcance.add(i);
  const nus = [];
  for (const rel of alcance) nus.push.apply(nus, launchesNus(rel));
  return { portoes, alcance, nus };
}

// ————— 3. O AUTOTESTE: a prova de que ele MORDE —————
//
// Controle que não morde é decoração, e decoração assinada de verde é pior que teste nenhum.
// Injeta um lançamento nu num portão real, exige exit 1 apontando para ele, e restaura.
//
// TRÊS COBAIAS, não duas — PENDENTES 92 e 101d/`geradores-fora-do-portao`. Uma cobaia só
// (`medir-save-hostil.js`, sem `'/**'`) prova que a varredura morde NAQUELE arquivo e não prova
// nada sobre os outros 7 do alcance que usam curinga de rota. A segunda cobaia é
// `test/rodape-verdadeiro.js`, que TEM `'/**'` seis vezes — é o próprio arquivo que a lacuna
// deixou cego. A TERCEIRA é `ferramentas/gerar-porta.js`, e prova uma categoria diferente das
// duas primeiras: ela só entra no alcance pela descoberta por DIRETÓRIO (o bloco novo que lista
// `ferramentas/gerar-*.js`), não pelo YAML nem pelo `package.json` nem pela linha `fontes.push`
// escrita à mão do `rodape-verdadeiro.js`. Sem esta cobaia, o autoteste provaria as duas formas
// antigas de achar um portão e ficaria mudo sobre a nova — a mesma lacuna que a segunda cobaia
// fechou para o curinga de rota, agora para o glob.
//
// A QUARTA (dev-jogo, 05/09) prova a varredura de DIRETÓRIO do bloco 1b, e ela é a única das
// quatro que nenhuma das três formas antigas alcança: `test/prints-costura.js` não está no
// YAML, não está no `package.json`, não é `gerar-*` e ninguém o requer — é chamado à mão por
// quem mexe na costura dos capítulos, e é a suíte que produziu a prova em que o veredito da
// arte do CAMINHO-DO-CEU se apoiou. Sem esta cobaia, o alcance novo entraria sem nada provando
// que ele morde, que é a definição de decoração assinada de verde.
const COBAIAS = [
  'test/medir-save-hostil.js', 'test/rodape-verdadeiro.js', 'ferramentas/gerar-porta.js',
  'test/prints-costura.js',
];

function autotestaUmaCobaia(COBAIA) {
  const abs = path.join(RAIZ, COBAIA);
  const original = fs.readFileSync(abs, 'utf8');
  const DE = 'const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });';
  if (original.indexOf(DE) === -1) {
    console.log('  AUTOTESTE INCONCLUSIVO — a âncora sumiu de ' + COBAIA + '; conserte o autoteste, não o portão.');
    return null;
  }
  let ok = true;
  try {
    const limpo = varrer();
    const jaSujoAntes = limpo.nus.length !== 0;
    if (jaSujoAntes) { console.log('  ✗ a árvore já estava suja antes de injetar em ' + COBAIA); ok = false; }

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
    console.log('  ' + COBAIA + ' — antes: ' + limpo.nus.length + ' nus · com o defeito: ' +
      sujo.nus.length + (pegou ? ' (pegou)' : ' (NÃO pegou)'));
    if (!pegou) { console.log('  ✗ o portão não mordeu em ' + COBAIA); ok = false; }
  } finally {
    fs.writeFileSync(abs, original);   // restaura SEMPRE, inclusive se algo acima lançar
  }
  const depois = varrer();
  const pegouDepois = depois.nus.some((x) => x.indexOf(COBAIA) === 0);
  if (pegouDepois) { console.log('  ✗ a restauração de ' + COBAIA + ' não voltou ao verde'); ok = false; }
  return ok;
}

function autoteste() {
  let ok = true;
  for (const COBAIA of COBAIAS) {
    const r = autotestaUmaCobaia(COBAIA);
    if (r === null || r === false) ok = false;
  }
  const final = varrer();
  console.log('  depois de tudo restaurado -> nus: ' + final.nus.length);
  if (final.nus.length !== 0) { console.log('  ✗ a árvore não voltou inteira ao verde'); ok = false; }
  console.log(ok ? 'AUTOTESTE OK — o portão morde e solta, nas ' + COBAIAS.length + ' cobaias.' : 'AUTOTESTE FALHOU.');
  process.exit(ok ? 0 : 1);
}

// ————— 4. principal —————
if (require.main === module) {
  if (AUTOTESTE) { autoteste(); }
  else {
    const { portoes, alcance, nus } = varrer();
    console.log('portões derivados do CI: ' + portoes.size + ' · alcance cobrado (com os requires' +
      ' locais e todo test/ e ferramentas/): ' + alcance.size);
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
} else {
  // Exportado para instrumentos de teste (ex.: test/qa-92-*.js) chamarem sem disparar o CLI —
  // sem isto, medir semComentarios() de fora exige duplicar a função ou passar por
  // `child_process`, e as duas formas já causaram medição da função ERRADA nesta casa.
  module.exports = { semComentarios, launchesNus, varrer, portoesDeclarados, requeridosLocais, instrumentos };
}
