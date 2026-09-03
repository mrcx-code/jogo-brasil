// QA — O ALCANCE DA SEGUNDA PASSADA DO CENSO DO CARTÃO (02/09, auditoria da entrega `censo-foto`)
//
//   node test/qa-censo-passo2.js
//
// POR QUE ESTE ARQUIVO EXISTE. A entrega `censo-foto` acrescentou uma SEGUNDA PASSADA ao
// `ferramentas/cartao-censo.js`: além dos elementos INTERATIVOS (passo 1), ela varre todos os
// descendentes dos contêineres que o passo 1 já provou reais (os `donos`) e reprova quem não é
// aceito nem parte interna de um aceito. O mutante que a justifica (`m106`) foi escrito pela MESMA
// pessoa que escreveu a correção — e mutante feito sob medida para a correção passa sempre
// (EQUIPE.md 2.8). Este arquivo faz as três coisas que faltavam:
//
//   1. MUTANTES DE OUTRO AUTOR (`q107a..e`), com outra forma de pôr texto inerte na foto.
//   2. A COBERTURA da segunda passada, em número: quantos elementos ela JULGA e quantos ela
//      ABSOLVE por ancestralidade. Se ela absolvesse quase tudo, seria um no-op de aparência boa.
//   3. O VARRIMENTO DE FALSO-POSITIVO nas páginas públicas geradas, e não só no
//      `territorio/index.html` — é o único teste que decide se a entrega derruba a `main`.
//
// ATUALIZADO em 03/09 (item `censo-vaomedida-falso-positivo`): a primeira versão deste arquivo
// SÓ cobrava por exit code o falso-positivo do território (linha `if (p.secao === 'territorio')`
// mais abaixo) — media as outras quatro páginas e só IMPRIMIA. Foi assim que o falso-positivo do
// `span.vaoMedida` (porta 1, historia 1, glossario 1, de-onde-vem 1 — sempre o mesmo elemento)
// ficou visível no número sem nunca derrubar o portão: o comentário deste cabeçalho já dizia "não
// só no territorio/index.html", mas o código não cumpria. Agora cumpre: a asserção de ZERO
// estranhos corre nas CINCO páginas, não numa.
//
// O QUE ESTE ARQUIVO COBRA POR EXIT CODE, e por que só isto:
//   · as CINCO páginas públicas, cada uma com a exclusão que o gerador dela aplicaria, têm de sair
//     com ZERO estranhos — nenhum falso-positivo em nenhuma das cinco, não só na que tem gerador
//     hoje.
//   · `m106` (do autor), `q107d` (meu, em OUTRO contêiner provado — a `.lista`, não a `.barra`) e
//     `q107e` (meu, o MESMO nome e o MESMO `aria-hidden` do vão real, mas COM texto) têm de ser
//     recusados. Se a segunda passada virar no-op num refactor, ou se o conserto do
//     falso-positivo virar "ignora `aria-hidden`" em vez de "ignora `aria-hidden` SEM CONTEÚDO",
//     isto fica vermelho.
//   · OS TREZE MECANISMOS DE PINTURA (bloco 3, acrescentado em 03/09 pelo item
//     `censo-decorativo-so-tres-propriedades` com SEIS, e levado a treze no mesmo dia pelo item
//     `censo-cinco-fugas-medidas`): `border`, `background-color`, o atalho `background`,
//     `outline`, `box-shadow`, `::after` com `background`, `backdrop-filter`, `border-image`,
//     `::marker`, `list-style-image`, `content` no próprio elemento, a alça de `resize` e o
//     `::before` virando item de lista. Um `aria-hidden` SEM TEXTO que pinta por qualquer um
//     deles tem de ser recusado — os treze escapavam limpos, cada um com o seu dia e o seu
//     número de pixels. E o CONTRAPONTO junto: o mesmo vão sem pintar nada continua absolvido,
//     senão o conserto teria trocado o falso-negativo por um falso-positivo do mesmo tamanho.
//
// ESTE ARQUIVO DEIXOU DE SER SÓ INSTRUMENTO DE MÃO EM 03/09 (item `censo-so-e-cobrado-no-
// territorio`). Ele é disparado pelo funil (`ferramentas/integrar.js`, gatilho `CARTAO_CENSO`)
// junto com `test/cartao-quadro-controle.js` sempre que o diff toca o censo, o chrome da barra,
// os geradores de cartão ou qualquer uma das cinco páginas publicadas. Portão que morde e ninguém
// roda é a doença que esta casa já curou três vezes.
// Os mutantes que ESCAPAM (`q107a`, `q107b`, `q107c`) são impressos como ALCANCE, não como falha:
// a entrega nunca prometeu alcançá-los, e portão que cobra promessa que ninguém fez fica vermelho
// na `main` limpa — vermelho de instrumento com cara de vermelho de produto (EQUIPE.md).
// Eles estão aqui para a próxima rodada saber ONDE o buraco continua, com o número do dia.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');
const CENSO = require('../ferramentas/cartao-censo.js');
const CHROME = require('../ferramentas/chrome-plataforma.js');

