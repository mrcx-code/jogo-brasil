// O SAVE COMO ENTRADA HOSTIL — lente ROBUSTEZ (18/08).
//
// O smoke já alimenta um save adulterado e cobra que nada vaze. Este instrumento vai além do
// campo fora da faixa, que é o ataque óbvio, e usa o que um `localStorage` editável à mão
// realmente permite: poluição de protótipo, tipo trocado por estrutura, chave que o esquema
// não declara, número que o JSON transforma em Infinity, lista maior que o mundo, e lixo puro.
//
// O CRITÉRIO NÃO É "não quebrou". É mais duro, e vem do §3 do CLAUDE.md: campo fora da faixa
// cai no PADRÃO, e o padrão erra sempre para o lado de FALAR DE NOVO — nunca para o de calar
// conteúdo nem para o de inventar gente. Um save torto que ganha um cenário é aceitável; um
// que cala uma abertura, ou que inventa acolhidas, não é.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));

// Cada ataque é [nome, o que gravar em CHAVE_JOGO]. Texto cru, não objeto: é assim que o
// localStorage guarda, e é assim que um humano o edita.
const ATAQUES = [
  ['proto-poluido', '{"energia":1,"__proto__":{"u1":true,"cenario":99}}'],
  ['constructor-prototype', '{"energia":1,"constructor":{"prototype":{"contaminado":true}}}'],
  ['numero-vira-infinito', '{"energia":1e400,"energiaTotal":1e400,"cenario":1e400}'],
  ['negativo-em-tudo', '{"energia":-5,"energiaTotal":-1e9,"cenario":-3,"fronteira":-3,"grupo":-7}'],
  ['tipo-trocado-por-objeto', '{"energia":{"$":1},"cenario":[1,2],"modo":{"a":1},"u1":"sim"}'],
  ['lista-maior-que-o-mundo', '{"energia":1,"acolhidos":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]}'],
  ['lista-com-lixo', '{"energia":1,"acolhidos":["a",null,{},[],true,-1,1e400]}'],
  ['mapa-virou-lista', '{"energia":1,"recursos":[1,2,3]}'],
  ['mapa-com-chave-extra', '{"energia":1,"recursos":{"flor":5,"agua":5,"refeicao":5,"ouro":999999}}'],
  ['chaves-que-nao-existem', '{"energia":1,"dinheiro":1e9,"deus":true,"admin":1,"toString":1}'],
  ['bits-estourados', '{"energia":1,"aberturas":999999999,"marcos":999999999,"travessias":999999999}'],
  ['string-gigante', '{"energia":1,"modo":"' + 'x'.repeat(20000) + '"}'],
  ['json-invalido', '{isto nao e json'],
  ['vazio', ''],
  ['nulo', 'null'],
  ['lista-no-lugar-do-objeto', '[1,2,3]'],
  ['numero-solto', '42'],
];

