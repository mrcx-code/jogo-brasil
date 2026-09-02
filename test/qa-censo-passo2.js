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
//   1. MUTANTES DE OUTRO AUTOR (`q107a..d`), com outra forma de pôr texto inerte na foto.
//   2. A COBERTURA da segunda passada, em número: quantos elementos ela JULGA e quantos ela
//      ABSOLVE por ancestralidade. Se ela absolvesse quase tudo, seria um no-op de aparência boa.
//   3. O VARRIMENTO DE FALSO-POSITIVO nas páginas públicas geradas, e não só no
//      `territorio/index.html` — é o único teste que decide se a entrega derruba a `main`.
//
// O QUE ESTE ARQUIVO COBRA POR EXIT CODE, e por que só isto:
//   · `m106` (do autor) e `q107d` (meu, em OUTRO contêiner provado — a `.lista`, não a `.barra`)
//     têm de ser recusados. Se a segunda passada virar no-op num refactor, isto fica vermelho.
//   · a página real, com a exclusão do gerador aplicada, tem de sair com ZERO estranhos.
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
function permitidosDe(secao, arq) {
  return CENSO.permitidosTerritorio(
    CHROME.barraHtml(secao),
    secao === 'territorio' ? CENSO.pontosDoHtml(fs.readFileSync(arq, 'utf8')) : []);
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
};

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
    if (p.secao === 'territorio') {
      ok(est.length === 0, 'territorio: o censo aprova o cartão real (é ele que o gerador cobra)');
    }
  }

  // ---------------------------------------------------------------- 2. OS MUTANTES DE OUTRO AUTOR
  console.log('\n=== 2. MUTANTES DE OUTRO AUTOR contra territorio/index.html');
  const arqT = path.join(RAIZ, 'territorio', 'index.html');
  const permT = permitidosDe('territorio', arqT);
  const PEGA_POR_EXIT = { q107d: true };
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

  await nav.close();
  if (falhas) { console.log('\nREPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('\nok');
})();
