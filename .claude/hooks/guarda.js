#!/usr/bin/env node
// O PORTÃO QUE RECUSA A ESCRITA — decidido pelo dono em 2026-08-19.
//
// POR QUE ELE EXISTE. Duas regras deste repositório eram PROSA: "nunca edite o index.html da
// raiz" e "a tela ONDE FOI é do dono". Prosa depende de o agente ler, lembrar e obedecer — e
// um agente que não leu não é desobediente, é só um agente que não leu. Palavras dele:
// *"gosto de hooks q travam mecanicamente, e inclusive pode tirar essas duas regras"*.
//
// A DIFERENÇA, e é a única que importa: pedir vira GARANTIR. Este arquivo roda antes de cada
// Write/Edit, e sair com código 2 **cancela a chamada** — o modelo recebe o motivo pelo stderr
// e segue trabalhando. Não é aviso, não é lembrete: é recusa.
//
// O TERRITÓRIO NÃO ESTÁ ESCRITO AQUI. Ele é lido do `TERRITORIO.md`, que passa a ser DADO e não
// mais texto para obedecer. Acrescentar um símbolo à lista de lá passa a travá-lo de verdade,
// sem tocar nesta função — e é de propósito: a lista é do dono, o portão é maquinário.
const fs = require('fs');
const path = require('path');

// AS DUAS PONTAS PRECISAM SER RESOLVIDAS DO MESMO JEITO — achado do mac-jogo em 23/08,
// conferindo a trava do PR #5 que eu tinha acabado de escrever (PENDENTES 59).
// O `__dirname` o Node já resolve por symlink; o `file_path` que chega da ferramenta, não.
// Onde houver symlink no caminho, as duas discordam, o `path.relative` devolve `../../../..`,
// NADA casa território — e o guarda passa sem escrever uma linha. No macOS não é caso raro:
// `os.tmpdir()` é `/var/folders/...`, symlink de `/private/var/folders/...`, que é onde o
// próprio teste monta o palco. Efeito grave: clone sob caminho com symlink perde a trava
// INTEIRA em silêncio — e "degradar em silêncio" foi escrito para DADO RUIM (sem
// .claude/maquina, JSON quebrado, carimbo ilegível), nunca para formato de caminho.
function real(p) {
  const abs = path.resolve(p);
  try { return fs.realpathSync(abs); } catch {}
  // arquivo que ainda não existe: resolve a PASTA, que quase sempre existe, e recola o nome
  try { return path.join(fs.realpathSync(path.dirname(abs)), path.basename(abs)); } catch {}
  return abs;                                   // nem a pasta existe: melhor cru que errado
}

const RAIZ = real(path.resolve(__dirname, '..', '..'));

