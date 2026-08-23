// A MEDIÇÃO DAS PÁGINAS — o mesmo bloco do jogo, escrito UMA vez, para as cinco seções.
//
// POR QUE ISTO EXISTE. O jogo mede desde 10/08; as páginas da plataforma, não. Desde que a
// home virou a proposta e "cada seção vale sozinha" (dono, 19/08), a pergunta que decide o
// produto — *alguém abre A HISTÓRIA sem nunca ter jogado?* — não tinha termômetro nenhum. O
// growth conferiu por `curl` em 21/08: nenhuma das cinco páginas fora do jogo emite um evento,
// e todo tráfego que chega por link direto é invisível.
//
// A LEI É A DO §3 DO CLAUDE.md, INTEIRA, E NÃO HÁ UMA SEGUNDA VERSÃO DELA. Mesmo host, mesma
// chave publicável, `credentials: "omit"`, `$ip: null`, `$process_person_profile: false`, sem
// a biblioteca do PostHog, sem cookie, sem autocapture, sem gravação. O código abaixo é o
// mesmo desenho de `medir()` em `src/jogo.ts` — reduzido, porque uma página estática tem uma
// pergunta só. Inventar um segundo jeito seria criar um segundo lugar para a regra envelhecer.
//
// UM EVENTO. UMA PROPRIEDADE. `"secao aberta"` com `secao` entre os cinco nomes de SECOES, e
// nada mais. Não há capítulo, não há tempo, não há referrer, não há tela: a lista branca do
// `test/medir-paginas.js` reprova qualquer campo que apareça sem ter sido aprovado aqui — é o
// papel que o bloco 17 do `encaixe.js` faz para o jogo.
//
// A CHAVE E O HOST SAEM DAQUI, E O `construir.js` LÊ DAQUI. Duas cópias do endereço divergem
// em silêncio, e o sintoma seria um painel vazio semanas depois (o erro de região de 10/08,
// que os dois endereços respondem 200 OK a qualquer coisa e nada quebra). Então MEDIDA_HOST
// mora numa linha só, nesta, e alimenta: (1) a CSP do jogo, (2) a cobrança do ENDERECO_MEDIDA
// do jogo, (3) o endereço que estas páginas chamam.
//
// A CHAVE COMPARTILHADA DO INTERRUPTOR, e a decisão está aqui porque é ela que faz a frase do
// rodapé ser verdadeira: as páginas e o jogo moram no MESMO domínio, então dividem o mesmo
// `localStorage`. Elas usam a MESMA chave que a tela de CONFIGURAÇÕES do jogo usa
// (`jogo_brasil_medir`), de propósito: é UMA pessoa decidindo UMA vez sobre UM site. Dois
// interruptores independentes na mesma origem seriam duas afirmações de privacidade que podem
// se contradizer — desligar no glossário e continuar sendo medido no jogo é exatamente o tipo
// de meia-verdade que o §3 chama de pior que nenhuma. Desligar aqui desliga lá, e vice-versa,
// e o rodapé diz isso com todas as letras.
//
// O identificador anônimo também é o mesmo (`jogo_brasil_anon`) — e reusar é a escolha mais
// privada das duas: criar um segundo número seria criar um identificador novo, não menos um.
// Ele só nasce se a medição estiver LIGADA; com o interruptor desligado nada é gravado, nada
// é sorteado e nada sai.

// O ÚNICO HOST DE FORA QUE ESTE PROJETO ALCANÇA. Região US, que é onde o projeto do dono está
// (`us.posthog.com/project/550996`). Trocar de região é trocar esta linha — e aí a CSP do
// jogo, o `ENDERECO_MEDIDA` do `src/jogo.ts` e estas páginas ficam errados JUNTOS até que os
// três digam o mesmo, que é exatamente o barulho que uma mudança dessas tem de fazer.
const MEDIDA_HOST = 'https://us.i.posthog.com';
const ENDERECO_MEDIDA = MEDIDA_HOST + '/i/v0/e/';

// A CHAVE É PUBLICÁVEL — o prefixo `phc_` é o que diz isso, e ela foi feita para viver no
// cliente: com ela dá para MANDAR evento, nunca para ler nada. É a MESMA do jogo, porque é o
// mesmo projeto: separar em duas chaves só faria a conta ter dois lugares para vazar.
const MEDIDA_CHAVE = 'phc_x7w7oQAVA6JJAXkrdB3Wo3oCnNx9z5C2NcvS8jmUjJpG';

