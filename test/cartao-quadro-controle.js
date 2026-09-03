// O CARTÃO DE LINK NÃO LEVA CONTROLE DENTRO (QA, 23/08)
//
// POR QUE ESTE ARQUIVO EXISTE, e o número que o pediu: auditando a subida do interruptor de
// privacidade do rodapé para a barra, o `territorio/compartilhar.jpg` COMMITADO saiu com a
// tábua "MEDIÇÃO / ligada" dentro do quadro — e, junto com o vão de 78 px que ela trouxe, a
// barra rolou mais e o cartão perdeu "A História" inteira e cortou "Glossário" em "lossário".
//
// A causa é de uma linha e é do tipo que ninguém vê: cada gerador de cartão tem a SUA maneira
// de tirar controles do quadro, e as duas maneiras não são equivalentes.
//   · `ferramentas/cartao-secao.js` (A HISTÓRIA · glossário · DE ONDE VEM) esconde todo elemento
//     com `position:fixed|sticky` — genérico, então continuou funcionando quando o botão mudou
//     de lugar. Os três cartões saíram byte a byte iguais.
//   · `ferramentas/gerar-territorio.js` esconde `#censo .med` — o PARÁGRAFO. Enquanto o botão
//     morava dentro dele, isso bastava; no dia em que o botão virou tábua da barra, a exclusão
//     parou de excluir em silêncio, e o comentário três linhas acima do print continuou dizendo
//     "O INTERRUPTOR DA MEDIÇÃO SAI DO CARTÃO".
//
// Um cartão de link é a única coisa deste repositório que ninguém revê depois de publicada: o
// robô da rede social busca uma vez e guarda por semanas. Por isso a régua é de artefato, não
// de intenção — ela abre a página no MESMO enquadramento do print, aplica a MESMA exclusão que
// aquele gerador aplica, e cobra que nenhum controle sobrou no quadro.
//
// A TABELA ABAIXO É CÓPIA DE COMPORTAMENTO, e cópia apodrece. Contra isso, cada linha traz uma
// ASSINATURA: um trecho que tem de continuar existindo no gerador. Se alguém mudar a exclusão
// lá e não aqui, este arquivo reprova dizendo que a tabela envelheceu, em vez de aprovar um
// cartão que ele já não sabe medir.
//
// Uso: node test/cartao-quadro-controle.js   (sai 1 se algum controle couber no cartão)
//
// RENOMEADO em 02/09 (plantao nuvem-20260902T1234, item controle-cartao-sem-dono): chamava-se
// `medir-cartao-controle.js`, e o nome ficava a uma palavra de `test/cartao-controle.js` — o
// OUTRO portão de cartão, que mede peso/forma do JPEG (og:image), não o que sobra dentro do
// recorte. O nome novo é o que o primeiro `console.log` deste arquivo já dizia: "O CARTÃO DE
// LINK NÃO LEVA CONTROLE DENTRO [DO QUADRO]".
// A COBRANÇA DO ALVO NOMEADO CAIU EM 02/09 E FOI SUBSTITUÍDA POR CENSO (PENDENTES 100).
// As duas pós-condições de 02/09 reconheciam o interruptor por COMO ELE SE CHAMA — id, aria-label,
// `position` — e uma variante de UMA LINHA (trocar o id E o aria-label juntos) devolvia a tábua
// MEDIÇÃO ao recorte com os dois portões verdes. O `ferramentas/cartao-censo.js` explica a virada
// inteira: a lista mudou de lado, de "o que é proibido" para "o que este cartão pode conter".
// É de lá que sai a leitura E os mutantes — uma fonte só, em vez das duas cópias que juravam ser
// idênticas e não eram (a do gerador não tinha o `|| e.id === 'medirBt'` que esta tinha).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ABRIR = require('./abrir.js');
const CENSO = require('../ferramentas/cartao-censo.js');
const CHROME = require('../ferramentas/chrome-plataforma.js');

