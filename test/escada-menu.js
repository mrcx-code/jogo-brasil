// A ESCADA DO MENU — o menu fotografado e MEDIDO numa faixa densa de tamanhos.
//
//   node test/escada-menu.js            fotografa e mede
//   node test/escada-menu.js --so-medir nao grava PNG
//
// Por que existe: o `medir-telas.js` roda dez aparelhos reais, que e o certo para "cabe?".
// Ele nao responde "fica bonito ATRAVESSANDO os tamanhos" — e e nessa travessia que um
// @media mal posto aparece, porque o defeito nao mora num aparelho, mora no DEGRAU entre
// dois. Com dezenove @media no estilo, varios com condicoes que se sobrepoem, o modo de
// falhar mais provavel nao e "quebrou", e "muda de cara sem motivo entre 599 e 601 px".
//
// O que ele mede em cada largura, tudo em pixels de tela:
//   - a caixa do poste e a das tabuas (esquerda, largura, topo, base)
//   - a altura de cada tabua e o vao entre tabuas
//   - a folga entre a ultima tabua e o pe da tela
//   - a rolagem sobrando
//   - o logo
// E depois compara DEGRAU A DEGRAU: mudanca brusca num degrau de 1 px e um @media aparecendo.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const SO_MEDIR = process.argv.includes('--so-medir');
const DIR = __dirname;

// A escada: os tamanhos reais mais os DEGRAUS de cada @media (o valor e o valor+1), que e
// onde a mudanca acontece. Sem os degraus, um salto de cara passa despercebido.
const LARGURAS = [320, 340, 341, 360, 375, 390, 412, 430, 480, 540, 600, 768, 820, 900, 901, 1024];
const ALTURAS = [568, 600, 601, 640, 641, 720, 721, 812, 844, 915, 932];

// O MENU TEM DOIS TAMANHOS, E O QUE IMPORTA É O MAIOR. Quem acaba de chegar vê CINCO tábuas;
// quem já jogou vê SETE — o DE ONDE VEM aparece com `R.chegou` e O LUGAR com `lugarExiste()`.
// A primeira versão desta ferramenta media o menu de estreia e dava tudo verde enquanto o
// `encaixe.js`, que roda com a partida destravada, achava 19 px de rolagem em 390×844. Medir o
// caso fácil é pior que não medir: dá licença por escrito para o caso difícil quebrar.
const REVELAR = `
  window.revelarTudo = function () {
    document.querySelectorAll('#poste .telaBtn').forEach(function (b) { b.classList.remove('oculto'); });
  };`;

