// ===== OS SEIS NÓS INDEXADOS: QUEM OS VÊ, E QUEM NÃO VÊ =====
//
// POR QUE ESTE INSTRUMENTO EXISTE.
// O `PENDENTES.md` item 27 termina numa afirmação estrutural que nunca foi MEDIDA — foi lida
// no código: *"os seis nós `{ tipo: 'momento', i: 0..5 }` são invisíveis para dois dos três
// consumidores; consequência: Zumbi, os mocambos, o Censo 2022 indígena e a portaria dos
// Tupinambá nunca saem na nota da volta"*. Ler o filtro e concluir é exatamente o modo de
// falha que a lição 2.1 do `EQUIPE.md` cobra caro (`abrirTela` ABRE mas não MONTA): o grep
// mostra a peneira, não mostra o que a PESSOA recebe.
//
// Então aqui nada se conclui de `grep`. Cada número sai do jogo vivo:
//  · a nota da volta é lida do DOM depois de `mostrarRetorno()` — o mesmo caminho que
//    `pagarAusencia()` percorre quando alguém volta —, varrendo TODA fronteira × TODO dia;
//  · a rua de O QUE TEM FONTE é lida por `fraseDoMob()` sobre uma varredura de `wx`, que é
//    o único dado de onde ela tira a frase;
//  · as placas saem de `MARCOS`, a lista já derivada e viva no jogo.
//
// E há um CONTROLE de caminho: uma partida é montada em `localStorage` com `salvoEm` de 12 h
// atrás e a página é RECARREGADA, sem chamar função nenhuma à mão. Se o papel abrir sozinho e
// a nota que ele traz for a mesma que a varredura previu para aquele (fronteira, dia), o
// atalho está medindo o caminho da pessoa. Se divergir, o instrumento imprime as duas e falha
// — porque aí o número da varredura não vale nada.
//
// O QUE ELE COBRA (exit 1 se qualquer uma cair):
//  1. os seis nós indexados existem e apontam para `MOMENTOS[0..5]`;
//  2. nenhum deles carrega `t`/`d`/`f` PRÓPRIO — que é a peneira das três superfícies;
//  3. a página de A HISTÓRIA os mostra (a terceira superfície os enxerga);
//  4. o conteúdo dos seis não está DUPLICADO em nenhum nó que tenha `t`/`d`/`f` próprio —
//     senão a consequência anunciada no PENDENTES seria falsa;
//  5. a nota da volta, varrida em toda fronteira e todo dia, nunca entrega nenhum dos seis;
//  6. a rua de O QUE TEM FONTE, varrida em `wx`, nunca entrega nenhum dos seis;
//  7. o controle por RECARGA concorda com a varredura.
//
// Ele foi VISTO REPROVANDO (lição 2.8): `NOS_DEFEITO=1` faz o instrumento fingir que os seis
// já saem na nota da volta, e as asserções 5 e 6 caem. Rode uma vez com isso antes de acreditar
// no verde.
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
const DEFEITO = !!process.env.NOS_DEFEITO;

let falhas = 0, passes = 0;
function ok(cond, msg) {
  if (cond) { passes++; console.log('  ok   ' + msg); }
  else { falhas++; console.log('  FALHA ' + msg); }
}
function sec(t) { console.log('\n== ' + t + ' =='); }
function log(t) { console.log(t); }

