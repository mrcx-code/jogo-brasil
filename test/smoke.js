// Headless smoke test: no console errors, upgrades buyable, hold-to-attack repeats, fps sane.
// Run: node test/smoke.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Use the sandbox chromium when it is there, otherwise whatever playwright installed.
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;   // let playwright resolve its own download
}

// Qual arquivo testar. O padrão é o index.html da raiz, que é a SAÍDA do build (veja
// ferramentas/construir.js) — nunca a fonte em src/. JOGO_HTML aponta para outro caminho
// quando se quer provar os bytes de outro lugar, por exemplo os que o Capacitor copiou para
// dentro do APK: JOGO_HTML=android/app/src/main/assets/public/index.html node test/smoke.js
// Aceita também uma URL http(s) já no ar.
//
// ===== POR QUE ISTO NÃO ABRE MAIS POR `file://` =====
// Custou meia sessão e é o tipo de coisa que fica verde testando o caminho errado. Desde a
// CARGA SOB DEMANDA (09/08) a arte dos capítulos 2+ chega por `fetch("pack-*.json")`, e o
// Chromium RECUSA esse fetch sob `file://` — a prova está em `test/peso-file-fetch.js`. Nenhum
// dos três lugares onde o jogo roda de verdade usa `file://`: a Vercel serve por https, o
// `npm start` por http, e o Capacitor por `https://localhost`. Um teste que abrisse por
// `file://` continuaria PASSANDO enquanto exercitava só o caminho de recuo (arte do capítulo 1
// em toda parte) e nunca o caminho que a produção usa. Teste verde sobre o arquivo errado é
// pior que teste vermelho.
//
// Então o teste sobe um servidor estático próprio, na origem `http://127.0.0.1:<porta>`, com o
// DIRETÓRIO do alvo como raiz — é assim que os `pack-*.json` que o build escreveu ao lado do
// index.html ficam alcançáveis, exatamente como ficam na Vercel e dentro do APK.
function servirAlvo(arquivo) {
  const DIR = path.dirname(arquivo), NOME = path.basename(arquivo);
  const TIPOS = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
  const servidor = http.createServer(function (req, res) {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || NOME;
    const alvo = path.normalize(path.join(DIR, rel));
    if (!alvo.startsWith(DIR) || !fs.existsSync(alvo)) { res.writeHead(404).end('404'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(alvo));
  });
  return new Promise(function (r) {
    servidor.listen(0, '127.0.0.1', function () {
      r({ servidor: servidor, url: 'http://127.0.0.1:' + servidor.address().port + '/' + NOME });
    });
  });
}
async function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return { servidor: null, url: p };
  return servirAlvo(path.resolve(__dirname, '..', p || 'index.html'));
}

