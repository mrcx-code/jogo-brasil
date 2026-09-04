// O BUILD. Ele existe para uma coisa só: continuar entregando UM ARQUIVO.
//
//   node ferramentas/construir.js
//
// O que faz, em ordem:
//   1. roda o `tsc` sobre src/jogo.ts  -> build/jogo.js
//   2. lê o molde src/index.html e troca @@CSS@@ pelo src/estilo.css e @@JS@@ pelo JS compilado
//   3. escreve o resultado em DOIS lugares, com os mesmos bytes:
//        index.html   — a raiz. É o que a Vercel publica, o que `npm start` serve e o que o
//                       `node test/smoke.js` testa. Continua sendo o arquivo do jogo.
//        dist/index.html — a pasta que o Capacitor empacota (`webDir` no capacitor.config.json).
//                       Ela existe porque `cap copy` copia a PASTA inteira para dentro do APK,
//                       e a raiz do repositório tem assets/, test/ e node_modules dentro.
//
// O que ele NÃO faz: minificar, dividir, embaralhar nome, puxar dependência. A arte continua em
// base64 dentro do JS e do HTML, e o arquivo continua abrindo sozinho no navegador, sem rede.
//
// O tsc emite JavaScript mesmo com erro de tipo. Este script recusa: se o `tsc` sair diferente
// de zero, nada é escrito. Build verde ou build nenhum.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const p = (...x) => path.join(RAIZ, ...x);

const semTsc = process.argv.includes('--sem-tsc');

// O ÚNICO HOST DE FORA QUE ESTE JOGO PODE ALCANÇAR, escrito uma vez. Ele aparece em TRÊS
// lugares que TÊM de concordar — a `connect-src` da CSP (que o navegador cobra), o
// `ENDERECO_MEDIDA` do src/jogo.ts (que é quem de fato chama) e, desde 22/08, o bloco de
// medição das PÁGINAS da plataforma — e as três cobranças saem daqui. Trocar de região ou de
// serviço é trocar UMA linha, e aí a CSP, o jogo e as páginas ficam errados juntos até que os
// três digam o mesmo — que é exatamente o barulho que uma mudança dessas tem de fazer.
// A linha mudou de arquivo em 22/08 e não de valor: ela mora em `ferramentas/medir-secao.js`,
// junto do bloco das páginas, porque duas cópias do endereço divergem em SILÊNCIO (os dois
// endereços do PostHog respondem 200 OK a qualquer coisa; o sintoma seria um painel vazio
// semanas depois — o erro de região de 10/08).
const MEDIDA_HOST = require('./medir-secao.js').MEDIDA_HOST;

if (!semTsc) {
  // `require.resolve` e não um caminho montado à mão: num WORKTREE do git o `node_modules` não
  // é copiado, e o caminho fixo `RAIZ/node_modules/...` some — o build morria com
  // MODULE_NOT_FOUND num diretório onde `npm run tipos` funcionava, porque o Node resolve
  // subindo a árvore e este script não resolvia. O caminho montado fica como último recurso.
  // Resolve o PACOTE e monta o caminho do binário a partir dele — `require.resolve` do
  // subcaminho `typescript/bin/tsc` não serve: o package.json do TypeScript declara `exports`
  // e o Node recusa qualquer subcaminho que não esteja lá.
  let tsc = path.join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!fs.existsSync(tsc)) {
    try { tsc = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc'); }
    catch (e) { /* fica o caminho de sempre, e o erro do spawn diz o que falta */ }
  }
  const r = spawnSync(process.execPath, [tsc, '-p', p('tsconfig.json')], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('\ntsc falhou — nada foi escrito. O index.html no disco continua o de antes.');
    process.exit(r.status || 1);
  }
}

const molde = fs.readFileSync(p('src', 'index.html'), 'utf8');
const css = fs.readFileSync(p('src', 'estilo.css'), 'utf8');
const jsCru = fs.readFileSync(p('build', 'jogo.js'), 'utf8');

// ---- ARTE REPETIDA PAGA UMA VEZ SÓ ----
// Os blocos de arte são GERADOS (test/inline-*.js, cortar-pacote.js), e gerador nenhum sabe
// que a folha que ele acabou de escrever é byte a byte igual a outra já embutida. Hoje isso
// custa 234 KB: `atk2` é cópia exata de `atk1` nos três capítulos, e dois quadros se repetem
// dentro de `atk1_3`. Consertar na fonte seria consertar até o próximo gerador rodar.
//
// Então o BUILD conserta, e conserta sozinho: toda literal `"data:image/...;base64,..."` que
// aparece mais de uma vez no JS vira uma entrada de `__ART` e todas as ocorrências viram
// `__ART[i]`. É reescrita de literal por referência — a mesma string, um lugar só. Sem perda
// possível: nenhum byte de imagem é reencodado.
function pagarArteUmaVez(js) {
  const RE = /"data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+"/g;
  const conta = new Map();
  for (const m of js.match(RE) || []) conta.set(m, (conta.get(m) || 0) + 1);
  const repetidas = [...conta.entries()].filter(e => e[1] > 1).map(e => e[0]);
  if (!repetidas.length) return { js, poupado: 0, n: 0 };
  const idx = new Map(repetidas.map((s, i) => [s, i]));
  const novo = 'var __ART=[' + repetidas.join(',') + '];\n'
    + js.replace(RE, (s) => (idx.has(s) ? '__ART[' + idx.get(s) + ']' : s));
  // Sintaxe conferida antes de deixar sair: literal trocada por referência é cirurgia em
  // arquivo gerado, e arquivo gerado é onde ninguém olha.
  new (require('vm').Script)(novo, { filename: 'jogo.dedup.js' });
  return { js: novo, poupado: js.length - novo.length, n: repetidas.length };
}
// ---- A ARTE DE CADA CAPÍTULO SAI DA PORTA DE ENTRADA ----
// O jogo levava 16,6 s para aceitar o primeiro toque em 3G porque trazia a arte dos doze
// capítulos antes de deixar alguém tocar no primeiro (docs/arquivo/RELATORIO-PESO.md). Aqui ela sai para
// `pack-<nome>.json`, ao lado do index.html, e o jogo a busca quando a pessoa chega no
// capítulo. Quem decide o que vai em cada pacote é `ferramentas/pacotes.js` — a MESMA tabela
// que o jogo recebe embutida logo abaixo, porque duas cópias divergiriam em silêncio.
const PACOTES = require('./pacotes.js');
const { enderecosDaArte } = require('./enderecos-arte.js');
// Um GIF 1×1 transparente. É o que fica no lugar de cada imagem que viajou: o jogo desenha
// nada até o pacote chegar, em vez de estourar. `naturalWidth === 1` é o sinal que o
// `temArte()` do src/jogo.ts usa para cair na arte do capítulo 1 enquanto espera.
const ESPERA = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function separarPacotes(js) {
  const achados = enderecosDaArte(js, PACOTES.CONTAINERS);
  // Uma literal que TAMBÉM aparece fora de qualquer pacote não sai: ela já está paga no
  // arquivo de abertura, e mandá-la embora custaria os mesmos bytes dentro do pacote sem
  // tirar um único byte da porta de entrada.
  const naAbertura = new Set();
  for (const a of achados) if (!PACOTES.pacoteDoEndereco(a.caminho)) naAbertura.add(js.slice(a.ini, a.fim));

  const packs = new Map();      // nome -> { arte: [uri], indice: Map(uri->i), itens: [[caminho, i]] }
  const cortes = [];            // [ini, fim] a trocar pelo pixel de espera
  for (const a of achados) {
    const nome = PACOTES.pacoteDoEndereco(a.caminho);
    if (!nome) continue;
    const lit = js.slice(a.ini, a.fim);
    if (naAbertura.has(lit)) continue;
    if (!packs.has(nome)) packs.set(nome, { arte: [], indice: new Map(), itens: [] });
    const p = packs.get(nome);
    let i = p.indice.get(lit);
    if (i === undefined) { i = p.arte.length; p.arte.push(JSON.parse(lit)); p.indice.set(lit, i); }
    p.itens.push([a.caminho, i]);
    cortes.push(a);
  }
  // De trás para a frente: cortar da frente moveria todos os índices seguintes.
  let saida = js;
  for (let k = cortes.length - 1; k >= 0; k--) {
    saida = saida.slice(0, cortes[k].ini) + JSON.stringify(ESPERA) + saida.slice(cortes[k].fim);
  }
  return { js: saida, packs: packs, achados: achados };
}

const separado = separarPacotes(jsCru);

// ---- E AVISA QUANDO ENTRA ARTE QUE A TABELA NÃO CONHECE ----
// `pacoteDoEndereco` devolve `null` para o que não sabe classificar, e isso é de propósito: o
// pior caso é a arte pesar na porta de entrada, nunca sumir do jogo. Mas "de propósito" e
// "esquecido" ficam idênticos em silêncio — uma pintura nova entra, ninguém acrescenta a linha
// em `ferramentas/pacotes.js`, e a abertura volta a crescer capítulo a capítulo sem que nada
// diga nada. É exatamente o modo de falha que este trabalho inteiro existe para acabar. Então
// o build CONTA e FALA. Não derruba: quem está integrando arte nova no meio de uma sessão não
// merece um build vermelho por causa de uma tabela — merece uma linha dizendo o que falta.
{
  const fora = new Map();
  const ctxDesconhecida = [];   // CTX_B64 sem forma de capítulo E sem entrada em PACK_DO_CTX_EXTRA
  for (const a of separado.achados) {
    if (PACOTES.conhecido(a.caminho)) continue;
    const nome = a.caminho[0] + '[' + a.caminho.slice(1).join('][') + ']';
    fora.set(nome, (fora.get(nome) || 0) + (a.fim - a.ini));
    if (a.caminho[0] === 'CTX_B64' && PACOTES.formaCtxDaChave(a.caminho[1]) === 'desconhecida') {
      ctxDesconhecida.push({ chave: String(a.caminho[1]), bytes: a.fim - a.ini });
    }
  }
  if (fora.size) {
    let bytes = 0;
    for (const v of fora.values()) bytes += v;
    console.warn('AVISO: ' + fora.size + ' imagem(ns) de arte NOVA não estão em nenhum pacote e pesam '
      + Math.round(bytes / 1024) + ' KB na porta de entrada — acrescente a linha em ferramentas/pacotes.js:\n  '
      + [...fora.keys()].slice(0, 12).join(', '));
  }
  // ---- PORTA-ENTRADA-CRESCE-EM-SILENCIO (03/09) — A REGRA É POR TABELA, NÃO GLOBAL ----
  // O aviso acima existe de propósito para não reprovar QUEM ESTÁ INTEGRANDO UM CAPÍTULO NOVO
  // no meio de uma sessão (chave `capN-...` cujo N ainda não está em PACK_DO_CTX_PREFIXO — a
  // tabela cresce sozinha e não há erro nenhum aí). Mas isso deixou uma classe de defeito
  // silenciosa: `CTX_B64["vao-cidade-africana"]` não tinha prefixo `capN` NENHUM — não é
  // "capítulo em obra", é uma chave que a tabela nunca teria como reconhecer sozinha, e ela
  // pagou 60,9 KB (62.371 bytes) na PORTA DE ENTRADA por semanas sem uma única linha de erro.
  // `formaCtxDaChave()` (ferramentas/pacotes.js) separa as duas causas; só a "desconhecida"
  // derruba o build.
  //
  // NÃO GENERALIZE ESTA REGEX PARA AS OUTRAS TABELAS. `QUAD_B64` tem 20 chaves e as 20 são sem
  // prefixo `capN` (`p1`..`p6`, `p07-africa`, `p08-captura`…), e `TRAV_B64` tem `mar` — as duas
  // são de propósito assim (`conhecido()` já devolve `true` para as duas sempre, então nunca
  // entram aqui). Um portão `capN` aplicado globalmente acusaria os 21 falsos positivos de uma
  // vez só (medido por nuvem-20260903T0822 em 03/09). A trava é SÓ de CTX_B64.
  if (ctxDesconhecida.length) {
    let bytes = 0;
    for (const f of ctxDesconhecida) bytes += f.bytes;
    throw new Error('CTX_B64 tem ' + ctxDesconhecida.length + ' chave(s) sem forma de capítulo (`capN-...`) '
      + 'e sem entrada em PACK_DO_CTX_EXTRA (ferramentas/pacotes.js): ' + ctxDesconhecida.map(f => f.chave).join(', ')
      + ' — ' + Math.round(bytes / 1024) + ' KB pesariam na PORTA DE ENTRADA em silêncio, sem sequer o aviso acima '
      + 'crescer a tabela sozinha um dia. Acrescente uma linha em PACK_DO_CTX_EXTRA apontando o pacote certo.');
  }
}

