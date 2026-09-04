// O CARTÃO DO LINK DE UMA SEÇÃO — escrito UMA vez, usado pelas páginas de papel.
//
// POR QUE ESTE ARQUIVO EXISTE. A growth conferiu por `curl` real em TRÊS rodadas distintas do
// mesmo dia (21/08: growth · growth onda 2 · growth divulgação) que `historia`, `glossario` e
// `de-onde-vem` não têm `og:image`. Mandar o link de qualquer uma delas no WhatsApp — que é
// por onde este projeto vai circular no Brasil — devolve o retângulo cinza. Robô de rede
// social não reclama: ele busca uma vez, não acha imagem, e guarda o cinza por semanas.
//
// O MOLDE É O DO TERRITÓRIO (21/08), e ele já resolveu a pergunta difícil: o cartão é um PRINT
// DA PRÓPRIA PÁGINA, nunca uma segunda arte desenhada à parte. Uma imagem feita à mão seria a
// segunda cópia do conteúdo — o modo de falha que os geradores existem para não ter (uma
// fonte, duas saídas). Se a página mudar, o cartão muda junto no mesmo comando; se alguém
// tivesse desenhado o cartão, ele envelheceria em silêncio, e num cartão de link ninguém
// confere.
//
// POR QUE NÃO REUSAR A `compartilhar.jpg` DA RAIZ: ela é HUD de partida. Um cartão que promete
// jogo e entrega glossário gasta o clique de graça — foi o argumento do próprio território.
//
// O QUE ELE COBRA, e cada cobrança nasceu de um jeito concreto de apodrecer em silêncio:
//   (a) O CARTÃO É A ABERTURA. O `h1` tem de caber INTEIRO dentro dos 1200×630 do print. É a
//       única coisa que faz o cartão explicar a seção: um print do miolo do glossário é uma
//       parede de verbetes que não diz o que é aquilo. Basta alguém acrescentar uma faixa
//       acima do cabeçalho para o título sair pela borda de baixo, e nada quebraria.
//   (b) NENHUM CONTROLE NO PRINT. Num JPEG não há botão para tocar. O interruptor da medição
//       e qualquer coisa `fixed`/`sticky` saem ANTES do print — e depois se confere que
//       nenhum `button` sobrou dentro do quadro. Não é a linha sumindo: ela continua na
//       PÁGINA, que é onde o botão funciona.
//   (c) A PÁGINA ESTÁ VESTIDA COM A SERIFA DA CASA. Escrito quando as páginas carregavam
//       Bitter/Source Sans/IBM Plex do Google e o print sem rede saía em Georgia. A onda 1 de
//       22/08 tirou o Google e pôs a serifa da casa; a cobrança acompanhou e virou IGUALDADE
//       contra `CHROME.TITULO`, a fonte única de onde a `var(--titulo)` sai. O porquê da forma
//       exata (e o dia em que ela ficou muda) está na linha da checagem, lá embaixo.
//   (d) PESO. Acima de ~300 KB o robô da prévia desiste de buscar; abaixo de 20 KB o JPEG é
//       uma chapa lisa (foi assim que o território pegou o print tirado cedo demais). A meta
//       de projeto (90 KB) é mais apertada e quem a cobra é test/cartao-controle.js.
//   (e) O GRÃO DO PAPEL SAI DO PRINT — a única coisa da PÁGINA que o cartão não mostra, e a
//       única textura envolvida. O bloco GRAO_FORA abaixo tem a medição que decidiu isso.
//
//   (f) A FONTE VIAJA COM O PRINT, e o que se confere é o GLIFO PINTADO. A cobrança (c) lê
//       `getComputedStyle`, que devolve a LISTA DECLARADA — ela nunca soube dizer qual
//       família o navegador desenhou, e por isso NUNCA reprovou, em máquina nenhuma, o
//       cartão sair com a tipografia do host (PENDENTES 101b/101c). Desde 02/09 a página
//       recebe, EM MEMÓRIA e só para o print, um `@font-face` com a fonte embutida em
//       base64 (ferramentas/tipografia/, licença OFL 1.1), toda pilha de serifa da casa
//       passa a começar por ela, e três recusas cobram o resultado: nenhum elemento
//       trocado · a fonte não carregou · o título não está sendo pintado nela. A terceira
//       mede LARGURA DE AVANÇO, não CSS — a única prova possível de qual glifo saiu.
//       Nenhum byte de `<secao>/index.html` muda por causa disto.
//
//   (g) A MARGEM ESQUERDA DO MOLDE, e o que o recorte QUADRADO do WhatsApp/Twitter faz com
//       ela (arte, 03/09 — item cartao-margem-esquerda). O card de 1200×630 não é só assim
//       que ele é mostrado: em vários lugares (pré-visualização em círculo, cartão de perfil,
//       algumas dobras do feed) o cliente recorta um QUADRADO CENTRADO — x de (LARGURA-ALTURA)/2
//       até LARGURA-(LARGURA-ALTURA)/2, ou seja 285..915 nesta medida. Medido nas três páginas
//       publicadas em 03/09: o `<h1>` nasce em x=268/270/271 e a caixa da primeira tábua da
//       barra nasce em x=275 — as três, porque as três compartilham o MESMO `.env{max-width:
//       44rem;margin:0 auto;padding:2.6rem 1.25rem 5rem}` do molde (não é a tipografia: o
//       Gelasio muda a LARGURA do título, não a ORIGEM da caixa). Isso é ANTES de 285: o
//       recorte quadrado morde a primeira letra do título e a moldura da primeira tábua.
//       Este arquivo não edita `.env` — não é dele, é de `gerar-historia.js`/`gerar-
//       glossario.js`/`gerar-fontes.js`. O que ele faz, no mesmo lugar onde já faz o GRAO_FORA
//       e a fonte embutida (EM MEMÓRIA, só no print, nenhum byte da página publicada muda), é
//       empurrar esse contêiner para a direita o bastante para sobreviver ao recorte, com uma
//       folga contra antialiasing/arredondamento — e DEPOIS medir a posição REAL (não o CSS
//       pedido) do título e da primeira tábua, para reprovar se a correção não pegar (troca de
//       nome de classe no molde, por exemplo — falha FECHADA, não silenciosa).
//       NÃO CONFUNDIR com a decisão de serifa (fechada): a régua aqui é ESPAÇO, não fonte.
//
//   (h) O CARTÃO AINDA DEPENDE DA MÁQUINA QUE O GERA — só que menos, e agora com número
//       (item `cartoes-sociais-peso-mudou-sem-explicacao`, 04/09). O item nasceu de quatro
//       cartões que mudaram de peso numa entrega que só acrescentou um link no RODAPÉ
//       (`bd63663`, a página /privacidade/): território −1677, história +854, de-onde-vem
//       +1192, glossário −9 bytes. A hipótese em pauta era rede (fonte do Google chegando por
//       timing), e ela está REFUTADA — o bloco acima diz por quê. O que foi medido no lugar:
//
//       1. NÃO HÁ NÃO-DETERMINISMO ENTRE RODADAS, nas três seções. Dois `node
//          ferramentas/gerar-{historia,fontes,glossario}.js` seguidos, sem tocar em nada:
//          md5 IGUAL e byte IGUAL nas duas — 84.702 · 87.668 · 81.553. (O quarto cartão, o do
//          território, É não-determinístico, e por outra causa já documentada: dois runs
//          seguidos deram 89.799 e 89.814 bytes, md5 diferente, por causa da brasa pulsante
//          dos pinos 3D. Ele não passa por este arquivo.)
//       2. O QUE MUDOU FOI A MÁQUINA, e está no `git log`: `a7a82a7`/`1484f0a` saíram da
//          nuvem (autor `Claude`, fuso +0000, Linux) e `bd63663` saiu da máquina do dono
//          (autor `mrcx-code`, fuso −0300, Windows). Nenhum byte da PÁGINA visível no quadro
//          mudou entre as duas (o link novo vive num `<p class="med">` do rodapé, que este
//          arquivo esconde ANTES do print e que está fora dos 630 px de qualquer jeito).
//       3. A DIFERENÇA TEM DUAS PARTES, separadas por sobreposição de mancha de tinta (IoU
//          da tinta binarizada, por faixa de linhas, entre o JPEG de `a7a82a7` e o de
//          `bd63663` — história):
//            barra de tábuas (y 48–95)     IoU 0,977  ← mesmo desenho, outro antialias
//            selo + título   (y 127–224)   IoU 0,952  ← idem: a Gelasio embutida FUNCIONA
//            `.conta`, mono  (y 300–325)   IoU 0,123  ← OUTRO TIPO DE LETRA, não antialias
//            `.quando`, mono (y 398–420)   IoU 0,364  ← idem
//          Ou seja: a serifa viaja com o print desde 02/09 e a prova disso é o IoU alto; o que
//          NÃO viaja é o MONO. `--mono` é `ui-monospace,…,Consolas,monospace`
//          (chrome-plataforma.js) e não está — de propósito — em `FAMILIAS_SERIFA`, então
//          esses elementos continuam pintados pela fonte do host: Consolas no Windows,
//          DejaVu/Liberation no Linux. É o defeito do PENDENTES 101b, sobrevivendo no mono.
//       4. O RESTO (o IoU 0,95–0,98 da serifa) é rasterização do sistema — DirectWrite contra
//          FreeType — e NÃO tem conserto por embutir fonte: o mesmo glifo, na mesma posição,
//          com outro filtro de suavização. Print de navegador não é byte-idêntico entre
//          sistemas operacionais, e afirmar o contrário seria prometer o impossível.
//
//       O QUE ESTE ARQUIVO PASSOU A FAZER COM ISSO, já que consertar (4) é impossível e
//       consertar (3) é decisão de ARTE (trocar o mono do cartão por serifa muda o desenho
//       publicado) ou exige um segundo binário de fonte com licença conferida: ele CONTA as
//       forasteiras — todo elemento com texto próprio DENTRO do quadro cuja família pintada
//       não é a embutida — e RECUSA se aparecer uma que não esteja na lista fixa abaixo.
//       Assim o que hoje é uma dependência de máquina CONHECIDA e de tamanho medido não pode
//       crescer em silêncio: o dia em que um bloco novo entrar na página vestido de mono, ou
//       de qualquer coisa que não seja a serifa da casa, a geração para em vez de publicar um
//       cartão que muda de cara conforme quem apertou o botão.
//
// E o print sai a `deviceScaleFactor: 1` de propósito: a 2 ele sairia 2400×1260 e desmentiria
// as tags `og:image:width`/`height` que o próprio gerador escreve.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CHROME = require('./chrome-plataforma.js');
// A FONTE QUE VIAJA COM O PRINT (PENDENTES 101b/101c, 02/09). O porque, a medicao que o
// pediu e a licenca estao em ferramentas/tipografia-cartao.js e em ferramentas/tipografia/.
const TIPO = require('./tipografia-cartao.js');
// Só pelo `chromiumPath()`: este arquivo abre a página por `file://` de propósito (é um print
// de artefato local, não uma medição do jogo), então não usa o servidor do abrir.js.
const ABRIR = require('../test/abrir.js');