(async () => {
  const nav = await chromium.launch({ executablePath: require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 } });
  const errosConsole = [];
  pg.on('pageerror', e => errosConsole.push(String(e)));
  await pg.goto(ALVO, { waitUntil: 'load' });
  await pg.waitForFunction(() => typeof LINHA_TEMPO !== 'undefined' && typeof MOMENTOS !== 'undefined');

  // ------------------------------------------------------------------
  sec('1 · os seis nós indexados, e o que eles carregam');
  const censo = await pg.evaluate(() => {
    const idx = [];
    LINHA_TEMPO.forEach((n, pos) => {
      if (n.tipo === 'momento' && typeof n.i === 'number') {
        idx.push({
          pos, i: n.i,
          temCena: Object.prototype.hasOwnProperty.call(n, 'cena'),
          cena: n.cena,
          temT: !!n.t, temD: !!n.d, temF: !!n.f, temQ: !!n.q,
          alvoT: MOMENTOS[n.i] && MOMENTOS[n.i].t,
          alvoQ: MOMENTOS[n.i] && MOMENTOS[n.i].q,
          quem: n.quem,
        });
      }
    });
    const comCampos = LINHA_TEMPO.filter(n => n.tipo === 'momento' && n.t && n.d && n.f);
    return {
      indexados: idx,
      momentosTotal: LINHA_TEMPO.filter(n => n.tipo === 'momento').length,
      comCamposTotal: comCampos.length,
      titulosComCampos: comCampos.map(n => n.t),
      momentosTitulos: MOMENTOS.map(m => m.t),
      totalCenas: typeof TOTAL_CENAS !== 'undefined' ? TOTAL_CENAS : -1,
    };
  });
  log('   momentos na LINHA_TEMPO: ' + censo.momentosTotal
    + '  ·  com t+d+f próprios: ' + censo.comCamposTotal
    + '  ·  indexados por `i`: ' + censo.indexados.length);
  censo.indexados.forEach(n => log('     linha ~' + n.pos + '  i=' + n.i
    + '  cena=' + (n.temCena ? n.cena : 'AUSENTE')
    + '  t/d/f próprios=' + [n.temT, n.temD, n.temF].map(b => b ? 'S' : 'n').join('')
    + '  → MOMENTOS[' + n.i + '] "' + n.alvoT + '"'));

  ok(censo.indexados.length === 6, 'são SEIS nós indexados (achados: ' + censo.indexados.length + ')');
  ok(censo.indexados.map(n => n.i).join(',') === '0,1,2,3,4,5',
    'os índices são 0..5, um por MOMENTO (achados: ' + censo.indexados.map(n => n.i).join(',') + ')');
  ok(censo.indexados.every(n => !n.temT && !n.temD && !n.temF),
    'nenhum nó indexado carrega t/d/f PRÓPRIO — é essa a peneira das três superfícies');
  ok(censo.indexados.every(n => !n.temCena),
    'nenhum nó indexado carrega `cena` — então `(n.cena||0)` vale 0 para todos eles');

  // ------------------------------------------------------------------
  sec('2 · DUPLICATA: o conteúdo dos seis reaparece em algum nó com campos próprios?');
  // Se reaparecesse, a consequência anunciada ("Zumbi nunca sai na nota da volta") seria falsa
  // por outro caminho. A comparação é pelo TÍTULO exato e por marcas de conteúdo do texto.
  const dup = await pg.evaluate(() => {
    const comCampos = LINHA_TEMPO.filter(n => n.tipo === 'momento' && n.t && n.d && n.f);
    const marcas = ['Zumbi', 'mocambo', 'Macaco', 'Subupira', 'Censo 2022', '391 etnias',
      'Olivença', 'portaria declaratória', 'serra da Barriga', 'Hans Staden'];
    return {
      titulosIguais: MOMENTOS.map(m => ({
        t: m.t, achados: comCampos.filter(n => n.t === m.t).map(n => n.t)
      })).filter(x => x.achados.length),
      porMarca: marcas.map(mk => ({
        marca: mk,
        emNoComCampos: comCampos.filter(n =>
          (n.t + ' ' + n.d).toLowerCase().includes(mk.toLowerCase())).map(n => n.t),
      })),
    };
  });
  dup.porMarca.forEach(m => log('     "' + m.marca + '" em nó com campos próprios: '
    + (m.emNoComCampos.length ? m.emNoComCampos.join(' | ') : '— nenhum')));
  ok(dup.titulosIguais.length === 0,
    'nenhum título de MOMENTOS[0..5] reaparece num nó com t/d/f próprios (duplicatas: '
    + dup.titulosIguais.map(x => x.t).join(', ') + ')');
  ok(dup.porMarca.filter(m => m.emNoComCampos.length).length === 0,
    'nenhuma marca de conteúdo dos seis (Zumbi, mocambos, Censo 2022, Olivença…) aparece '
    + 'num nó com campos próprios — a consequência do PENDENTES 27 não é anulada por duplicata');

  // ------------------------------------------------------------------
  sec('3 · A HISTÓRIA: a terceira superfície ENXERGA os seis (caminho da pessoa)');
  // Lição 2.1: a tela não se enche sozinha — `abrirTela` ABRE e `montarCompletude()` ENCHE, e
  // quem chama a segunda é o TOQUE no botão. Então aqui o botão é TOCADO de verdade
  // (`pointerdown`, que é o evento que o jogo escuta) e o texto sai do DOM depois disso.
  await pg.evaluate(() => { fecharTelas && fecharTelas(); });
  const achouBotao = await pg.evaluate(() => {
    const b = document.getElementById('btnCompletude');
    if (!b) return false;
    b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    return true;
  });
  await pg.waitForTimeout(400);
  const hist = await pg.evaluate(() => {
    const box = document.getElementById('listaCenas');
    const tela = document.getElementById('telaCompletude');
    return {
      txt: box ? (box.textContent || '') : '',
      paginas: box ? box.children.length : 0,
      aberta: !!(tela && tela.classList.contains('aberta')),
    };
  });
  log('   #btnCompletude tocado: ' + achouBotao + '  ·  tela aberta: ' + hist.aberta
    + '  ·  ' + hist.paginas + ' páginas, ' + hist.txt.length + ' caracteres');
  const naHistoria = censo.momentosTitulos.filter(t => hist.txt.includes(t));
  log('   dos seis títulos, aparecem em A HISTÓRIA: ' + naHistoria.length + '/6');
  ok(achouBotao && hist.aberta, 'o toque em A HISTÓRIA abre a tela');
  ok(hist.paginas > 6, 'a tela ENCHEU pelo caminho do toque (' + hist.paginas
    + ' páginas — tela vazia cabe em qualquer altura, lição 2.1)');
  ok(naHistoria.length === 6,
    'A HISTÓRIA mostra os seis (faltaram: '
    + censo.momentosTitulos.filter(t => !hist.txt.includes(t)).join(', ') + ')');
  await pg.evaluate(() => { fecharTelas && fecharTelas(); });

  // ------------------------------------------------------------------
  sec('4 · A NOTA DA VOLTA: varredura de TODA fronteira × TODO dia');
  // Nada de ler o filtro. Para cada fronteira possível e cada dia de 1 a 60, o papel é montado
  // e o TÍTULO da nota é lido do DOM. O conjunto que sai é o conjunto que a pessoa pode receber.
  const volta = await pg.evaluate((defeito) => {
    if (defeito) {
      // O DEFEITO DE PROPÓSITO (lição 2.8): dá t/d/f aos seis nós, que é o "conserto que não
      // inventa nada" do PENDENTES 27. Se as asserções 5 e 6 não caírem com isto ligado, elas
      // não podem reprovar e são decoração.
      LINHA_TEMPO.forEach(n => {
        if (n.tipo === 'momento' && typeof n.i === 'number') {
          const m = MOMENTOS[n.i];
          n.q = m.q; n.t = m.t; n.d = m.d; n.f = m.f;
        }
      });
      if (typeof CONFERIVEIS !== 'undefined') CONFERIVEIS.length = 0;
    }
    const porFronteira = {};
    const el = document.getElementById('retorno');
    const lista = document.getElementById('retLista');
    const max = (typeof TOTAL_CENAS !== 'undefined' ? TOTAL_CENAS : 1) - 1;
    for (let fr = 0; fr <= max; fr++) {
      const vistos = [];
      for (let dia = 1; dia <= 60; dia++) {
        lista.textContent = '';
        el.classList.remove('aberto');
        S.fronteira = fr; R.dias = dia; S.salvoEm = Date.now() - 12 * 3600 * 1000;
        mostrarRetorno(12 * 3600);
        const n = document.querySelector('#retLista .retNota .ltT');
        const t = n ? (n.textContent || '') : '';
        if (t && vistos.indexOf(t) < 0) vistos.push(t);
      }
      porFronteira[fr] = vistos;
    }
    lista.textContent = ''; el.classList.remove('aberto');
    return porFronteira;
  }, DEFEITO);

  const fronteiras = Object.keys(volta).map(Number).sort((a, b) => a - b);
  fronteiras.forEach(fr => log('   fronteira ' + String(fr).padStart(2) + ': '
    + String(volta[fr].length).padStart(2) + ' notas possíveis'));
  const uniao = [];
  fronteiras.forEach(fr => volta[fr].forEach(t => { if (uniao.indexOf(t) < 0) uniao.push(t); }));
  log('   união de todas as fronteiras: ' + uniao.length + ' notas distintas');
  const seisNaVolta = censo.momentosTitulos.filter(t => uniao.indexOf(t) >= 0);
  log('   dos SEIS, saem na nota da volta em ALGUMA fronteira: '
    + (seisNaVolta.length ? seisNaVolta.join(' | ') : '— NENHUM'));
  ok(seisNaVolta.length === 0,
    'nenhum dos seis nós indexados sai na nota da volta, em fronteira nenhuma, em dia nenhum'
    + (seisNaVolta.length ? ' — SAÍRAM: ' + seisNaVolta.join(', ') : ''));
  ok(volta[0].length > 0, 'a fronteira 0 tem nota (quem volta no dia 2 sem ter avançado recebe algo)');

  // ------------------------------------------------------------------
  sec('5 · O QUE TEM FONTE: a rua, varrida por `wx` (o único dado que escolhe a frase)');
  const rua = await pg.evaluate(() => {
    const vistos = [];
    // 137 é o passo do índice em `fraseDoMob`; 400 posições cobrem a lista inteira com folga.
    for (let k = 0; k < 400; k++) {
      const fr = fraseDoMob({ wx: k * 137, d: 0 });
      if (fr && vistos.indexOf(fr.t) < 0) vistos.push(fr.t);
    }
    return { vistos, tamanho: montarConferiveis().length };
  });
  log('   itens na lista de conferíveis: ' + rua.tamanho
    + '  ·  títulos distintos alcançáveis pela rua: ' + rua.vistos.length);
  const seisNaRua = censo.momentosTitulos.filter(t => rua.vistos.indexOf(t) >= 0);
  log('   dos SEIS, atravessam a rua: ' + (seisNaRua.length ? seisNaRua.join(' | ') : '— NENHUM'));
  ok(seisNaRua.length === 0,
    'nenhum dos seis atravessa a rua de O QUE TEM FONTE'
    + (seisNaRua.length ? ' — ATRAVESSARAM: ' + seisNaRua.join(', ') : ''));

  // ------------------------------------------------------------------
  sec('6 · AS PLACAS: quantas são, de quem, e os seis estão fora?');
  const placas = await pg.evaluate(() => {
    return {
      total: MARCOS.length,
      porEp: EPOCAS.map((e, i) => ({
        id: e.id, n: MARCOS.filter(m => m.ep === i).length,
        titulos: MARCOS.filter(m => m.ep === i).map(m => m.no.t),
      })),
      indexadosViraramPlaca: MARCOS.filter(m => typeof m.no.i === 'number').map(m => m.no.i),
    };
  });
  log('   placas derivadas: ' + placas.total);
  placas.porEp.forEach(e => { if (e.n) log('     ' + e.id + ': ' + e.n + ' — ' + e.titulos.join(' | ')); });
  ok(placas.indexadosViraramPlaca.length === 0,
    'nenhum nó indexado virou placa (viraram: ' + placas.indexadosViraramPlaca.join(',') + ')');

  // ------------------------------------------------------------------
  sec('7 · CONTROLE DE CAMINHO: a página RECARREGA com save de 12 h e o papel abre sozinho');
  // Sem chamar `mostrarRetorno` à mão. Se a nota que abrir não for a que a varredura previu
  // para o mesmo (fronteira, dia), a varredura acima está medindo outra coisa.
  const DIA_ALVO = 3, FRONTEIRA_ALVO = 0;
  // A SEMEADURA VAI NUM `addInitScript`, e a primeira versão deste instrumento errou aqui:
  // escrever no `localStorage` da página VIVA e só então recarregar deixa o laço de quadro
  // regravar a retenção por cima (`salvarRetencao()` roda sozinho), e o controle mediu
  // `R.dias = 60` — o valor que a varredura tinha deixado — em vez do 3 que ele pediu. Semear
  // ANTES de qualquer script do jogo rodar é a única forma de o controle controlar alguma coisa.
  await pg.addInitScript(([dia, fr]) => {
    const hoje = new Date();
    const d = n => new Date(hoje.getTime() - n * 86400000).toISOString().slice(0, 10);
    localStorage.setItem('jogo_brasil_v1', JSON.stringify({
      fronteira: fr, salvoEm: Date.now() - 12 * 3600 * 1000,
    }));
    localStorage.setItem('jogo_brasil_retencao', JSON.stringify({
      dias: dia, primeiro: d(dia - 1), ultimo: d(1), segundos: 600, ativos: 300,
      tochas: 0, historia: 0, toqEsq: 0, toqDir: 0, turbo: 0, fontes: 0, chegou: 0, volta: 0,
    }));
  }, [DIA_ALVO, FRONTEIRA_ALVO]);
  await pg.goto(ALVO, { waitUntil: 'load' });
  await pg.waitForFunction(() => {
    const e = document.getElementById('retorno');
    return e && e.classList.contains('aberto');
  }, { timeout: 15000 }).catch(() => {});
  const recarga = await pg.evaluate(() => {
    const e = document.getElementById('retorno');
    const n = document.querySelector('#retLista .retNota .ltT');
    return {
      abriu: !!(e && e.classList.contains('aberto')),
      titulo: n ? (n.textContent || '') : '',
      dias: R.dias, fronteira: S.fronteira,
      linhas: [...document.querySelectorAll('#retLista .retLinha')].map(d => d.textContent),
    };
  });
  log('   depois da recarga: abriu=' + recarga.abriu + '  R.dias=' + recarga.dias
    + '  S.fronteira=' + recarga.fronteira);
  recarga.linhas.forEach(l => log('     · ' + l));
  log('   nota que abriu sozinha: "' + recarga.titulo + '"');
  // O DIA LIDO É O SEMEADO **+1**, e isso é o jogo certo e não erro do instrumento: a semente
  // tem `ultimo` = ontem, então `marcarDia()` conta HOJE como um dia novo de travessia ao
  // carregar. Cobrar `=== DIA_ALVO` faria o controle reprovar a coisa que ele existe para
  // provar. Cobrar `+1` prova as duas: que a semente foi lida E que o relógio andou.
  ok(recarga.dias === DIA_ALVO + 1 && recarga.fronteira === FRONTEIRA_ALVO,
    'o estado semeado é o estado lido, com o dia de hoje somado (semeado dia ' + DIA_ALVO
    + ' com `ultimo` = ontem → esperado ' + (DIA_ALVO + 1) + '; lido dia ' + recarga.dias
    + '/fronteira ' + recarga.fronteira + ')');
  // E a nota que abriu é EXATAMENTE a que a regra prevê: o índice é `(dias − 1) % n`.
  const esperada = (volta[FRONTEIRA_ALVO] || [])[(recarga.dias - 1) % (volta[FRONTEIRA_ALVO] || []).length];
  ok(recarga.titulo === esperada,
    'a nota que abriu sozinha é a que o índice `(dias−1) % n` prevê — esperada "' + esperada
    + '", lida "' + recarga.titulo + '"');
  ok(recarga.abriu, 'o papel da volta abre SOZINHO depois de uma recarga com save de 12 h atrás');
  ok(!!recarga.titulo, 'e ele traz uma nota de história');
  const previsto = volta[recarga.fronteira] || [];
  ok(previsto.indexOf(recarga.titulo) >= 0,
    'a nota que abriu pelo caminho da pessoa está no conjunto que a varredura previu para a '
    + 'fronteira ' + recarga.fronteira + ' — o atalho mede o caminho real'
    + (previsto.indexOf(recarga.titulo) >= 0 ? '' : ' — PREVISTOS: ' + previsto.join(', ')));
  ok(censo.momentosTitulos.indexOf(recarga.titulo) < 0,
    'e ela não é nenhum dos seis');

  ok(errosConsole.length === 0, 'nenhum erro de console durante a medição'
    + (errosConsole.length ? ' — ' + errosConsole[0] : ''));

  await nav.close();
  console.log('\n' + passes + ' passou · ' + falhas + ' falhou'
    + (DEFEITO ? '   [NOS_DEFEITO=1: 5 e 6 DEVEM falhar]' : ''));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