// A TABELA, EMBUTIDA. O jogo precisa saber, em tempo de jogo, qual pacote o capítulo em que a
// pessoa está pede. Ele deriva isso de EPOCAS (`arte`, `arteCap`, `aberturaImg`) cruzado com
// estas três tabelas — as mesmas que acabaram de decidir o corte, e não uma segunda cópia.
const mapaCtx = {};
for (const a of separado.achados) {
  if (a.caminho[0] !== 'CTX_B64') continue;
  const nome = PACOTES.pacoteDoEndereco(a.caminho);
  if (nome) mapaCtx[a.caminho[1]] = nome;
}
const tabela = {
  cena: PACOTES.PACK_DA_CENA,
  bloco: PACOTES.PACK_DO_BLOCO,
  ctx: mapaCtx,
  nomes: [...separado.packs.keys()],
};
const preambulo = 'var __PACOTES = ' + JSON.stringify(tabela) + ';\n';

const dedup = pagarArteUmaVez(preambulo + separado.js);
const js = dedup.js;
if (dedup.n) console.log('arte repetida: ' + dedup.n + ' imagens pagas uma vez só — ' + Math.round(dedup.poupado / 1024) + ' KB a menos');

for (const marca of ['@@CSS@@', '@@JS@@']) {
  if (molde.split(marca).length !== 2) throw new Error('o molde precisa de exatamente um ' + marca);
}
// O ENDEREÇO PÚBLICO, de uma linha só. O molde escreve `@@BASE@@` nas duas tags og: que
// carregam o endereço; aqui as duas recebem a MESMA string, vinda de ferramentas/dominio.js.
// Antes elas eram dois literais escritos à mão, e "mudam juntas ou a prévia quebra em
// silêncio" era um aviso em comentário — que é a forma mais fraca de garantia que existe.
const { BASE } = require('./dominio.js');
const nBase = molde.split('@@BASE@@').length - 1;
if (nBase < 1) throw new Error('o molde perdeu o @@BASE@@ — as tags og: voltaram a ter o endereço escrito à mão');
// () => x para o $& e o $' de String.replace não morderem base64 nenhum.
const saida = molde.split('@@BASE@@').join(BASE).replace('@@CSS@@', () => css).replace('@@JS@@', () => js);
console.log('endereço público: ' + BASE + ' (' + nBase + ' tags og:, uma linha em ferramentas/dominio.js)');
if (/@@[A-Z]+@@/.test(saida)) throw new Error('sobrou marca por trocar na saída: ' + saida.match(/@@[A-Z]+@@/)[0]);