// O tamanho que WhatsApp, Twitter e Facebook usam. Escrito aqui e lido pelas tags, para não
// haver duas versões do mesmo número.
const LARGURA = 1200;
const ALTURA = 630;

// A qualidade do JPEG. Era 85 (a do território) até 22/08, quando a onda 3 pôs papel de campo
// nas três seções e o cartão TRIPLICOU sem ninguém ver: 66→183, 67→180, 74→183 KB, contra uma
// meta de 90. Ver GRAO_FORA logo abaixo para a causa. Com o grão fora do print, 80 é o maior
// valor que deixa as três com folga — medido nas três páginas, com a PAUTA mantida:
//     q85  93,1 · 93,4 · 97,6      q84  91,2 · 91,4 · 95,5     (de-onde-vem ainda fura a meta)
//     q82  86,5 · 86,9 · 90,7      q80  81,5 · 81,7 · 85,5  ← escolhido
//     q78  78,5 · 78,8 · 82,4      q76  73,5 · 73,8 · 77,2
// Abaixar mais só compraria KB que ninguém pediu, ao custo do único texto que o cartão tem.
const QUALIDADE = 80;

// A faixa de peso. Meta de projeto: <= 90 KB (o do território tem 68). A faixa abaixo é o
// PORTÃO — mais larga que a meta de propósito, porque um cartão 12 KB acima da meta ainda
// funciona e derrubar a geração por isso seria trocar um defeito real por um imaginário. O
// número medido de cada seção sai no console e vai para o relatório.
const KB_MIN = 20;
const KB_MAX = 300;