const RAIZ = path.resolve(__dirname, '..');
const L = 1200, A = 630;   // o enquadramento que as redes pedem, e o que os geradores usam

// O CENSO VALE PARA AS CINCO SUPERFÍCIES DESDE 03/09 (item `censo-so-e-cobrado-no-territorio`).
//
// ANTES, `censo: true` estava numa linha só — a do TERRITÓRIO. Para A HISTÓRIA, o glossário e o
// DE ONDE VEM este portão rodava só `controlesNoQuadro`, a régua antiga por NOME e POSIÇÃO
// (`fixed|sticky` + seletor de controle, ou `id === 'medirBt'`), e a PORTA nem estava na tabela.
// Medido antes de consertar, com o defeito na mão: uma `<div>` inerte lendo "MEDICAO ligada",
// colada na `.barra` de `historia/index.html`, saiu deste arquivo com **exit 0** — e o mesmo
// defeito dava **exit 1** em `test/qa-censo-passo2.js`, que não estava em `npm test`, nem no
// `encaixe.js`, nem no `integrar.js`, nem no CI. A proteção existia e não era cobrada em lugar
// nenhum: instrumento de QA não é portão.
//
// A LISTA DE PERMITIDOS DAS OUTRAS QUATRO já era derivável — é a barra que o `chrome-plataforma.js`
// escreve para aquela seção, o mesmo dado que gerou a página. É `CENSO.permitidosDaPagina`, uma
// função só para as cinco (antes eram duas cópias, e a que rodava era a mais estreita).
const CARTOES = [
  // A PORTA não tem cartão PRÓPRIO hoje: o `og:image` dela aponta para o `compartilhar.jpg` da
  // RAIZ, que é HUD de partida do jogo — não há gerador de cartão para ela, e por isso não há
  // exclusão para assinar. Ela entra assim mesmo, e por dois motivos concretos: (a) ela carrega
  // a MESMA `.barra` das outras quatro, então uma regressão no chrome comum aparece aqui antes de
  // aparecer num cartão publicado; (b) o dia em que ela ganhar cartão próprio, a régua já está de
  // pé. A linha `semCartaoProprio` abaixo cobra que essa premissa continue verdadeira — se
  // alguém der um cartão à porta, este arquivo reprova pedindo a assinatura, em vez de aprovar
  // um cartão que ele já não sabe medir.
  { secao: 'porta', pag: 'plataforma/index.html', gerador: null, assinatura: null,
    semCartaoProprio: 'plataforma/compartilhar.jpg', modo: 'generico', censo: true },
  { secao: 'historia', pag: 'historia/index.html', gerador: 'ferramentas/cartao-secao.js',
    assinatura: "p === 'fixed' || p === 'sticky'", modo: 'generico', censo: true },
  { secao: 'glossario', pag: 'glossario/index.html', gerador: 'ferramentas/cartao-secao.js',
    assinatura: "p === 'fixed' || p === 'sticky'", modo: 'generico', censo: true },
  { secao: 'de-onde-vem', pag: 'de-onde-vem/index.html', gerador: 'ferramentas/cartao-secao.js',
    assinatura: "p === 'fixed' || p === 'sticky'", modo: 'generico', censo: true },
  // A ASSINATURA DO TERRITÓRIO DEIXOU DE SER UM TRECHO COPIADO e passou a ser o `require` do
  // módulo comum. É estritamente melhor: casar uma string prova que alguém escreveu as mesmas
  // letras nos dois lugares; casar o `require` prova que os dois RODAM o mesmo código.
  { secao: 'territorio', pag: 'territorio/index.html', gerador: 'ferramentas/gerar-territorio.js',
    assinatura: "require('./cartao-censo.js')", modo: 'controles', censo: true },
];

let falhas = 0;
function ok(cond, msg) {
  console.log((cond ? '  ok  ' : '  X   ') + msg);
  if (!cond) falhas++;
  return !!cond;
}

