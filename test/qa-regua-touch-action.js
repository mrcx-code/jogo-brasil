// A TERCEIRA CONJUNÇÃO QUE PRENDE O BOTÃO E A RÉGUA DEIXA PASSAR — QA, 03/09, auditoria da
// entrega `regua-retrato-sem-alcancabilidade`.
//
//   node test/qa-regua-touch-action.js
//
// ⚠ ELE SAI 1 HOJE, DE PROPÓSITO — é o achado, não um defeito do instrumento. **NÃO PENDURE NO CI
// enquanto estiver vermelho.** Quando o `alcanceDoBotao()` do `test/regua-larga.js` passar a ler
// `touch-action`, este arquivo vira verde e AÍ ele é o portão que impede a volta.
//
// O QUE ELE REFUTA. A entrega alega, e a alegação foi verificada e é verdadeira até onde vai:
//   · crescer a mobília sozinho (`#poste{margin-top:250px}`) passa 6/6 corretamente — medido aqui,
//     exit 0, porque o `overflow-y:auto` de `estilo.css:847` cria rolagem de verdade e resgata;
//   · matar a rolagem sozinho (`#telaMenu{overflow-y:hidden}`) passa 6/6 — medido, exit 0, porque
//     sem crescimento não há o que esconder (`scrollHeight − clientHeight = 0` nas seis);
//   · logo, `cfgOk` "só dispara na CONJUNÇÃO (cresce E perde a rolagem)".
//
// A CONJUNÇÃO QUE FALTOU, e ela prende o botão PARA O DEDO sem a régua ver:
//
//     #poste{margin-top:250px}  +  #telaMenu{touch-action:none}
//
// `touch-action: none` cancela o pan por TOQUE. O `overflow-y` continua `auto`, então o resgate do
// `alcanceDoBotao()` — `p.scrollTop = p.scrollHeight` — funciona, o botão volta para dentro da
// janela e a asserção diz "alcançável". Num telefone, nenhum dedo produz essa rolagem.
//
// MEDIDO NESTA MÁQUINA, com a régua JÁ ATUALIZADA (exit code real do terminal):
//   REGUA_DEFEITO='#poste{margin-top:250px!important} #telaMenu{touch-action:none!important}' \
//     node test/regua-larga.js   ->   exit 0, retrato 0/6 reprovados, 0 linhas "PRESO".
// E a geometria por trás desse verde, medida por esta sonda (bottom do #btnConfig contra a janela,
// ANTES de qualquer rolagem, e a sobra que só o script consegue rolar):
//   320×568  bottom  807/568 FORA · sobraY 243     390×844  bottom  987/844 FORA · sobraY 163
//   360×640  bottom  861/640 FORA · sobraY 238     412×915  bottom 1022/915 FORA · sobraY 127
//   390×568  bottom  794/568 FORA · sobraY 230     430×932  bottom 1030/932 FORA · sobraY 118
// Nas seis, o botão está de 118 a 243 px abaixo da borda e só o `scrollTop` do script o traz de
// volta. O comentário da própria função diz "rola de verdade só quem o dedo conseguiria rolar" —
// `touch-action` é justamente a propriedade que decide isso, e ela não é lida.
//
// POR QUE ISTO NÃO É HIPÓTESE DE LABORATÓRIO. Hoje o repositório escreve `touch-action:
// manipulation` em três lugares (`estilo.css:203` no body, `:510` em `button`, `:2880`), e
// `manipulation` continua deixando rolar — em produção `#telaMenu` computa `touch-action: auto`
// nas seis telas, medido. O risco é a MUDANÇA: `touch-action: none` num contêiner que rola é o
// conserto clássico de rubber-band/duplo-toque em telefone, e o `#telaMenu` já carrega
// `overscroll-behavior: contain` na MESMA linha 847, que é o outro remédio da mesma família. As
// duas conjunções que a entrega testou também são CSS que ninguém escreveu ainda; esta é do mesmo
// tipo, e a régua vê aquelas e não vê esta.
//
// COMO FECHAR (critério de aceite deste arquivo virar verde): no laço de resgate do
// `alcanceDoBotao()`, um contêiner só conta como rolável pelo dedo se, além de
// `overflowY ∈ {auto, scroll}` e `scrollHeight − clientHeight > 1`, o `touch-action` computado
// permitir pan vertical (isto é, NÃO for `none`, `pan-x`, `pan-left`, `pan-right`, nem
// `pinch-zoom` sozinho). E a mensagem de `cfgMotivo` diz qual das três condições falhou — a lição
// 2.9 é imprimir o estado, não adivinhar.
const { chromium } = require('playwright');
const { spawnSync } = require('child_process');
const path = require('path');
// ⚠ `ABRIR(...)` SOBE UM SERVIDOR na porta derivada do caminho da raiz, e o filho
// (`regua-larga.js`) sobe outro na MESMA porta. Por isso a régua roda PRIMEIRO, e só depois esta
// sonda chama `ABRIR()` — medido: com a ordem invertida o filho falha com
// `page.goto: Timeout 30000ms exceeded` e a saída lida vira 0 linhas de retrato, que é vermelho
// de instrumento com cara de vermelho de produto.
const ABRIR = require('./abrir.js');