async function medir(pg) {
  return pg.evaluate(() => {
    const cx = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const poste = document.getElementById('poste') || document.querySelector('#telaMenu .poste');
    const tela = document.getElementById('telaMenu');
    const botoes = [...document.querySelectorAll('#telaMenu button')].filter(b => b.offsetParent !== null);
    const caixas = botoes.map(b => ({ rot: (b.textContent || '').trim().slice(0, 14), ...cx(b) }));
    const vaos = [];
    for (let i = 1; i < caixas.length; i++) vaos.push(caixas[i].y - (caixas[i - 1].y + caixas[i - 1].h));
    const logo = document.querySelector('#telaMenu img, #telaMenu canvas');
    const ultima = caixas[caixas.length - 1];
    return {
      vp: { w: innerWidth, h: innerHeight },
      poste: cx(poste),
      logo: cx(logo),
      n: caixas.length,
      caixas,
      alturas: caixas.map(c => c.h),
      vaos,
      menorAlvo: caixas.length ? Math.min(...caixas.map(c => c.h)) : 0,
      peDaUltima: ultima ? innerHeight - (ultima.y + ultima.h) : null,
      rolagem: tela ? Math.max(0, tela.scrollHeight - tela.clientHeight) : 0,
      forade: caixas.filter(c => c.y < 0 || c.y + c.h > innerHeight || c.x < 0 || c.x + c.w > innerWidth).map(c => c.rot),
      // ===== AS DUAS MEDIDAS DO ANÚNCIO (23/08) =====
      // Onde o menu rola por projeto, "rolou quanto" não é a pergunta certa — a pergunta é se
      // a pessoa VÊ que há mais abaixo. Uma tábua cortada ao meio das letras conta que a tela
      // continua; uma cortada por 1 px lê como tábua inteira e a tela parece terminar ali,
      // que é o pior dos dois mundos. Medido pela direção de arte em 23/08.
      // `anuncio` = quantos dos 44 px da última tábua VISÍVEL aparecem. `escondidas` = quantas
      // ficam inteiramente abaixo da dobra, que é o custo que a rolagem cobra de quem não rolar.
      anuncio: (() => {
        const corta = caixas.filter(c => c.y < innerHeight && c.y + c.h > innerHeight);
        if (corta.length) return Math.round(innerHeight - corta[corta.length - 1].y);
        const dentro = caixas.filter(c => c.y + c.h <= innerHeight);
        return dentro.length === caixas.length ? null : 0;   // null = coube tudo, 0 = nada aparece
      })(),
      escondidas: caixas.filter(c => c.y >= innerHeight).length
    };
  });
}

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const erros = [];
  const alvo = ABRIR('file:///' + path.resolve(DIR, '..', 'index.html').split(path.sep).join('/'));
  const linhas = [];

  // ---- passada 1: largura variando, altura fixa em 844 (retrato tipico)
  console.log('=== LARGURA VARIANDO (altura 844) ===');
  for (const w of LARGURAS) {
    const pg = await nav.newPage({ viewport: { width: w, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    pg.on('pageerror', e => erros.push(w + 'x844: ' + e.message));
    await pg.goto(alvo);
    await pg.addScriptTag({ content: REVELAR });
    await pg.waitForTimeout(900);
    await pg.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof abrirTela === 'function') abrirTela('telaMenu'); revelarTudo(); });
    await pg.waitForTimeout(350);
    const m = await medir(pg);
    linhas.push({ chave: w + 'x844', eixo: 'w', v: w, m });
    if (!SO_MEDIR) await pg.screenshot({ path: path.join(DIR, 'ESC-w' + w + '.png') });
    await pg.close();
  }

  // ---- passada 2: altura variando, largura fixa em 390
  console.log('\n=== ALTURA VARIANDO (largura 390) ===');
  for (const h of ALTURAS) {
    const pg = await nav.newPage({ viewport: { width: 390, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    pg.on('pageerror', e => erros.push('390x' + h + ': ' + e.message));
    await pg.goto(alvo);
    await pg.addScriptTag({ content: REVELAR });
    await pg.waitForTimeout(900);
    await pg.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof abrirTela === 'function') abrirTela('telaMenu'); revelarTudo(); });
    await pg.waitForTimeout(350);
    const m = await medir(pg);
    linhas.push({ chave: '390x' + h, eixo: 'h', v: h, m });
    if (!SO_MEDIR) await pg.screenshot({ path: path.join(DIR, 'ESC-h' + h + '.png') });
    await pg.close();
  }

  // ---- passada 3: DEITADO, do telefone ao tablet. Aqui a régua é a largura, e o modo de
  // falhar é outro: não é "não cabe", é sobrar tela. Um tablet deitado tem 768 px de altura
  // e o desenho do deitado foi feito para um telefone de 390 — se as tábuas continuarem no
  // mínimo de dedo com o respiro mínimo, o poste fica com um palmo de coluna vazia em volta.
  console.log('\n=== DEITADO ===');
  for (const [w, h] of [[568, 320], [640, 360], [812, 375], [844, 390], [932, 430], [1024, 768], [1280, 800]]) {
    const pg = await nav.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    pg.on('pageerror', e => erros.push(w + 'x' + h + ': ' + e.message));
    await pg.goto(alvo);
    await pg.addScriptTag({ content: REVELAR });
    await pg.waitForTimeout(900);
    // NÃO EXISTE "ESTREIA COM MENOS TÁBUAS", e isto foi medido em 23/08 — fica escrito porque
    // a hipótese é convincente e volta sozinha. O molde nasce com `oculto` em `btnLugar` e
    // `btnFim`, então parece que quem abre o jogo pela primeira vez vê SEIS tábuas e não oito.
    // Não vê: por decisão do dono em 15/08 as duas ficam SEMPRE no poste, com CADEADO
    // (`classList.remove("oculto")` incondicional + `travada` + `disabled`, src/jogo.ts), porque
    // *porta escondida não ensina que existe*. O `oculto` do molde só vale até o JS rodar.
    // Consequência para este portão: a primeira visita e a centésima medem a MESMA geometria,
    // e uma rolagem aqui nunca é "consequência de ter jogado". Medido: 640×360 rola 55 px na
    // estreia também; 568×320 rola 95.
    await pg.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof abrirTela === 'function') abrirTela('telaMenu'); revelarTudo(); });
    await pg.waitForTimeout(350);
    const m = await medir(pg);
    linhas.push({ chave: w + 'x' + h, eixo: 'd', v: h, m });
    if (!SO_MEDIR) await pg.screenshot({ path: path.join(DIR, 'ESC-d' + w + 'x' + h + '.png') });
    await pg.close();
  }

  const mostra = (l) => {
    const m = l.m;
    console.log('  ' + l.chave.padEnd(10) +
      ' tábuas ' + String(m.n).padStart(2) +
      ' | alvo menor ' + String(m.menorAlvo).padStart(3) + 'px' +
      ' | vão ' + (m.vaos.length ? Math.min(...m.vaos) + '–' + Math.max(...m.vaos) : '—').padEnd(8) +
      ' | pé ' + String(m.peDaUltima).padStart(4) +
      ' | rolagem ' + String(m.rolagem).padStart(4) +
      ' | poste ' + (m.poste ? m.poste.w + 'x' + m.poste.h : '—') +
      (m.forade.length ? '  ⚠ FORA: ' + m.forade.join(',') : ''));
  };
  linhas.filter(l => l.eixo === 'w').forEach(mostra);
  console.log('');
  linhas.filter(l => l.eixo === 'h').forEach(mostra);
  console.log('');
  linhas.filter(l => l.eixo === 'd').forEach(l => {
    mostra(l);
    // a sobra: quanto da coluna do poste fica vazia acima e abaixo das tábuas
    const m = l.m;
    if (m.poste && m.caixas.length) {
      const alto = m.caixas[0].y - m.poste.y;
      const baixo = (m.poste.y + m.poste.h) - (m.caixas[m.caixas.length - 1].y + m.caixas[m.caixas.length - 1].h);
      console.log('              sobra da coluna: ' + alto + 'px acima + ' + baixo + 'px abaixo das tábuas');
    }
  });

  // ---- o degrau: mudanca brusca entre dois tamanhos vizinhos
  console.log('\n=== DEGRAUS (mudança entre vizinhos) ===');
  let bruscos = 0;
  for (const eixo of ['w', 'h']) {
    const seq = linhas.filter(l => l.eixo === eixo);
    for (let i = 1; i < seq.length; i++) {
      const a = seq[i - 1].m, b = seq[i].m;
      const passo = seq[i].v - seq[i - 1].v;
      const dAlvo = Math.abs(b.menorAlvo - a.menorAlvo);
      const dPe = (a.peDaUltima != null && b.peDaUltima != null) ? Math.abs(b.peDaUltima - a.peDaUltima) : 0;
      const dN = Math.abs(b.n - a.n);
      // um degrau de 1 px que muda mais de 8 px de altura de alvo, ou 40 px de pé, é @media
      const brusco = (passo <= 1 && (dAlvo > 8 || dPe > 40 || dN > 0)) || dN > 0;
      if (brusco) {
        bruscos++;
        console.log('  ⚠ ' + seq[i - 1].chave + ' → ' + seq[i].chave + ' (passo ' + passo + 'px): ' +
          'alvo ' + a.menorAlvo + '→' + b.menorAlvo + ', pé ' + a.peDaUltima + '→' + b.peDaUltima + ', tábuas ' + a.n + '→' + b.n);
      }
    }
  }
  if (!bruscos) console.log('  (nenhum salto brusco entre vizinhos)');

  console.log('\n=== O QUE REPROVA ===');
  // A ÚNICA EXCEÇÃO, e ela é aritmética e não desenho: com as SETE tábuas de quem já jogou,
  // 7 × 44 px de dedo = 308 px, e um telefone deitado de 320 px de altura não tem os 12 px
  // restantes para respiro nenhum. Nenhuma escada resolve isso — o que teria de ceder é o
  // piso de 44 px, e ele não cede. Aqui o menu usa a saída que ele já declara desde 12/08:
  // ROLA. É o único conserto que não tem número para estourar quando a oitava tábua chegar.
  // Fica nomeado para não virar "verde por acidente" nem "vermelho eterno que ninguém lê".
  // ===== A EXCEÇÃO DEIXOU DE SER UM `continue` (23/08, pedido da direção de arte) =====
  //
  // Ela era uma linha de texto e um `continue`: a tela saía da medição inteira. O buraco disso
  // é o mesmo que o comentário acima diz querer evitar — `568×320` podia degradar para 300 px
  // de rolagem e o portão seguiria VERDE, porque ninguém mais olhava. Tolerância sem número é
  // o "verde por acidente" com outro nome.
  //
  // Agora tábua tolerada não pula a medição: ela TROCA DE RÉGUA. Três números, e os três saem
  // de medida feita em 23/08, não de gosto:
  //
  //   1. A ROLAGEM NÃO PODE CRESCER. O valor de hoje fica CRAVADO por tela; qualquer aumento
  //      é vermelho. É a catraca que faltava — sem ela a exceção só dizia "esta tela pode
  //      rolar", sem dizer quanto, e quanto era o que importava.
  //   2. O CORTE TEM DE SE ANUNCIAR. A última tábua visível precisa mostrar entre 12 e 38 dos
  //      seus 44 px. Abaixo de 12 ela some e a tela parece terminar; ACIMA DE 38 é pior ainda,
  //      porque uma tábua cortada por 1 px lê como tábua INTEIRA — a pessoa não tem como saber
  //      que há mais. A régua tem teto e piso de propósito.
  //   3. NO MÁXIMO UMA TÁBUA INTEIRAMENTE ABAIXO da dobra. É o custo que a rolagem cobra de
  //      quem não rolar, e uma é o limite.
  //
  // E O NÚMERO DA PRÓXIMA TÁBUA JÁ ESTÁ ESCRITO, para o gatilho disparar sozinho em vez de
  // depender de alguém lembrar: a NONA tábua aprovada empurra `640×360` de 55 para ~104 px de
  // rolagem e leva DUAS tábuas para baixo da dobra, quebrando a régua 3. É quando as duas
  // pistas voltam à mesa.
  const EXCECAO = {
    // Oito tábuas de 44 px não cabem em 320 px de altura, e o que teria de ceder é o piso de
    // 44 px de dedo, que não cede. (A versão anterior deste comentário dizia SETE — ficou
    // desatualizada quando o dono aprovou a oitava tábua, o DE ONDE VEM, em 21/08. A aritmética
    // que sustenta a exceção estava errada desde então; achado da direção de arte em 23/08.)
    '568x320': {
      razao: 'oito tábuas de 44 px não cabem em 320 px de altura — o menu rola, por projeto',
      // DÍVIDA NOMEADA, e ela é a razão de este número estar CONGELADO em vez de julgado pela
      // régua: 43 de 44 px reprovaria por excesso (teto de 38), porque cortar por 1 px é a
      // pior forma de cortar. Não afrouxo o teto para caber — congelo o valor de hoje, de modo
      // que qualquer mexida aqui reabre a decisão em vez de passar batida. O conserto continua
      // sem caminho conhecido (duas pistas medem 548 px e não cabem em 568 de largura) e vive
      // no PENDENTES 49.
      rolagem: 95, anuncio: 43, escondidas: 2, dividaAnuncio: true,
    },
    // 640×360 é o retrato 360 dp DEITADO — a linha de base do Android e o telefone de entrada
    // mais comum do país. Entra por MEDIDA, não por cansaço: oito tábuas não cabem em 360 px,
    // as duas pistas exigem 700 de largura, e forçá-las em 640 faria o menu cobrir a moldura
    // inteira — a mata e a personagem sumiriam atrás da mobília, e o menu deixaria de ser um
    // poste fincado num lugar para virar painel sobre papel de parede. Trocar a pintura por
    // 55 px é caro demais (veto da direção de arte, 23/08).
    '640x360': {
      razao: 'oito tábuas de 44 px não cabem em 360 px — rola, mas o corte se anuncia e só uma some',
      rolagem: 55, anuncio: 34, escondidas: 1,
    },
  };
  let ruim = 0;
  for (const l of linhas) {
    const exc = EXCECAO[l.chave];
    if (exc) {
      const v = l.m, p = [];
      if (v.rolagem > exc.rolagem) {
        p.push('a rolagem CRESCEU: ' + v.rolagem + 'px, contra os ' + exc.rolagem + ' cravados em 23/08');
      }
      if (v.escondidas > exc.escondidas) {
        p.push(v.escondidas + ' tábuas inteiras abaixo da dobra (tolerado ' + exc.escondidas + ')');
      }
      if (v.anuncio != null) {
        if (exc.dividaAnuncio) {
          if (Math.abs(v.anuncio - exc.anuncio) > 1) {
            p.push('o anúncio do corte mudou: ' + v.anuncio + 'px da última tábua, contra os ' + exc.anuncio + ' congelados — reabra a decisão');
          }
        } else if (v.anuncio < 12 || v.anuncio > 38) {
          p.push('o corte não se anuncia: ' + v.anuncio + 'px dos 44 da última tábua (a janela é 12–38; acima de 38 ela lê como tábua inteira)');
        }
      }
      if (p.length) { ruim++; console.log('  ✗ ' + l.chave.padEnd(10) + p.join(' · ')); }
      else console.log('  ~ ' + l.chave.padEnd(10) + exc.razao +
        '  [rola ' + v.rolagem + '/' + exc.rolagem + ' · anúncio ' + v.anuncio + '/44 · ' + v.escondidas + ' escondida(s)]');
      continue;
    }
    const m = l.m;
    const p = [];
    if (m.forade.length) p.push('tábua fora da tela: ' + m.forade.join(','));
    if (m.menorAlvo && m.menorAlvo < 44) p.push('alvo de toque ' + m.menorAlvo + 'px < 44');
    if (m.rolagem > 0) p.push('rolagem ' + m.rolagem + 'px');
    if (m.peDaUltima != null && m.peDaUltima < 0) p.push('última tábua ' + (-m.peDaUltima) + 'px abaixo da borda');
    if (p.length) { ruim++; console.log('  ✗ ' + l.chave.padEnd(10) + p.join(' · ')); }
  }
  if (!ruim) console.log('  ✓ nenhum tamanho reprova');

  console.log('\nerros de console: ' + (erros.length ? erros.join(' | ') : '(nenhum)'));
  await nav.close();
  process.exit(erros.length || ruim ? 1 : 0);
})();
