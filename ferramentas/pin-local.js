// A ROTA /pin-local — o auto-login da mesa na maquina DO DONO (PENDENTES 57).
//
// Decisao dele, 22/08: "localhost nao precisa entrar para interagir". Antes disto o dashboard
// aberto em localhost nao tinha portao NENHUM — e, depois que a RLS fechou a fila (a policy so
// aceita INSERT do uuid do dono), "sem portao" virou "sem escrita": a resposta caia na fila
// local e ficava la, com um toast honesto dizendo que so sairia quando isto aqui existisse.
//
// O DESENHO, em uma frase: o dono escreve o PIN num arquivo que o git nao ve, o servidor local
// so o entrega a quem chega pelo loopback, e a pagina em localhost troca esse PIN por uma
// sessao de verdade — a MESMA que ela teria se ele tivesse digitado. Nada de sessao fingida,
// nada de privilegio novo: quem valida continua sendo o Supabase Auth.
//
// O ARQUIVO: ferramentas/mesa-pin.local, uma linha, o PIN e nada mais. O DONO o cria a mao,
// uma vez. Se ele nao existir, esta rota nao existe — e o dashboard segue com o toast honesto
// de sempre, sem tela, sem erro, sem tentar de novo.
//
// O PLANTAO NUNCA LE ESTE ARQUIVO. Nem eu, nem agente nenhum, nem por curiosidade, nem para
// "conferir se esta certo": ler o arquivo e a mesma coisa que pedir o PIN ao dono, e o ponto
// inteiro do PIN e que ele exista so na cabeca dele e no resumo criptografico do GoTrue. O
// instrumento que mede esta rota (test/fila-auth.js, cena 23) escreve um arquivo PROPRIO com um
// PIN inventado e aponta para ele — `atender` aceita o caminho justamente para isso.
//
// O PIN NUNCA VAI PARA O LOG. Nao ha console.log nenhum neste arquivo, e nao e esquecimento:
// terminal fica aberto, terminal vira print, print vira anexo. A cena 23 cobra isso capturando
// o console durante a chamada.
//
// SEGURANCA, DITA COM O TAMANHO DO DANO — porque "PIN em texto plano" soa mal e a conta e o
// que decide:
//   (a) QUEM LE O ARQUIVO JA ESTA DENTRO DA MAQUINA. Um processo que consegue abrir
//       ferramentas/mesa-pin.local ja pode ler o localStorage do Chrome dessa mesma maquina,
//       onde mora o access_token E o refresh_token depois de qualquer entrada normal. O arquivo
//       nao abre porta nova; ele e uma porta a menos que as que ja estao abertas ali dentro.
//   (b) A ROTA SO RESPONDE AO LOOPBACK. Os dois servidores (servir.js, receber.js) ja fazem
//       bind em 127.0.0.1, entao hoje nenhum socket de fora sequer chega — a conferencia do
//       remoteAddress e a segunda linha, para o dia em que alguem trocar o bind por 0.0.0.0
//       "so para testar no celular". Endereco que nao e loopback recebe o MESMO 404 de uma rota
//       inexistente: a rota nao se anuncia, nao devolve 403, nao diz que existe.
//   (c) O DANO MAXIMO NAO MUDA, e ele ja estava medido em 22/08: quem tem o PIN faz INSERT em
//       mesa_resposta e troca o PIN/e-mail da propria conta (PUT /auth/v1/user). Nao alcanca
//       dado de terceiro nenhum — SELECT ja e publico, UPDATE e DELETE nao tem policy para
//       papel nenhum, e a chave privilegiada nunca sai do servidor. A troca de PIN, que e a
//       parte feia (tranca o dono para fora), depende da trava de painel "Secure password
//       change" estar ligada, e ela esta na instrucao de fechamento do ferramentas/fila-auth.sql.
//
// O .GITIGNORE E PARTE DA ENTREGA, e e a UNICA coisa que impede o arquivo de entrar no
// historico: o guarda de segredo do ferramentas/construir.js varre o que vai para `dist/`, e
// `ferramentas/` nunca vai para dist/ (nem a extensao `.local` esta na lista de texto varrido).
// Conferido, e escrito aqui para ninguem supor cobertura que nao existe.

const fs = require('fs');
const path = require('path');

const CAMINHO = '/pin-local';
const ARQUIVO_PADRAO = path.join(__dirname, 'mesa-pin.local');

// Os tres enderecos que a propria maquina usa. `::ffff:127.0.0.1` e a forma mapeada, que e o
// que o Node entrega quando o socket e IPv6 e o cliente chegou por IPv4 — deixa-la de fora
// erraria na direcao segura, mas quebraria o auto-login em metade das maquinas sem dizer por que.
// Faixa 127.x inteira NAO entra: os dois servidores fazem bind em 127.0.0.1 e mais nada chega ali.
function ehLoopback(req) {
  const s = (req && req.socket) || {};
  const a = s.remoteAddress || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}

// Devolve `true` se ATENDEU (e ai a resposta ja foi escrita) e `false` se nao e assunto dele —
// e `false` e de proposito o mesmo desfecho de "nao e loopback" e de "o arquivo nao existe":
// quem chama simplesmente segue para o 404 dele, que e o 404 de qualquer caminho que nao existe.
function atender(req, res, arquivo) {
  if (!req || req.method !== 'GET') return false;
  if (String(req.url || '').split('?')[0] !== CAMINHO) return false;
  if (!ehLoopback(req)) return false;
  let bruto;
  try { bruto = fs.readFileSync(arquivo || ARQUIVO_PADRAO, 'utf8'); } catch (e) { return false; }
  // Uma linha, sem o que o editor deixa atras: BOM, CR do Windows e espaco de sobra viram PIN
  // errado e "nao entrou" sem motivo visivel — e a pessoa nao tem como desconfiar de um \r.
  const pin = bruto.replace(/^\uFEFF/, '').split('\n')[0].trim();
  if (!pin) return false;
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(pin);
  return true;
}

module.exports = { CAMINHO, ARQUIVO_PADRAO, ehLoopback, atender };
