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
  const nav = await chromium.launch();
  let falhou = false;
  for (const t of TELAS) {
    const pg = await nav.newPage();
    await pg.setViewportSize({ width: t.w, height: t.h });
    await pg.goto(ALVO);
    await pg.waitForTimeout(1400);
    if (process.env.REGUA_DEFEITO) {
      await pg.addStyleTag({ content: process.env.REGUA_DEFEITO });
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
          if (!alcancavel) motivo = 'fora da janela mesmo depois de rolar o(s) ancestral(is) rolável(eis) (top ' + Math.round(b.top) + ', bottom ' + Math.round(b.bottom) + ', janela ' + J + ')';
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

      return {
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
      + ' · configurações ' + (m.cfgOk ? 'alcançável' : 'PRESO');
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
//   REGUA_DEFEITO='#telaMenu{overflow-y:hidden!important}' node test/regua-larga.js
// prende CONFIGURAÇÕES em 926×428 (e em toda tela cujo poste dependa da rolagem) e reprova por
// exit code. A primeira versão desta asserção (com `scrollIntoView`) NÃO mordia esse defeito —
// ver o comentário grande acima. Reprova de verdade com a versão atual, verificado nesta rodada.
//
// E o autoteste da HIERARQUIA (21/08), pela mesma lição:
//   REGUA_DEFEITO='#poste .telaBtn.sec{width:min(78vw,320px)!important;min-height:61px!important}'
// devolve o nível 2 ao tamanho dos portões — que é literalmente o estado de antes desta rodada —
// e a régua sai 1 em todas as seis telas. Verificado nesta rodada, com o número no NOTES.md.