// A exclusão, na página, do jeito que cada gerador a faz. Devolve quantos nós escondeu — o
// número entra no relatório porque uma exclusão que esconde ZERO é a que estava quebrada.
async function excluir(pg, modo) {
  return pg.evaluate((m) => {
    const ALVOS_CONTROLE = 'button, [role="button"], input, select, summary';
    let n = 0;
    const esconder = (e) => { if (e && e.style.display !== 'none') { e.style.display = 'none'; n++; } };
    if (m === 'generico') {
      document.querySelectorAll('.med').forEach(esconder);
      document.querySelectorAll('body *').forEach((e) => {
        const p = getComputedStyle(e).position;
        if (p === 'fixed' || p === 'sticky') esconder(e);
      });
    } else if (m === 'controles') {
      // O JEITO DO gerar-territorio.js DESDE 23/08, e ele nasceu deste arquivo: a varredura
      // genérica não serve nesta seção porque "#palco" e ".env" são fixed e são a página
      // inteira. A regra que sobrou é a mesma que `controlesNoQuadro()` cobra — flutua E
      // convida o dedo —, mais os três alvos nomeados que o gerador conhece pelo nome.
      document.querySelectorAll('.med').forEach(esconder);
      esconder(document.getElementById('medirBt'));
      document.querySelectorAll('.vaoMedida').forEach(esconder);
      document.querySelectorAll('body *').forEach((e) => {
        const s = getComputedStyle(e);
        const flutua = s.position === 'fixed' || s.position === 'sticky';
        if (flutua && e.matches(ALVOS_CONTROLE)) esconder(e);
      });
      document.querySelectorAll('.barra').forEach((b) => {
        b.style.scrollPaddingRight = '0px';
        b.scrollLeft = 0;
      });
      const a = document.querySelector('.barra a.aqui');
      if (a && a.scrollIntoView) a.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    } else {
      // 'so-a-frase' — a exclusão VELHA do TERRITÓRIO. Não descreve mais gerador nenhum; fica
      // viva só como CONTROLE, porque é ela que deixa o intruso passar, e é esse contraste que
      // prova que a régua enxerga a diferença entre as duas.
      esconder(document.querySelector('#censo .med'));
    }
    window.scrollTo(0, 0);
    return n;
  }, modo);
}