const RAIZ = path.resolve(__dirname, '..');
const L = CENSO.L, A = CENSO.A;
let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok  ' : '  X   ') + msg); if (!cond) falhas++; return !!cond; }

// AS PÁGINAS PÚBLICAS GERADAS, e a seção que cada uma passa ao `chrome-plataforma.js` — é dela
// que sai a lista de permitidos da barra. `fontes` não é página: `gerar-fontes.js` escreve
// `de-onde-vem/index.html` (conferido no próprio gerador, linha do `barraHtml('de-onde-vem')`).
const PAGINAS = [
  // A PORTA mora em `plataforma/index.html` e o build a copia para `dist/index.html`
  // (ferramentas/construir.js:532). Apontar para o `index.html` da raiz mede o JOGO — foi o
  // que este arquivo fez na primeira volta e deu 0 elemento visivel na foto (EQUIPE.md 2.1).
  { secao: 'porta', arq: 'plataforma/index.html' },
  { secao: 'historia', arq: 'historia/index.html' },
  { secao: 'glossario', arq: 'glossario/index.html' },
  { secao: 'de-onde-vem', arq: 'de-onde-vem/index.html' },
  { secao: 'territorio', arq: 'territorio/index.html' },
];

// A EXCLUSÃO, COPIADA DO `test/cartao-quadro-controle.js` DE 02/09 — e a cópia é declarada, não
// escondida: sem ela eu mediria a página em estado que o cartão nunca fotografa (com o
// interruptor da medição e o vão dele à vista), e todo estranho seria meu, não da régua.
async function excluir(pg, modo) {
  return pg.evaluate((m) => {
    const ALVOS_CONTROLE = 'button, [role="button"], input, select, summary';
    let n = 0;
    const esconder = (e) => { if (e && e.style.display !== 'none') { e.style.display = 'none'; n++; } };
    document.querySelectorAll('.med').forEach(esconder);
    if (m === 'controles') {
      const b = document.getElementById('medirBt'); if (b) esconder(b);
      document.querySelectorAll('.vaoMedida').forEach(esconder);
      document.querySelectorAll('body *').forEach((e) => {
        const s = getComputedStyle(e);
        if ((s.position === 'fixed' || s.position === 'sticky') && e.matches(ALVOS_CONTROLE)) esconder(e);
      });
      document.querySelectorAll('.barra').forEach((x) => { x.style.scrollPaddingRight = '0px'; x.scrollLeft = 0; });
      const a = document.querySelector('.barra a.aqui');
      if (a && a.scrollIntoView) a.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    } else {
      document.querySelectorAll('body *').forEach((e) => {
        const s = getComputedStyle(e);
        if (s.position === 'fixed' || s.position === 'sticky') esconder(e);
      });
    }
    window.scrollTo(0, 0);
    return n;
  }, modo);
}

