// A RÉGUA DE RESPONSIVIDADE EM TELA LARGA — o "menu de celular esticado" não volta (20/08).
//
// O DEFEITO QUE ISTO EXISTE PARA NÃO TER DE NOVO. Até 20/08 a home em tela larga era o layout
// de celular esticado: a proposta (`#telaMenu .mpFrase`) em 11px FIXOS — ilegível num notebook —
// e o painel de largura fixa com ~80% de vazio. O dono apontou de olho ("muito pequenininho,
// não está legível"; "só o logo adaptando não parece responsivo"). O conserto (home cinemática)
// fez a tipografia escalar com `clamp()` e o painel virar faixa contida à direita.
//
// O SMOKE JÁ MEDE O CELULAR (390×844). Esta régua mede o que faltava: TABLET e NOTEBOOK. A
// régua é de LEGIBILIDADE e de CONTENÇÃO — em tela larga o texto da proposta tem de ler
// confortável, e o painel não pode ocupar a tela toda (seria o menu de celular esticado). Se
// alguém voltar a fixar 11px, tirar o clamp, ou fazer o painel encher a largura, aqui reprova
// por exit code — é o portão, não um aviso.
//
// AMPLIADA PELO QA em 20/08, depois de medir três buracos de verdade (números em test/tmp-*
// descartados, refeitos aqui como asserção permanente):
//
//   1. O DEGRAU DE 899→900 nunca era atravessado. As três telas originais (768, 1024, 1366)
//      caem todas OU bem abaixo OU bem acima de 900 — nenhuma testa a última largura do layout
//      "apertado" (`@media (orientation: landscape) and (max-width: 899px)`, estilo.css:729),
//      que é OUTRO layout que o cinemático, com regras próprias de legibilidade e contenção.
//      Medido em 899×500: proposta 18.6px, cta 10.3px, painel 280px (31%) — lê bem, mas ninguém
//      media isso, e uma regressão ali passaria despercebida para sempre.
//   2. TELEFONE DEITADO REAL CAI NO LAYOUT CINEMÁTICO, E NINGUÉM MEDIA A ALTURA CURTA JUNTO
//      COM A LARGURA ≥900. iPhone 14/15 Pro Max deitado é 926×428 CSS px — largura já cinemática,
//      altura de telefone. `#telaMenu` nesse degrau tem `overflow-y:auto` de propósito (é o
//      mesmo poste que rola em qualquer tela baixa), e MEDIDO por scroll manual o botão
//      CONFIGURAÇÕES continua alcançável (rola 175px, chega, é tocável) — mas nenhum instrumento
//      travava essa promessa. Se algum dia o overflow sumir do bloco cinemático, o poste
//      simplesmente FICARIA PRESO numa tela de telefone, e só quem testasse landscape veria.
//   3. ULTRAWIDE (1920+) nunca foi medido. O `clamp()` deveria travar o crescimento do painel e
//      do logo em vez de deixá-los continuar crescendo com a largura — medido: painel trava em
//      460px (18–24% da largura), frase e cta batem no mesmo teto do notebook. Sem medir, um
//      clamp mal escrito (ex.: em vw puro, sem teto em px) passaria despercebido até alguém
//      abrir num monitor grande.
//
// A NOVA ASSERÇÃO (alcançável): em toda largura da tabela, o ÚLTIMO botão do poste
// (`#btnConfig`) tem de estar alcançável — existir, ter caixa, e (se estiver além da dobra)
// SÓ pode ser trazido de volta por um ANCESTRAL com `overflow-y: auto|scroll` de verdade.
//
// A PRIMEIRA VERSÃO DESTA ASSERÇÃO ERA DECORAÇÃO, E FICOU PROVADO NESTA MESMA RODADA (lição
// EQUIPE.md 2.8): usava `cfg.scrollIntoView()`, que o navegador cumpre mexendo o `scrollTop`
// do ancestral MESMO QUE ELE TENHA `overflow-y: hidden` — `scrollIntoView` é imperativo e não
// respeita a restrição que impede o DEDO de rolar. Injetando
// `#telaMenu{overflow-y:hidden!important}` em 926×428 essa versão continuava dizendo
// "alcançável" — reprovou o próprio autoteste que deveria morder. A versão atual acha o
// ANCESTRAL ROLÁVEL de verdade (`overflow-y` computado é `auto` ou `scroll`, com conteúdo que
// excede a caixa) e só mexe o `scrollTop` dele; se não existir nenhum e o botão estiver fora da
// janela, é PRESO — do jeito que o toque real veria. Reverificado depois do conserto: o mesmo
// `overflow-y:hidden` agora reprova por exit code (rodapé do arquivo).
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));

// A CURA ERA PELA METADE (PENDENTES 69, achado do QA em 23/08): esperar `.aberta` não é
// esperar a mobília PARAR. `estilo.css:587` roda `brota .42s` em `#telaMenu.aberta > *`, com
// `.12s` de atraso no terceiro filho (o poste) — a tela só assenta em ~540ms, e uma régua que lê
// geometria antes disso mede um layout que ainda está andando. Medido nesta rodada, na MESMA
// máquina: com só a espera de `.aberta`, o `#btnConfig` ainda se move até 18px depois da leitura
// em 3 de 6 telas.
//
// O CONSERTO É O MESMO `telaParada()` que o `test/encaixe.js` já usa (linha 75 de lá, 21/08) —
// reaproveitado aqui, não reinventado. Ele não fica num módulo compartilhado porque o território
// desta rodada é só este arquivo e o `fila-auth.js`: `encaixe.js` não expõe `module.exports`,
// então importar de lá rodaria a suíte inteira dele por engano. A cópia é intencional e a
// implementação é idêntica; se o `encaixe.js` mudar essa função, releia-a aqui.
async function telaParada(pg, id) {
  return await pg.evaluate(async (id) => {
    const t0 = performance.now();
    const tela = document.getElementById(id);
    if (!tela) return { ms: 0, quantas: 0, achou: false };
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const vivas = (tela.getAnimations ? tela.getAnimations({ subtree: true }) : [])
      .filter(a => a.animationName !== 'respira' && a.playState !== 'idle')
      .filter(a => !(a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity))
      .map(a => a.finished.catch(() => {}));
    await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 20000))]);
    await new Promise(r => requestAnimationFrame(r));
    return { ms: Math.round(performance.now() - t0), quantas: vivas.length, achou: true };
  }, id);
}