// O QUE SOBROU DE CROMO FLUTUANTE DENTRO DO QUADRO.
//
// A REGRA NÃO É "zero botão", E ISSO FOI MEDIDO ANTES DE ESCREVER: a primeira versão desta
// função contava todo `button`, e o cartão do TERRITÓRIO reprovou por causa das CINCO tábuas de
// lugar ("União dos Palmares AL", "Rio de Janeiro RJ"…). Elas são o cartão — estão nele desde
// 21/08, no fluxo da página, e ninguém as considera erro. Uma régua que reprova o desenho certo
// é pior que régua nenhuma, porque na primeira vez que reprova alguém a afrouxa inteira.
//
// A regra é: **controle que FLUTUA**, e as duas metades foram necessárias.
//   · "flutua" (`position:fixed|sticky`) é a marca do que existe para acompanhar a rolagem — e
//     rolagem é a única coisa que um JPEG não tem. É por isso que a exclusão do `cartao-secao.js`
//     é genérica e continuou certa quando o botão mudou de casa.
//   · "controle" é a outra metade, e SEM ela a régua também reprovava o desenho certo: a página
//     do TERRITÓRIO inteira mora em dois contêineres `position:fixed` (`#palco`, o canvas do
//     mapa, e `div.env`, o envelope). Flutuar não é o defeito; flutuar E convidar o dedo é.
// O `#medirBt` é nomeado à parte porque é o caso que já quebrou uma vez: se algum dia ele
// deixar de flutuar e continuar no quadro, a promessa segue quebrada do mesmo jeito.
//
// A LISTA É PARANOICA DESDE 02/09 (achado do QA na re-auditoria, PENDENTES 68): a antiga
// (`button, [role="button"], input, select, summary`) é A MESMA do `ferramentas/gerar-territorio.js`
// — um lugar para consertar e o MESMO buraco para os dois. Uma `<div onclick tabindex="0">`
// colada na barra escapava dos dois. A função de baixo é ESTRITAMENTE MAIS LARGA que a do
// gerador — a regra da casa é essa (instrumento mais largo que o gerador, nunca igual): se ela
// achar algo que a exclusão do gerador não pega, é a exclusão que se alarga, não esta função que
// se estreita. `a[href]` exclui a `.barra` de propósito — as tábuas de navegação são links de
// verdade e ficam no cartão em toda página; um link fora dela (nota de rodapé, "abrir no jogo")
// é o que a régua não pode deixar passar.
//
// ESTA FUNÇÃO CONTINUA VALENDO PARA AS TRÊS SEÇÕES DE TEXTO (A HISTÓRIA, glossário, DE ONDE VEM),
// que são geradas pelo `cartao-secao.js` com a varredura genérica de fixed/sticky e cujo conteúdo
// é texto corrido com links — um censo lá precisa de lista própria e é outro território.
// PARA O TERRITÓRIO ela deixou de ser a régua principal: quem cobra é o CENSO
// (`ferramentas/cartao-censo.js`), que não pergunta se o alvo flutua nem como ele se chama. Ela
// fica como segunda leitura, porque duas leituras discordando é informação e uma só não é.
async function controlesNoQuadro(pg) {
  return pg.evaluate(([L, A]) => {
    function ehControleParanoico(e) {
      if (e.matches('button, [role="button"], input, select, summary, [onclick], label, [contenteditable]')) return true;
      const tab = e.getAttribute('tabindex');
      if (tab !== null && tab !== '-1') return true;
      if (e.matches('a[href]') && !e.closest('.barra')) return true;
      return false;
    }
    const achados = [];
    document.querySelectorAll('body *').forEach((e) => {
      const s = getComputedStyle(e);
      const flutua = s.position === 'fixed' || s.position === 'sticky';
      if (!((flutua && ehControleParanoico(e)) || e.id === 'medirBt')) return;
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return;
      const r = e.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      if (r.right <= 0 || r.bottom <= 0 || r.left >= L || r.top >= A) return;   // fora do quadro
      achados.push({
        alvo: (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + (e.className || '')),
        posicao: s.position,
        texto: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      });
    });
    return achados;
  }, [L, A]);
}

// O CENSO, do lado de quem só tem o artefato. A lista de permitidos sai do MESMO dado que gerou a
// página: os links da barra do `chrome-plataforma.js`, e as tábuas de lugar lidas da FORMA que o
// gerador escreveu no HTML em disco — `window.D` não é global (medido: `undefined`), e usar a
// página viva como fonte da própria lista seria circular para o mutante injetado.
// GENÉRICO DESDE 03/09: recebe a seção, e a lista sai de `CENSO.permitidosDaPagina` — a mesma
// função que `test/qa-censo-passo2.js` usa. Duas cópias dessa regra é como a página CERTA passou
// a ser medida por uma régua e as outras quatro por nenhuma.
async function censoDaPagina(pg, secao, arqHtml) {
  const permitidos = CENSO.permitidosDaPagina(secao, fs.readFileSync(arqHtml, 'utf8'));
  if (permitidos.length < 2) throw new Error('lista de permitidos degenerada (' + permitidos.length + ') — o censo reprovaria a página certa');
  return pg.evaluate(CENSO.censoDoQuadro, [L, A, permitidos, CENSO.SELETOR_INTERATIVO]);
}

