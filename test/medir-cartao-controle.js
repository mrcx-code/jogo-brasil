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
// Uso: node test/medir-cartao-controle.js   (sai 1 se algum controle couber no cartão)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const L = 1200, A = 630;   // o enquadramento que as redes pedem, e o que os geradores usam

const CARTOES = [
  { secao: 'historia', pag: 'historia/index.html', gerador: 'ferramentas/cartao-secao.js',
    assinatura: "p === 'fixed' || p === 'sticky'", modo: 'generico' },
  { secao: 'glossario', pag: 'glossario/index.html', gerador: 'ferramentas/cartao-secao.js',
    assinatura: "p === 'fixed' || p === 'sticky'", modo: 'generico' },
  { secao: 'de-onde-vem', pag: 'de-onde-vem/index.html', gerador: 'ferramentas/cartao-secao.js',
    assinatura: "p === 'fixed' || p === 'sticky'", modo: 'generico' },
  { secao: 'territorio', pag: 'territorio/index.html', gerador: 'ferramentas/gerar-territorio.js',
    assinatura: 'flutua && e.matches(ALVOS_CONTROLE)', modo: 'controles' },
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
// ESTE CORPO TEM DE FICAR IDÊNTICO ao da pós-condição de `ferramentas/gerar-territorio.js`
// (procure `ehControleParanoico` lá) — cópia de propósito, pela mesma razão do `ALVOS_CONTROLE`:
// mudou lá, mude aqui.
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

(async () => {
  console.log('O CARTÃO DE LINK NÃO LEVA CONTROLE DENTRO — ' + L + 'x' + A);
  const nav = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

  for (const c of CARTOES) {
    const arq = path.join(RAIZ, c.pag);
    if (!fs.existsSync(arq)) { ok(false, c.secao + ': a página não existe (' + c.pag + ')'); continue; }
    // a assinatura primeiro: sem ela a tabela acima já não descreve o gerador
    const fonte = fs.readFileSync(path.join(RAIZ, c.gerador), 'utf8');
    ok(fonte.indexOf(c.assinatura) >= 0, c.secao + ': a exclusão do ' + c.gerador
      + ' ainda é a que esta tabela descreve');

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
    await pg.close();

    ok(sobrou.length === 0, c.secao + ': zero cromo flutuante no quadro depois da exclusão ('
      + escondidos + ' nó(s) escondido(s))'
      + (sobrou.length ? ' — sobrou ' + JSON.stringify(sobrou) : ''));
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

  await nav.close();
  if (falhas) { console.log('\nREPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('\nok');
})();