async function abrirPagina(nav, arq) {
  const pg = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
  await pg.goto(ABRIR('file:///' + arq.split(path.sep).join('/')));
  await pg.evaluate(() => document.fonts.ready).catch(() => {});
  await pg.waitForFunction('window.__pronto === true', null, { timeout: 8000 }).catch(() => {});
  await pg.waitForTimeout(600);
  return pg;
}
// MIGRADO EM 03/09, e o motivo é que a frase estava errada antes de ser verdade: o commit da
// entrega afirmava "uma fonte para os dois chamadores", mas só o `cartao-quadro-controle.js`
// tinha migrado — este aqui mantinha a cópia local. Idênticas naquele dia, e é assim que a
// divergência começa. O QA independente pegou a afirmação, não o defeito (não havia defeito
// vivo); a correção é migrar, para que a afirmação passe a ser verdadeira.
function permitidosDe(secao, arq) {
  return CENSO.permitidosDaPagina(secao, fs.readFileSync(arq, 'utf8'));
}
const doPasso2 = (e) => /contêiner já provado/.test(e.motivo || '');

// ---------------------------------------------------------------------------------- OS MUTANTES
// Escritos por OUTRA pessoa que a da correção, e de propósito com a mesma FORMA do defeito de
// 23/08 (texto inerte que aparece na foto) em lugares DIFERENTES do que o `m106` usou.
const Q107 = {
  // (a) o m105 SEM o `role="switch"`: tábua inerte solta sobre o mapa, longe da barra. Mesma
  //     aparência na foto, zero interatividade — nada que o passo 1 alcance, e fora de todo `dono`.
  q107a: () => {
    const d = document.createElement('div');
    d.className = 'qa107a';
    d.style.cssText = 'position:absolute;left:640px;top:300px;width:150px;height:40px;background:#333;color:#fff;z-index:99';
    d.textContent = 'MEDIÇÃO ligada';
    document.body.appendChild(d);
  },
  // (b) o mesmo texto inerte, mas DENTRO do envelope da página (`.env`) — um contêiner real do
  //     cartão que simplesmente não tem filho aceito, então nunca vira `dono`.
  q107b: () => {
    const alvo = document.querySelector('.env') || document.body;
    const d = document.createElement('div');
    d.className = 'qa107b';
    d.style.cssText = 'position:absolute;left:80px;top:520px;width:170px;height:36px;background:#222;color:#fff;z-index:99';
    d.textContent = 'MEDIÇÃO ligada';
    alvo.appendChild(d);
  },
  // (c) SEM ELEMENTO NENHUM: o texto entra por `::after` de uma tábua ACEITA. `innerText` não vê
  //     pseudo-elemento (a própria entrega declarou este vão) e não há nó para o passo 2 varrer.
  q107c: () => {
    const a = document.querySelector('.barra a.tabua');
    if (!a) throw new Error('q107c: nao achei .barra a.tabua');
    const st = document.createElement('style');
    st.textContent = '.barra a.tabua:first-of-type::after{content:" MEDIÇÃO ligada";color:#fff;background:#333;padding:0 6px}';
    document.head.appendChild(st);
  },
  // (d) o `m106` mudado de contêiner: texto inerte dentro da `.lista` das tábuas de lugar, que é
  //     o OUTRO `dono` que o passo 1 prova. Se a segunda passada só valesse para a `.barra` que o
  //     autor testou, este passaria — e é por isso que ele é cobrado por exit code aqui.
  q107d: () => {
    const l = document.querySelector('.lista');
    if (!l) throw new Error('q107d: nao achei .lista');
    const d = document.createElement('div');
    d.className = 'qa107d';
    d.style.cssText = 'display:inline-flex;align-items:center;padding:0 8px;height:40px;color:#fff';
    d.textContent = 'MEDIÇÃO ligada';
    l.appendChild(d);
  },
  // (e) — AUDITORIA DO CONSERTO `censo-vaomedida-falso-positivo` (03/09): usa o MESMO atributo
  //     que o `span.vaoMedida` real usa (`aria-hidden="true"`, sem `role`, sem `onclick`) para
  //     provar que a nova exceção NÃO é "deixa passar quem tem aria-hidden" — é "deixa passar
  //     quem tem aria-hidden E NADA para ler". Este tem texto. Se a régua tivesse virado "ignora
  //     todo aria-hidden", este mutante passaria limpo. CLASSE PROPOSITALMENTE DIFERENTE de
  //     `vaoMedida`: a exclusão de `excluir(pg,'controles')` (linha 63 acima, cópia fiel da do
  //     gerador) apaga por NOME quem se chama `.vaoMedida` antes de fotografar — usar o mesmo
  //     nome testaria a EXCLUSÃO do gerador, não a REGRA do censo, e o mutante morreria por um
  //     motivo que não é o que se quer medir aqui. Cobrado por exit code.
  q107e: () => {
    const barra = document.querySelector('.barra');
    if (!barra) throw new Error('q107e: nao achei .barra');
    const s = document.createElement('span');
    s.className = 'qa107e';
    s.setAttribute('aria-hidden', 'true'); // o MESMO atributo do vão real
    s.style.cssText = 'display:inline-flex;align-items:center;height:40px;padding:0 8px;color:#fff';
    s.textContent = 'MEDIÇÃO ligada';     // a diferença que importa: tem texto
    barra.appendChild(s);
  },
};

