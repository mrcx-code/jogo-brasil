// QA ADVERSARIAL · O CAMINHO ESCOLAR (?origem=escola) NASCE DESLIGADO — instrumento INDEPENDENTE
//
// Por que existe, e não é redundância do bloco 17c do `encaixe.js`: 17c é o instrumento de quem
// escreveu a mudança. Este aqui foi montado do zero, com outro caminho de servidor (`abrir.js`,
// http real, sem `route.fulfill` do HTML) e outro jeito de contar pedido, justamente para não
// herdar o defeito de instrumento que o próprio autor consertou. Se os dois concordam, a
// afirmação sobrevive a dois instrumentos; se discordam, um deles está mentindo e isso é o achado.
//
// Ele também vai ALÉM da tabela entregue: normalização da CHAVE (não só do valor), parâmetro
// repetido, valor adulterado na chave, três toques seguidos no interruptor, e hash em vez de busca.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
let falhas = 0, contas = 0;
const ok = (c, msg) => { contas++; if (!c) falhas++; console.log((c ? '  ok   ' : '  FALHA ') + msg); };

// Uma carga de página. Devolve o estado CRU: a variável do jogo, as duas chaves, e quantos
// pedidos saíram para o host de medição. Os pedidos são ABORTADOS (nada chega à produção) e
// contados na ida — contar na resposta perderia os que o adblock de verdade também perderia.
async function carga(browser, busca, op) {
  op = op || {};
  const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let pedidos = 0;
  await pg.route('**://us.i.posthog.com/**', r => { pedidos++; return r.abort(); });
  if (op.semear) {
    // semeia o localStorage ANTES de qualquer script do jogo, na origem certa
    await pg.addInitScript(op.semear);
  }
  await pg.goto(ALVO + busca);
  await pg.waitForFunction(() => typeof S !== 'undefined' && !!document.getElementById('hudTop')
    && !!document.getElementById('telaMenu') && document.getElementById('telaMenu').classList.contains('aberta'),
    null, { timeout: 30000 });
  if (op.tocar) {
    await pg.evaluate(op.tocar);
    pedidos = 0;
    await pg.goto(ALVO + (op.buscaVolta !== undefined ? op.buscaVolta : busca));
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!document.getElementById('telaMenu')
      && document.getElementById('telaMenu').classList.contains('aberta'), null, { timeout: 30000 });
  }
  // AUSÊNCIA SÓ SE PROVA COM RELÓGIO: não há estado a esperar quando a alegação é "não sai nada".
  await pg.waitForTimeout(1600);
  const est = await pg.evaluate(() => ({
    ligado: typeof medirLigado === 'boolean' ? medirLigado : null,
    medir: (() => { try { return localStorage.getItem('jogo_brasil_medir'); } catch (e) { return 'ERRO'; } })(),
    anon: (() => { try { return localStorage.getItem('jogo_brasil_anon'); } catch (e) { return 'ERRO'; } })()
  }));
  await pg.close();
  return { busca, pedidos, ...est };
}

(async () => {
  const browser = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const linha = (rot, r) => console.log('   [' + rot + ' ' + JSON.stringify(r.busca) + '] pedidos=' + r.pedidos
    + ' | medirLigado=' + r.ligado + ' | medir=' + JSON.stringify(r.medir) + ' | anon=' + (r.anon ? 'SORTEADO' : r.anon));

  console.log('\n---- A · a tabela entregue, refeita em outro instrumento');
  const a = await carga(browser, '?origem=escola'); linha('escola', a);
  ok(a.ligado === false && a.pedidos === 0 && a.anon === null && a.medir === 'nao',
    'escola: nasce false, 0 pedidos, anon NÃO sorteado, medir="nao"');
  const b = await carga(browser, ''); linha('comum', b);
  ok(b.ligado === true && b.pedidos > 0 && b.medir === null && !!b.anon,
    'link comum: nasce true, ' + b.pedidos + ' pedido(s), medir intocado, anon sorteado');
  const c = await carga(browser, '?utm_source=zap&origem=jornal'); linha('parecido', c);
  ok(c.ligado === true && c.pedidos > 0 && c.medir === null,
    'origem=jornal com utm_: igual ao link comum — a proteção não vaza para o público geral');
  const d = await carga(browser, '?origem=escola', {
    tocar: () => { fecharTudo(); abrirTela('telaConfig'); montarConfig();
      document.getElementById('btnMedir').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }
  }); linha('escola→toque→escola', d);
  ok(d.ligado === true && d.medir === 'sim' && d.pedidos > 0,
    'escola → um toque → volta pelo MESMO link escolar: a escolha manual venceu o padrão de origem');

  console.log('\n---- B · tentativas de burlar / de quebrar, que a entrega não cobriu');
  for (const [rot, q, esperaProtegido] of [
    ['valor MAIÚSCULO',      '?origem=ESCOLA', true],
    ['valor com espaços',    '?origem=%20escola%20', true],
    ['CHAVE maiúscula',      '?ORIGEM=escola', true],
    ['chave e valor MAIÚSC', '?ORIGEM=ESCOLA', true],
    ['parâmetros extras',    '?a=1&origem=escola&b=2', true],
    ['origem repetida',      '?origem=escola&origem=jornal', true],
    ['no hash, não na busca', '#origem=escola', false],
    ['quase (escolar)',      '?origem=escolar', false],
  ]) {
    const r = await carga(browser, q); linha(rot, r);
    const protegido = r.ligado === false && r.pedidos === 0 && r.medir === 'nao' && r.anon === null;
    ok(protegido === esperaProtegido, '[' + rot + '] protegido=' + protegido + ' (esperado ' + esperaProtegido + ')');
  }

  console.log('\n---- C · o save como entrada não confiável, e o interruptor batido três vezes');
  const g = await carga(browser, '?origem=escola', {
    semear: () => { try { localStorage.setItem('jogo_brasil_medir', 'talvez'); } catch (e) {} }
  }); linha('valor adulterado + escola', g);
  ok(g.ligado === false && g.pedidos === 0 && g.medir === 'nao',
    'chave adulterada ("talvez") é "ninguém decidiu": o padrão escolar tem voz e protege');
  const h = await carga(browser, '?origem=escola', {
    semear: () => { try { localStorage.setItem('jogo_brasil_medir', ''); } catch (e) {} }
  }); linha('string vazia + escola', h);
  ok(h.ligado === false && h.medir === 'nao', 'string vazia idem — protege');
  const i = await carga(browser, '?origem=escola', {
    semear: () => { try { localStorage.setItem('jogo_brasil_medir', 'sim'); } catch (e) {} }
  }); linha('decisão "sim" prévia + escola', i);
  ok(i.ligado === true && i.pedidos > 0 && i.medir === 'sim',
    'quem JÁ tinha decidido "sim" chega pela escola e continua ligado — decisão não se sobrescreve');
  const j = await carga(browser, '?origem=escola', {
    tocar: () => { fecharTudo(); abrirTela('telaConfig'); montarConfig();
      const bt = document.getElementById('btnMedir');
      for (let n = 0; n < 3; n++) bt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }
  }); linha('três toques + volta escola', j);
  ok(j.ligado === true && j.medir === 'sim' && j.pedidos > 0,
    'liga-desliga-liga: o ÚLTIMO toque é o que fica, mesmo voltando pelo link escolar');

  await browser.close();
  console.log('\n' + (falhas ? falhas + ' FALHA(S) de ' + contas : 'PASSOU — ' + contas + ' asserções'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
