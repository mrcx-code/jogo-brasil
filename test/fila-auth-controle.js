// CONTROLE DO PORTAO — o instrumento que tenta DERRUBAR o test/fila-auth.js.
//
// EQUIPE.md 2.8: "um instrumento que nunca foi visto reprovando e decoracao". Em 20/08 dois
// portoes deste repositorio foram pegos no mesmo dia medindo outra coisa e saindo verdes; em
// 21/08 a auditoria da seguranca achou que a cena 5 do fila-auth.js era CEGA (ela guardava uma
// sessao ja vencida na CARGA, a partida renovava o token antes do primeiro toque, e apagar a
// renovacao do caminho de ESCRITA nao mudava o resultado); e a RE-auditoria, no mesmo dia,
// achou um XSS que passou justamente porque NENHUMA cena media escape.
//
// Este arquivo faz o que ninguem faz sozinho: copia o dashboard, APAGA um conserto por vez, e
// exige que o portao reprove. Se alguma copia defeituosa passar, este controle sai 1 — porque
// nesse caso o defeito nao e a copia, e o portao.
//
// Roda assim (sao 12 execucoes do fila-auth.js):  node test/fila-auth-controle.js
// Nao esta no CI de proposito: o CI roda o portao, este roda o portao do portao.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const FONTE = path.join(RAIZ, 'dashboard', 'index.html');
const src = fs.readFileSync(FONTE, 'utf8');

