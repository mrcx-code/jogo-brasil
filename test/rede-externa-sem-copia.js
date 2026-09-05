// O PORTÃO QUE IMPEDE A RECOPIA — item `filtro-de-console-copiado-por-arquivo` (nuvem-20260905T0023).
//
// POR QUE ELE EXISTE. Em 04/09 o QA achou que `ver-territorio.js` e `qa-salvador-vivo.js`
// decidiam se um erro de console era "a máquina, não o jogo" casando SUBSTRING DE TEXTO
// (`/posthog|ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/`) contra `m.text()`, sem olhar de onde o
// erro veio — e essa regra engoliu 2 de 3 erros REAIS fabricados de propósito (um erro do
// próprio jogo que só MENCIONASSE uma dessas palavras desaparecia igual ao ruído de verdade).
// `test/rede-externa.js` nasceu para consertar isso decidindo pela ORIGEM (`m.location().url`
// contra `MEDIDA_HOST`), mas medido em 04/09 e de novo em 05/09: só 3 de 46 arquivos que
// escutam console de navegador o usavam. Os outros reimplementavam a mesma pergunta cada um à
// sua maneira — e um deles (`robusto-tudo.js`) tinha o MESMO defeito por substring que motivou
// o helper, só que datado de antes dele existir.
//
// O QUE ESTE PORTÃO COBRA, e o que ele NÃO cobra:
//   · Cobra que nenhum arquivo NOVO (fora da lista `EXEMPTO` abaixo, cada entrada com o motivo
//     por escrito) volte a escrever, em CÓDIGO (não em comentário — linhas de comentário são
//     ignoradas de propósito, porque citar o padrão em prosa para explicar por que ele é
//     proibido não é o mesmo que reimplementá-lo), um filtro de rede-externa por SUBSTRING DE
//     TEXTO escrito à mão: uma expressão regular contendo `ERR_`, `posthog` ou
//     `Failed to load resource` usada diretamente num `.test(...)`, em vez de chamar
//     `ehRuidoDeRedeExterna` (ou `MEDIDA_HOST`) de `test/rede-externa.js`.
//   · Cobra que os arquivos GOVERNADOS (a lista `GOVERNADOS`, os que este item de 05/09
//     converteu de propósito para o helper) continuem exigindo `./rede-externa.js` — é a
//     trava de REGRESSÃO: se alguém desfizer a conversão sem tirar o arquivo da lista, o
//     portão acusa.
//   · NÃO varre o repositório inteiro por "todo arquivo que conta erro de console tem de usar
//     o helper" — isso reprovaria hoje mesmo as páginas da PLATAFORMA (`fila-auth.js`,
//     `painel-sem-sinal.js`, `medir-paginas.js`, `rodape-verdadeiro.js`,
//     `qa-eca-escolar-paginas.js`), que são território do dev-plataforma e têm razões próprias
//     (algumas ignoram QUALQUER `Failed to load resource`, de propósito, porque testam páginas
//     estáticas sem CSP de rede externa) — decidir a forma delas não é deste ticket. Elas ficam
//     em `EXEMPTO`, cada uma com o motivo, para este portão não fingir que resolveu o que não
//     tocou.
//
// COMO USAR
//   node test/rede-externa-sem-copia.js     # exit 0 = ninguém recopiou o filtro à mão
'use strict';

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

// ————— 1. GOVERNADOS — arquivos que DECIDEM por erro de console e foram apontados, de
// propósito, para `ehRuidoDeRedeExterna`. Regressão aqui é: alguém desfaz o `require` ou volta
// a escrever um filtro à mão sem tirar o arquivo desta lista. —————
const GOVERNADOS = [
  // já usavam o helper antes deste item (04/09):
  'aceiro-sem-coleta.js', 'qa-salvador-vivo.js', 'ver-territorio.js',
  // convertidos por este item (05/09), com a prova de mordida nos dois sentidos no placar:
  'smoke.js', 'robusto-tudo.js', 'qa-praca-quadro-vazio-vira-objeto.js',
  'ver-capitulo.js', 'qa-caminho-do-ceu.js', 'medir-caminho-do-ceu.js',
  'medir-acolher.js', 'medir-acompanhar.js', 'medir-pixel.js',
  'olhar-drop-salvador.js', 'peso-prototipo.js',
  'prints-cap4.js', 'prints-consistencia.js', 'prints-grao.js',
  'prints-onda2.js', 'prints-onda3.js', 'prints-onda5.js', 'prints-onda7.js',
];