// As mesmas seis telas do laço de retrato do test/regua-larga.js.
const TELAS = [
  ['iphone SE', 320, 568], ['android baixo', 360, 640], ['retrato curto', 390, 568],
  ['iphone 12/13', 390, 844], ['pixel 7/8', 412, 915], ['iphone 15 pmax', 430, 932],
];
const DEFEITO = '#poste{margin-top:250px!important} #telaMenu{touch-action:none!important}';

(async () => {
  // ============================================================================
  // A RÉGUA DE VERDADE, NÃO UM MODELO DELA — E ELA RODA PRIMEIRO (a nota da porta, acima).
  // Este bloco é o que faz este arquivo VIRAR
  // VERDE sozinho quando o conserto chegar: ele roda `test/regua-larga.js` como processo separado,
  // com a mesma conjunção na chave `REGUA_DEFEITO`, e conta as linhas de RETRATO em que ela diz
  // "configurações PRESO". Um instrumento que modelasse a régua em JS ficaria vermelho para sempre
  // — a versão anterior deste arquivo fazia isso, e seria decoração ao contrário.
  let presosDeVerdade = 0;
  let vistosPelaRegua = 0;
  // O CONTROLE DE QUE ELE APROVA TAMBÉM (lição 2.8 ao contrário): `QA_REGUA=<arquivo>` aponta
  // para outra régua. Visto saindo **0** com uma cópia do `regua-larga.js` em que o laço de
  // resgate do `alcanceDoBotao()` também lê `touch-action` — isto é, este arquivo não é vermelho
  // permanente: ele vira verde no dia do conserto, e só nele.
  const REGUA = process.env.QA_REGUA
    ? path.resolve(process.env.QA_REGUA)
    : path.join(__dirname, 'regua-larga.js');
  const rr = spawnSync(process.execPath, [REGUA], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    env: Object.assign({}, process.env, { REGUA_DEFEITO: DEFEITO }),
  });
  const saidaRegua = String(rr.stdout || '') + String(rr.stderr || '');
  const NOMES = TELAS.map((t) => t[0]);
  const linhasRetrato = saidaRegua.split('\n').filter((l) => NOMES.some((n) => l.indexOf(n) >= 0));
  vistosPelaRegua = linhasRetrato.filter((l) => l.indexOf('configurações PRESO') >= 0).length;
  console.log('');
  console.log('a régua de verdade, com REGUA_DEFEITO ligado: exit ' + rr.status
    + ', ' + linhasRetrato.length + ' linha(s) de retrato lidas');
  if (linhasRetrato.length !== TELAS.length) {
    console.error('');
    console.error('FALHA DE LEITURA: esperava ' + TELAS.length + ' linhas de retrato na saída da régua e li '
      + linhasRetrato.length + '. O formato da saída mudou — esta sonda estaria contando o nada.');
    console.error('  Últimas 12 linhas da régua:');
    for (const l of saidaRegua.trim().split('\n').slice(-12)) console.error('  | ' + l);
    process.exit(1);
  }

  const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  console.log('A CONJUNÇÃO: ' + DEFEITO);
  console.log('');
  console.log('tela                  | antes de rolar     | sobraY | touch-action | o dedo rola? | a régua diria');
  for (const [nome, w, h] of TELAS) {
    const pg = await nav.newPage();
    await pg.setViewportSize({ width: w, height: h });
    await pg.goto(ALVO);
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!document.getElementById('telaMenu')
      && document.getElementById('telaMenu').classList.contains('aberta'),
      null, { timeout: 30000 }).catch(() => {});
    await pg.addStyleTag({ content: DEFEITO });
    // a mobília do menu anda (`brota .42s` + .12s de atraso no poste): ler antes disso mede um
    // layout que ainda está em movimento (lição paga em 23/08, PENDENTES 69).
    await pg.waitForTimeout(900);
    const r = await pg.evaluate(() => {
      const m = document.querySelector('#telaMenu');
      const c = document.getElementById('btnConfig');
      const J = innerHeight;
      const antes = c.getBoundingClientRect();
      const cs = getComputedStyle(m);
      const sobraY = m.scrollHeight - m.clientHeight;
      // o pan vertical por TOQUE é o que `touch-action` decide; `auto` e `manipulation` deixam,
      // `none` e as variações só-horizontais não.
      const ta = cs.touchAction;
      const dedoRola = !/^(none|pan-x|pan-left|pan-right|pinch-zoom)$/.test(ta.trim());
      m.scrollTop = m.scrollHeight;                 // o mesmo resgate que o alcanceDoBotao faz
      const dep = c.getBoundingClientRect();
      return {
        J, antesBottom: Math.round(antes.bottom), depBottom: Math.round(dep.bottom),
        sobraY, ta, oy: cs.overflowY, dedoRola,
        cabiaAntes: antes.bottom <= J + 2, cabeDepoisDoScript: dep.bottom <= J + 2,
      };
    });
    // PRESO DE VERDADE = estava fora da janela, e o único jeito de voltar é uma rolagem que o dedo
    // não consegue produzir. Isto é medição PRÓPRIA — não passa por função nenhuma da régua.
    const preso = !r.cabiaAntes && !r.dedoRola;
    if (preso) presosDeVerdade++;
    console.log('  ' + nome.padEnd(15) + w + 'x' + h
      + ' | bottom ' + String(r.antesBottom).padStart(4) + '/' + r.J + ' ' + (r.cabiaAntes ? 'cabe' : 'FORA')
      + ' | ' + String(r.sobraY).padStart(6)
      + ' | ' + r.ta.padEnd(12)
      + ' | ' + (r.dedoRola ? 'sim' : 'NÃO')
      + ' | volta com scrollTop do script: ' + (r.cabeDepoisDoScript ? 'sim' : 'não'));
    await pg.close();
  }
  await nav.close();

  console.log('');
  console.log('presos para o dedo: ' + presosDeVerdade + '/6 · vistos pela régua: ' + vistosPelaRegua + '/6');
  if (presosDeVerdade > vistosPelaRegua) {
    console.error('');
    console.error('ACHADO ABERTO — ' + (presosDeVerdade - vistosPelaRegua) + ' tela(s) em que o botão está preso'
      + ' para o dedo e a régua o chama de alcançável.');
    console.error('  A asserção `cfgOk` resgata por `scrollTop`, que é rolagem de SCRIPT. O dedo não');
    console.error('  tem esse botão. Critério de aceite para fechar está no cabeçalho deste arquivo.');
    process.exit(1);
  }
  if (presosDeVerdade === 0) {
    console.error('');
    console.error('INSTRUMENTO SEM MORDIDA: a conjunção não prendeu o botão em tela nenhuma — o CSS');
    console.error('  do jogo mudou e esta sonda precisa ser remedida antes de valer alguma coisa.');
    process.exit(1);
  }
  console.log('ok — a régua enxerga as ' + presosDeVerdade + ' tela(s) presas; o buraco de 03/09 está fechado.');
  process.exit(0);
})();