const CHAVE_MEDIR = 'jogo_brasil_medir';
const CHAVE_ANON = 'jogo_brasil_anon';

// O ID DO INTERRUPTOR MORA AQUI, e o chrome da plataforma o importa daqui. O botão passou a
// viver na BARRA DO TOPO (23/08) e a fiação continua sendo deste módulo — duas cópias da
// string seriam duas formas de o botão existir sem ninguém o ligar em nada.
const ID_BOTAO = 'medirBt';

// O nome do evento e os cinco valores possíveis de `secao`. Quem acrescentar seção acrescenta
// aqui, e o portão exige que o valor esteja nesta lista.
const EVENTO = 'secao aberta';
const SECOES = ['historia', 'glossario', 'de-onde-vem', 'territorio', 'porta'];

// Toda propriedade que uma página tem licença de mandar. Três técnicas e UMA de conteúdo.
const PERMITIDAS = ['$ip', '$lib', '$process_person_profile', 'secao'];

// Teto por carga de página. Não é medo de custo: é que qualquer defeito futuro que ponha o
// envio dentro de um laço vira, sem isto, uma página atacando o próprio servidor de medição.
// Quatro é folgado para o único evento que existe e apertado para um laço.
const TETO = 4;

// ---------------------------------------------------------------- o rodapé, e a frase dele
//
// A FRASE TEM DE SER VERDADE DEPOIS DA MUDANÇA (§3). Ela diz o que sai (qual seção foi
// aberta), o que não sai (nome, e-mail, IP, cookie), o que É o identificador (um número
// sorteado que fica no aparelho) e que desligar vale para o site inteiro — porque a chave do
// interruptor é compartilhada com o jogo, e omitir isso seria descrever metade do efeito de
// um botão.
//
// E ELA É CURTA POR MEDIÇÃO, não por gosto. A primeira versão tinha quatro orações e ocupava
// cinco linhas no painel de papel do TERRITÓRIO — que é o único lugar onde ela custa alguma
// coisa, porque `areaUtil()` mede o painel para enquadrar a placa. Medido em 390×844
// (`test/tmp-area.js`, descartável): com cinco linhas a placa perdia **26,9%** da área livre
// (362×398 → 362×291 px); com três, **18,6%** (362×324). Em 1366×768 o custo é **zero** nas
// duas versões, porque ali a coluna de texto é que decide o enquadramento. Nas quatro páginas
// de papel o custo é zero em qualquer largura — elas rolam. Cada oração que
// saiu foi conferida contra o que o bloco de fato faz: "sem anúncio" é verdade e não é
// afirmação de privacidade (não há anúncio nenhum no repositório), e "some quando você apaga
// os dados do site" é como todo localStorage funciona. As quatro que ficaram são as que
// mudariam de valor se o código mudasse — e é por isso que são elas as cobradas pelo portão.
//
// O BOTÃO SAIU DAQUI EM 23/08, E O MOTIVO É UM NÚMERO. O parecer do jurídico mediu que o
// interruptor estava a **116 telas de rolagem** do topo do glossário: ele existia, funcionava
// (medido: desligar dá zero pedidos) e ninguém o achava. O dono decidiu manter a medição
// LIGADA por padrão, e a condição para isso ser defensável é que desligar seja fácil — então o
// botão subiu para a BARRA DE TÁBUAS, que é a única coisa que aparece igual nas cinco páginas.
// A frase continua aqui, no rodapé, porque é texto de leitura e não controle; ela agora DIZ
// onde o controle está, senão o rodapé explicaria um botão que não está mais ali.
//
// UM SÓ, EM TODA A PLATAFORMA. Não sobrou um segundo botão no rodapé de propósito: dois
// controles da MESMA preferência, um deles fora da vista, é o jeito mais barato de a página
// mostrar "ligada" num canto e "desligada" no outro.
function rodape() {
  return '<p class="med">Esta página conta uma abertura anônima — <strong>qual seção foi '
    + 'aberta</strong>, e nada mais. Sem nome, sem e-mail, sem IP, sem cookie: só um número '
    + 'sorteado que fica neste aparelho. O interruptor fica na barra do topo, em toda página. '
    + 'Desligar desliga de verdade, aqui e no jogo.</p>';
}