// ------------------------------------ OS SEIS MECANISMOS DE PINTURA (item 03/09,
// `censo-decorativo-so-tres-propriedades`). O QA derrubou a FRASE do conserto anterior: o
// comentário prometia que a pergunta virara "isto pinta algo na foto?" e o código perguntava por
// TRÊS propriedades (`aria-hidden` E `innerText` vazio E sem `background-image`). Um `<span
// aria-hidden="true">` SEM TEXTO aparece no recorte por seis caminhos que aquelas três não
// cobriam, e o censo devolvia `estranhos=[]` nos seis — confirmado com print, não só com número.
//
// A ARMADILHA QUE O PRÓPRIO QA REGISTROU, e por isso todos estes injetam na `.lista`: a `.barra`
// tem `overflow-x:auto` e empurra o mutante para fora da janela do contêiner. Injetar lá fabrica
// um "escapou" que é do instrumento, não da régua — foi assim que o primeiro instrumento dele deu
// falso negativo. A `.lista` das tábuas de lugar não rola, e é `dono` provado do mesmo jeito.
//
// TODOS os seis são cobrados por exit code, um a um: se alguém estreitar `decorativoInerte` de
// volta, o mecanismo exato que voltou a escapar aparece pelo nome na linha vermelha.
//
// PASSOU DE SEIS A TREZE EM 03/09 (item `censo-cinco-fugas-medidas`). Os seis de cima fecharam o
// que o QA mediu naquela manhã; as sete de baixo são as fugas que sobraram DEPOIS — as cinco que
// o QA mediu por pixel à tarde (e que a régua absolvia com o portão verde), mais duas achadas
// pela catraca nova. Cada número aqui é o que a câmera contou numa caixa de 150x38 dentro da
// `.lista`, com o piso de ruído do recorte cobrado em zero; o instrumento que os mede um a um,
// com o oráculo de `visibility:hidden`, é `test/qa-censo-pintura-fora.js`.
const SVG_QA = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22'
  + ' height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%23ff0000%22/%3E%3C/svg%3E';
