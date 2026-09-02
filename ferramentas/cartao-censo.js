// O CENSO DO CARTÃO — quem pode aparecer dentro do recorte 1200x630, por LISTA DE PERMITIDOS
//
// POR QUE ESTE ARQUIVO EXISTE, e o número que o pediu (PENDENTES 67 · 68 · 100, 23/08 e 02/09):
//
// Em 23/08 o `territorio/compartilhar.jpg` publicado saiu com a tábua "MEDIÇÃO / ligada" ao lado
// de "O Território" — controle de UI dentro da imagem que o WhatsApp mostra e ninguém revê, porque
// o robô da rede social busca uma vez e guarda por semanas. O portão de então cobrava ESFORÇO
// ("quantos nós a exclusão escondeu"), e o PENDENTES 67 trocou isso por RESULTADO ("sobrou algum
// controle no quadro?"). O 68 tirou a regra geral: o instrumento tem de ser ESTRITAMENTE MAIS
// PARANOICO que a coisa medida.
//
// AS DUAS PÓS-CONDIÇÕES QUE NASCERAM DALI PEGAM OS DOIS MUTANTES CONHECIDOS E DEIXAM PASSAR UM
// TERCEIRO, e é isto que este arquivo conserta. Elas reconheciam o alvo por COMO ELE SE CHAMA:
//   · `sobrouControle` — `position:fixed|sticky` E casa numa lista paranoica de seletores;
//   · `alvoNomeado`    — o `id` que o módulo da medição exporta OU um `aria-label` "Medição…".
// O mutante do PENDENTES 100 custa UMA LINHA a mais que o do 67: embrulhar o botão num `<span
// style="position:sticky">` (o botão em si vira `static`, então "flutua" é falso), trocar o `id`
// E trocar o `aria-label`. As duas pós-condições voltam VAZIAS e a tábua MEDIÇÃO reaparece no
// recorte com os dois portões verdes — medido, com dump, no PENDENTES 100.
//
// A DOENÇA É DE CLASSE, não de lista: **nome é atributo do autor, e o que se chama pode ser
// renomeado.** Toda régua que enumera o que é PROIBIDO perde para uma renomeação, porque a lista
// de nomes possíveis é infinita e a lista escrita é finita. É o mesmo argumento do §3 do CLAUDE.md
// para a CSP: negar por curinga é o começo de não ter CSP.
//
// ENTÃO A RÉGUA VIRA DEFAULT-DENY, E A LISTA MUDA DE LADO. Este módulo não pergunta "isto é o
// interruptor da medição?". Ele pergunta, de todo elemento interativo cujo retângulo cai dentro
// do recorte: **você está na lista do que este cartão deve conter?** Quem não está, reprova — não
// importa como se chama, onde nasceu, se flutua ou não. Renomear deixou de ser fuga e passou a ser
// a forma mais rápida de CAIR FORA da lista.
//
// A LISTA DE PERMITIDOS É DERIVADA DO DADO QUE GEROU A PÁGINA, nunca digitada à mão — a regra de
// ouro da fronteira, a mesma que manda o gerador EXTRAIR do jogo em vez de redigitar:
//   · os links da barra saem dos `href` que `chrome-plataforma.js` escreveu naquele `<nav>`;
//   · as tábuas de lugar saem de `D.pontos` (cidade + UF), que veio do MAPA_PONTOS do jogo.
// Para escapar do censo agora não basta renomear: é preciso IMITAR conteúdo aprovado — mesmo
// seletor, mesma identidade derivada do dado, dentro do mesmo contêiner, e sem repetir uma
// identidade que já apareceu. Nesse ponto o "escape" deixou de ser uma linha de fuga e virou uma
// mudança de conteúdo, que é visível no próprio cartão.
//
// O QUE FOI MEDIDO ANTES DE ESCREVER, e derrubou a primeira hipótese (a de que bastaria "nenhum
// elemento interativo dentro do recorte"): **há NOVE elementos interativos legítimos dentro do
// recorte do TERRITÓRIO** — 4 links `a.tabua` da barra e 5 tábuas de lugar `button.pl` ("União dos
// Palmares AL", "Rio de Janeiro RJ", "Salvador BA", "Santos SP", "Brasília DF"), todas
// `position:static`, todas no cartão desde 21/08 e nenhuma delas erro. A régua ingênua reprovaria
// o desenho CERTO, e régua que reprova o certo é pior que régua nenhuma: na primeira vez que ela
// grita alguém a afrouxa inteira. Por isso não é "zero interativo" — é "só o que está na lista".
//
// A GEOMETRIA ENTRA DUAS VEZES, e as duas são o que nome nenhum dá:
//   1. **Quem é inspecionado** é decidido por retângulo: todo elemento visível que INTERSECTA o
//      recorte 1200x630, seja qual for a posição no CSS. É isto que alcança o mutante `static`
//      que "flutua && ehControle" não alcança.
//   2. **Um permitido tem de caber no contêiner dele.** Um impostor que roube um `href` legítimo
//      e se posicione noutro canto do quadro sai do retângulo do `<nav>` a que diz pertencer e
//      reprova assim mesmo.
//
// O QUE ESTE MÓDULO NÃO RESOLVE, dito em vez de escondido: ele descreve o TERRITÓRIO. As outras
// três seções (A HISTÓRIA, glossário, DE ONDE VEM) têm texto corrido com links dentro do recorte,
// e um censo lá precisa de lista própria — território de `ferramentas/cartao-secao.js`, que
// continua com a varredura genérica de `fixed|sticky`.
//
// UMA FONTE, DOIS CHAMADORES. `ferramentas/gerar-territorio.js` (que recusa construir) e
// `test/cartao-quadro-controle.js` (que recusa aprovar o artefato commitado; renomeado em 02/09,
// era `test/medir-cartao-controle.js`) chamam ESTA função,
// em vez das duas cópias que antes juravam ser idênticas e não eram — a do gerador não tinha o
// `|| e.id === 'medirBt'` que a do teste tinha, embora o comentário mandasse ser idêntica byte a
// byte. Comentário não é portão; `require` é.

