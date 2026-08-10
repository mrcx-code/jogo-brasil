// ENDEREÇAR CADA IMAGEM EMBUTIDA — onde ela mora dentro da estrutura, não em que linha está.
//
// O `ferramentas/construir.js` precisa tirar do arquivo a arte de um capítulo e devolvê-la
// depois, no lugar exato de onde saiu. Para isso ele precisa de um ENDEREÇO por imagem:
// `["CENARIO_ALTO_B64", 2]`, `["HERO_B64", "walk2", 0]`, `["MOB_B64", "smog", 1]`.
//
// POR QUE UM MINI-ANALISADOR E NÃO UMA EXPRESSÃO REGULAR. O jeito preguiçoso é contar
// literais por linha e adivinhar a chave pelo que veio antes — e ele erra em silêncio no
// primeiro caso torto: a própria linha da imagem começa com `"data:image/webp;base64,…"`, e
// um `/^\s*"?(\w[\w-]*)"?\s*:/` a lê como uma chave chamada `data`. Endereço errado devolve a
// imagem no lugar errado, e isso não dá erro de console: dá a pintura de um capítulo dentro de
// outro, que é exatamente a falha do §2 que o `arteDaCena()` do jogo já foi escrito para
// impedir. Então aqui se lê a estrutura de verdade, com pilha e tudo.
//
// O analisador cobre só o que os blocos gerados usam — literal de array, de objeto e de
// string, mais comentário — e ESTOURA em qualquer coisa que não entenda, em vez de seguir
// chutando. Ele nunca avalia nada: só anda pelo texto anotando posições.

function pular(js, i) {
  for (;;) {
    while (i < js.length && /\s/.test(js[i])) i++;
    if (js[i] === "/" && js[i + 1] === "/") { while (i < js.length && js[i] !== "\n") i++; continue; }
    if (js[i] === "/" && js[i + 1] === "*") { const f = js.indexOf("*/", i + 2); i = f < 0 ? js.length : f + 2; continue; }
    return i;
  }
}

// Devolve o índice logo DEPOIS da aspa de fecho. Respeita a barra invertida, que é o que
// separa ler uma string de cortar uma no meio.
function fimDaString(js, i) {
  const aspa = js[i];
  let j = i + 1;
  while (j < js.length) {
    if (js[j] === "\\") { j += 2; continue; }
    if (js[j] === aspa) return j + 1;
    j++;
  }
  throw new Error("string sem fim a partir de " + i);
}

// Anda por um valor e anota toda literal `data:image/...` que encontrar, com o caminho até
// ela. Devolve o índice logo depois do valor.
function valor(js, i, caminho, achados) {
  i = pular(js, i);
  const c = js[i];
  if (c === '"' || c === "'") {
    const fim = fimDaString(js, i);
    if (js.startsWith("data:image/", i + 1)) achados.push({ caminho: caminho.slice(), ini: i, fim: fim });
    return fim;
  }
  if (c === "[") {
    i++;
    let n = 0;
    for (;;) {
      i = pular(js, i);
      if (js[i] === "]") return i + 1;
      i = valor(js, i, caminho.concat(n), achados);
      n++;
      i = pular(js, i);
      if (js[i] === ",") i++;
    }
  }
  if (c === "{") {
    i++;
    for (;;) {
      i = pular(js, i);
      if (js[i] === "}") return i + 1;
      let chave;
      if (js[i] === '"' || js[i] === "'") {
        const f = fimDaString(js, i);
        chave = js.slice(i + 1, f - 1);
        i = f;
      } else {
        let j = i;
        while (j < js.length && /[\w$]/.test(js[j])) j++;
        if (j === i) throw new Error("esperava uma chave em " + i + ": " + JSON.stringify(js.slice(i, i + 40)));
        chave = js.slice(i, j);
        i = j;
      }
      i = pular(js, i);
      if (js[i] !== ":") throw new Error("esperava `:` depois da chave " + chave);
      i = valor(js, i + 1, caminho.concat(chave), achados);
      i = pular(js, i);
      if (js[i] === ",") i++;
    }
  }
  // Qualquer outro valor (identificador, número, chamada) — o bloco não é feito deles, mas
  // um bloco novo pode ser, e engolir o token inteiro é melhor que estourar.
  let j = i, prof = 0;
  while (j < js.length) {
    const d = js[j];
    if (d === '"' || d === "'") { j = fimDaString(js, j); continue; }
    if (d === "(" || d === "[" || d === "{") prof++;
    else if (d === ")" || d === "]" || d === "}") { if (prof === 0) break; prof--; }
    else if (d === "," && prof === 0) break;
    j++;
  }
  return j;
}

// Para cada nome pedido, acha `const NOME =` no começo de uma linha e lê o valor dele.
// Um nome que não existir no arquivo é ignorado — bloco de arte some e volta conforme a mesa
// entrega, e derrubar o build por causa disso seria pior que carregar a arte na abertura.
function enderecosDaArte(js, nomes) {
  const achados = [];
  for (const nome of nomes) {
    const re = new RegExp("^const " + nome + "\\s*=\\s*", "m");
    const m = re.exec(js);
    if (!m) continue;
    valor(js, m.index + m[0].length, [nome], achados);
  }
  return achados.sort(function (a, b) { return a.ini - b.ini; });
}

module.exports = { enderecosDaArte };