let bruto = '';
process.stdin.on('data', (c) => { bruto += c; });
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(bruto || '{}'); } catch { process.exit(0); }   // não entendi: não atrapalho

  const ferramenta = ev.tool_name || '';
  const ent = ev.tool_input || {};
  // ===== O BASH TAMBEM ESCREVE, E ELE PASSAVA POR BAIXO DE TUDO (24/08) =====
  // Achado da caca de gap, provado ao vivo: `printf >> index.html` saiu EXIT 0, sem uma linha do
  // guarda, porque `.claude/settings.json` registrava o hook so para `Write|Edit|NotebookEdit`.
  // Consequencia: a recusa de escrever na saida de build, o lock entre maquinas e a ZONA DO DONO
  // eram todos contornaveis por um `sed -i`. A filosofia da casa e "pedir vira GARANTIR — nao e
  // aviso, e recusa"; sem isto, era aviso.
  //
  // O QUE ESTA COBERTURA E, HONESTAMENTE: as formas COMUNS de escrever por shell — redirecao,
  // `sed -i`, `tee`, e o destino de `cp`/`mv`. Nao e analise de shell, e nao pretende ser: um
  // `python -c` com `open(...,'w')` ou uma variavel montando o caminho escapam. Isto e um chao
  // muito mais alto que zero, e a lacuna fica escrita aqui em vez de virar surpresa.
  const alvos = [];
  if (ferramenta === 'Bash') {
    const cmd = String(ent.command || '');
    // heredoc e DADO, nao comando (mesma licao do guarda do gh): sem tirar, escrever um arquivo
    // que MENCIONA um caminho protegido seria recusado como se fosse a escrita nele.
    const semDoc = cmd.replace(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n[\s\S]*?^\t*\2[ \t]*$/gm, ' ');
    const cru = [];
    let m;
    const red = /(?:^|[;&|]|\s)\d?>>?\s*("([^"]+)"|'([^']+)'|([^\s;&|<>]+))/g;
    while ((m = red.exec(semDoc))) cru.push(m[2] || m[3] || m[4]);
    const sed = /\bsed\s+(?:-[^\s]*\s+)*-i[^\s]*\s+(?:(?:-[^\s]*|(?:'[^']*'|"[^"]*"|[^\s]+))\s+)*?("([^"]+)"|'([^']+)'|([^\s;&|]+))\s*(?:$|[;&|])/g;
    while ((m = sed.exec(semDoc))) cru.push(m[2] || m[3] || m[4]);
    const tee = /\btee\s+(?:-a\s+)?("([^"]+)"|'([^']+)'|([^\s;&|]+))/g;
    while ((m = tee.exec(semDoc))) cru.push(m[2] || m[3] || m[4]);
    const cpmv = /\b(?:cp|mv)\s+(?:-[^\s]+\s+)*(?:'[^']*'|"[^"]*"|[^\s;&|]+)\s+("([^"]+)"|'([^']+)'|([^\s;&|]+))/g;
    while ((m = cpmv.exec(semDoc))) cru.push(m[2] || m[3] || m[4]);
    for (const c of cru) {
      if (!c || c === '/dev/null' || /^&/.test(c)) continue;
      alvos.push(c.replace(/^~/, require('os').homedir()));
    }
    if (!alvos.length) process.exit(0);
  } else {
    const a = ent.file_path || ent.notebook_path || '';
    if (!a) process.exit(0);
    alvos.push(a);
  }

  // Um comando de shell pode escrever em VARIOS caminhos numa linha so; o corpo abaixo
  // roda para cada um. `recusar` sai do processo, entao o primeiro que bater ja recusa
  // o comando inteiro — que e o certo: nao existe meia escrita.
  for (const umAlvo of alvos) {
  const rel = path.relative(RAIZ, real(umAlvo)).split(path.sep).join('/');
  const recusar = (motivo) => { process.stderr.write(motivo); process.exit(2); };

  // ---- 0. O PORTAO FALA QUANDO AS DUAS PONTAS DISCORDAM — cobranca do mac-jogo em 23/08, e
  // ela e certa: eu tinha aplicado o remendo do symlink e nao a sugestao dele. O `path.relative`
  // era o SINTOMA; a doenca era o SILENCIO. Um caminho que resolve para fora da raiz nao casa
  // territorio nenhum, entao o guarda passa sem escrever uma linha — e foi assim que a trava
  // inteira sumiu no Mac sem ninguem notar, por um symlink em /var/folders.
  //
  // ESCREVER FORA DA RAIZ E LEGITIMO E COMUM (rascunho, recado, area temporaria), e gritar em
  // toda escrita dessas seria ruido — e ruido e como se aprende a ignorar um portao. O que NAO
  // e legitimo e a DISCORDANCIA: o caminho cru parecer de dentro e o resolvido cair fora, ou o
  // contrario. Isso e sempre defeito de resolucao (symlink, junction, montagem), nunca intencao
  // de quem escreveu — e e exatamente o caso que passou calado.
  //
  // Sai por stderr com codigo 0: avisa sem cancelar a chamada. O que muda e que, na proxima vez
  // que a trava sumir, alguem le o motivo em vez de descobrir dias depois.
  const relCru = path.relative(RAIZ, path.resolve(umAlvo)).split(path.sep).join('/');
  const dentro = (r) => r !== '' && !r.startsWith('../') && !path.isAbsolute(r);
  if (dentro(relCru) !== dentro(rel)) {
    process.stderr.write([
      'AVISO do portao: as duas pontas do caminho discordam, e por isso NENHUMA trava foi aplicada.',
      '  cru       -> ' + (relCru || '(a propria raiz)') + '   [' + (dentro(relCru) ? 'DENTRO' : 'fora') + ' da raiz]',
      '  resolvido -> ' + (rel || '(a propria raiz)') + '   [' + (dentro(rel) ? 'DENTRO' : 'fora') + ' da raiz]',
      '  raiz      -> ' + RAIZ,
      'Isto e defeito de resolucao (symlink, junction, montagem), nao intencao de quem escreveu.',
      'A escrita SEGUE — mas a saida de build, o lock entre maquinas e a zona do dono NAO foram',
      'conferidos para este arquivo. Num clone sob caminho com symlink, e por isso.',
      '(PENDENTES 59; o remendo entrou em 23/08, e este aviso e a outra metade que o mac-jogo pediu)',
      ''
    ].join('\n'));
  }

  // ---- 1. SAÍDA DE BUILD. Escrever aqui não é errado, é INÚTIL: o próximo `npm run build`
  // apaga. O sintoma é pior que um erro — o trabalho some sem ninguém notar, e a sessão
  // seguinte lê o arquivo de ontem achando que é o de hoje.
  const saida = [
    [/^index\.html$/, 'o index.html da RAIZ é saída de build'],
    [/^pack-[\w-]+\.json$/, 'os pack-*.json são saída de build'],
    [/^dist\//, 'a pasta dist/ é saída de build'],
    [/^android\/app\/src\/main\/assets\/public\//, 'os assets do Android são saída de `npm run app`'],
  ];
  for (const [re, oq] of saida) {
    if (re.test(rel)) {
      recusar(
        'RECUSADO pelo portão: ' + oq + ' — o próximo `npm run build` apaga o que você escrever.\n' +
        'A FONTE é src/index.html, src/estilo.css e src/jogo.ts. Edite lá e rode `npm run build`.\n' +
        '(regra do CLAUDE.md §3.1, virada portão em 19/08 porque como prosa ela dependia de ser lida)\n'
      );
    }
  }

  // ---- 2. TERRITÓRIO TRAVADO POR OUTRA MÁQUINA (Proposta B do PR #4, 23/08).
  // O `em-curso` do backlog era honra: a palavra só existia dentro do JSON e nenhuma ferramenta
  // lia. Agora ela recusa — mas só quando há certeza: outra máquina, item em-curso, território
  // casado e lock dentro da validade (2 h). Qualquer dúvida — sem `.claude/maquina`, JSON
  // quebrado, carimbo ruim, lock vencido — DEGRADA para o comportamento de sempre, porque
  // máquina travada por engano é pior que colisão. A lógica mora em `lock-maquina.js` para
  // caber num teste sozinha (test/guarda-lock.js).
  try {
    const { quemTrava } = require(path.join(__dirname, 'lock-maquina.js'));
    const trava = quemTrava(rel, RAIZ);
    if (trava) {
      const hora = String(trava.desde || '').replace('T', ' ').slice(0, 16);
      recusar(
        'RECUSADO pelo portão: ' + rel + ' pertence ao item ' + trava.id +
        (trava.titulo ? ' (' + trava.titulo + ')' : '') + ', em curso na máquina ' +
        trava.maquina + ' desde ' + hora + ' UTC.\n' +
        'Duas máquinas escrevendo no mesmo território se atropelam em silêncio.\n' +
        'Pegue outro item livre do backlog, ou fale com o dono. O lock vence sozinho em 2 h.\n' +
        '(Proposta B do PR #4; o estado sai de ferramentas/backlog.json, nunca deste arquivo)\n'
      );
    }
  } catch { /* o portão nunca vira bloqueio total por causa de dado ruim */ }

  // ---- 3. A ZONA DO DONO. A tela ONDE FOI é dele desde 17/08, e ele trabalha nela em OUTRA
  // máquina — duas escritas simultâneas no mesmo arquivo de 15 mil linhas se atropelam em
  // silêncio. Os símbolos saem do TERRITORIO.md, nunca daqui.
  const territorio = path.join(RAIZ, 'TERRITORIO.md');
  if (!fs.existsSync(territorio)) process.exit(0);

  const doc = fs.readFileSync(territorio, 'utf8');
  const zona = doc.split('## ✅ ZONA LIVRE')[0] || '';
  // os símbolos vêm entre crases na seção da zona do dono; só os que parecem identificador,
  // e com pelo menos 5 letras — `Lugar` e `Ponto` são nomes curtos demais para casar sem ruído
  // dentro de um arquivo deste tamanho, e travar por engano é pior que não travar.
  const simbolos = [...new Set((zona.match(/`([A-Za-z_][\w]*)`/g) || [])
    .map((s) => s.slice(1, -1))
    .filter((s) => s.length >= 5))];
  // os seletores de CSS e os ids do molde, que vêm com # ou . na frente
  const seletores = [...new Set((zona.match(/`([#.][\w*-]+)`/g) || []).map((s) => s.slice(1, -1)))];

  const donoDeArquivo = /^src\/(jogo\.ts|index\.html|estilo\.css)$/.test(rel);
  if (!donoDeArquivo) process.exit(0);

  // O que a chamada vai ESCREVER. Num Edit, o que importa é o texto novo e o antigo: mexer no
  // texto antigo já é apagar código dele. Num Write, é o arquivo inteiro — e aí o portão não
  // tem como julgar, então só recusa se o conteúdo NÃO trouxer os símbolos que já existiam
  // (isto é, se a reescrita os estiver perdendo).
  const pedacos = [];
  if (ferramenta === 'Edit') { pedacos.push(String(ent.old_string || ''), String(ent.new_string || '')); }
  const texto = pedacos.join('\n');

  if (ferramenta === 'Edit' && texto) {
    const achados = [...simbolos, ...seletores].filter((s) => {
      const esc = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = s[0] === '#' || s[0] === '.' ? new RegExp(esc + '\\b') : new RegExp('\\b' + esc + '\\b');
      return re.test(texto);
    });
    if (achados.length) {
      recusar(
        'RECUSADO pelo portão: esta edição toca a ZONA DO DONO (a tela ONDE FOI).\n' +
        'Símbolos encontrados: ' + achados.join(', ') + '\n' +
        'Ele trabalha nessa tela em OUTRA máquina; duas escritas no mesmo arquivo se atropelam\n' +
        'em silêncio. PARE e avise — não edite e peça perdão depois.\n' +
        'A lista sai do TERRITORIO.md; se um símbolo caiu aqui por engano, é lá que se conserta.\n'
      );
    }
  }

  if (ferramenta === 'Write') {
    const conteudo = String(ent.content || '');
    const arquivo = path.resolve(umAlvo);
    if (fs.existsSync(arquivo)) {
      const antes = fs.readFileSync(arquivo, 'utf8');
      const perdidos = simbolos.filter((s) => antes.includes(s) && !conteudo.includes(s));
      if (perdidos.length) {
        recusar(
          'RECUSADO pelo portão: esta reescrita APAGA símbolos da ZONA DO DONO.\n' +
          'Sumiriam: ' + perdidos.join(', ') + '\n' +
          'Use Edit em trechos, nunca Write no arquivo inteiro — e nunca na tela ONDE FOI.\n'
        );
      }
    }
  }

  }

    process.exit(0);
});
