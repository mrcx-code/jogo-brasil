// QA 04/09 — O PORTAO QUE CONTA QUADRO QUE **CHEGA**, e nao quadro que EXISTE.
//
// POR QUE ELE EXISTE, e a razao e um defeito de INSTRUMENTO, nao de arte. Seis dos 312 quadros
// de `GENTE_EP_B64` nasceram **pixel de espera 1x1** — a figura nunca veio na folha entregue.
// (Quatro foram remendados com a pose vizinha em 04/09; os DOIS ultimos so fecharam em 05/09,
// quando o corte das celulas dobradas passou a produzir a pose que faltava — ver as duas listas
// vazias abaixo.) Nenhuma auditoria desta casa viu os seis, e nao por descuido:
//
//   · a varredura que le 518 imagens do repositorio reporta "0 nao decodificaram" — porque um
//     GIF/WebP 1x1 **decodifica normalmente**. Ela conta quadro que EXISTE;
//   · o primeiro instrumento do proprio QA usou `naturalWidth > 0` e anunciou "pacote chegou"
//     para A PRACA com tres quadros em branco. Corrigido para `> 1`, o defeito apareceu.
//
// A regua certa ja existe e e do JOGO: `esperando(im)` — `im.complete && im.naturalWidth <= 1`.
// Este portao NAO a reimplementa: ele CHAMA a funcao do jogo dentro da pagina. Uma copia aqui
// poderia divergir da de la exatamente no dia em que a diferenca importasse, que e o modo como
// os seis escaparam.
//
// O QUE ELE MEDE, por capitulo com folha de gente:
//   (1) TINTA — os 24 quadros da folha, DEPOIS de o pacote do capitulo chegar. `esperando()`
//       verdadeiro em qualquer um reprova, com o nome do capitulo e o indice (fileira/quadro).
//   (2) O QUE A PESSOA VE — onde `pessoaNaRua()` vale true, chama `mobFrame()` nas 24
//       distancias que escolhem os 24 quadros e le `mobEhGente`, a MESMA variavel que o desenho
//       le. Passo que cai no objeto generico (barril/saco no lugar da pedestre) reprova.
//
// A EXCECAO E NOMEADA, DATADA E SE COBRA SOZINHA — e o portao reprova TAMBEM se ela ficar
// velha: no dia em que o quadro for preenchido, ele manda tirar a linha daqui em vez de
// deixa-la mentindo. Foi assim que A PRACA saiu de tres excecoes para uma (04/09).
//
// USO:  node test/qa-gente-quadro-que-chega.js
//       GENTE_INJETAR=aceiro:1:4 node test/qa-gente-quadro-que-chega.js   (prova que ele morde)
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));

// AS DUAS LISTAS ESVAZIARAM EM 05/09, e as duas pelo MESMO conserto. Cada uma delas dizia, em
// voz alta, "isto aqui esta assim porque o conserto certo e partir a celula dobrada ao meio, e
// isso e corte visual, nao copia". O corte foi feito: `test/cortar-celula-dobrada-gente.js`
// partiu as seis celulas dobradas nos pontos que a direcao de arte julgou e aprovou
// (`ferramentas/arte-corte-gente-dobrada-05-09.md`), e cada metade ocupou exatamente o buraco —
// vazio ou copia — que a propria fileira ja tinha. Medido depois: **312 de 312 quadros com
// tinta**, zero quadro vazio, zero copia byte-identica dentro de fileira.
//
// Entao some o buraco (as duas linhas de CONHECIDOS) E some o remendo (as quatro de REMENDOS),
// e o §2 da arte deixa de precisar de ressalva em A PRACA e em PINDORAMA: nenhum passo troca a
// pessoa por barril, e nenhum a desenha em dobro.

// capitulo -> ["fQ"], os quadros vazios que este portao ACEITA, com o motivo.
// VAZIA desde 05/09 — todo quadro vazio novo reprova, sem excecao a herdar.
const CONHECIDOS = {};

