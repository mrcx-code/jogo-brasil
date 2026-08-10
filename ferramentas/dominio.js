// O ENDEREÇO PÚBLICO DO JOGO, NUM LUGAR SÓ.
//
// Por que este arquivo existe: as tags og: do <head> apontam para o endereço em DOIS lugares
// (`og:url` e `og:image`) e o cartão do WhatsApp só monta se os dois casarem com o endereço
// de onde a página foi servida — a "base". Três coisas que mudam juntas ou nada; o
// `test/encaixe.js` bloco 14 cobra o casamento, mas cobrar depois do erro é diferente de não
// deixar o erro existir. Aqui elas nascem de UMA linha: o molde `src/index.html` escreve
// `@@BASE@@` e o `ferramentas/construir.js` troca por isto.
//
// TROCAR O DOMÍNIO É TROCAR A LINHA ABAIXO e rodar `npm run build`. Nada mais.
//  · raiz de um domínio  →  'https://matheusferreira.cc'
//  · subdomínio          →  'https://brasil.matheusferreira.cc'
//  · subcaminho          →  'https://matheusferreira.cc/brasil'   (sem barra no fim)
//
// SEM BARRA NO FIM, sempre: o molde escreve `@@BASE@@/compartilhar.jpg`, e uma barra dupla
// no meio de uma URL de og:image é justamente o tipo de coisa que alguns robôs de prévia
// engolem e outros recusam — em silêncio, nos dois casos.
//
// O jogo em si não usa isto para nada: o único caminho de rede dele é relativo
// (`caminhoPacote()`), e por isso ele funciona igual na raiz, no subdomínio ou no subcaminho.
const BASE = 'https://matheusferreira.cc';

if (/\/$/.test(BASE)) throw new Error('ferramentas/dominio.js: a BASE não pode terminar em barra — ' + BASE);
if (!/^https:\/\/[^/]+/.test(BASE)) throw new Error('ferramentas/dominio.js: a BASE tem de ser https:// e um host — ' + BASE);

module.exports = { BASE: BASE };