const PINTA = {
  border: 'border:4px solid red',
  backgroundColor: 'background-color:#ff00ff',
  backgroundAtalho: 'background:#00ff00',
  outline: 'outline:4px solid #00ffff',
  boxShadow: 'box-shadow:0 0 0 6px #ffcc00',
  pseudoAfter: '__AFTER__',   // ::after com content:"" e background — sem texto para o innerText ver
  // as CINCO fugas medidas pelo QA em 03/09 (5700 · 3000 · 25 · 1600 · 5700 px nesta caixa)
  backdropFilter: 'backdrop-filter:invert(1)',
  borderImage: 'border-image:linear-gradient(#f00,#00f) 30 / 10px',
  marcador: 'display:list-item;list-style-type:disc;color:#f00;margin-left:20px',
  listStyleImage: 'display:list-item;list-style-image:url("' + SVG_QA + '");margin-left:44px',
  contentNoElemento: 'content:url("' + SVG_QA + '")',
  // a SEXTA (18 px, a alça de redimensionar) e a SÉTIMA (25 px, o pseudo virando item de lista),
  // as duas fora de qualquer teto declarado até este dia
  agarraDeRedimensionar: 'resize:both;overflow:auto',
  pseudoItemDeLista: '__AFTER_LISTA__',
};
function injetarPintura(css) {
  const l = document.querySelector('.lista');
  if (!l) throw new Error('pintura: nao achei .lista (a .barra NAO serve — overflow-x:auto tira o mutante da janela)');
  const s = document.createElement('span');
  s.className = 'qaPinta';
  s.setAttribute('aria-hidden', 'true');   // o MESMO atributo do vão real
  // e NENHUM texto: é exatamente o par que a regra antiga absolvia
  let base = 'display:inline-block;width:150px;height:38px;vertical-align:middle;';
  const regra = { __AFTER__: '.qaPinta::after{content:"";display:block;width:150px;height:38px;background:#ff3300}',
    __AFTER_LISTA__: '.qaPinta::after{content:"";display:list-item;list-style-type:disc;color:#f00;margin-left:20px}' }[css];
  if (regra) {
    const st = document.createElement('style');
    st.textContent = regra;
    document.head.appendChild(st);
  } else { base += css; }
  s.style.cssText = base;
  l.appendChild(s);
}
// O CONTRAPONTO, sem o qual os seis acima não dizem nada: o MESMO span, no MESMO lugar, sem
// pintar nada — tem de continuar ABSOLVIDO. É o `span.vaoMedida` real reduzido à sua classe.
// Sem esta linha, "alargar a régua" poderia ter virado "reprova todo aria-hidden", que é o
// falso-positivo que o item `censo-vaomedida-falso-positivo` acabou de fechar.
function injetarVaoInerte() {
  const l = document.querySelector('.lista');
  if (!l) throw new Error('vao inerte: nao achei .lista');
  const s = document.createElement('span');
  s.className = 'qaVaoInerte';
  s.setAttribute('aria-hidden', 'true');
  s.style.cssText = 'display:inline-block;width:150px;height:38px;vertical-align:middle';
  l.appendChild(s);
}

// ------------------------------------------------------------------------------- A COBERTURA
// Quantos elementos a segunda passada JULGA e quantos ela ABSOLVE. Roda com a MESMA lista de
// permitidos, e reconstrói `donos`/`aceitos` do lado de fora pela definição escrita no módulo:
// dono = contêiner declarado por uma entrada que casou; aceito = elemento que casou.
async function cobertura(pg, permitidos) {
  return pg.evaluate(([L, A, permitidos, SEL]) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const vis = (e) => {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return null;
      const r = e.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return null;
      if (r.right <= 0 || r.bottom <= 0 || r.left >= L || r.top >= A) return null;
      return r;
    };
    const aceitos = [], donos = [];
    document.querySelectorAll('body *').forEach((e) => {
      let inter = e.matches(SEL);
      if (!inter) { const t = e.getAttribute('tabindex'); if (t !== null && t !== '-1') inter = true; }
      if (!inter || !vis(e)) return;
      for (const p of permitidos) {
        if (p.sel && !e.matches(p.sel)) continue;
        if (p.href && e.getAttribute('href') !== p.href) continue;
        if (p.texto && norm(e.innerText) !== p.texto) continue;
        const dono = p.dentro ? e.closest(p.dentro) : null;
        if (p.dentro && !dono) continue;
        aceitos.push(e);
        if (dono && donos.indexOf(dono) === -1) donos.push(dono);
        break;
      }
    });
    let julgados = 0, absolvidosPorPai = 0, absolvidosPorAceito = 0, invisiveis = 0, universo = 0;
    donos.forEach((d) => d.querySelectorAll('*').forEach((e) => {
      universo++;
      if (aceitos.indexOf(e) !== -1) { absolvidosPorAceito++; return; }
      if (aceitos.some((a) => a !== e && a.contains(e))) { absolvidosPorPai++; return; }
      if (!vis(e)) { invisiveis++; return; }
      julgados++;
    }));
    const visiveisNaFoto = Array.from(document.querySelectorAll('body *')).filter(vis).length;
    return { donos: donos.length, aceitos: aceitos.length, universo, julgados,
      absolvidosPorAceito, absolvidosPorPai, invisiveis, visiveisNaFoto };
  }, [L, A, permitidos, CENSO.SELETOR_INTERATIVO]);
}