// Os mesmos ataques contra o registro de RETENÇÃO, que tem esquema próprio e alimenta
// `bonusDias()` — ou seja, um número torto ali multiplicaria a economia inteira.
const ATAQUES_RET = [
  ['dias-absurdos', '{"dias":1e9,"primeiro":"2020-01-01","ultimo":"2020-01-01"}'],
  ['dias-negativos', '{"dias":-500}'],
  ['datas-que-nao-sao-datas', '{"dias":2,"primeiro":{},"ultimo":[1,2],"segundos":"muitos"}'],
  ['proto-na-retencao', '{"dias":2,"__proto__":{"dias":1e9}}'],
];

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(ALVO);
  await pg.waitForTimeout(1600);

  // O RETRATO DO ESTADO SÃO, para comparar contra. Tudo o que um save hostil produzir fora
  // destas faixas é vazamento, mesmo que a tela continue de pé.
  const limites = await pg.evaluate(() => ({
    caps: EPOCAS.length, cenas: TOTAL_CENAS,
    tetoAcolhidos: ACOLHIDOS_TETO, mascaraEp: MASCARA_EPOCAS,
    mascaraMarcos: MASCARA_MARCOS, mascaraTrav: MASCARA_TRAVESSIAS,
  }));
  console.log('mundo: ' + limites.caps + ' capítulos · ' + limites.cenas + ' cenas · teto de acolhidas ' + limites.tetoAcolhidos);

  let reprovas = 0;
  const ok = (cond, txt) => { console.log((cond ? '  ok   ' : '  FALHA ') + txt); if (!cond) reprovas++; };

  for (const [nome, cru] of ATAQUES) {
    const antes = erros.length;
    const r = await pg.evaluate((cru) => {
      localStorage.clear();
      window.salvar = function () {};
      try { localStorage.setItem(CHAVE_JOGO, cru); } catch (e) {}
      try { carregar(); } catch (e) { return { explodiu: String(e && e.message) }; }
      const num = (v) => (typeof v === 'number' && isFinite(v));
      return {
        explodiu: null,
        // o estado, medido contra o mundo
        energia: S.energia, energiaTotal: S.energiaTotal,
        cenario: S.cenario, fronteira: S.fronteira, grupo: S.grupo,
        aberturas: S.aberturas, marcos: S.marcos, travessias: S.travessias,
        acolhidosN: Array.isArray(S.acolhidos) ? S.acolhidos.length : -1,
        acolhidosSoma: Array.isArray(S.acolhidos) ? S.acolhidos.reduce((a, b) => a + (Number(b) || 0), 0) : -1,
        recursosChaves: S.recursos && typeof S.recursos === 'object' ? Object.keys(S.recursos).join(',') : String(S.recursos),
        modoTam: typeof S.modo === 'string' ? S.modo.length : -1,
        u1: S.u1,
        // vazamento: chave que o save trouxe e o esquema não declara
        extras: Object.keys(S).filter(k => ['dinheiro', 'deus', 'admin', 'contaminado', 'ouro'].indexOf(k) >= 0).join(','),
        // poluição de protótipo: um objeto NOVO herdou algo?
        poluido: (function () { const o = {}; return ['u1', 'cenario', 'contaminado', 'dias'].filter(k => k in o).join(','); })(),
        todosFinitos: num(S.energia) && num(S.energiaTotal) && num(S.cenario) && num(S.fronteira) && num(S.grupo),
      };
    }, cru);
    await pg.waitForTimeout(120);
    const novosErros = erros.length - antes;

    const linha = r.explodiu
      ? 'EXPLODIU: ' + r.explodiu
      : 'cen ' + r.cenario + ' front ' + r.fronteira + ' grupo ' + r.grupo +
        ' | ab ' + r.aberturas + ' marcos ' + r.marcos + ' trav ' + r.travessias +
        ' | acolhidos ' + r.acolhidosN + '/' + r.acolhidosSoma +
        ' | recursos {' + r.recursosChaves + '} | modo ' + r.modoTam + ' ch';
    console.log('\n— ' + nome + '\n   ' + linha);

    ok(!r.explodiu, nome + ': carregar() não explode');
    if (r.explodiu) continue;
    ok(!r.poluido, nome + ': nenhum objeto novo herdou campo do save' + (r.poluido ? ' — POLUÍDO: ' + r.poluido : ''));
    ok(!r.extras, nome + ': nenhuma chave estranha entrou no estado' + (r.extras ? ' — ENTROU: ' + r.extras : ''));
    ok(r.todosFinitos, nome + ': todo número do estado é finito');
    ok(r.cenario >= 0 && r.cenario < limites.cenas, nome + ': cenário dentro do mundo (0..' + (limites.cenas - 1) + ')');
    ok(r.fronteira >= 0 && r.fronteira < limites.cenas, nome + ': fronteira dentro do mundo');
    ok(r.acolhidosN === limites.caps, nome + ': acolhidos tem exatamente ' + limites.caps + ' posições');
    ok(r.acolhidosSoma <= limites.tetoAcolhidos * limites.caps, nome + ': ninguém inventou gente');
    ok(r.recursosChaves === 'flor,agua,refeicao', nome + ': recursos só tem as três chaves declaradas');
    ok((r.aberturas & ~limites.mascaraEp) === 0, nome + ': aberturas dentro da máscara');
    ok((r.marcos & ~limites.mascaraMarcos) === 0, nome + ': marcos dentro da máscara');
    ok((r.travessias & ~limites.mascaraTrav) === 0, nome + ': travessias dentro da máscara');
    ok(r.modoTam >= 0 && r.modoTam < 40, nome + ': modo é string curta');
    ok(novosErros === 0, nome + ': nenhum erro de console (' + novosErros + ')');
  }

  // ===== SEM RELÓGIO: não saber quando foi vale ZERO, e não o teto =====
  //
  // A BOMBA, desarmada em 18/08. `salvoEm` tem `pad: 0` e `semAparar`, então um save sem o campo
  // — ou com ele fora da faixa — chega ao cálculo do tempo fora valendo 0, e `Date.now() - 0`
  // estoura o teto: a conta entregava 43.200 s, o MÁXIMO, a quem não tinha relógio nenhum.
  // Medido antes do conserto: 144 pontos de obra de graça (27% dos 540 do canteiro inteiro) e o
  // papel da volta afirmando "você ficou fora por 12h00" a alguém de quem ninguém sabia nada.
  //
  // O comentário do esquema já avisava, em 09/08, que era "uma bomba armada para o primeiro
  // consumidor futuro desse número". O consumidor chegou com o MUTIRÃO DA AUSÊNCIA e ninguém
  // voltou lá. Um comentário não é um teste; isto é.
  //
  // Mora AQUI e não no `encaixe.js` por um motivo medido: cada ataque deste arquivo roda contra
  // um estado limpo, e no encaixe o mesmo bloco lia obra acumulada por vinte blocos anteriores
  // e reprovava por engano. Instrumento na casa errada mede o vizinho.
  console.log('\n===== SEM RELÓGIO =====');
  {
    const gente = '"acolhidos":[0,6,0,0,0,0,0,0,0,0,0,0,0],"recursos":{"flor":9999,"agua":9999,"refeicao":9999}';
    const casos = [
      ['sem o campo salvoEm', '{"energia":1,' + gente + '}', false],
      ['salvoEm fora da faixa', '{"energia":1,"salvoEm":5e12,' + gente + '}', false],
      ['8 h de verdade', '{"energia":1,"salvoEm":' + (Date.now() - 8 * 3600 * 1000) + ',' + gente + '}', true],
    ];
    for (const [nome, save, deveriaPagar] of casos) {
      const r = await pg.evaluate((save) => {
        localStorage.clear();
        window.salvar = function () {};
        localStorage.setItem(CHAVE_JOGO, save);
        carregar();
        const el = document.getElementById('retorno');
        return {
          fora: Math.round(voltouDepoisDe),
          obra: (S.obra.roca | 0) + (S.obra.palicada | 0) + (S.obra.casa | 0),
          painel: !!(el && el.classList.contains('aberto')),
          teto: CFG.capOfflineHoras * 3600
        };
      }, save);
      console.log('\n— ' + nome + '\n   fora ' + r.fora + 's · obra ' + r.obra +
        ' pts · painel ' + (r.painel ? 'aberto' : 'fechado'));
      if (deveriaPagar) {
        ok(r.fora > 3600 && r.fora <= r.teto, nome + ': a ausência legítima continua sendo paga');
        ok(r.obra > 0, nome + ': o mutirão da ausência continua trabalhando para quem tem relógio');
      } else {
        ok(r.fora === 0, nome + ': não paga ausência — não saber quando foi vale zero, não o teto');
        ok(r.obra === 0, nome + ': não ganha obra de graça');
        ok(!r.painel, nome + ': não abre o papel da volta — ele afirmaria um número que ninguém sabe');
      }
    }
  }

  console.log('\n===== A RETENÇÃO, que multiplica a economia por bonusDias() =====');
  for (const [nome, cru] of ATAQUES_RET) {
    const r = await pg.evaluate((cru) => {
      localStorage.clear();
      window.salvar = function () {}; window.salvarRetencao = function () {};
      try { localStorage.setItem(CHAVE_RET, cru); } catch (e) {}
      try { carregarRetencao(); } catch (e) { return { explodiu: String(e && e.message) }; }
      return { explodiu: null, dias: R.dias, bonus: bonusDias(), segundos: R.segundos,
               primeiro: typeof R.primeiro, ultimo: typeof R.ultimo };
    }, cru);
    console.log('\n— ' + nome + (r.explodiu ? '\n   EXPLODIU: ' + r.explodiu
      : '\n   dias ' + r.dias + ' · bônus ×' + (typeof r.bonus === 'number' ? r.bonus.toFixed(3) : r.bonus) +
        ' · segundos ' + r.segundos + ' · datas ' + r.primeiro + '/' + r.ultimo));
    ok(!r.explodiu, nome + ': carregarRetencao() não explode');
    if (r.explodiu) continue;
    ok(typeof r.bonus === 'number' && isFinite(r.bonus), nome + ': o bônus de dias é número finito');
    ok(r.bonus >= 1 && r.bonus <= 3, nome + ': o bônus de dias fica na faixa do jogo (1..3) — é ele que multiplica TUDO');
    ok(typeof r.primeiro === 'string' && typeof r.ultimo === 'string', nome + ': as datas continuam texto');
  }

  console.log('\n' + (reprovas ? 'FALHOU em ' + reprovas + ' asserção(ões)' : 'PASSOU — o save hostil não vaza'));
  await nav.close();
  process.exit(reprovas ? 1 : 0);
})();