// Cada defeito e uma lista de PARES (trecho exato do dashboard -> o que fica no lugar). Sao
// pares, e nao um so, porque um defeito de verdade as vezes mora em dois lugares: o XSS do N2
// precisava do escH frouxo E do valor de volta dentro do atributo — reverter so um dos dois
// deixa a pagina segura, e o controle diria, errado, que o portao nao morde.
// Se um trecho nao for achado, o controle PARA: quer dizer que o conserto mudou de forma e este
// arquivo envelheceu — e um controle que "nao acha o defeito" e passa e a mesma decoracao que
// ele denuncia.
const DEFEITOS = [
  {
    id: 'A10 · a escrita deixa de renovar o token',
    cena: '[5]',
    pares: [[
      `    if(ses.expira_em && (ses.expira_em - Date.now()) < 60000)
      return refrescar().then(function(s){ return s ? comToken(s) : (ses ? comToken(ses) : H); });
`, '']],
  },
  {
    id: 'A5 · a fila local volta a nao ter teto',
    cena: '[11]',
    pares: [['    if(f.length>FILA_MAX || s.length>FILA_BYTES){', '    if(false){']],
  },
  {
    id: 'A6 · nenhum 4xx e permanente (a fila entope de novo)',
    cena: '[12]',
    pares: [['  function permanente(st){ return st>=400 && st<500 && st!==401 && st!==403 && st!==408 && st!==429; }',
    '  function permanente(st){ return false && st; }']],
  },
  {
    id: 'A8 · sair volta a so apagar do aparelho',
    cena: '[13]',
    pares: [[
      `      try{ fetch(SB_URL+"/auth/v1/logout",{method:"POST",headers:comToken(ses),keepalive:true}).catch(function(){}); }catch(e){}
`, '']],
  },
  {
    // N1: o laco infinito de POST. Os dois consertos saem juntos porque so os dois juntos
    // resolvem — sem a poda a fila herdada nunca cabe, sem o `if(!gravarFila(...))` o
    // lavarUm() releria a mesma fila para sempre. Medido pelo auditor no ramo defeituoso:
    // 1173 POSTs em 6 s (contra 60 e fila drenada). E o defeito mais caro dos oito.
    id: 'N1 · a fila herdada volta a nao ser podada e o shift recusado nao para o laco',
    cena: '[15]',
    pares: [
      ['  podarFilaHerdada();   // antes do flush: fila acima do teto não drena, ela precisa caber primeiro', ''],
      [
        `      var g=lerFila(); g.shift();
      if(!gravarFila(g)) return;
      return lavarUm();`,
        `      var g=lerFila(); g.shift(); gravarFila(g); return lavarUm();`,
      ],
    ],
  },
  {
    // N6 da re-auditoria: o defeito que PASSOU pelo portao antigo. O escH escapava < > & e
    // deixava a aspa passar; com o valor do servidor dentro de `data-v="..."`, a aspa fechava o
    // atributo e o resto virava HTML — on* executando com a CSP ja em vigor.
    id: 'N2 · escH sem escapar aspas + o valor de volta no atributo',
    cena: '[14]',
    pares: [
      [
        `  function escH(s){
    var d=document.createElement("div"); d.textContent=(s==null?"":String(s));
    return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }`,
        '  function escH(s){ var d=document.createElement("div"); d.textContent=(s==null?"":String(s)); return d.innerHTML; }',
      ],
      [
        `      return '<button class="op"><span class="marca"></span><span class="txt">'`,
        `      return '<button class="op" data-v="'+escH(o.v)+'"><span class="marca"></span><span class="txt">'`,
      ],
    ],
  },
  {
    // As squads (dono, 21/08). Defeito 1: o agrupamento simplesmente nao existe — e o estado
    // de ontem, com os cards soltos na ordem do servidor. Se a cena 16 passar assim, ela nao
    // esta medindo o agrupamento, esta medindo que a pagina abre.
    id: 'squads · o agrupamento por squad some (card solto na grade)',
    cena: '[16]',
    pares: [[
      `    var alvo=grupoDe(item.squad);
    if(card.parentNode!==alvo) alvo.appendChild(card);   // idempotente: só move quando trocou de squad`,
      '    g.appendChild(card);',
    ]],
  },
  {
    // Defeito 2, e e o que o dono pediu para nao acontecer: o grupo deixa de ser criado UMA
    // vez. Com isto cada volta do refresh de 7 s cria invólucro e cabecalho novos — a grade
    // some aos poucos atras de cabecalhos repetidos, sem erro de console, sem nada quebrar.
    id: 'squads · o grupo renasce a cada volta (o refresh duplica os cabecalhos)',
    cena: '[16]',
    pares: [['    if(grupos[chave]) return grupos[chave];', '    if(false) return grupos[chave];']],
  },
  {
    // PIN, 22/08. O gate de localhost e uma linha so, e uma linha so e exatamente o tipo de
    // conserto que some numa refatoracao sem ninguem notar: sem ele o painel do plantao passa
    // a abrir um portao de login que ele nao tem como atravessar (o PIN e do dono), toda vez
    // que a escrita local levar 401. A cena 18 tem de reprovar.
    id: 'PIN · o gate de localhost some (o portao volta a abrir na maquina do plantao)',
    cena: '[18]',
    pares: [[
      '    if(ses || LOCAL) return;   // em localhost nao ha portao — ver LOCAL, la em cima',
      '    if(ses) return;',
    ]],
  },
  {
    // PIN, 22/08. O contador de erros e UX, e UX que nao morde e UX que nao existe: sem
    // gravar o erro, `esperaRestante()` devolve 0 para sempre e a sexta tentativa sai na rede
    // como as cinco primeiras. O defeito e mudo — nada quebra, nada avisa, e o unico sintoma
    // e um formulario que aceita marteladas sem fim.
    id: 'PIN · o contador de erros para de contar (a espera de 30 s nunca chega)',
    cena: '[9]',
    pares: [[
      `  function contarErro(){
    var t=lerTentativas(); t.erros++;
    if(t.erros>=ERROS_ATE_ESPERAR) t.ate=Date.now()+ESPERA_MS;
    gravarTentativas(t);
  }`,
      '  function contarErro(){ }',
    ]],
  },
  {
    // P5 da 2a auditoria (22/08). O alias sozinho numa lista e o tipo de coisa que some numa
    // limpeza de regex sem ninguem notar — e o sintoma nao e inseguranca, e o plantao diante
    // de um formulario que ele nao tem como atravessar, porque o PIN e do dono.
    id: 'P5 · 0.0.0.0 sai do gate de localhost',
    cena: '[19]',
    pares: [[
      'var LOCAL=/^(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|\\[::1\\]|::1)$/',
      'var LOCAL=/^(localhost|127\\.0\\.0\\.1|\\[::1\\]|::1)$/',
    ]],
  },
  {
    // P4 da 2a auditoria (22/08): o toast que mentia duas vezes em localhost ("sem conexao"
    // quando foi 401, "reenvio" quando nao ha para onde). Reverter o catch de `registrar` ao
    // que ele era devolve a mentira — e a cena 18 tem de pegar isso, senao a correcao nao
    // esta medida e amanha alguem a desfaz sem que nada apite.
    id: 'P4 · o toast de localhost volta a dizer "sem conexao — guardei e reenvio"',
    cena: '[18]',
    pares: [[
      `      .catch(function(err){
        var st=(err && err.status)||0;
        var f=lerFila(); f.push(reg);
        if(!gravarFila(f)) return "perdido";`,
      `      .catch(function(err){
        var st=(err && err.status)||0; void st;
        var f=lerFila(); f.push(reg);
        if(!gravarFila(f)) return "perdido";
        if(true) return "fila";`,
    ]],
  },
  {
    // P3 da 2a auditoria (22/08), decidido pelo dono: o minimo do PIN subiu de 6 para 8. O
    // GoTrue aceita 6 por padrao, entao este minimo e NOSSO — e minimo que so existe num
    // `if` some sem deixar rastro. Com o 6 de volta, o PIN de 7 caracteres da cena 17 vira
    // pedido de rede, que e exatamente o que ela cobra que nao aconteca.
    id: 'P3 · o minimo do PIN volta a 6 (a borda de 8 deixa de ser cobrada)',
    cena: '[17]',
    pares: [['  var PIN_MIN=8;', '  var PIN_MIN=6;']],
  },
];