const L = 1200, A = 630;

// A LISTA DE INTERATIVOS É ESTRITAMENTE MAIS LARGA que qualquer exclusão de gerador — PENDENTES
// 68. Se ela achar algo que a exclusão do gerador não pega, é a exclusão que se alarga, nunca esta
// lista que se estreita. `[tabindex]` entra por atributo (menos `-1`, que tira do tab e não convida
// o dedo); `[onclick]` e `[contenteditable]` entram porque uma `<div onclick tabindex="0">` colada
// na barra escapava das duas listas antigas ao mesmo tempo (mutante do PENDENTES 68).
const SELETOR_INTERATIVO = 'a[href], button, input, select, textarea, summary, label,'
  + ' [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="tab"],'
  + ' [role="menuitem"], [role="option"], [role="radio"], [onclick], [contenteditable]';

// ---------------------------------------------------------------------------------------------
// RODA DENTRO DA PÁGINA. Sem variável livre nenhuma de propósito: o Playwright serializa a função
// por `toString()`, então tudo o que ela usa ou é argumento ou está declarado aqui dentro. Foi por
// isso que o seletor acima é repassado como argumento em vez de fechado por escopo.
//
// Devolve a lista de ESTRANHOS — cada um com o motivo. Vazia = o cartão só tem o que a lista
// permite.
function censoDoQuadro([L, A, permitidos, SELETOR_INTERATIVO]) {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const usados = Object.create(null);
  const estranhos = [];

  // VISIBILIDADE + RECORTE, num lugar só — as duas passadas abaixo usam a mesma sequência; ela
  // vive aqui para as duas nunca poderem divergir.
  function visivel(e) {
    const s = getComputedStyle(e);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return null;
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    // O RETÂNGULO cai dentro do recorte? É esta linha — e não o `position` — que decide quem é
    // inspecionado. O mutante do PENDENTES 100 é `position:static` e cai aqui do mesmo jeito.
    if (r.right <= 0 || r.bottom <= 0 || r.left >= L || r.top >= A) return null;
    return { s: s, r: r };
  }
  function retratar(e, s, r) {
    return {
      alvo: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')
        + (e.className ? '.' + String(e.className).replace(/\s+/g, '.') : ''),
      posicao: s.position,
      href: e.getAttribute('href') || '',
      aria: e.getAttribute('aria-label') || '',
      texto: norm(e.innerText).slice(0, 44),
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
    };
  }

  // O QUE O PASSO 1 DEIXA PRONTO PARA O PASSO 2 USAR (censo-cartao-residuais, item 1 — "o censo
  // conta INTERATIVO, não conta o que está na FOTO"):
  //   `aceitos` — elementos que casaram com um permitido; as partes internas deles (o `<span
  //               class="uf">` dentro do `button.pl`, os rótulos dentro do botão de medição) não
  //               são revistas de novo no passo 2 — já estão cobertas pelo pai aceito.
  //   `donos`   — os contêineres REAIS (`.barra`, `.lista`…) descobertos por terem ao menos UM
  //               filho aceito dentro deles. Nunca por NOME: um `<div class="barra">` de mentira
  //               plantado ao lado da barra verdadeira não vira "dono" de graça — só convence o
  //               passo 1, com um link cujo href E rótulo batam com o dado real.
  const aceitos = [];
  const donos = [];   // elementos DOM (não objetos): os contêineres que o passo 1 já provou reais

  document.querySelectorAll('body *').forEach((e) => {
    // 1) É interativo? (por seletor OU por tabindex que entra na ordem de foco)
    let interativo = e.matches(SELETOR_INTERATIVO);
    if (!interativo) {
      const tab = e.getAttribute('tabindex');
      if (tab !== null && tab !== '-1') interativo = true;
    }
    if (!interativo) return;

    const v = visivel(e);
    if (!v) return;   // 2)+3) visível e dentro do recorte — o que a exclusão escondeu sai daqui
    const retrato = retratar(e, v.s, v.r);

    // 4) DEFAULT-DENY: casa com alguma entrada da lista de permitidos?
    // Uma entrada casa só se TODAS as chaves que ela declara casarem. Os links da barra declaram
    // href E rótulo — foi preciso, e o caso que provou está no cabeçalho (mutante 103): com só o
    // href, bastava APAGAR a tábua "A História" e vestir o interruptor com o href dela para o
    // censo passar vazio.
    let entrada = null;
    for (let i = 0; i < permitidos.length; i++) {
      const p = permitidos[i];
      if (!e.matches(p.sel)) continue;
      if (p.href !== undefined && (e.getAttribute('href') || '') !== p.href) continue;
      if (p.texto !== undefined && norm(e.innerText) !== p.texto) continue;
      entrada = p;
      entrada.__i = i;
      break;
    }
    if (!entrada) { retrato.motivo = 'fora da lista de permitidos do cartão'; estranhos.push(retrato); return; }
    const rotulo = entrada.href !== undefined ? entrada.href : entrada.texto;

    // 5) O permitido cabe no contêiner que ele diz ser dele? (impostor que rouba identidade
    //    legítima e se muda de lugar sai do retângulo do <nav> e cai aqui)
    const dono = e.closest(entrada.dentro);
    if (!dono) { retrato.motivo = 'permitido "' + rotulo + '" fora de ' + entrada.dentro; estranhos.push(retrato); return; }
    // O RETÂNGULO DO CONTÊINER NÃO SERVE CRU, E ISSO FOI MEDIDO: a `.barra` ROLA na horizontal, e
    // no cartão ela está rolada (o `scrollIntoView` da tábua "você está aqui"). A primeira versão
    // desta linha comparava com `dono.getBoundingClientRect()` e reprovava a tábua "A História",
    // que está a x=3 com a barra começando em x=26 — legítima, só parcialmente rolada para fora da
    // janela do contêiner. Régua que reprova o desenho certo é pior que régua nenhuma. Então a
    // comparação é com a CAIXA DE ROLAGEM do contêiner: a origem do conteúdo é `rect - scroll`, e
    // a extensão é `scrollWidth/scrollHeight`. É exata nos dois casos (rolado ou não).
    const rd = dono.getBoundingClientRect();
    const cx0 = rd.left - dono.scrollLeft, cy0 = rd.top - dono.scrollTop;
    const cx1 = cx0 + dono.scrollWidth, cy1 = cy0 + dono.scrollHeight;
    const F = 4;   // folga de subpixel e de borda
    if (v.r.left < cx0 - F || v.r.top < cy0 - F || v.r.right > cx1 + F || v.r.bottom > cy1 + F) {
      retrato.motivo = 'permitido "' + rotulo + '" escapou da caixa de rolagem de ' + entrada.dentro
        + ' (' + Math.round(cx0) + ',' + Math.round(cy0) + ' até ' + Math.round(cx1) + ',' + Math.round(cy1) + ')';
      estranhos.push(retrato); return;
    }

    // 6) UMA identidade permitida vale UMA VEZ. Um segundo `<a href="/territorio">` com outro
    //    rótulo é conteúdo novo no cartão, e conteúdo novo passa pelos olhos de alguém.
    const ch = entrada.__i + '|' + rotulo;
    if (usados[ch]) { retrato.motivo = 'identidade permitida repetida: ' + rotulo; estranhos.push(retrato); return; }
    usados[ch] = true;

    // ACEITO: registra o elemento e o contêiner dele para o passo 2.
    aceitos.push(e);
    if (donos.indexOf(dono) === -1) donos.push(dono);
  });

  // PASSO 2 — QUEM MORA DENTRO DE UM CONTÊINER JÁ PROVADO REAL, MESMO SEM SER INTERATIVO.
  //
  // POR QUE ESTE PASSO EXISTE (censo-cartao-residuais, item 1, print do pré-integrador em 02/09):
  // uma `<div>` sem `onclick`, sem `tabindex` e sem `role`, lendo "MEDIÇÃO ligada", colada dentro
  // da `.barra` de verdade, nunca acionava o filtro "1) É interativo?" acima e o censo voltava
  // VAZIO — o defeito visual de 23/08 reproduzido com o portão verde. O cartão é uma FOTO: o que
  // aparece nela não depende de ser clicável.
  //
  // NÃO é o modo de falha do PENDENTES 67/68/100 — lá o alvo era um interruptor DE VERDADE, e
  // transformá-lo numa `<div>` inerte não seria disfarce, seria desfazer o botão (mudança de
  // produto, não fuga de censo). Aqui é o oposto: um elemento que NUNCA foi interativo, plantado
  // no MEIO do conteúdo que o cartão já mostra, e que a régua anterior não tinha como enxergar
  // porque só olhava para quem convida o dedo.
  //
  // A régua não vira "todo texto reprova" (isso trocaria este buraco por um de falso-positivo —
  // ver o cabeçalho do arquivo e a régua da casa: nenhuma exclusão geral, só o que já foi provado
  // pertencer). Em vez disso, ela usa os `donos` que o passo 1 JÁ PROVOU reais — contêineres com
  // pelo menos um filho aceito dentro — e varre TODOS os descendentes deles. Quem não é um aceito
  // nem faz parte interna de um aceito (o `<span class="uf">` dentro do `button.pl`, os rótulos
  // dentro do botão de medição) é estranho, interativo ou não.
  donos.forEach((dono) => {
    dono.querySelectorAll('*').forEach((e) => {
      if (aceitos.indexOf(e) !== -1) return;                          // já aceito no passo 1
      if (aceitos.some((a) => a !== e && a.contains(e))) return;      // parte interna de um aceito
      const v = visivel(e);
      if (!v) return;
      const retrato = retratar(e, v.s, v.r);
      retrato.motivo = 'dentro de um contêiner já provado do cartão, mas fora da lista de'
        + ' permitidos — não depende de ser clicável (censo-cartao-residuais item 1)';
      estranhos.push(retrato);
    });
  });

  return estranhos;
}