// ————— 2. EXEMPTO — arquivos que TÊM um filtro escrito à mão e continuam tendo, cada um com
// o motivo. Nenhuma entrada aqui é "esqueci de converter": ou é território de outro agente, ou
// o helper genuinamente não cobre o caso (e mudar isso é decisão de quem mede, não deste
// portão). —————
const EXEMPTO = {
  // Território do dev-plataforma (páginas fora do jogo) — não é deste ticket, e forçar aqui
  // reprovaria hoje mesmo `npm test` (que roda `qa-eca-escolar-paginas.js`) por um filtro que
  // não é meu para decidir. Achado, não corrigido: ver o relatório de 05/09.
  'fila-auth.js': 'dashboard/plataforma — dev-plataforma decide a forma do filtro, não este item',
  'painel-sem-sinal.js': 'dashboard — dev-plataforma decide a forma do filtro, não este item',
  'medir-paginas.js': 'páginas da plataforma — dev-plataforma decide a forma do filtro',
  'rodape-verdadeiro.js': 'rodapé do dashboard — dev-plataforma decide a forma do filtro',
  'qa-eca-escolar-paginas.js': 'seis páginas da plataforma — dev-plataforma decide a forma do filtro',
  // O helper só ignora falha de ALCANÇAR o host (`net::ERR_...`). O bloco 17 do `encaixe.js`
  // testa RESILIÊNCIA a um posthog que responde 503 de propósito — medido em 05/09 (probe em
  // `test/tmp-probe503.js`, descartado): isso produz
  // "Failed to load resource: the server responded with a status of 503", que NÃO bate
  // `net::ERR_` e o helper contaria como erro real — mudaria o veredito de um teste que está
  // certo hoje. Estender o helper para cobrir "resposta HTTP do MEDIDA_HOST em teste de
  // resiliência" é uma extensão de contrato, não uma conversão mecânica; fica para quem decidir
  // isso de propósito. Também é o arquivo que `filtro-console-controle.js` EXTRAI por texto
  // (âncora `page.on('console', m => {`) — trocar o corpo por uma chamada de função quebraria
  // essa extração (a função ficaria fora do escopo de `new Function`).
  'encaixe.js': 'bloco 17 testa 503 do MEDIDA_HOST de propósito; extraído por filtro-console-controle.js',
  // Lê e recompila o CORPO do primeiro filtro de `encaixe.js` via `new Function`, com o texto
  // do diff no comentário — as duas coisas soam "regex + .test(" para uma varredura de texto,
  // e as duas são prosa/mecanismo de extração, não um filtro à mão duplicado em produção.
  'filtro-console-controle.js': 'extrai e recompila o filtro de encaixe.js; não decide por si',
  // Não conta erro de console de navegador (confirmado pelo Claude/coordenador em 05/09):
  // são portões do RITUAL, território de outro agente nesta rodada — não tocar.
  'salvador-drop-sem-ritual.js': 'não conta erro de console; território do ritual, outro agente',
  'qa-ritual-varredura.js': 'não conta erro de console; território do ritual, outro agente',
};

const PROIBIDOS_POR_ARQUIVO_NOVO = [
  // regex literal contendo ERR_/posthog/"Failed to load resource" usada direto num `.test(`,
  // fora de linha de comentário — é a assinatura do defeito de 04/09, redatada à mão.
  /\/(?:[^\n\/\\]|\\.)*(?:ERR_|posthog|Failed to load resource)(?:[^\n\/\\]|\\.)*\/[a-z]*\s*\.test\(/i,
];

function semLinhasDeComentario(txt) {
  return txt.split('\n')
    .filter(l => !/^\s*\/\//.test(l))
    .join('\n');
}

function requerHelper(txt) {
  return /require\(['"]\.\.?\/rede-externa\.js['"]\)/.test(txt);
}

const arquivos = fs.readdirSync(DIR).filter(f => f.endsWith('.js') && f !== 'rede-externa.js' && f !== path.basename(__filename));

let falhas = 0;
function acusar(msg) { console.error('  FALHA ' + msg); falhas++; }
function ok(msg) { console.log('  ok    ' + msg); }

// ————— A. Regressão nos GOVERNADOS —————
for (const nome of GOVERNADOS) {
  const p = path.join(DIR, nome);
  if (!fs.existsSync(p)) { acusar(nome + ': está na lista GOVERNADOS mas o arquivo sumiu — atualize a lista'); continue; }
  const txt = fs.readFileSync(p, 'utf8');
  if (!requerHelper(txt)) { acusar(nome + ': GOVERNADO deixou de requerer ./rede-externa.js — a conversão foi desfeita'); continue; }
  ok(nome + ': continua no helper');
}

// ————— B. Nenhum arquivo fora de EXEMPTO reimplementa o filtro à mão —————
for (const nome of arquivos) {
  if (EXEMPTO[nome]) continue;
  const txt = semLinhasDeComentario(fs.readFileSync(path.join(DIR, nome), 'utf8'));
  const bateu = PROIBIDOS_POR_ARQUIVO_NOVO.some(re => re.test(txt));
  if (bateu) {
    acusar(nome + ': escreveu um filtro de rede-externa à mão (regex ERR_/posthog/"Failed to '
      + 'load resource" num .test) fora do helper — use ehRuidoDeRedeExterna de ./rede-externa.js, '
      + 'ou, se o caso for genuinamente diferente, acrescente este arquivo a EXEMPTO aqui dizendo por quê.');
  }
}

console.log('\n' + (falhas ? 'REPROVOU (' + falhas + ')' : 'PASSOU — nenhuma recopia do filtro de rede externa'));
process.exit(falhas ? 1 : 0);