// ------------------------------------------------------------------ o interruptor, no chrome
//
// O MARCADO É DESTE MÓDULO, A ROUPA É DO CHROME. A fiação (ler a chave, gravar, pintar o
// estado) mora no `script()` daqui; como ele se parece com uma tábua de madeira mora no
// `barraCss()` do `chrome-plataforma.js`. Separado assim porque a promessa que este botão faz
// é de PRIVACIDADE — ela não pode depender de quem estiver mexendo na aparência da barra.
//
// O ESTADO É LEGÍVEL SEM TOCAR, e é requisito, não gosto: um interruptor que só conta o que
// fez depois de ser apertado obriga a pessoa a mexer na própria configuração para descobri-la.
// Duas linhas: o rótulo fixo ("medição") e o estado ("ligada"/"desligada"), este num span
// marcado com `data-estado` — é ele que o `pintar()` reescreve, e é por isso que reescrever o
// estado não apaga o rótulo.
function botaoHtml() {
  return '<button type="button" id="' + ID_BOTAO + '" class="medida" aria-pressed="true"'
    + ' aria-label="Medição ligada. Toque para desligar."'
    + ' title="A contagem anônima desta plataforma. Vale para o aparelho inteiro, jogo incluído.">'
    + '<span class="medRot" aria-hidden="true">medição</span>'
    + '<span class="medEst" data-estado>ligada</span></button>';
}

// O estilo da FRASE, e só dela. O botão não está mais aqui — ele é uma tábua da barra e se
// veste no `barraCss()` do `chrome-plataforma.js`. Os dois parâmetros de cor que esta função
// recebia (`cor`, `apagada`) existiam só para o botão do rodapé e saíram com ele: parâmetro que
// ninguém lê é uma promessa de que mudá-lo faz alguma coisa.
function estilo() {
  return '  .med { margin:.9rem 0 0; font-size:.82rem; line-height:1.55; }\n';
}