// ---------------------------------------------------------------------------------------------
// A LISTA DE PERMITIDOS DO TERRITÓRIO, montada do DADO — nunca digitada.
//   `barraHtml` é a string que `chrome-plataforma.js` acabou de escrever no `<nav class="barra">`;
//   `pontos` é `D.pontos`, extraído do MAPA_PONTOS do jogo pelo próprio gerador.
// Se a barra ganhar uma seção ou o mapa ganhar um lugar, a lista acompanha sozinha. Se alguém
// enfiar um controle novo, ele NÃO acompanha — que é exatamente a assimetria que se quer.
function permitidosTerritorio(barraHtml, pontos) {
  const des = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const lista = [];
  // href E rótulo, os dois do MESMO `<a>` — ver o mutante 103 no cabeçalho: só o href não basta,
  // porque dá para apagar a tábua legítima e vestir o interruptor com o href dela.
  const re = /<a\s+href="([^"]+)"\s+class="[^"]*">([^<]*)<\/a>/g;
  let m;
  while ((m = re.exec(barraHtml))) {
    lista.push({ sel: 'a[href]', href: m[1], texto: des(m[2]).replace(/\s+/g, ' ').trim(), dentro: '.barra' });
  }
  if (!lista.length) throw new Error('RECUSADO: censo do cartão sem nenhum link de barra — a lista de permitidos ficaria vazia e o censo reprovaria a página certa');
  (pontos || []).forEach((p) => {
    lista.push({ sel: 'button.pl', texto: String(p.cidade) + ' ' + String(p.uf), dentro: '.lista' });
  });
  return lista;
}

