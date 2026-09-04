// EM O ACEIRO A GENTE FICA E A COLETA SAI — o portão do §2 ("não transforme pessoa em recurso,
// inimigo, obstáculo ou coisa a coletar").
//
// O QUE ACONTECEU, e é o achado 3 da auditoria dos treze capítulos (PENDENTES 105, severidade
// ALTA, confirmado sem ressalva na verificação adversarial de 04/09): quando `aceiro` entrou em
// `CAPS_VERBO` em 18/08, `pessoaNaRua()` passou a valer true no capítulo e `mobFrame()` trocou o
// objeto pela folha de gente — brigadista, apanhadora de sempre-vivas, vaqueiro. A mecânica de
// drop veio de carona: `concluirAlcance()` chamava `soltarDrop()` sem perguntar de que capítulo
// se tratava, e o que essas pessoas carregam virava impacto e recurso na mão de quem joga.
//
// A DECISÃO DO DONO, 04/09, e ela tem duas metades: **a presença humana FICA** (era intencional,
// e a mão continua alcançando quem atravessa) e **o gesto de coletar SAI**. Só em O ACEIRO —
// PALMARES e os outros capítulos de gente na rua continuam deixando no chão a carga de trabalho
// que a pessoa trouxe, que é o que a abertura de cada um deles nomeia.
//
// POR QUE ESTE ARQUIVO EXISTE, e não bastava o commit: o corte é UM `if` de uma linha dentro de
// `soltarDrop()`. Apagá-lo sem querer não quebra nada visível — a rua continua igual, o jogo
// continua rodando, e o §2 volta a valer só enquanto alguém lembrar dele. É a mesma lição escrita
// no cabeçalho de `test/salvador-drop-sem-ritual.js`, do mesmo §2 e da mesma semana.
//
// O QUE ELE COBRA, e as quatro coisas são necessárias juntas:
//   1. ANTES/DEPOIS NA MESMA EXECUÇÃO — a guarda é neutralizada (`window.capSemColeta`) para o
//      teste MEDIR o que o capítulo rendia antes e o que rende agora. Sem isso, "0 drops" não
//      prova nada: um capítulo em que ninguém é alcançado também dá 0.
//   2. CONTROLE NEGATIVO — PALMARES, no mesmo teste, com a guarda LIGADA, continua deixando o que
//      a pessoa trouxe no chão e continua enchendo os contadores. Isto é o que separa "consertei O
//      ACEIRO" de "quebrei a coleta do jogo inteiro".
//   3. A PESSOA CONTINUA NA RUA — alcançada, vira portadora e segue andando; não morre, não se
//      dissipa, não some. Tirar a coleta tirando a gente passaria no item 1 e seria o erro oposto.
//   4. A CORRENTE NÃO É PORTA DOS FUNDOS — `passarPalavra()` atende sem o dedo e chamava
//      `soltarDrop()` por conta própria. O caminho sem toque é exercitado à parte.
//
//   node test/aceiro-sem-coleta.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const ARQ = process.env.JOGO_HTML || path.resolve(__dirname, '..', 'index.html');
const ALVO = /^https?:\/\//i.test(ARQ) ? ARQ : ABRIR('file://' + path.resolve(ARQ));
const FONTE = path.resolve(__dirname, '..', 'src', 'jogo.ts');

let falhas = 0;
function ok(cond, txt) { console.log((cond ? '  ok   ' : '  FALHA ') + txt); if (!cond) falhas++; }
const sec = t => console.log('\n---- ' + t);

