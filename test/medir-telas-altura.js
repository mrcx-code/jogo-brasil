// A FAIXA MORTA DE ALTURA, tela por tela (18/08).
//
// O DEFEITO QUE ISTO EXISTE PARA NÃO TER DE NOVO. Em 17/08 o menu principal foi consertado: ele
// tinha 211 px de altura (601..811) em que o layout cheio não cabia e o compacto já não era
// aplicado, separados por uma consulta de mídia de 1 px. Trocou-se o degrau por sete variáveis
// que interpolam, e ficou são. **Só que o conserto foi feito no menu e em mais nenhuma tela** —
// e a AJUSTES tem exatamente o mesmo degrau, escrito olhando 320×568, com o mesmo sintoma numa
// faixa que inclui 360×640: o aparelho Android mais comum do país.
//
// Este instrumento varre a altura de 20 em 20 px e mede, em CADA tela, se algo saiu da janela.
// Ele não olha só o caso fácil — medir o caso fácil é pior que não medir, porque dá confiança.
//
// ============================================================================================
// O QUE ELE MEDIA E NÃO REPROVAVA — três cegueiras achadas pelo QA em 18/08, todas aqui dentro.
//
// (1) A TELA VAZIA, e esta era a maior. Ele abria a tela com `abrirTela()` e mais nada. Só que
//     nenhuma tela de lista se monta sozinha: quem enche é `montarCapitulos()`, `montarFontes()`,
//     `montarGlossario()`, `montarCompletude()`, `montarObra()`, `montarConfig()` — chamadas pelo
//     toque no botão, nunca por `abrirTela`. Medido: a CAPÍTULOS tinha **5 nós** e passou a ter
//     **71**; a DE ONDE VEM, 4 → **207**; o GLOSSÁRIO, 10 → **135**; A HISTÓRIA, 5 → **568**;
//     O LUGAR, 5 → **38**; a AJUSTES, 10 → **41**. Seis das oito telas eram medidas VAZIAS — e
//     tela vazia cabe em qualquer altura. Nenhuma linha da saída denunciava isso.
//
// (2) O FILTRO QUE ANISTIAVA QUEM ROLA. O corte era `(acima>0||abaixo>0) && !podeRolar`, com
//     `podeRolar = overflow-y !== visible`. `telaMenu`, `telaFim` e `telaObra` têm `overflow-y:
//     auto` — logo NUNCA podiam reprovar, acontecesse o que acontecesse. Prova: com
//     `#btnFimVoltar{position:fixed;top:-400px}` injetado, a saída da CHEGADA fica fora da tela
//     e fora de qualquer rolagem, e a versão antiga imprimia "cabe em todas" e saía com 0.
//
// (3) O SELETOR DE QUATRO CLASSES. `.telaTit, .telaBtn, .cartao, #cfgInfo` via 7 nós de 58 na
//     CHEGADA. Agora mede-se **todo nó com caixa não vazia**.
//
// ============================================================================================
// O CRITÉRIO NOVO, e ele é o difícil desta medição.
//
// Tela que ROLA não é defeituosa por ter conteúdo além da dobra — página que rola é desenho
// legítimo, e reprovar isso seria proibir a CHEGADA de existir. Mas "cabe em toda altura" não
// pode ser dito de uma tela que ninguém consegue reprovar. Então a régua passa a ser ALCANCE,
// não altura, e ela vale para as duas famílias:
//
//   · **Nó de conteúdo sem resgate** — texto, botão, imagem — fora da janela e sem nenhum
//     ancestral rolante que o traga de volta: CORTE. Reprova. É o critério antigo, que estava
//     certo para a família que não rola, agora aplicado a todos os nós e não a quatro classes.
//   · **Sangria** — nó SEM conteúdo (caixa decorativa, moldura, o próprio rolo) fora da janela:
//     sai impresso com o pior número e o nome do nó, e NÃO reprova. Um poste que sangra pela
//     borda de baixo é desenho; uma frase cortada não é. A distinção é dita aqui em vez de ser
//     escondida numa lista de exceções, e o número aparece na saída para ninguém dizer que não
//     sabia.
//   · **A ÂNCORA** — a saída da tela (VOLTAR, ou o que faz a pessoa sair dali; no menu, JOGAR,
//     que é a porta para a frente). É ela que substitui o filtro que anistiava, e o veredito
//     tem quatro estados, medidos no jogo vivo e nesta ordem:
//       `dentro`   — a caixa inteira cabe na janela;
//       `rolando`  — está além da dobra, e o instrumento **rola de verdade** (até o fim do rolo,
//                    e depois `scrollIntoView`) e ela ENTRA em vista. Este é o veredito legítimo
//                    de uma página que rola, e ele sai impresso com o quanto ela estava além da
//                    dobra — dizer "cabe em todas" ali era a mentira que este arquivo contava;
//       `cortada`  — parte dela aparece, parte não, e nada rola para resgatar. Não reprova por
//                    aqui porque a regra do CORTE já reprovou o mesmo defeito uma vez — contar
//                    duas vezes o mesmo buraco infla o placar e some com o resto;
//       `presa`    — nenhum pixel dela na janela e rolar não traz. Reprova. Sem saída a pessoa
//                    fica trancada na tela, que é o defeito que "cabe em todas" prometia não ter.
//     Alcançada, ainda se mede se o TOQUE chega: `elementFromPoint` no centro do que está
//     visível dela. Botão coberto por outro elemento prende tanto quanto botão fora da tela.
//
// "Resgate" é o ancestral rolante mais próximo, dentro da tela (a própria tela conta), **e ele
// só vale se estiver visível na janela**: um rolo inteiro abaixo da dobra não resgata ninguém.
// Sem essa condição, bastaria empurrar a lista para fora da tela para o instrumento calar.
//
// COMO SE MEDE O PRÓPRIO INSTRUMENTO: `ENCAIXE_DEFEITO="<css>"` injeta uma folha de estilo antes
// de medir. É o autoteste — um instrumento que nunca foi visto reprovando não é instrumento, é
// decoração. Duas rodadas sem mudança nenhuma dão diferença ZERO de texto (medido em 18/08), e
// com `ENCAIXE_DEFEITO='#btnFimVoltar{position:fixed;top:-400px}'` ele reprova a CHEGADA.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));