// A garantia de arquivo único, cobrada aqui e não na boa-fé: nada de src/href externo, nada
// de fetch, e uma tag <script> e uma <style> apenas.
// EXCECAO canonical (24/08): a tag <link rel="canonical"> exige href por especificacao, e
// aponta para a PROPRIA URL do site — a mesma base das og:, que ja sao excecao. Nao e
// dependencia de runtime: o navegador nunca a busca, quem le e o robo de indexacao. Estreita
// de proposito — so canonical, e so para a propria BASE. Canonical para outro host cai no erro.
const okCanon = new RegExp('^<link rel="canonical" href="' + BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/[^"]*">$', 'i');
const paraChecar = saida.replace(/<link\s[^>]*rel=["']canonical["'][^>]*>/gi, (t) => (okCanon.test(t) ? '' : t));
const externo = paraChecar.match(/(?:src|href)\s*=\s*["'](?!data:)[^"']+["']/gi) || [];
if (externo.length) throw new Error('referência externa na saída: ' + externo.slice(0, 3).join(' , '));

// ---- A PORTA DE ENTRADA NÃO ENGORDA POR DESCUIDO (18/08) ----
// A exceção do arquivo único foi aprovada pelo dono em 10/08 sobre a promessa de que capítulo
// novo custa 0 KB na abertura. A promessa depende de UM mapa por container em `pacotes.js`, e
// mapa é lista escrita à mão: posição esquecida vale `null`, e `null` significa "fica embutido".
// Não dá erro, não dá aviso — só engorda a porta.
//
// FOI O QUE ACONTECEU, e o defeito era meu: os retratos foram reindexados de bloco de arte
// (4 posições) para época (13) nesta mesma manhã, e a última posição do `PACK_DO_RETRATO`
// nasceu vazia. Medido: o retrato de AINDA AQUI viajava na abertura, 16 KB pagos por quem abre
// o jogo pela primeira vez e talvez nunca chegue ao capítulo 13.
//
// A regra é de uma linha e vale para sempre: se um capítulo pede pacote, o retrato dele tem de
// viajar em UM DELES. A posição 0 é a exceção declarada — PINDORAMA é o chão que existe
// enquanto os outros pacotes viajam, e a arte dele nunca sai da abertura por decisão.
{
  const P = require('./pacotes.js');
  // Conta as épocas lendo a fonte: o número de posições do mapa tem de acompanhar o de capítulos,
  // e é justamente quando um capítulo entra que a posição nova nasce vazia.
  // `arteCap:` é o marcador porque toda época declara um e nada mais no arquivo o usa — mas ele
  // aparece também DENTRO de um comentário que explica a regra, e contar essa linha dava 14 onde
  // há 13. As linhas de comentário saem antes de contar; a régua tem de contar o código.
  const fonteEp = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'jogo.ts'), 'utf8');
  const idsEp = fonteEp.split(/\r?\n/)
    .filter(function (l) { const t = l.trim(); return !t.startsWith('//') && !t.startsWith('*') && /\barteCap:\s*\d/.test(t); })
    .length;
  const mapa = P.PACK_DO_RETRATO;
  if (!Array.isArray(mapa)) throw new Error('pacotes.js parou de exportar PACK_DO_RETRATO — a porta de entrada ficou sem trava');
  const vazias = [];
  for (let i = 1; i < mapa.length; i++) if (!mapa[i]) vazias.push(i);
  if (vazias.length) {
    throw new Error('PACK_DO_RETRATO tem posição vazia em ' + vazias.join(', ') +
      ' — o retrato desse capítulo viaja na PORTA DE ENTRADA. Aponte-o para um dos pacotes que ' +
      'o capítulo já pede (só a posição 0, do capítulo 1, pode ser null).');
  }
  if (idsEp && mapa.length !== idsEp) {
    throw new Error('PACK_DO_RETRATO tem ' + mapa.length + ' posições e há ' + idsEp +
      ' épocas — capítulo novo entrou sem lugar no mapa, e o retrato dele vai pagar na abertura.');
  }
}

// ---- O CONTRATO DA REDE, COBRADO ----
// A trava acima cobra `src=` e `href=`. Ela NÃO vê um `fetch()`, e por isso ela sozinha virou
// uma garantia que só parecia existir no dia em que o jogo passou a buscar os pacotes de arte
// (achado do docs/arquivo/RELATORIO-PESO.md, §5). Trava que não acompanha o contrato dá falsa segurança.
//
// O contrato, escrito por extenso. O jogo pode alcançar DUAS coisas e nada mais:
//   (a) o pacote de arte do PRÓPRIO domínio. Um caminho relativo, montado por uma função só, a
//       partir de um nome de pacote. Sem host, sem protocolo, sem barra inicial — nada que
//       possa apontar para fora;
//   (b) UM endereço de fora, que é o da contagem anônima (PostHog, região EU), escrito por
//       extenso numa constante e em nenhum outro lugar. Ele entrou em 10/08 e é a segunda vez
//       na vida deste arquivo que a rede abre — a primeira foi a carga sob demanda da arte.
// Cinco cobranças, e cada uma pega um jeito diferente de furar isto:
verificarRede(saida);
function verificarRede(txt) {
  // 1. Nenhuma OUTRA porta para a rede. `fetch` é a única, e as abaixo não existem no jogo.
  //    `sendBeacon` continua na lista mesmo agora que há medição: seria o jeito "natural" de
  //    mandar o "onde parou" de uma aba fechando, e é justamente por ser natural que ele tem
  //    de continuar exigindo uma decisão — `fetch` com `keepalive` faz o mesmo e passa por
  //    todas as cobranças abaixo, que `sendBeacon` não tem como passar.
  const outrasPortas = txt.match(/\b(XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|navigator\.connection)\b|\bimport\s*\(/g) || [];
  if (outrasPortas.length) throw new Error('porta de rede que o contrato não prevê: ' + outrasPortas.slice(0, 3).join(' , '));

  // 2. Todo `fetch(` é UMA DAS DUAS formas. Conta as chamadas e conta as que casam com cada
  //    forma exata; se a soma divergir, apareceu uma chamada com outro argumento — que é
  //    exatamente como uma terceira porta entraria sem ninguém notar.
  const chamadas = (txt.match(/\bfetch\s*\(/g) || []).length;
  const doPacote = (txt.match(/\bfetch\(caminhoPacote\([A-Za-z_$][\w$]*\)\)/g) || []).length;
  const daMedida = (txt.match(/\bfetch\(ENDERECO_MEDIDA,\s*\{/g) || []).length;
  if (chamadas !== doPacote + daMedida) {
    throw new Error('há ' + chamadas + ' chamada(s) a fetch(), ' + doPacote
      + ' com a forma `fetch(caminhoPacote(nome))` e ' + daMedida
      + ' com a forma `fetch(ENDERECO_MEDIDA, {...})` — o resto alcança algo que o contrato não prevê');
  }

  // 3. E a função que monta o caminho é literalmente esta, ou o item 2 vira teatro: bastaria
  //    `caminhoPacote` devolver "https://qualquer.coisa" para o contrato estar furado com a
  //    trava verde. A forma é cobrada byte a byte sobre a SAÍDA do tsc.
  if (doPacote) {
    const f = txt.match(/function caminhoPacote\([^)]*\)\s*\{[^{}]*\}/);
    if (!f) throw new Error('há fetch(caminhoPacote(...)) mas nenhuma função caminhoPacote() na saída');
    if (!/^function caminhoPacote\(([A-Za-z_$][\w$]*)\)\s*\{\s*return "pack-" \+ \1 \+ "\.json";\s*\}$/.test(f[0])) {
      throw new Error('caminhoPacote() deixou de montar um caminho relativo do próprio domínio:\n' + f[0]);
    }
  }

  // 3b. E pelo mesmo motivo, o endereço da medição é cobrado byte a byte — `ENDERECO_MEDIDA`
  //     ser uma variável não vale nada se ela puder virar qualquer coisa. Junto com ele vai a
  //     cobrança que MAIS importa neste arquivo inteiro: a chave tem de começar com `phc_`.
  //     `phc_` é o prefixo da chave PUBLICÁVEL do PostHog, a que só serve para MANDAR evento.
  //     Uma chave pessoal ou de serviço (`phx_`, `phs_`) num jogo que roda no navegador de
  //     outra pessoa é a conta inteira entregue a quem abrir o "ver código-fonte" — e é o tipo
  //     de erro que passa despercebido para sempre porque tudo continua funcionando.
  if (daMedida) {
    const c = txt.match(/const ENDERECO_MEDIDA = "[^"]*";/);
    if (!c || c[0] !== 'const ENDERECO_MEDIDA = "' + MEDIDA_HOST + '/i/v0/e/";') {
      throw new Error('ENDERECO_MEDIDA deixou de ser o endereço que a CSP abre:\n  achei: '
        + (c ? c[0] : '(nenhuma constante)') + '\n  espero: const ENDERECO_MEDIDA = "' + MEDIDA_HOST + '/i/v0/e/";');
    }
    const k = txt.match(/const MEDIDA_CHAVE = "([^"]*)";/);
    if (!k) throw new Error('há medição e nenhuma constante MEDIDA_CHAVE na saída');
    if (!/^phc_[A-Za-z0-9]{20,}$/.test(k[1])) {
      throw new Error('MEDIDA_CHAVE não é uma chave PUBLICÁVEL do PostHog (prefixo `phc_`): "'
        + k[1].slice(0, 8) + '…" — chave de serviço NUNCA entra num arquivo que roda no navegador de outra pessoa');
    }
  }

  // 3.b. E A CHAVE DE **LEITURA** NÃO PODE ESTAR NA SAÍDA, EM LUGAR NENHUM (23/08).
  //
  //    A cobrança acima olha uma constante só. Esta varre o arquivo inteiro, e guarda outra
  //    coisa: a chave PESSOAL do PostHog (`phx_`), que o `ferramentas/ler-medicao.js` usa para
  //    LER a medição. Ela é de outra natureza que a publicável — quem a tem consulta o projeto
  //    inteiro —, e por isso ela mora em variável de ambiente ou em `ferramentas/posthog.local`
  //    (gitignored), criada pelo dono, e nenhuma sessão de Claude a vê.
  //
  //    O modo de falhar que isto impede é banal e por isso provável: alguém cola a chave num
  //    comentário para "testar rápido", o build embute, e ela sai publicada em produção — de
  //    onde não se tira, porque já foi baixada. Chave publicada é chave queimada; a única
  //    defesa que funciona é a que não depende de ninguém lembrar.
  {
    const vaz = txt.match(/phx_[A-Za-z0-9]{8,}/);
    if (vaz) {
      throw new Error('a saída contém uma chave PESSOAL do PostHog ("' + vaz[0].slice(0, 10)
        + '…"): ela LÊ o projeto inteiro e nunca pode ser publicada. Tire-a do fonte e ponha em '
        + '`ferramentas/posthog.local` (gitignored) ou na variável POSTHOG_LEITURA.');
    }
  }

  // 4. E a CSP é PREGADA, diretiva por diretiva. É ela que faz o navegador cobrar tudo o que
  //    está acima mesmo que o código mude; relaxá-la por conveniência é o começo de não ter
  //    CSP (§3.2 do CLAUDE.md). Mudar esta tabela é a forma de dizer, no commit, o que passou
  //    a ser permitido — e é deliberadamente chata de mudar por acidente.
  const CSP_ESPERADA = {
    'default-src': "'none'",        // nada, por padrão
    'script-src': "'unsafe-inline'",// o script mora na página
    'style-src': "'unsafe-inline'", // o estilo também
    'img-src': 'data:',             // toda arte é data: — inclusive a que vem dentro do pacote
    // A ÚNICA diretiva que já mudou desde que esta tabela existe, e ela mudou duas vezes, as
    // duas em 10/08: era 'none', virou 'self' com a carga sob demanda da arte, e ganhou UM
    // host com a contagem anônima. 'self' é o próprio site; o host é escrito inteiro, com
    // esquema — nenhum curinga, nenhum '*', nenhum `https:` solto. Nada mais passa.
    // O host sai de MEDIDA_HOST, que é a MESMA constante que cobra o ENDERECO_MEDIDA do jogo:
    // duas cópias do endereço divergiriam em silêncio, e o sintoma seria a medição parar de
    // chegar sem nada quebrar — o pior tipo de defeito para uma ferramenta de medição.
    'connect-src': "'self' " + MEDIDA_HOST,
    'base-uri': "'none'",
    'form-action': "'none'",
  };
  const m = txt.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/);
  if (!m) throw new Error('a Content-Security-Policy sumiu do <head>');
  const achada = {};
  m[1].split(';').forEach(function (d) {
    const t = d.trim(); if (!t) return;
    const i = t.indexOf(' ');
    achada[i < 0 ? t : t.slice(0, i)] = i < 0 ? '' : t.slice(i + 1).trim();
  });
  const nomes = Object.keys(CSP_ESPERADA).concat(Object.keys(achada));
  for (const d of nomes) {
    if (achada[d] !== CSP_ESPERADA[d]) {
      throw new Error('a CSP mudou e a trava do build não sabe disso: `' + d + '` está "'
        + (achada[d] === undefined ? '(ausente)' : achada[d]) + '" e a tabela em ferramentas/construir.js espera "'
        + (CSP_ESPERADA[d] === undefined ? '(ausente)' : CSP_ESPERADA[d]) + '"');
    }
  }
}
// A PRÉVIA DO LINK. `compartilhar.png` é a ÚNICA coisa que sai do arquivo único, e ela não é
// carregada pelo jogo em momento nenhum: quem a lê é o robô que monta o cartão do link no
// WhatsApp e no Twitter, a partir das tags og: do <head>. Vai para `dist/` porque é de lá que
// a Vercel publica (ver vercel.json). Sem esta cópia, as tags apontam para um 404 e a prévia
// volta a ser o retângulo cinza — em silêncio, porque robô de rede social não reclama.
const nScript = (saida.match(/<script/gi) || []).length;
const nStyle = (saida.match(/<style/gi) || []).length;
if (nScript !== 1 || nStyle !== 1) throw new Error('esperava 1 <script> e 1 <style>, achei ' + nScript + ' e ' + nStyle);

// ============================================================================
// O PORTÃO DE SEGREDO — vale para TUDO o que é publicado, não só para o dashboard.
//
// Ele nasceu em 21/08 (A12) olhando só `dashboard/`, porque era ali que a chave do Supabase
// morava. A re-auditoria (N7) derrubou o recorte no mesmo dia, e com razão: o dashboard não é
// especial, é só o primeiro. Quem colar uma `service_role` numa página da plataforma, num
// pacote de arte ou num JSON de seção publica exatamente o mesmo segredo pelo mesmo domínio —
// e a varredura antiga passaria ao largo, verde. O critério certo é o DESTINO, não a origem:
// se está indo para `dist/`, um robô da internet vai poder ler.
//
// Três formas cobertas, e a razão de cada uma:
//   sb_secret_    chave secreta nova do Supabase
//   service_role  o papel — aparece no payload do JWT legado e em qualquer comentário
//   eyJ....eyJ... a forma de um JWT (a `anon` legada também tem essa forma; por isso ela não
//                 entra: quem precisar dela usa a publicável `sb_publishable_`)
//
// SÓ TEXTO É VARRIDO. Um JPEG de 200 KB de bytes aleatórios pode casar `eyJ[\w-]{20,}\.` por
// puro acaso e derrubar o build por nada — e segredo colado por engano mora em arquivo de
// texto, nunca dentro de uma imagem. O recorte é por extensão e está escrito aqui para a
// próxima pessoa saber que ele é uma escolha, não um esquecimento.
// A LISTA VIROU NEGRA em 23/08, e a razão é um achado da segurança: a lista BRANCA de extensões
// era uma lista de origem disfarçada de critério de destino. Faltava `.md` — e havia um `.md`
// publicado (`territorio/PINOS-PROPOSTA.md`); a isca com `service_role` chegou ao `dist/` com o
// build saindo ZERO. Invertido: só o que é comprovadamente BINÁRIO escapa, e extensão nova passa
// a ser varrida por padrão em vez de ganhar passe livre. O motivo original do recorte continua
// valendo e é só ele: um JPEG de bytes aleatórios pode casar `eyJ[\w-]{20,}\.` por acaso.
const SEGREDO = /sb_secret_|service_role|eyJ[\w-]{20,}\.[\w-]{20,}\./;
const BINARIO = /\.(jpe?g|png|webp|gif|ico|avif|bmp|woff2?|ttf|otf|eot|mp[34]|ogg|wav|zip|gz|pdf)$/i;
function guardaSegredo(destino, bytes) {
  if (BINARIO.test(destino)) return bytes;
  const achado = bytes.toString('utf8').match(SEGREDO);
  if (achado) {
    throw new Error('SEGREDO indo para ' + path.relative(RAIZ, destino).split(path.sep).join('/')
      + ': achei "' + achado[0].slice(0, 16) + '…" — chave de serviço NUNCA vai para uma página'
      + ' publicada. A do navegador é a publicável (sb_publishable_/phc_/anon); a service_role'
      + ' fica no servidor e só nele. Um segredo publicado não se desfaz com revert: revogue-o.');
  }
  return bytes;
}
// As duas portas por onde tudo passa. Quem escrever em dist/ por fora delas está furando o
// portão — e é por isso que elas têm nome curto: para não haver desculpa de conveniência.
function escreverPublicado(destino, conteudo) {
  fs.writeFileSync(destino, guardaSegredo(destino, Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(String(conteudo))));
}
function copiarPublicado(origem, destino) {
  escreverPublicado(destino, fs.readFileSync(origem));
}

// ============================================================================
// O GUARDA DO ROTEIRO — nenhum item PUBLICADO pode descrever uma defesa que ainda
// não está no lugar. Achado do jurídico, 22/08.
//
// O QUE ACONTECEU. A fila interna passou a ser publicada em `/dashboard/backlog.json`, e um
// item com estado `do-dono` explicava, num endereço que responde 200 a quem pedir, o que cada
// defesa AINDA NÃO aplicada permitia — em português claro, com o passo a passo. Isso não é
// transparência: é roteiro. Transparência é contar o que já se protegeu; contar o que falta
// proteger, com o efeito descrito, é escrever o ataque no lugar de quem o faria. O texto dos
// dois itens foi cortado no mesmo dia (commit 47df2a1) — mas conteúdo volta, e o que não volta
// é um portão. Este é o portão.
//
// A RÉGUA, e ela cabe numa linha: **item não-concluído não fala de PIN, senha, token, conta,
// vulnerabilidade, loopback nem de forma de autenticação.** Item CONCLUÍDO fala à vontade — ele
// descreve defesa QUE JÁ EXISTE, e aí a descrição não entrega nada que não esteja de pé. É por
// isso que o estado é o critério, e não a palavra sozinha.
//
// FRONTEIRA DE PALAVRA, e ela é a diferença entre portão e estorvo: `pin` cru casa dentro de
// `pinos` e `pintados`, que enchem o backlog (O TERRITÓRIO é uma placa de PINOS). Medido nos 34
// itens reais no dia em que isto entrou: **zero recusas**, e `pinos do territorio`/`os pinos
// pintados` não casam enquanto `PIN da mesa` casa.
//
// A ARMADILHA QUE FICA, escrita aqui para a próxima pessoa não descobrir por build vermelho:
// `\bPIN\b` casa também em `pin-local` (o hífen é fronteira), então um item novo cujo campo
// `territorio` cite `ferramentas/pin-local.js` cai aqui. É recusa CORRETA por regra e chata na
// prática; o conserto é reescrever o item, não afrouxar a lista. Mexer nesta lista tem de ser
// chato de fazer por acidente — é o mesmo espírito da tabela da CSP.
//
// SÓ O BACKLOG PASSA POR AQUI, e é escolha: ele é o único arquivo publicado que é uma FILA DE
// TRABALHO INTERNA, com estado por item. Página de seção não tem "o que ainda não fiz".
const ROTEIRO = [
  [/\bPINs?\b/i, 'PIN'],
  [/\bsenhas?\b/i, 'senha'],
  [/\btokens?\b/i, 'token'],
  [/service_role/i, 'service_role'],
  [/\bcria(?:r|ndo)?\s+conta\b/i, 'cria conta'],
  [/vulnerab/i, 'vulnerabilidade'],
  [/\bloopback\b/i, 'loopback'],
  [/grant_type/i, 'grant_type'],
];
function guardaRoteiro(origem, bytes) {
  let fila;
  try { fila = JSON.parse(bytes.toString('utf8')); }
  catch (e) {
    throw new Error(origem + ' nao e JSON valido (' + e.message + ') — o dashboard le este'
      + ' arquivo por fetch e o guarda do roteiro precisa ler os estados dos itens.');
  }
  const itens = Array.isArray(fila) ? fila : (fila.itens || []);
  for (const item of itens) {
    if (String(item.estado || '') === 'concluido') continue;
    for (const [campo, valor] of Object.entries(item)) {
      const texto = Array.isArray(valor) ? valor.join(' ') : String(valor == null ? '' : valor);
      for (const [re, nome] of ROTEIRO) {
        const i = texto.search(re);
        if (i < 0) continue;
        throw new Error('ROTEIRO indo para ' + origem + ': o item "' + (item.id || '(sem id)')
          + '" esta em "' + item.estado + '" (nao concluido) e o campo `' + campo + '` diz "'
          + nome + '" — …' + texto.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, ' ') + '…\n'
          + '  Nenhum item publicado pode descrever uma defesa que ainda nao esta no lugar: este'
          + ' arquivo e servido em /dashboard/backlog.json e responde 200 a quem pedir. Reescreva'
          + ' o item sem dizer o que a falta permite (o QUE fazer basta; o EFEITO DE NAO TER'
          + ' FEITO e o roteiro), ou marque-o concluido quando a defesa estiver de pe.');
      }
    }
  }
  return bytes;
}

escreverPublicado(p('index.html'), saida);

// ============================================================================
// O `dist/` SE PUBLICA INTEIRO OU NÃO SE PUBLICA — a pasta de obra e a troca no fim.
//
// O DEFEITO, achado pela segurança em 22/08: o build escrevia direto em `dist/`, arquivo a
// arquivo. Quando ele MORRIA no meio — e ele tem motivos para morrer no meio, todos de
// propósito: o guarda de segredo, a tabela da CSP, a cobrança da chave `phc_` — o que já
// tinha sido escrito ficava lá, misturado com os bytes da build ANTERIOR. Nada avisa: a pasta
// existe, as páginas abrem, e uma delas é de ontem. Na Vercel isso é inócuo (build vermelha
// não promove nada), mas `npm run servir` e o `cap sync` leem esta pasta do disco, e serviriam
// a mistura calados.
//
// O CONSERTO é a pasta de obra: tudo vai para `dist.tmp/`, e só no ÚLTIMO passo, com todo byte
// já escrito e todo portão já passado, o `dist/` velho sai e o novo entra por um rename. Um
// build que falha deixa o `dist/` ANTERIOR intacto — coerente consigo mesmo, que é a única
// coisa que se pode prometer de bytes que ninguém vai reconferir. Foi escolhido contra "limpar
// o dist no início" porque aquele troca uma pasta misturada por uma pasta pela metade: o
// `npm run servir` passaria a devolver 404 no lugar de conteúdo velho, o que é mais honesto,
// mas ainda é uma pasta que ninguém pediu. Aqui não existe estado intermediário publicável.
//
// A pasta de obra é limpa ANTES, não depois: um build morto no meio deixa `dist.tmp/` para trás
// e ela não pode virar sedimento (está no .gitignore junto com `dist/`, pelo mesmo motivo).
const DIST = p('dist');
const DIST_OBRA = p('dist.tmp');
const d = (...partes) => path.join(DIST_OBRA, ...partes);
fs.rmSync(DIST_OBRA, { recursive: true, force: true });
fs.mkdirSync(DIST_OBRA, { recursive: true });
// A PORTA DA PLATAFORMA É A RAIZ (D-home, dono 20/08): o jogo vira /jogo (o chamariz) e a home
// da plataforma vira dist/index.html. A RAIZ VERSIONADA CONTINUA SENDO O JOGO — o smoke e a régua
// leem o index.html da raiz e precisam medir o JOGO, não a porta. No dist, o jogo vai para
// dist/jogo/ com os pacotes de arte AO LADO: o fetch de `pack-*.json` é RELATIVO (ver
// caminhoPacote), então a arte quebraria se o jogo mudasse de pasta e os pacotes ficassem na raiz.
fs.mkdirSync(d('jogo'), { recursive: true });
escreverPublicado(d('jogo', 'index.html'), saida);
if (fs.existsSync(p('plataforma', 'index.html'))) {
  copiarPublicado(p('plataforma', 'index.html'), d('index.html'));
  console.log('  plataforma/index.html -> dist/index.html (a PORTA, na raiz)');
} else {
  escreverPublicado(d('index.html'), saida);
  console.log('  AVISO: plataforma/index.html nao existe — dist/index.html ficou com o JOGO (sem porta)');
}
if (fs.existsSync(p('compartilhar.jpg'))) {
  copiarPublicado(p('compartilhar.jpg'), d('compartilhar.jpg'));
  copiarPublicado(p('compartilhar.jpg'), d('jogo', 'compartilhar.jpg'));
}

// A MESA, publicada num endereço que abre SEM LOGIN. Ela nasceu como artifact privado, e o
// dono não conseguia escanear o QR dela no celular porque a página pedia login (19/08). Decisão
// dele: publicar no próprio domínio. Vai para `dist/mesa/` porque é `dist/` que a Vercel serve
// (ver vercel.json) — uma pasta solta na raiz não seria publicada, e o sintoma seria um 404 só
// descoberto depois do push.
//
// DUAS TRAVAS, e as duas de propósito: a página carrega `noindex` no <head> E o `robots.txt`
// repete a instrução para o domínio. Um dos dois sozinho já falhou em muito site — e isto é
// material interno de trabalho servido em endereço público só pela conveniência do QR.
//
// A mesa NÃO passa pelas cobranças do arquivo único: ela não é o jogo, não carrega chave, não
// fala com a rede e não entra no APK. ATÉ 01/09 este comentário dizia que ela tinha licença para
// as fontes do Google, que o jogo não pode ter — a seguranca achou, em 23/08 (item
// `dashboard-sem-google`), que isso contradizia o próprio rodapé da página ("sem rastreio, sem
// cookie de terceiro, sem perfil": carregar fonte de um terceiro a cada visita entrega IP e
// User-Agent à Google, o que a frase não cobria). A licença SAIU: o dashboard usa a mesma serifa
// de sistema que as outras 5 páginas da plataforma desde 22/08 (ver `ferramentas/chrome-
// plataforma.js`), e a checagem logo abaixo (`conferirCspDashboard`) é o que garante que ela não
// volta em silêncio.
//
// O PORTÃO DE SEGREDO É O MESMO DE TODO MUNDO, e deixou de ser um privilégio desta pasta
// (N7 da re-auditoria, 21/08): ele mora em `guardaSegredo`/`copiarPublicado`, lá em cima, e
// vale para cada byte que entra em `dist/`. O dashboard continua sendo o lugar mais provável
// do erro — é a única página que fala com um backend com contas de verdade, e colar a
// `service_role` "só para testar" dá acesso TOTAL ao banco ignorando RLS, o que faria da fila
// fechada em fila-auth.sql um enfeite no mesmo instante — mas provável não é exclusivo.
//
// A CSP DO DASHBOARD NÃO ERA PREGADA POR NADA (achado do dev-plataforma, 01/09, ao consertar o
// item acima): `verificarRede()` (a função com a tabela `CSP_ESPERADA`, lá em cima) só é chamada
// sobre `saida` — o `index.html` do JOGO. O `dashboard/index.html` é copiado byte a byte
// (`copiarPublicado`) e nunca passou por checagem de CSP nenhuma, em build nenhum. A função
// abaixo fecha esse buraco com a MESMA disciplina (tabela por extenso, sem curinga, falha o
// build se a diretiva mudar sem a tabela acompanhar) — mas é a SUA tabela: o dashboard fala com
// um host diferente (Supabase, não o jogo) e não tem `img-src data:` nem pacote de arte.
function conferirCspDashboard(origemHtml) {
  const txt = fs.readFileSync(origemHtml, "utf8");
  const CSP_ESPERADA_DASHBOARD = {
    "default-src": "'self'",
    "connect-src": "'self' https://hdhqziqvrthxtgyraemk.supabase.co",
    "style-src": "'self' 'unsafe-inline'",
    "img-src": "'self' data:",
    "script-src": "'unsafe-inline'",
    "object-src": "'none'",
    "form-action": "'none'",
    "base-uri": "'none'",
  };
  const m = txt.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/);
  if (!m) throw new Error("dashboard/index.html perdeu a Content-Security-Policy do <head>");
  const achada = {};
  m[1].split(";").forEach(function (d) {
    const t = d.trim(); if (!t) return;
    const i = t.indexOf(" ");
    achada[i < 0 ? t : t.slice(0, i)] = i < 0 ? "" : t.slice(i + 1).trim();
  });
  const nomes = Object.keys(CSP_ESPERADA_DASHBOARD).concat(Object.keys(achada));
  for (const nome of nomes) {
    if (achada[nome] !== CSP_ESPERADA_DASHBOARD[nome]) {
      throw new Error("a CSP do dashboard mudou e a trava do build não sabe disso: `" + nome
        + "` está \"" + (achada[nome] === undefined ? "(ausente)" : achada[nome])
        + "\" e a tabela em ferramentas/construir.js (conferirCspDashboard) espera \""
        + (CSP_ESPERADA_DASHBOARD[nome] === undefined ? "(ausente)" : CSP_ESPERADA_DASHBOARD[nome]) + "\"");
    }
  }
}

// O HOST DA MEDIÇÃO NO vercel.json — a CONTA DE 02/09, PAGA EM 03/09 (item
// `csp-host-nao-sai-da-constante`).
//
// A CSP das PÁGINAS (`conferirCspDashboard` acima, e a do jogo em `verificarRede`) já cobrava o
// próprio <head>; o cabeçalho que a Vercel manda para as quatro famílias de rota que MEDEM (/,
// /historia, /glossario, /de-onde-vem, /territorio — cada uma em até três formas) vive só em
// `vercel.json`, e o host está `https://us.i.posthog.com` DIGITADO ali, à mão, treze vezes. Duas
// cópias do mesmo endereço divergem em SILÊNCIO: os dois hosts do PostHog respondem 200 OK a
// qualquer coisa, e o sintoma seria um painel vazio semanas depois — o mesmo erro de região de
// 10/08, agora nas páginas em vez do jogo (CLAUDE.md §3).
//
// POR QUE COBRAR E NÃO GERAR, e a pergunta foi feita de propósito porque gerar é a saída bonita.
// `vercel.json` é lido pela VERCEL, do commit, ANTES de o `buildCommand` rodar — escrever esse
// arquivo dentro do build é um no-op na implantação que importa (vercel/community discussão 3323,
// resposta de mcsdevv em 29/04/2021: "this is not something that's possible currently"; o caminho
// que existe hoje para configuração gerada é o `vercel.ts`, que é outra decisão e é do dono). Um
// build que gerasse o `vercel.json` deixaria o disco local certo e a produção servindo os bytes
// velhos: fonte dupla com cara de única, que é PIOR que treze literais honestos. E o repositório
// já respondeu esta pergunta duas vezes do mesmo jeito — o host em `src/index.html` e o
// `ENDERECO_MEDIDA` em `src/jogo.ts` também são literais escritos à mão e COBRADOS byte a byte
// contra `MEDIDA_HOST` (medido em 03/09: trocar a região no `src/index.html` derruba o build,
// exit 1). "Sair de uma constante só" aqui significa NENHUM literal poder divergir dela sem o
// build recusar — e é essa a garantia, não a de que ninguém digitou.
//
// O QUE MUDOU DE MÉTODO, e é a correção de uma promessa que este comentário fazia e não cumpria.
// A versão de 02/09 dizia que "um literal errado (região trocada, host de teste esquecido, ERRO
// DE DEDO) derruba o build". Não derrubava: ela varria o TEXTO com uma regex, e quem não casasse
// com a regex era invisível. Medido em 03/09, injetando na 2ª ocorrência (a regra `/historia`,
// que nenhuma rota publicada resolve, logo o `test/csp-paginas.js` também não a vê), com o exit
// code lido do comando e não do tubo: `http://` rebaixado, `psthog`, o escape unicode do `p` e o
// `connect-src` removido saíam BUILD **exit 0** — e ainda imprimindo "12 ocorrência(s), todas ==
// MEDIDA_HOST", porque a contagem não era cobrada contra nada. Quatro de cinco passavam.
//
// A CORREÇÃO É COBRAR O JSON, NÃO O TEXTO. Depois do `JSON.parse` o escape unicode já virou letra,
// o esquema está inteiro dentro do valor, e cada diretiva de cada regra é uma string que se
// compara byte a byte — sem regex e sem lista de grafias possíveis.
//
// O QUE MUDOU NA SEGUNDA VOLTA, 03/09 (item `csp-tabela-de-rotas-e-conjunto`), e as três razões
// foram MEDIDAS com exit code real ANTES de qualquer conserto, injetando em disco e restaurando:
//   · `/territorio` e `/glossario` TROCANDO de `source` (o território perde o `blob:` que faz a
//     placa 3D desenhar; o glossário ganha CSP mais frouxa que a dele) -> BUILD **exit 0**;
//   · a regra `/historia` DUPLICADA -> BUILD **exit 0**, e ainda imprimindo "14 rota(s) com
//     connect-src … (tabela ROTAS_QUE_MEDEM, 13 rotas)" — o mesmo número impresso e não comparado
//     que esta cobrança tinha acabado de curar do lado do texto, sobrevivendo dentro do conserto;
//   · `script-src 'unsafe-inline' https://exfil.example.com` na regra `/historia` -> BUILD
//     **exit 0** e `node test/qa-vercel-host.js` **exit 0**.
// As três têm a mesma causa: a cobrança olhava UMA diretiva (`connect-src`) e comparava a lista de
// rotas como CONJUNTO. Conjunto não vê troca (o conjunto é o mesmo) nem duplicata (idem), e uma
// diretiva não vê as outras sete. E as regras que nenhuma rota publicada decide não tinham portão
// nenhum sobre as outras diretivas.
//
// QUANTAS SÃO ESSAS REGRAS: **14 de 22**, e o número aqui esteve ERRADO. A primeira volta deste
// bloco escreveu "oito" — contando só a família de seção (`/historia`, `/glossario`,
// `/de-onde-vem`, `/territorio`, nas formas sem barra e com barra) e esquecendo `/mesa`, `/jogo` e
// `/dashboard`, que sofrem exatamente a mesma coisa, também nas duas formas. O QA de 03/09 pegou.
// Recontado com o resolvedor last-match-wins do `test/csp-paginas.js` contra as 8 páginas
// enumeradas de `dist/` (`/`, `/dashboard/`, `/de-onde-vem/`, `/glossario/`, `/historia/`,
// `/jogo/`, `/mesa/`, `/territorio/`), regra a regra:
//   · 7 formas SEM barra final (`/historia`, `/glossario`, `/de-onde-vem`, `/territorio`,
//     `/mesa`, `/jogo`, `/dashboard`) não casam com rota publicada NENHUMA;
//   · 7 formas COM barra final casam, mas a forma `(.*)` vem depois e sobrescreve por
//     last-match-wins;
//   · decidem cabeçalho de verdade 8: `/` e as sete `(.*)`.
// Só `/` é literal e decisiva ao mesmo tempo. A conta velha subestimava o problema em 6 regras —
// e era do lado errado: menos cobertura do que se pensava, não mais.
//
// E O NÚMERO NÃO DEPENDE DA DÚVIDA DE PRECEDÊNCIA (a de baixo). Recontado pela hipótese
// CONTRÁRIA, primeira-que-casa-vence, dá **14 de 22 também** — o que muda é QUAIS 14: pela última
// vencem as 7 formas `(.*)`, pela primeira vencem as 7 com barra final. Estável nas duas: `/`
// decide, e as 7 formas SEM barra final não casam com página publicada nenhuma. Por isso o
// `test/qa-vercel-quadro.js` conta pelas DUAS ordens e exige 14 nas duas, em vez de escolher uma
// hipótese e envelhecer com ela.
//
// 04/09, DUAS CORREÇÕES NESTE PARÁGRAFO, e as duas foram medidas, não relidas:
//   · OS NÚMEROS ENVELHECERAM. `/privacidade` entrou nas três formas (item `pagina-privacidade`),
//     então são **16 de 25**, não 14 de 22 — quem já está certo é o `INERTES_ESPERADAS = 16` do
//     `test/qa-vercel-quadro.js`, que é asserção; a prosa aqui é que ficou para trás, que é
//     exatamente a doença que este bloco inteiro existe para tratar;
//   · A DÚVIDA DE PRECEDÊNCIA FOI FECHADA (bloco lá embaixo, antes de `CSP_SECAO_VERCEL`): a
//     resposta é (c) — TODAS as que casam rodam —, e as formas SEM barra final não decidem nada
//     por causa do 308 do `trailingSlash`, que termina o roteamento antes delas, e NÃO por
//     precedência de cabeçalho. Contar pelas duas ordens continua certo e continua barato.
//
// O QUE COBRA AGORA, e cada item existe por uma classe medida:
//   1. o QUADRO_DE_ROTAS abaixo é a lista de `source` do arquivo, NA ORDEM e com repetição —
//      multiconjunto, não conjunto. Pega rota trocada, duplicada, apagada, nova e reordenada. A
//      ORDEM conta porque a Vercel aplica a ÚLTIMA regra que casa: mudar a ordem muda qual regra
//      decide o cabeçalho servido;
//   2. a CSP de cada rota é comparada com a do quadro DIRETIVA POR DIRETIVA, nos dois sentidos
//      (diretiva a mais reprova tanto quanto diretiva a menos) — é a mesma disciplina da
//      `CSP_ESPERADA` do <head> e da `CSP_ESPERADA_DASHBOARD`, agora estendida às 22 regras;
//   3. nenhum CURINGA em valor nenhum (CLAUDE.md §3: por extenso, com esquema, `*` nunca);
//   4. nenhuma CSP repete diretiva. Isto não é zelo: o parser aqui monta um objeto e fica com a
//      ÚLTIMA ocorrência, enquanto o navegador (CSP3) ignora a repetida e aplica a PRIMEIRA — sem
//      esta linha, uma segunda `script-src` frouxa escondida antes da conferida passaria pela
//      comparação acima. Quem cobra isso no arquivo inteiro é `test/qa-vercel-diretiva-repetida.js`;
//      aqui a mesma cobrança existe para que a comparação de forma inteira seja SÃ, não para
//      substituí-lo;
//   5. os DOIS números impressos são comparados ANTES de serem impressos: o de regras (contra o
//      tamanho do quadro, pelo item 1) e o de rotas que medem (contra `ROTAS_QUE_MEDEM`, que é
//      DERIVADO do quadro — quem declara `connect-src` mede);
//   6. nenhuma menção a "posthog" sobra no texto fora de uma rota que o quadro diz que mede — e a
//      comparação passou a ser contra o QUADRO, não contra uma contagem tirada do mesmo arquivo.
//      Era essa a brecha da duplicata: 14 menções == 14 rotas conferidas fecha consigo mesma.
//      Consequência aceita e de propósito: o host tem de estar escrito por extenso, sem escape.
//   7. as CHAVES DE TOPO do arquivo, contra a tabela `TOPO_DO_VERCEL` — conjunto EXATO (chave a
//      mais E chave a menos reprovam) e valor comparado. Acrescentado em 03/09 pelo item
//      `vercel-valor-e-topo`, e é a família que os quatro portões inteiros não viam: eles só
//      olham `vercel.headers`. O porquê, com os exit codes que o mediram, está na tabela.
// O `connect-src` do quadro sai de `MEDIDA_HOST`, nunca de um literal — é o que mantém a promessa
// de fonte única: nenhum dos treze literais do `vercel.json` pode divergir da constante em silêncio.
//
// NADA PASSOU A SER PERMITIDO. O quadro é a transcrição do `vercel.json` que já estava no ar
// (0 linha de diff nele); o que mudou é que agora nenhuma diretiva de nenhuma das 22 regras pode
// mudar sem esta tabela mudar junto, no mesmo commit.
//
// A PROVA DE MORDIDA é `test/qa-vercel-quadro.js`: ele injeta cada classe NO ARQUIVO, roda ESTE
// build, lê o exit code de verdade e restaura. Asserção sem controle é decoração (EQUIPE.md 2.8).
// O controle anterior, `test/qa-vercel-host.js` (`QA_VERCEL_DEFEITO=<modo>`), continua e continua
// no CI: ele lê o mesmo arquivo SEM o quadro, então o que ele cobra sobrevive a um erro no quadro.
//
// AQUI ESTAVA ESCRITO que ele era mantido como implementação INDEPENDENTE desta, e que "duas
// leituras do mesmo arquivo que têm de concordar valem mais que uma função chamada de dois
// lugares". A frase CAIU na auditoria de 03/09, e a correção fica no lugar da promessa: o QA
// canonizou os dois corpos e comparou — o parser de CSP dos dois arquivos era IDÊNTICO token a
// token, módulo nome de identificador e estilo de aspas. Era transliteração, não segunda leitura.
//
// A DÚVIDA DE PRECEDÊNCIA — FECHADA EM 04/09 (item `vercel-precedencia-de-headers`), e a resposta
// é a hipótese (c), com uma correção que nenhuma das três previa. Estava aqui, de 03/09 até 04/09,
// que a precedência do array `headers` era INFERIDA DE MEDIÇÃO e que ficavam três hipóteses vivas:
// (a) a última que casa vence · (b) a primeira vence · (c) TODAS as que casam se aplicam. Fechada
// desta máquina Windows, que tem egresso — a nuvem e o sandbox de agente batem EGRESS_BLOCKED em
// vercel.com, e é por isso que o item ficou parado dois dias.
//
// A RESPOSTA: **TODAS as regras que casam se aplicam** — (c) —, e entre as que trazem a MESMA
// chave o valor é SOBRESCRITO pela última, não somado. Então (c) e o resolvedor last-match-wins do
// `test/csp-paginas.js` NÃO se contradizem: (c) descreve QUAIS regras rodam, last-match-wins
// descreve QUAL VALOR sobra na chave disputada. As duas são verdade ao mesmo tempo.
//
// COMO SE SABE, e cada prova é de uma natureza diferente:
//
//   1. O MECANISMO, na implementação da própria Vercel. `@vercel/routing-utils` 6.5.0 é o pacote
//      que converte `vercel.json` em rotas. `getTransformedRoutes({headers, trailingSlash})` sobre
//      ESTE arquivo devolve as 25 regras de `headers[]` como 25 rotas, e **as 25 carregam
//      `continue: true`** (medido: `routes.filter(r => r.continue === true).length === 25`).
//   2. O QUE `continue` SIGNIFICA, em documento oficial aberto e lido em 04/09:
//      <https://vercel.com/docs/build-output-api/configuration>, tabela do `Source` route —
//      `continue`: *"A boolean to change matching behavior. If true, routing will continue even
//      when the src is matched."* Rota que não interrompe é rota que não exclui a seguinte: por
//      construção, nenhuma regra de `headers[]` impede outra de casar.
//   3. SOBRESCREVE, NÃO SOMA — medido na PRODUÇÃO em 04/09. `curl -sSI
//      https://matheusferreira.cc/historia/` casa DUAS regras (`/historia/` e `/historia/(.*)`,
//      conferido pelas regexes compiladas no item 1) e devolve **4** linhas de cabeçalho, uma de
//      cada chave — não 8, e nenhuma repetida. Se fosse `append`, o navegador receberia duas CSP e
//      aplicaria a INTERSECÇÃO, que era o medo da hipótese (c); ele recebe UMA.
//   4. AS `(.*)` ESTÃO VIVAS, e não só na página feliz: `/historia/xpto/` responde **404 COM** as
//      quatro (só a regra `(.*)` casa), e `/naoexiste/` responde **404 sem CSP nenhuma** (não casa
//      regra alguma). Cabeçalho de segurança não depende de a página existir.
//   5. POR QUE AS FORMAS SEM BARRA FINAL NÃO DECIDEM NADA — e o motivo NÃO é precedência de
//      cabeçalho, que é como estava escrito aqui. `curl` em `/historia`, `/glossario` e `/jogo`
//      devolve **308 só com `Location`, zero cabeçalho de segurança**. A causa está na ORDEM
//      compilada: as duas rotas 308 do `trailingSlash` vêm ANTES das 25 e **não têm `continue`**,
//      então terminam o roteamento antes de qualquer regra de cabeçalho rodar.
//
// O QUE A DOCUMENTAÇÃO NÃO DIZ — anotado para ninguém refazer a busca. A seção `headers` de
// <https://vercel.com/docs/project-configuration/vercel-json> descreve `source`, `headers`, `has` e
// `missing`, e **não diz uma palavra** sobre múltiplas regras casando o mesmo caminho; e
// <https://vercel.com/docs/headers> é sobre cabeçalhos de sistema e também não diz. Existe a frase
// *"Modify actions from all matching rules still apply"* em
// <https://vercel.com/docs/routing/project-routing-rules>, que bate com o que foi medido — mas ela
// é sobre as regras de PROJETO (painel/CDN), e a mesma página diz que elas são *"separate from
// deployment-level routes defined in `vercel.json`"*. Fica como corroboração, nunca como a citação:
// era exatamente esse o erro que o aceite do item proibia.
//
// O QUE ISTO MUDA NA CONTA DE INERTES, e é a metade que interessa. O VALOR SERVIDO não muda: o
// resolvedor last-match-wins continua certo, então o número (16 de 25, hoje) continua certo. Muda a
// PALAVRA: "inerte" está errada para METADE delas. As 8 formas COM barra final casam, rodam e têm
// os cabeçalhos aplicados — só perdem o valor para a `(.*)` idêntica que vem depois. A consequência
// tem dente: uma chave que exista numa forma e **falte** na regra seguinte SOBREVIVE na resposta,
// porque não há quem sobrescreva — uma regra contada como inerte passaria a decidir sozinha. Isso
// hoje NÃO é buraco aberto, e o que o fecha é outro portão: o `test/qa-csp-cabecalhos.js` mantém
// `CHAVES_PERMITIDAS` (nenhuma quinta chave entra) e cobra que toda regra com CSP declare as três
// companheiras com valor fixo. Ou seja: a mislabelagem é de PALAVRA, não de exposição — mas ela
// deixa de ser inofensiva no instante em que aquele portão afrouxar, e é por isso que fica escrito
// aqui em vez de virar nota de rodapé. As outras 8 (formas SEM barra final) são inalcançáveis de
// verdade, pelo motivo do item 5. Nas duas metades o barato é o mesmo e é o que o quadro faz:
// cobrar as 25 como se qualquer uma pudesse decidir.
const CSP_SECAO_VERCEL = {
  // A PORTA, A HISTÓRIA, o GLOSSÁRIO, DE ONDE VEM: páginas de leitura, geradas por
  // `ferramentas/gerar-*.js`, com script e estilo INLINE e toda imagem em `data:`.
  "default-src": "'none'",
  "script-src": "'unsafe-inline'",
  "style-src": "'unsafe-inline'",
  "img-src": "data:",
  "connect-src": MEDIDA_HOST,   // a contagem anônima do §3, e sai da constante, não de um literal
  "base-uri": "'none'",
  "form-action": "'none'",
  "frame-ancestors": "'none'",  // clickjacking; SÓ funciona por cabeçalho, nunca por <meta>
};
const CSP_TERRITORIO_VERCEL = Object.assign({}, CSP_SECAO_VERCEL, {
  // ONDE FOI monta os dois módulos do three.js em tempo de execução e os importa por `blob:`.
  // Dar `blob:` às outras quatro seria fazer da CSP única a mais frouxa das cinco.
  "script-src": "'unsafe-inline' blob:",
});
const CSP_PRIVACIDADE_VERCEL = {
  // /privacidade/ é a política de privacidade (ferramentas/gerar-privacidade.js, 04/09). É a
  // ÚNICA página pública SEM `connect-src`, e a ausência é a afirmação: ela não manda evento
  // nenhum. As cinco seções mandam um `secao aberta` cujo texto — na seção 3 desta própria
  // política — diz "qual das CINCO seções foi aberta"; medir a página de privacidade a tornaria
  // falsa no mesmo commit. Sem `connect-src`, o `default-src 'none'` já barra qualquer conexão:
  // a página não tem para onde falar, e isso é cobrado pelo navegador, não pela boa intenção.
  // Ela carrega o INTERRUPTOR (que só lê e grava localStorage) porque a política promete, em
  // duas seções, que ele está na barra do topo de qualquer página.
  "default-src": "'none'",
  "script-src": "'unsafe-inline'",   // 2 <script> inline (a barra e a fiação do interruptor)
  "style-src": "'unsafe-inline'",    // 1 <style> inline
  "img-src": "data:",                // as texturas do chrome, em data-URI
  "base-uri": "'none'",
  "form-action": "'none'",           // zero <form> (medido)
  "frame-ancestors": "'none'",
};
const CSP_MESA_VERCEL = {
  // /mesa/ é um coto de três linhas que redireciona para /dashboard/ por <meta refresh>.
  "default-src": "'none'", "base-uri": "'none'", "form-action": "'none'", "frame-ancestors": "'none'",
};
const CSP_SO_MOLDURA_VERCEL = {
  // /jogo/ e /dashboard/ já carregam a CSP DELES no <head> (a do jogo é sagrada, §3). O cabeçalho
  // acrescenta só a diretiva que o <meta> não consegue expressar. Duas políticas valem por
  // INTERSECÇÃO, então isto não restringe script, style, img nem connect de nenhuma das duas.
  "frame-ancestors": "'none'",
};
// A LISTA É NA ORDEM DO ARQUIVO e com repetição — é multiconjunto, e mexer nela é a forma de
// dizer, no commit, que a CSP de uma rota mudou. Deliberadamente chata de mudar por acidente.
const QUADRO_DE_ROTAS = [
  ["/", CSP_SECAO_VERCEL],                                                              // a porta
  ["/historia", CSP_SECAO_VERCEL], ["/historia/", CSP_SECAO_VERCEL],
  ["/historia/(.*)", CSP_SECAO_VERCEL],                                                 // A HISTÓRIA
  ["/glossario", CSP_SECAO_VERCEL], ["/glossario/", CSP_SECAO_VERCEL],
  ["/glossario/(.*)", CSP_SECAO_VERCEL],                                                // o GLOSSÁRIO
  ["/de-onde-vem", CSP_SECAO_VERCEL], ["/de-onde-vem/", CSP_SECAO_VERCEL],
  ["/de-onde-vem/(.*)", CSP_SECAO_VERCEL],                                              // DE ONDE VEM
  ["/territorio", CSP_TERRITORIO_VERCEL], ["/territorio/", CSP_TERRITORIO_VERCEL],
  ["/territorio/(.*)", CSP_TERRITORIO_VERCEL],                                          // ONDE FOI
  ["/privacidade", CSP_PRIVACIDADE_VERCEL], ["/privacidade/", CSP_PRIVACIDADE_VERCEL],
  ["/privacidade/(.*)", CSP_PRIVACIDADE_VERCEL],                                        // a POLÍTICA
  ["/mesa", CSP_MESA_VERCEL], ["/mesa/", CSP_MESA_VERCEL], ["/mesa/(.*)", CSP_MESA_VERCEL],
  ["/jogo", CSP_SO_MOLDURA_VERCEL], ["/jogo/", CSP_SO_MOLDURA_VERCEL],
  ["/jogo/(.*)", CSP_SO_MOLDURA_VERCEL],
  ["/dashboard", CSP_SO_MOLDURA_VERCEL], ["/dashboard/", CSP_SO_MOLDURA_VERCEL],
  ["/dashboard/(.*)", CSP_SO_MOLDURA_VERCEL],
];
// QUEM MEDE É QUEM DECLARA `connect-src` NO QUADRO — derivado, nunca digitado duas vezes. /mesa,
// /jogo e /dashboard ficam de fora, e a ausência é a regra: a CSP delas não tem `connect-src`
// nenhum (a do jogo mora no <meta> do próprio arquivo e é sagrada; a da mesa é um coto de
// redirecionamento; a do dashboard é só moldura, `frame-ancestors`).
const ROTAS_QUE_MEDEM = QUADRO_DE_ROTAS
  .filter(function (par) { return Object.prototype.hasOwnProperty.call(par[1], "connect-src"); })
  .map(function (par) { return par[0]; });
// AS CHAVES DE TOPO DO vercel.json — porteiro, 03/09, item `vercel-valor-e-topo`.
//
// A SEGUNDA FAMÍLIA que o `test/qa-vercel-fora-do-conjunto.js` mediu atravessando os QUATRO
// portões, e ela é maior que a primeira: os quatro só olham `vercel.headers`. Tudo o que está
// FORA daquele array — e é o que decide o que a Vercel constrói, de onde ela serve e para onde ela
// manda a pessoa ANTES de a página existir — não tinha portão nenhum. Medido antes do conserto,
// cada injeção sozinha, com a leitura desviada por `test/qa-vercel-injecao.js` (o `vercel.json` da
// raiz nunca é escrito) e o exit code lido do terminal, na ordem construir.js · qa-vercel-host.js ·
// qa-vercel-diretiva-repetida.js · qa-csp-cabecalhos.js:
//
//   redirects: [{source:"/glossario/(.*)", destination:"https://exfil.example.com/:path*"}] 0·0·0·0
//   outputDirectory: "."      (publica a raiz do repositório em vez de dist/)               0·0·0·0
//   buildCommand: outro comando                                                             0·0·0·0
//   trailingSlash: invertido                                                                0·0·0·0
//
// O `redirects` é o pior dos quatro e mostra por que a família importa: ele é MAIS FORTE que
// qualquer CSP, porque a pessoa nem chega na página cuja política foi conferida diretiva por
// diretiva. Vinte e duas regras de cabeçalho pregadas byte a byte não valem nada se três linhas
// acima delas mandarem o glossário para outro domínio.
//
// A COBRANÇA É DE CONJUNTO EXATO, chave E valor, e cada uma das três partes tem razão medida:
//   · chave A MAIS reprova — é o `redirects`, o `rewrites`, o `cleanUrls`, o `public`, e é o
//     `routes`, que é o caso limite: `routes` é a configuração legada e, quando está presente,
//     DESLIGA `headers`, `redirects`, `rewrites`, `cleanUrls` e `trailingSlash` de uma vez. Uma
//     chave, e o bloco inteiro que esta função confere vira letra morta;
//   · chave A MENOS reprova — e isto NÃO estava no instrumento, que só injetava adição e troca de
//     valor. Medido aqui, na mesma bancada e com os mesmos quatro comandos: apagar
//     `outputDirectory` (a Vercel cai para o ajuste do painel, que este repositório não versiona)
//     saía 0·0·0·0, e apagar `trailingSlash` saía 0·0·0·0;
//   · o VALOR é comparado — é a lição da `Referrer-Policy` do `test/qa-csp-cabecalhos.js`, que
//     entrou na lista de chaves permitidas com valor LIVRE e por isso não cobrava nada. Presença
//     sem valor cobrado é meia cobrança, e a metade que falta é sempre a que vaza.
//
// POR QUE AQUI E NÃO NUM PORTÃO NOVO: é a mesma disciplina do QUADRO_DE_ROTAS, sobre o mesmo
// arquivo, e o build é o único dos quatro que roda em `npm test` e no funil. Deliberadamente
// chata de mudar por acidente: mexer nesta tabela é dizer, no commit, o que a Vercel passou a
// fazer com este repositório.
//
// NADA PASSOU A SER PERMITIDO: a tabela é a transcrição do topo que já estava no ar (0 linha de
// diff no `vercel.json`). A PROVA DE MORDIDA é `test/qa-vercel-fora-do-conjunto.js`, que injeta as
// quatro e exige que algum portão saia != 0 — ele nasceu VERMELHO, com 5 de 5 injeções
// atravessando, e asserção sem controle é decoração (EQUIPE.md 2.8).
const CONFERIDA_PELO_QUADRO = { conferidaPeloQuadro: true };
const TOPO_DO_VERCEL = {
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",   // o mesmo build que escreve o dist/ conferido logo abaixo
  "outputDirectory": "dist",         // e e o dist/ que ele escreve, nunca a raiz do repositorio
  "framework": null,                 // nenhum preset: quem manda e o buildCommand acima
  "trailingSlash": true,             // muda QUAL regra de cabecalho decide cada rota -- ver o quadro
  "headers": CONFERIDA_PELO_QUADRO,  // o conteudo e o QUADRO_DE_ROTAS, conferido regra a regra
};
function conferirVercelJson() {
  const caminho = p("vercel.json");
  if (!fs.existsSync(caminho)) throw new Error("vercel.json sumiu da raiz -- a Vercel fica sem CSP nenhuma para publicar");
  const txt = fs.readFileSync(caminho, "utf8");
  let vercel;
  try {
    vercel = JSON.parse(txt); // se nao for JSON valido, e melhor falhar aqui do que na Vercel
  } catch (e) {
    throw new Error("vercel.json nao e JSON valido -- a Vercel publicaria sem cabecalho nenhum: " + e.message);
  }
  const regras = Array.isArray(vercel.headers) ? vercel.headers : [];
  if (!regras.length) throw new Error("vercel.json nao tem regra de cabecalho nenhuma -- sumiu o bloco `headers`?");

  // Devolve o mapa de diretivas E a lista das que apareceram mais de uma vez: quem monta objeto
  // fica com a ULTIMA, e o navegador aplica a PRIMEIRA -- sem esta lista a comparacao de forma
  // inteira seria cega para uma diretiva frouxa escondida antes da conferida.
  function partirCsp(valor) {
    const d = {};
    const repetidas = [];
    String(valor).split(";").forEach(function (dir) {
      const t = dir.trim(); if (!t) return;
      const i = t.indexOf(" ");
      const nome = i < 0 ? t : t.slice(0, i);
      if (Object.prototype.hasOwnProperty.call(d, nome) && repetidas.indexOf(nome) < 0) repetidas.push(nome);
      d[nome] = i < 0 ? "" : t.slice(i + 1).trim();
    });
    return { diretivas: d, repetidas: repetidas };
  }
  const mostrar = function (v) { return v === undefined ? "(ausente)" : '"' + v + '"'; };

  const problemas = [];

  // 0. AS CHAVES DE TOPO: conjunto EXATO e valor comparado. Vem antes das regras de proposito --
  //    o que esta aqui decide o que a Vercel constroi, de onde ela serve e para onde ela manda a
  //    pessoa ANTES de a pagina existir, e um `redirects` externo e mais forte que qualquer CSP.
  const topoNoArquivo = Object.keys(vercel).sort();
  const topoNoQuadro = Object.keys(TOPO_DO_VERCEL).sort();
  const topoAMais = topoNoArquivo.filter(function (k) { return topoNoQuadro.indexOf(k) < 0; });
  const topoAMenos = topoNoQuadro.filter(function (k) { return topoNoArquivo.indexOf(k) < 0; });
  if (topoAMais.length) {
    problemas.push("o vercel.json tem chave(s) de TOPO que a tabela TOPO_DO_VERCEL"
      + " (ferramentas/construir.js) nao conhece: " + JSON.stringify(topoAMais)
      + " -- os quatro portoes do vercel.json so olham `headers`, entao chave de topo entrava em"
      + " producao sem decisao nenhuma. `redirects`/`rewrites` mandam a pessoa para outro dominio"
      + " ANTES da pagina cuja CSP foi conferida diretiva por diretiva, e `routes` DESLIGA o bloco"
      + " `headers` inteiro. Foi de proposito? acrescente a chave na tabela, no MESMO commit, e"
      + " escreva o que ela passou a fazer");
  }
  if (topoAMenos.length) {
    problemas.push("o vercel.json PERDEU chave(s) de TOPO que a tabela TOPO_DO_VERCEL pede: "
      + JSON.stringify(topoAMenos) + " -- chave apagada nao e neutra: sem `outputDirectory` a"
      + " Vercel cai para o ajuste do painel, que este repositorio nao versiona, e sem"
      + " `trailingSlash` muda QUAL regra de cabecalho decide cada rota");
  }
  for (const chave of topoNoQuadro) {
    if (TOPO_DO_VERCEL[chave] === CONFERIDA_PELO_QUADRO) continue;  // `headers`: e o quadro abaixo
    if (topoAMenos.indexOf(chave) >= 0) continue;                   // ja reportada logo acima
    const achadoTopo = JSON.stringify(vercel[chave]);
    const esperadoTopo = JSON.stringify(TOPO_DO_VERCEL[chave]);
    if (achadoTopo !== esperadoTopo) {
      problemas.push('a chave de TOPO "' + chave + '" do vercel.json esta ' + achadoTopo
        + " e a tabela TOPO_DO_VERCEL espera " + esperadoTopo
        + " -- presenca sem valor cobrado e meia cobranca (foi assim que a Referrer-Policy ficou"
        + ' com valor livre ate 03/09), e `outputDirectory: "."` publica a raiz do repositorio,'
        + " isto e, o que este build nunca conferiu");
    }
  }

  // 1. O QUADRO, NA ORDEM E COM REPETICAO. Conjunto nao ve troca nem duplicata; isto ve.
  const fontes = regras.map(function (r) { return String((r && r.source) || ""); });
  const doQuadro = QUADRO_DE_ROTAS.map(function (par) { return par[0]; });
  const naOrdem = fontes.length === doQuadro.length
    && fontes.every(function (s, i) { return s === doQuadro[i]; });
  if (!naOrdem) {
    problemas.push("a lista de `source` do vercel.json nao e a do QUADRO_DE_ROTAS (ferramentas/construir.js),"
      + " na ORDEM e com repeticao:\n      arquivo (" + fontes.length + "): " + JSON.stringify(fontes)
      + "\n      quadro  (" + doQuadro.length + "): " + JSON.stringify(doQuadro)
      + "\n    -- pega rota TROCADA, DUPLICADA, apagada, nova e reordenada. A ordem conta porque a"
      + " Vercel aplica a ULTIMA regra que casa. Mudou a rota de proposito? mude o quadro no MESMO commit");
  }
  // Se a ordem bateu, cada regra e conferida contra a linha de MESMO indice -- que e o unico jeito
  // de uma DUPLICATA ser conferida contra a linha certa. Se nao bateu, cai para o nome, so para que
  // os problemas de diretiva aparecam junto com o de ordem, em vez de um por rodada.
  const porFonte = {};
  for (const par of QUADRO_DE_ROTAS) porFonte[par[0]] = par[1];

  let medindoNoArquivo = 0;
  for (let i = 0; i < regras.length; i++) {
    const r = regras[i];
    const source = fontes[i];
    const cab = {};
    for (const h of ((r && r.headers) || [])) cab[h.key] = h.value;
    const csp = cab["Content-Security-Policy"];
    const esperada = naOrdem ? QUADRO_DE_ROTAS[i][1] : porFonte[source];
    if (!esperada) continue;   // o problema 1 ja disse que esta rota nao esta no quadro
    if (!csp) {
      problemas.push('a rota "' + source + '" perdeu o cabecalho Content-Security-Policy -- o quadro'
        + " diz que ela tem um, e pagina publicada sem CSP nao vai para producao");
      continue;
    }
    const lido = partirCsp(csp);
    if (lido.repetidas.length) {
      problemas.push('a CSP da rota "' + source + '" repete a(s) diretiva(s) ' + JSON.stringify(lido.repetidas)
        + " -- o navegador (CSP3) aplica a PRIMEIRA e ignora a repetida, entao a segunda e invisivel"
        + " para qualquer leitor que monte um objeto (ver test/qa-vercel-diretiva-repetida.js)");
    }
    // 2. FORMA INTEIRA, nos dois sentidos: diretiva a mais reprova tanto quanto diretiva a menos.
    const nomes = Object.keys(esperada).concat(Object.keys(lido.diretivas))
      .filter(function (n, k, a) { return a.indexOf(n) === k; }).sort();
    for (const n of nomes) {
      if (lido.diretivas[n] !== esperada[n]) {
        problemas.push('a CSP da rota "' + source + '" mudou e o QUADRO_DE_ROTAS nao sabe disso: `'
          + n + "` esta " + mostrar(lido.diretivas[n]) + " e o quadro espera " + mostrar(esperada[n])
          + " -- CSP que se afrouxa por conveniencia e o comeco de nao ter CSP (CLAUDE.md paragrafo 3)");
      }
      // 3. nenhum curinga, nunca -- por extenso, com esquema (CLAUDE.md paragrafo 3)
      if (lido.diretivas[n] !== undefined && String(lido.diretivas[n]).indexOf("*") >= 0) {
        problemas.push('a CSP da rota "' + source + '" tem CURINGA em `' + n + "`: "
          + mostrar(lido.diretivas[n]) + " -- por extenso, com esquema, nenhum curinga, nunca");
      }
    }
    if (Object.prototype.hasOwnProperty.call(lido.diretivas, "connect-src")) medindoNoArquivo++;
  }
  // 5. O NUMERO QUE SE IMPRIME E COMPARADO ANTES DE SER IMPRESSO.
  if (medindoNoArquivo !== ROTAS_QUE_MEDEM.length) {
    problemas.push("o vercel.json tem " + medindoNoArquivo + " rota(s) com connect-src e o QUADRO_DE_ROTAS"
      + " pede " + ROTAS_QUE_MEDEM.length + " (" + JSON.stringify(ROTAS_QUE_MEDEM) + ")"
      + " -- rota que perde o connect-src perde a contagem anonima em silencio");
  }
  // 6. Nenhuma mencao solta ao host, e a comparacao e contra o QUADRO -- contra uma contagem tirada
  //    do mesmo arquivo ela fecharia consigo mesma (foi assim que a duplicata passou verde).
  const mencoes = (txt.match(/posthog/gi) || []).length;
  if (mencoes !== ROTAS_QUE_MEDEM.length) {
    problemas.push('a palavra "posthog" aparece ' + mencoes + " vez(es) no vercel.json e o QUADRO_DE_ROTAS"
      + " pede " + ROTAS_QUE_MEDEM.length + " rota(s) que medem -- ha mencao ao host fora de um"
      + " connect-src conferido (outra diretiva? outro campo? grafia com escape que so o parse desfaz?)"
      + " ou uma rota que mede a mais/a menos");
  }
  if (problemas.length) {
    throw new Error("vercel.json divergiu do QUADRO_DE_ROTAS -- a Vercel serviria isto para as paginas:\n  - "
      + problemas.join("\n  - "));
  }
  console.log("  vercel.json: " + topoNoQuadro.length + " chave(s) de topo (conjunto exato e valor); "
    + regras.length + " regra(s), na ordem do QUADRO_DE_ROTAS e com a CSP"
    + " conferida diretiva por diretiva; " + medindoNoArquivo + " medem, todas == MEDIDA_HOST");
}
conferirVercelJson();

if (fs.existsSync(p("dashboard"))) {
  if (fs.existsSync(p("dashboard", "index.html"))) conferirCspDashboard(p("dashboard", "index.html"));
  fs.mkdirSync(d("dashboard"), { recursive: true });
  let nDash = 0;
  for (const f of fs.readdirSync(p("dashboard"))) {
    copiarPublicado(p("dashboard", f), d("dashboard", f));
    nDash++;
  }
  escreverPublicado(d("robots.txt"),
    ["User-agent: *", "Disallow: /dashboard", "Sitemap: " + BASE + "/sitemap.xml", ""].join("\n"));
  // O SITEMAP (growth, 21/08): sem ele o Google só acha as páginas por link, e não havia sinal
  // de indexação nenhuma. As seis URLs públicas; o dashboard fica de fora de propósito.
  // `/privacidade/` entrou em 04/09: é página pública, indexável de propósito (política de
  // privacidade que o buscador não acha é política que ninguém lê) e não tem nada de interno.
  const urlsMapa = ["/", "/jogo/", "/historia/", "/glossario/", "/de-onde-vem/", "/territorio/",
    "/privacidade/"];
  escreverPublicado(d("sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urlsMapa.map(function (u) { return "  <url><loc>" + BASE + u + "</loc></url>"; }).join("\n")
    + "\n</urlset>\n");
  console.log("  dashboard/ copiado para dist/dashboard/ — " + nDash + " arquivo(s), + robots.txt e sitemap.xml");
  // O ENDERECO ANTIGO REDIRECIONA: o dashboard chamava-se mesa ate 21/08 e o bookmark do
  // celular do dono aponta para /mesa. Quebrar bookmark dele e o oposto de organizar.
  fs.mkdirSync(d("mesa"), { recursive: true });
  escreverPublicado(d("mesa", "index.html"),
    "<!doctype html><meta charset=utf-8><meta name=robots content=noindex>" +
    "<meta http-equiv=refresh content=\"0; url=/dashboard/\">" +
    "<a href=/dashboard/>O painel mudou para /dashboard</a>");
}

// O BACKLOG NA TELA (dono, 22/08). A fila oficial vive em `ferramentas/backlog.json`, que NÃO é
// publicado — ferramentas/ não vai para dist/. O dashboard é servido de dist/ e lê a fila por
// `fetch("backlog.json")` RELATIVO, então o build copia o arquivo para DENTRO de dist/dashboard/.
//
// A PASTA IMPORTA, e foi um BLOQUEANTE da segurança (B1, 22/08). A primeira versão copiava para
// a RAIZ do dist — `/backlog.json`, um caminho INDEXÁVEL, porque o `robots.txt` só carrega
// `Disallow: /dashboard`. São 24 KB de fila INTERNA: caminhos de arquivo, números de PENDENTES,
// nomes de agentes, o e-mail sintético da conta e o desenho inteiro do auto-login por PIN. O
// dashboard e a mesa são `noindex` + `Disallow` por decisão explícita, e este arquivo é o MESMO
// material de trabalho — com um agravante: JSON não aceita `<meta name=robots>`, então dentro da
// pasta já barrada é a única trava que existe para ele. Debaixo de `/dashboard/` ele herda o
// Disallow que já está no ar, continua dentro do `connect-src 'self'` da página, e o recuo não
// muda: some o arquivo, o fetch cai no 404 e a seção se esconde sozinha.
// Passa pelo portão de segredo como todo byte publicado (copiarPublicado) E pelo guarda do
// roteiro (guardaRoteiro, achado do jurídico em 22/08) — o `Disallow` pede ao robô que não
// indexe, não impede ninguém de abrir o endereço.
if (fs.existsSync(p("ferramentas", "backlog.json"))) {
  fs.mkdirSync(d("dashboard"), { recursive: true });
  const fila = fs.readFileSync(p("ferramentas", "backlog.json"));
  guardaRoteiro("ferramentas/backlog.json", fila);
  escreverPublicado(d("dashboard", "backlog.json"), fila);
  console.log("  ferramentas/backlog.json -> dist/dashboard/backlog.json (a fila, atras do Disallow)");
}

// A TABELA DE PRECO DE MODELO (dono, 25/08). O dashboard mostra o custo ESTIMADO por agente e le
// os precos por `fetch("precos-modelo.json")` RELATIVO — mesmo desenho do backlog acima. A fonte
// e `ferramentas/precos-modelo.json` (com URL e data da tabela oficial), que ferramentas/ nao
// publica; entao o build a copia para dentro de dist/dashboard/. Se ela nao existir, o dashboard
// cai em "aguardando tabela de preço" e nada quebra. Sem PIN/token/segredo: passa como todo byte.
if (fs.existsSync(p("ferramentas", "precos-modelo.json"))) {
  fs.mkdirSync(d("dashboard"), { recursive: true });
  copiarPublicado(p("ferramentas", "precos-modelo.json"), d("dashboard", "precos-modelo.json"));
  console.log("  ferramentas/precos-modelo.json -> dist/dashboard/precos-modelo.json (preco por modelo, atras do Disallow)");
}

// AS SEÇÕES DA PLATAFORMA — decidido pelo dono em 19/08: o jogo vira UMA seção, e as seções que
// já existem (A HISTÓRIA, e depois o glossário e DE ONDE VEM) ganham endereço próprio. Ao
// contrário da `mesa` acima, estas são PÚBLICAS e indexáveis — o dono QUER que as pessoas as
// achem —, então nada de `noindex` e nada no Disallow. Cada uma é "uma fonte, duas saídas": o
// conteúdo é gerado do mesmo `LINHA_TEMPO`/`GLOSSARIO`/`FONTES` do jogo (ver ferramentas/gerar-*),
// nunca reescrito à mão. Aqui o build só PUBLICA o que o gerador já produziu.
// `territorio` entrou em 21/08: a placa 3D do país, gerada do MAPA_* do jogo por
// ferramentas/gerar-territorio.js. Ela é página separada de propósito — carrega three.js
// inline e não pode pesar na porta de entrada do jogo, que é o que carrega em 3G.
// A PÁGINA /privacidade/ TEM DE ESTAR EM DIA COM O TEXTO — e quem cobra é o build (04/09).
//
// As quatro seções acima extraem do JOGO, e o `test/medir-numero-envelhece.js` pega quando elas
// envelhecem. A política extrai de `plataforma/privacidade-texto.md`, e o modo de falha dela é o
// mesmo com uma agravante: uma página de privacidade desatualizada não é um número feio, é uma
// afirmação falsa sobre o que o site faz com os dados de quem lê — o que o §3 do CLAUDE.md chama
// de pior que não ter nenhuma. Aqui a comparação é BYTE A BYTE contra o que o gerador produz
// AGORA (ele é determinístico: nenhum navegador, nenhuma data de relógio, nenhuma aleatoriedade),
// então editar o texto e esquecer de rodar o gerador deixa de ser possível em silêncio.
if (fs.existsSync(p("plataforma", "privacidade-texto.md"))) {
  const gp = require("./gerar-privacidade.js");
  // FIM DE LINHA FORA DA COMPARAÇÃO, e é a lição do PENDENTES 62 aplicada antes de custar: o
  // `.gitattributes` já trava `index.html text eol=lf` (o padrão casa por nome, em qualquer
  // pasta), mas comparar CR faria este portão ficar VERMELHO por ruído no dia em que essa linha
  // mudasse — e árvore vermelha por ruído deixa de ser sinal. Diferença de CR não é diferença de
  // texto; o resto é comparado caractere a caractere.
  const semCr = (s) => String(s).replace(/\r\n/g, "\n");
  const esperado = semCr(gp.gerar().html);
  const noDisco = fs.existsSync(gp.DESTINO) ? semCr(fs.readFileSync(gp.DESTINO, "utf8")) : null;
  if (noDisco === null) {
    throw new Error("privacidade/index.html nao existe e a fonte plataforma/privacidade-texto.md sim."
      + " Rode: node ferramentas/gerar-privacidade.js");
  }
  if (noDisco !== esperado) {
    throw new Error("privacidade/index.html NAO bate com plataforma/privacidade-texto.md (" + noDisco.length
      + " bytes no disco, " + esperado.length + " gerados agora). O texto mudou e a pagina nao."
      + " Rode: node ferramentas/gerar-privacidade.js");
  }
  console.log("  privacidade/index.html confere caractere a caractere com plataforma/privacidade-texto.md");
}

for (const secao of ['historia', 'glossario', 'de-onde-vem', 'territorio', 'privacidade']) {
  if (!fs.existsSync(p(secao))) continue;
  fs.mkdirSync(d(secao), { recursive: true });
  // DOCUMENTO DE TRABALHO NÃO SE PUBLICA (achado da segurança, 23/08). Este laço copiava TUDO
  // da pasta, e por isso `territorio/PINOS-PROPOSTA.md` — o rascunho da historiadora, com 49
  // pinos ainda NÃO aprovados, cinco marcados PARE e dezenas de "[conferir]" — respondia 200 em
  // produção, fora de qualquer Disallow, sem nenhuma página que o buscasse. É §2: proposta de
  // representação não aprovada, legível como se fosse posição do projeto. Nenhuma página
  // consome `.md`; quem precisar de um no ar, põe em dashboard/, que tem Disallow e cabeçalho.
  //
  // A REGRA DE 23/08 FECHOU A PORTA PELA EXTENSÃO, E SOBROU A GÊMEA (achado em 04/09). O mesmo
  // rascunho existe em JSON — `territorio/pinos-proposta.json`, 27 KB com o texto candidato de
  // cada um dos 49 pinos, os 5 PARE inclusive — e continuava sendo publicado, porque não termina
  // em `.md`. Era exatamente o mesmo problema de §2 pela mesma pasta, e a régua não o via.
  //
  // ENTÃO A REGRA DEIXA DE SER SOBRE EXTENSÃO E PASSA A SER SOBRE USO: publica-se o `index.html`
  // e o que ELE cita. Um arquivo que nenhuma página busca não tem por que responder 200 — e essa
  // formulação se mantém sozinha, porque no dia em que uma seção passar a buscar um `.json` o
  // nome dele aparece no HTML e ele volta a viajar, sem ninguém precisar lembrar de uma lista.
  // Hoje isso deixa de fora os dois arquivos que só alimentam GERADOR: `pinos-proposta.json` e
  // `malha-ibge.json` (este entra na página embutido, não buscado).
  // O CASAMENTO É COM O NOME PRECEDIDO DE BARRA, e não com o nome solto: a página do TERRITÓRIO
  // CITA `malha-ibge.json` num comentário de código, explicando de onde a geografia vem, e com a
  // busca solta essa menção em PROSA bastava para publicar 100 KB que ninguém pede. Referência de
  // verdade é caminho — `/territorio/compartilhar.jpg` —, então a barra é o que separa citar de
  // usar. O erro que sobra é na direção certa: uma página que busque `dados.json` sem barra deixa
  // de publicá-lo e QUEBRA ALTO, em vez de vazar em silêncio, que é o modo de falha que esta
  // regra existe para acabar.
  const html = fs.readFileSync(p(secao, 'index.html'), 'utf8');
  let n = 0;
  const deixados = [];
  for (const f of fs.readdirSync(p(secao))) {
    if (f !== 'index.html' && (/\.md$/i.test(f) || html.indexOf('/' + f) < 0)) { deixados.push(f); continue; }
    copiarPublicado(p(secao, f), d(secao, f)); n++;
  }
  console.log('  ' + secao + '/ copiada para dist/' + secao + '/ — ' + n + ' arquivo(s)'
    + (deixados.length ? ' (não publicados, porque nenhuma página os cita: ' + deixados.join(', ') + ')' : ''));
}

// OS PACOTES DE ARTE, nos dois lugares em que o index.html também está — e pelo mesmo motivo
// de sempre: a Vercel publica `dist/` (ver vercel.json) e o Capacitor empacota `dist/` inteiro
// para dentro do APK, enquanto a RAIZ é o que o `npm start` serve, o que o smoke test abre e o
// que as ferramentas de peso medem. Um pacote que só existisse num dos dois daria o mesmo
// sintoma dos dois lados: um capítulo sem pintura, sem erro nenhum no console.
// Antes de escrever, varre as sobras da RAIZ: um pacote que deixou de existir (capítulo
// removido, tabela mudada) ficaria no disco e seria publicado para sempre. A varredura era em
// três lugares — raiz, dist/ e dist/jogo/ — e os dois últimos deixaram de precisar dela em
// 22/08: a pasta de obra nasce vazia a cada build e o dist/ velho inteiro é descartado no
// rename do fim, então sobra de pacote em dist/ deixou de ser possível por construção. A da
// raiz continua, porque a raiz é VERSIONADA e sobrevive ao build.
for (const dir of [p('.')]) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) if (/^pack-[\w-]+\.json$/.test(f)) fs.unlinkSync(path.join(dir, f));
}
let totalPacks = 0;
for (const [nome, pk] of separado.packs) {
  const corpo = JSON.stringify({ arte: pk.arte, itens: pk.itens });
  totalPacks += corpo.length;
  escreverPublicado(p('pack-' + nome + '.json'), corpo);
  escreverPublicado(d('jogo', 'pack-' + nome + '.json'), corpo);
  console.log('  pack-' + nome + '.json — ' + (corpo.length / 1024).toFixed(0) + ' KB, '
    + pk.arte.length + ' imagens em ' + pk.itens.length + ' lugares');
}

// ---- A TROCA. Último passo do build, e nada é escrito depois dele. ----
// Só aqui o `dist/` de ontem deixa de existir. Se o rename falhar (a pasta aberta num terminal,
// um `npm run servir` de pé segurando um arquivo), o build morre com a mensagem dizendo o que
// fazer — e o `dist/` de ontem continua inteiro, que é exatamente a promessa.
try {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.renameSync(DIST_OBRA, DIST);
} catch (e) {
  throw new Error('nao consegui trocar dist/ pela pasta de obra dist.tmp/ (' + (e.code || e.message)
    + '). Alguem esta segurando a pasta — um `npm run servir` de pe, um `cap sync`, um terminal'
    + ' com o cwd dentro dela. Feche e rode de novo: o dist/ anterior continua intacto e a obra'
    + ' pronta esta em dist.tmp/.');
}

const mb = (saida.length / 1048576).toFixed(2);
console.log('index.html e dist/index.html escritos — ' + saida.length + ' bytes (' + mb + ' MB)'
  + (totalPacks ? ' + ' + (totalPacks / 1048576).toFixed(2) + ' MB em pacotes sob demanda' : ''));
