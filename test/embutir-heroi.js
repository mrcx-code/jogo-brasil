// uso antigo:  embutir-heroi.js andar.json correr.json pular.json      (walk, run, sp)
// uso novo:    embutir-heroi.js walk=andar.json atk1=alcancar.json ...  (qualquer chave, so as dadas)
//
// A forma com chave existe porque atk1 e atk2 tambem sao arte da personagem e nao tinham como
// entrar; e porque uma chave pode precisar ficar VAZIA — `run=` esvazia o bloco, que e como a
// corrida volta a cair na caminhada enquanto nao houver folha de corrida aproveitavel.
const fs = require('fs');
// ALVO: src/jogo.ts, a FONTE. O index.html da raiz virou SAIDA do build na migracao para
// TypeScript — escrever nele funciona e some no proximo `npm run build`, sem erro nenhum.
const p = 'src/jogo.ts';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let s = raw.split(/\r?\n/).join('\n');
const args = process.argv.slice(2);
const mapa = args.some(a => a.includes('='))
  ? args.map(a => [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)])
  : [['walk', args[0]], ['run', args[1]], ['sp', args[2]]];
for (const [chave, arquivo] of mapa) {
  const dados = arquivo ? JSON.parse(fs.readFileSync(arquivo, 'utf8')) : { frames: [] };
  const i = s.indexOf('  ' + chave + ': [');
  if (i < 0) { console.log('bloco nao achado:', chave); continue; }
  const j = s.indexOf('\n  ]', i);
  const antes = (s.slice(i, j).match(/data:image/g) || []).length;
  const linhas = dados.frames.map(f => '    "' + f.b64 + '",').join('\n');
  s = s.slice(0, i) + '  ' + chave + ': [\n' + linhas + s.slice(j);
  console.log(chave + ':', antes, '->', dados.frames.length,
    dados.frames.length ? '(' + dados.frames[0].w + 'x' + dados.frames[0].h + ')' : '(vazio)');
}
fs.writeFileSync(p, s.split('\n').join(eol));
console.log('index.html:', (fs.statSync(p).size / 1024 / 1024).toFixed(2), 'MB');