// ---------------------------------------------------------------- o bloco que roda na página
//
// ES5 de propósito e sem uma única dependência: é o mesmo desenho do `medir()` do jogo, e o
// pedaço que mais importa é o `catch` vazio — é ele que faz a medição não ter como estragar a
// leitura de ninguém. Não há `await` em caminho nenhum, então adblock, 503 ou servidor mudo
// não custam um milissegundo de espera à página.
function script(secao) {
  if (SECOES.indexOf(secao) < 0) throw new Error('seção desconhecida na medição: ' + secao);
  return '<script>\n'
+ '(function () {\n'
+ '  var SECAO = ' + JSON.stringify(secao) + ';\n'
+ '  var ENDERECO = ' + JSON.stringify(ENDERECO_MEDIDA) + ';\n'
+ '  var CHAVE = ' + JSON.stringify(MEDIDA_CHAVE) + ';\n'
+ '  var K_MEDIR = ' + JSON.stringify(CHAVE_MEDIR) + ', K_ANON = ' + JSON.stringify(CHAVE_ANON) + ';\n'
+ '  var TETO = ' + TETO + ', enviados = 0;\n'
+ '  // O padrão é LIGADO e o rodapé diz isso na cara. Só a string exata "nao" desliga: um\n'
+ '  // localStorage adulterado que traga outra coisa erra para o lado de respeitar o que a\n'
+ '  // página MOSTRA, que é o que a pessoa leu.\n'
+ '  var ligado = true;\n'
+ '  try { ligado = localStorage.getItem(K_MEDIR) !== "nao"; } catch (e) { ligado = true; }\n'
+ '  function sorteado() {\n'
+ '    var b = new Uint8Array(16), s = "", i;\n'
+ '    try { crypto.getRandomValues(b); } catch (e) {\n'
+ '      for (i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);\n'
+ '    }\n'
+ '    for (i = 0; i < 16; i++) s += (b[i] + 256).toString(16).slice(1);\n'
+ '    return s;\n'
+ '  }\n'
+ '  // Um identificador que não veio de você: dezesseis bytes sorteados. Não é o aparelho,\n'
+ '  // não é o navegador, não é hora nem tela. É o MESMO do jogo, de propósito — dois números\n'
+ '  // seriam dois identificadores, não meio.\n'
+ '  function id() {\n'
+ '    var g = null;\n'
+ '    try { g = localStorage.getItem(K_ANON); } catch (e) { g = null; }\n'
+ '    if (typeof g === "string" && /^[0-9a-f]{32}$/.test(g)) return g;\n'
+ '    var novo = sorteado();\n'
+ '    try { localStorage.setItem(K_ANON, novo); } catch (e) {}\n'
+ '    return novo;\n'
+ '  }\n'
+ '  function medir() {\n'
+ '    if (!ligado) return;\n'
+ '    // Aberta com dois cliques do arquivo não há domínio, e o fetch sairia com origem null:\n'
+ '    // o navegador o recusaria com erro no console. Mesma guarda do jogo.\n'
+ '    if (location.protocol === "file:") return;\n'
+ '    if (enviados >= TETO) return;\n'
+ '    enviados++;\n'
+ '    var corpo = {\n'
+ '      api_key: CHAVE,\n'
+ '      event: ' + JSON.stringify(EVENTO) + ',\n'
+ '      distinct_id: id(),\n'
+ '      properties: {\n'
+ '        $ip: null,                      // descarte o endereço; não o guarde, não o geolocalize\n'
+ '        $process_person_profile: false, // conte o evento e não abra ficha de ninguém\n'
+ '        $lib: "brasil",                 // não é a biblioteca do PostHog; é este bloco\n'
+ '        secao: SECAO\n'
+ '      },\n'
+ '      timestamp: new Date().toISOString()\n'
+ '    };\n'
+ '    // text/plain é o único tipo que não dispara verificação prévia; credentials "omit" é o\n'
+ '    // que garante que cookie nenhum vai nem volta; keepalive deixa o pedido sair de uma aba\n'
+ '    // que já está fechando. E o catch vazio é a parte importante do bloco.\n'
+ '    try {\n'
+ '      fetch(ENDERECO, { method: "POST", credentials: "omit", keepalive: true,\n'
+ '        headers: { "Content-Type": "text/plain" }, body: JSON.stringify(corpo) })["catch"](function () {});\n'
+ '    } catch (e) {}\n'
+ '  }\n'
+ '  // O BOTÃO ESTÁ NA BARRA DO TOPO desde 23/08, e este bloco é a fiação dele. O script vem\n'
+ '  // depois do <nav>, então o alvo já existe; o `if (!bt)` continua porque uma página futura\n'
+ '  // pode ter medição sem chrome, e medir nunca pode quebrar por causa de um botão ausente.\n'
+ '  var bt = document.getElementById(' + JSON.stringify(ID_BOTAO) + ');\n'
+ '  function pintar() {\n'
+ '    if (!bt) return;\n'
+ '    // Só o pedaço do ESTADO é reescrito: o rótulo "medição" fica, e é ele que diz do que\n'
+ '    // este botão trata quando a barra está rolada e só ele aparece.\n'
+ '    var est = bt.querySelector("[data-estado]");\n'
+ '    if (est) est.textContent = ligado ? "ligada" : "desligada";\n'
+ '    else bt.textContent = ligado ? "medição: ligada" : "medição: desligada";\n'
+ '    bt.setAttribute("aria-pressed", ligado ? "true" : "false");\n'
+ '    bt.setAttribute("aria-label", ligado ? "Medição ligada. Toque para desligar."\n'
+ '      : "Medição desligada. Toque para ligar.");\n'
+ '  }\n'
+ '  if (bt) bt.addEventListener("click", function () {\n'
+ '    ligado = !ligado;\n'
+ '    try { localStorage.setItem(K_MEDIR, ligado ? "sim" : "nao"); } catch (e) {}\n'
+ '    pintar();\n'
+ '  });\n'
+ '  pintar();\n'
+ '  medir();\n'
+ '})();\n'
+ '</' + 'script>';
}

module.exports = {
  MEDIDA_HOST, ENDERECO_MEDIDA, MEDIDA_CHAVE,
  CHAVE_MEDIR, CHAVE_ANON, ID_BOTAO, EVENTO, SECOES, PERMITIDAS, TETO,
  rodape, estilo, botaoHtml, script
};
