// A CHEGADA TEM QUATRO ESTADOS, E O PORTÃO MEDE UM — este mede os quatro.
//
//   node test/chegada-estados.js
//   CHEGADA_SO=640x360 node test/chegada-estados.js        (uma tela só, para autoteste)
//
// POR QUE ELE EXISTE (QA, 23/08, auditoria da troca da régua 8b do `test/medir-telas.js`).
// Aquele portão abre a CHEGADA assim: save novo, PRIMEIRA chegada, conferências FECHADAS.
// A tela que a pessoa vê quase nunca é essa. Dois eixos a mudam, e nenhum dos dois é raro:
//
//   1. AS CONFERÊNCIAS SE ABREM AO TOQUE. `.cfRev` nasce `oculto` e sai do oculto em
//      QUALQUER toque numa opção (`montarConfere`, src/jogo.ts) — é a única coisa que há
//      para fazer nesta tela. Medido em 23/08: a rolagem sobe de +151 px (768×1024) a
//      +335 px (640×360).
//   2. QUEM VOLTA VÊ OUTRA TELA. `R.chegou > 1` troca o título por "DE NOVO ATÉ AQUI"
//      (canvas mais largo) e `R.dias` GIRA o trio de conferências — outras três perguntas,
//      outros comprimentos. Medido: +28 a +72 px só por isso, sem tocar em nada.
//
// A LIÇÃO 2.1 DO EQUIPE.md EM OUTRA ROUPA: lá o instrumento media a tela VAZIA porque não
// chamava `montar*`; aqui ele chama, mas mede o estado ANTES do único gesto que a tela pede.
// Tela que ninguém tocou cabe melhor que tela tocada, do mesmo jeito que tela vazia cabe em
// qualquer altura.
//
// O QUE ESTE ARQUIVO COBRA (exit 1):
//   · SAI PELOS LADOS — o rolo é vertical; o que sai de lado nenhum dedo traz de volta.
//   · ALVO DE TOQUE PRESO — `button` ou `<a>` que, rolando o mínimo, não cabe inteiro na
//     janela, ou que o `elementFromPoint` no centro não devolve. Botão é o caso em que
//     "não cabe" e "não dá para usar" são a mesma coisa.
//   · A TELA TEM O QUE ROLAR E NÃO ROLA — conteúdo que existe no DOM e não para o dedo.
//   · ARRASTA DE LADO — `scrollWidth > clientWidth` na tela inteira.
//
// O QUE ELE SÓ INFORMA, com número, e POR QUÊ:
//   · CAIXA MAIS ALTA QUE A JANELA. O bloco 8b do portão cobra que TODO alvo da lista caiba
//     inteiro na janela, e a lista mistura alvo de toque (`.cfOp`, `.telaBtn`, o link da
//     plataforma) com CAIXA DE TEXTO (`.cfItem`, `.fimLin`, `.telaTit`). Para um botão a
//     regra está certa; para um cartão de texto ela é categoria errada — texto comprido é
//     legitimamente mais alto que a tela e se lê rolando. MEDIDO EM 23/08: a 640×360, quem
//     VOLTA e TOCA uma conferência tem um `.cfItem` de 377 px numa janela de 360 — ou seja,
//     pela régua do próprio 8b a CHEGADA REPROVA num estado que ele não visita. Fica aqui
//     como informação porque decidir se isso é defeito da TELA ou da RÉGUA é de quem edita.
//   · A DISTÂNCIA ATÉ A TABELA `ROLO_MEDIDO`. A tabela guarda o mais CURTO dos quatro
//     estados; nos outros três a CHEGADA já nasce acima do teto. Não reprova aqui: escolher
//     qual estado a tabela guarda é decisão de quem edita. Mas sai com número, para ninguém
//     dizer "a CHEGADA rola 442 px" sobre uma tela que rola 610.
//
// AUTOTESTE (lição EQUIPE.md 2.8 — régua que ninguém viu reprovando é régua desligada).
// As três foram vistas reprovando por exit code em 23/08:
//   CHEGADA_SO=390x844 CHEGADA_DEFEITO='#telaFim{overflow-y:hidden!important}' node test/chegada-estados.js
//   CHEGADA_SO=390x844 CHEGADA_DEFEITO='#btnFimVoltar{position:relative;left:300px}' node test/chegada-estados.js
//   CHEGADA_SO=390x844 CHEGADA_DEFEITO='#fimPergunta{position:fixed;inset:0;z-index:99}' node test/chegada-estados.js
// REPARE QUE A VARIÁVEL VAI ANTES DO `node`. Depois do nome do comando o shell a trata como
// ARGUMENTO e ela não chega ao processo — a receita fica verde provando nada. Foi exatamente
// o que aconteceu com a quarta receita do rodapé de `test/medir-telas.js`, conferido nesta
// auditoria: copiada como está escrita, ela sai 0.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));