(async () => {
  // ============================================================
  // PARTE A — a fonte. O `if` existe, é de UM capítulo, e a gente continua na rua.
  // ============================================================
  sec('A · a forma do corte, lida em src/jogo.ts');
  const src = fs.readFileSync(FONTE, 'utf8');

  const guarda = /function soltarDrop\([^)]*\)\s*\{\s*\n\s*if \(capSemColeta\(\)\) return;/.test(src);
  ok(guarda, 'a primeira linha de soltarDrop() é a guarda — a única boca por onde drop nasce');

  const decl = src.match(/function capSemColeta\(\)\s*\{[\s\S]*?\n\}/);
  ok(!!decl, 'capSemColeta() existe');
  if (decl) {
    const ids = decl[0].match(/"[a-z]+"/g) || [];
    ok(ids.length === 1 && ids[0] === '"aceiro"',
      'e ela nomeia UM capítulo, "aceiro" (achou ' + (ids.join(', ') || 'nenhum') + ') — não é regra global');
  }
  // A outra metade da decisão do dono: a gente FICA. Tirar `aceiro` de CAPS_VERBO tiraria as
  // pessoas da rua e faria os números deste teste ficarem verdes pelo motivo errado.
  ok(/CAPS_VERBO = \[[^\]]*iEp\("aceiro"\)/.test(src),
    'aceiro continua em CAPS_VERBO — a presença humana é a metade da decisão que FICA');
  // O comentário que a auditoria pegou mentindo não pode voltar.
  ok(src.indexOf('atravessa a tela ali continua sendo FOGO') < 0,
    'o comentário "o que atravessa a tela ali continua sendo FOGO" não voltou (era falso desde 18/08)');

  // ============================================================
  // PARTE B — o jogo rodando.
  // ============================================================
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = [];
  pg.on('pageerror', e => erros.push('PAGEERROR ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE ' + m.text()); });
  await pg.goto(ALVO);
  await pg.waitForTimeout(1200);
  await pg.evaluate(() => { fecharTelas(); fecharTudo(); });

  // A FOLHA DE GENTE DE O ACEIRO CHEGA NUM PACOTE, e sem ela este teste mediria a rua errada.
  // `GENTE_EP_B64.aceiro` viaja em `pack-naodito.json` (ferramentas/pacotes.js, PACK_DA_GENTE),
  // e o jogo só o busca quando a pessoa CHEGA no capítulo — pôr `S.cenario` na mão não dispara
  // nada. Sem esta espera, `mobFrame()` cai no objeto do capítulo 1 e o print mostraria um saco
  // de dinheiro no lugar da brigadista: print bonito, medição da coisa errada (a lição do
  // cabeçalho de test/abrir.js).
  await pg.evaluate(() => { garantirEpoca(iEp('aceiro')); garantirEpoca(iEp('palmares')); });
  const chegou = await pg.waitForFunction(() => {
    const g = (typeof GENTE_EP_SPR !== 'undefined') && GENTE_EP_SPR.aceiro;
    const im = g && g[0] && g[0][0];
    return !!(im && im.complete && im.naturalWidth > 0);
  }, null, { timeout: 25000 }).then(() => true, () => false);
  ok(chegou, 'a folha de gente de O ACEIRO chegou (pack-naodito) — a rua medida é a rua de verdade');

  // Uma rodada: N pessoas alcançadas num capítulo, com a guarda ligada ou desligada, e o que
  // isso rendeu. Tudo pelos construtores e pelas funções do próprio jogo — um mob montado à
  // mão perde campos e o desenho cai em NaN (a lição está em test/medir-conversa.js).
  const medir = await pg.evaluate(async () => {
    const salvo = { cenario: S.cenario, modo: S.modo, energia: S.energia, energiaTotal: S.energiaTotal,
                    recursos: Object.assign({}, S.recursos), acolhidos: S.acolhidos.slice(), grupo: S.grupo };

    function rodada(epId, semGuarda) {
      const original = window.capSemColeta;
      if (semGuarda) window.capSemColeta = function () { return false; };
      S.cenario = cenarioDaEpoca(iEp(epId));
      S.modo = "limpo";                       // andando: é o ritmo em que o verbo de O ACEIRO corre
      S.u1 = false; S.u2 = false; S.u3 = false; S.u4 = false;
      mobs.length = 0; drops.length = 0; floats.length = 0; parts.length = 0;
      grupo.length = 0; ficando.length = 0; S.grupo = 0;
      S.recursos = { flor: 0, agua: 0, refeicao: 0 };
      proximoMob = 1e9;                       // ninguém novo chega durante a medida
      const alcancadas = [];
      let dropsSoltos = 0;
      const eTaps0 = S.energia;
      ['smog', 'barrel', 'cash'].forEach(function (tipo) {
        mobs.length = 0;
        const antes = drops.length;
        const m = novoMob(tipo, worldX + HX + 30);
        m.parado = true; m.espera = 1e9;
        mobs.push(m);
        clicar(false, true, true);            // um toque abre; o resto é relógio
        let quadros = 0;
        // 10 s de relógio: seis vezes o CONVERSA_SEG/ACOLHER_SEG de 1,6 s, folga de aritmética
        for (; quadros < 600 && !m.dead && !m.sabe && !(m.dying > 0); quadros++) atualizarMobs(1 / 60);
        dropsSoltos += drops.length - antes;
        alcancadas.push({ tipo: tipo, quadros: quadros, sabe: !!m.sabe, dead: !!m.dead,
                          dying: m.dying | 0, naRua: mobs.indexOf(m) >= 0 });
      });
      const energiaToques = S.energia - eTaps0;
      // ...e a mão recolhe o que estiver no chão, pela mesma porta do jogo
      const eColeta0 = S.energia;
      drops.slice().forEach(function (d) { if (!d.morto) coletarDrop(d, false); });
      const energiaColeta = S.energia - eColeta0;
      const rec = (S.recursos.flor | 0) + (S.recursos.agua | 0) + (S.recursos.refeicao | 0);
      if (semGuarda) window.capSemColeta = original;
      return { epoca: epId, semGuarda: !!semGuarda, dropsSoltos: dropsSoltos, recursos: rec,
               energiaToques: +energiaToques.toFixed(2), energiaColeta: +energiaColeta.toFixed(2),
               alcancadas: alcancadas };
    }

    // A CORRENTE, que atende sem o dedo: uma portadora cruzando com quem espera.
    function corrente(epId, semGuarda) {
      const original = window.capSemColeta;
      if (semGuarda) window.capSemColeta = function () { return false; };
      S.cenario = cenarioDaEpoca(iEp(epId));
      S.modo = "limpo";
      mobs.length = 0; drops.length = 0;
      proximoMob = 1e9;
      const p = novoMob('cash', worldX + HX + 40); p.sabe = true; p.desistiu = true;
      const q = novoMob('smog', worldX + HX + 40); q.parado = true; q.espera = 1e9;
      mobs.push(p, q);
      const antes = drops.length, corrente0 = palavraCorrente;
      passarPalavra();
      const r = { atendidas: palavraCorrente - corrente0, drops: drops.length - antes,
                  qSabe: !!q.sabe, qNaRua: mobs.indexOf(q) >= 0 };
      if (semGuarda) window.capSemColeta = original;
      return r;
    }

    const out = {
      aceiroAntes: rodada('aceiro', true),
      aceiroDepois: rodada('aceiro', false),
      palmares: rodada('palmares', false),
      correnteAntes: corrente('aceiro', true),
      correnteDepois: corrente('aceiro', false)
    };

    // devolve o mundo ao que era
    mobs.length = 0; drops.length = 0; floats.length = 0; parts.length = 0;
    grupo.length = 0; ficando.length = 0;
    S.cenario = salvo.cenario; S.modo = salvo.modo;
    S.energia = salvo.energia; S.energiaTotal = salvo.energiaTotal;
    S.recursos = salvo.recursos; S.acolhidos = salvo.acolhidos; S.grupo = salvo.grupo;
    proximoMob = -1; mobChao = 0;
    return out;
  });

  const A = medir.aceiroAntes, D = medir.aceiroDepois, P = medir.palmares;
  const linha = r => '   ' + (r.epoca + (r.semGuarda ? ' (guarda desligada)' : ' (guarda ligada)')).padEnd(32) +
    'drops ' + r.dropsSoltos + ' | recursos +' + r.recursos +
    ' | impacto do toque +' + r.energiaToques + ' | impacto da coleta +' + r.energiaColeta;

  sec('B · três pessoas alcançadas, antes e depois, na MESMA execução');
  console.log(linha(A));
  console.log(linha(D));
  console.log(linha(P));
  console.log('   alcance em O ACEIRO: ' + D.alcancadas.map(function (a) {
    return a.tipo + ' em ' + a.quadros + ' quadros' + (a.sabe ? ' (virou portadora)' : '');
  }).join(' · '));

  sec('B1 · O ACEIRO: a coleta saiu');
  ok(A.dropsSoltos === 3 && A.recursos === 3,
    'ANTES (guarda desligada) o capítulo deixava ' + A.dropsSoltos + ' coisas no chão e enchia ' +
    A.recursos + ' contadores — é o que a auditoria achou');
  ok(D.dropsSoltos === 0, 'DEPOIS não fica nada no chão (' + D.dropsSoltos + ' drops)');
  ok(D.recursos === 0, 'e nenhum contador enche (' + D.recursos + ' recursos)');
  ok(D.energiaColeta === 0, 'e a coleta não rende impacto nenhum (+' + D.energiaColeta + ')');
  ok(A.energiaColeta > 0, 'a medida sabe distinguir: com a guarda desligada a coleta rendia +' +
    A.energiaColeta + ' de impacto');

  sec('B2 · e a gente continua na rua — a outra metade da decisão do dono');
  D.alcancadas.forEach(function (a) {
    ok(a.sabe && !a.dead && a.dying === 0 && a.naRua,
      a.tipo + ': alcançada, virou portadora e continua em quadro (dead ' + a.dead +
      ', dying ' + a.dying + ', na rua ' + a.naRua + ')');
  });
  ok(D.energiaToques > 0, 'o toque continua rendendo impacto (+' + D.energiaToques +
    ') — é a economia base do jogo, não a pessoa virando recurso; sem isso o capítulo travaria');

  sec('B3 · CONTROLE NEGATIVO: PALMARES continua coletando');
  ok(P.dropsSoltos === 3, 'em PALMARES o que a pessoa trouxe continua ficando no chão (' + P.dropsSoltos + ')');
  ok(P.recursos === 3, 'e os contadores continuam enchendo (' + P.recursos + ')');
  ok(P.energiaColeta > 0, 'e a coleta continua rendendo impacto (+' + P.energiaColeta + ')');

  sec('B4 · a corrente não é porta dos fundos');
  console.log('   passarPalavra() em O ACEIRO — guarda desligada: ' + medir.correnteAntes.atendidas +
    ' atendida(s), ' + medir.correnteAntes.drops + ' drop(s) | guarda ligada: ' +
    medir.correnteDepois.atendidas + ' atendida(s), ' + medir.correnteDepois.drops + ' drop(s)');
  ok(medir.correnteAntes.atendidas === 1 && medir.correnteAntes.drops === 1,
    'a corrente existe e, sem a guarda, ela também deixava coisa no chão');
  ok(medir.correnteDepois.atendidas === 1 && medir.correnteDepois.drops === 0,
    'com a guarda, a palavra continua passando sem o dedo e nada fica no chão');
  ok(medir.correnteDepois.qSabe && medir.correnteDepois.qNaRua,
    'e quem foi atendida pela corrente continua na rua');

  // ============================================================
  // PARTE C — os prints: a pessoa antes e depois do toque, com e sem a guarda.
  // ============================================================
  sec('C · prints');
  async function cena(semGuarda, prefixo) {
    await pg.evaluate((semGuarda) => {
      fecharTelas(); fecharTudo();
      if (semGuarda) window.__guardaOriginal = window.capSemColeta, window.capSemColeta = function () { return false; };
      S.cenario = cenarioDaEpoca(iEp('aceiro'));
      S.energiaTotal = LIMIAR_CENA * S.cenario + 10;
      S.modo = "limpo";
      S.recursos = { flor: 0, agua: 0, refeicao: 0 };
      mobs.length = 0; drops.length = 0; floats.length = 0; parts.length = 0;
      proximoMob = 1e9;
      // 88 px de mundo à frente: longe do arbusto que fica plantado por volta dos 60 (a primeira
      // tentativa escondeu a pessoa atrás dele) e ainda dentro do alcance de 96 do quinto tempo.
      const m = novoMob('barrel', worldX + HX + 88);
      m.parado = true; m.espera = 1e9;
      mobs.push(m);
      window.__alvo = m;
    }, semGuarda);
    await pg.waitForTimeout(700);
    await pg.screenshot({ path: path.resolve(__dirname, prefixo + '-1-antes-do-toque.png') });
    await pg.evaluate(() => { clicar(false, true, true); });
    // ESPERA A COISA CERTA, e não um relógio de parede: a conversa fecha em 1,6 s de CAMINHADA,
    // e a primeira versão deste print dormia 2,6 s — tempo suficiente para a personagem andar
    // por cima do que tinha caído e RECOLHER, então o print "antes" mostrava chão limpo e o
    // teste acusava o código certo. (É a lição de `abrirMenuParado` no encaixe.js.)
    for (let i = 0; i < 120; i++) {
      if (await pg.evaluate(() => !!window.__alvo.sabe)) break;
      await pg.waitForTimeout(50);
    }
    await pg.screenshot({ path: path.resolve(__dirname, prefixo + '-2-depois-do-toque.png') });
    const r = await pg.evaluate(() => {
      const m = window.__alvo;
      const r = { drops: drops.filter(function (d) { return !d.morto; }).length,
                  recursos: (S.recursos.flor | 0) + (S.recursos.agua | 0) + (S.recursos.refeicao | 0),
                  sabe: !!m.sabe, naRua: mobs.indexOf(m) >= 0, dead: !!m.dead };
      if (window.__guardaOriginal) { window.capSemColeta = window.__guardaOriginal; window.__guardaOriginal = null; }
      mobs.length = 0; drops.length = 0; proximoMob = -1;
      S.recursos = { flor: 0, agua: 0, refeicao: 0 };
      return r;
    });
    console.log('   ' + prefixo + ': no chão ' + r.drops + ' | já recolhido ' + r.recursos +
      ' | ela continua na rua: ' + r.naRua + ' | virou portadora: ' + r.sabe);
    return r;
  }
  const semG = await cena(true, 'ACEIRO-COLETA-ANTES');
  const comG = await cena(false, 'ACEIRO-COLETA-DEPOIS');
  ok(semG.drops + semG.recursos === 1, 'print ANTES: uma coisa caiu no chão, que é o que a auditoria viu');
  ok(comG.drops + comG.recursos === 0 && comG.naRua && comG.sabe,
    'print DEPOIS: nada caiu, nada foi recolhido, e a pessoa ainda ali');
  console.log('   prints ACEIRO-COLETA-{ANTES,DEPOIS}-{1-antes,2-depois}-do-toque.png em test/');

  ok(erros.length === 0, 'nenhum erro de console (' + erros.length + ')');
  erros.slice(0, 5).forEach(e => console.log('     ' + e));

  await nav.close();
  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