// ---- O GRÃO SAI DO PRINT, e é a única textura que sai (22/08) ----
//
// O QUE ACONTECEU. A onda 3 da arte deu papel de campo às três seções de leitura: `--pauta`
// (risco de 1 px a cada 11) e `--graoPx` (speckle de 2 px, PNG de 96×96 ladrilhado no body
// inteiro). Na PÁGINA isso custa alguns KB de data-URI e é o que faz o papel parecer papel.
// No CARTÃO custou o triplo do arquivo, porque JPEG é transformada de cosseno em blocos de
// 8×8: ruído disperso de alta frequência é o pior caso possível para ele — cada speckle vira
// coeficiente que não se pode jogar fora. Medido nas três páginas, a 1200×630 e q85:
//     com tudo            182,8 · 179,6 · 183,4 KB
//     sem PAUTA           174,8 · 170,4 · 175,6 KB   ← a pauta quase não pesa (linha reta,
//                                                      periódica, o JPEG a resolve barato)
//     sem GRÃO             93,1 ·  93,4 ·  97,6 KB   ← -49%: é ELE, sozinho
//     sem grão nem pauta   68,8 ·  68,0 ·  73,7 KB
// Também foram medidos e RECUSADOS: só abaixar a qualidade (q55 chega a 94,6 — ainda fura a
// meta, e a 55 o texto do cartão, que é a única coisa que ele tem, começa a franjar) e borrar
// o grão com filter:blur (178,7 KB — blur em CSS não é filtro passa-baixa antes da DCT: o
// Chromium rasteriza a página borrada e o JPEG paga o mesmo ruído, agora sujo).
//
// POR QUE ISTO NÃO FERE O "O CARTÃO É UM PRINT DA PRÓPRIA PÁGINA". A regra existe contra uma
// SEGUNDA CÓPIA DO CONTEÚDO envelhecendo em silêncio: título, contagem, texto e cor continuam
// vindo da página, num comando só. O que sai é uma textura de 2 px que, no tamanho em que o
// cartão é visto (o WhatsApp mostra ~400 px de largura), nenhum olho resolve. A PAUTA FICA
// justamente por isso: ela custa ~8 KB, é visível como pauta, e é ela que segura a leitura de
// "papel" no cartão. Mesma família da linha que o território já tirava do print dele (o
// interruptor da medição): controle e microtextura não fazem falta numa imagem estática.
//
// SE ISTO APODRECER: quem cobra é test/cartao-controle.js, que reprova acima de 90 KB nas
// quatro seções. Uma textura nova entrando no papel derruba aquele portão, não este arquivo.
const GRAO_FORA = ':root{--graoPx:none!important}';