(async () => {
  console.log('QA — ALCANCE DA SEGUNDA PASSADA DO CENSO (' + L + 'x' + A + ')');
  const nav = await chromium.launch({ args: ['--enable-unsafe-swiftshader'], executablePath: ABRIR.chromiumPath() });

  // ---------------------------------------------------- 1. FALSO-POSITIVO NAS PÁGINAS PÚBLICAS
  console.log('\n=== 1. AS PÁGINAS PÚBLICAS GERADAS, com a exclusão do gerador aplicada');
  for (const p of PAGINAS) {
    const arq = path.join(RAIZ, p.arq);
    if (!fs.existsSync(arq)) { ok(false, p.secao + ': página não existe (' + p.arq + ')'); continue; }
    const pg = await abrirPagina(nav, arq);
    await excluir(pg, p.secao === 'territorio' ? 'controles' : 'generico');
    const est = await pg.evaluate(CENSO.censoDoQuadro, [L, A, permitidosDe(p.secao, arq), CENSO.SELETOR_INTERATIVO]);
    const cob = await cobertura(pg, permitidosDe(p.secao, arq));
    await pg.close();
    const p2 = est.filter(doPasso2);
    console.log('  ' + p.secao.padEnd(12) + ' estranhos=' + est.length + ' (passo2=' + p2.length + ')'
      + '  donos=' + cob.donos + ' aceitos=' + cob.aceitos
      + '  universo=' + cob.universo + ' julgados=' + cob.julgados + ' absolvidos=' + (cob.absolvidosPorAceito + cob.absolvidosPorPai)
      + ' invisíveis=' + cob.invisiveis + '  visíveis na foto=' + cob.visiveisNaFoto);
    est.forEach((e) => console.log('       ESTRANHO ' + e.alvo + ' @' + e.x + ',' + e.y + ' — ' + e.motivo));
    // ANTES (03/09) só o território era cobrado por exit code aqui — é hoje a única página com
    // gerador que chama o censo. As outras quatro nunca reprovavam nada por conta disso, mesmo
    // achando o `span.vaoMedida` todo dia (achado do QA em 02/09, censo-vaomedida-falso-positivo).
    // AGORA o censo é medido como se as CINCO tivessem o mesmo portão: nenhuma pode carregar um
    // falso-positivo esperando o dia em que ganhar gerador próprio.
    ok(est.length === 0, p.secao + ': o censo aprova o cartão desta seção (zero falso-positivo)');
  }

  // ---------------------------------------------------------------- 2. OS MUTANTES DE OUTRO AUTOR
  console.log('\n=== 2. MUTANTES DE OUTRO AUTOR contra territorio/index.html');
  const arqT = path.join(RAIZ, 'territorio', 'index.html');
  const permT = permitidosDe('territorio', arqT);
  const PEGA_POR_EXIT = { q107d: true, q107e: true };
  for (const nome of Object.keys(Q107)) {
    const pg = await abrirPagina(nav, arqT);
    let erro = '';
    await pg.evaluate(Q107[nome]).catch((e) => { erro = String(e.message || e); });
    await excluir(pg, 'controles');
    const est = erro ? [] : await pg.evaluate(CENSO.censoDoQuadro, [L, A, permT, CENSO.SELETOR_INTERATIVO]);
    await pg.close();
    if (erro) { ok(false, nome + ': o mutante não pôde ser injetado — ' + erro); continue; }
    const pego = est.length > 0;
    const linha = nome + ': censo ' + (pego ? 'RECUSA' : 'DEIXA PASSAR')
      + (pego ? ' (' + est[0].alvo + ' — ' + est[0].motivo.slice(0, 60) + ')' : '');
    if (PEGA_POR_EXIT[nome]) ok(pego, linha + '  [cobrado por exit code]');
    else console.log('  --  ' + linha + '  [ALCANCE, não cobrado: a entrega não prometeu este]');
  }

  // o mutante do AUTOR, aqui também: se a segunda passada virar no-op, este arquivo vê junto
  const pgM = await abrirPagina(nav, arqT);
  await pgM.evaluate(CENSO.MUTANTES.m106);
  await excluir(pgM, 'controles');
  const estM = await pgM.evaluate(CENSO.censoDoQuadro, [L, A, permT, CENSO.SELETOR_INTERATIVO]);
  await pgM.close();
  ok(estM.length > 0 && estM.some(doPasso2), 'm106 (do autor): recusado PELA SEGUNDA PASSADA'
    + (estM.length ? ' (' + estM[0].alvo + ')' : ' — PASSOU LIMPO'));

  // ------------------------------------------------- 3. OS SEIS MECANISMOS DE PINTURA (03/09)
  // Um a um, com o exit code de cada um. Antes do conserto de `decorativoInerte`, os seis
  // devolviam `estranhos=[]` com a caixa visível no recorte (print no relatório da rodada).
  console.log('\n=== 3. PINTA NA FOTO SEM TEXTO — os ' + Object.keys(PINTA).length
    + ' mecanismos, na .lista do território');
  for (const nome of Object.keys(PINTA)) {
    const pg = await abrirPagina(nav, arqT);
    let erro = '';
    await pg.evaluate(injetarPintura, PINTA[nome]).catch((e) => { erro = String(e.message || e); });
    await excluir(pg, 'controles');
    const est = erro ? [] : await pg.evaluate(CENSO.censoDoQuadro, [L, A, permT, CENSO.SELETOR_INTERATIVO]);
    await pg.close();
    if (erro) { ok(false, 'pintura ' + nome + ': o mutante não pôde ser injetado — ' + erro); continue; }
    ok(est.length > 0 && est.some(doPasso2), 'pintura ' + nome + ' (' + PINTA[nome] + '): o censo RECUSA'
      + (est.length ? ' (' + est[0].alvo + ' @' + est[0].x + ',' + est[0].y + ')'
        : ' — PASSOU LIMPO, aria-hidden sem texto voltou a ser absolvido pintando'));
  }
  // e o contraponto: o MESMO span sem pintar nada continua absolvido (zero falso-positivo novo)
  const pgV = await abrirPagina(nav, arqT);
  await pgV.evaluate(injetarVaoInerte);
  await excluir(pgV, 'controles');
  const estV = await pgV.evaluate(CENSO.censoDoQuadro, [L, A, permT, CENSO.SELETOR_INTERATIVO]);
  await pgV.close();
  ok(estV.length === 0, 'CONTRAPONTO: vão aria-hidden sem texto E sem pintura nenhuma continua ABSOLVIDO'
    + (estV.length ? ' — FALSO-POSITIVO ' + JSON.stringify(estV) : ''));

  await nav.close();
  if (falhas) { console.log('\nREPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('\nok');
})();