// largura -> piso de fonte legível naquela largura (da tabela de faixas da direção de arte)
const TELAS = [
  { nome: 'tablet retrato',   w: 768,  h: 1024, pisoFrase: 12, pisoCta: 7 },
  { nome: 'tablet paisagem',  w: 1024, h: 768,  pisoFrase: 15, pisoCta: 9 },
  { nome: 'notebook',         w: 1366, h: 768,  pisoFrase: 16, pisoCta: 10 },
  // fronteira do breakpoint 900 (achado 1): a última largura do layout "apertado", landscape
  { nome: 'landscape 899',    w: 899,  h: 500,  pisoFrase: 13, pisoCta: 7 },
  // telefone real deitado, largura já cinemática e altura curta (achado 2)
  { nome: 'phone deitado 926', w: 926, h: 428,  pisoFrase: 14, pisoCta: 7 },
  // ultrawide — o clamp tem de travar, não só desacelerar (achado 3)
  { nome: 'ultrawide 1920',   w: 1920, h: 1080, pisoFrase: 16, pisoCta: 10 },
];

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  let falhou = false;
  for (const t of TELAS) {
    const pg = await nav.newPage();
    await pg.setViewportSize({ width: t.w, height: t.h });
    await pg.goto(ALVO);
    // ERA waitForTimeout(1400) — 1,4 s de aposta sobre um boot cuja duração é da máquina.
    // O fim do boot é observável: `abrirTela("telaMenu")` é a última linha do
    // `DOMContentLoaded` do jogo. Teto de 30 s como detector de travamento; o `.catch` mantém
    // a asserção de baixo como quem reprova, em vez de a espera derrubar o instrumento.
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!document.getElementById('telaMenu')
      && document.getElementById('telaMenu').classList.contains('aberta'),
      null, { timeout: 30000 }).catch(() => {});
    // METADE QUE FALTAVA (PENDENTES 69): `.aberta` só diz que a classe foi ligada, não que a
    // mobília do menu parou de andar (`brota .42s`, atraso de .12s no poste). Sem isto a régua
    // mede um layout ainda em movimento.
    await telaParada(pg, 'telaMenu');
    if (process.env.REGUA_DEFEITO) {
      await pg.addStyleTag({ content: process.env.REGUA_DEFEITO });
    }
    // O MESMO defeito do bloco de retrato entra AQUI também, e é o controle da asserção
    // negativa: `REGUA_CHAO=espremer` sobe a linha do chão em toda tela, inclusive nas
    // deitadas e no notebook, e `chaoIntacto` tem de reprovar nas seis.
    if (process.env.REGUA_CHAO === 'espremer') {
      await pg.evaluate(() => { chaoHome = 0.60; GROUND = Math.round(H * 0.60); redesenharFundo(); });
      await pg.waitForTimeout(150);
    }
    const m = await pg.evaluate(() => {
      const px = (sel) => { const el = document.querySelector(sel); return el ? parseFloat(getComputedStyle(el).fontSize) : null; };
      const larg = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().width : null; };
      const menu = document.querySelector('#telaMenu');
      const visivel = !!menu && getComputedStyle(menu).display !== 'none' && menu.getBoundingClientRect().width > 0;

      // o último botão do poste: existe, tem caixa, e — se estiver além da dobra — algum
      // ancestral com overflow-y REALMENTE rolável (auto/scroll, e com o que rolar) o resgata?
      const cfg = document.getElementById('btnConfig');
      let alcancavel = false, tocavel = false, motivo = 'não existe';
      if (cfg) {
        const b0 = cfg.getBoundingClientRect();
        if (b0.width === 0 || b0.height === 0) motivo = 'caixa vazia';
        else {
          const J = window.innerHeight, L = window.innerWidth;
          const cabe = (r) => r.top >= -2 && r.bottom <= J + 2 && r.left >= -2 && r.right <= L + 2;
          let b = cfg.getBoundingClientRect();
          if (!cabe(b)) {
            // rola de verdade só quem o dedo conseguiria rolar
            for (let p = cfg.parentElement; p; p = p.parentElement) {
              const cs = getComputedStyle(p);
              const rolavel = (cs.overflowY === 'auto' || cs.overflowY === 'scroll')
                && p.scrollHeight - p.clientHeight > 1;
              if (rolavel) p.scrollTop = p.scrollHeight;
              if (p === menu) break;
            }
            b = cfg.getBoundingClientRect();
          }
          alcancavel = cabe(b);
          // A DECISÃO DO EIXO X (item `regua-eixo-x-nao-olhado`, 02/09, re-medida pelo dev-jogo):
          // transbordo alcançável só por ROLAGEM LATERAL continua contando como PRESO — não é
          // "sem sair da mensagem", é escolha com número. Medido nesta rodada, nas SEIS telas
          // largas, `#telaMenu` tem `overflow-x` sempre `auto` mas `scrollWidth-clientWidth`
          // (sobraX) é **0 em produção, nas seis**, porque `overflow-x` nunca é DECLARADO em
          // `estilo.css` para `#telaMenu` (só `overflow-y: auto`, linhas 847/1026) — o `auto` do
          // eixo X é efeito colateral do spec (UA força o eixo oposto a `auto` quando só um dos
          // dois é `visible`), não uma decisão de design. Só aparece sobra (141 px em 899×500,
          // 265 px em 926×428) sob o defeito INJETADO `#poste{position:absolute;top:0}` — nunca
          // em produção. Diferente do resgate vertical, que resgata um `overflow-y:auto`
          // ESCRITO de propósito (o próprio poste rolar em tela baixa é comportamento intencional
          // documentado no CSS), rolar de lado aqui seria premiar um eixo que ninguém decidiu ter.
          // Por isso o resgate CONTINUA só em Y — a mudança é a MENSAGEM, que deixa de mentir:
          // antes só imprimia top/bottom/janela mesmo quando a falha era horizontal (produziu
          // diagnóstico errado duas vezes, EQUIPE.md); agora imprime os dois eixos sempre.
          if (!alcancavel) motivo = 'fora da janela mesmo depois de rolar o(s) ancestral(is) rolável(eis) (top ' + Math.round(b.top) + ', bottom ' + Math.round(b.bottom) + ', altura ' + J + ' · left ' + Math.round(b.left) + ', right ' + Math.round(b.right) + ', largura ' + L + ')';
          else {
            const cx = Math.round((b.left + b.right) / 2), cy = Math.round((Math.max(b.top, 0) + Math.min(b.bottom, J)) / 2);
            const alvo = document.elementFromPoint(cx, cy);
            tocavel = !!(alvo && (alvo === cfg || cfg.contains(alvo)));
            if (!tocavel) motivo = 'coberto por ' + (alvo ? (alvo.tagName + (alvo.id ? '#' + alvo.id : '')) : '(nada)');
          }
        }
      }

      // ---- A HIERARQUIA DOS PORTÕES (increment 2 da home, 21/08) ----
      // O defeito que isto existe para não ter de novo: até 21/08 seis das sete tábuas do poste
      // eram a MESMA tábua — medido, 273×50 em rgb(124,85,44) para A HISTÓRIA, GLOSSÁRIO,
      // CONFIGURAÇÕES e a do mapa. Uma home de plataforma que dá o mesmo peso a "o acervo de 167
      // verbetes" e a "configurações" não está dizendo o que a direção mandou dizer. A régua
      // mede a DISTÂNCIA entre os dois níveis, não a receita de cada um: quem quiser trocar a
      // madeira, a largura ou a letra pode — o que não pode é o degrau sumir.
      const caixa = function (el) {
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        return { id: el.id, w: r.width, h: r.height, op: parseFloat(cs.opacity) };
      };
      const naTela = function (el) { return getComputedStyle(el).display !== 'none'; };
      const portais = [...document.querySelectorAll('#poste .telaBtn.portal')].filter(naTela).map(caixa);
      const utilidade = [...document.querySelectorAll('#poste .telaBtn.sec')].filter(naTela).map(caixa);

      // ---- O DIORAMA DA HOME (increment 2, 22/08) ----
      // A camada de profundidade da home (`#homeCena`: a folhagem do plano da frente, o recorte
      // das quinas e a clareira) é pintada por JS a partir da vegetação do capítulo. Três coisas
      // podem quebrá-la em silêncio e nenhuma daria erro de console: ela sumir do molde, ela
      // deixar de cobrir a janela depois de girar, e — a pior — ela passar a RECEBER O DEDO, que
      // transformaria uma moldura decorativa numa placa de vidro por cima do mundo. A quarta é
      // ela existir VAZIA (a arte não chegou e a repintura não voltou), e é por isso que a régua
      // conta tinta em vez de conferir só o elemento.
      const dio = document.getElementById('homeCena');
      let dioMotivo = 'não existe', dioTinta = -1;
      if (dio) {
        const cs = getComputedStyle(dio), r = dio.getBoundingClientRect();
        if (cs.display === 'none') dioMotivo = 'apagada na home (display none)';
        else if (cs.pointerEvents !== 'none') dioMotivo = 'recebe o dedo (pointer-events: ' + cs.pointerEvents + ')';
        else if (r.width < window.innerWidth - 2 || r.height < window.innerHeight - 2) {
          dioMotivo = 'não cobre a janela (' + Math.round(r.width) + 'x' + Math.round(r.height) + ')';
        } else {
          const gg = dio.getContext('2d');
          const dd = gg.getImageData(0, 0, dio.width, dio.height).data;
          let n = 0;
          for (let k = 3; k < dd.length; k += 4) if (dd[k] > 120) n++;
          dioTinta = 100 * n / (dio.width * dio.height);
          dioMotivo = '';
        }
      }

      return {
        dioMotivo: dioMotivo,
        dioTinta: dioTinta,
        // A LINHA DO CHÃO SÓ SOBE EM RETRATO (22/08). Aqui a asserção é a NEGATIVA, e ela é a
        // metade do pedido do dono que ninguém mediria sozinha: deitado e desktop têm de
        // continuar com o 0,68 de sempre, byte a byte. Sem esta linha, um erro na guarda de
        // orientação reenquadraria o notebook inteiro e nenhum portão diria nada.
        chaoIntacto: GROUND === Math.round(H * 0.68),
        chaoGround: GROUND, chaoH: H,
        menuVisivel: visivel,
        frase: px('#telaMenu .mpFrase'),
        cta: px('#telaMenu .mpCta'),
        painel: larg('#poste'),
        logo: larg('#logoImg'),
        tela: window.innerWidth,
        cfgOk: alcancavel && tocavel,
        cfgMotivo: motivo,
        portais: portais,
        utilidade: utilidade,
      };
    });
    await pg.close();

    const probs = [];
    if (!m.menuVisivel) probs.push('menu não visível');
    if (m.frase == null || m.frase < t.pisoFrase) probs.push('proposta ' + (m.frase == null ? 'ausente' : m.frase.toFixed(1) + 'px') + ' < piso ' + t.pisoFrase);
    if (m.cta == null || m.cta < t.pisoCta) probs.push('cta ' + (m.cta == null ? 'ausente' : m.cta.toFixed(1) + 'px') + ' < piso ' + t.pisoCta);
    // em tela larga (>=900) o painel não pode ocupar quase a tela toda — isso é o "menu esticado"
    if (t.w >= 900 && m.painel != null && m.painel > t.w * 0.6) probs.push('painel ' + m.painel.toFixed(0) + 'px ocupa >60% da largura (esticado)');
    if (!m.cfgOk) probs.push('CONFIGURAÇÕES inalcançável: ' + m.cfgMotivo);
    if (!m.chaoIntacto) probs.push('a linha do chão MEXEU fora do retrato: GROUND ' + m.chaoGround
      + ' contra ' + Math.round(m.chaoH * 0.68) + ' (0,68 de H=' + m.chaoH + ')');
    // o piso de tinta é 0,6% da tela: medido 3,4% em 390×844 e 1,5% no ultrawide (a folha
    // cresce com a régua da tela, a tela cresce mais). Meio por cento é "há moldura"; zero é
    // "a camada existe e não desenhou nada", que é o modo de falha silencioso.
    if (m.dioMotivo) probs.push('diorama da home: ' + m.dioMotivo);
    else if (m.dioTinta < 0.6) probs.push('diorama da home sem plano da frente: ' + m.dioTinta.toFixed(2) + '% de folha densa (piso 0,6%)');

    // ---- os dois níveis do poste, medidos ----
    const P = m.portais || [], U = m.utilidade || [];
    // QUATRO desde 21/08: DE ONDE VEM saiu de dentro de CONFIGURAÇÕES e subiu ao topo por
    // decisão do dono. O número é cobrado de propósito — o modo de falha que este bloco existe
    // para pegar é uma tábua desaparecer do topo em silêncio, e "3 ou 4, tanto faz" não pega
    // isso. Se um quinto portão for decidido um dia, muda-se aqui E na tabela do estilo.css.
    if (P.length !== 4) probs.push('o topo do poste tem ' + P.length + ' portões, e a direção pede 4 (JOGAR · A HISTÓRIA · GLOSSÁRIO · DE ONDE VEM)');
    else {
      // (a) os três portões são IGUAIS entre si — é o que diz "isto é a plataforma inteira"
      const lp = Math.min(...P.map(p => p.w)), Lp = Math.max(...P.map(p => p.w));
      const ap = Math.min(...P.map(p => p.h)), Ap = Math.max(...P.map(p => p.h));
      if (Lp - lp > 1) probs.push('os portões não têm a mesma largura (' + P.map(p => p.id + ' ' + p.w.toFixed(0)).join(', ') + ')');
      if (Ap - ap > 1) probs.push('os portões não têm a mesma altura (' + P.map(p => p.id + ' ' + p.h.toFixed(0)).join(', ') + ')');
      // (b) e a utilidade é MENOR — em largura e em altura. 16 px e 6 px são o degrau mínimo
      //     que ainda se lê de longe; abaixo disso o print de 21/08 mostra dois níveis que
      //     leem como um só, que é exatamente o estado anterior.
      U.forEach(function (u) {
        if (u.w > lp - 16) probs.push(u.id + ' (nível 2) tem ' + u.w.toFixed(0) + 'px de largura contra ' + lp.toFixed(0) + ' do portão — o degrau sumiu');
        if (u.h > ap - 6) probs.push(u.id + ' (nível 2) tem ' + u.h.toFixed(0) + 'px de altura contra ' + ap.toFixed(0) + ' do portão — o degrau sumiu');
        // o degrau nunca desce abaixo do polegar: 44 px é piso, não sugestão (lição de 14/08)
        if (u.h < 44) probs.push(u.id + ' (nível 2) caiu para ' + u.h.toFixed(1) + 'px — abaixo dos 44 de dedo');
      });
    }

    const linha = t.nome.padEnd(16) + ' · ' + t.w + 'x' + t.h
      + ' · proposta ' + (m.frase != null ? m.frase.toFixed(1) : '—') + 'px'
      + ' · cta ' + (m.cta != null ? m.cta.toFixed(1) : '—') + 'px'
      + ' · painel ' + (m.painel != null ? m.painel.toFixed(0) : '—') + 'px'
      + ' · logo ' + (m.logo != null ? m.logo.toFixed(0) : '—') + 'px'
      + ' · portões ' + ((m.portais || []).length ? (m.portais[0].w.toFixed(0) + 'x' + m.portais[0].h.toFixed(0)) : '—')
      + ' · nível 2 ' + ((m.utilidade || []).length ? (m.utilidade[0].w.toFixed(0) + 'x' + m.utilidade[0].h.toFixed(0)) : '—')
      + ' · diorama ' + (m.dioTinta >= 0 ? m.dioTinta.toFixed(2) + '%' : 'AUSENTE')
      + ' · configurações ' + (m.cfgOk ? 'alcançável' : 'PRESO');
    if (probs.length) { console.log('  ✗ ' + linha + '  →  ' + probs.join('; ')); falhou = true; }
    else console.log('  ✓ ' + linha);
  }

  // ============================================================
  // A LINHA DO CHÃO NO MENU EM RETRATO — a régua da arte, cobrada dos DOIS lados (22/08)
  //
  // O QUE ISTO EXISTE PARA GARANTIR (PENDENTES 53, decisão do dono de 22/08). Em retrato a
  // personagem do diorama caía INTEIRA atrás das tábuas — medido pelo DOM em 22/08, zero pixel
  // visível em seis telas de retrato. A saída escolhida foi subir a linha do chão SÓ no menu
  // em retrato, e a régua que o dono aprovou é dura e NUMÉRICA:
  //
  //   · 0% de sobreposição da caixa dela com o poste, com as tábuas e com a frase de proposta;
  //   · respiro >= 8 px acima e abaixo;
  //   · a faixa livre precisa medir a altura DELA + 16 px — e SE NÃO DER, ELA NÃO ENTRA
  //     naquela tela. Ausente é melhor que espremida.
  //
  // OS DOIS LADOS SÃO COBRADOS, e é isso que separa esta régua de um "passou": nas telas em que
  // a faixa não dá, o portão exige que NADA tenha se mexido (a linha do chão continua em 0,68)
  // e que ela continue inteira atrás do poste. Uma implementação que subisse o chão "um
  // pouquinho" para espremê-la reprova aqui, e é de propósito.
  //
  // ...E HÁ UM TERCEIRO ESTADO DESDE O VETO DA ARTE (22/08): a chave `CHAO_HOME_LIGADO` nasce
  // DESLIGADA, e com ela desligada este bloco cobra INÉRCIA — `GROUND == round(H × 0,68)` e
  // `chaoHome == 0` nas SEIS telas de retrato, não só nas quatro em que a faixa não dá. O par
  // 390×844 antes/depois já prova que a tela de referência não se mexeu; a asserção FIXA isso
  // para as outras cinco, e é o que impede a subida de voltar ligada por acidente num merge.
  // A régua dos dois lados continua inteira aqui, e volta a valer no instante em que a chave
  // for ligada junto com o caminho-do-céu do PENDENTES 54.
  //
  // A CAIXA DELA É A ANALÍTICA, não a mancha do canvas — e isto foi medido antes de escrever:
  // a caixa alfa do `#heroHD` mede 102 px de altura onde ela tem 88, porque o PLANO DA FRENTE
  // (`desenharFrente`) é desenhado na mesma camada e a folha da quina de baixo entra na conta.
  // Em tela deitada a mesma leitura dá 511 px de largura. A caixa que vale é a que o
  // `desenharHeroiHD` usa: `HX*kx - dw/2` por `GROUND*ky - dh`, com `dh = HERO_TARGET*ky`.
  //
  // AUTOTESTE (lição 2.8), com os TRÊS controles vistos mordendo e um positivo:
  //   REGUA_CHAO=espremer   — chave DESLIGADA e a linha do chão mexida à mão (0,60): a asserção
  //                           de inércia reprova nas seis de retrato E nas seis largas. É o
  //                           controle da asserção nova.
  //   REGUA_CHAO=ligar      — chave LIGADA à mão, sem refazer a medida: a régua do retrato volta
  //                           a EXIGIR as entradas, e reprova nas duas telas em que a faixa dá
  //                           ("a faixa dá e a linha do chão NÃO subiu"). É a prova de que a
  //                           régua dos dois lados não morreu junto com o veto — ela está viva
  //                           e só está dormindo.
  //   REGUA_CHAO=ligar-real — chave LIGADA e a medida refeita pelo caminho de verdade: PASSA,
  //                           com as duas telas entrando dentro da régua. É o controle POSITIVO,
  //                           e ele existe para que "reprovou com a chave ligada" não possa ser
  //                           confundido com "a régua reprova qualquer coisa quando ligada".
  // ============================================================
  const RETRATOS = [
    { nome: 'iphone SE',      w: 320, h: 568 },
    { nome: 'android baixo',  w: 360, h: 640 },
    { nome: 'retrato curto',  w: 390, h: 568 },
    { nome: 'iphone 12/13',   w: 390, h: 844 },   // o celular de referência do smoke
    { nome: 'pixel 7/8',      w: 412, h: 915 },
    { nome: 'iphone 15 pmax', w: 430, h: 932 },
  ];
  const RESPIRO = 8;
  console.log('');
  for (const t of RETRATOS) {
    const pg = await nav.newPage();
    await pg.setViewportSize({ width: t.w, height: t.h });
    await pg.goto(ALVO);
    // ERA waitForTimeout(1400) — 1,4 s de aposta sobre um boot cuja duração é da máquina.
    // O fim do boot é observável: `abrirTela("telaMenu")` é a última linha do
    // `DOMContentLoaded` do jogo. Teto de 30 s como detector de travamento; o `.catch` mantém
    // a asserção de baixo como quem reprova, em vez de a espera derrubar o instrumento.
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!document.getElementById('telaMenu')
      && document.getElementById('telaMenu').classList.contains('aberta'),
      null, { timeout: 30000 }).catch(() => {});
    // mesma metade que faltava: as tábuas lidas abaixo (`m.tabuas`, `#poste`, `#menuSub`) também
    // brotam — esperar a mobília parar antes de ler geometria.
    await telaParada(pg, 'telaMenu');
    // ATÉ 02/09 O RETRATO NUNCA RECEBIA REGUA_DEFEITO (item `regua-eixo-x-nao-olhado`, achado 3
    // do QA, confirmado nesta rodada): a chave só era lida no laço das seis telas largas, acima.
    // Metade da suíte nunca tinha sido provada contra defeito nenhum. Mesma injeção, mesmo ponto
    // do ciclo (depois da mobília parar, antes de ler geometria).
    if (process.env.REGUA_DEFEITO) {
      await pg.addStyleTag({ content: process.env.REGUA_DEFEITO });
      await pg.waitForTimeout(50);
    }
    if (process.env.REGUA_CHAO) {
      await pg.evaluate((d) => {
        // o defeito entra DEPOIS do boot. `fitCanvas()` não serve para injetá-lo direto: a
        // primeira coisa que ele faz é chamar `medirChaoDaHome()`, que com a chave desligada
        // devolve `chaoHome = 0` e desfaria o defeito na hora.
        if (d === 'espremer') { chaoHome = 0.60; }
        // `ligar` liga a chave e NÃO refaz a medida: a régua volta ao modo dos dois lados com
        // o chão ainda no 0,68, que é exatamente o estado que ela tem de acusar.
        if (d === 'ligar') { CHAO_HOME_LIGADO = true; }
        // `ligar-real` liga e refaz pelo caminho de verdade — o controle positivo.
        if (d === 'ligar-real') { CHAO_HOME_LIGADO = true; medirChaoDaHome(); }
        GROUND = Math.round(H * (chaoHome || 0.68));
        redesenharFundo();
      }, process.env.REGUA_CHAO);
      await pg.waitForTimeout(200);
    }
    const m = await pg.evaluate(() => {
      const off = (id) => { const e = document.getElementById(id); if (!e) return null;
        let t = 0; for (let p = e; p && p.id !== 'telaMenu'; p = p.offsetParent) t += p.offsetTop;
        return { topo: t, alt: e.offsetHeight }; };
      // A CAIXA DELA, pela conta do `desenharHeroiHD` (alto = 0, que é ela em pé no menu)
      const img = heroBloco('walk')[0];
      const sc = HERO_TARGET / img.naturalHeight;
      const kx = telaW() / W, ky = telaH() / H;
      const dw = img.naturalWidth * sc * kx, dh = img.naturalHeight * sc * ky;
      const ela = { x: HX * kx - dw / 2, y: GROUND * ky - dh, w: dw, h: dh };
      const sub = off('menuSub'), poste = off('poste');
      // as tábuas, uma a uma: a caixa dela não pode encostar em NENHUMA
      const tabuas = [...document.querySelectorAll('#poste .telaBtn')]
        .filter(b => getComputedStyle(b).display !== 'none')
        .map(b => { const r = b.getBoundingClientRect();
          return { id: b.id, t: r.top, b: r.bottom, l: r.left, r: r.right, h: r.height }; });
      const subR = document.getElementById('menuSub').getBoundingClientRect();
      const posteR = document.getElementById('poste').getBoundingClientRect();
      return {
        W, H, GROUND, ESCALA, chaoHome, ela, ligado: CHAO_HOME_LIGADO,
        subBase: sub.topo + sub.alt, posteTopo: poste.topo,
        subCx: { t: subR.top, b: subR.bottom, l: subR.left, r: subR.right },
        posteCx: { t: posteR.top, b: posteR.bottom, l: posteR.left, r: posteR.right },
        tabuas
      };
    });
    await pg.close();

    const cruza = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l))
                          * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
    const elaCx = { l: m.ela.x, r: m.ela.x + m.ela.w, t: m.ela.y, b: m.ela.y + m.ela.h };
    const faixa = m.posteTopo - m.subBase;
    const precisa = m.ela.h + 2 * RESPIRO;
    const cabe = faixa >= precisa;
    const probs = [];

    // o piso de dedo vale em retrato também — o despacho pede que ele fique INTOCADO
    m.tabuas.forEach(b => { if (b.h < 44) probs.push(b.id + ' tem ' + b.h.toFixed(1) + 'px — abaixo dos 44 de dedo'); });

    if (!m.ligado) {
      // ---- INÉRCIA (veto da arte, 22/08). A chave está desligada: a linha do chão não pode ter
      // se mexido em tela NENHUMA de retrato — nem nas duas em que a régua diria que dá. É esta
      // asserção que impede a subida de voltar ligada por acidente num merge, e ela é fixa: o
      // par de prints 390×844 mostra UMA tela, isto cobra as seis.
      if (m.chaoHome) probs.push('a chave está DESLIGADA e chaoHome vale ' + m.chaoHome.toFixed(4));
      if (m.GROUND !== Math.round(m.H * 0.68)) probs.push('a chave está DESLIGADA e GROUND é '
        + m.GROUND + ' em vez de ' + Math.round(m.H * 0.68) + ' (0,68 de H=' + m.H + ')');
    } else if (cabe) {
      // ---- ELA ENTRA. Nada pode encostar nela, e o respiro é 8 dos dois lados.
      const acima = elaCx.t - m.subBase, abaixo = m.posteTopo - elaCx.b;
      if (acima < RESPIRO) probs.push('respiro de cima ' + acima.toFixed(1) + 'px < ' + RESPIRO);
      if (abaixo < RESPIRO) probs.push('respiro de baixo ' + abaixo.toFixed(1) + 'px < ' + RESPIRO);
      const sPoste = cruza(elaCx, m.posteCx), sSub = cruza(elaCx, m.subCx);
      if (sPoste > 0) probs.push('a caixa dela cruza o POSTE em ' + Math.round(sPoste) + 'px²');
      if (sSub > 0) probs.push('a caixa dela cruza a PROPOSTA em ' + Math.round(sSub) + 'px²');
      m.tabuas.forEach(b => { const s = cruza(elaCx, b);
        if (s > 0) probs.push('a caixa dela cruza a tábua ' + b.id + ' em ' + Math.round(s) + 'px²'); });
      if (!m.chaoHome) probs.push('a faixa dá (' + faixa.toFixed(1) + ' >= ' + precisa.toFixed(1)
        + ') e a linha do chão NÃO subiu — ela continua escondida');
    } else {
      // ---- NÃO DÁ: ela NÃO entra, e nada pode ter se mexido para espremê-la.
      if (m.chaoHome) probs.push('a faixa não dá (' + faixa.toFixed(1) + ' < ' + precisa.toFixed(1)
        + ') e mesmo assim a linha do chão subiu para ' + m.chaoHome.toFixed(4) + ' — ausente é melhor que espremida');
      if (m.GROUND !== Math.round(m.H * 0.68)) probs.push('GROUND ' + m.GROUND + ' != 0,68 de H=' + m.H);
      const dentroDoPoste = elaCx.t >= m.posteCx.t - 1 && elaCx.b <= m.posteCx.b + 1
                         && elaCx.l >= m.posteCx.l - 1 && elaCx.r <= m.posteCx.r + 1;
      if (!dentroDoPoste) probs.push('ela não entra na faixa e TAMBÉM não está inteira atrás do poste — está meio à mostra');
    }

    const linha = t.nome.padEnd(16) + ' · ' + t.w + 'x' + t.h
      + ' · faixa ' + faixa.toFixed(1) + 'px (precisa ' + precisa.toFixed(1) + ')'
      + ' · chão ' + (m.chaoHome ? m.chaoHome.toFixed(4) + ' (subiu)' : '0,6800')
      + ' · GROUND ' + m.GROUND + '/' + m.H
      + ' · ela ' + elaCx.l.toFixed(0) + '..' + elaCx.r.toFixed(0) + ' x ' + elaCx.t.toFixed(0) + '..' + elaCx.b.toFixed(0)
      + ' · ' + (!m.ligado
        ? 'chave DESLIGADA (inércia) — a régua diria ' + (cabe ? 'ENTRA' : 'não entra')
        : (cabe ? 'ENTRA' : 'não entra (fica atrás do poste)'));
    if (probs.length) { console.log('  ✗ ' + linha + '  →  ' + probs.join('; ')); falhou = true; }
    else console.log('  ✓ ' + linha);
  }
  await nav.close();

  if (falhou) {
    console.error('\nRÉGUA DE RESPONSIVIDADE: REPROVOU — a home em tela larga voltou a ficar ilegível, esticada ou com o poste preso.');
    process.exit(1);
  }
  console.log('\nRÉGUA DE RESPONSIVIDADE: PASSOU — proposta legível, painel contido e poste alcançável em tablet, notebook e telefone deitado.');
})();