const COPIA = path.join(RAIZ, 'test', 'tmp-fila-defeito.html');
let ruins = 0;
// O dashboard esta gravado com CRLF (e o Windows/.gitattributes que decide isso, nao eu).
// Um trecho de duas linhas escrito aqui com \n nunca casaria — e o controle diria "envelheceu"
// sobre um arquivo intacto. A quebra do arquivo manda.
const EOL = src.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
const comEOL = s => s.split('\n').join(EOL);

for (const d of DEFEITOS) {
  let quebrado = src;
  for (const par of d.pares) {
    const de = comEOL(par[0]), para = comEOL(par[1]);
    if (quebrado.indexOf(de) < 0) {
      console.log('PAROU: nao achei no dashboard um trecho de "' + d.id + '" — o controle envelheceu.');
      process.exit(2);
    }
    quebrado = quebrado.replace(de, para);
  }
  fs.writeFileSync(COPIA, quebrado);
  let saida = 0, texto = '';
  try {
    texto = execFileSync(process.execPath, [path.join(__dirname, 'fila-auth.js')], {
      cwd: RAIZ, encoding: 'utf8', env: Object.assign({}, process.env, { FILA_AUTH_HTML: COPIA }),
    });
  } catch (e) {
    saida = e.status == null ? 1 : e.status;
    texto = (e.stdout || '') + (e.stderr || '');
  }
  const linhas = texto.split('\n');
  const iCena = linhas.findIndex(l => l.indexOf(d.cena) === 0 || l.trim().indexOf(d.cena) === 0);
  const falhasNaCena = iCena < 0 ? [] : linhas.slice(iCena, iCena + 10).filter(l => /FALHOU/.test(l));
  const total = (texto.match(/FALHOU/g) || []).length;
  if (saida !== 0 && falhasNaCena.length > 0) {
    console.log('  ok  ' + d.id + '  -> exit ' + saida + ', ' + total + ' falha(s), ' + falhasNaCena.length + ' na cena ' + d.cena);
    falhasNaCena.forEach(l => console.log('        ' + l.trim()));
  } else {
    ruins++;
    console.log('  DECORACAO  ' + d.id + '  -> exit ' + saida + ', ' + total + ' falha(s), '
      + falhasNaCena.length + ' na cena ' + d.cena + ' — o portao NAO mordeu o defeito');
  }
}

fs.unlinkSync(COPIA);
console.log('\n' + (ruins ? 'REPROVOU: ' + ruins + ' defeito(s) passaram pelo portao'
  : 'PASSOU: os ' + DEFEITOS.length + ' defeitos foram pegos — o portao morde'));
process.exit(ruins ? 1 : 0);
