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
//   (c) A PÁGINA ESTÁ VESTIDA. As quatro páginas de papel carregam Bitter/Source Sans/IBM Plex
//       do Google. Gerado sem rede, o print sai em Georgia e system-ui — legível, e com outra
//       identidade visual que ninguém veria antes de publicar. Aqui isso RECUSA, com a
//       mensagem dizendo o que fazer.
//   (d) PESO. Acima de ~300 KB o robô da prévia desiste de buscar; abaixo de 20 KB o JPEG é
//       uma chapa lisa (foi assim que o território pegou o print tirado cedo demais).
//
// E o print sai a `deviceScaleFactor: 1` de propósito: a 2 ele sairia 2400×1260 e desmentiria
// as tags `og:image:width`/`height` que o próprio gerador escreve.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// O tamanho que WhatsApp, Twitter e Facebook usam. Escrito aqui e lido pelas tags, para não
// haver duas versões do mesmo número.
const LARGURA = 1200;
const ALTURA = 630;

// A qualidade do JPEG. 85 é a do território (68 KB medidos ali). Página de papel é texto sobre
// cor chapada: comprime melhor que a placa 3D.
const QUALIDADE = 85;

// A faixa de peso. Meta de projeto: <= 90 KB (o do território tem 68). A faixa abaixo é o
// PORTÃO — mais larga que a meta de propósito, porque um cartão 12 KB acima da meta ainda
// funciona e derrubar a geração por isso seria trocar um defeito real por um imaginário. O
// número medido de cada seção sai no console e vai para o relatório.
const KB_MIN = 20;
const KB_MAX = 300;

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

  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: LARGURA, height: ALTURA }, deviceScaleFactor: 1 });
  const erros = [];
  pg.on('pageerror', (e) => erros.push('pageerror: ' + e));
  pg.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });

  try {
    await pg.goto(url);
    // As fontes do Google chegam por rede. `document.fonts.ready` resolve quando o navegador
    // terminou de decidir sobre TODAS elas — inclusive decidindo que não vêm.
    await pg.evaluate(() => document.fonts.ready);
    // e um respiro para o primeiro layout com as fontes já trocadas
    await pg.waitForTimeout(250);

    // ---- (b) fora do print: o interruptor da medição e tudo o que flutua ----
    const escondidos = await pg.evaluate(() => {
      let n = 0;
      document.querySelectorAll('.med').forEach((e) => { e.style.display = 'none'; n++; });
      document.querySelectorAll('body *').forEach((e) => {
        const p = getComputedStyle(e).position;
        if (p === 'fixed' || p === 'sticky') { e.style.display = 'none'; n++; }
      });
      window.scrollTo(0, 0);
      return n;
    });

    const cena = await pg.evaluate(() => {
      const h1 = document.querySelector('h1');
      const r = h1 ? h1.getBoundingClientRect() : null;
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
    if (cena.botoes.length) {
      throw new Error('RECUSADO: controle visível dentro do quadro do cartão — ' + cena.botoes[0]
        + '. Num JPEG não há botão para tocar; esconda-o antes do print (é o que a lista de .med'
        + ' e de position fixed/sticky faz).');
    }
    // A serifa da casa tem de estar de pé no título. Se um dia alguém devolver um título em
    // sans/mono, ou quebrar a var(--titulo), o cartão sairia com outra identidade — e é isso que
    // se cobra, não mais a chegada de uma fonte de rede (as páginas não usam mais Google Fonts).
    const fonteTitulo = (cena.tituloFonte || '').toLowerCase();
    const serifaCasa = /palatino|georgia|iowan|noto serif|times|\bserif\b/.test(fonteTitulo);
    if (!serifaCasa) {
      throw new Error('RECUSADO: o título não está na serifa da casa (font-family computada: "'
        + cena.tituloFonte + '"). O cartão sairia com outra identidade visual. Esperado Palatino/'
        + 'Georgia/serif — confira var(--titulo) e o chrome-plataforma.js.');
    }

    await pg.screenshot({ path: destino, type: 'jpeg', quality: op.qualidade || QUALIDADE });
    if (erros.length) throw new Error('RECUSADO: erro na página ao tirar o cartão: ' + erros[0]);

    const kb = fs.statSync(destino).size / 1024;
    if (kb < KB_MIN || kb > KB_MAX) {
      throw new Error('RECUSADO: ' + path.basename(dir) + '/compartilhar.jpg saiu com '
        + kb.toFixed(0) + ' KB — fora da faixa de ' + KB_MIN + ' a ' + KB_MAX + ' KB');
    }
    return { kb: kb, titulo: cena.titulo, escondidos: escondidos, topo: cena.topo, base: cena.base };
  } finally {
    await nav.close();
  }
}

module.exports = { LARGURA, ALTURA, QUALIDADE, KB_MIN, KB_MAX, tags, tirar };