// ---- (g) A MARGEM ESQUERDA — ver o item (g) no comentário do topo do arquivo ----
//
// O NÚMERO NÃO É REDIGITADO: `MARGEM_SEGURA` sai da MESMA conta que produz o "285..915" do
// item cartao-margem-esquerda — (LARGURA-ALTURA)/2 — porque é assim que um recorte quadrado
// centrado nasce de um retângulo 1200×630. Se `LARGURA`/`ALTURA` mudarem um dia, esta conta
// muda junto, em vez de ficar um "285" solto que ninguém lembra de onde veio.
const MARGEM_SEGURA = Math.round((LARGURA - ALTURA) / 2); // 285
// A FOLGA é colchão, não frouxidão: compensa a variação de até ~3 px entre glifos (o "A" e o
// "O" não têm o mesmo avanço à esquerda dentro da própria caixa, medido em 03/09) e o
// arredondamento do próprio recorte quadrado feito por cada cliente (não são todos px-exatos).
const MARGEM_FOLGA = 12;
// A CORREÇÃO, só no print (mesmo mecanismo do GRAO_FORA e da fonte embutida acima: entra em
// memória, na página já carregada, e nenhum byte de `<secao>/index.html` muda por causa dela).
// Empurra o `.env` — o contêiner centralizado do molde das três páginas de leitura — para a
// direita: valor ABSOLUTO (não "+X" sobre o padding que já existe), para não depender de
// quanto esse padding vale hoje, que não é deste arquivo. Medido — e o número foi CORRIGIDO em
// 03/09 pelo porteiro, que mediu de novo em vez de acreditar: o título nasce em **304** nas três
// páginas (retângulo real do `h1`; a tinta no JPEG começa em 304/306/306), não no "≈298" que
// esta linha afirmava. A folga acima de MARGEM_SEGURA+MARGEM_FOLGA=297 é maior que a anunciada
// — mas número em comentário que ninguém remede é como um "298" vira fato daqui a duas sessões.
// Quem cobre isto em CI é `test/cartao-controle.js` (passo próprio no `teste.yml`, sem
// `continue-on-error`), com o mutante `CARTAO_MARGEM_DEFEITO=1`: medido, ele sai exit 1 com 8
// falhas de 49. A referência anterior era para um `test/cartao-margem-controle.js` que NUNCA
// FOI COMMITADO — ponteiro pendurado, achado pelo QA e conferido por `grep` (a única ocorrência
// no repositório era esta própria linha). Se o seletor `.env` um dia deixar de existir no
// molde, esta regra não morde nada (CSS solto não quebra build) — e é por isso que a posição
// REAL é MEDIDA e cobrada logo abaixo, em vez de confiar só nesta injeção.
const MARGEM_CSS = '.env{padding-left:56px!important}';

// ---- (h) AS FORASTEIRAS — o que, dentro do quadro, ainda é pintado pela máquina ----
//
// A lista é FIXA e curta de propósito: ela é o inventário do que hoje sai em `var(--mono)`
// dentro dos 1200×630 das três seções, medido em 04/09 (o seletor, a caixa e o texto de cada
// um estão no relatório do item). Nada aqui é aspiração — é o retrato do que existe:
//     .conta       as três seções  ("47 momentos · 47 com fonte…", "61 fontes · 11 grupos"…)
//     .quando      história        ("há mais de onze mil anos")
//     .hojeR       história        ("quem lê hoje")
//     .grupo > h2  de-onde-vem e glossário (o cabeçalho do primeiro grupo)
//
// POR QUE UMA LISTA, E NÃO UM NÚMERO. Um teto ("no máximo 3 forasteiras") aprovaria a troca de
// uma por outra em silêncio, que é exatamente o modo de falha que este bloco existe para pegar.
// E por que RECUSAR em vez de só contar: a mesma razão do resto do arquivo — num cartão de link
// ninguém confere, e o robô do WhatsApp guarda o que buscou por semanas.
//
// SE VOCÊ VEIO PARAR AQUI PORQUE A GERAÇÃO RECUSOU: a resposta certa quase nunca é acrescentar
// o seletor novo nesta lista. É perguntar por que aquele bloco não veste a serifa da casa —
// crescer esta lista é aumentar, de propósito, a parte do cartão que muda de cara conforme a
// máquina. Acrescente só quando for decisão de arte, e escreva no commit qual foi.
const HOST_ESPERADO = ['.conta', '.quando', '.hojeR', '.grupo > h2'];

// As tags do <head>, montadas de uma vez para nenhuma seção esquecer metade delas. A URL vem
// SEMPRE da BASE de ferramentas/dominio.js — endereço escrito à mão numa tag og: é o jeito
// clássico de a prévia quebrar quando o domínio muda, e em silêncio.
function tags(base, secao, alt) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return [
    '<meta property="og:image" content="' + base + '/' + secao + '/compartilhar.jpg">',
    '<meta property="og:image:width" content="' + LARGURA + '">',
    '<meta property="og:image:height" content="' + ALTURA + '">',
    '<meta property="og:image:alt" content="' + esc(alt) + '">',
    '<meta name="twitter:card" content="summary_large_image">'
  ].join('\n');
}