// A tela do MAPA (ONDE FOI) é território do dono e não se mede aqui, por decisão de 17/08.
// `monta`: quem enche a tela — sem isto se mede uma tela vazia (cegueira 1 acima).
// `ancora`: a saída. No menu não há VOLTAR: a âncora é JOGAR, a porta para a frente.
const TELAS = [
  { id: 'telaMenu', monta: null, ancora: 'btnJogar' },
  { id: 'telaConfig', monta: 'montarConfig', ancora: 'btnVoltarCfg' },
  { id: 'telaFim', monta: 'montarFim', ancora: 'btnFimVoltar' },
  { id: 'telaCapitulos', monta: 'montarCapitulos', ancora: 'btnVoltarCap' },
  { id: 'telaCompletude', monta: 'montarCompletude', ancora: 'btnVoltarComp' },
  { id: 'telaFontes', monta: 'montarFontes', ancora: 'btnVoltarFontes' },
  { id: 'telaGlossario', monta: 'montarGlossario', ancora: 'btnVoltarGloss' },
  { id: 'telaObra', monta: 'montarObra', ancora: 'btnVoltarObra' },
  // A TELA DE FALA ENTROU EM 18/08, e ela era o buraco mais sério da lista: é ONDE A PESSOA LÊ
  // A HISTÓRIA — a perna "ensina" da tese do produto — e nenhum instrumento de altura do
  // repositório a olhava. Não por decisão: por esquecimento, porque ela não se monta como as
  // outras. `abrirTela` não a enche; quem enche é `abrirFala(titulo, quando, linhas, …)`, com
  // argumentos. As outras oito couberam num nome de função e ela não, então ficou de fora.
  //
  // Mede-se o PIOR CASO REAL, escolhido do próprio conteúdo do jogo na hora da medição: o
  // capítulo cuja abertura tem mais caracteres somados. Medir a fala mais curta seria medir o
  // caso fácil, que é pior que não medir.
  //
  // A âncora dela é PULAR: é o único jeito de sair de uma fala sem esperar o fim.
  { id: 'telaFala', monta: 'FALA', ancora: 'btnFalaPular' },
];
const LARGURA = Number(process.argv[2] || 360);
const H0 = Number(process.argv[3] || 560);
const H1 = Number(process.argv[4] || 900);
const TOL = 2;   // arredondamento de sub-pixel e borda; abaixo disto não é corte, é ruído

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: LARGURA, height: H1 }, hasTouch: true, isMobile: true });
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(ALVO);
  await pg.waitForTimeout(1600);
  if (process.env.ENCAIXE_DEFEITO) {
    await pg.addStyleTag({ content: process.env.ENCAIXE_DEFEITO });
    console.log('(defeito injetado de propósito: ' + process.env.ENCAIXE_DEFEITO + ')\n');
  }
  // um save que abre tudo: a CHEGADA na segunda vez, a obra de pé, os capítulos lidos
  await pg.evaluate(() => {
    localStorage.clear();
    S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.travessias = 1;
    S.cenario = TOTAL_CENAS - 1; S.fronteira = S.cenario;
    S.acolhidos = S.acolhidos.map(() => 0); S.acolhidos[CAP_GENTE] = 6;
    R.chegou = 2; R.dias = 4; R.segundos = 9000; R.historia = 3; R.fontes = 2;
    fecharTudo(); pararFala();
  });

  const faixa = {};
  TELAS.forEach(t => { faixa[t.id] = []; });

  for (let h = H0; h <= H1; h += 20) {
    await pg.setViewportSize({ width: LARGURA, height: h });
    await pg.waitForTimeout(180);
    for (const tela of TELAS) {
      const r = await pg.evaluate(([id, monta, ancora, TOL]) => {
        fecharTudo();
        // Se o nome de quem monta a tela mudar, isto REPROVA em vez de medir a tela vazia de
        // novo — a cegueira (1) só existiu porque ninguém era avisado de que a tela vinha vazia.
        // A FALA É O CASO À PARTE: ela não se monta por nome de função, e sim por `abrirFala`
        // com argumentos. O pior caso sai do conteúdo do jogo — a abertura mais longa dos treze.
        let montaFaltando = false;
        if (monta === 'FALA') {
          if (typeof window.abrirFala !== 'function' || typeof EPOCAS === 'undefined') {
            return { montaFaltando: true };
          }
          pararFala();
          const pior = EPOCAS.slice().sort(function (a, b) {
            return b.abertura.join('').length - a.abertura.join('').length;
          })[0];
          abrirFala(pior.nome, pior.quando, pior.abertura, null);
          const elF = document.getElementById(id);
          if (elF) { elF.classList.add('aberta'); elF.setAttribute('aria-hidden', 'false'); }
        } else {
          // Se o nome de quem monta a tela mudar, isto REPROVA em vez de medir a tela vazia de
          // novo — a cegueira (1) só existiu porque ninguém era avisado de que a tela vinha vazia.
          montaFaltando = !!monta && typeof window[monta] !== 'function';
          if (montaFaltando) return { montaFaltando: true };
          if (monta) window[monta]();
          abrirTela(id);
        }
        const el = document.getElementById(id);
        if (!el) return null;
        const J = window.innerHeight, L = window.innerWidth;
        const nome = f => f.tagName.toLowerCase() + (f.id ? '#' + f.id : '') +
          (f.className && typeof f.className === 'string' && f.className.trim()
            ? '.' + f.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
        const rolanteY = f => {
          const o = getComputedStyle(f).overflowY;
          return (o === 'auto' || o === 'scroll') && f.scrollHeight - f.clientHeight > 1;
        };
        const rolanteX = f => {
          const o = getComputedStyle(f).overflowX;
          return (o === 'auto' || o === 'scroll') && f.scrollWidth - f.clientWidth > 1;
        };
        // um resgate só resgata se ELE estiver à vista: rolo todo fora da dobra não salva ninguém
        const aparece = f => {
          const b = f.getBoundingClientRect();
          return Math.min(b.bottom, J) - Math.max(b.top, 0) >= 24;
        };
        const resgate = (f, eixo) => {
          const rola = eixo === 'y' ? rolanteY : rolanteX;
          let p = f.parentElement;
          while (p) {
            if (rola(p) && aparece(p)) return p;
            if (p === el) return null;
            p = p.parentElement;
          }
          return null;
        };
        // CONTEÚDO = o que a pessoa lê, toca ou olha. O resto é caixa: sangra e não reprova.
        const conteudo = f => /^(button|a|input|select|textarea|img|canvas|svg|video|picture)$/i.test(f.tagName)
          || [...f.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());

        const todos = [...el.querySelectorAll('*')].filter(f => {
          const b = f.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && getComputedStyle(f).visibility !== 'hidden';
        });
        const cortes = [], sangrias = [], lados = [];
        todos.forEach(f => {
          const b = f.getBoundingClientRect();
          const acima = Math.round(-b.top), abaixo = Math.round(b.bottom - J);
          if (acima > TOL || abaixo > TOL) {
            const alvo = (!resgate(f, 'y')) ? (conteudo(f) ? cortes : sangrias) : null;
            if (alvo) alvo.push({ n: nome(f).slice(0, 44), acima: Math.max(acima, 0), abaixo: Math.max(abaixo, 0) });
          }
          const dir = Math.round(b.right - L), esq = Math.round(-b.left);
          if ((dir > TOL || esq > TOL) && !resgate(f, 'x') && conteudo(f)) {
            lados.push({ n: nome(f).slice(0, 44), dir: Math.max(dir, 0), esq: Math.max(esq, 0) });
          }
        });

        // A ÂNCORA: existe? tem caixa? cabe? se não cabe, ROLAR DE VERDADE a traz? e o toque chega?
        const b = document.getElementById(ancora);
        const saida = { id: ancora, existe: !!b };
        if (b) {
          const cadeia = [];
          for (let p = b.parentElement; p; p = p.parentElement) {
            if (rolanteY(p) || p.scrollTop) cadeia.push([p, p.scrollTop]);
            if (p === el) break;
          }
          const visivel = q => Math.min(q.bottom, J) - Math.max(q.top, 0);   // px dela na janela
          const cabe = q => q.top >= -TOL && q.bottom <= J + TOL && q.height > 0;
          const cx = b.getBoundingClientRect();
          saida.caixa = Math.round(cx.height);
          saida.top = Math.round(cx.top); saida.bot = Math.round(cx.bottom);
          saida.foraPor = Math.max(Math.round(cx.bottom - J), Math.round(-cx.top), 0);
          let q = cx;
          if (cabe(cx)) saida.como = 'dentro';
          else {
            // 1) rolar até o FIM, que é o gesto de quem procura o botão lá embaixo
            cadeia.forEach(([p]) => { p.scrollTop = p.scrollHeight; });
            q = b.getBoundingClientRect();
            if (cabe(q)) saida.como = 'rolando ate o fim';
            else {
              // 2) e, se ainda não, o que o navegador sabe fazer
              b.scrollIntoView({ block: 'center' });
              q = b.getBoundingClientRect();
              // `cortada`: aparece um pedaço dela e nada rola para trazer o resto — o CORTE já
              // reprovou isso; `presa`: nem um pixel na janela, e aí a tela não tem saída.
              saida.como = cabe(q) ? 'rolando ate ela'
                : (visivel(q) > TOL ? 'cortada' : 'PRESA');
            }
            saida.aposTop = Math.round(q.top); saida.aposBot = Math.round(q.bottom);
            saida.visivel = Math.max(0, Math.round(visivel(q)));
          }
          // e, alcançada, o toque chega nela? Medido no centro do que está VISÍVEL dela — o centro
          // da caixa pode estar fora da janela e `elementFromPoint` devolveria nada, o que seria
          // um "coberta" falso.
          if (saida.como !== 'PRESA') {
            const y = (Math.max(q.top, 0) + Math.min(q.bottom, J)) / 2;
            const alvo = document.elementFromPoint(Math.round(q.left + q.width / 2), Math.round(y));
            saida.tocavel = !!(alvo && (alvo === b || b.contains(alvo)));
            saida.cobertaPor = saida.tocavel ? '' : (alvo ? nome(alvo).slice(0, 40) : '(nada — ponto fora da janela)');
          }
          cadeia.forEach(([p, v]) => { p.scrollTop = v; });
        }

        return {
          cortes, sangrias, lados, saida, montaFaltando,
          rola: Math.max(el.scrollHeight - el.clientHeight, 0),
          nos: todos.length,
          rolaCorpo: document.body.scrollWidth > L + TOL,
        };
      }, [tela.id, tela.monta, tela.ancora, TOL]);
      if (r) faixa[tela.id].push({ h, ...r });
    }
  }

  console.log('largura ' + LARGURA + ' px · alturas ' + H0 + '..' + H1 + '\n');
  const pior = (lista, campo) => Math.max(0, ...lista.map(x => x[campo]));
  // as alturas que falham, ditas por extenso: sem isso o dev tem de re-varrer para achar a faixa
  const faixaDe = lista => {
    const hs = lista.map(x => x.h);
    return hs.length > 6 ? hs[0] + '..' + hs[hs.length - 1] : hs.join(', ');
  };
  let reprovas = 0;
  for (const tela of TELAS) {
    const t = tela.id;
    const linhas = faixa[t];
    const n = linhas.length;
    const comCorte = linhas.filter(x => x.cortes.length);
    const comLado = linhas.filter(x => x.lados.length);
    const comSangria = linhas.filter(x => x.sangrias.length);
    const corpo = linhas.filter(x => x.rolaCorpo);
    const rolam = linhas.filter(x => x.rola > 0).length;
    const presa = linhas.filter(x => !x.saida.existe || !x.saida.caixa ||
      x.saida.como === 'PRESA' || x.saida.tocavel === false);
    const foraDaDobra = linhas.filter(x => x.saida.como && x.saida.como !== 'dentro');

    const parte = [];
    if (linhas.some(x => x.montaFaltando)) {
      console.log(t.padEnd(15) + ' · QUEM MONTA SUMIU: `' + tela.monta + '` não é função — a tela seria medida VAZIA');
      reprovas++;
      continue;
    }
    parte.push('nós ' + Math.max(...linhas.map(x => x.nos)));
    parte.push(rolam ? 'rola em ' + rolam + '/' + n : 'não rola');
    if (comCorte.length) {
      const p = comCorte.flatMap(x => x.cortes);
      parte.push('CORTA em ' + comCorte.length + '/' + n + ' altura(s) [' + faixaDe(comCorte) + ']' +
        ' (pior ' + pior(p, 'acima') + ' px acima, ' + pior(p, 'abaixo') + ' px abaixo: ' +
        p.slice().sort((a, b) => (b.acima + b.abaixo) - (a.acima + a.abaixo))[0].n + ')');
      reprovas++;
    } else parte.push('conteúdo cabe em todas');
    if (comLado.length) {
      const p = comLado.flatMap(x => x.lados);
      parte.push('SAI DE LADO em ' + comLado.length + '/' + n + ' [' + faixaDe(comLado) + '] (pior ' +
        Math.max(pior(p, 'dir'), pior(p, 'esq')) + ' px: ' + p[0].n + ')');
      reprovas++;
    }
    // a saída: o veredito que substitui o filtro que anistiava quem rola
    if (presa.length) {
      const x = presa[0];
      parte.push('SAÍDA PRESA (' + x.saida.id + ') em ' + presa.length + '/' + n + ' [' + faixaDe(presa) + ']: ' +
        (!x.saida.existe ? 'não existe no DOM'
          : !x.saida.caixa ? 'caixa de altura zero'
            : x.saida.como === 'PRESA' ? 'nenhum pixel na janela e rolar não traz (top ' + x.saida.aposTop +
              ', janela ' + x.h + ')'
              : 'coberta por ' + x.saida.cobertaPor) + ' — na altura ' + x.h);
      reprovas++;
    } else if (foraDaDobra.length) {
      const cortada = foraDaDobra.filter(x => x.saida.como === 'cortada');
      parte.push('saída (' + tela.ancora + ') além da dobra em ' + foraDaDobra.length + '/' + n +
        ' (+' + Math.min(...foraDaDobra.map(x => x.saida.foraPor)) + ' a +' +
        Math.max(...foraDaDobra.map(x => x.saida.foraPor)) + ' px) e ' +
        (cortada.length ? 'CORTADA em ' + cortada.length + '/' + n + ' [' + faixaDe(cortada) + '] (sobram ' +
          Math.min(...cortada.map(x => x.saida.visivel)) + ' px dela; já contado no CORTE)'
          : 'SE ALCANÇA ' + foraDaDobra[0].saida.como));
    } else parte.push('saída (' + tela.ancora + ') dentro em todas');
    if (comSangria.length) {
      const p = comSangria.flatMap(x => x.sangrias);
      const w = p.slice().sort((a, b) => (b.acima + b.abaixo) - (a.acima + a.abaixo))[0];
      parte.push('sangria (caixa sem conteúdo) em ' + comSangria.length + '/' + n +
        ': ' + w.n + ' ' + Math.max(w.acima, w.abaixo) + ' px');
    }
    if (corpo.length) { parte.push('CORPO ROLA em ' + corpo.length); reprovas++; }
    console.log(t.padEnd(15) + ' · ' + parte.join(' · '));
  }
  console.log('\nerros de console: ' + (erros.length ? erros[0] : '(nenhum)'));
  console.log(reprovas ? '\nFALHOU: ' + reprovas + ' problema(s) de encaixe' : '\nPASSOU');
  await nav.close();
  process.exit(reprovas ? 1 : 0);
})();