(async () => {
  console.log('O CARTÃO DE LINK NÃO LEVA CONTROLE DENTRO — ' + L + 'x' + A);
  // PENDENTES 91/98 num terceiro lugar: sem `executablePath` o lancamento nu falha nesta
  // maquina, e `chromiumPath()` devolve undefined onde ja funcionava.
  const nav = await chromium.launch({ args: ['--enable-unsafe-swiftshader'], executablePath: ABRIR.chromiumPath() });

  for (const c of CARTOES) {
    const arq = path.join(RAIZ, c.pag);
    if (!fs.existsSync(arq)) { ok(false, c.secao + ': a página não existe (' + c.pag + ')'); continue; }
    // a assinatura primeiro: sem ela a tabela acima já não descreve o gerador
    if (c.assinatura) {
      const fonte = fs.readFileSync(path.join(RAIZ, c.gerador), 'utf8');
      ok(fonte.indexOf(c.assinatura) >= 0, c.secao + ': a exclusão do ' + c.gerador
        + ' ainda é a que esta tabela descreve');
    } else {
      // sem gerador de cartão não há exclusão para assinar — o que se cobra é que ela CONTINUE
      // não existindo. Ganhar um cartão é mudança boa; entrar sem assinatura é a tabela envelhecendo.
      ok(!fs.existsSync(path.join(RAIZ, c.semCartaoProprio)), c.secao + ': continua sem cartão próprio ('
        + c.semCartaoProprio + ' não existe) — se ganhou um, acrescente gerador e assinatura nesta tabela');
    }

    const pg = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
    await pg.goto(ABRIR('file:///' + arq.split(path.sep).join('/')));
    await pg.evaluate(() => document.fonts.ready).catch(() => {});
    if (c.modo !== 'generico') {   // a seção 3D precisa do WebGL pronto antes de medir
      await pg.waitForFunction('window.__pronto === true', null, { timeout: 30000 }).catch(() => {});
      await pg.waitForTimeout(900);
    } else {
      await pg.waitForTimeout(300);
    }
    const escondidos = await excluir(pg, c.modo);
    const sobrou = await controlesNoQuadro(pg);
    // A SEGUNDA LEITURA, e é a que não depende de nome nenhum: o CENSO. Nas CINCO superfícies
    // desde 03/09 — a lista de permitidos das quatro páginas de texto é a barra que o
    // `chrome-plataforma.js` escreveu para aquela seção, o mesmo dado que gerou a página.
    let estranhos = [];
    if (c.censo) estranhos = await censoDaPagina(pg, c.secao, arq);
    await pg.close();

    ok(sobrou.length === 0, c.secao + ': zero cromo flutuante no quadro depois da exclusão ('
      + escondidos + ' nó(s) escondido(s))'
      + (sobrou.length ? ' — sobrou ' + JSON.stringify(sobrou) : ''));
    if (c.censo) {
      ok(estranhos.length === 0, c.secao + ': o censo do quadro só achou o que a lista de '
        + 'permitidos autoriza' + (estranhos.length ? ' — ESTRANHOS ' + JSON.stringify(estranhos) : ''));
    }
  }

  // ------------------------------------------------------- O CONTROLE (EQUIPE.md 2.8)
  // Régua que ninguém viu reprovando é decoração — e esta aprovou três cartões de primeira, que
  // é exatamente quando não dá para confiar nela. Então um controle é ENFIADO na página, com a
  // mesma forma do defeito real (um botão grudado no alto da barra, que a exclusão genérica
  // pegaria e a do TERRITÓRIO não pega): a leitura TEM de achá-lo, e a exclusão só-a-frase TEM
  // de deixá-lo passar. Se qualquer das duas falhar, as linhas verdes acima não valem nada.
  console.log('\n=== CONTROLE — um botão enfiado no quadro (EQUIPE.md 2.8)');
  for (const [nome, modo, deveAchar] of [
    ['a leitura enxerga o intruso', null, true],
    ['a exclusão genérica o retira', 'generico', false],
    ['a exclusão só-a-frase o DEIXA passar (é o defeito de 23/08)', 'so-a-frase', true],
    // e a exclusão NOVA do TERRITÓRIO, que nasceu deste arquivo, tem de retirá-lo — senão o
    // conserto de 23/08 trocou um buraco por outro do mesmo tamanho.
    ['a exclusão de controles (a nova do TERRITÓRIO) o retira', 'controles', false],
  ]) {
    const pg = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
    await pg.goto(ABRIR('file:///' + path.join(RAIZ, 'glossario', 'index.html').split(path.sep).join('/')));
    await pg.evaluate(() => document.fonts.ready).catch(() => {});
    await pg.waitForTimeout(300);
    await pg.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'qaIntruso'; b.textContent = 'intruso';
      b.style.cssText = 'position:sticky;top:8px;left:8px;width:60px;height:44px;z-index:9';
      document.body.insertBefore(b, document.body.firstChild);
    });
    if (modo) await excluir(pg, modo);
    const achados = await controlesNoQuadro(pg);
    await pg.close();
    const achou = achados.some((a) => a.alvo === '#qaIntruso');
    ok(achou === deveAchar, 'CONTROLE ' + nome + ' — achou=' + achou);
  }

  // ------------------------------- O CONTROLE DO CENSO — os mutantes REAIS, na página REAL
  //
  // POR QUE ESTE BLOCO EXISTE, e é achado de auditoria, não capricho (PENDENTES 100, 02/09): o
  // controle de cima injeta um `<button>` genérico STICKY — a forma que a lista ANTIGA já pegava.
  // Ele nunca exercitou nenhum dos mutantes que de fato quebraram o portão, e a mensagem do commit
  // descrevia um wrapper de teste que não estava commitado. Isso é decoração parcial (EQUIPE.md
  // 2.8): as linhas verdes acima não provavam o que diziam provar.
  //
  // Agora os SETE mutantes de `ferramentas/cartao-censo.js` rodam contra `territorio/index.html`,
  // o artefato commitado, com a exclusão do gerador aplicada por cima — que é exatamente a
  // condição em que o cartão é fotografado. Cada um TEM de aparecer no censo.
  //
  // O `m103` é o que vale mais: ele PASSOU na primeira versão da régua nova (que casava só o
  // `href`) e é a razão de o rótulo da tábua entrar na lista de permitidos. Mutante que já passou
  // uma vez é a única prova de que a régua mudou por medição.
  console.log('\n=== CONTROLE DO CENSO — os mutantes do PENDENTES 67/68/100 na página real');
  const arqTerr = path.join(RAIZ, 'territorio', 'index.html');
  if (!fs.existsSync(arqTerr)) {
    ok(false, 'CONTROLE DO CENSO: territorio/index.html não existe');
  } else {
    for (const nome of Object.keys(CENSO.MUTANTES)) {
      const pg = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
      await pg.goto(ABRIR('file:///' + arqTerr.split(path.sep).join('/')));
      await pg.evaluate(() => document.fonts.ready).catch(() => {});
      await pg.waitForFunction('window.__pronto === true', null, { timeout: 30000 }).catch(() => {});
      await pg.waitForTimeout(600);
      let erroMutante = '';
      await pg.evaluate(CENSO.MUTANTES[nome]).catch((e) => { erroMutante = String(e.message || e); });
      await excluir(pg, 'controles');           // a mesma exclusão que o gerador aplica
      const estranhos = erroMutante ? [] : await censoDaPagina(pg, 'territorio', arqTerr);
      await pg.close();
      if (erroMutante) {
        // mutante que não consegue nem se instalar é régua cega, não régua verde
        ok(false, 'CONTROLE DO CENSO ' + nome + ': o mutante não pôde ser injetado — ' + erroMutante);
      } else {
        ok(estranhos.length > 0, 'CONTROLE DO CENSO ' + nome + ': o censo RECUSA o mutante'
          + (estranhos.length ? ' (' + estranhos[0].motivo + ' — ' + estranhos[0].alvo + ' @ '
            + estranhos[0].x + ',' + estranhos[0].y + ' ' + estranhos[0].w + 'x' + estranhos[0].h + ')'
            : ' — PASSOU LIMPO, o buraco do PENDENTES 100 está aberto de novo'));
      }
    }
    // e o contraponto, sem o qual as linhas de cima não dizem nada: SEM mutante o censo tem de
    // ficar vazio. Uma régua que grita sempre é tão inútil quanto uma que nunca grita.
    const pg = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
    await pg.goto(ABRIR('file:///' + arqTerr.split(path.sep).join('/')));
    await pg.evaluate(() => document.fonts.ready).catch(() => {});
    await pg.waitForFunction('window.__pronto === true', null, { timeout: 30000 }).catch(() => {});
    await pg.waitForTimeout(600);
    await excluir(pg, 'controles');
    const limpo = await censoDaPagina(pg, 'territorio', arqTerr);
    await pg.close();
    ok(limpo.length === 0, 'CONTROLE DO CENSO sem mutante: o censo APROVA a página como está'
      + (limpo.length ? ' — ESTRANHOS ' + JSON.stringify(limpo) : ''));
  }

  // ------------------------------------ O CENSO MORDE EM CADA UMA DAS CINCO (03/09, EQUIPE.md 2.8)
  //
  // As quinze linhas verdes lá de cima não provam nada sozinhas: `censo: true` numa linha da tabela
  // pode estar ligado a uma lista de permitidos tão larga que aprova qualquer coisa. E ligar o
  // censo para quatro páginas novas é exatamente o momento em que ninguém viu a régua reprovando
  // NELAS — foi assim que o `medir-telas-altura.js` passou em 8 de 8 com três telas que não podiam
  // reprovar.
  //
  // Então o mutante do item 1 (`m106`: uma `<div>` INERTE lendo "MEDIÇÃO ligada", sem `onclick`,
  // sem `tabindex` e sem `role`, colada na `.barra` de verdade) é injetado numa a uma, com a
  // exclusão daquela linha aplicada por cima, e o censo daquela seção TEM de recusá-lo. É o mesmo
  // defeito que, medido em 03/09 antes deste bloco existir, saía deste arquivo com exit 0 quando
  // plantado em `historia/index.html`.
  console.log('\n=== O CENSO MORDE EM CADA UMA DAS CINCO SUPERFÍCIES (m106 por página)');
  for (const c of CARTOES) {
    const arq = path.join(RAIZ, c.pag);
    if (!fs.existsSync(arq)) { ok(false, c.secao + ': a página não existe (' + c.pag + ')'); continue; }
    const pg = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
    await pg.goto(ABRIR('file:///' + arq.split(path.sep).join('/')));
    await pg.evaluate(() => document.fonts.ready).catch(() => {});
    if (c.modo !== 'generico') {
      await pg.waitForFunction('window.__pronto === true', null, { timeout: 30000 }).catch(() => {});
      await pg.waitForTimeout(900);
    } else {
      await pg.waitForTimeout(300);
    }
    let erroMutante = '';
    await pg.evaluate(CENSO.MUTANTES.m106).catch((e) => { erroMutante = String(e.message || e); });
    await excluir(pg, c.modo);
    const estranhos = erroMutante ? [] : await censoDaPagina(pg, c.secao, arq);
    await pg.close();
    if (erroMutante) {
      ok(false, 'MORDIDA ' + c.secao + ': o mutante não pôde ser injetado — ' + erroMutante);
    } else {
      ok(estranhos.length > 0, 'MORDIDA ' + c.secao + ': o censo RECUSA a tábua inerte plantada na barra'
        + (estranhos.length ? ' (' + estranhos[0].alvo + ' @' + estranhos[0].x + ',' + estranhos[0].y + ')'
          : ' — PASSOU LIMPO, o censo desta página não protege nada'));
    }
  }

  await nav.close();
  if (falhas) { console.log('\nREPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('\nok');
})();
