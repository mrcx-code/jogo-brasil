// SONDA DO QA (lote-0903) — B5 da entrega `regua-touch-action` alega que "a semantica de
// intersecao de touch-action entre ancestral e descendente nao pode ser verificada com toque
// real numa maquina headless". Este arquivo REFUTA a justificativa: da para modelar a
// intersecao pela cadeia de ancestrais usando so `getComputedStyle`, sem dedo nenhum. O laco
// de resgate do `alcanceDoBotao()` no `test/regua-larga.js` para em `p === menu`, entao um
// `body{touch-action:none}` ou `html{touch-action:none}` (ancestrais ACIMA do menu) sao
// invisiveis para ele — o mesmo defeito que a entrega alegou consertar, uma casa acima.
//
// MEDIDO NA CONJUNCAO com `#poste{margin-top:250px}`, DEPOIS da entrega B, na regua VIVA
// (exit code real do processo filho):
//   REGUA_DEFEITO='body{touch-action:none!important} #poste{margin-top:250px!important}' node test/regua-larga.js  -> exit 0 (FALSO VERDE)
//   REGUA_DEFEITO='#poste{margin-top:250px!important; touch-action:none!important}'      node test/regua-larga.js  -> exit 0 (FALSO VERDE)
//   REGUA_DEFEITO='#poste{margin-top:250px!important} #telaMenu{touch-action:none!important}' (a que a entrega COBRE)  -> exit 1
//
// A PROVA de que a intersecao E modelavel sem toque: este arquivo abre o jogo em headless e
// mostra a cadeia inteira (do #btnConfig ate html), lendo `touch-action` computado em cada
// no. Se algum no bloqueia pan-y (`none`/`pan-x`/`pan-left`/`pan-right`/`pinch-zoom`), o pan
// para o dedo esta cancelado pela regra de intersecao do spec — INDEPENDENTE de o no ser ou
// nao o ancestral rolavel mais proximo. O laco atual da regua so olha os que rolam.
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');
const path = require('path');

(async () => {
  const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage();
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.goto(ALVO);
  await pg.waitForFunction(() => typeof S !== 'undefined' && !!document.getElementById('telaMenu')
    && document.getElementById('telaMenu').classList.contains('aberta'),
    null, { timeout: 30000 }).catch(() => {});

  const CENARIOS = [
    { n: 'limpo',        css: '', esperadoCancelado: false },
    { n: 'menu:none',    css: '#telaMenu{touch-action:none!important}',              esperadoCancelado: true },
    { n: 'body:none',    css: 'body{touch-action:none!important}',                    esperadoCancelado: true },
    { n: 'poste:none',   css: '#poste{touch-action:none!important}',                  esperadoCancelado: true },
    { n: 'html:none',    css: 'html{touch-action:none!important}',                    esperadoCancelado: true },
  ];
  let ruins = 0;
  for (const c of CENARIOS) {
    const r = await pg.evaluate((css) => {
      const reset = document.createElement('style');
      reset.textContent = 'html,body,#poste,#telaMenu{touch-action:auto}';
      document.head.appendChild(reset);
      let injetado = null;
      if (css) {
        injetado = document.createElement('style');
        injetado.textContent = css;
        document.head.appendChild(injetado);
      }
      const cfg = document.getElementById('btnConfig');
      const cadeia = [];
      for (let p = cfg; p; p = p.parentElement) {
        const cs = getComputedStyle(p);
        cadeia.push({ id: p.id || null, tag: p.tagName.toLowerCase(), ta: cs.touchAction });
      }
      reset.remove();
      if (injetado) injetado.remove();
      return cadeia;
    }, c.css);
    const bloqueia = (ta) => /^(none|pan-x|pan-left|pan-right|pinch-zoom)$/.test(String(ta).trim());
    const cancelado = r.find(x => bloqueia(x.ta));
    const ok = (!!cancelado) === c.esperadoCancelado;
    if (!ok) ruins++;
    console.log((ok ? '  ok  ' : '  X   ') + c.n.padEnd(12)
      + (cancelado ? ('cancelado por ' + (cancelado.id ? '#' + cancelado.id : cancelado.tag) + ' (' + cancelado.ta + ')') : 'pan-y permitido')
      + '  | cadeia: ' + r.map(x => (x.id ? '#' + x.id : x.tag) + ':' + x.ta).join(' > '));
  }
  await nav.close();
  if (ruins) { console.error('FALHA: ' + ruins + ' cenario(s) fora do esperado.'); process.exit(1); }
  console.log('');
  console.log('ok — a intersecao de touch-action e modelavel por getComputedStyle sozinho, sem toque real.');
  console.log('     B5 justificou o gap parcial dizendo que nao dava. Da — o laco da regua podia subir ate html.');
  process.exit(0);
})();