// O MESMO DADO, PELO LADO DE QUEM SÓ TEM O ARTEFATO. O gerador tem `D.pontos` na mão; o
// instrumento que audita o `territorio/index.html` JÁ COMMITADO, não — e ele não pode ler
// `window.D`, que mora dentro do módulo da página e não é global (medido: `window.D` é
// `undefined`, e a lista de permitidos saía vazia, reprovando as cinco tábuas de lugar certas).
//
// Então ele lê as tábuas de lugar da FORMA que o gerador escreveu, do arquivo em disco. Não é
// circular pelo que importa: a régua existe para pegar CONTROLE dentro do quadro, e um controle —
// injetado em tempo de execução ou commitado à mão — não tem a forma `<button class="pl"
// data-i="N">Cidade <span class="uf">UF</span></button>`. Para entrar na lista por aqui, ele teria
// de virar uma tábua de lugar, com cidade e UF, no meio da lista de lugares — e aí não é mais o
// interruptor escondido no cartão, é conteúdo novo que passa pelos olhos de alguém.
function pontosDoHtml(html) {
  const des = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const re = /<button[^>]*class="pl"[^>]*>([^<]*)<span class="uf">([^<]*)<\/span><\/button>/g;
  const fora = [];
  let m;
  while ((m = re.exec(html))) fora.push({ cidade: des(m[1]).trim(), uf: des(m[2]).trim() });
  return fora;
}