// ===== LINT DE COMENTÁRIO — roda ANTES do navegador, e existe por um defeito real =====
// Em 2026-08-09 um comentário de `src/estilo.css` ficou PARTIDO EM DOIS: fechava na metade e
// deixava sete linhas de prosa soltas dentro da folha de estilo, com um `*/` órfão no fim. O
// navegador pulou o lixo e engoliu a regra `.glItem` inteira — a que recolhe o verbete —, e o
// glossário passou a mostrar cartões de 334 px onde deviam ter 45.
//
// O SMOKE TEST PASSOU VERDE o tempo todo, e não por descuido: ele confere que a classe
// `.aberto` alterna, não a altura que a classe produz. CSS morto não lança erro de console,
// não quebra JS e não muda contagem de elemento nenhum — é invisível para tudo o que este
// arquivo sabe olhar. Só apareceu quando alguém abriu a tela e olhou.
//
// Isto aqui cobre a CAUSA, que é barata de detectar: comentário desbalanceado. Não substitui
// olhar a tela — o CLAUDE.md §6 é explícito em que o teste garante que não quebrou, nunca que
// ficou bom — mas fecha a porta por onde esta classe de defeito entra.
function lintComentarios() {
  const problemas = [];
  for (const rel of ['src/estilo.css', 'src/index.html', 'src/jogo.ts']) {
    const p = path.resolve(__dirname, '..', rel);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    // Um `/*` dentro de string ou de expressão regular daria falso positivo em JS/TS; por isso
    // a checagem de bloco só vale para CSS, onde não há literal de string com barra-asterisco.
    if (rel.endsWith('.css')) {
      const ab = (txt.match(/\/\*/g) || []).length, fe = (txt.match(/\*\//g) || []).length;
      if (ab !== fe) problemas.push(`${rel}: ${ab} aberturas de comentário para ${fe} fechamentos`);
      // `*/` que sobra depois de remover todo comentário bem-formado é o órfão exato do caso
      // acima: quem o escreveu achava que estava dentro de um comentário, e não estava.
      const orfaos = txt.replace(/\/\*[\s\S]*?\*\//g, '').split('*/').length - 1;
      if (orfaos) problemas.push(`${rel}: ${orfaos} fecha-comentário órfão — prosa solta fora de comentário`);
    }
  }
  return problemas;
}

(async () => {
  const posto = await alvo();
  const file = posto.url;
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const problemasDeComentario = lintComentarios();
  problemasDeComentario.forEach(function (p) { console.log('comment lint -> ' + p); });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_(TUNNEL|NAME|CONNECTION)/.test(m.text())) errors.push('CONSOLE: ' + m.text()); });

  await page.goto(file);
  await page.waitForTimeout(900);

  // O menu inicial abre quando nao ha partida, e o teste comeca sempre em partida nova, entao
  // ele cobre a tela e todo tap seguinte cai nele. Nao e bug do jogo: e o teste que precisa
  // entrar antes de testar.
  await page.evaluate(() => {
    if (typeof fecharTelas === 'function') fecharTelas();
  });
  await page.waitForTimeout(150);

  // ---- A ARTE QUE CHEGA SOB DEMANDA ----
  // Este bloco vem ANTES de tudo de propósito: ele precisa de uma página recém-aberta, em que
  // nenhum pacote foi pedido ainda. É a única janela em que dá para provar que a arte dos
  // capítulos 2+ realmente NÃO está no arquivo de abertura — depois que o teste caminha pelas
  // eras, tudo já chegou e a asserção passaria mesmo com o mecanismo desligado.
  //
  // Três coisas são cobradas, e cada uma cai por um motivo diferente:
  //   1. NA ABERTURA a arte do capítulo 1 é real e a dos outros é o pixel de espera. Se alguém
  //      devolver um bloco para dentro do index.html, isto acusa — e é o único aviso de que a
  //      porta de entrada voltou a crescer, porque o jogo continuaria funcionando perfeitamente.
  //   2. DEPOIS DO PACOTE a arte é real: pintura, personagem, objeto e drop daquela época. É o
  //      que prova que o endereço de cada imagem sobreviveu à viagem — endereço errado devolve
  //      a imagem no lugar errado e NÃO dá erro nenhum no console.
  //   3. ENQUANTO ESPERA o jogo não fica sem chão: a pintura em uso é uma que carregou.
  const espera = await page.evaluate(() => {
    const eDeEspera = (im) => !!(im && im.complete && im.naturalWidth <= 1);
    const cap1 = (EPOCAS[0].arte || []).every(i => CENARIO_ALTO[i] && CENARIO_ALTO[i].naturalWidth > 1);
    // um capítulo cujo pacote ninguém pediu ainda
    const outro = EPOCAS.findIndex((e, i) => i > 0 && pacotesDaEpoca(i).length);
    const arteOutro = outro < 0 ? [] : (EPOCAS[outro].arte || []);
    return {
      tabela: !!window.__PACOTES, pacotes: (window.__PACOTES || {}).nomes || [],
      cap1Real: cap1, outro, pedeOutro: outro < 0 ? [] : pacotesDaEpoca(outro),
      outroEmEspera: arteOutro.length > 0 && arteOutro.every(i => eDeEspera(CENARIO_ALTO[i])),
      // e o recuo: mandar o jogo para lá NÃO pode deixar a tela sem pintura
      // A IDENTIDADE, E NAO SO A LARGURA (18/08). A assercao antiga era `fundoDoRecuo > 1`,
      // que um stub de 2 px satisfaz -- entao ela nao guardava a promessa que diz guardar. E a
      // promessa nao e pequena: a excecao de UM ARQUIVO SO foi aprovada pelo dono em 10/08 sobre
      // tres condicoes, e a primeira delas e que o jogo NUNCA fica sem chao, rodando com a arte
      // do capitulo 1 enquanto o pacote nao chega. Cobrar largura maior que um pixel nao prova
      // isso; prova que existe alguma imagem.
      //
      // Agora compara o OBJETO, alto e chao: tem de ser a MESMA imagem que o capitulo 1 desenha.
      recuoEIgualAoCap1: (() => {
        const antes = S.cenario;
        S.cenario = cenarioDaEpoca(outro < 0 ? 0 : outro);
        const doRecuo = CENARIO_ALTO[fundoIdx()], chaoRecuo = CENARIO_CHAO[fundoIdx()];
        S.cenario = cenarioDaEpoca(0);
        const doCap1 = CENARIO_ALTO[fundoIdx()], chaoCap1 = CENARIO_CHAO[fundoIdx()];
        S.cenario = antes;
        return doRecuo === doCap1 && chaoRecuo === chaoCap1 && !!doCap1 && doCap1.naturalWidth > 1;
      })(),
      fundoDoRecuo: (() => {
        const antes = S.cenario;
        S.cenario = cenarioDaEpoca(outro < 0 ? 0 : outro);
        const i = fundoIdx(), larg = CENARIO_ALTO[i] ? CENARIO_ALTO[i].naturalWidth : 0;
        S.cenario = antes;
        return larg;
      })(),
    };
  });
  console.log('art packs ->', espera.pacotes.join(', '), '| chapter 1 art inline:', espera.cap1Real,
    '| chapter', espera.outro, 'waiting on', espera.pedeOutro.join('+'), ':', espera.outroEmEspera,
    '| painting used while waiting:', espera.fundoDoRecuo, 'px wide');
  if (!espera.tabela) errors.push('the art-pack table (__PACOTES) did not reach the game');
  if (!espera.pacotes.length) errors.push('the build produced no art packs at all');
  if (!espera.cap1Real) errors.push('chapter 1 art is not inline any more: the first screen now waits on the network');
  if (espera.outro < 0) errors.push('no chapter asks for a pack: the on-demand path is dead code');
  if (!espera.outroEmEspera) errors.push('chapter ' + espera.outro + ' art is still inside index.html: the opening file is growing again');
  if (!(espera.fundoDoRecuo > 1)) errors.push('a chapter whose pack has not arrived draws no painting at all');
  if (!espera.recuoEIgualAoCap1) errors.push('a chapter waiting on its pack does not fall back to the SAME chapter-1 painting (alto+chao) — that is the first of the three conditions the single-file exception was approved on');

  // ...e agora o pacote chega, e a arte fica de verdade — em TODOS os capítulos que pedem um.
  const chegou = await page.evaluate(async () => {
    const real = (im) => !!(im && im.complete && im.naturalWidth > 1);
    const faltas = [];
    for (let e = 0; e < EPOCAS.length; e++) {
      const quais = pacotesDaEpoca(e);
      if (!quais.length) continue;
      garantirEpoca(e);
      for (let t = 0; t < 200 && quais.some(n => pacoteEstado[n] !== 'aqui'); t++) {
        await new Promise(r => setTimeout(r, 25));
      }
      const antes = S.cenario;
      S.cenario = cenarioDaEpoca(e);
      const cap = capArte();
      (EPOCAS[e].arte || []).forEach(i => {
        if (!real(CENARIO_ALTO[i]) || !real(CENARIO_CHAO[i])) faltas.push(EPOCAS[e].id + ': pintura ' + i);
      });
      if (!real(heroBloco('walk')[0])) faltas.push(EPOCAS[e].id + ': a caminhada da personagem');
      if (!real(MOB_SPR.smog[cap])) faltas.push(EPOCAS[e].id + ': o que atravessa a rua');
      if (!real(dropDe('smog'))) faltas.push(EPOCAS[e].id + ': o que fica no chão');
      (EPOCAS[e].aberturaImg || []).forEach(k => {
        if (k && CTX_B64[k] && CTX_B64[k].length < 200) faltas.push(EPOCAS[e].id + ': a paisagem ' + k);
      });
      S.cenario = antes;
    }
    return { faltas, estado: Object.keys(pacoteEstado).sort() };
  });
  console.log('  packs applied ->', chegou.estado.join(', '), '| missing art:', chegou.faltas.length || 'none');
  chegou.faltas.forEach(f => errors.push('art did not come back from its pack — ' + f));

  // ...e um pacote que NÃO chega não quebra a partida, e é tentado de novo depois.
  // O fetch é trocado por um que recusa, em vez de pedir um arquivo que não existe: um 404 de
  // verdade escreve um erro no console do navegador e este teste falha por causa dele, o que
  // esconderia justamente o que se quer medir aqui.
  const falhou = await page.evaluate(async () => {
    const original = window.fetch;
    window.fetch = () => Promise.reject(new Error('rede caiu (de propósito, no teste)'));
    const antes = S.cenario, vivo = () => { desenhar(); return true; };
    garantirPacote('inexistente');
    await new Promise(r => setTimeout(r, 120));
    const podeTentarDeNovo = !('inexistente' in pacoteEstado);
    window.fetch = original;
    S.cenario = antes;
    return { podeTentarDeNovo, jogoVivo: vivo() };
  });
  console.log('  a pack that never arrives -> game still draws:', falhou.jogoVivo,
    '| will be tried again on the next entry:', falhou.podeTentarDeNovo);
  if (!falhou.jogoVivo) errors.push('a failed art pack stopped the game from drawing');
  if (!falhou.podeTentarDeNovo) errors.push('a failed art pack is never retried: the chapter loses its art for good');

  // read the tuning out of the page instead of restating it here
  const CFG_TIROS = await page.evaluate(() => CFG.autoFogoTiros);
  const CFG_COMBOS = await page.evaluate(() => CFG.superCombos);
  // obsolete: the opening card was removed by owner request — the game starts on the street.

  // obsolete: the first-run guide was removed by owner request — feature and test.
  // ---- the world is the JUMP surface, and it never earns ----
  const salto = await page.evaluate(async () => {
    fecharTudo();
    mobs.length = 0; drops.length = 0; folhas.length = 0; jumpT = 0;
    const antes = S.energiaTotal, comboAntes = combo;
    const cv = document.getElementById('scene');
    const r = cv.getBoundingClientRect();
    // the street is split down the middle now: left jumps, right swings. Aim well inside
    // the left half, not at the boundary.
    cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width * 0.25, clientY: r.top + r.height / 2 }));
    await new Promise(rr => setTimeout(rr, 60));
    const noAr = jumpT;
    cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    // the arc is JUMPF frames at 60fps — 733ms — so 700 was cutting it fine enough to fail
    // on a slow frame. Wait for the landing instead of guessing at it.
    for (let i = 0; i < 60 && jumpT > 0; i++) await new Promise(rr => setTimeout(rr, 40));
    return { noAr, pousou: jumpT, ganho: S.energiaTotal - antes, combo: combo - comboAntes };
  });
  console.log('tap on the world -> jumpT', salto.noAr, '| landed at', salto.pousou,
    '| earned', salto.ganho.toFixed(2), '| combo moved', salto.combo);
  if (salto.noAr <= 0) errors.push('a tap on the world did not jump');
  if (salto.pousou !== 0) errors.push('the jump never landed');
  // owner changed his mind: the jump lands a blow on the way up, so it DOES earn and it DOES
  // move the combo. What it must not do is stamp an attack pose over the leap.
  if (!(salto.ganho > 0)) errors.push('the jump landed no blow');
  if (salto.combo === 0) errors.push('the jump did not advance the combo');

  // ...and the right half swings instead of jumping
  const golpe = await page.evaluate(async () => {
    fecharTudo();
    mobs.length = 0; drops.length = 0; folhas.length = 0; jumpT = 0;
    const antes = S.energiaTotal;
    const cv = document.getElementById('scene');
    const r = cv.getBoundingClientRect();
    cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width * 0.75, clientY: r.top + r.height / 2 }));
    await new Promise(rr => setTimeout(rr, 60));
    return { pulou: jumpT, ganho: S.energiaTotal - antes, atacando: attackT };
  });
  console.log('tap on the right half -> jumpT', golpe.pulou, '| attackT', golpe.atacando,
    '| earned', golpe.ganho.toFixed(2));
  if (!(golpe.ganho > 0)) errors.push('the right half did not swing');
  if (golpe.pulou > 0) errors.push('the right half jumped instead of swinging');

  // a leaf caught out of the air pays, and only while she is up there
  const folha = await page.evaluate(async () => {
    fecharTudo();
    folhas.length = 0; jumpT = 0; floats.length = 0;
    // hold off the spawner: a leaf arriving mid-test would leave the array non-empty and say
    // nothing about whether THIS one was taken
    folhaChao = 0; proximaFolha = 9999;   // o vao entre folhas e medido em CHAO, nao em relogio
    // one parked right where her head passes at the top of the arc
    const alvo = { wx: worldX + HX, y: GROUND - 60, fase: 0 };
    folhas.push(alvo);
    const noChao = S.energiaTotal;
    atualizarFolhas(1 / 60, 0);                       // standing: it is above her
    const semPular = S.energiaTotal - noChao;
    const nAntes = folhas.length;
    pular();
    for (let i = 0; i < 40; i++) {                    // ride the arc
      const pj = 1 - jumpT / JUMPF;
      const alto = jumpT > 0 ? Math.round(Math.pow(Math.sin(pj * Math.PI), 0.7) * 52) : 0;
      atualizarFolhas(1 / 60, alto);
      if (jumpT > 0) jumpT--;
    }
    return { semPular, nAntes, aindaLa: folhas.indexOf(alvo) >= 0, pago: S.energiaTotal - noChao };
  });
  console.log('a leaf overhead -> ignored while standing:', folha.semPular.toFixed(2),
    '| still hanging:', folha.aindaLa, '| jumping paid', folha.pago.toFixed(2));
  if (folha.semPular > 0.001) errors.push('a leaf overhead was taken without jumping');
  if (folha.aindaLa) errors.push('jumping through a leaf did not take it');
  if (!(folha.pago > 0)) errors.push('catching a leaf paid nothing');

  // ---- MENOS ITENS CONFORME O JOGO ANDA (raleio medido, 2026-08-07) ----
  // 1. Com u1, os toques em sequencia somam num FLOAT SO (antes: ~5 "+N" empilhados sobre a
  //    heroina, 60% da poluicao de tela). Sem u1, cada toque segue com o proprio float.
  // 2. A mata raleia por capitulo: o vao entre folhas e sorteado x1 no cap 1, x1,5 no 2 e
  //    x2 no 3 — e o VALOR da folha sobe pelo mesmo fator, entao a renda por km nao muda.
  const raleio = await page.evaluate(() => {
    fecharTudo();
    const capAntes = S.cenario, u1Antes = S.u1;
    // floats com u1: vinte toques -> um float acumulando
    floats.length = 0; S.u1 = true;
    for (let i = 0; i < 20; i++) clicar();
    const comU1 = floats.length, textoU1 = floats.length ? floats[0].txt : '';
    // sem u1: cada toque poe o seu
    floats.length = 0; S.u1 = false; floatToque = null;
    for (let i = 0; i < 10; i++) clicar();
    const semU1 = floats.length;
    floats.length = 0; floatToque = null; S.u1 = u1Antes;
    // folhas por capitulo: media do vao sorteado em cada epoca
    const media = function (n) { let s = 0; for (let i = 0; i < n; i++) s += sorteiaFolha(); return s / n; };
    S.cenario = cenarioDaEpoca(0); const vao1 = media(400), valor1 = CFG.folhaValor * fatorFolha();
    S.cenario = cenarioDaEpoca(CAP_PALAVRA); const vao3 = media(400), valor3 = CFG.folhaValor * fatorFolha();
    S.cenario = capAntes;
    return { comU1, textoU1, semU1, razaoVao: +(vao3 / vao1).toFixed(2), razaoValor: +(valor3 / valor1).toFixed(2) };
  });
  console.log('thinning -> floats while holding with u1:', raleio.comU1, '(' + raleio.textoU1 + ')',
    '| without u1:', raleio.semU1, '| leaf gap x' + raleio.razaoVao, 'and value x' + raleio.razaoValor, 'by chapter 3');
  if (raleio.comU1 > 2) errors.push('holding with u1 still piles up floats: got ' + raleio.comU1);
  if (raleio.semU1 < 8) errors.push('without u1 each tap must keep its own float: got ' + raleio.semU1);
  if (raleio.razaoVao < 1.7 || raleio.razaoVao > 2.3) errors.push('leaf gap in chapter 3 is not ~2x chapter 1: ' + raleio.razaoVao);
  if (Math.abs(raleio.razaoValor - raleio.razaoVao) > 0.35) errors.push('leaf value does not compensate the thinner forest');

  // ---- how much of a trouble is left, and how much there was to begin with ----
  // The damage was always there; nothing ever showed it. Two things are checked: the
  // spread between the little one and the big one is wide enough to feel, and the readout
  // actually puts pixels on the screen over the right head.
  const vida = await page.evaluate(async () => {
    // O CAPITULO FICA FIXO AQUI, e isto derrubou uma tentativa inteira (PENDENTES 20.1): este
    // bloco rodava no capitulo em que o teste estivesse naquele instante, entao toda pergunta
    // do tipo "este capitulo tem verbo?" respondia sobre outro. Mesma doenca do
    // medir-acompanhar.js, que media O CAIS achando que media SALVADOR por indice fixo.
    const cenarioDaVida = S.cenario;
    S.cenario = cenarioDaEpoca(0);
    mobs.length = 0; drops.length = 0; chamada = null; mutiraoT = 0; superT = 0; superCarga = 0; superSwings = 0; superCd = 0; superFx = null;
    const hp = {}, golpes = {};
    for (const t of ['smog', 'cash', 'barrel']) {
      hp[t] = novoMob(t, 0).hp;
      // hits from the button: the 3-hit combo deals 1, 1, 2
      let restante = hp[t], n = 0, c = 0;
      while (restante > 0) { restante -= (c % 3 === 2) ? 2 : 1; c++; n++; }
      golpes[t] = n;
    }
    // A LEITURA DO ALCANCE — POR DIFERENCA, e nao por alfa absoluto (17/08).
    // MEDIDO antes de mexer, que e o passo que faltou nas duas tentativas anteriores: a faixa do
    // CHAO tem 96 pixels pintados SEMPRE (andando, parada, intacta, alcancada) porque ali mora a
    // SOMBRA DE CONTATO. Assercao de "intacto nao desenha nada" amostrada no chao mede sombra e
    // reprova por construcao. A sombra e constante, logo toda DIFERENCA entre dois estados e o
    // anel — e e assim que se le o progresso onde ha verbo.
    // A barra de vida, por sua vez, passa a ser cobrada pela AUSENCIA: §2.2 nao admite barra de
    // aflicao sobre gente, entao em capitulo com verbo ela tem de estar em ZERO nos dois estados.
    mobs.length = 0;
    const comVerbo = capFila() || capPalavra();
    const m = novoMob('barrel', worldX + HX + 40);
    m.parado = true; m.espera = 9; mobs.push(m);
    const sxm = Math.round(m.wx - worldX) + 5;
    const xBarra = sxm - ((m.hpMax * 3 - 1) >> 1);
    const leiaBarra = () => Array.from(cx.getImageData(xBarra, GROUND - VIDA_TOPO.barrel, m.hpMax * 3 - 1, 3).data);
    const leia = () => Array.from(cx.getImageData(Math.max(0, sxm - 16), GROUND - 6, 32, 8).data);
    drawScene(); desenharMundo();
    const cheio = leia(), barraIntacta = leiaBarra();
    if (comVerbo) m.acolhida = ACOLHER_SEG * 0.75; else m.hp = 1;
    drawScene(); desenharMundo();
    const ferido = leia(), barraAlcancada = leiaBarra();
    const temAlfa = (a) => a.some((v, i) => i % 4 === 3 && v > 0);
    mobs.length = 0;
    // Regra nova (usabilidade, achado 1): a barra INTACTA não desenha nada — vazia ela era
    // um retângulo preto pousado sobre cada coisa que chega. Só depois do primeiro alcance
    // ela existe. Então: cheio tem que estar LIMPO, ferido tem que ter pixels.
    // O `mobs.length = 0` acima não basta: DROPS e partículas de rodadas anteriores podem
    // estar vivos e pintar na faixa amostrada, e aí o teste acusa barra onde não há barra.
    // Custou um FALSO VERMELHO na main (07/08) — a faixa é estreita, qualquer coisa nela
    // mente. Limpa-se o mundo inteiro antes de medir.
    drops.length = 0; folhas.length = 0; parts.length = 0; floats.length = 0;
    drawScene(); desenharMundo();
    S.cenario = cenarioDaVida;
    return { hp, golpes, comVerbo,
      // CADA ESTADO LE A PROPRIA SUPERFICIE, e confundir as duas custou uma tentativa: sem
      // verbo o alcance mora na BARRA (GROUND - VIDA_TOPO), com verbo mora no ANEL (o chao).
      // Medir o chao num capitulo sem verbo nao acusa mudanca nenhuma — a barra mudou, o chao
      // nao. A sombra e constante nos dois casos, entao a diferenca e sempre o sinal.
      mudou: comVerbo
        ? cheio.some((v, i) => v !== ferido[i])
        : barraIntacta.some((v, i) => v !== barraAlcancada[i]),
      // com verbo, a barra de aflicao NAO pode existir; sem verbo, a regra antiga vale.
      // A AUSENCIA DA BARRA E ESTRUTURAL, e nao amostra de pixel — e a razao e geometrica:
      // gente mede 42px e o objeto 17 a 24, entao a faixa da barra (GROUND - VIDA_TOPO) cai
      // DENTRO DO CORPO da pessoa. Contar alfa ali mede o torso dela, nao a barra. O que
      // garante a ausencia e `pessoaNaRua()`, a mesma porta que ja governa pisca, estilhaco e
      // empurrao — entao e ela que se cobra. (O bloco de SALVADOR cobra os outros tres.)
      cheioLimpo: comVerbo ? pessoaNaRua() : !temAlfa(barraIntacta),
      pintou: comVerbo ? ferido.some((v, i) => i % 4 === 3 && v > 0) : temAlfa(barraAlcancada) };
  });
  console.log('trouble health -> smog', vida.hp.smog, 'hits', vida.golpes.smog,
    '| cash', vida.hp.cash, 'hits', vida.golpes.cash,
    '| barrel', vida.hp.barrel, 'hits', vida.golpes.barrel);
  console.log('  health readout drawn:', vida.pintou, '| it changes when damaged:', vida.mudou);
  if (!(vida.hp.barrel >= vida.hp.smog + 3)) errors.push('big and small troubles do not differ enough');
  if (!(vida.golpes.barrel > vida.golpes.cash && vida.golpes.cash > vida.golpes.smog)) {
    errors.push('the three troubles do not take different numbers of hits');
  }
  // The cap was 6 back when the button was the only thing that swung. A jump lands a blow
  // too now, so the owner raised health across the board; the guard still exists to stop an
  // arms race, just at the new scale.
  if (vida.hp.barrel > 24) errors.push('the health spread grew into a damage system');
  if (!vida.pintou) errors.push('the health readout drew nothing');
  if (!vida.cheioLimpo) errors.push('an untouched trouble is drawing an empty bar again');
  if (!vida.mudou) errors.push('the health readout does not change when a trouble is damaged');

  // ---- troubles walk in, block the work, and pay when they are cleared ----
  const encontro = await page.evaluate(async () => {
    mobs.length = 0; drops.length = 0; chamada = null; mutiraoT = 0;
    S.geradores = 10; S.poluicao = 0; S.modo = 'limpo';
    mobs.push(novoMob('smog', worldX + W + 12));
    const alvo = mobs[0];
    const longe = alvo.wx - worldX;
    let passouPorEla = false;
    const chegadas = [];
    let antesN = mobs.length;
    for (let i = 0; i < 1200; i++) {                   // 60s of street: enough gaps to judge
      atualizarMobs(0.05);
      if (mobs.length > antesN) chegadas.push(i * 0.05);
      antesN = mobs.length;
      if (alvo.wx - worldX < HX - 10) passouPorEla = true;
    }
    const sumiu = mobs.indexOf(alvo) < 0;
    const parados = mobs.filter(m => m.parado).length;
    // gaps between arrivals must not all be identical, or the street has a metronome in it
    const vaos = chegadas.slice(1).map((t, i) => +(t - chegadas[i]).toFixed(2));
    // with random gaps a short window can yield a single gap, which says nothing — judge only
    // once there are at least three of them
    const variados = vaos.length < 3 || new Set(vaos).size > 1;
    return { longe, passouPorEla, sumiu, parados, nChegadas: chegadas.length, vaos, variados };
  });
  console.log('a trouble walks the street -> from x', Math.round(encontro.longe),
    '| walked past her:', encontro.passouPorEla, '| left the frame:', encontro.sumiu,
    '| arrivals in 60s:', encontro.nChegadas, '| gaps:', JSON.stringify(encontro.vaos));
  if (!encontro.passouPorEla) errors.push('the trouble never walked past the hero');
  if (!encontro.sumiu) errors.push('the trouble never left the frame');
  // Parar deixou de ser bug e virou a MECANICA: o que chega espera um tempo pedindo ajuda, e
  // alcançar a tempo e o verbo do jogo. Esta asserção nasceu quando eles so passavam reto.
  // O que continua tendo que valer e que ninguem fica preso para sempre — por isso as duas
  // asserções acima, de que passa pela heroina e sai do quadro, seguem de pe.
  if (encontro.nChegadas < 4) errors.push('too few troubles showed up in 60s');
  if (!encontro.variados) errors.push('the gaps between arrivals are all identical');


  // ---- A RUA E LUGAR, NAO RELOGIO ----
  // Chegadas e folhas nascem por DISTANCIA percorrida. E isso, e so isso, que faz correr
  // significar alguma coisa: quem corre atravessa o dobro de rua e encontra o dobro de gente,
  // com metade do tempo para cada uma. Enquanto isso nascia de um cronometro, correr encontrava
  // exatamente a mesma gente em metade do tempo — desvantagem pura, 3% de diferenca de renda
  // medida, um dos tres botoes do jogo sem funcao. Se alguem devolver o spawn para o relogio,
  // a escolha morre em silencio e nada mais no teste percebe. Por isso esta asserção existe.
  const chao = await page.evaluate(() => {
    const conta = function (modo, segundos) {
      S.modo = modo; mobs.length = 0; folhas.length = 0;
      mobChao = 0; proximoMob = -1; folhaChao = 0; proximaFolha = -1;
      let mob = 0, folha = 0, px = 0;
      for (let i = 0; i < segundos * 60; i++) {
        const a = mobs.length, b = folhas.length;
        atualizarMobs(1 / 60);
        atualizarFolhas(1 / 60, 0);
        if (mobs.length > a) mob++;
        if (folhas.length > b) folha++;
        mobs.length = 0; folhas.length = 0;   // so o vao entre chegadas interessa aqui
        const v = velocidadeMundo();
        px += v / 60; worldX += v / 60;
      }
      return { mob: mob, folha: folha, px: Math.round(px) };
    };
    const andando = conta('limpo', 300), correndo = conta('carvao', 300);
    S.modo = 'limpo'; mobs.length = 0; folhas.length = 0;
    return { andando: andando, correndo: correndo,
      razaoMob: +(correndo.mob / andando.mob).toFixed(2),
      razaoFolha: +(correndo.folha / andando.folha).toFixed(2),
      razaoPx: +(correndo.px / andando.px).toFixed(2) };
  });
  console.log('the road is a place -> walking', chao.andando.mob, 'arrivals /', chao.andando.folha,
    'leaves in', chao.andando.px, 'px | running', chao.correndo.mob, '/', chao.correndo.folha,
    'in', chao.correndo.px, 'px | ratios', chao.razaoMob, chao.razaoFolha, '(ground', chao.razaoPx + ')');
  // ATE 15/08 a razao era EXATAMENTE 2: correr era a caminhada com a cadencia dobrada. Com as
  // folhas de corrida aprovadas a razao passou a vir da ARTE (passoCorrer/telaCorrer), entao o
  // contrato novo e: o chao coberto correndo bate com o que PASSO_CAP promete, com 2% de folga.
  const esperado = await page.evaluate(() => {
    const c = PASSO_CAP[0];
    return (c.passoCorrer * 60 / c.telaCorrer) / (c.passo * 60 / c.tela);
  });
  if (Math.abs(chao.razaoPx - esperado) > 0.04)
    errors.push('running ground ratio ' + chao.razaoPx + ' does not match the art (' + esperado.toFixed(3) + ')');
  if (chao.razaoMob < 1.6) errors.push('running does not meet more arrivals than walking: the road is back on a clock');
  if (chao.razaoFolha < 1.6) errors.push('running does not pass more leaves than walking: the forest is back on a clock');
  if (chao.andando.mob / (chao.andando.px / 60) > 1.6 || chao.andando.mob / (chao.andando.px / 60) < 0.6) {
    errors.push('the walking street changed density: it must stay the street it always was');
  }

  // ...e uma chegada ja alcancada nao pode ser alcancada duas vezes. `dying` zera em drawMobs e
  // quem varre `dead` e atualizarMobs no quadro seguinte; o relogio do segurar (145 ms) nao e o
  // do quadro, entao um toque cai nessa fresta. Media medida: 19 alcances para 17 pessoas.
  const duplo = await page.evaluate(() => {
    mobs.length = 0; drops.length = 0;
    S.cuidado = 0.5;
    const m = novoMob('smog', worldX + HX + 20);
    m.hp = 0; m.dying = 0; m.dead = true;      // a fresta, reproduzida na mao
    mobs.push(m);
    const antes = S.cuidado, nDrops = drops.length;
    clicar();
    const r = { mexeu: S.cuidado !== antes, drop: drops.length - nDrops };
    mobs.length = 0; drops.length = 0; S.cuidado = 1; cuidadoVisto = 1;
    return r;
  });
  console.log('an arrival already reached -> counted again:', duplo.mexeu, '| dropped again:', duplo.drop);
  if (duplo.mexeu) errors.push('the same arrival was counted as reached twice');
  if (duplo.drop) errors.push('the same arrival dropped twice');

  // ---- SALVADOR: ALCANCAR E LEVAR PALAVRA ----
  // A abertura do capitulo 3 promete um verbo — "quem voce alcanca passa a saber o que precisa
  // saber" — e ate este sprint a mao nao o fazia: SALVADOR jogava byte a byte como o capitulo 1
  // (31,2 impacto/s contra 24,35 de PALMARES, medido pelo PM). Este bloco e o que prova que a
  // promessa virou mecanica, e ele falha se o verbo regredir para "bater ate sumir".
  //
  // Tres contratos, e cada um cai por um motivo diferente:
  //   1. QUEM E ALCANCADA NAO SE DISSIPA — vira portadora, e o estado PERSISTE enquanto ela
  //      estiver em quadro. Se alguem devolver `m.dying = 8` ao capitulo, a persistencia cai.
  //   2. A PALAVRA CORRE SEM O DEDO — depois do ULTIMO toque, mais gente e atendida, e o
  //      cuidado do mundo responde a isso igual ao que responde ao dedo.
  //   3. NADA DISSO E COMBATE — sem pisca branco e sem empurrao sobre pessoa (§2).
  const palavra = await page.evaluate(async () => {
    const cenarioAntes = S.cenario, cuidadoAntes = S.cuidado;
    // POR IDENTIDADE, nunca por posicao: SALVADOR deixou de ser a epoca 2 no dia em que os
    // capitulos em obra entraram na cronologia (O CAIS vem antes dele). `CAP_PALAVRA` e o
    // proprio motor dizendo qual capitulo tem a corrente.
    S.cenario = cenarioDaEpoca(CAP_PALAVRA);          // SALVADOR
    mobs.length = 0; drops.length = 0; parts.length = 0;
    palavraDedo = 0; palavraCorrente = 0;
    S.cuidado = 0.5; cuidadoVisto = 0.5;
    // Uma ao alcance da mao e duas fora dele: as duas de fora so podem ser atendidas pela
    // corrente. Todas ESPERANDO, que e a unica condicao para receber a palavra.
    [30, 90, 130].forEach(function (dx) {
      const m = novoMob('smog', worldX + HX + dx);
      m.parado = true; m.espera = 999;
      mobs.push(m);
    });
    const primeira = mobs[0];
    proximoMob = 1e9;                               // ninguem novo chega durante a medida
    let toques = 0, piscou = false, empurrou = false;
    const wx0 = primeira.wx;
    // ===== UM TOQUE, E O RESTO E TEMPO ANDANDO =====
    // Este laco era `while (primeira.hp > 0 && toques < 40) clicar()` — a forma exata da
    // divida de §2 que o capitulo carregava: bater ate a pessoa ceder. Agora o toque ABRE
    // conversa e ela so anda ANDANDO, entao o teste anda: um toque, e o mundo rodando ate a
    // palavra passar. O `toques` continua sendo contado e a assercao nova cobra que ele
    // seja UM — se um dia voltar a precisar de dois, alguem reintroduziu o dano.
    S.modo = 'limpo';
    clicar(false, true, true);
    toques++;
    if (primeira.flash > 0) piscou = true;
    if (primeira.wx > wx0) empurrou = true;
    // 3 s de relogio, quase o dobro do CONVERSA_SEG de 1,6 — margem de aritmetica, nao de
    // chute (a licao da assercao intermitente do encaixe 9).
    for (let i = 0; i < 180 && !primeira.sabe; i++) {
      atualizarMobs(1 / 60);
      if (primeira.flash > 0) piscou = true;
      if (primeira.wx > wx0) empurrou = true;
    }
    const virouPortadora = !!primeira.sabe && !primeira.dying && !primeira.dead;
    const dedoAoFim = palavraDedo;
    const correnteAntes = palavraCorrente;
    const cuidadoAposDedo = S.cuidado;
    // A PARTIR DAQUI NINGUEM TOCA EM NADA. So o mundo andando.
    let quadrosEmQuadro = 0, sabePersistiu = true;
    for (let i = 0; i < 600; i++) {
      atualizarMobs(1 / 60);
      atualizarDrops(1 / 60);
      worldX += velocidadeMundo() / 60;
      if (mobs.indexOf(primeira) >= 0) {
        quadrosEmQuadro++;
        if (!primeira.sabe) sabePersistiu = false;
      }
    }
    // ===== E CORRENDO A CONVERSA CONGELA =====
    // Vem DEPOIS da observacao da corrente, e a ordem e o conserto: na primeira versao este
    // bloco gastava 180 quadros ANTES dela, e quando a observacao comecava a portadora ja
    // tinha saido de quadro — "0 quadros" e "0 atendidas pela corrente" com a corrente
    // funcionando perfeitamente. Teste que consome o mundo que outro teste vai medir mede o
    // proprio rastro.
    mobs.length = 0; drops.length = 0;
    const emCorrida = novoMob('smog', worldX + HX + 20);
    emCorrida.parado = true; emCorrida.espera = 999;
    mobs.push(emCorrida);
    S.modo = 'carvao';
    clicar(false, true, true);
    const conversaAoAbrir = emCorrida.conversa || 0;
    for (let i = 0; i < 180; i++) atualizarMobs(1 / 60);
    const congelouCorrendo = conversaAoAbrir > 0 && !emCorrida.sabe
      && (emCorrida.conversa || 0) === conversaAoAbrir;
    S.modo = 'limpo';

    const r = {
      congelouCorrendo: congelouCorrendo,
      toques: toques, virouPortadora: virouPortadora, piscou: piscou, empurrou: empurrou,
      dedo: dedoAoFim, corrente: palavraCorrente - correnteAntes,
      quadrosEmQuadro: quadrosEmQuadro, sabePersistiu: sabePersistiu,
      cuidadoSubiuComDedo: S.cuidado > 0.5 && cuidadoAposDedo > 0.5,
      cuidadoSubiuSemDedo: S.cuidado > cuidadoAposDedo
    };
    // ...e fora de SALVADOR nada disto existe: o capitulo 1 continua dissipando o que passa.
    S.cenario = cenarioDaEpoca(0);
    mobs.length = 0; drops.length = 0;
    const outro = novoMob('smog', worldX + HX + 20);
    outro.hp = 1; outro.parado = true; outro.espera = 9; mobs.push(outro);
    clicar(false, true, true);
    r.vazouParaOCap1 = !!outro.sabe;
    // O CAPITULO 1 CONTINUA RESOLVENDO O QUE PASSA — mas pelo VERBO dele desde 17/08, e nao
    // por dano: um toque abre, o tempo ao lado resolve. Deixar esse tempo correr e a unica
    // diferenca; a assercao continua cobrando a MESMA coisa, que e a rua nao encher.
    for (let i = 0; i < 300 && !(outro.dying > 0 || outro.dead) && !drops.length; i++) atualizarMobs(0.05);
    r.dissipaNoCap1 = outro.dying > 0 || outro.dead || drops.length > 0;
    S.cenario = cenarioAntes; S.cuidado = cuidadoAntes; cuidadoVisto = cuidadoAntes;
    mobs.length = 0; drops.length = 0; parts.length = 0;
    proximoMob = -1; mobChao = 0;
    return r;
  });
  console.log('Salvador -> reaching turns her into a carrier:', palavra.virouPortadora,
    'in', palavra.toques, 'taps | the word travelled with no finger:', palavra.corrente,
    'more attended | she stayed on screen', palavra.quadrosEmQuadro, 'frames, state held:',
    palavra.sabePersistiu);
  console.log('  care answers the chain:', palavra.cuidadoSubiuSemDedo,
    '| no combat grammar on a person -> flash:', palavra.piscou, 'shove:', palavra.empurrou,
    '| chapter 1 untouched -> dissipates:', palavra.dissipaNoCap1, 'leaked:', palavra.vazouParaOCap1);
  console.log('  ACOMPANHAR -> taps to attend one person:', palavra.toques,
    '| running freezes the conversation:', palavra.congelouCorrendo);
  if (!palavra.virouPortadora) errors.push('reaching someone in Salvador no longer turns her into a carrier');
  // A DIVIDA DE §2, agora com assercao: um toque abre a conversa e e o unico que a mao da.
  // Era 5 a 13 toques (`m.hp -= dmg`) — a forma de bater por baixo com nome novo por cima.
  if (palavra.toques !== 1) errors.push('attending a person in Salvador took ' + palavra.toques + ' taps, not 1 — the damage path is back');
  // E o ritmo continua decidindo: correndo, a conversa nao anda.
  if (!palavra.congelouCorrendo) errors.push('the conversation advances while running — the chapter lost its only decision');
  if (!(palavra.quadrosEmQuadro > 60 && palavra.sabePersistiu)) {
    errors.push('the carrier state does not persist while she is on screen');
  }
  if (!(palavra.corrente >= 1)) errors.push('the word no longer travels without the player: the chain is broken');
  if (!(palavra.dedo + palavra.corrente >= 2)) errors.push('one reach in Salvador attends fewer than two people');
  if (!palavra.cuidadoSubiuSemDedo) errors.push('an attendance by the chain does not move S.cuidado');
  if (palavra.piscou) errors.push('a person in Salvador is drawing the white hit-flash (§2)');
  if (palavra.empurrou) errors.push('a person in Salvador is being shoved back by a blow (§2)');
  if (palavra.vazouParaOCap1) errors.push('the carrier state leaked out of Salvador');
  if (!palavra.dissipaNoCap1) errors.push('chapter 1 stopped dissipating what crosses the street');

  // clearing one leaves a drop; the drop is picked up with a tap on the world
  const recolha = await page.evaluate(async () => {
    drops.length = 0;
    // they walk past now instead of parking, so put one within reach on purpose
    mobs.length = 0;
    mobs.push(novoMob('smog', worldX + HX + 40));
    const m = mobs[0];
    const sx = m.wx - worldX;
    const r = document.getElementById('scene').getBoundingClientRect();
    const paraCliente = (x, y) => ({ x: r.left + x / W * r.width, y: r.top + y / H * r.height });
    const alvo = paraCliente(sx + 5, GROUND - 12);
    const cv = document.getElementById('scene');
    // the world is the jump surface now, so swinging is done on the button
    // troubles have four times the health they used to, and the leap only lands every fifth
    // swing, so it takes a good few more taps to see one off
    // UM TOQUE ABRE, O TEMPO RESOLVE. Eram 24 toques ate o hp zerar; com o verbo do capitulo 1
    // o toque abre e o relogio ao lado conclui. O que se cobra nao mudou: que o mundo responda
    // com um drop no chao.
    m.parado = true; m.espera = 9;
    clicar();
    for (let i = 0; i < 300 && !drops.length && mobs.length && !mobs[0].dying; i++) atualizarMobs(0.05);
    const nDrops = drops.length, oDrop = drops[0], valor = oDrop ? oDrop.valor : 0;
    const antes = S.energiaTotal;
    // a drop comes off the ground when she walks over it — the world tap is a jump now
    for (let i = 0; i < 200 && drops.indexOf(oDrop) >= 0; i++) { worldX += 2; atualizarDrops(0.05); }
    // the swing that comes with the tap can fell another trouble, so check *this* drop
    return { nDrops, valor, ganho: S.energiaTotal - antes, saiu: drops.indexOf(oDrop) < 0 };
  });
  console.log('aimed taps -> drops left:', recolha.nDrops, 'worth', recolha.valor.toFixed(1),
    '| picking one up paid', recolha.ganho.toFixed(1), '| taken off the ground:', recolha.saiu);
  if (recolha.nDrops < 1) errors.push('beating a trouble left no drop');
  if (recolha.ganho < recolha.valor - 1e-9) errors.push('picking up a drop paid nothing');
  if (!recolha.saiu) errors.push('the drop was not taken off the ground');
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-mundo.png') });

  // ---- the resource layer: a drop leaves a resource of its kind, and the hero picks up a
  // drop just by running over it (full value + a resource), the same as an aimed tap ----
  const recursos = await page.evaluate(async () => {
    mobs.length = 0; drops.length = 0; chamada = null; mutiraoT = 0; superT = 0; superCarga = 0; superSwings = 0; superCd = 0; superFx = null;
    S.geradores = 10; S.poluicao = 0; S.recursos = { flor: 0, agua: 0, refeicao: 0 };
    // each trouble type maps to one resource: smog->flower, barrel->water, cash->meal
    const tipos = [['smog', 'flor'], ['barrel', 'agua'], ['cash', 'refeicao']];
    const porTipo = {};
    tipos.forEach(([t, r]) => {
      drops.length = 0; const antes = S.recursos[r];
      soltarDrop({ type: t }, 40);
      coletarDrop(drops[0], false);
      porTipo[t] = { recurso: r, ganhou: S.recursos[r] - antes };
    });
    // pass-over: a drop sitting at/behind the hero's x is collected by atualizarDrops alone,
    // with no tap — full value and a resource, and it comes off the ground
    S.recursos = { flor: 0, agua: 0, refeicao: 0 }; drops.length = 0; S.u4 = false;
    drops.push({ wx: worldX + HX + 4, type: 'cash', t: 0,
      valor: (CFG.dropBase + CFG.dropPorProjeto * S.geradores) });
    const d = drops[0], impAntes = S.energiaTotal, valor = d.valor;
    atualizarDrops(0.05);
    const passou = { pago: S.energiaTotal - impAntes, valor, saiu: drops.indexOf(d) < 0,
      recurso: S.recursos.refeicao };
    // a drop still ahead of the hero is NOT collected by pass-over yet
    drops.length = 0;
    drops.push({ wx: worldX + HX + 60, type: 'smog', t: 0, valor: 5 });
    const dAhead = drops[0]; atualizarDrops(0.05);
    passou.aindaLa = drops.indexOf(dAhead) >= 0;
    S.recursos = { flor: 0, agua: 0, refeicao: 0 }; drops.length = 0;
    return { porTipo, passou };
  });
  console.log('resources -> smog +' + recursos.porTipo.smog.ganhou + recursos.porTipo.smog.recurso,
    '| barrel +' + recursos.porTipo.barrel.ganhou + recursos.porTipo.barrel.recurso,
    '| cash +' + recursos.porTipo.cash.ganhou + recursos.porTipo.cash.recurso);
  console.log('  pass-over -> paid', recursos.passou.pago.toFixed(1), 'of', recursos.passou.valor.toFixed(1),
    '| off the ground:', recursos.passou.saiu, '| meal +' + recursos.passou.recurso,
    '| a drop still ahead stays:', recursos.passou.aindaLa);
  if (recursos.porTipo.smog.ganhou !== 1 || recursos.porTipo.smog.recurso !== 'flor') errors.push('smog did not leave a flower');
  if (recursos.porTipo.barrel.ganhou !== 1 || recursos.porTipo.barrel.recurso !== 'agua') errors.push('barrel did not leave water');
  if (recursos.porTipo.cash.ganhou !== 1 || recursos.porTipo.cash.recurso !== 'refeicao') errors.push('cash did not leave a meal');
  if (recursos.passou.pago < recursos.passou.valor - 1e-9) errors.push('pass-over collection did not pay full value');
  if (!recursos.passou.saiu) errors.push('a passed-over drop was not taken off the ground');
  if (recursos.passou.recurso !== 1) errors.push('pass-over collection left no resource');
  if (!recursos.passou.aindaLa) errors.push('a drop still ahead of the hero was collected too early');

  // obsolete: special projects removed by owner request — feature and test.
  // obsolete: the community call was removed by owner request — feature and test.
  // obsolete: the AUTO-FIRE skill was removed by owner request — feature and test.
  // ---- coming back on another day is worth something ----
  // O registro semeado esta no formato ANTIGO (lista de datas) de proposito: prova a
  // migracao para a contagem compacta do T1 no mesmo teste que prova o bonus de dias.
  const dias = await page.evaluate(() => {
    localStorage.setItem('jogo_brasil_retencao',
      JSON.stringify({ dias: ['2026-07-30', '2026-07-31', '2026-08-01'], segundos: 900, tochas: 0 }));
    R = RET_PADRAO();
    diaNovo = false;
    carregarRetencao();
    return { n: R.dias, bonus: bonusDias(), novo: diaNovo, primeiro: R.primeiro, ultimo: R.ultimo };
  });
  console.log('day streak ->', dias.n, 'days | bonus ×' + dias.bonus.toFixed(2), '| new day:', dias.novo);
  if (dias.n !== 4) errors.push('the new day was not recorded');
  if (Math.abs(dias.bonus - 1.06) > 1e-9) errors.push('the day bonus is not what CFG says');
  if (!dias.novo) errors.push('coming back on a new day was not noticed');
  if (dias.primeiro !== '2026-07-30') errors.push('the old-format record lost its first day: ' + dias.primeiro);
  if (!/^\d{4}-\d\d-\d\d$/.test(dias.ultimo)) errors.push('the last day is not a date: ' + dias.ultimo);
  await page.evaluate(() => {
    localStorage.removeItem('jogo_brasil_retencao');
    R = RET_PADRAO(); carregarRetencao();
    mobs.length = 0; drops.length = 0; chamada = null; mutiraoT = 0; superT = 0; superCarga = 0; superSwings = 0; superCd = 0; superFx = null;
    S.geradores = 0; S.poluicao = 0; S.modo = 'carvao';
    // the torch used to wipe these; it is a no-op now, so the test resets them itself
    S.u1 = S.u2 = S.u3 = false;
  });

  // every upgrade buyable and applied
  await page.evaluate(() => { S.energia = 999999; desenhar(); });
  await page.tap('#openUpgrades');
  await page.waitForTimeout(350);
  for (const id of ['btnU1', 'btnU2', 'btnU3']) {
    await page.tap('#' + id);
    await page.waitForTimeout(80);
  }
  const st = await page.evaluate(() => ({ u: [S.u1, S.u2, S.u3], tap: ganhoClique() }));
  console.log('upgrades owned:', st.u.join(','), '| tap gain:', st.tap.toFixed(2));
  if (st.u.some(v => !v)) errors.push('some upgrade did not apply');

  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-upgrades.png') });
  await page.evaluate(() => fecharTudo());   // the close X moved onto the card below
  await page.waitForTimeout(400);

  // ---- o card do ritmo, CLICADO ----
  // Este bloco existe por causa de um bug que passou meses vivo: definirModo() lia quatro
  // identificadores que não existiam e estourava ReferenceError em todo clique, nos dois
  // sentidos. Nada pegou porque todo teste que mexia em ritmo escrevia `S.modo` direto.
  // Escrever no estado prova a fórmula; só o clique prova o botão. Um dos três botões do
  // jogo estava quebrado e o teste dizia PASS.
  const erros0 = errors.length;
  const antesModo = await page.evaluate(() => S.modo);
  await page.tap('#modeQuick');
  await page.waitForTimeout(120);
  const meioModo = await page.evaluate(() => S.modo);
  await page.tap('#modeQuick');
  await page.waitForTimeout(120);
  const fimModo = await page.evaluate(() => ({ modo: S.modo, rotulo: document.getElementById('modeNome').textContent }));
  console.log('rhythm card tapped ->', antesModo, '->', meioModo, '->', fimModo.modo, '| label:', fimModo.rotulo);
  if (meioModo === antesModo) errors.push('tapping the rhythm card did not change the mode');
  if (fimModo.modo !== antesModo) errors.push('tapping the rhythm card twice did not come back');
  if (errors.length > erros0) errors.push('the rhythm card threw while being tapped');

  // third hit must be a leap: hero leaves the ground, then a shockwave appears
  const mid = await page.evaluate(() => { combo = 2; S.energiaTotal = 30000; mobs.length = 0; shocks.length = 0; clicar(); return jumpT; });