// E OS REMENDOS, que sao a outra metade da honestidade. Quadro tapado com a pose vizinha
// (`test/tapar-buraco-gente.js`) TEM tinta e passaria por arte — entao ele e contado a parte:
// quadros identicos dentro da mesma fileira sao achados por comparacao de `src` e cobrados
// contra esta lista. Remendo que ninguem declarou reprova (e o jeito de "encher" uma folha sem
// arte nova), e declaracao que ficou velha tambem.
// VAZIA desde 05/09 — nao ha uma unica copia byte-identica dentro de fileira.
const REMENDOS = {};

let falhas = 0;
function ok(c, m) { console.log((c ? '  ok    ' : '  FALHA ') + m); if (!c) falhas++; }

const INJETAR = (process.env.GENTE_INJETAR || '').trim();   // "cap:fileira:quadro"

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) erros.push(m.text()); });
  await page.goto(ALVO, { waitUntil: 'load' });
  await page.waitForFunction('typeof EPOCAS !== "undefined" && typeof mobFrame === "function" && typeof esperando === "function"', { timeout: 30000 });

  const capitulos = await page.evaluate(() => Object.keys(GENTE_EP_B64));
  console.log('   folhas de gente: ' + capitulos.length + ' capitulos x 24 quadros = ' + (capitulos.length * 24));
  if (INJETAR) console.log('   ⚠ INJECAO DE PROVA ligada: ' + INJETAR);

  const relatorio = [];
  for (const cap of capitulos) {
    // Entrar no capitulo pelo mesmo caminho da entrada de verdade: `garantirEpoca` e a porta
    // que busca os pacotes, e e idempotente.
    const posto = await page.evaluate((cap) => {
      const ep = EPOCAS.findIndex(e => e.id === cap);
      if (ep < 0) return { erro: 'sem EPOCA para ' + cap };
      let cen = -1;
      for (let n = 0; n < TOTAL_CENAS; n++) if (epocaDoCenario(n) === ep) { cen = n; break; }
      if (cen < 0) return { erro: 'nenhum cenario mapeia para ' + cap };
      S.cenario = cen; S.fronteira = Math.max(S.fronteira, cen);
      if (typeof visitando !== 'undefined') visitando = false;
      garantirEpoca(ep);
      return { ep: ep, cen: cen, pacotes: pacotesDaEpoca(ep), pessoa: pessoaNaRua() };
    }, cap);
    if (posto.erro) { ok(false, posto.erro); continue; }

    // Esperar os pacotes do capitulo E os 24 quadros terminarem de decodificar. "Pelo menos um
    // com tinta" e o que separa "o pacote chegou e a folha tem buraco" de "o pacote nao chegou".
    let chegou = true;
    try {
      await page.waitForFunction((cap) => {
        const f = GENTE_EP_SPR[cap];
        if (!f) return false;
        let completos = 0, comTinta = 0;
        f.forEach(fl => fl.forEach(im => { if (im.complete) completos++; if (im.complete && im.naturalWidth > 1) comTinta++; }));
        return completos === 24 && comTinta > 0;
      }, cap, { timeout: 30000 });
    } catch (e) { chegou = false; }

    if (INJETAR && INJETAR.split(':')[0] === cap) {
      const [, fi, qi] = INJETAR.split(':');
      await page.evaluate(async (a) => {
        const im = GENTE_EP_SPR[a.cap][+a.fi][+a.qi];
        im.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        await new Promise(r => { im.complete ? r() : im.onload = r; setTimeout(r, 2000); });
      }, { cap, fi, qi });
    }

    const m = await page.evaluate((cap) => {
      const folha = GENTE_EP_SPR[cap];
      const vazios = [];
      folha.forEach((fl, fi) => fl.forEach((im, qi) => {
        // A REGUA DO JOGO, chamada e nao copiada.
        if (esperando(im) || !im.complete || !im.naturalHeight) vazios.push('f' + fi + 'q' + qi);
      }));
      // O que a pessoa ve: 24 chamadas de `mobFrame` nas distancias que escolhem os 24 quadros.
      const CARGA = ['barrel', 'cash', 'smog'];   // GENTE_FILEIRA: drum=0, cash=1, smog=2
      const objeto = [];
      if (pessoaNaRua()) {
        for (let fi = 0; fi < 3; fi++) for (let qi = 0; qi < 8; qi++) {
          mobFrame({ type: CARGA[fi], d: (qi + 0.5) * GENTE4_PASSO });
          if (!mobEhGente) objeto.push('f' + fi + 'q' + qi);
        }
      }
      // REMENDO: dois quadros da MESMA fileira com o mesmo `src`. O build recolhe imagem
      // repetida num `__ART[]`, entao a igualdade sobrevive a construcao e ao pacote.
      const remendos = [];
      folha.forEach((fl, fi) => fl.forEach((im, qi) => {
        for (let k = 0; k < qi; k++) if (fl[k].src === im.src && !esperando(im)) { remendos.push('f' + fi + 'q' + qi + '=f' + fi + 'q' + k); break; }
      }));
      return { vazios, objeto, remendos, pessoa: pessoaNaRua() };
    }, cap);

    const conhecidos = CONHECIDOS[cap] || [];
    relatorio.push({ cap, chegou, ...m, conhecidos, declarados: REMENDOS[cap] || [] });
    console.log('   ' + cap.padEnd(15) +
      (chegou ? '' : ' PACOTE NAO CHEGOU ') +
      ' tinta ' + (24 - m.vazios.length) + '/24' +
      (m.remendos.length ? ' (' + m.remendos.length + ' remendo)' : '') +
      (m.pessoa ? ' · pessoa em ' + (24 - m.objeto.length) + '/24 passos' : ' · sem verbo (mobFrame nao consulta a folha)') +
      (m.vazios.length ? '  vazios: [' + m.vazios.join(', ') + ']' : ''));
  }

  console.log('');
  for (const r of relatorio) {
    ok(r.chegou, r.cap + ': o pacote de arte chegou e os 24 quadros decodificaram');
    const novos = r.vazios.filter(v => r.conhecidos.indexOf(v) < 0);
    ok(novos.length === 0, r.cap + ': nenhum quadro vazio fora da lista conhecida' +
      (novos.length ? ' — ACHADOS ' + novos.join(', ') + '. Quadro 1x1 numa folha de gente faz `mobFrame()` desenhar barril/saco NO LUGAR DA PESSOA.' : ''));
    const velhos = r.conhecidos.filter(v => r.vazios.indexOf(v) < 0);
    ok(velhos.length === 0, r.cap + ': a excecao declarada ainda descreve a realidade' +
      (velhos.length ? ' — ' + velhos.join(', ') + ' NAO esta(o) mais vazio(s). Tire a linha de CONHECIDOS neste arquivo, e leia o aviso da abertura do capitulo.' : ''));
    if (r.pessoa) {
      const surpresa = r.objeto.filter(v => r.conhecidos.indexOf(v) < 0);
      ok(surpresa.length === 0, r.cap + ': todo passo desenha a PESSOA, nao o objeto' +
        (surpresa.length ? ' — ' + surpresa.join(', ') + ' cai(em) no objeto generico' : ''));
    }
    const remNovos = r.remendos.filter(v => r.declarados.indexOf(v) < 0);
    ok(remNovos.length === 0, r.cap + ': nenhum remendo fora da lista declarada' +
      (remNovos.length ? ' — ' + remNovos.join(', ') + '. Quadro repetido TEM tinta e passa por arte; se e remendo, declare em REMENDOS com a data e o motivo.' : ''));
    const remVelhos = r.declarados.filter(v => r.remendos.indexOf(v) < 0);
    ok(remVelhos.length === 0, r.cap + ': todo remendo declarado ainda existe' +
      (remVelhos.length ? ' — ' + remVelhos.join(', ') + ' nao e mais copia. Se a arte de verdade chegou, tire a linha de REMENDOS.' : ''));
  }
  ok(!erros.length, 'sem erro de console' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));

  const tinta = relatorio.reduce((s, r) => s + 24 - r.vazios.length, 0);
  console.log('\n   TOTAL ' + tinta + ' de ' + (relatorio.length * 24) + ' quadros com tinta');
  await nav.close();
  console.log(falhas ? '\nREPROVOU (' + falhas + ')' : '\nPASSOU');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