// AUTOTESTE (lição EQUIPE.md 2.8 — instrumento nunca visto reprovando é decoração):
// ESTE BLOCO JÁ FOI ACHADO DECORAÇÃO UMA VEZ — item `regua-autoteste-morto` (02/09). O efeito
// colateral CORRETO de `telaParada()` (PENDENTES 69/70c) é que `#telaMenu` deixou de ter
// overflow de verdade nas seis telas largas: medido nesta rodada, `scrollHeight === clientHeight`
// nas seis, contra o antigo 786×768 (18px de sobra que era só a mobília ainda andando). Sem
// overflow para começo de conversa, `#telaMenu{overflow-y:hidden!important}` sozinho não tem o
// que esconder — testado isoladamente nesta rodada: PASSOU nas seis, exit 0. O exemplo tinha
// virado decoração.
//
//   REGUA_DEFEITO='#poste{margin-top:250px!important} #telaMenu{overflow-y:hidden!important}' \
//     node test/regua-larga.js
//
// O DEFEITO GANHOU COMPANHIA em vez de sair, porque a asserção que ele guarda (o resgate por
// `overflow-y` REAL, não `scrollIntoView`) só é exercitada quando existe overflow de verdade para
// resgatar. `margin-top:250px` no `#poste` é o estande-in para "a marcenaria cresceu" — o mesmo
// tipo de mudança que já quebrou o deitado quando o GLOSSÁRIO virou a quinta tábua (comentário
// de `estilo.css` sobre o `#telaMenu{overflow-y:auto}`, logo acima da regra). Medido nesta
// rodada, testado SEPARADO antes de combinar (para não confundir "cresceu" com "ficou preso"):
//
//   só `margin-top:250px` no poste (overflow-y:auto intacto) — PASSOU nas seis, exit 0. Cria
//   overflow real em 3 das 6 (tablet retrato 1111×1024, landscape 899 665×500, phone deitado 926
//   449×428), mas a régua rola de verdade e alcança, porque a rolagem AINDA FUNCIONA — não é
//   decoração, é resgate legítimo. Nas outras 3 (tablet paisagem, notebook, ultrawide) a grade
//   cinemática absorve a margem na linha do logo (`grid-template-rows: minmax(0,1fr) auto auto`,
//   estilo.css ~1009) e nem chega a criar overflow — o painel é feito para não estourar sozinho.
//
//   só `overflow-y:hidden` (sem crescer o poste) — PASSOU nas seis, exit 0, pela razão do
//   parágrafo acima: nada para esconder.
//
//   OS DOIS JUNTOS — cresce E perde a rolagem — REPROVA em exatamente 3 de 6 (as mesmas três que
//   ganham overflow: tablet retrato, landscape 899, phone deitado 926), exit 1. É a combinação
//   plausível: a marcenaria ganha uma tábua (já aconteceu uma vez) NO MESMO commit em que a
//   rolagem quebra (typo, merge, refactor) — não duas coisas que acontecem juntas por acaso, mas
//   o tipo de regressão em que se fica cego para a segunda por já ter mexido na primeira. A
//   primeira versão desta asserção (com `scrollIntoView`) NÃO mordia nem esta combinação — ver o
//   comentário grande acima. Reprova de verdade com a versão atual (exit 1 com o defeito, exit 0
//   sem — as duas saídas de terminal desta rodada estão no NOTES.md).
//
// E o autoteste da HIERARQUIA (21/08), pela mesma lição:
//   REGUA_DEFEITO='#poste .telaBtn.sec{width:min(78vw,320px)!important;min-height:61px!important}'
// devolve o nível 2 ao tamanho dos portões — que é literalmente o estado de antes desta rodada —
// e a régua sai 1 em todas as seis telas. Verificado nesta rodada, com o número no NOTES.md.
//
// A TERCEIRA RECEITA — TIRAR DO FLUXO (02/09, achado do QA ao auditar regua-parada-e-fila-paralela,
// item regua-terceira-receita). As duas receitas acima precisam de DUAS injeções que se encontram
// (crescer + perder a rolagem). Esta classe morde com UMA injeção só, e a régua já a pegava sem
// que ninguém a tivesse escrito nem verificado o número:
//
//   REGUA_DEFEITO='#poste{position:absolute!important;top:0px!important}'
//
// reprova em exatamente 2 de 6 (landscape 899 e phone deitado 926), exit 1 — medido nesta rodada.
// O QA relatou o mesmo par de telas com top:9999px em vez de top:0px, e o número bateu, mas a causa
// que ele apontou (a posição vertical, "fora da viewport") NÃO é a causa real — verificado
// separando as duas variáveis nesta rodada:
//
//   REGUA_DEFEITO='#poste{top:9999px!important}'                       (SEM position:absolute)
//     — passa nas seis, exit 0.
//   REGUA_DEFEITO='#poste{position:absolute!important;top:0px!important}'  (top plausível, DENTRO
//     da viewport) — reprova as MESMAS duas telas, exit 1.
//
// Ou seja: QUEM MORDE É O position:absolute, não o valor do top.
//
// ⚠ E O PORQUÊ DISSO FOI ESCRITO ERRADO AQUI ANTES, DUAS VEZES SEGUIDAS — o que é a própria
// lição desta receita. A primeira versão dizia que a causa era "fora da viewport". A segunda
// (esta, corrigida) dizia que `top:9999px` passa porque *"top não tem efeito num elemento
// static"* e que as outras quatro telas *"não se deslocam"*. As DUAS frases são falsas, e o QA
// as derrubou com número em 02/09:
//
//   · **`#poste` NÃO é static** — `src/estilo.css:659` declara `#poste{position:relative}`, e
//     `getComputedStyle(#poste).position` responde `relative` nas seis. Então `top` TEM efeito:
//     com `top:9999px` o `#btnConfig` vai de `top 960` para `top 10959` (tablet retrato), os
//     9999 px inteiros, nas SEIS telas.
//   · **Ele passa mesmo assim porque a rolagem resgata.** `#telaMenu{overflow-y:auto}` ganha
//     9999 px de `scrollHeight` (1024 → 11023), e o resgate por rolagem da própria régua
//     alcança o botão. Não é o defeito que some — é o instrumento que o alcança.
//   · **As outras quatro TAMBÉM se deslocam.** `tablet paisagem`, `notebook` e `ultrawide` estão
//     no MESMO grid (`#telaMenu` com `display:grid` e `grid-template-rows`) e saem 384 / 384 /
//     392 px POR BAIXO — passam porque a rolagem vertical as resgata (`scrollTop` 438/438/446).
//     A única que não vaza por eixo nenhum é `tablet retrato`, e é a única cujo `#telaMenu` é
//     `flex` em vez de `grid`.
//
// **O QUE SEPARA 2 DE 6 É O EIXO, NÃO A FAIXA DO LAYOUT.** Nas duas que mordem, o `left` estático
// vira negativo (−141px em 899, −265px em 926) e o `#btnConfig` transborda PELA DIREITA (770..1010
// contra janela de 899; 921..1165 contra 926). A régua rola no Y e resgata o transbordo vertical;
// no X ela não olha. Por isso mordem duas e não seis.
//
// A receita certa para reproduzir esta classe continua sendo "tirar o elemento do fluxo normal"
// (`position:absolute/fixed` sem realocar) — mas o que a régua está medindo aí é **transbordo
// horizontal**, e é isso que a próxima pessoa precisa saber para não repetir o diagnóstico errado
// pela terceira vez. `test/poste-fora-do-fluxo.js` prega os três fatos acima por exit code, para
// esta correção não depender de alguém ler comentário.
//
// ⚠ O ACHADO ACIMA FOI FECHADO — item `regua-eixo-x-nao-olhado` (02/09, dev-jogo). A pergunta
// era: transbordo alcançável só por ROLAGEM LATERAL conta como PRESO? Re-medido nesta rodada,
// com sonda própria (`test/tmp-sonda-eixo-x.js`, descartada — não entra no commit):
//
//   · `#telaMenu` tem `overflow-x:auto` computado nas SEIS telas largas, sempre — mas
//     `scrollWidth - clientWidth` é **0 em produção, nas seis**, sem nenhum defeito injetado.
//     `overflow-x` nunca é DECLARADO em `estilo.css` para `#telaMenu` (só `overflow-y: auto`,
//     linhas 847/1026) — o `auto` do eixo X é o efeito colateral do próprio spec do CSS (a UA
//     força o eixo oposto a `auto` quando só um dos dois é `visible`), não uma decisão de
//     design. Só aparece sobra (141 px em 899×500, 265 px em 926×428) sob o defeito INJETADO
//     `#poste{position:absolute;top:0}` — nunca em produção.
//   · Simulando o arrasto de verdade (`menu.scrollLeft = menu.scrollWidth`, o que um dedo real
//     faria), o botão FICA dentro da janela nas duas telas (medido: `cabeDepois: true`) — a
//     rolagem lateral tecnicamente alcança.
//
// **A DECISÃO: CONTA COMO PRESO — o resgate continua só em Y, e a régua REPROVA.** O motivo não
// é "o dedo não alcançaria" (alcançaria); é que o resgate vertical existente resgata um
// `overflow-y:auto` ESCRITO de propósito (o poste rolar em tela baixa é comportamento
// documentado no CSS, testado e intencional), enquanto o `overflow-x:auto` aqui é um acidente
// de spec que NUNCA tem conteúdo em produção — validar um eixo que ninguém decidiu ter e que só
// existe sob defeito injetado premiaria a sorte do CSS, não uma affordance real da tela. O que
// MUDOU não é o veredito, é a MENSAGEM: antes imprimia só `top`/`bottom`/`janela` mesmo quando a
// falha era horizontal — isso produziu diagnóstico errado duas vezes (EQUIPE.md). Agora a
// mensagem sempre inclui `left`/`right`/`largura` também (ver o bloco `motivo =` acima, no laço
// das seis telas largas) — quem ler a falha de 899×500 vê `left 770, right 1010, largura 899` e
// não confunde mais com "abaixo da dobra".
//
// ⚠ E UM SEGUNDO ACHADO, deste MESMO item de backlog, item 3 do pedido ("REGUA_DEFEITO nunca
// alcança o bloco de RETRATO"): a chave agora É lida no laço das seis telas de retrato também
// (acima, logo depois de `telaParada`). Mas ligar o fio não bastou — medido nesta rodada, EXIT
// CODE REAL de cada receita contra as SEIS telas de retrato, com a régua JÁ ATUALIZADA:
//
//   REGUA_DEFEITO='#poste{margin-top:250px!important} #telaMenu{overflow-y:hidden!important}' \
//     node test/regua-larga.js   →   exit 1 (as 899/926 de sempre reprovam), retrato 6/6 ✓.
//   REGUA_DEFEITO='#poste .telaBtn.sec{width:min(78vw,320px)!important;min-height:61px!important}' \
//     node test/regua-larga.js   →   exit 1 (a hierarquia reprova nas seis TELAS), retrato 6/6 ✓.
//   REGUA_DEFEITO='#poste{position:absolute!important;top:0px!important}' \
//     node test/regua-larga.js   →   exit 1 (899/926 de novo), retrato 6/6 ✓.
//
// **NENHUMA DAS TRÊS RECEITAS MORDE EM RETRATO — 0 de 3 — mesmo com a chave ligada lá.** E não é
// porque a injeção falhou: para a receita "combo", medido À PARTE (sonda descartada) que
// `#btnConfig` FICA inalcançável em retrato sob esse mesmo CSS (top chega a 1030 contra janela
// de até 932). O laço de RETRATO simplesmente **não tem nenhuma asserção de alcançabilidade** —
// ele só confere altura de dedo (`b.h < 44`) e a inércia/sobreposição do diorama da home; nunca
// pergunta se `#btnConfig` está dentro da janela. Para "hierarquia" e "terceira" o motivo é
// outro e estrutural, não de cobertura: "hierarquia" testa a distância entre portais e nível 2
// (`m.portais`/`m.utilidade`), que só existe no laço das TELAS — retrato não tem essa
// diferenciação. "terceira" não morde porque em retrato `#telaMenu` é `position:fixed` (medido:
// `getComputedStyle`), então vira o CONTAINING BLOCK do `#poste` absoluto — `top:0` ancora no
// topo do próprio viewport (que é fixo e cobre a tela inteira), nunca sai da janela; em
// TELAS o `#telaMenu` não é fixed nas larguras que mordem, então `top:0` conta a partir do
// fluxo normal do documento e estoura. **REPORTADO, NÃO CONSERTADO POR CIMA** (pedido
// explícito do plantão): acrescentar um `cfgOk` ao laço de retrato é trabalho novo, não parte
// deste item — proposto como item de backlog separado abaixo neste comentário para a próxima
// rodada decidir se vale (a régua de retrato mede outra coisa, arte/diorama, e pode ser opção
// legítima ela nunca ter testado alcançabilidade de botão, mas isso precisa ser DECISÃO, não
// lacuna).