// obsolete:   if (mid <= 0) errors.push('third hit did not leap');
  // hold him at the top of the arc for the screenshot
  await page.evaluate(() => new Promise(r => { jumpT = Math.round(JUMPF * 0.55); attackT = jumpT; requestAnimationFrame(() => r()); }));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-jump.png') });
  // land it deterministically, then grab the exact impact frame and one mid-wave frame
  await page.evaluate(() => new Promise(r => {
    jumpT = 1;
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  }));
  const land = await page.evaluate(() => ({ j: jumpT, s: shocks.length, t: shocks[0] && shocks[0].t }));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-slam.png') });
  await page.evaluate(() => new Promise(r => { shocks.forEach(s => s.t = 11); requestAnimationFrame(() => r()); }));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-wave.png') });
  console.log('leap -> jumpT mid:', mid, '| after landing jumpT:', land.j, 'shockwaves:', land.s);
// obsolete:   if (land.s < 1) errors.push('slam produced no shockwave');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-game.png') });

  // obsolete: the retention panel and the torch long-press were removed by owner request.
  // obsolete: torch, epilogue and the wall removed by owner request — feature and test.
  // obsolete: chapter cards were removed by owner request — feature and test.
  // ---- the hard rule: no authored fiction string may contain a digit, ever, so a line
  // can never be mistaken for the sourced REAL DATA banner ----
  const digitos = await page.evaluate(() => {
    const s = [];
    TEXTOS.forEach(v => s.push(v));   // todo texto autoral do jogo vive numa lista só
    return { total: s.length, ruins: s.filter(x => /[0-9]/.test(x)) };
  });
  console.log('fiction strings checked for digits ->', digitos.total, '| with a digit:', digitos.ruins.length);
  if (digitos.ruins.length) errors.push('a fiction string contains a digit: ' + JSON.stringify(digitos.ruins));

  await page.evaluate(() => { localStorage.removeItem('jogo_brasil_muro'); MURO = []; });

  // ---- the save is untrusted input ----
  // localStorage can be edited by hand, by anything else that runs on this origin, and by
  // whatever the player pastes into a console. The loader reads it through a schema; this is
  // what proves it, because a game that trusts its save is a game anyone can break by typing.
  const adulterado = await page.evaluate(async () => {
    salvar = function () {};   // the unload handler would write live state over the seed
    localStorage.setItem(CHAVE_JOGO, JSON.stringify({
      energia: 'nao e um numero',        // wrong type
      energiaTotal: Infinity,            // not finite
      modo: 'sabotado',                  // outside the allowed set
      u1: 'sim', u2: 1, u3: true,        // truthy, but not booleans
      salvoEm: -5,                       // out of range
      camposInventados: { a: 1 },        // not on the schema at all
      geradores: 999                     // a field from a removed feature
    }));
    return true;
  });
  await page.reload();
  await page.waitForFunction(() => typeof S !== 'undefined');
  const depois = await page.evaluate(() => ({
    energia: S.energia, total: S.energiaTotal, modo: S.modo,
    u1: S.u1, u2: S.u2, u3: S.u3, salvoEm: S.salvoEm,
    inventado: 'camposInventados' in S, geradores: 'geradores' in S,
    ganho: ganhoClique(), desenhou: (desenhar(), true)
  }));
  console.log('tampered save ->', JSON.stringify(depois));
  if (typeof depois.energia !== 'number' || !isFinite(depois.energia)) errors.push('a string got into energia');
  if (!isFinite(depois.total)) errors.push('Infinity got into energiaTotal');
  if (depois.modo !== 'limpo' && depois.modo !== 'carvao') errors.push('an unknown rhythm was accepted');
  if (depois.u1 !== false || depois.u2 !== false) errors.push('a non-boolean was accepted as an upgrade');
  if (depois.u3 !== true) errors.push('a real boolean was rejected');
  if (depois.salvoEm < 0) errors.push('a negative timestamp was accepted');
  if (depois.inventado) errors.push('an unknown field was copied into the game state');
  if (depois.geradores) errors.push('a field from a removed feature was copied in');
  if (!isFinite(depois.ganho) || depois.ganho <= 0) errors.push('the tap gain went NaN after a tampered save');

  // and what it writes back carries only what it would read
  const gravado = await page.evaluate(() => {
    delete window.salvar;
    location.reload();
  }).catch(() => null);
  await page.waitForFunction(() => typeof S !== 'undefined');
  const chaves = await page.evaluate(() => {
    S.energia = 12; salvar();
    return Object.keys(JSON.parse(localStorage.getItem(CHAVE_JOGO))).sort();
  });
  console.log('save written ->', chaves.join(', '));
  // `som` e `grupo` sao estado PERSISTIDO: o interruptor de audio dos AJUSTES e o tamanho da
  // fila que anda com voce em Palmares. Esta lista e a copia INDEPENDENTE do ESQUEMA_SAVE, e e
  // ela que pega um campo gravado sem esquema — por isso nao se gera uma da outra.
  // `acolhidos` (uma posição por época) e `marcos` (bits das placas) entraram com
  // o protótipo travessia+lugar-vivo — cópia deliberada, atualizada JUNTO com o ESQUEMA_SAVE.
  // `marcosN` entrou em 11/08, quando as placas saíram do capítulo 2 e passaram a se derivar
  // da LINHA_TEMPO: guarda PARA QUANTOS marcos a máscara foi escrita, e é o que impede um
  // save antigo (bits 0,1,2 = Palmares) de calar as placas novas do capítulo 1.
  // `arco` entrou com SALVADOR: e o unico campo que existe para MIGRAR indices quando um
  // capitulo entra no MEIO da cronologia. Ver `migrarArco()` no src/jogo.ts.
  // `travessias` entrou com A TRAVESSIA (lote A do arco): um bit por trecho em que o jogo
  // para de ser jogo, e o que ele decide e uma coisa so — a primeira vez nao e pulavel.
  // `recursos` entrou em 09/08: os tres contadores de drop eram estado de SESSAO por
  // esquecimento — a fileira de nichos zerava no dia seguinte, e a onda 11 tornou a perda
  // visivel. Tipo `mapa`, chaves fixas, cada valor pela regua de `cont`.
  // `obra` entrou com o MUTIRAO e `marcosN` com as placas — no MESMO dia, de sessoes
  // diferentes, e cada uma escreveu esta lista sem a outra. A lista e copia INDEPENDENTE do
  // ESQUEMA_SAVE de proposito (gerar uma da outra deixaria de pegar campo gravado sem
  // esquema), e por isso ela e exatamente onde duas sessoes se atropelam. Ficam os dois.
  // `obraVista` entrou com a tela O LUGAR: e a fotografia da obra na ultima visita, e a unica
  // coisa que ela alimenta e a frase "o que cresceu desde a ultima vez". Mesma regua de `obra`.
  const esperadas = ['aberturas', 'acolhidos', 'arco', 'cenario', 'cuidado', 'energia', 'energiaTotal', 'fechos', 'fronteira', 'grupo', 'marcos', 'marcosN', 'modo', 'obra', 'obraVista', 'recursos', 'salvoEm', 'som', 'travessias', 'u1', 'u2', 'u3', 'u4'];
  if (chaves.join(',') !== esperadas.join(',')) errors.push('the save carries fields the loader would discard');

  // ---- A OBRA DO LUGAR: um save adulterado, e a promessa de que ela SO CRESCE ----
  // `obra` e o unico campo do jogo em que APARAR e o lado certo do erro (a obra nao multiplica
  // nada: no pior caso um save torto ganha cenario). O que nao pode e valor de outro tipo, chave
  // inventada, ou negativo — e o que MENOS pode e regredir num recarregamento, porque "cada
  // estagio fica de pe para sempre" e a trava estrutural contra a palicada chamar a guerra para
  // dentro da mecanica (§2 / MUTIRAO.md R4).
  const obraSuja = await page.evaluate(() => ({
    sujo: JSON.stringify(valida(ESQUEMA_SAVE.obra,
      { roca: 5e9, palicada: 'muitas', casa: -3, x: 9 })),
    max: OBRA_MAX, derivado: OBRA_PONTOS_ESTAGIO * OBRA_ESTAGIOS
  }));
  console.log('tampered obra ->', obraSuja.sujo, '| OBRA_MAX', obraSuja.max);
  if (obraSuja.sujo !== JSON.stringify({ roca: obraSuja.max, palicada: 0, casa: 0 }))
    errors.push('a tampered obra was accepted: ' + obraSuja.sujo);
  if (obraSuja.max !== obraSuja.derivado) errors.push('OBRA_MAX stopped being derived');

  const obraFirme = await page.evaluate(async () => {
    localStorage.setItem(CHAVE_JOGO, JSON.stringify({
      energia: 0, energiaTotal: 5800, cenario: 3, arco: ARCO_ATUAL,
      acolhidos: [0, 40, 0, 0], obra: { roca: 75, palicada: 62, casa: 61 },
      recursos: { flor: 0, agua: 0, refeicao: 0 }, salvoEm: Date.now() - 1000
    }));
    carregar(); fecharRetorno();
    const depois = JSON.stringify(S.obra);
    // ...e recarregar de novo nao pode fazer um ponto voltar
    salvar(); carregar(); fecharRetorno();
    return { depois, denovo: JSON.stringify(S.obra) };
  });
  console.log('obra reloaded ->', obraFirme.depois, '->', obraFirme.denovo);
  if (obraFirme.depois !== '{"roca":75,"palicada":62,"casa":61}')
    errors.push('the obra changed on a plain reload: ' + obraFirme.depois);
  if (obraFirme.denovo !== obraFirme.depois) errors.push('the obra regressed on reload: ' + obraFirme.denovo);

  // ---- ZERO ACOLHIDAS = ZERO AVANCO, e a gente nunca e consumida ----
  // As duas metades do §2 que este trabalho tem de sustentar, e as duas sao medidas: sem gente
  // nada avanca E nada e consumido (nao existe upkeep — ninguem "come o estoque"); com gente a
  // obra anda e nenhuma acolhida some, porque acolhida nao e recurso.
  const mutirao = await page.evaluate(() => {
    const rodar = (a, horas) => {
      S.obra = { roca: 0, palicada: 0, casa: 0 };
      S.recursos = { flor: 300, agua: 300, refeicao: 300 };
      S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = a;
      const r = avancarObra(Math.floor(horas * taxaMutirao(S.acolhidos[CAP_GENTE])));
      return { pontos: r.pontos, obra: S.obra.roca + S.obra.palicada + S.obra.casa,
        gente: S.acolhidos[CAP_GENTE],
        gasto: 900 - (S.recursos.flor + S.recursos.agua + S.recursos.refeicao) };
    };
    const semGente = rodar(0, 12);
    const comGente = rodar(40, 12);
    // e a taxa satura: 40 acolhidas e 9999 rendem o mesmo (gente nao e motor a escalar)
    return { semGente, comGente, t6: taxaMutirao(6), t30: taxaMutirao(30), tMuita: taxaMutirao(9999) };
  });
  console.log('mutirao -> sem gente', JSON.stringify(mutirao.semGente),
    '| com gente', JSON.stringify(mutirao.comGente),
    '| taxa 6/30/9999:', mutirao.t6, mutirao.t30, mutirao.tMuita);
  if (mutirao.semGente.pontos !== 0 || mutirao.semGente.obra !== 0)
    errors.push('the obra advanced with nobody welcomed: ' + JSON.stringify(mutirao.semGente));
  if (mutirao.semGente.gasto !== 0)
    errors.push('the obra ate supplies with nobody welcomed (that would be upkeep): ' + mutirao.semGente.gasto);
  if (mutirao.comGente.pontos <= 0) errors.push('the obra did not advance with people welcomed');
  if (mutirao.comGente.gente !== 40) errors.push('a welcomed person was consumed by the obra');
  if (mutirao.semGente.gente !== 0) errors.push('the obra invented people');
  if (mutirao.tMuita !== mutirao.t30) errors.push('the mutirao rate did not saturate at 30');

  // ---- A OBRA ESPERA MANTIMENTOS: sem estoque, os pontos congelam na fronteira da parcela ----
  const obraEspera = await page.evaluate(() => {
    S.obra = { roca: 0, palicada: 0, casa: 0 };
    S.recursos = { flor: 0, agua: 0, refeicao: 0 };
    S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = 40;
    const r = avancarObra(200);
    return { pontos: r.pontos, parouPor: r.parouPor, obra: JSON.stringify(S.obra),
      parcelas: r.parcelas };
  });
  console.log('obra with no supplies ->', JSON.stringify(obraEspera));
  if (obraEspera.parcelas !== 0) errors.push('a parcel was paid out of an empty larder');
  if (obraEspera.pontos !== 27) errors.push('the obra did not freeze at the parcel boundary: ' + obraEspera.pontos);
  if (!obraEspera.parouPor) errors.push('the obra froze without saying what ran out');


  // ---- o save de um ARCO ANTIGO nao pode teleportar ninguem ----
  // SALVADOR entrou no MEIO da cronologia, e o save guarda INDICES. Quem parou em HOJE no arco
  // de tres capitulos estava na cena 4; no arco de agora a cena 4 e 1835. Sem `migrarArco()`
  // essa pessoa acorda no capitulo errado, com a abertura dele ja marcada como lida — ou seja,
  // perde para sempre a fala que e a razao de o jogo existir. Isto aqui e o que prova que nao.
  const migrado = await page.evaluate(() => {
    localStorage.setItem(CHAVE_JOGO, JSON.stringify({
      energia: 100, energiaTotal: 9000, cenario: 4,   // cena 4 do arco 0 = HOJE
      aberturas: 7, fechos: 7, acolhidos: [3, 5, 9], salvoEm: 1
    }));
    carregar();
    return { arco: S.arco, epoca: EPOCAS[epocaAtual()].nome, aberturas: S.aberturas,
             acolhidos: S.acolhidos.slice(), salvador: EPOCAS.findIndex(e => e.nome === 'SALVADOR') };
  });
  console.log('old-arc save ->', JSON.stringify(migrado));
  if (migrado.epoca !== 'AINDA AQUI') errors.push('an old save woke up in the wrong chapter: ' + migrado.epoca);
  if (migrado.salvador >= 0 && (migrado.aberturas & (1 << migrado.salvador)))
    errors.push('an old save had the new chapter marked as already read');
  if (migrado.salvador >= 0 && migrado.acolhidos[migrado.salvador] !== 0)
    errors.push('people were teleported into a chapter that did not exist yet');
  if (migrado.acolhidos[migrado.acolhidos.length - 1] !== 9)
    errors.push('the last chapter lost the people it had welcomed');

  // ---- e os casos que a tabela por IDENTIDADE passou a ter de sustentar ----
  // A migracao deixou de ser duas listas de numeros escritas a mao e passou a casar `id` com
  // `id` entre a linha do arco velho e `EPOCAS` (ver ARCOS/migrarArco no src/jogo.ts). O que
  // se cobra aqui e o que essa mudanca promete: quem estava NO MEIO de um capitulo continua
  // no mesmo capitulo e no mesmo ponto dele, quem ja esta no arco de hoje nao e remexido, e
  // um `arco` fora da tabela nao derruba nada.
  const casos = await page.evaluate(() => {
    const rodar = (save) => {
      localStorage.setItem(CHAVE_JOGO, JSON.stringify(save));
      // `S` e reaproveitado entre chamadas de carregar(): zera-se o que a migracao le
      S.arco = ARCO_ATUAL; S.cenario = 0; S.aberturas = 0; S.fechos = 0;
      S.acolhidos = EPOCAS.map(() => 0);
      carregar();
      fecharRetorno();   // o save e velho de proposito, e o papel de volta abriria em cada caso
      return { arco: S.arco, cena: S.cenario, epoca: EPOCAS[epocaAtual()].nome,
        aberturas: S.aberturas, acolhidos: S.acolhidos.slice() };
    };
    return {
      // 1. arco 0, cena 2 = a PRIMEIRA cena de Palmares. Palmares continua sendo Palmares em
      //    todo arco, e o deslocamento dentro do capitulo (0) tem de sobreviver.
      meioDePalmares: rodar({ energia: 0, energiaTotal: 4000, cenario: 2,
        aberturas: 3, fechos: 1, acolhidos: [1, 4, 0], salvoEm: 1 }),
      // 2. arco 0, cena 3 = a SEGUNDA cena de Palmares. Mesmo capitulo, um degrau adiante.
      fimDePalmares: rodar({ energia: 0, energiaTotal: 5500, cenario: 3,
        aberturas: 3, fechos: 1, acolhidos: [1, 4, 0], salvoEm: 1 }),
      // 3. save ja do arco de hoje: a migracao nao pode encostar nele.
      jaAtual: rodar({ energia: 0, energiaTotal: 9000, cenario: 4, arco: ARCO_ATUAL,
        aberturas: 5, fechos: 1, acolhidos: [1, 2, 3, 4], salvoEm: 1 }),
      // 4. `arco` alto (adulterado, ou de uma versao futura): nada se migra e nada quebra.
      doFuturo: rodar({ energia: 0, energiaTotal: 3000, cenario: 1, arco: 9,
        aberturas: 1, fechos: 0, acolhidos: [7, 0, 0, 0], salvoEm: 1 }),
      // 5. `cenario` fora da faixa do arco velho: apara, nao explode.
      foraDaFaixa: rodar({ energia: 0, energiaTotal: 9000, cenario: 99,
        aberturas: 7, fechos: 7, acolhidos: [1, 2, 3], salvoEm: 1 }),
      cena0: EPOCAS.map((_, i) => cenarioDaEpoca(i)), nomes: EPOCAS.map(e => e.nome)
    };
  });
  console.log('arc migration by id ->', JSON.stringify({
    meio: casos.meioDePalmares.epoca + '@' + casos.meioDePalmares.cena,
    fim: casos.fimDePalmares.epoca + '@' + casos.fimDePalmares.cena,
    jaAtual: casos.jaAtual.epoca + '@' + casos.jaAtual.cena,
    futuro: casos.doFuturo.epoca + '@' + casos.doFuturo.cena,
    fora: casos.foraDaFaixa.epoca + '@' + casos.foraDaFaixa.cena }));
  const palmares = casos.nomes.indexOf('PALMARES');
  if (casos.meioDePalmares.epoca !== 'PALMARES' || casos.meioDePalmares.cena !== casos.cena0[palmares])
    errors.push('an old save mid-chapter did not land on the same chapter, same step: '
      + casos.meioDePalmares.epoca + '@' + casos.meioDePalmares.cena);
  if (casos.fimDePalmares.epoca !== 'PALMARES' || casos.fimDePalmares.cena !== casos.cena0[palmares] + 1)
    errors.push('the offset inside the chapter was lost by the migration: '
      + casos.fimDePalmares.epoca + '@' + casos.fimDePalmares.cena);
  if (casos.meioDePalmares.acolhidos[palmares] !== 4)
    errors.push('the welcomed people did not travel with their chapter');
  if (casos.jaAtual.cena !== 4 || casos.jaAtual.aberturas !== 5)
    errors.push('a save already on the current arc was migrated anyway: @'
      + casos.jaAtual.cena + ' aberturas ' + casos.jaAtual.aberturas);
  if (casos.doFuturo.arco !== 9 || casos.doFuturo.cena !== 1)
    errors.push('a save from an arc this build does not know was rewritten: @' + casos.doFuturo.cena);
  if (casos.foraDaFaixa.epoca !== 'AINDA AQUI')
    errors.push('an out-of-range scene did not clamp into the last chapter: ' + casos.foraDaFaixa.epoca);

  await page.evaluate(() => localStorage.removeItem(CHAVE_JOGO));


  // obsolete: the STREET bar was removed by owner request — element, style and test.

  // ---- SOM: existe, é sintetizado, e não nasce antes de um toque ----
  // A trava que importa aqui é a última: criar um AudioContext na carga rende aviso ou erro no
  // console em navegador nenhum autorizado, e este teste reprova erro de console — mas só se
  // alguém der o toque. Como o teste nunca deu um gesto CONFIÁVEL, `audCtx` tem de estar nulo.
  const som = await page.evaluate(() => {
    const antes = audCtx;
    acordarAudio();                       // o que o primeiro toque faria
    const ctx = audCtx;
    const nos = [];
    // com o som ligado, cada efeito tem de criar nó; com ele desligado, nenhum
    const co = ctx && ctx.createOscillator.bind(ctx), cb = ctx && ctx.createBufferSource.bind(ctx);
    if (ctx) {
      ctx.createOscillator = function () { nos.push('o'); return co(); };
      ctx.createBufferSource = function () { nos.push('b'); return cb(); };
    }
    S.som = true;
    somAlcance(true); somAtendida(); somDrop(); somPulo(); somPouso(); somPasso();
    somEra(); somTique(); somChegada();
    const ligado = nos.length;
    nos.length = 0;
    S.som = false;
    somAlcance(true); somDrop(); somPulo(); somPouso(); somPasso(); somEra(); somTique(); somChegada();
    const desligado = nos.length;
    S.som = true;
    return { criadoNaCarga: !!antes, temContexto: !!ctx, ligado, desligado };
  });
  console.log('sound -> context before any gesture:', som.criadoNaCarga,
    '| nodes with sound on:', som.ligado, '| with sound off:', som.desligado);
  if (som.criadoNaCarga) errors.push('an AudioContext was built before a user gesture');
  // Nove efeitos disparados no MESMO quadro rendem 6 nós e não 10: é o teto de vozes por
  // quadro (ver audioPronto) fazendo exatamente o que existe para fazer. O que se cobra aqui é
  // que o som EXISTA e que o teto segure — nunca que os nove passem.
  if (som.temContexto && (som.ligado < 5 || som.ligado > 6)) errors.push('the per-frame voice budget is not holding: ' + som.ligado);
  if (som.desligado !== 0) errors.push('sound is off and something still made an audio node');

  // ---- O GESTO: segurar o MUNDO na faixa final ergue a obra, e nunca vira rajada ----
  // Tres coisas de uma vez, e as tres sao promessas do MUTIRAO.md:
  //   · segurar em QUALQUER ponto do mundo trabalha (sem alvo, sem metade certa, sem timing);
  //   · a personagem PARA — trabalhar e literalmente parar de andar, e e esse o custo;
  //   · o golpe NAO dispara durante a obra: no maximo UM, o do toque que iniciou o gesto.
  // E a regressao que importa: FORA da faixa, segurar o mundo continua sendo o que sempre foi.
  async function segurarOMundo(seg) {
    const r = await page.evaluate(() => {
      const b = document.getElementById('scene').getBoundingClientRect();
      return { x: b.left + b.width * 0.75, y: b.top + b.height * 0.45 };   // metade DIREITA
    });
    const antes = await page.evaluate(() => ({ obra: S.obra.roca + S.obra.palicada + S.obra.casa,
      total: S.energiaTotal, x: worldX,
      // ANTES do dedo encostar: se a tela ja estava aberta aqui, a causa e anterior ao gesto.
      qualTela: TELAS.filter(function (t) { const e = document.getElementById(t);
        return e && e.classList.contains('aberta'); }).join(',') || '(nenhuma)',
      cant: canteiros.length }));
    await page.mouse.move(r.x, r.y);
    await page.mouse.down();
    // O primeiro meio segundo e a JANELA DE ARMAR (MUTIRAO_HOLD_MS = 300 ms): ali a rua anda
    // mesmo, de proposito — o toque continua instantaneo e quem so toca nao perde nada. O que
    // se mede e o depois, e por isso ha uma segunda amostra.
    await new Promise(res => setTimeout(res, 500));
    // O RETRATO DO INSTANTE DE ARMAR. Sem ele, "built nothing: 0" manda alguem procurar a causa
    // no jogo inteiro — e foi o que custou duas sessoes. Cada campo aqui e uma das clausulas de
    // `obraPodeArmar()`, para a falha nomear qual delas disse nao.
    const armado = await page.evaluate(() => ({
      x: worldX, pode: obraPodeArmar(), faixa: faixaViva(), cant: !!canteiroNaTela(),
      fala: falaAberta(), tela: telaAberta(), trav: travessiaAtiva(), pulo: jumpT > 0,
      // QUAL tela, e nao so "uma tela": sem o nome, "tela" manda alguem procurar entre catorze.
      qualTela: TELAS.filter(function (t) { const e = document.getElementById(t);
        return e && e.classList.contains('aberta'); }).join(',') || '(nenhuma)',
      // e onde esta o canteiro, para separar "sumiu" de "esta fora de quadro"
      canteirosVivos: canteiros.length,
      canteiroX: canteiros.length ? Math.round(canteiros[0].wx - worldX) : null,
      dedo: obraDedo > 0, trab: obraTrabalhando
    }));
    await new Promise(res => setTimeout(res, Math.max(0, seg * 1000 - 500)));
    const meio = await page.evaluate(() => ({ obra: S.obra.roca + S.obra.palicada + S.obra.casa,
      total: S.energiaTotal, x: worldX, trabalhando: obraTrabalhando }));
    await page.mouse.up();
    const porque = Object.keys({ faixa: 0, cant: 0, fala: 0, tela: 0, trav: 0, pulo: 0 })
      .filter(k => (k === 'faixa' || k === 'cant') ? !armado[k] : armado[k]);
    return { pontos: meio.obra - antes.obra, ganho: meio.total - antes.total,
      andou: Math.round(meio.x - antes.x), andouDepoisDeArmar: Math.round(meio.x - armado.x),
      trabalhando: meio.trabalhando,
      // o porque, em uma palavra: qual clausula de `obraPodeArmar()` estava dizendo nao
      travou: armado.pode ? '' : (porque.join('+') || 'nenhuma clausula — olhar obraDedo'),
      detalhe: armado.pode ? '' : (' [ANTES tela=' + antes.qualTela + ' cant=' + antes.cant +
        ' | AO ARMAR tela=' + armado.qualTela + ' canteiros=' + armado.canteirosVivos +
        ' x=' + armado.canteiroX + ']') };
  }
  await page.evaluate(() => {
    fecharTelas(); fecharTudo();
    // ===== O PREPARO PASSA A ZERAR O QUE VAZA, e isto conserta a intermitencia de ~50% =====
    // Medido em 15/08 com `test/repro-obra.js`: rodado SOZINHO, este bloco passa 16 de 16 e a
    // cena nunca vira. Ou seja, o defeito nunca esteve na mecanica — esta no estado que os
    // blocos ANTERIORES do smoke deixam para tras, e que o preparo nao tocava.
    //
    // A hipotese herdada (PENDENTES.md §13) era outra e o numero a derruba: dizia que o clique
    // do gesto empurraria `energiaTotal` por cima da fronteira de cena. Um golpe vale 1,0 e
    // faltam 300 para a fronteira. Nao da, nem em cem gestos.
    //
    // O que de fato bloqueia `obraPodeArmar()` e sobrevive ao `fecharTelas()`:
    //   · `jumpT > 0` — um pulo herdado. Bloqueia armar e NAO para o mundo, que e exatamente
    //     o sintoma "built nothing" junto com "she kept walking 79px". Os blocos anteriores
    //     tocam a metade esquerda o tempo todo, e a metade esquerda pula.
    //   · `falaViva` — uma fala aberta. Bloqueia armar e PARA o mundo, que e o outro sintoma,
    //     "the street stopped outside the faixa: 1px".
    //   · `travessiaViva` — mesma familia.
    // Sao dois vazamentos diferentes com sintomas opostos, e e por isso que o par falhava
    // "ao contrario": nao era um estado trocado, eram duas causas distintas.
    pararFala();
    jumpT = 0; attackT = 0; combo = 0;
    obraDedo = 0; obraTrabalhando = false;
    const c0 = cenarioDaEpoca(CAP_GENTE);
    S.cenario = c0; S.fronteira = Math.max(S.fronteira | 0, c0);
    // A FAIXA PELO CAPITULO FECHADO, NAO POR UMA FRACAO DO VAO (15/08, segunda passada).
    // Semear "a 90% do vao" deixa a cena a 300 pontos de virar, e o laco de quadro continua
    // rodando durante o preparo inteiro: uma folha apanhada no ar, um drop que renasce, e a
    // virada dispara no meio da medida. Quando ela dispara abre CERIMONIA, e tela aberta faz
    // `obraPodeArmar()` dizer nao — que e exatamente o que o diagnostico novo imprimiu quando
    // isto falhou: `cant+tela`.
    // `faixaViva()` devolve verdadeiro PARA SEMPRE num capitulo ja fechado. O `encaixe.js`
    // bloco 27 ja tinha chegado nesta mesma conclusao e deixou escrito o porque; a primeira
    // passada de hoje consertou os vazamentos de estado (jumpT, falaViva) e nao este, entao o
    // teste caiu de ~50% de falha para raro em vez de zero. Raro e pior: passa a ser ignorado.
    S.fechos = (S.fechos | 0) | (1 << CAP_GENTE);
    S.energiaTotal = LIMIAR_CENA * c0 + LIMIAR_CENA * EPOCAS[CAP_GENTE].cenas * 0.5;
    S.energia = 1e6; S.u3 = false; S.u4 = false;
    S.aberturas = MASCARA_EPOCAS; S.marcos = MASCARA_MARCOS;
    S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = 20;
    S.recursos = { flor: 200, agua: 200, refeicao: 200 };
    S.obra = { roca: 0, palicada: 0, casa: 0 };
    mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
  });
  await page.waitForTimeout(300);
  // O CANTEIRO E POSTO DEPOIS DA ESPERA, E ISSO CONSERTA UMA INTERMITENCIA REAL.
  // Antes ele era criado JUNTO com o resto do preparo e a medida so comecava 300 ms depois.
  // Nesses 300 ms duas coisas acontecem: o mundo anda (`worldX` avanca), e a propria faixa
  // re-semeia `canteiros` pela regra dela. Resultado: em algumas rodadas ela comecava ATRAS
  // do canteiro ou ele nem existia mais, e o teste acusava "segurar nao construiu nada" com
  // a mecanica perfeita. Falhou 3 vezes em 8 rodadas — nao e raro, e teste que falha 1 em 3
  // e teste que se aprende a ignorar.
  // Posto agora, EXATAMENTE onde ela esta, o gesto comeca dentro do canteiro.
  await page.evaluate(() => {
    // e a ultima palavra antes do gesto: qualquer tela que tenha nascido nos 300 ms de espera
    // morre aqui. Tela aberta e uma das clausulas de `obraPodeArmar()`, e a espera e justamente
    // onde ela aparecia.
    fecharTelas(); fecharTudo(); pararFala();
    canteiros.length = 0;
    canteiros.push({ tipo: 'roca', wx: worldX + HX });
  });
  const naFaixa = await segurarOMundo(2.6);
  const umGolpe = await page.evaluate(() => ganhoClique());
  console.log('holding the world in the faixa ->', JSON.stringify(naFaixa),
    '| one swing is worth', umGolpe.toFixed(2));
  if (naFaixa.pontos < 2) errors.push('holding the world in the faixa built nothing: ' + naFaixa.pontos +
    (naFaixa.travou ? ' — obraPodeArmar() disse nao por: ' + naFaixa.travou + naFaixa.detalhe : ' — obraPodeArmar() estava true'));
  if (naFaixa.ganho > umGolpe * 2)
    errors.push('holding the world in the faixa turned into a volley of swings: +' + naFaixa.ganho);
  if (Math.abs(naFaixa.andouDepoisDeArmar) > 4)
    errors.push('she kept walking while working the obra: ' + naFaixa.andouDepoisDeArmar + 'px' +
      (naFaixa.travou ? ' — obraPodeArmar() disse nao por: ' + naFaixa.travou + naFaixa.detalhe : ''));

  // ...e FORA da faixa nada disso existe: a rua anda como sempre andou
  await page.evaluate(() => {
    // O MESMO CUIDADO DA IDA VALE NA VOLTA. Voltar `S.cenario` para 0 com `energiaTotal` em 300
    // e andar para tras na cronologia, e a virada pode abrir fala ou cerimonia — e fala aberta
    // PARA O MUNDO, que e literalmente o que a assercao seguinte mede ("a rua anda como sempre
    // andou"). O bloco cobrava a rua andando e podia, ele mesmo, ter mandado a rua parar.
    pararFala();
    jumpT = 0; attackT = 0; combo = 0;
    obraDedo = 0; obraTrabalhando = false;
    S.cenario = 0; S.energiaTotal = 300; S.energia = 1e6;
    S.acolhidos = EPOCAS.map(() => 0);
    canteiros.length = 0; mobs.length = 0; drops.length = 0;
  });
  await page.waitForTimeout(200);
  const foraDaFaixa = await segurarOMundo(1.2);
  console.log('holding the world outside the faixa ->', JSON.stringify(foraDaFaixa));
  if (foraDaFaixa.trabalhando) errors.push('the obra armed outside the faixa');
  if (foraDaFaixa.pontos !== 0) errors.push('the obra advanced by hand outside the faixa');
  if (foraDaFaixa.andou < 20) errors.push('the street stopped outside the faixa: ' + foraDaFaixa.andou + 'px' +
    ' — fala/tela/travessia no instante: ' + JSON.stringify({ travou: foraDaFaixa.travou }));

  // ============================================================
  // T4 (SPRINT 1) — the three flows that cost day 07 must not regress in silence.
  // They run AFTER the sound test on purpose: page.tap is a trusted gesture and wakes the
  // AudioContext, so any real tap before that test would make "no context before a gesture"
  // fail for reasons that have nothing to do with audio.
  // ============================================================

  // ---- FLOW 1: coming back on day 2 shows the return panel, with real numbers ----
  // A save stamped 8h ago plus a retention record from yesterday must open the
  // "ENQUANTO VOCÊ ESTEVE FORA" paper, every number on it read from live state (no invented
  // digit), and a single tap must close it. This is the feature the mission hangs on and
  // nothing was watching it.
  await page.evaluate(() => {
    // the unload handler writes BOTH stores; stub both or the seed is overwritten mid-reload
    salvar = function () {};
    salvarRetencao = function () {};
    localStorage.setItem(CHAVE_JOGO, JSON.stringify({
      energia: 500, energiaTotal: 800, cenario: 0, modo: 'limpo',
      u1: false, u2: false, u3: false, u4: false, cuidado: 0.8, som: false,
      // A VAGA IMPORTA, e ate 18/08 esta semente estava na errada. `acolhidos` tem uma posicao
      // por epoca, e a linha "N pessoas acolhidas vivem no lugar que voces abriram" fala do
      // mutirao do quilombo -- posicao CAP_GENTE, que e 1. Semeada em 0 (PINDORAMA), ela cobrava
      // que o painel dissesse que gente acolhida em 1500 morava na roca de Palmares, que e a
      // conflacao proibida por escrito no jogo.ts linha 1061. O painel de fato dizia, porque era
      // o unico leitor de `acolhidos` que somava todas as vagas; o teste passava por concordar
      // com o defeito. Ver encaixe.js bloco 33, que cobra os DOIS lados.
      aberturas: 1, fechos: 0, grupo: 3, acolhidos: [0, 2, 0], marcos: 0,
      salvoEm: Date.now() - 8 * 3600 * 1000     // 8h away, under the 12h offline cap
    }));
    const ontem = new Date(Date.now() - 864e5);
    const chave = ontem.getFullYear() + '-' + String(ontem.getMonth() + 1).padStart(2, '0')
      + '-' + String(ontem.getDate()).padStart(2, '0');
    localStorage.setItem(CHAVE_RET, JSON.stringify({
      dias: 1, primeiro: chave, ultimo: chave, segundos: 300, tochas: 0,
      historia: 0, toqEsq: 0, toqDir: 0
    }));
  });
  await page.reload();
  await page.waitForFunction(() => typeof S !== 'undefined');
  await page.waitForTimeout(600);
  const volta = await page.evaluate(() => {
    const el = document.getElementById('retorno');
    const linhas = Array.from(document.querySelectorAll('#retorno .retLinha')).map(d => d.textContent);
    return { aberto: el.classList.contains('aberto'), aria: el.getAttribute('aria-hidden'),
      linhas, dt: voltouDepoisDe, dias: R.dias, bonusEsperado: (1 + CFG.bonusDia).toFixed(2),
      menuAberto: document.getElementById('telaMenu').classList.contains('aberta') };
  });
  console.log('day-2 return -> open:', volta.aberto, '| away', Math.round(volta.dt) + 's',
    '| lines:', volta.linhas.length, '| days', volta.dias);
  volta.linhas.forEach(function (l) { console.log('   .', l); });
  if (!volta.aberto) errors.push('an 8h-old save did not open the return panel');
  if (volta.aria !== 'false') errors.push('the return panel is open but hidden from the accessibility tree');
  // NAO E CONTAGEM EXATA, e a razao apareceu em 18/08. O painel tem quatro linhas fixas mais
  // as do mutirao, e essas variam com o quanto a obra andou -- uma noite no teto ergue ate tres
  // estagios. Cobrar "exatamente 5" era cobrar que o mutirao NAO trabalhasse, e de fato ele nao
  // trabalhava: a semente punha as acolhidas na vaga 0 em vez da vaga da obra, entao o caminho
  // inteiro de "o que o mutirao ergueu enquanto voce esteve fora" tinha zero cobertura. As
  // assercoes que valem sao as de CONTEUDO, logo abaixo.
  if (volta.linhas.length < 5) errors.push('the return panel lost lines: got ' + volta.linhas.length);
  // Every number on the paper must be the state AT BUILD TIME (the panel is built inside
  // carregar(), synchronously on the seeded save). S.grupo is re-derived by the frame loop
  // right after, so the panel is compared against the seed, not against later live state.
  if (volta.dias !== 2) errors.push('yesterday + today did not make 2 distinct days: got ' + volta.dias);
  if (!volta.linhas.some(l => /^Você ficou fora por 8h0[01]\./.test(l))) {
    errors.push('no line says the player was away ~8h: ' + JSON.stringify(volta.linhas));
  }
  if (!volta.linhas.some(l => l.includes('Dia 2') && l.includes('×' + volta.bonusEsperado))) {
    errors.push('no line carries the real day count and bonus (Dia 2, ×' + volta.bonusEsperado + '): ' + JSON.stringify(volta.linhas));
  }
  if (!volta.linhas.some(l => l.startsWith('3 pessoas continuam andando'))) {
    errors.push('no line matches the seeded queue of 3: ' + JSON.stringify(volta.linhas));
  }
  if (!volta.linhas.some(l => l.startsWith('2 pessoas acolhidas'))) {
    errors.push('no line matches the seeded 2 sheltered: ' + JSON.stringify(volta.linhas));
  }
  // O MUTIRAO TRABALHOU, E O PAPEL DIZ O QUE ELE ERGUEU. Com gente na vaga da obra e 8h fora,
  // a taxa nao e zero e a obra tem de ter andado -- e o painel tem de contar isso, porque e o
  // unico motivo concreto de voltar amanha que este jogo oferece hoje. Sem esta assercao, o
  // recurso podia sair inteiro e nada ficaria vermelho.
  if (!volta.linhas.some(l => /mutir[aã]o|mantimentos/i.test(l))) {
    errors.push('the mutirão worked for 8h and the paper says nothing about it: ' + JSON.stringify(volta.linhas));
  }
  // E O AVESSO: "a estrada esperou" e a frase de quando NINGUEM trabalhou. Dita com o mutirao
  // de pe, ela mente -- e o comentario de mostrarRetorno() ja avisava disso por escrito.
  if (volta.linhas.some(l => /A estrada esperou/i.test(l))) {
    errors.push('the paper says the road waited while the mutirão was building: ' + JSON.stringify(volta.linhas));
  }
  // ---- B1 (QA, 2026-08-07): o painel vem ANTES do menu, e responde ao toque ----
  // Era o bug: o boot abre o menu SEMPRE (z 40) e o painel nascia em z 30 — visível pelo
  // véu e MORTO ao toque até apertar JOGAR. Agora ele é a primeira coisa da tela. O teste
  // pergunta ao NAVEGADOR quem está no ponto do painel (elementFromPoint), porque só isso
  // distingue "está desenhado" de "está alcançável"; e depois toca de verdade, com o menu
  // ainda aberto, que é exatamente o gesto que não respondia.
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-retorno.png') });
  // a mesma foto fica em test/ com o nome do bug: é a prova do B1 e não se procura por ela
  // entre os prints soltos da raiz
  await page.screenshot({ path: path.resolve(__dirname, 'B1-retorno-antes-do-menu.png') });
  const camada = await page.evaluate(() => {
    const el = document.getElementById('retorno');
    const r = el.getBoundingClientRect();
    const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    // e o menu atrás está sob o véu: um toque em JOGAR não atravessa o papel da volta
    const b = document.getElementById('btnJogar').getBoundingClientRect();
    const sobreBotao = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { menuAberto: document.getElementById('telaMenu').classList.contains('aberta'),
      alcanca: !!topo && (topo === el || el.contains(topo)),
      quem: topo ? (topo.id || topo.className) : null,
      // o que se cobra e que o toque em JOGAR NAO ATRAVESSE. Era `id === 'retVeu'`, e isso
      // passou a reprovar quando o papel da volta centralizou e ficou ELE por cima do botao
      // — protecao melhor, nao pior. Vale o veu ou o proprio papel.
      veuNoBotao: !!sobreBotao && (sobreBotao.id === 'retVeu'
        || sobreBotao.id === 'retorno' || !!el.contains(sobreBotao)),
      sobreBotao: sobreBotao ? (sobreBotao.id || sobreBotao.className) : null };
  });
  console.log('  return-before-menu -> menu open:', camada.menuAberto,
    '| topmost at the paper:', camada.quem);
  if (!camada.menuAberto) errors.push('the boot no longer opens the menu — flow assumption broke');
  if (!camada.alcanca) errors.push('the return panel is buried under ' + camada.quem + ' (B1)');
  if (!camada.veuNoBotao) errors.push('the menu is not behind the return veil: JOGAR is reachable through it (' + camada.sobreBotao + ')');
  await page.tap('#retorno');             // o toque que antes morria: menu aberto por baixo
  await page.waitForTimeout(150);
  const dpTap = await page.evaluate(() => ({
    aberto: document.getElementById('retorno').classList.contains('aberto'),
    aria: document.getElementById('retorno').getAttribute('aria-hidden'),
    menu: document.getElementById('telaMenu').classList.contains('aberta') }));
  console.log('  one tap closes it -> open after tap:', dpTap.aberto, '| aria-hidden:', dpTap.aria);
  if (dpTap.aberto) errors.push('one tap did not close the return panel with the menu open (B1)');
  if (dpTap.aria !== 'true') errors.push('the closed return panel still claims to be visible');
  if (!dpTap.menu) errors.push('closing the return panel took the menu down with it');
  // e o caminho continua: o menu que estava atrás leva à rua
  await page.tap('#btnJogar');            // chapter 1 already read (aberturas: 1) -> straight to the street
  await page.waitForTimeout(400);
  const naRua = await page.evaluate(() => document.body.classList.contains('emTela'));
  if (naRua) errors.push('JOGAR did not hand the screen back to the game');

  // ---- FLOW 2: the chapter-turn ceremony always ends at morning ----
  // Onda 3's contract: on a CHAPTER turn, saltoHora sweeps the light to the NEXT sunrise
  // (day fraction 0.00), consumed with physics during the ceremony. Measured from two
  // different starting hours, because the ANTES bug only showed from some of them (0.75
  // landed on morning by coincidence; 0.40 ended at dusk). Time is recorded REAL, not
  // nominal — the already-paid trap from prints-onda3.
  const amanhecer = async (fHora) => {
    await page.evaluate((f) => {
      fecharTelas();
      mobs.length = 0; drops.length = 0; floats.length = 0;
      saltoHora = 0;
      // A VIRADA MEDIDA AQUI E A DO CAPITULO 2 PARA O 3, e nao mais a do 1 para o 2: entre
      // PINDORAMA e PALMARES passou a existir A TRAVESSIA, que POE o relogio num valor (fim
      // de tarde) e o corre a 10x. Com ela no meio, medir "de que hora se parte" nao mede
      // mais nada — a hora de partida seria apagada antes da cerimonia. O contrato sob teste
      // continua o mesmo (virada de CAPITULO termina no nascer do sol) e agora e medido numa
      // virada sem travessia. A travessia tem bloco proprio, logo abaixo do FLUXO 3.
      // a ultima cena do capitulo ANTERIOR ao terceiro da lista, dita por identidade
      S.cenario = cenarioDaEpoca(iEp('cais')) - 1;   // last scene of PALMARES
      S.energiaTotal = LIMIARES[S.cenario] - 3;  // parked just under the turn
      S.aberturas = 3; S.fechos = 1;             // chapters 1-2 read; chapter 2's close unseen
      S.travessias = MASCARA_TRAVESSIAS;         // the crossing behind us, so it cannot replay
      redesenharFundo();
      window.setHora(f);
    }, fHora);
    await page.waitForTimeout(300);
    await page.evaluate(() => { S.energiaTotal += 6; });   // cross the threshold
    await page.waitForTimeout(500);                        // verificarCenario runs in the HUD loop
    // walk through the chapter close: one tap completes the line, the next advances
    let ceri = false;
    for (let i = 0; i < 30 && !ceri; i++) {
      ceri = await page.evaluate(() =>
        document.getElementById('telaFala').classList.contains('cerimoniando'));
      if (!ceri) { await page.evaluate(() => avancarFala()); await page.waitForTimeout(90); }
    }
    if (!ceri) return { ceri: false };
    // the sweep runs behind the plaque; wait for it to drain, on a real clock
    const t0 = Date.now();
    let resta = 1e9;
    while (resta > 2 && Date.now() - t0 < 6000) {
      await page.waitForTimeout(100);
      resta = await page.evaluate(() => saltoHora);
    }
    const tReal = (Date.now() - t0) / 1000;
    await page.waitForTimeout(200);                        // let the floor finish the last seconds
    const fim = await page.evaluate(() => ({
      fra: (relogio / DIA_SEG) % 1, resta: saltoHora,
      ceriAinda: document.getElementById('telaFala').classList.contains('cerimoniando') }));
    return { ceri: true, tReal, resta: fim.resta, fra: fim.fra,
      dist: Math.min(fim.fra, 1 - fim.fra), ceriAinda: fim.ceriAinda };
  };
  for (const f of [0.75, 0.40]) {
    const m = await amanhecer(f);
    console.log('ceremony from', f, '->', m.ceri
      ? 'sweep drained in ' + m.tReal.toFixed(2) + 's real | day fraction ' + m.fra.toFixed(3)
        + ' (dist to morning ' + m.dist.toFixed(3) + ') | still ceremonial: ' + m.ceriAinda
      : 'THE CEREMONY NEVER OPENED');
    if (!m.ceri) { errors.push('crossing the chapter threshold from hour ' + f + ' never reached the ceremony'); continue; }
    if (m.resta > 2) errors.push('the light sweep from hour ' + f + ' did not drain within 6s real: ' + m.resta.toFixed(0) + 's of game clock left');
    if (m.dist > 0.02) errors.push('the ceremony from hour ' + f + ' did not end at morning: day fraction ' + m.fra.toFixed(3));
  }

  // ---- FLOW 3: the in-game menu never locks the player out ----
  // The worst product bug ever shipped had this exact shape: with a game in progress, the
  // menu (or a screen behind it) became unreachable or would not give the game back. Real
  // taps on the real buttons, because writing state proved nothing last time.
  await page.evaluate(() => {
    fecharTelas();
    S.cenario = 0; S.energia = 500; S.energiaTotal = 800;   // mid-game, under the first turn
    S.aberturas = 1; saltoHora = 0;
    // As placas do chão já falaram TODAS. Sem esta linha o teste do MENU vira teste da
    // estrada: 800 de impacto no capítulo 1 já passou do alvo do primeiro marco (750), a
    // placa entra, alcança a personagem e abre a fala dela — e o JOGAR "não devolve o jogo"
    // por uma razão que não tem nada a ver com o menu. Mesma providência que
    // `medir-menu.js`, `percorrer-menu.js` e `olhar-frente.js` já tomavam.
    if (typeof MASCARA_MARCOS !== 'undefined') { S.marcos = MASCARA_MARCOS; marcoAtivo = null; }
    redesenharFundo();
  });
  await page.waitForTimeout(200);
  const tela = async () => page.evaluate(() => ({
    abertas: TELAS.filter(t => document.getElementById(t).classList.contains('aberta')),
    emTela: document.body.classList.contains('emTela') }));
  const passo = async (botao, esperada) => {
    await page.tap('#' + botao);
    await page.waitForTimeout(200);
    const t = await tela();
    if (esperada === null) {
      if (t.abertas.length || t.emTela) {
        errors.push(botao + ' did not give the game back: open=' + t.abertas.join(',') + ' emTela=' + t.emTela);
      }
    } else if (t.abertas.join(',') !== esperada || !t.emTela) {
      errors.push(botao + ' should land on ' + esperada + ', landed on: ' + (t.abertas.join(',') || '(none)') + ' emTela=' + t.emTela);
    }
    return t;
  };
  await passo('abrirMenu', 'telaMenu');
  await passo('btnCompletude', 'telaCompletude');     // A HISTÓRIA reachable mid-game
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-menu-historia.png') });
  await passo('btnVoltarComp', 'telaMenu');
  // DE ONDE VEM mudou-se para dentro de CONFIGURACOES em 15/08 (decisao do dono), entao o
  // caminho ate ela passou a ter um degrau a mais — e o teste anda o caminho REAL de proposito:
  // se a porta sumir de la, isto quebra, que e o trabalho dele.
  await passo('btnConfig', 'telaConfig');
  await passo('btnFontes', 'telaFontes');             // DE ONDE VEM reachable via CONFIGURACOES
  await passo('btnVoltarFontes', 'telaMenu');

  // ---- GLOSSARIO: a tela irma, e as tres coisas que podem dar errado nela ----
  // O molde HTML dela e territorio da Direcao de Arte e chega em commit proprio, entao a
  // checagem se AUTO-LIGA: enquanto o botao nao existir ela DIZ que pulou, em vez de reprovar
  // uma integracao que ainda nao aterrissou; no dia em que o markup entrar, ela passa a valer
  // sozinha, sem ninguem lembrar de habilita-la.
  //   1. abre e PINTA — verbete que existe em GLOSSARIO e nao aparece na caixa e a falha que
  //      um print nao denuncia, porque a tela continua bonita com metade da lista;
  //   2. tem cabecalho de grupo — e o unico ramo do montador que nao passa por .glItem;
  //   3. FECHA por fora. `fecharTelas()` so fecha o que esta em TELAS: esquecer o nome ali
  //      deixa a tela presa por cima do jogo, e este e o teste que enxerga isso.
  const temGloss = await page.evaluate(() =>
    !!document.getElementById('btnGlossario') && !!document.getElementById('telaGlossario'));
  if (!temGloss) {
    console.log('glossary -> not in the template yet (no #btnGlossario/#telaGlossario), walk skipped');
  } else {
    await passo('btnGlossario', 'telaGlossario');     // GLOSSARIO reachable mid-game

    // A TELA ABRE PELOS ASSUNTOS (decisao do dono, 2026-08-10): a primeira coisa que se ve e a
    // lista dos grupos, cada um com a frase que o explica, e nao 121 termos empilhados. Antes
    // de conferir a LISTA, portanto, este teste precisa atravessar a porta — como a pessoa faz.
    //
    // Vale conferir a porta em si, porque ela e a unica coisa entre quem abre o glossario e todo
    // o conteudo dele: se as portas nao pintarem, a tela vira um beco sem saida silencioso, e
    // nada mais abaixo falharia (a lista simplesmente ficaria vazia, que e o que aconteceu na
    // primeira vez que este bloco rodou depois da mudanca).
    const portas = await page.evaluate(() => {
      const ps = [...document.querySelectorAll('#listaGlossario .glAssunto')];
      return {
        n: ps.length,
        grupos: GLOSSARIO.filter(v => !!v.g).length,
        comFrase: ps.filter(p => !!(p.querySelector('.glAssuntoSub') || {}).textContent).length,
        temTudo: ps.some(p => p.dataset.seg === '*'),
        // a frase da porta e PROSA dentro de um <button>, e a regra global de button impoe
        // caixa alta — se a excecao cair, ela volta a gritar e ninguem percebe pelo teste
        gritando: ps.filter(p => {
          const s = p.querySelector('.glAssuntoSub');
          return s && getComputedStyle(s).textTransform === 'uppercase';
        }).length
      };
    });
    console.log('glossary doors -> painted', portas.n, 'for', portas.grupos + 1, 'expected | with a sentence:',
      portas.comFrase, '| TUDO present:', portas.temTudo, '| shouting in caps:', portas.gritando);
    if (portas.n !== portas.grupos + 1) errors.push('the glossary painted ' + portas.n + ' doors for ' + (portas.grupos + 1) + ' expected (groups + TUDO)');
    if (!portas.temTudo) errors.push('the glossary door list has no TUDO: the whole index is unreachable in one tap');
    if (portas.comFrase !== portas.n) errors.push('glossary doors without an explaining sentence: ' + (portas.n - portas.comFrase));
    if (portas.gritando) errors.push('glossary door sentences rendered in uppercase: ' + portas.gritando);

    // atravessa a porta TUDO — daqui para baixo o teste fala da LISTA, como antes
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('#listaGlossario .glAssunto')].find(p => p.dataset.seg === '*');
      if (t) t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await page.waitForTimeout(60);

    const gl = await page.evaluate(() => {
      const itens = [...document.querySelectorAll('#listaGlossario .glItem')];
      return {
        itens: itens.length,
        dados: GLOSSARIO.filter(v => !v.g).length,
        grupos: document.querySelectorAll('#listaGlossario .glGrupo').length,
        gruposDados: GLOSSARIO.filter(v => !!v.g).length,
        semTermo: itens.filter(e => !(e.querySelector('.glT') || {}).textContent).length,
        duvida: document.querySelectorAll('#listaGlossario .glItem.dv').length
      };
    });
    console.log('glossary -> entries painted', gl.itens, 'of', gl.dados, '| groups', gl.grupos,
      'of', gl.gruposDados, '| entries with no term:', gl.semTermo, '| marked as disputed:', gl.duvida);
    await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-glossario.png') });
    if (gl.itens !== gl.dados) errors.push('the glossary painted ' + gl.itens + ' entries for ' + gl.dados + ' in GLOSSARIO');
    if (gl.grupos !== gl.gruposDados) errors.push('the glossary painted ' + gl.grupos + ' group headings for ' + gl.gruposDados + ' in GLOSSARIO');
    if (gl.semTermo) errors.push(gl.semTermo + ' glossary entries were painted with no term');

    // ---- A NAVEGACAO DO GLOSSARIO: recolher, abas, busca, salto, relacionados e sorteio ----
    // DUAS CAMADAS, e a divisao entre elas e a mesma fronteira do contrato de DOM. O que mora
    // DENTRO de #listaGlossario e do Dev e e checado sempre. O que e chrome — #glCampo,
    // #glFiltros, #glLimpar, #glSorte — e da Direcao de Arte e chega em commit proprio: se o
    // elemento existir, o teste TOCA nele (e assim confere a ligacao); se nao existir, ele
    // aciona a mesma funcao por baixo e continua provando a LOGICA. Sem isso a checagem ficaria
    // adormecida ate o markup chegar, que e justamente quando ninguem lembra de liga-la.

    // 1. O molde do verbete. Cabeca com o termo, corpo, data-t, e NENHUM aberto de saida —
    //    a lista abre como indice, que e o que o dono aprovou no lugar da parede de 52.
    const molde = await page.evaluate(() => {
      const it = [...document.querySelectorAll('#listaGlossario .glItem')];
      return {
        total: it.length,
        cabeca: it.filter(e => e.querySelector('.glCabeca .glT')).length,
        corpo: it.filter(e => e.querySelector('.glCorpo')).length,
        dataT: it.filter(e => e.dataset.t).length,
        abertos: it.filter(e => e.classList.contains('aberto')).length
      };
    });
    console.log('glossary -> collapsed by default:', molde.abertos === 0,
      '| heads', molde.cabeca, '| bodies', molde.corpo, '| data-t', molde.dataT, 'of', molde.total);
    if (molde.cabeca !== molde.total) errors.push('glossary entries without .glCabeca > .glT: ' + (molde.total - molde.cabeca));
    if (molde.corpo !== molde.total) errors.push('glossary entries without .glCorpo: ' + (molde.total - molde.corpo));
    if (molde.dataT !== molde.total) errors.push('glossary entries without data-t: ' + (molde.total - molde.dataT));
    if (molde.abertos) errors.push('the glossary opened with ' + molde.abertos + ' entries already expanded');

    // 2. A cabeca ALTERNA .aberto, e abrir um FECHA o outro (a decisao registrada no jogo.ts:
    //    acumular abertos volta em 52 toques para a tela que o dono reprovou).
    const acordeao = await page.evaluate(() => {
      const it = [...document.querySelectorAll('#listaGlossario .glItem')];
      it[0].querySelector('.glCabeca').click();
      const abriu = it[0].classList.contains('aberto');
      it[3].querySelector('.glCabeca').click();
      const outro = it[3].classList.contains('aberto'), primeiroCedeu = !it[0].classList.contains('aberto');
      it[3].querySelector('.glCabeca').click();
      const fechou = !it[3].classList.contains('aberto');
      return { abriu, outro, primeiroCedeu, fechou,
        aria: it[3].querySelector('.glCabeca').getAttribute('aria-expanded') };
    });
    console.log('glossary -> head toggles .aberto:', acordeao.abriu, '| second tap closes it:', acordeao.fechou,
      '| opening another closed the first:', acordeao.primeiroCedeu, '| aria-expanded:', acordeao.aria);
    if (!acordeao.abriu) errors.push('tapping .glCabeca did not open the entry');
    if (!acordeao.fechou) errors.push('tapping .glCabeca twice did not close the entry');
    if (!acordeao.outro || !acordeao.primeiroCedeu) errors.push('opening a second entry did not close the first');
    if (acordeao.aria !== 'false') errors.push('a closed .glCabeca kept aria-expanded=' + acordeao.aria);

    // 2b. O MESMO, com um DEDO DE VERDADE. O `.click()` acima entra pela porta do teclado
    //     (detail 0) e nao prova o gesto; e o gesto e onde estava o defeito. O toque que abre
    //     a tela chega com o dedo ainda no ar sobre uma `.glCabeca`, e o `click` que fecha
    //     aquele toque vazava para ela — e por isso que o glossario abria com um verbete
    //     escancarado (o teste do item 1 e quem pegou). A guarda que conserta pode quebrar o
    //     toque legitimo, entao ele tambem e tocado aqui, de dedo.
    const alvoDedo = await page.evaluate(() => {
      const el = document.querySelector('#listaGlossario .glItem');
      return el ? el.dataset.i : null;
    });
    const sel = '#listaGlossario .glItem[data-i="' + alvoDedo + '"] .glCabeca';
    await page.tap(sel);
    await page.waitForTimeout(120);
    const dedoAbriu = await page.evaluate(i =>
      document.querySelector('#listaGlossario .glItem[data-i="' + i + '"]').classList.contains('aberto'), alvoDedo);
    await page.tap(sel);
    await page.waitForTimeout(120);
    const dedoFechou = await page.evaluate(i =>
      !document.querySelector('#listaGlossario .glItem[data-i="' + i + '"]').classList.contains('aberto'), alvoDedo);
    console.log('glossary -> a real tap on the head opens it:', dedoAbriu, '| and closes it:', dedoFechou);
    if (!dedoAbriu) errors.push('a real tap on .glCabeca did not open the entry (the stray-tap guard is too strict)');
    if (!dedoFechou) errors.push('a real tap on an open .glCabeca did not close it');

    // 3. A BUSCA CHEGA SEM ACENTO. Ninguem digita "BUZIOS" com acento no celular, e o verbete
    //    acentuado e o que a pessoa foi buscar aprender. O termo alvo sai do proprio GLOSSARIO:
    //    o teste nao sabe nomes de cor, entao ele continua valendo se a lista mudar.
    const busca = await page.evaluate(() => {
      const nu = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const alvo = GLOSSARIO.filter(v => !v.g).map(v => String(v.t)).filter(t => nu(t) !== t)[0];
      const digitado = nu(alvo).toLowerCase();          // sem acento E em caixa baixa: os dois eixos
      const c = document.getElementById('glCampo');
      if (c) { c.value = digitado; c.dispatchEvent(new Event('input', { bubbles: true })); }
      else { glTermo = digitado; glPintar(); }
      const sugs = [...document.querySelectorAll('#listaGlossario .glSug')].map(e => e.textContent);
      return { alvo, digitado, campo: !!c, achou: sugs.indexOf(alvo) >= 0, primeira: sugs[0] || null,
        quantas: sugs.length, itens: document.querySelectorAll('#listaGlossario .glItem').length };
    });
    console.log('glossary search -> typed "' + busca.digitado + '" (field present: ' + busca.campo + ') -> ' +
      busca.quantas + ' suggestions, found "' + busca.alvo + '":', busca.achou, '| entries hidden:', busca.itens === 0);
    if (!busca.achou) errors.push('searching "' + busca.digitado + '" did not find the accented entry "' + busca.alvo + '"');
    if (busca.itens !== 0) errors.push('the search left ' + busca.itens + ' full entries painted under the suggestions');

    // 4. O SALTO: tocar na sugestao limpa a busca, devolve a lista INTEIRA, abre o verbete e
    //    marca .alvo. A ultima oracao do pedido do dono e esta — a pessoa fica no glossario.
    await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-glossario-busca.png') });
    const salto = await page.evaluate(() => {
      const s = document.querySelector('#listaGlossario .glSug');
      const termo = s.textContent;
      s.click();
      const el = [...document.querySelectorAll('#listaGlossario .glItem')].filter(e => e.dataset.t === termo)[0];
      const c = document.getElementById('glCampo');
      return { termo, achou: !!el, aberto: !!el && el.classList.contains('aberto'),
        alvo: !!el && el.classList.contains('alvo'),
        itens: document.querySelectorAll('#listaGlossario .glItem').length,
        sugs: document.querySelectorAll('#listaGlossario .glSug').length,
        campoVazio: !c || c.value === '', rolou: document.getElementById('listaGlossario').scrollTop };
    });
    console.log('glossary jump -> "' + salto.termo + '" | back to the whole list:', salto.itens, '| suggestions gone:',
      salto.sugs === 0, '| opened:', salto.aberto, '| flagged .alvo:', salto.alvo, '| scrolled to', Math.round(salto.rolou));
    if (!salto.achou) errors.push('jumping to "' + salto.termo + '" did not repaint the entry in the list');
    if (salto.sugs || salto.itens !== gl.dados) errors.push('the jump did not hand back the whole glossary: ' + salto.itens + ' entries, ' + salto.sugs + ' suggestions');
    if (!salto.aberto) errors.push('the jump left "' + salto.termo + '" collapsed');
    if (!salto.alvo) errors.push('the jump did not flag "' + salto.termo + '" with .alvo');
    if (!salto.campoVazio) errors.push('the jump left text in the search field');

    // 5. Busca sem nenhum achado -> .glVazio, e a frase dele e FIXA: o que foi digitado nunca
    //    volta para a tela. E a unica entrada de teclado do jogo inteiro.
    const vazio = await page.evaluate(() => {
      const alvo = 'zzqx';
      const c = document.getElementById('glCampo');
      if (c) { c.value = alvo; c.dispatchEvent(new Event('input', { bubbles: true })); }
      else { glTermo = alvo; glPintar(); }
      const z = document.querySelector('#listaGlossario .glVazio');
      return { z: !!z, sugs: document.querySelectorAll('#listaGlossario .glSug').length,
        repetiu: !!z && (z.getAttribute('aria-label') || '').toLowerCase().indexOf(alvo) >= 0 };
    });
    console.log('glossary search -> a query with no match shows .glVazio:', vazio.z, '| it never echoes the typed text:', !vazio.repetiu);
    if (!vazio.z || vazio.sugs) errors.push('a search with no match did not paint .glVazio');
    if (vazio.repetiu) errors.push('the empty-search message echoed the typed text back into the page');

    // 6. O X devolve a lista inteira.
    const limpou = await page.evaluate(() => {
      const b = document.getElementById('glLimpar');
      if (b) b.dispatchEvent(new Event('pointerdown', { bubbles: true })); else glLimparBusca();
      const c = document.getElementById('glCampo');
      return { botao: !!b, itens: document.querySelectorAll('#listaGlossario .glItem').length,
        sugs: document.querySelectorAll('#listaGlossario .glSug').length, campoVazio: !c || c.value === '' };
    });
    console.log('glossary -> clear (button present: ' + limpou.botao + ') hands back', limpou.itens, 'entries');
    if (limpou.itens !== gl.dados || limpou.sugs) errors.push('clearing the search did not hand back the whole glossary: ' + limpou.itens);
    if (!limpou.campoVazio) errors.push('clearing the search left text in the field');

    // 7. UMA ABA DE GRUPO REDUZ A LISTA, e reduz para o numero EXATO de verbetes daquele grupo
    //    — contado do proprio GLOSSARIO, nao de um numero escrito aqui que envelheceria.
    const abaGrupo = await page.evaluate(() => {
      const grupos = GLOSSARIO.filter(v => v.g).map(v => v.g);
      const alvo = grupos[1];                       // um que nao seja o primeiro bloco
      let esperado = 0, dentro = false;
      GLOSSARIO.forEach(v => { if (v.g) { dentro = (v.g === alvo); return; } if (dentro) esperado++; });
      // A ESCOLHA DE ASSUNTO PASSA PELA PORTA, e nao mais por uma aba: para chegar a ela e
      // preciso VOLTAR para a tela de assuntos primeiro, que e o caminho que a pessoa faz. Este
      // trecho, portanto, testa duas coisas de uma vez — o caminho de volta e o filtro.
      const volta = document.querySelector('#glFiltros .glVolta');
      if (volta) volta.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      const b = [...document.querySelectorAll('#listaGlossario .glAssunto')].filter(x => x.dataset.seg === alvo)[0];
      if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); else { glSeg = alvo; glVista = 'lista'; glPintar(); }
      return { alvo, esperado, botao: !!b, voltou: !!volta,
        itens: document.querySelectorAll('#listaGlossario .glItem').length,
        placas: document.querySelectorAll('#listaGlossario .glGrupo').length };
    });
    console.log('glossary doors -> "' + abaGrupo.alvo + '" (door present: ' + abaGrupo.botao + ', back path: ' +
      abaGrupo.voltou + ') narrowed the list to', abaGrupo.itens, 'of', gl.dados,
      '| expected', abaGrupo.esperado, '| headings', abaGrupo.placas);
    if (abaGrupo.itens !== abaGrupo.esperado) errors.push('the door "' + abaGrupo.alvo + '" painted ' + abaGrupo.itens + ' entries for ' + abaGrupo.esperado);
    if (!(abaGrupo.itens < gl.dados)) errors.push('the door did not narrow the list at all');
    if (abaGrupo.placas !== 1) errors.push('the door painted ' + abaGrupo.placas + ' group headings instead of 1');
    if (!abaGrupo.voltou) errors.push('no way back to the subject list: .glVolta is missing while inside a group');

    // 8. O SORTEIO abre um verbete qualquer — e ele DESFAZ o filtro de grupo se a palavra
    //    sorteada mora fora dele, que e a mesma regra do salto. Chamado com a aba do item 7
    //    ainda ativa, de proposito: e assim que o desfazer fica provado.
    const sorte = await page.evaluate(() => {
      const b = document.getElementById('glSorte');
      if (b) b.dispatchEvent(new Event('pointerdown', { bubbles: true })); else glSortear();
      const el = document.querySelector('#listaGlossario .glItem.aberto');
      return { botao: !!b, termo: el ? el.dataset.t : null,
        alvo: document.querySelectorAll('#listaGlossario .glItem.alvo').length,
        itens: document.querySelectorAll('#listaGlossario .glItem').length, seg: glSeg };
    });
    console.log('glossary dice -> (button present: ' + sorte.botao + ') opened "' + sorte.termo + '" | flagged .alvo:',
      sorte.alvo, '| list is', sorte.itens, 'entries in segment "' + sorte.seg + '"');
    if (!sorte.termo) errors.push('#glSorte did not open any entry');
    if (sorte.alvo !== 1) errors.push('#glSorte flagged ' + sorte.alvo + ' entries with .alvo instead of 1');
    if (!(sorte.itens === gl.dados || sorte.itens === abaGrupo.esperado)) errors.push('#glSorte left the list at ' + sorte.itens + ' entries');

    // 9. OS RELACIONADOS. O campo `rel` e do historiador e e texto escrito a mao: um nome com
    //    erro de digitacao some CALADO da tela (e o certo, la), e este e o unico lugar do
    //    projeto onde ele aparece. Enquanto ninguem tiver escrito `rel`, o teste diz isso.
    const rel = await page.evaluate(() => {
      const nu = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
      const termos = {}; GLOSSARIO.filter(v => !v.g).forEach(v => { termos[nu(v.t)] = 1; });
      const mapa = (typeof GLOSSARIO_REL === 'object' && GLOSSARIO_REL) || {};
      const quebrados = []; let comRel = 0, ligacoes = 0, proprio = 0;
      GLOSSARIO.filter(v => !v.g).forEach(v => {
        const lista = v.rel || mapa[String(v.t)];
        if (!lista || !lista.length) return;
        comRel++;
        lista.forEach(n => {
          ligacoes++;
          if (nu(n) === nu(v.t)) { proprio++; return; }
          if (!termos[nu(n)]) quebrados.push(String(v.t) + ' -> ' + n);
        });
      });
      // Uma CHAVE que nao casa com nenhum verbete perde a fileira inteira daquele verbete, e
      // some ainda mais calada que um valor errado: nada aparece e nada acusa. Por isso a
      // chave e conferida junto — o casamento e por string exata, letra e acento.
      const chavesOrfas = Object.keys(mapa).filter(k => !termos[nu(k)]);
      const semRemissao = GLOSSARIO.filter(v => !v.g && !v.rel && !mapa[String(v.t)]).map(v => String(v.t));
      glSeg = '*'; glTermo = ''; glPintar();
      return { comRel, ligacoes, quebrados, proprio, chavesOrfas, semRemissao,
        pintados: document.querySelectorAll('#listaGlossario .glRel .glLink').length,
        caixas: document.querySelectorAll('#listaGlossario .glRel').length };
    });
    if (!rel.comRel) {
      console.log('glossary related -> no entry carries `rel` yet (the historian has not landed), links skipped');
    } else {
      console.log('glossary related ->', rel.comRel, 'entries with cross-references |', rel.ligacoes, 'links written |',
        rel.pintados, 'painted in', rel.caixas, '.glRel boxes | broken:', rel.quebrados.length,
        '| orphan keys:', rel.chavesOrfas.length, '| entries with none:', rel.semRemissao.length);
      if (rel.quebrados.length) errors.push('cross-references point at terms that are not in GLOSSARIO: ' + rel.quebrados.join(' ; '));
      if (rel.chavesOrfas.length) errors.push('GLOSSARIO_REL has keys that match no entry: ' + rel.chavesOrfas.join(' ; '));
      if (rel.proprio) errors.push(rel.proprio + ' cross-references point the term at itself');
      if (!rel.pintados) errors.push('entries carry cross-references but no .glLink was painted');
      if (rel.pintados !== rel.ligacoes) errors.push('the list painted ' + rel.pintados + ' links for ' + rel.ligacoes + ' written');
      // Tocar num .glLink faz o MESMO salto da sugestao — e o que transforma ler um verbete
      // em ler quatro, e a unica forma de provar isso e seguir a ligacao.
      const pulo = await page.evaluate(() => {
        const l = document.querySelector('#listaGlossario .glRel .glLink');
        const destino = l.textContent;
        l.click();
        const el = [...document.querySelectorAll('#listaGlossario .glItem')].filter(e => e.dataset.t === destino)[0];
        return { destino, achou: !!el, aberto: !!el && el.classList.contains('aberto'),
          alvo: !!el && el.classList.contains('alvo') };
      });
      console.log('glossary related -> following a link landed on "' + pulo.destino + '" | opened:', pulo.aberto,
        '| flagged .alvo:', pulo.alvo);
      // O print do verbete ABERTO, com a fileira de remissoes. Os outros dois shots do
      // glossario pegam a lista recolhida e a busca; este e o unico que mostra o que a pessoa
      // le quando chega, e e onde se ve se .glRel cabe no corpo sem brigar com a fonte.
      await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-glossario-verbete.png') });
      if (!pulo.achou || !pulo.aberto || !pulo.alvo) errors.push('following a .glLink did not jump to "' + pulo.destino + '" opened and flagged');
    }

    // ===== GEOMETRIA — as assercoes que este arquivo nao tinha e por isso deixou passar =====
    // Este bloco existe por causa de um defeito real, e a licao vale para o arquivo inteiro:
    // um comentario de CSS fechou na metade, o navegador engoliu a regra `.glItem` (a que
    // recolhe o verbete), e o verbete "recolhido" passou a ocupar 334 px em vez de 45. A tela
    // virou um vao gigante entre termos — e o SMOKE PASSOU VERDE, porque conferia a CLASSE
    // `.aberto` e nunca a altura que a classe produz. So apareceu porque alguem abriu e olhou.
    //
    // O CLAUDE.md §6 ja avisa que o teste garante que nao quebrou, nunca que ficou bom, e isso
    // continua verdade: print nenhum se substitui por numero. Mas HA uma familia inteira de
    // defeito — CSS morto, regra sobrescrita, unidade errada — que nao lanca erro de console,
    // nao quebra JS, nao muda contagem de elemento, e portanto e invisivel para tudo o mais
    // que este arquivo sabe olhar. Contra ela, tres numeros custam quase nada.
    //
    // Sao MEDIDAS DE RELACAO, nao pixels absolutos: "o recolhido e muito menor que o aberto"
    // sobrevive a Direcao de Arte mudar o desenho; "o recolhido tem 44 px" viraria um teste
    // que reprova design novo em vez de reprovar defeito.
    const geo = await page.evaluate(() => {
      montarGlossario();
      const porta = document.querySelector('#listaGlossario .glAssunto');
      const rp = porta ? porta.getBoundingClientRect() : null;
      // a aba do fichario nao pode sair da folha: foi o defeito do escalonamento em porcentagem
      const abas = [...document.querySelectorAll('#listaGlossario .glAssunto')].map(b => {
        const n = b.querySelector('.glAssuntoNome');
        return n ? Math.round(b.getBoundingClientRect().right - n.getBoundingClientRect().right) : 999;
      });
      // entra na lista para medir o verbete recolhido contra o aberto
      const tudo = [...document.querySelectorAll('#listaGlossario .glAssunto')].find(p => p.dataset.seg === '*');
      if (tudo) tudo.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      const itens = [...document.querySelectorAll('#listaGlossario .glItem')];
      const fechado = itens[0] ? itens[0].getBoundingClientRect().height : 0;
      const cabeca = itens[0] ? itens[0].querySelector('.glCabeca').getBoundingClientRect().height : 0;
      // ABRE AQUI E MEDE DEPOIS, noutra chamada: a abertura e uma transicao de
      // `grid-template-rows` de 260 ms, e medir no mesmo quadro do clique devolve a altura
      // FECHADA — foi o primeiro resultado deste bloco, e o "defeito" era do teste.
      if (itens[1]) itens[1].querySelector('.glCabeca').click();
      // ninguem pode transbordar a folha na horizontal — a tela e mobile-first
      const rolo = document.getElementById('listaGlossario');
      const vazaH = rolo ? Math.round(rolo.scrollWidth - rolo.clientWidth) : 0;
      return { portaH: rp ? Math.round(rp.height) : 0, sobraDaAba: Math.min.apply(null, abas),
        fechado: Math.round(fechado), cabeca: Math.round(cabeca), vazaH };
    });
    await page.waitForTimeout(420);                 // 260 ms de transicao, com folga
    geo.aberto = await page.evaluate(() => {
      const a = document.querySelector('#listaGlossario .glItem.aberto');
      return a ? Math.round(a.getBoundingClientRect().height) : 0;
    });
    console.log('glossary geometry -> collapsed entry', geo.fechado + 'px (head ' + geo.cabeca + 'px)',
      '| opened', geo.aberto + 'px | door', geo.portaH + 'px | tab slack', geo.sobraDaAba + 'px | h-overflow', geo.vazaH + 'px');
    // 1. o recolhido e a CABECA e mais nada. Tolera 4 px de moldura; 334 contra 45 nao passa.
    if (geo.fechado > geo.cabeca + 4)
      errors.push('a collapsed glossary entry is ' + geo.fechado + 'px tall for a ' + geo.cabeca +
        'px head — the body is still taking space (is the .glItem rule being dropped?)');
    // 2. abrir tem que crescer de verdade, senao o corpo nunca aparece
    if (!(geo.aberto > geo.fechado * 1.5))
      errors.push('opening an entry grew it from ' + geo.fechado + ' to only ' + geo.aberto + 'px');
    // 3. a aba do fichario nao sai da folha (o escalonamento em % ja a botou 27px para fora)
    if (geo.sobraDaAba < 0)
      errors.push('a subject tab overflows its card by ' + (-geo.sobraDaAba) + 'px');
    // 4. nada de rolagem horizontal: a tela e mobile-first
    if (geo.vazaH > 1)
      errors.push('the glossary list overflows horizontally by ' + geo.vazaH + 'px');

    // Deixa a tela como ela abre, para o resto do passeio nao herdar filtro nem realce.
    await page.evaluate(() => montarGlossario());
    await passo('btnVoltarGloss', 'telaMenu');        // ...and VOLTAR hands the menu back
    const presa = await page.evaluate(() => {
      abrirTela('telaGlossario'); fecharTelas();
      return { aberta: document.getElementById('telaGlossario').classList.contains('aberta'),
        emTela: document.body.classList.contains('emTela') };
    });
    console.log('glossary -> fecharTelas() closes it:', !presa.aberta, '| chrome back:', !presa.emTela);
    if (presa.aberta) errors.push('fecharTelas() left telaGlossario open — is it missing from TELAS?');
    if (presa.emTela) errors.push('closing telaGlossario left the body in emTela');
    await passo('abrirMenu', 'telaMenu');             // devolve o menu para o resto do passeio
  }
  const dentroDeNovo = await passo('btnJogar', null); // and JOGAR hands the street back, chrome and all
  const partida = await page.evaluate(() => ({ total: S.energiaTotal, cenario: S.cenario }));
  console.log('in-game menu walk -> back on the street:', dentroDeNovo.abertas.length === 0,
    '| chrome back:', !dentroDeNovo.emTela, '| game kept: total', partida.total, 'scene', partida.cenario);
  if (!(partida.total >= 800)) errors.push('walking the menu lost the game in progress: total ' + partida.total);
  if (partida.cenario !== 0) errors.push('walking the menu moved the scenery: ' + partida.cenario);
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-menu-volta.png') });
  await page.evaluate(() => { localStorage.removeItem(CHAVE_JOGO); localStorage.removeItem(CHAVE_RET); });

  // ============================================================
  // A TRAVESSIA — o trecho em que o jogo PARA DE SER JOGO (lote A do arco)
  //
  // A promessa e verificavel e por isso esta aqui: durante a travessia NADA RENDE IMPACTO e
  // nada nasce. Um portao esquecido nao aparece em print nenhum — aparece num numero que sobe
  // quando nao devia. O `clicar()` continua sendo chamado 40 vezes aqui de proposito: o portao
  // que ele tem que atravessar e o de `travessiaViva`, e ele so e testado se for chamado.
  //
  // O BOTAO DOURADO SAIU DA TELA EM 11/08, POR DECISAO DO DONO ("o botao nao deveria aparecer
  // aqui, ne"), e esta linha era a metade do commit que ficou para tras: ate 12/08 o smoke
  // ainda exigia o botao NA tela enquanto o `encaixe.js` (bloco 26) ja exigia o contrario —
  // dois testes da mesma casa cobrando o oposto um do outro. Agora os dois cobram a mesma
  // coisa: durante a travessia nao ha botao.
  // As outras tres travas cobradas aqui:
  //   · nenhuma figura humana em cena — o retrato da caixa de fala fica fora do quadro;
  //   · a primeira vez nao e pulavel (o PULAR nao esta na tela);
  //   · ao terminar, o jogo volta inteiro: sem a classe, com o mundo desenhando de novo.
  // ============================================================
  const trav = await page.evaluate(async () => {
    fecharTelas();
    S.u1 = S.u2 = S.u3 = S.u4 = false;
    S.travessias = 0;                                  // ninguem atravessou ainda
    S.energia = 0; S.energiaTotal = 100; S.cenario = 0; saltoHora = 0;
    mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
    correrTravessia('pindorama', 'palmares', null);
    await new Promise(r => setTimeout(r, 200));
    const estiloPular = getComputedStyle(document.getElementById('btnFalaPular')).display;
    const retrato = getComputedStyle(document.getElementById('falaRetrato')).display;
    const botao = document.getElementById('btnClique').getBoundingClientRect();
    const antes = { total: S.energiaTotal, mobs: mobs.length, drops: drops.length,
      folhas: folhas.length, relogio };
    // o dedo, do jeito que o jogo o recebe: o toque solto e o segurar (que repete `clicar`)
    for (let i = 0; i < 40; i++) clicar();
    pular();
    await new Promise(r => setTimeout(r, 900));         // e quase um segundo de mundo rodando
    const durante = { total: S.energiaTotal, mobs: mobs.length, drops: drops.length,
      folhas: folhas.length, relogio, viva: travessiaAtiva(),
      classe: document.body.classList.contains('travessando') };
    return { pular: estiloPular, retrato, botao, antes, durante };
  });
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-travessia.png') });
  console.log('crossing -> impact', (trav.durante.total - trav.antes.total).toFixed(2),
    '| born:', trav.durante.mobs + trav.durante.drops + trav.durante.folhas,
    '| no button on screen:', !(trav.botao.width > 0 && trav.botao.height > 0),
    '| SKIP hidden:', trav.pular === 'none', '| portrait hidden:', trav.retrato === 'none',
    '| clock ran', (trav.durante.relogio - trav.antes.relogio).toFixed(0) + 's');
  if (!trav.durante.viva || !trav.durante.classe) errors.push('the crossing did not stay open');
  if (trav.durante.total !== trav.antes.total)
    errors.push('the golden button paid out during the crossing: +' + (trav.durante.total - trav.antes.total));
  if (trav.durante.mobs || trav.durante.drops || trav.durante.folhas)
    errors.push('something was born during the crossing: ' + JSON.stringify(trav.durante));
  if (trav.botao.width > 0 && trav.botao.height > 0)
    errors.push('the golden button was on screen during the crossing — the owner took it out on 11/08');
  if (trav.pular !== 'none') errors.push('the first crossing was skippable');
  if (trav.retrato !== 'none') errors.push('a human figure was on screen during the crossing');
  if (!(trav.durante.relogio - trav.antes.relogio > 3))
    errors.push('the sky did not darken during the crossing: the day clock stood still');
  // ...e o fim dela devolve o jogo: a agua acaba, o mundo volta, a segunda vez e pulavel
  const depoisTrav = await page.evaluate(async () => {
    for (let i = 0; i < 60 && travessiaAtiva(); i++) {
      if (emCerimonia()) fimCerimonia(); else avancarFala();
      await new Promise(r => setTimeout(r, 20));
    }
    await new Promise(r => setTimeout(r, 300));
    const x0 = worldX;
    await new Promise(r => setTimeout(r, 400));
    // e a segunda travessia ja nasce pulavel, porque o bit ficou gravado
    correrTravessia('pindorama', 'palmares', null);
    await new Promise(r => setTimeout(r, 150));
    const pular2 = getComputedStyle(document.getElementById('btnFalaPular')).display;
    fecharTelas();
    await new Promise(r => setTimeout(r, 100));
    return { viva: travessiaAtiva(), classe: document.body.classList.contains('travessando'),
      andou: worldX - x0, bit: S.travessias, pular2,
      limpou: travessiaAtiva() || document.body.classList.contains('travessando') };
  });
  console.log('crossing done -> world walking again:', depoisTrav.andou.toFixed(1) + 'px',
    '| bit stored:', depoisTrav.bit, '| second time skippable:', depoisTrav.pular2 !== 'none');
  if (depoisTrav.viva || depoisTrav.classe) errors.push('the crossing never ended');
  if (!(depoisTrav.andou > 1)) errors.push('the world did not start walking again after the crossing');
  if (!depoisTrav.bit) errors.push('the crossing was not recorded, so it will never be skippable');
  if (depoisTrav.pular2 === 'none') errors.push('the second crossing is still not skippable');
  if (depoisTrav.limpou) errors.push('closing the screens left the crossing state behind');
  await page.evaluate(() => { fecharTelas(); S.travessias = 0; localStorage.removeItem(CHAVE_JOGO); });

  // ---- FLOW 4: com a HISTÓRIA aberta, o mundo NÃO ANDA ----
  // Pedido do dono (2026-08-07): "o jogo já acontece enquanto a história passa, não deve ser
  // assim". Antes desta trava, 5 s de leitura rendiam 4,0 de impacto, 192 px de chão e três
  // chegadas nascidas e desistidas atrás do texto — tudo sem a pessoa saber. Medido com
  // test/medir-historia.js contra a build anterior; aqui fica a asserção que impede a volta.
  //
  // O u3 fica LIGADO de propósito: é o único ganho que não precisa de dedo, e é o que mais
  // facilmente escapa de um portão feito às pressas.
  //
  // A distinção que este teste NÃO cobre porque ela é decisão de direção: sob o MENU o mundo
  // continua vivo (DIRECAO.md, "a tela é o mundo"). Só a história para o relógio.
  const historia = await page.evaluate(async () => {
    fecharTelas();
    S.u1 = S.u2 = false; S.u3 = true; S.u4 = false;
    S.energia = 0; S.energiaTotal = 100; S.cenario = 0; S.modo = 'limpo'; saltoHora = 0;
    mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
    await new Promise(r => setTimeout(r, 300));
    // uma fala de verdade, pelo mesmo caminho da abertura, do fecho e da fala dos marcos
    abrirFala('SMOKE', 'agora', ['Uma linha, só para a tela ficar aberta.'], null);
    await new Promise(r => requestAnimationFrame(r));
    // um drop parado exatamente sob ela, DEPOIS de o mundo já estar parado: a colheita é por
    // PASSAR POR CIMA, então parada ela não pode recolhê-lo — e ele também não pode ficar
    // grudado esperando, tem de sair no primeiro quadro depois de a tela fechar
    drops.push({ wx: worldX + HX + 2, type: 'cash', t: 0, valor: 7 });
    const a = { worldX, total: S.energiaTotal, relogio,
      n: mobs.length + drops.length + folhas.length, drops: drops.length };
    await new Promise(r => setTimeout(r, 1000));
    const d = { worldX, total: S.energiaTotal, relogio,
      n: mobs.length + drops.length + folhas.length, drops: drops.length,
      aberta: document.getElementById('telaFala').classList.contains('aberta') };
    // e o retorno sem solavanco: o primeiro quadro depois de fechar anda um quadro, não um
    // segundo inteiro de chão acumulado
    const salto = await new Promise(res => {
      const x0 = worldX;
      fecharTelas();
      requestAnimationFrame(() => {
        const x1 = worldX;
        requestAnimationFrame(() => res({ primeiro: x1 - x0, normal: worldX - x1 }));
      });
    });
    await new Promise(r => setTimeout(r, 200));
    const dropSaiu = drops.length === 0;
    drops.length = 0; mobs.length = 0; folhas.length = 0; S.u3 = false;
    return { a, d, salto, dropSaiu };
  });
  console.log('story open -> world moved', (historia.d.worldX - historia.a.worldX).toFixed(2), 'px |',
    'impact', (historia.d.total - historia.a.total).toFixed(2), '| day clock',
    (historia.d.relogio - historia.a.relogio).toFixed(2) + 's | objects',
    historia.a.n, '->', historia.d.n, '| screen still open:', historia.d.aberta);
  console.log('  resume -> first frame', historia.salto.primeiro.toFixed(3), 'px vs a normal frame',
    historia.salto.normal.toFixed(3), 'px | the parked drop was taken after closing:', historia.dropSaiu);
  if (!historia.d.aberta) errors.push('the story screen closed on its own during the freeze test');
  if (Math.abs(historia.d.worldX - historia.a.worldX) > 1e-9) errors.push('the world kept scrolling under the story: ' + (historia.d.worldX - historia.a.worldX).toFixed(2) + 'px');
  if (Math.abs(historia.d.total - historia.a.total) > 1e-9) errors.push('impact was earned while the story was talking: ' + (historia.d.total - historia.a.total).toFixed(2));
  if (historia.d.n !== historia.a.n) errors.push('things were born or taken under the story: ' + historia.a.n + ' -> ' + historia.d.n);
  if (Math.abs(historia.d.relogio - historia.a.relogio) > 1e-9) errors.push('the day clock ran under the story: ' + (historia.d.relogio - historia.a.relogio).toFixed(2) + 's');
  if (historia.d.drops !== 1) errors.push('the drop parked under her was collected while she stood still');
  if (!historia.dropSaiu) errors.push('the parked drop stayed glued to the ground after the story closed');
  // um quadro a 60 fps anda ~0,64 px; um segundo acumulado andaria ~38. Três quadros de folga.
  if (historia.salto.primeiro > Math.max(historia.salto.normal * 3, 3)) {
    errors.push('closing the story handed a huge dt to the first frame: ' + historia.salto.primeiro.toFixed(2) + 'px');
  }

  // ============================================================
  // T1 (SPRINT 1) — a retenção é MEDIDA, passa pelo esquema, e não sai do aparelho.
  // O protótipo existe para responder "o loop segura alguém por três dias?" e até aqui não
  // gravava um número sobre isso. Três coisas provadas abaixo, nesta ordem:
  //   (1) gravou e leu de volta — os quatro números sobrevivem a um recarregamento;
  //   (2) registro adulterado cai no padrão, campo por campo, e não derruba nada;
  //   (3) o que é escrito no disco são os campos do ESQUEMA_RET e MAIS NENHUM.
  // ============================================================
  const t1 = await page.evaluate(async () => {
    fecharTelas(); fecharTudo();
    localStorage.removeItem(CHAVE_RET);
    R = RET_PADRAO(); carregarRetencao();       // hoje vira o dia 1
    R.segundos = 0;                             // abre a janela dos primeiros 60 s
    const cv = document.getElementById('scene');
    const r = cv.getBoundingClientRect();
    const toque = async (fx) => {
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true,
        clientX: r.left + r.width * fx, clientY: r.top + r.height / 2 }));
      cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      await new Promise(rr => setTimeout(rr, 30));
    };
    await toque(0.25); await toque(0.25);       // duas na metade que PULA
    await toque(0.75);                          // uma na que golpeia
    const janela = { esq: R.toqEsq, dir: R.toqDir };
    // e a janela FECHA: passados os 60 s de jogo, o toque não conta mais
    R.segundos = 61; await toque(0.25);
    const depois = { esq: R.toqEsq, dir: R.toqDir };
    R.segundos = 42;
    return { janela, depois, dias: R.dias, historia: R.historia };
  });
  // A HISTÓRIA aberta por TOQUE REAL no botão real — escrever o contador provaria a soma,
  // não o botão (a armadilha do cartão de ritmo, já paga).
  await page.tap('#abrirMenu');
  await page.waitForTimeout(150);
  await page.tap('#btnCompletude');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.resolve(__dirname, 'T1-historia-aberta.png') });
  await page.tap('#btnVoltarComp');
  await page.waitForTimeout(150);
  await page.tap('#btnConfig');                 // AJUSTES: onde os quatro números aparecem
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.resolve(__dirname, 'T1-ajustes-retencao.png') });
  const painel = await page.evaluate(() => ({
    historia: R.historia, segundos: R.segundos,
    linhas: Array.from(document.querySelectorAll('#cfgInfo canvas')).length,
    gravado: JSON.parse(localStorage.getItem(CHAVE_RET) || '{}')
  }));
  await page.tap('#btnVoltarCfg');
  await page.waitForTimeout(120);
  await page.tap('#btnJogar');
  await page.waitForTimeout(250);
  console.log('retention -> first 60s taps L/R:', t1.janela.esq + '/' + t1.janela.dir,
    '| after the window:', t1.depois.esq + '/' + t1.depois.dir,
    '| days', t1.dias, '| A HISTÓRIA opened', painel.historia + 'x',
    '| AJUSTES lines', painel.linhas);
  if (t1.janela.esq !== 2 || t1.janela.dir !== 1) errors.push('the first-60s taps were not counted by half: ' + JSON.stringify(t1.janela));
  if (t1.depois.esq !== t1.janela.esq) errors.push('a tap after the 60s window still counted');
  if (t1.dias !== 1) errors.push('a brand new record did not count today as day 1: ' + t1.dias);
  if (painel.historia !== t1.historia + 1) errors.push('opening A HISTÓRIA did not move the counter: ' + painel.historia);
  if (painel.linhas < 6) errors.push('the AJUSTES retention footer lost lines: ' + painel.linhas);
  // o que foi ao disco são os campos do esquema, nem um a mais (a cópia INDEPENDENTE, como
  // a do ESQUEMA_SAVE: gerar uma da outra deixaria de pegar um campo gravado sem esquema)
  // `fontes` e `chegou` entraram com A CHEGADA (a tela de fim, N3 do QA): `fontes` e a unica
  // forma honesta de a tela dizer "voce nunca abriu DE ONDE VEM", e `chegou` separa quem
  // terminou de quem esta terminando — da segunda vez a tela nao se anuncia sozinha.
  // `volta` entrou com a pergunta de uma linha da CHEGADA ("você voltaria amanhã?"): 0 nunca
  // perguntada, 1 perguntada e calada, 2/3/4 a resposta. Sem ela no esquema, a pergunta
  // voltaria a ser feita em toda chegada — e uma pergunta que insiste deixa de medir intenção.
  const retEsperadas = ['chegou', 'dias', 'fontes', 'historia', 'primeiro', 'segundos', 'tochas', 'toqDir', 'toqEsq', 'turbo', 'ultimo', 'volta'];
  const retChaves = Object.keys(painel.gravado).sort();
  console.log('retention written ->', retChaves.join(', '));
  if (retChaves.join(',') !== retEsperadas.join(',')) errors.push('the retention record carries fields the loader would discard: ' + retChaves.join(','));

  // ---- e o registro de retenção também é ENTRADA NÃO CONFIÁVEL ----
  const retSujo = await page.evaluate(() => {
    localStorage.setItem(CHAVE_RET, JSON.stringify({
      dias: 'muitos',            // wrong type
      primeiro: '2026-13-99',    // a date that does not exist
      ultimo: 42,                // not even a string
      segundos: -900,            // out of range
      historia: Infinity,        // not finite
      toqEsq: 9e9, toqDir: 3.7,  // over the ceiling, and not an integer
      tochas: NaN,
      inventado: { a: 1 }        // not on the schema at all
    }));
    R = RET_PADRAO(); diaNovo = false;
    carregarRetencao();
    return { dias: R.dias, primeiro: R.primeiro, ultimo: R.ultimo, segundos: R.segundos,
      historia: R.historia, toqEsq: R.toqEsq, toqDir: R.toqDir, tochas: R.tochas,
      inventado: 'inventado' in R, bonus: bonusDias(), hoje: diaLocal() };
  });
  console.log('tampered retention ->', JSON.stringify(retSujo));
  if (retSujo.dias !== 1) errors.push('a tampered day count was accepted: ' + retSujo.dias);
  if (retSujo.ultimo !== retSujo.hoje) errors.push('a tampered last-day was accepted: ' + retSujo.ultimo);
  if (retSujo.primeiro !== retSujo.hoje) errors.push('an impossible date got in as the first day: ' + retSujo.primeiro);
  if (retSujo.segundos !== 0) errors.push('negative playtime was accepted: ' + retSujo.segundos);
  if (retSujo.historia !== 0) errors.push('Infinity got into the A HISTÓRIA counter');
  if (retSujo.toqEsq !== 5000) errors.push('the tap counter was not clamped to its ceiling: ' + retSujo.toqEsq);
  if (retSujo.toqDir !== 3) errors.push('a fractional tap count was accepted: ' + retSujo.toqDir);
  if (retSujo.tochas !== 0) errors.push('NaN got into the torch counter');
  if (retSujo.inventado) errors.push('an unknown field was copied into the retention record');
  if (!isFinite(retSujo.bonus) || retSujo.bonus < 1) errors.push('the day bonus went wrong after a tampered retention record: ' + retSujo.bonus);
  await page.evaluate(() => { localStorage.removeItem(CHAVE_RET); R = RET_PADRAO(); carregarRetencao(); });

  const fps = await page.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    (function f() { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(f) : res(Math.round(n / 2)); })();
  }));
    // ---- A CRONOLOGIA, capitulo por capitulo em sequencia (pedido do dono, 08/08) ----
  // Tres regras, e as tres quebraram no mesmo dia por dois bugs meus:
  //  1. escolher o PROPRIO capitulo RETOMA onde parou (nao rebobina) e o jogo volta a andar;
  //  2. visitar capitulo ja vencido nao avanca sozinho, e nao move a fronteira;
  //  3. voltar ao capitulo da fronteira DESTRAVA — e o menu continua mostrando tudo o que
  //     ja foi alcancado, porque o destrave sai da FRONTEIRA e nao da cena atual.
  const crono = await page.evaluate(async () => {
    const ep = i => epocaDoCenario(i);
    const toca = k => document.querySelectorAll('.capItem')[k]
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    // A virada de capitulo tem cerimonia: 1,5 s nao bastava e o teste acusava congelamento
    // que nao existia. 100 x 40 ms = 4 s, com folga sobre os ~2,4 s medidos.
    // fecharTELAS, nao fecharTudo: fecharTudo fecha so as gavetas, e com a fala aberta o
    // verificarCenario sai cedo de proposito — o teste media um jogo que nao podia andar.
    const roda = async n => { for (let k = 0; k < n; k++) { verificarCenario(); fecharTelas(); await new Promise(r => setTimeout(r, 40)); } };
    fecharTelas();
    S.aberturas = 255; S.fechos = 255; S.travessias = 255;
    S.cenario = 3; S.fronteira = 3; S.energiaTotal = LIMIARES[2] + 50;
    montarCapitulos(); toca(ep(3));
    const retomou = S.cenario;
    S.energiaTotal = LIMIARES[3] + 50; await roda(100);
    const andouDepois = S.cenario;
    S.cenario = 4; S.fronteira = 4; S.energiaTotal = LIMIAR_FIM;
    montarCapitulos(); toca(0);
    const visitou = S.cenario; await roda(100);
    const ficouParado = S.cenario, frontIntacta = S.fronteira;
    montarCapitulos();
    const abertos = document.querySelectorAll('.capItem:not(.preso)').length;
    toca(ep(4));
    const destravou = S.cenario;
    S.energiaTotal = LIMIARES[4] + 50; await roda(100);
    return { retomou, andouDepois, visitou, ficouParado, frontIntacta, abertos, destravou, andouNoFim: S.cenario };
  });
  console.log('cronologia -> retomou na', crono.retomou, '| andou para', crono.andouDepois,
    '| visitou', crono.visitou, 'e ficou', crono.ficouParado,
    '| capitulos abertos apos visitar:', crono.abertos, '| destravou em', crono.destravou, '->', crono.andouNoFim);
  if (crono.retomou !== 3) errors.push('picking your own chapter rewound the scene');
  if (crono.andouDepois !== 4) errors.push('progress froze after picking your own chapter');
  if (crono.ficouParado !== crono.visitou) errors.push('visiting an old chapter dragged the player forward');
  if (crono.frontIntacta !== 4) errors.push('visiting an old chapter moved the frontier back');
  if (crono.abertos < 3) errors.push('visiting an old chapter re-locked the chapters already reached');
  if (crono.andouNoFim !== 5) errors.push('returning to the frontier did not unfreeze progress');


  // ============================================================
  // A SEQUENCIA — a corrente fecho -> travessia -> cerimonia -> abertura (QA, 2026-08-08)
  //
  // O smoke provava PECAS (a travessia roda, a cronologia anda, a fala abre). Nao provava a
  // CORRENTE, que e o que o dono pediu para conferir: "as coisas acontecendo na sequencia".
  // Uma virada de capitulo sem fecho, ou uma abertura que nao vem depois da travessia, e uma
  // regressao que passa em todos os testes anteriores e destroi o percurso.
  //
  // A regra que este bloco fixa, e que vale para os DOZE capitulos do arco:
  //   toda fronteira entre capitulos produz FECHO do que sai e ABERTURA do que entra, nesta
  //   ordem, com a cerimonia no meio; e a TRAVESSIA entra so onde ela esta declarada.
  const corrente = await page.evaluate(async () => {
    const espera = ms => new Promise(r => setTimeout(r, ms));
    const rot = () => document.getElementById('falaTit').getAttribute('aria-label') || '';
    const out = [];
    for (let i = 0; i + 1 < EPOCAS.length; i++) {
      fecharTelas();
      const cenaFim = EPOCA_CENA0[i] + EPOCAS[i].cenas - 1;
      S.cenario = cenaFim; S.fronteira = cenaFim;
      S.aberturas = 0; S.fechos = 0; S.travessias = 0;
      S.energiaTotal = LIMIARES[cenaFim] + 5; S.energia = S.energiaTotal;
      const passos = [];
      verificarCenario();
      passos.push(falaAberta() ? 'fecho(' + rot() + ')' : 'SEM-FECHO');
      if (falaAberta()) encerrarFala();
      await espera(80);
      if (travessiaAtiva()) {
        passos.push('travessia(' + travessiaViva.id + ')');
        // e enquanto ela roda, o botao dourado nao pode render nada
        const antes = S.energiaTotal; clicar(); pular();
        if (S.energiaTotal !== antes) passos.push('TRAVESSIA-PAGOU');
        encerrarFala(); await espera(80);
      }
      passos.push(document.getElementById('telaFala').classList.contains('cerimoniando') ? 'cerimonia' : 'SEM-CERIMONIA');
      passos.push(falaAberta() ? 'abertura(' + EPOCAS[epocaAtual()].nome + ')' : 'SEM-ABERTURA');
      out.push({ de: EPOCAS[i].nome, para: EPOCAS[i + 1].nome, passos, cena: S.cenario });
      pararFala(); fimTravessia(); fecharTelas();
    }
    // ...e a ULTIMA cena fecha o jogo: LIMIAR_FIM dispara o fecho do ultimo capitulo
    fecharTelas();
    S.cenario = TOTAL_CENAS - 1; S.fronteira = TOTAL_CENAS - 1;
    S.fechos = 0; S.aberturas = MASCARA_EPOCAS;
    S.energiaTotal = LIMIAR_FIM + 5; S.energia = S.energiaTotal;
    verificarCenario();
    const fim = falaAberta() ? rot() : 'SEM-FECHO-FINAL';
    pararFala(); fecharTelas();
    return { out, fim, ultimo: EPOCAS[EPOCAS.length - 1].nome };
  });
  corrente.out.forEach(c => console.log('sequence ' + c.de + ' -> ' + c.para + ': ' + c.passos.join(' -> ')));
  console.log('sequence end of game -> ' + corrente.fim);
  corrente.out.forEach((c, i) => {
    if (!/^fecho\(/.test(c.passos[0])) errors.push('no closing text at the ' + c.de + ' -> ' + c.para + ' boundary');
    if (c.passos[0] !== 'fecho(' + c.de + ')') errors.push('the closing text at ' + c.de + ' -> ' + c.para + ' belongs to another chapter: ' + c.passos[0]);
    if (c.passos.indexOf('SEM-CERIMONIA') >= 0) errors.push('the new chapter opened with no ceremony: ' + c.de + ' -> ' + c.para);
    if (c.passos[c.passos.length - 1] !== 'abertura(' + c.para + ')') errors.push('the arriving chapter did not speak: ' + c.de + ' -> ' + c.para + ' ended in ' + c.passos[c.passos.length - 1]);
    if (c.passos.indexOf('TRAVESSIA-PAGOU') >= 0) errors.push('the gold button earned during the crossing at ' + c.de + ' -> ' + c.para);
  });
  // a travessia mora ONDE ELA ESTA DECLARADA, e so ali — nem a mais nem a menos
  const travEsperada = await page.evaluate(() => EPOCAS.map((e, i) =>
    i + 1 < EPOCAS.length && travessiaEntre(e.id, EPOCAS[i + 1].id) >= 0).slice(0, EPOCAS.length - 1));
  corrente.out.forEach((c, i) => {
    const teve = c.passos.some(p => /^travessia\(/.test(p));
    if (teve !== travEsperada[i]) errors.push('the crossing appeared where it is not declared (or vanished where it is): ' + c.de + ' -> ' + c.para);
  });
  if (corrente.fim !== corrente.ultimo) errors.push('the last scene did not close the game: ' + corrente.fim);

  // ---- A HISTORIA: as 26 paginas, medidas DEPOIS de o navegador assentar ----
  // Nunca teve asercao nenhuma. Uma pagina perdida, uma altura que deixa de resolver, uma
  // barra de rolagem que volta: tudo isso quebra em silencio e so aparece em print.
  // Medir com scroll importa: `content-visibility: auto` deixa `innerText` VAZIO para o que
  // esta fora da tela, entao contar pagina vazia sem rolar ate ela conta 23 falsos vazios.
  const quad = await page.evaluate(async () => {
    fecharTelas(); montarCompletude(); abrirTela('telaCompletude');
    await new Promise(r => setTimeout(r, 260));
    const l = document.getElementById('listaCenas');
    const n = l.children.length, h = l.clientHeight;
    const alturas = new Set(), vazias = [];
    for (let k = 0; k < n; k++) {
      l.scrollTop = k * h;
      await new Promise(r => setTimeout(r, 40));
      const p = l.children[k];
      alturas.add(Math.round(p.getBoundingClientRect().height));
      const rotulos = [...p.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).join('');
      if (!p.innerText.trim() && !rotulos.trim()) vazias.push(k + 1);
    }
    l.scrollTop = l.scrollHeight;
    await new Promise(r => setTimeout(r, 120));
    const b = document.getElementById('btnVoltarComp').getBoundingClientRect();
    const noPonto = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
    const dentro = !!(noPonto && document.getElementById('btnVoltarComp').contains(noPonto));
    const r = { n, alturas: [...alturas], vazias, tela: h, rolo: l.scrollHeight,
      barra: l.offsetWidth - l.clientWidth, voltar: dentro };
    fecharTelas();
    return r;
  });
  console.log('comic ->', quad.n, 'pages | heights', quad.alturas.join(','), 'vs viewport', quad.tela,
    '| scroll', quad.rolo, '| scrollbar', quad.barra, '| blank pages', quad.vazias.length, '| VOLTAR reachable', quad.voltar);
  if (quad.n < 20) errors.push('the comic lost pages: ' + quad.n);
  if (quad.alturas.length !== 1 || quad.alturas[0] !== quad.tela) errors.push('a comic page is not exactly one screen tall: ' + quad.alturas.join(','));
  if (Math.abs(quad.rolo - quad.n * quad.tela) > 2) errors.push('the comic scroll does not measure N pages: ' + quad.rolo);
  if (quad.barra !== 0) errors.push('a scrollbar came back to the comic: ' + quad.barra);
  if (quad.vazias.length) errors.push('comic pages with nothing readable: ' + quad.vazias.join(','));
  if (!quad.voltar) errors.push('the floating VOLTAR is unreachable at the end of the comic');

  // ---- A TRAVA DE VOCABULARIO DO §2 ----
  // O CLAUDE.md nomeia palavras que NAO existem neste arquivo: descobrimento (nao houve —
  // havia gente aqui), pre-historia, primitivo (§2.1) e "escravo" como identidade (§2.4.8).
  // Nada cobrava isso: um texto novo escrito as pressas em qualquer capitulo passaria.
  // Duas exclusoes, e as duas sao deliberadas:
  //   1. o campo `f` (a fonte) nao entra — ele carrega TITULOS de obra, e "Rebeliao escrava
  //      no Brasil" (Reis, 2003) e a referencia mais citada do capitulo de 1835;
  //   2. trecho entre aspas nao entra — o jogo usa a palavra proibida para RECUSA-LA
  //      ("nao era 'escravo'. Escravizar foi o que fizeram com ela"), e reprovar isso
  //      empurraria o texto a deixar de nomear o problema.
  const vocab = await page.evaluate(() => {
    const falas = [];
    EPOCAS.forEach(e => { falas.push(...e.abertura, ...e.fecho); });
    TRAVESSIAS.forEach(t => falas.push(...t.linhas));
    LINHA_TEMPO.forEach(n => { ['q', 't', 'd', 'com'].forEach(k => { if (n[k]) falas.push(n[k]); }); });
    if (typeof MOMENTOS !== 'undefined') MOMENTOS.forEach(m => { ['q', 't', 'd'].forEach(k => { if (m[k]) falas.push(m[k]); }); });
    if (typeof TEXTOS !== 'undefined') TEXTOS.forEach(t => { if (typeof t === 'string') falas.push(t); });
    const proibidas = /(descobrimento|pr[ée].?hist[óo]ri|primitiv)/i;
    const identidade = /\b(escravos?)\b/i;
    const semAspas = s => s.replace(/[“"«][^”"»]*[”"»]/g, ' ').replace(/'[^']*'/g, ' ');
    const achados = [];
    falas.forEach(f => {
      const limpo = semAspas(String(f));
      if (proibidas.test(limpo)) achados.push('PROIBIDA: ' + f.slice(0, 70));
      if (identidade.test(limpo)) achados.push('IDENTIDADE: ' + f.slice(0, 70));
    });
    return { n: falas.length, achados };
  });
  console.log('§2 vocabulary ->', vocab.n, 'authored lines checked |', vocab.achados.length, 'hits');
  vocab.achados.forEach(a => errors.push('§2 vocabulary: ' + a));

console.log('FPS:', fps);

  problemasDeComentario.forEach(function (p) { errors.push('COMMENT LINT: ' + p); });
  console.log(errors.length ? 'FAIL\n' + errors.join('\n') : 'PASS — no errors');
  await browser.close();
  if (posto.servidor) posto.servidor.close();
  process.exit(errors.length ? 1 : 0);
})();
