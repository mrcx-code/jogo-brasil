// CONTROLE DO PORTAO — o instrumento que tenta DERRUBAR o test/fila-auth.js.
//
// EQUIPE.md 2.8: "um instrumento que nunca foi visto reprovando e decoracao". Em 20/08 dois
// portoes deste repositorio foram pegos no mesmo dia medindo outra coisa e saindo verdes; e em
// 21/08 a auditoria da seguranca achou que a cena 5 do fila-auth.js era CEGA — ela guardava uma
// sessao ja vencida na CARGA, a partida renovava o token antes do primeiro toque, e apagar a
// renovacao do caminho de ESCRITA nao mudava o resultado. Verde medindo o conserto do vizinho.
//
// Este arquivo faz o que ninguem faz sozinho: copia o dashboard, APAGA um conserto por vez, e
// exige que o portao reprove. Se alguma copia defeituosa passar, este controle sai 1 — porque
// nesse caso o defeito nao e a copia, e o portao.
//
// Roda assim (sao 4 execucoes do fila-auth.js, ~2 min):  node test/fila-auth-controle.js
// Nao esta no CI de proposito: o CI roda o portao, este roda o portao do portao.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const FONTE = path.join(RAIZ, 'dashboard', 'index.html');
const src = fs.readFileSync(FONTE, 'utf8');

// Cada defeito e um pedaco EXATO do dashboard e o que sobra no lugar dele. Se o pedaco nao for
// achado, o controle para: quer dizer que o conserto mudou de forma e este arquivo envelheceu
// — e um controle que "nao acha o defeito" e passa seria a mesma decoracao que ele denuncia.
const DEFEITOS = [
  {
    id: 'A10 · a escrita deixa de renovar o token',
    cena: '[5]',
    de: `    if(ses.expira_em && (ses.expira_em - Date.now()) < 60000)
      return refrescar().then(function(s){ return s ? comToken(s) : (ses ? comToken(ses) : H); });
`,
    para: '',
  },
  {
    id: 'A5 · a fila local volta a nao ter teto',
    cena: '[11]',
    de: '    if(f.length>FILA_MAX || s.length>FILA_BYTES){',
    para: '    if(false){',
  },
  {
    id: 'A6 · nenhum 4xx e permanente (a fila entope de novo)',
    cena: '[12]',
    de: '  function permanente(st){ return st>=400 && st<500 && st!==401 && st!==403 && st!==408 && st!==429; }',
    para: '  function permanente(st){ return false && st; }',
  },
  {
    id: 'A8 · sair volta a so apagar do aparelho',
    cena: '[13]',
    de: `      try{ fetch(SB_URL+"/auth/v1/logout",{method:"POST",headers:comToken(ses),keepalive:true}).catch(function(){}); }catch(e){}
`,
    para: '',
  },
];

const COPIA = path.join(RAIZ, 'test', 'tmp-fila-defeito.html');
let ruins = 0;
// O dashboard esta gravado com CRLF (e o `.gitattributes`/Windows que decide isso, nao eu).
// Um trecho de duas linhas escrito aqui com \n nunca casaria — e o controle diria "envelheceu"
// sobre um arquivo intacto. A quebra do arquivo manda.
const EOL = src.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
const comEOL = s => s.split('\n').join(EOL);

for (const d of DEFEITOS) {
  d.de = comEOL(d.de); d.para = comEOL(d.para);
  if (src.indexOf(d.de) < 0) {
    console.log('PAROU: nao achei no dashboard o trecho de "' + d.id + '" — o controle envelheceu.');
    process.exit(2);
  }
  fs.writeFileSync(COPIA, src.replace(d.de, d.para));
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
  const falhasNaCena = iCena < 0 ? [] : linhas.slice(iCena, iCena + 9).filter(l => /FALHOU/.test(l));
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