const TELAS = [
  [360, 640], [390, 844], [412, 915], [430, 932], [320, 568],
  [768, 1024], [844, 390], [932, 430], [640, 360], [1024, 768],
];

// A tabela do portão, copiada para COMPARAR — nunca para cobrar. Se ela mudar lá e não aqui,
// a coluna "tabela" fica desatualizada e o número impresso denuncia isso sozinho.
const ROLO_MEDIDO = {
  '360x640': 432, '390x844': 442, '412x915': 371, '430x932': 332, '320x568': 499,
  '768x1024': 213, '844x390': 355, '932x430': 235, '640x360': 528, '1024x768': 21,
};
const teto = m => Math.max(Math.ceil(m * 1.12), m + 24);

const ESTADOS = [
  { id: '1ª · fechada', volta: false, revela: false },   // o único que o portão visita
  { id: '1ª · tocada ', volta: false, revela: true },
  { id: 'volta · fech', volta: true,  revela: false },
  { id: 'volta · toca', volta: true,  revela: true },
];

// Roda DENTRO da página. É a mesma varredura do bloco 8b de `test/medir-telas.js`, de
// propósito: se as duas divergirem, a divergência é o achado.
const MEDIR = function (cfg) {
  const W = innerWidth, H = innerHeight;
  const vis = function (e) {
    const s = getComputedStyle(e);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    const b = e.getBoundingClientRect();
    return b.width > 0 && b.height > 0;
  };
  const nome = function (e) {
    return e.id ? '#' + e.id : '.' + String(e.className || '').split(' ')[0];
  };
  // O QUE É ALVO DE TOQUE e o que é caixa de texto. É esta linha que separa o que reprova do
  // que informa, e ela é a única diferença de julgamento entre este arquivo e o bloco 8b.
  const eAlvo = function (e) {
    return e.tagName === 'BUTTON' || e.tagName === 'A' || e.tagName === 'INPUT';
  };

  fecharTelas();
  // O estado de quem VOLTA. Os dois campos são os que o jogo já usa: `R.chegou` troca o
  // título e `R.dias` gira o trio (src/jogo.ts, `montarConfere` e `pintarFimTit`).
  if (cfg.volta) { R.chegou = 2; R.dias = 2; }
  montarFim();
  montarPergunta();
  document.getElementById('fimPergunta').classList.remove('oculto');
  document.getElementById('fimPerguntaBotoes').classList.remove('oculto');
  abrirTela('telaFim');

  // O ÚNICO GESTO QUE A TELA PEDE. `pointerdown` e não `click`: é o evento que o jogo escuta.
  if (cfg.revela) {
    document.querySelectorAll('#fimConfere .cfItem').forEach(function (it) {
      const b = it.querySelector('.cfOp');
      if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
  }

  const t = document.getElementById('telaFim');
  const cs = getComputedStyle(t);
  const rolavel = (cs.overflowY === 'auto' || cs.overflowY === 'scroll')
    && t.scrollHeight - t.clientHeight > 1;
  const rola = Math.round(t.scrollHeight - t.clientHeight);
  const arrastoX = Math.round(t.scrollWidth - t.clientWidth);
  const cabe = function (r) {
    return r.top >= -2 && r.bottom <= H + 2 && r.left >= -2 && r.right <= W + 2;
  };
  const lados = [], presos = [], cobertos = [], altos = [];
  const antes = t.scrollTop;
  t.querySelectorAll('.telaBtn, .telaTit, .fimLin, #fimPerguntaTxt, .cfItem, .cfOp, #fimPlataforma a')
    .forEach(function (e) {
      if (!vis(e)) return;
      let b = e.getBoundingClientRect();
      if (b.right > W + 2 || b.left < -2) {
        lados.push(nome(e) + ' →' + Math.round(b.right - W));
        return;
      }
      // A caixa mais alta que a janela nunca vai caber — separar isso de "está longe" é o
      // que impede o instrumento de acusar texto comprido como se fosse botão inalcançável.
      if (b.height > H + 2) {
        altos.push(nome(e) + ' h=' + Math.round(b.height) + ' > janela ' + H +
          (eAlvo(e) ? ' (É ALVO DE TOQUE)' : ' (caixa de texto)'));
        if (!eAlvo(e)) return;
      }
      if (!cabe(b) && rolavel) {
        const d = b.bottom > H ? b.bottom - H : b.top;
        t.scrollTop = Math.max(0, Math.min(t.scrollHeight, t.scrollTop + d));
        b = e.getBoundingClientRect();
      }
      if (!cabe(b)) {
        presos.push(nome(e) + ' ' + Math.round(b.top) + '..' + Math.round(b.bottom) +
          (rolavel ? ' (nem rolando)' : ' (e a tela NÃO ROLA)') +
          (eAlvo(e) ? '' : ' [caixa de texto]'));
        return;
      }
      const cx = Math.round((b.left + b.right) / 2);
      const cy = Math.round((Math.max(b.top, 0) + Math.min(b.bottom, H)) / 2);
      const sob = document.elementFromPoint(cx, cy);
      if (!(sob && (sob === e || e.contains(sob) || sob.contains(e)))) {
        cobertos.push(nome(e) + ' coberto por ' +
          (sob ? (sob.tagName + (sob.id ? '#' + sob.id : '')) : '(nada)') +
          (eAlvo(e) ? '' : ' [caixa de texto]'));
      }
    });
  t.scrollTop = antes;
  return { rola: rola, rolavel: rolavel, arrastoX: arrastoX,
           lados: lados.slice(0, 4), presos: presos.slice(0, 4),
           cobertos: cobertos.slice(0, 4), altos: altos.slice(0, 4) };
};

(async () => {
  const so = process.env.CHEGADA_SO ? process.env.CHEGADA_SO.split(',') : null;
  const nav = await chromium.launch();
  const problemas = [];     // reprova
  const informe = [];       // caixa mais alta que a janela
  const acima = [];         // acima do teto da tabela do portão
  let medidos = 0;
  for (const [w, h] of TELAS) {
    const chave = w + 'x' + h;
    if (so && so.indexOf(chave) < 0) continue;
    const tab = ROLO_MEDIDO[chave];
    console.log('\n' + chave + (tab === undefined ? '  (fora da tabela do portão)'
      : '   tabela ' + tab + ', teto ' + teto(tab)));
    for (const est of ESTADOS) {
      const pg = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      const erros = [];
      pg.on('pageerror', e => erros.push(e.message));
      await pg.goto(ALVO);
      if (process.env.CHEGADA_DEFEITO) {
        await pg.addStyleTag({ content: process.env.CHEGADA_DEFEITO });
      }
      await pg.waitForTimeout(1300);
      const r = await pg.evaluate(MEDIR, { volta: est.volta, revela: est.revela });
      await pg.close();
      medidos++;

      const mal = [].concat(r.lados.map(x => 'SAI PELOS LADOS: ' + x),
                            r.presos.map(x => 'PRESO: ' + x),
                            r.cobertos.map(x => 'COBERTO: ' + x));
      if (erros.length) mal.push('erro de console: ' + erros[0]);
      if (r.rola > 1 && !r.rolavel) mal.push('tem ' + r.rola + 'px abaixo da dobra e NÃO ROLA');
      if (r.arrastoX > 1) mal.push('ARRASTA DE LADO ' + r.arrastoX + 'px');
      mal.forEach(m => problemas.push(chave + ' · ' + est.id.trim() + ' · ' + m));
      r.altos.forEach(a => informe.push(chave + ' · ' + est.id.trim() + ' · ' + a));

      const estoura = tab !== undefined && r.rola > teto(tab);
      if (estoura) acima.push(chave + ' · ' + est.id.trim() + ' rola ' + r.rola +
        ' (teto ' + teto(tab) + ', +' + (r.rola - tab) + ' sobre a tabela)');
      console.log('  ' + (mal.length ? '✗' : (r.altos.length ? '!' : '✓')) + ' ' + est.id +
        '  rola ' + String(r.rola).padStart(4) + 'px' +
        (estoura ? '  ACIMA DO TETO' : '') +
        (r.altos.length ? '\n      ! ' + r.altos.join('\n      ! ') : '') +
        (mal.length ? '\n      ✗ ' + mal.join('\n      ✗ ') : ''));
    }
  }
  await nav.close();

  console.log('\n===== O QUE A TABELA ROLO_MEDIDO NÃO COBRE =====');
  if (!acima.length) {
    console.log('nenhum estado passa do teto — a tabela cobre a tela que a pessoa vê.');
  } else {
    console.log(acima.length + ' de ' + medidos + ' estados rolam ACIMA do teto da tabela.');
    console.log('A tabela guarda o estado mais CURTO dos quatro; nos outros a CHEGADA já está');
    console.log('além do orçamento sem ninguém ter mudado uma linha:');
    acima.forEach(l => console.log('  · ' + l));
  }

  if (informe.length) {
    console.log('\n===== CAIXA MAIS ALTA QUE A JANELA (informe, não reprova) =====');
    console.log('pela régua do bloco 8b isto é "alvo PRESO"; aqui é informação, porque caixa');
    console.log('de texto comprida se lê rolando. Se algum dia aparecer "(É ALVO DE TOQUE)"');
    console.log('nesta lista, aí é defeito e a linha acima reprova sozinha.');
    informe.forEach(l => console.log('  ! ' + l));
  }

  console.log('\n' + (problemas.length ? problemas.length + ' PROBLEMA(S) DE ALCANCE'
    : 'alcance verde nos ' + medidos + ' estados medidos'));
  problemas.forEach(l => console.log('  ✗ ' + l));
  process.exit(problemas.length ? 1 : 0);
})();