// Tira o print de `<dir>/index.html` e escreve `<dir>/compartilhar.jpg`.
// Devolve { kb, titulo, escondidos } para o gerador imprimir.
async function tirar(dir, op) {
  op = op || {};
  const pagina = path.join(dir, 'index.html');
  if (!fs.existsSync(pagina)) throw new Error('cartao-secao: não achei a página ' + pagina);
  const destino = path.join(dir, 'compartilhar.jpg');
  const url = 'file:///' + pagina.split(path.sep).join('/');

  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: LARGURA, height: ALTURA }, deviceScaleFactor: 1 });
  const erros = [];
  pg.on('pageerror', (e) => erros.push('pageerror: ' + e));
  pg.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });

  try {
    await pg.goto(url);
    // (f) A FONTE ENTRA ANTES DE `document.fonts.ready`, para o navegador ja ter decidido
    // sobre ela quando a espera abaixo resolver. Ela nao encosta em nenhum byte publicado:
    // vive so nesta pagina em memoria, como o GRAO_FORA la em cima.
    await pg.addStyleTag({ content: TIPO.css({ defeito: process.env.CARTAO_TIPOGRAFIA_DEFEITO }) });
    // ESTA ESPERA NÃO É DE REDE, e a linha que dizia que era custou um item inteiro do backlog
    // (`cartoes-sociais-peso-mudou-sem-explicacao`, 04/09). Ela dizia "as fontes do Google chegam
    // por rede" — verdade até 22/08, quando a onda 1 tirou o Google das páginas. Medido por
    // `grep` em 04/09: ZERO ocorrências de `fonts.googleapis`/`fonts.gstatic` nas cinco páginas
    // publicadas (a única do repositório é um comentário no dashboard descrevendo a remoção).
    // A única fonte que esta página carrega é a `@font-face` em base64 da linha acima, que já
    // está em memória — então o que se espera aqui é o navegador terminar de DECIDIR sobre ela,
    // não uma viagem de rede. O comentário velho fez um parecer de QA concluir que o print era
    // não-determinístico por timing de rede; ele não é (medido logo abaixo, no bloco (h)).
    await pg.evaluate(() => document.fonts.ready);
    // e um respiro para o primeiro layout com as fontes já trocadas
    await pg.waitForTimeout(250);

    // ---- (b) fora do print: o interruptor da medição, tudo o que flutua, o grão — e (g) a
    // margem esquerda, exceto quando CARTAO_MARGEM_DEFEITO pede para ela ficar fora (mutante) ----
    const margemCss = process.env.CARTAO_MARGEM_DEFEITO ? '' : MARGEM_CSS;
    const escondidos = await pg.evaluate((cfg) => {
      let n = 0;
      document.querySelectorAll('.med').forEach((e) => { e.style.display = 'none'; n++; });
      document.querySelectorAll('body *').forEach((e) => {
        const p = getComputedStyle(e).position;
        if (p === 'fixed' || p === 'sticky') { e.style.display = 'none'; n++; }
      });
      // O grão de 2 px sai SÓ do print (ver GRAO_FORA lá em cima: 183 -> 93 KB). A página não
      // muda; o que muda é a foto dela. A margem esquerda (g) viaja no MESMO elemento de estilo.
      const st = document.createElement('style');
      st.textContent = cfg.graoFora + cfg.margemCss;
      document.head.appendChild(st);
      window.scrollTo(0, 0);
      return n;
    }, { graoFora: GRAO_FORA, margemCss: margemCss });

    const cena = await pg.evaluate(() => {
      const h1 = document.querySelector('h1');
      const r = h1 ? h1.getBoundingClientRect() : null;
      // (g) a primeira tábua da barra — sempre a marca "BRASIL" (chrome-plataforma.js).
      const tabua = document.querySelector('.barra a');
      const rt = tabua ? tabua.getBoundingClientRect() : null;
      // Um botão só conta se ALGUM pixel dele cai dentro do quadro do print.
      const dentro = (b) => b.width > 0 && b.height > 0
        && b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth;
      const botoes = [...document.querySelectorAll('button, input, select, [role="button"]')]
        .filter((e) => dentro(e.getBoundingClientRect()))
        .map((e) => e.tagName + (e.id ? '#' + e.id : '') + ': ' + (e.textContent || '').trim().slice(0, 40));
      return {
        titulo: h1 ? h1.textContent.trim() : null,
        topo: r ? Math.round(r.top) : null,
        base: r ? Math.round(r.bottom) : null,
        // (g) posição REAL do título e da primeira tábua — não o CSS pedido, o retângulo que
        // o layout realmente produziu depois da correção (ou da falta dela, no mutante).
        esquerda: r ? Math.round(r.left) : null,
        tabuaEsquerda: rt ? Math.round(rt.left) : null,
        // AS FAMÍLIAS QUE DE FATO CHEGARAM. `document.fonts` é o conjunto de @font-face que a
        // página conhece — vazio quando a folha do Google não veio. Só entram as que estão
        // `loaded`: uma que ficou em `unloaded` é uma que o navegador nunca desenhou.
        //
        // POR QUE NÃO `document.fonts.check()`, e isto foi MEDIDO: com a folha de estilo do
        // Google removida de propósito, `check('700 2rem Bitter')` responde **true**. Ele não
        // pergunta "esta família existe?", e sim "dá para desenhar isto agora?" — e dá, com a
        // fonte de recuo. O controle de test/cartao-controle.js pegou o portão passando.
        fontes: [...document.fonts].filter((f) => f.status === 'loaded')
          .map((f) => f.family.replace(/^['"]|['"]$/g, '')),
        // A SERIFA DA CASA (arte, 22/08). As páginas deixaram de carregar Google Fonts e passaram
        // à serifa de sistema (Palatino/Georgia). Não há @font-face para esperar — o que se cobra
        // agora é que o TÍTULO resolva numa serifa, não que uma fonte de rede tenha chegado.
        tituloFonte: h1 ? getComputedStyle(h1).fontFamily : '',
        botoes: botoes
      };
    });

    if (!cena.titulo) throw new Error('RECUSADO: a página não tem <h1> — o cartão sairia sem dizer que seção é');
    if (cena.topo < 0 || cena.base > ALTURA) {
      throw new Error('RECUSADO: o título "' + cena.titulo + '" não cabe no quadro do cartão (topo '
        + cena.topo + ', base ' + cena.base + ' de ' + ALTURA + ' px) — o cartão mostraria um miolo'
        + ' sem nome. Se algo novo entrou acima do cabeçalho, ele tem de caber junto.');
    }
    // (g) A MARGEM ESQUERDA — o recorte QUADRADO centrado que WhatsApp/Twitter usam corta em
    // x=MARGEM_SEGURA de cada lado. Título ou primeira tábua nascendo antes disso é a mesma
    // "mordida" que o item cartao-decepa-primeira-tabua descreveu, medida por RETÂNGULO real
    // (não pelo CSS pedido), então uma correção que pare de morder (troca de classe no molde,
    // por exemplo) reprova aqui em vez de publicar um cartão mordido em silêncio.
    if (cena.esquerda !== null && cena.esquerda < MARGEM_SEGURA) {
      throw new Error('RECUSADO: o título "' + cena.titulo + '" nasce em x=' + cena.esquerda
        + ' — antes do recorte QUADRADO centrado que WhatsApp/Twitter usam (corta em x='
        + MARGEM_SEGURA + '..' + (LARGURA - MARGEM_SEGURA) + '). A primeira letra sairia mordida'
        + ' nesse recorte. Confira MARGEM_CSS e o `.env` do molde da página.');
    }
    if (cena.tabuaEsquerda !== null && cena.tabuaEsquerda < MARGEM_SEGURA) {
      throw new Error('RECUSADO: a primeira tábua da barra nasce em x=' + cena.tabuaEsquerda
        + ' — antes do recorte QUADRADO centrado (corta em x=' + MARGEM_SEGURA + '..'
        + (LARGURA - MARGEM_SEGURA) + '). A moldura da tábua sairia mordida nesse recorte.'
        + ' Confira MARGEM_CSS e o `.env` do molde da página.');
    }
    if (cena.botoes.length) {
      throw new Error('RECUSADO: controle visível dentro do quadro do cartão — ' + cena.botoes[0]
        + '. Num JPEG não há botão para tocar; esconda-o antes do print (é o que a lista de .med'
        + ' e de position fixed/sticky faz).');
    }
    // A serifa da casa tem de estar de pé no título. Se um dia alguém devolver um título em
    // sans/mono, ou quebrar a var(--titulo), o cartão sairia com outra identidade — e é isso que
    // se cobra, não mais a chegada de uma fonte de rede (as páginas não usam mais Google Fonts).
    //
    // A ARMADILHA QUE ISTO JÁ PAGOU (22/08). A cobrança anterior era um /…|\bserif\b/ solto, e
    // ele deixava passar o defeito exato que o controle injeta: **`sans-serif` CONTÉM `serif`**,
    // com um hífen antes do `s`, que é fronteira de palavra para o `\b`. Medido, imprimindo o
    // estado (EQUIPE 2.9): com `h1{font-family:Arial,sans-serif}` a computada é "Arial,
    // sans-serif" e o teste antigo respondia **true** — o portão ficou MUDO por um dia inteiro
    // enquanto o controle o dava por vivo. A mesma frouxidão engolia `Arial, Georgia`: procurar
    // um nome de serifa em QUALQUER posição da lista aprova uma sans que só tem serifa no recuo.
    //
    // A cobrança agora é de IGUALDADE contra a fonte única — CHROME.TITULO, de onde a var(--titulo)
    // das cinco páginas sai. `getComputedStyle` devolve a LISTA DECLARADA (não a família que o
    // sistema resolveu), então isto é determinístico em qualquer máquina, e é o que a mensagem de
    // erro sempre prometeu: "a serifa da casa", não "alguma serifa em algum lugar da lista".
    const normFam = (s) => String(s || '').toLowerCase().replace(/["']/g, '').split(',')
      .map((x) => x.trim()).filter(Boolean).join(',');
    const esperada = normFam(CHROME.TITULO);
    const serifaCasa = normFam(cena.tituloFonte) === esperada;
    if (!serifaCasa) {
      throw new Error('RECUSADO: o título não está na serifa da casa (font-family computada: "'
        + cena.tituloFonte + '"; esperada "' + CHROME.TITULO + '"). O cartão sairia com outra'
        + ' identidade visual — confira var(--titulo) e ferramentas/chrome-plataforma.js.');
    }

    // ---- (f) O QUE O PRINT PINTA, e nao mais so o que o CSS pede ----
    //
    // A CONFERENCIA ACIMA NAO REPROVA ESTA CLASSE DE DEFEITO EM MAQUINA NENHUMA, e isso foi
    // provado ao vivo (PENDENTES 101c): `getComputedStyle().fontFamily` devolve a LISTA
    // DECLARADA, nunca a familia que o navegador desenhou. Numa maquina sem Palatino e sem
    // Georgia ela devolve a string "Palatino Linotype", Palatino, Georgia, serif inteira e
    // intacta enquanto o Chromium pinta Liberation Serif. Ela continua aqui porque pega OUTRA
    // coisa — alguem trocar a pilha declarada por uma sans — e e ela que os dois controles de
    // test/cartao-controle.js exercitam. O que faltava era isto:
    //
    // ORDEM E REQUISITO, nao gosto. A troca abaixo prepende a familia embutida a toda pilha
    // de serifa da casa; se ela rodasse ANTES, a igualdade de lista acima leria a pilha ja
    // trocada e reprovaria a pagina limpa. Antes: cobra-se o que a pagina PEDE. Depois:
    // garante-se o que o print PINTA.
    const troca = await pg.evaluate((cfg) => {
      const lista = (s) => String(s || '').split(',')
        .map((x) => x.trim().replace(/^["']|["']$/g, '').toLowerCase());
      // IGUALDADE de token, nunca substring: `sans-serif` CONTEM `serif`, e foi assim que o
      // portao do cartao ficou mudo por um dia em 22/08 (o comentario esta no controle).
      const daCasa = (fam) => lista(fam).some((t) => cfg.familias.indexOf(t) >= 0);
      const alvos = [document.documentElement, document.body,
        ...document.querySelectorAll('body *')]
        .filter((el) => !(cfg.pularTitulo && el.tagName === 'H1'));
      // Colhe TUDO antes de escrever: escrever no pai muda a computada do filho por heranca,
      // e um segundo passe prependeria a familia duas vezes.
      const colhido = alvos.map((el) => [el, getComputedStyle(el).fontFamily])
        .filter(([, fam]) => daCasa(fam));
      colhido.forEach(([el, fam]) => { el.style.fontFamily = '"' + cfg.familia + '",' + fam; });
      return colhido.length;
    }, { familia: TIPO.FAMILIA, familias: TIPO.familias(process.env.CARTAO_TIPOGRAFIA_DEFEITO),
         pularTitulo: TIPO.pularTitulo(process.env.CARTAO_TIPOGRAFIA_DEFEITO) });

    const fonte = await pg.evaluate(async (cfg) => {
      const q = '"' + cfg.familia + '"';
      try { await document.fonts.load('700 46px ' + q); } catch (e) { /* status conta a historia */ }
      try { await document.fonts.load('italic 400 16px ' + q); } catch (e) { /* idem */ }
      try { await document.fonts.ready; } catch (e) { /* idem */ }
      // A MEDIDA NAO E `getComputedStyle` E NAO E `document.fonts.check()`. A primeira le CSS;
      // a segunda responde TRUE DEMAIS (ela pergunta "da para desenhar isto agora?", e da,
      // com o recuo — medido em 22/08). Aqui se mede a LARGURA DE AVANCO de uma cadeia de
      // prova, que so pode sair igual se o glifo for o mesmo.
      const larg = (fam) => {
        const s = document.createElement('span');
        s.textContent = 'Glossario acoes RSTUVW gjpqy 0123456789';
        s.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:pre;'
          + 'font-size:96px;font-weight:400;font-style:normal;font-family:' + fam;
        document.body.appendChild(s);
        const w = s.getBoundingClientRect().width;
        s.remove();
        return Math.round(w * 100) / 100;
      };
      const h1 = document.querySelector('h1');
      const nome = (f) => f.family.replace(/^['"]|['"]$/g, '');
      return {
        carregadas: [...document.fonts].filter((f) => f.status === 'loaded').map(nome),
        estados: [...document.fonts].map((f) => nome(f) + '/' + f.style + ':' + f.status),
        larguraTitulo: h1 ? larg(getComputedStyle(h1).fontFamily) : null,
        larguraEmbutida: larg(q),
        larguraRecuo: larg('"__nenhuma familia com este nome 4f9c__"'),
      };
    }, { familia: TIPO.FAMILIA });

    if (troca === 0) {
      throw new Error('RECUSADO: nenhum elemento da pagina veste a serifa da casa, entao nao ha'
        + ' o que fixar — o cartao sairia na fonte do host. Confira var(--titulo)/var(--leitura)'
        + ' e ferramentas/tipografia-cartao.js (FAMILIAS_SERIFA).');
    }
    if (fonte.carregadas.indexOf(TIPO.FAMILIA) < 0) {
      throw new Error('RECUSADO: a fonte embutida "' + TIPO.FAMILIA + '" nao carregou — o cartao'
        + ' sairia com a tipografia desta maquina, que e o defeito que PENDENTES 101b registrou.'
        + ' Estado de document.fonts: ' + JSON.stringify(fonte.estados)
        + '. Confira ferramentas/tipografia/ (os .ttf e o OFL.txt existem?).');
    }
    if (fonte.larguraTitulo !== fonte.larguraEmbutida || fonte.larguraTitulo === fonte.larguraRecuo) {
      throw new Error('RECUSADO: o titulo nao esta sendo PINTADO na fonte embutida (largura da'
        + ' cadeia de prova: pilha do titulo ' + fonte.larguraTitulo + ' px, "' + TIPO.FAMILIA
        + '" ' + fonte.larguraEmbutida + ' px, recuo do host ' + fonte.larguraRecuo + ' px).'
        + ' Iguais a primeira e a segunda, e diferente da terceira, e o que prova o glifo.');
    }

    // ---- (h) O CENSO DAS FORASTEIRAS — ver o bloco (h) no comentário do topo do arquivo ----
    //
    // Roda DEPOIS da troca, de propósito: antes dela toda a página é forasteira, e o censo não
    // diria nada. Depois, sobra exatamente o que a troca não alcançou — que é o que muda de
    // desenho conforme a máquina que apertou o botão.
    //
    // O DEFEITO ENFIADO DE PROPÓSITO (EQUIPE 2.8: portão nunca visto reprovando é decoração):
    // `CARTAO_FORASTEIRA_DEFEITO=1` esvazia a lista fixa, e então as forasteiras que HOJE são
    // legítimas passam a ser desconhecidas e a geração TEM de recusar. Medido: exit 1.
    const esperado = process.env.CARTAO_FORASTEIRA_DEFEITO ? [] : HOST_ESPERADO;
    const forasteiras = await pg.evaluate((cfg) => {
      const dentro = (b) => b.width > 0 && b.height > 0
        && b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth;
      // Só elementos com texto PRÓPRIO: sem isto cada ancestral do parágrafo entraria na conta
      // por herança, e o censo viraria a árvore inteira em vez do lugar onde a tinta cai.
      const temTextoProprio = (el) => [...el.childNodes]
        .some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
      // `className` de um nó SVG é um SVGAnimatedString, e `String()` nele devolve
      // "[object SVGAnimatedString]" — o atributo é o que serve para nomear o alvo no erro.
      const nome = (el) => {
        const c = (el.getAttribute('class') || '').trim();
        return el.tagName.toLowerCase() + (c ? '.' + c.split(/\s+/).join('.') : '');
      };
      const out = [];
      document.querySelectorAll('body *').forEach((el) => {
        if (!temTextoProprio(el)) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        if (!dentro(el.getBoundingClientRect())) return;
        const primeira = cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
        if (primeira === cfg.familia) return;
        out.push({
          alvo: nome(el),
          familia: cs.fontFamily,
          texto: (el.textContent || '').trim().slice(0, 40),
          previsto: cfg.esperado.some((s) => { try { return el.matches(s); } catch (e) { return false; } }),
        });
      });
      return out;
    }, { familia: TIPO.FAMILIA, esperado: esperado });

    const desconhecidas = forasteiras.filter((f) => !f.previsto);
    if (desconhecidas.length) {
      throw new Error('RECUSADO: ' + desconhecidas.length + ' elemento(s) dentro do quadro do'
        + ' cartão são pintados por uma fonte DESTA MÁQUINA, e não pela embutida "' + TIPO.FAMILIA
        + '" — o primeiro é ' + desconhecidas[0].alvo + ' ("' + desconhecidas[0].texto + '"),'
        + ' font-family: ' + desconhecidas[0].familia + '. O cartão publicado sairia com desenho'
        + ' diferente conforme quem o gerou (medido em 04/09 entre Linux e Windows: sobreposição'
        + ' de tinta 0,12 no mono contra 0,95 na serifa embutida). Ou vista esse bloco com a'
        + ' serifa da casa, ou — se for decisão de arte — acrescente o seletor a HOST_ESPERADO'
        + ' dizendo no commit qual foi a decisão.');
    }

    // um quadro para o repintar sem o grão pousar antes do obturador
    await pg.waitForTimeout(120);
    await pg.screenshot({ path: destino, type: 'jpeg', quality: op.qualidade || QUALIDADE });
    if (erros.length) throw new Error('RECUSADO: erro na página ao tirar o cartão: ' + erros[0]);

    const kb = fs.statSync(destino).size / 1024;
    if (kb < KB_MIN || kb > KB_MAX) {
      throw new Error('RECUSADO: ' + path.basename(dir) + '/compartilhar.jpg saiu com '
        + kb.toFixed(0) + ' KB — fora da faixa de ' + KB_MIN + ' a ' + KB_MAX + ' KB');
    }
    return { kb: kb, titulo: cena.titulo, escondidos: escondidos, topo: cena.topo, base: cena.base,
      esquerda: cena.esquerda, tabuaEsquerda: cena.tabuaEsquerda, fixados: troca, fonte: TIPO.FAMILIA,
      // (h) quantos blocos DENTRO do quadro ainda dependem da fonte do host. Sai no retorno para
      // o relatório poder dizer o número em vez de "poucos" — e para ele ser visível se subir.
      forasteiras: forasteiras.length, forasteirasAlvos: forasteiras.map((f) => f.alvo) };
  } finally {
    await nav.close();
  }
}

module.exports = { LARGURA, ALTURA, QUALIDADE, KB_MIN, KB_MAX, MARGEM_SEGURA, HOST_ESPERADO,
  tags, tirar };
