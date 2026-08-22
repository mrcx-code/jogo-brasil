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
// capítulos antes de deixar alguém tocar no primeiro (RELATORIO-PESO.md). Aqui ela sai para
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
  for (const a of separado.achados) {
    if (PACOTES.conhecido(a.caminho)) continue;
    const nome = a.caminho[0] + '[' + a.caminho.slice(1).join('][') + ']';
    fora.set(nome, (fora.get(nome) || 0) + (a.fim - a.ini));
  }
  if (fora.size) {
    let bytes = 0;
    for (const v of fora.values()) bytes += v;
    console.warn('AVISO: ' + fora.size + ' imagem(ns) de arte NOVA não estão em nenhum pacote e pesam '
      + Math.round(bytes / 1024) + ' KB na porta de entrada — acrescente a linha em ferramentas/pacotes.js:\n  '
      + [...fora.keys()].slice(0, 12).join(', '));
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
const externo = saida.match(/(?:src|href)\s*=\s*["'](?!data:)[^"']+["']/gi) || [];
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
// (achado do RELATORIO-PESO.md, §5). Trava que não acompanha o contrato dá falsa segurança.
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
const SEGREDO = /sb_secret_|service_role|eyJ[\w-]{20,}\.[\w-]{20,}\./;
const TEXTO_VARRIDO = /\.(html?|js|mjs|json|css|txt|xml|svg|webmanifest)$/i;
function guardaSegredo(destino, bytes) {
  if (!TEXTO_VARRIDO.test(destino)) return bytes;
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

escreverPublicado(p('index.html'), saida);
fs.mkdirSync(p('dist'), { recursive: true });
// A PORTA DA PLATAFORMA É A RAIZ (D-home, dono 20/08): o jogo vira /jogo (o chamariz) e a home
// da plataforma vira dist/index.html. A RAIZ VERSIONADA CONTINUA SENDO O JOGO — o smoke e a régua
// leem o index.html da raiz e precisam medir o JOGO, não a porta. No dist, o jogo vai para
// dist/jogo/ com os pacotes de arte AO LADO: o fetch de `pack-*.json` é RELATIVO (ver
// caminhoPacote), então a arte quebraria se o jogo mudasse de pasta e os pacotes ficassem na raiz.
fs.mkdirSync(p('dist', 'jogo'), { recursive: true });
escreverPublicado(p('dist', 'jogo', 'index.html'), saida);
if (fs.existsSync(p('plataforma', 'index.html'))) {
  copiarPublicado(p('plataforma', 'index.html'), p('dist', 'index.html'));
  console.log('  plataforma/index.html -> dist/index.html (a PORTA, na raiz)');
} else {
  escreverPublicado(p('dist', 'index.html'), saida);
  console.log('  AVISO: plataforma/index.html nao existe — dist/index.html ficou com o JOGO (sem porta)');
}
if (fs.existsSync(p('compartilhar.jpg'))) {
  copiarPublicado(p('compartilhar.jpg'), p('dist', 'compartilhar.jpg'));
  copiarPublicado(p('compartilhar.jpg'), p('dist', 'jogo', 'compartilhar.jpg'));
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
// fala com a rede e não entra no APK. O que ela tem de externo são as fontes do Google, que o
// jogo não pode ter e ela pode, porque a CSP do jogo vale só para o <head> do jogo.
//
// O PORTÃO DE SEGREDO É O MESMO DE TODO MUNDO, e deixou de ser um privilégio desta pasta
// (N7 da re-auditoria, 21/08): ele mora em `guardaSegredo`/`copiarPublicado`, lá em cima, e
// vale para cada byte que entra em `dist/`. O dashboard continua sendo o lugar mais provável
// do erro — é a única página que fala com um backend com contas de verdade, e colar a
// `service_role` "só para testar" dá acesso TOTAL ao banco ignorando RLS, o que faria da fila
// fechada em fila-auth.sql um enfeite no mesmo instante — mas provável não é exclusivo.
if (fs.existsSync(p("dashboard"))) {
  fs.mkdirSync(p("dist", "dashboard"), { recursive: true });
  let nDash = 0;
  for (const f of fs.readdirSync(p("dashboard"))) {
    copiarPublicado(p("dashboard", f), p("dist", "dashboard", f));
    nDash++;
  }
  escreverPublicado(p("dist", "robots.txt"),
    ["User-agent: *", "Disallow: /dashboard", "Sitemap: " + BASE + "/sitemap.xml", ""].join("\n"));
  // O SITEMAP (growth, 21/08): sem ele o Google só acha as páginas por link, e não havia sinal
  // de indexação nenhuma. As seis URLs públicas; o dashboard fica de fora de propósito.
  const urlsMapa = ["/", "/jogo/", "/historia/", "/glossario/", "/de-onde-vem/", "/territorio/"];
  escreverPublicado(p("dist", "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urlsMapa.map(function (u) { return "  <url><loc>" + BASE + u + "</loc></url>"; }).join("\n")
    + "\n</urlset>\n");
  console.log("  dashboard/ copiado para dist/dashboard/ — " + nDash + " arquivo(s), + robots.txt e sitemap.xml");
  // O ENDERECO ANTIGO REDIRECIONA: o dashboard chamava-se mesa ate 21/08 e o bookmark do
  // celular do dono aponta para /mesa. Quebrar bookmark dele e o oposto de organizar.
  fs.mkdirSync(p("dist", "mesa"), { recursive: true });
  escreverPublicado(p("dist", "mesa", "index.html"),
    "<!doctype html><meta charset=utf-8><meta name=robots content=noindex>" +
    "<meta http-equiv=refresh content=\"0; url=/dashboard/\">" +
    "<a href=/dashboard/>O painel mudou para /dashboard</a>");
}

// O BACKLOG NA TELA (dono, 22/08). A fila oficial vive em `ferramentas/backlog.json`, que NÃO é
// publicado — ferramentas/ não vai para dist/. O dashboard é servido de dist/ e lê a fila por
// `fetch('/backlog.json')`, então o build copia o arquivo para a RAIZ do dist como JSON estático.
// Passa pelo portão de segredo como todo byte publicado (copiarPublicado). Se um dia sumir, o
// dashboard esconde a seção sozinho — o fetch cai no 404 e a vista some sem erro.
if (fs.existsSync(p("ferramentas", "backlog.json"))) {
  copiarPublicado(p("ferramentas", "backlog.json"), p("dist", "backlog.json"));
  console.log("  ferramentas/backlog.json -> dist/backlog.json (a fila, leitura no dashboard)");
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
for (const secao of ['historia', 'glossario', 'de-onde-vem', 'territorio']) {
  if (!fs.existsSync(p(secao))) continue;
  fs.mkdirSync(p('dist', secao), { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(p(secao))) { copiarPublicado(p(secao, f), p('dist', secao, f)); n++; }
  console.log('  ' + secao + '/ copiada para dist/' + secao + '/ — ' + n + ' arquivo(s)');
}

// OS PACOTES DE ARTE, nos dois lugares em que o index.html também está — e pelo mesmo motivo
// de sempre: a Vercel publica `dist/` (ver vercel.json) e o Capacitor empacota `dist/` inteiro
// para dentro do APK, enquanto a RAIZ é o que o `npm start` serve, o que o smoke test abre e o
// que as ferramentas de peso medem. Um pacote que só existisse num dos dois daria o mesmo
// sintoma dos dois lados: um capítulo sem pintura, sem erro nenhum no console.
// Antes de escrever, varre as sobras: um pacote que deixou de existir (capítulo removido,
// tabela mudada) ficaria no disco e seria publicado para sempre.
// Varre as sobras nos TRÊS lugares — raiz, dist/ e dist/jogo/ — inclusive um pack antigo em
// dist/ da época em que o jogo era a raiz do dist, que de outra forma ficaria publicado para sempre.
for (const dir of [p('.'), p('dist'), p('dist', 'jogo')]) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) if (/^pack-[\w-]+\.json$/.test(f)) fs.unlinkSync(path.join(dir, f));
}
let totalPacks = 0;
for (const [nome, pk] of separado.packs) {
  const corpo = JSON.stringify({ arte: pk.arte, itens: pk.itens });
  totalPacks += corpo.length;
  escreverPublicado(p('pack-' + nome + '.json'), corpo);
  escreverPublicado(p('dist', 'jogo', 'pack-' + nome + '.json'), corpo);
  console.log('  pack-' + nome + '.json — ' + (corpo.length / 1024).toFixed(0) + ' KB, '
    + pk.arte.length + ' imagens em ' + pk.itens.length + ' lugares');
}

const mb = (saida.length / 1048576).toFixed(2);
console.log('index.html e dist/index.html escritos — ' + saida.length + ' bytes (' + mb + ' MB)'
  + (totalPacks ? ' + ' + (totalPacks / 1048576).toFixed(2) + ' MB em pacotes sob demanda' : ''));
