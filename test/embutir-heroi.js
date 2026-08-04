const fs = require('fs');
const p = 'index.html';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let s = raw.split(/\r?\n/).join('\n');
const mapa = [['walk', process.argv[2]], ['run', process.argv[3]], ['sp', process.argv[4]]];
for (const [chave, arquivo] of mapa) {
  const dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const i = s.indexOf('  ' + chave + ': [');
  if (i < 0) { console.log('bloco nao achado:', chave); continue; }
  const j = s.indexOf('\n  ]', i);
  const antes = (s.slice(i, j).match(/data:image/g) || []).length;
  const linhas = dados.frames.map(f => '    "' + f.b64 + '",').join('\n');
  s = s.slice(0, i) + '  ' + chave + ': [\n' + linhas + s.slice(j);
  console.log(chave + ':', antes, '->', dados.frames.length, '(' + dados.frames[0].w + 'x' + dados.frames[0].h + ')');
}
fs.writeFileSync(p, s.split('\n').join(eol));
console.log('index.html:', (fs.statSync(p).size / 1024 / 1024).toFixed(2), 'MB');