// ---------------------------------------------------------------------------------------------
// OS MUTANTES, e por que eles moram no MESMO arquivo que a régua (EQUIPE.md 2.8: instrumento que
// ninguém viu reprovando é decoração).
//
// A entrega recusada em 02/09 tinha um controle que só injetava um `<button>` genérico sticky — a
// forma que a lista ANTIGA já pegava. Ela nunca exercitou os mutantes que de fato quebraram o
// portão, e a mensagem do commit descrevia um wrapper de teste que não estava commitado; o auditor
// teve de reconstruí-lo para provar E para desmentir. Então os mutantes ficam aqui, versionados,
// ao lado da coisa que eles atacam: `test/cartao-quadro-controle.js` os roda contra a página real e
// `ferramentas/gerar-territorio.js` os aceita por `CARTAO_MUTANTE=<nome>` para ser visto recusando
// a própria build.
//
// Os quatro últimos são ADVERSARIAIS e nasceram tentando derrubar esta régua depois de escrita.
// Três caíram; o `m103` PASSOU na primeira versão (que casava só o `href`) e é a razão de o rótulo
// da tábua entrar na lista de permitidos. Está registrado porque um mutante que já passou é a
// única prova de que a régua mudou por medição e não por gosto.
//
// Todas rodam DENTRO da página e não fecham sobre nada — o Playwright as serializa por toString().
const MUTANTES = {
  // PENDENTES 67 — o botão vira `static` dentro de um wrapper `sticky` e troca de id.
  // Escapava de "flutua && ehControle" (o botão não flutua mais) e do id nomeado.
  m67: () => {
    const b = document.getElementById('medirBt');
    if (!b) throw new Error('mutante m67: nao achei #medirBt na pagina');
    const w = document.createElement('span');
    w.style.cssText = 'position:sticky;top:0;display:inline-flex';
    b.parentNode.insertBefore(w, b);
    w.appendChild(b);
    b.id = 'medirBt2';
    b.style.position = 'static';
  },
  // PENDENTES 68 — `<div onclick tabindex="0">` colada na barra: nem `button` nem `[role]`,
  // escapava das DUAS listas de seletores ao mesmo tempo.
  m68: () => {
    const barra = document.querySelector('.barra') || document.body;
    const d = document.createElement('div');
    d.className = 'qaDiv';
    d.setAttribute('onclick', 'void 0');
    d.setAttribute('tabindex', '0');
    d.textContent = 'MEDIÇÃO';
    d.style.cssText = 'position:sticky;top:24px;width:44px;height:44px;background:#c33;z-index:99';
    barra.appendChild(d);
  },
  // PENDENTES 100 — o m67 mais UMA LINHA: o `aria-label` também muda. Era o caminho de volta com
  // os dois portões verdes, e é o mutante que reprovou a entrega de 02/09.
  m100: () => {
    const b = document.getElementById('medirBt');
    if (!b) throw new Error('mutante m100: nao achei #medirBt na pagina');
    const w = document.createElement('span');
    w.style.cssText = 'position:sticky;top:0;display:inline-flex';
    b.parentNode.insertBefore(w, b);
    w.appendChild(b);
    b.id = 'medirBt2';
    b.style.position = 'static';
    b.setAttribute('aria-label', 'Contagem ligada. Toque para desligar.');
  },
  // ADVERSARIAL — rouba a identidade de uma tábua legítima que CONTINUA na página.
  // Cai por identidade repetida (e, desde o rótulo entrar na lista, já cai antes disso).
  m101: () => {
    const b = document.getElementById('medirBt');
    if (!b) throw new Error('mutante m101: nao achei #medirBt na pagina');
    const a = document.createElement('a');
    a.className = 'tabua'; a.setAttribute('href', '/historia'); a.textContent = 'MEDIÇÃO ligada';
    b.parentNode.replaceChild(a, b);
  },
  // ADVERSARIAL — o mesmo, mas APAGANDO a tábua legítima antes, para não repetir identidade.
  // ESTE PASSOU na primeira versão da régua. É por causa dele que o rótulo entrou.
  m103: () => {
    const alvo = document.querySelector('.barra a[href="/historia"]');
    if (alvo) alvo.remove();
    const b = document.getElementById('medirBt');
    if (!b) throw new Error('mutante m103: nao achei #medirBt na pagina');
    const a = document.createElement('a');
    a.className = 'tabua'; a.setAttribute('href', '/historia'); a.textContent = 'MEDIÇÃO ligada';
    b.parentNode.replaceChild(a, b);
  },
  // ADVERSARIAL — veste-se de tábua de LUGAR legítima ("Santos SP") mas continua morando na barra.
  // Só a GEOMETRIA o pega: identidade permitida fora da caixa de rolagem de `.lista`.
  m104: () => {
    const b = document.getElementById('medirBt');
    if (!b) throw new Error('mutante m104: nao achei #medirBt na pagina');
    const c = document.createElement('button');
    c.className = 'pl';
    c.innerHTML = 'Santos <span class="uf">SP</span>';
    b.parentNode.replaceChild(c, b);
  },
  // ADVERSARIAL — controle solto sobre o mapa, longe da barra, sem id e sem rótulo conhecido.
  // É o caso que nenhuma régua por NOME alcança, e que a lista de permitidos alcança de graça.
  m105: () => {
    const d = document.createElement('div');
    d.setAttribute('role', 'switch');
    d.style.cssText = 'position:absolute;left:900px;top:420px;width:120px;height:40px;background:#333;color:#fff;z-index:99';
    d.textContent = 'ligado';
    document.body.appendChild(d);
  },
  // ITEM (1) DO censo-cartao-residuais (02/09) — o residual com print, o único que o aceite
  // manda fechar. Uma `<div>` INERTE: sem `onclick`, sem `tabindex`, sem `role` — nada que a
  // pergunta "1) É interativo?" do passo 1 alcance — lendo "MEDIÇÃO ligada", colada dentro da
  // `.barra` DE VERDADE (não uma barra impostora: é a mesma `.barra` que já tem os quatro links
  // aceitos, então ela já é um `dono` provado antes deste mutante rodar). Só o passo 2 (varrer os
  // descendentes de um `dono` provado, sem exigir interatividade) alcança isto — é o mutante que
  // teria passado limpo pela régua de antes do item 1, com print do pré-integrador para provar.
  m106: () => {
    const barra = document.querySelector('.barra');
    if (!barra) throw new Error('mutante m106: nao achei .barra na pagina');
    const d = document.createElement('div');
    d.className = 'medFoto';
    d.textContent = 'MEDIÇÃO ligada';
    d.style.cssText = 'display:inline-flex;align-items:center;padding:0 8px;height:44px;color:#fff';
    barra.appendChild(d);
  },
};

module.exports = { L, A, SELETOR_INTERATIVO, censoDoQuadro, permitidosTerritorio, pontosDoHtml, MUTANTES };
