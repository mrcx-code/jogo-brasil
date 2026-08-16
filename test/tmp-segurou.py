import io

p = 'src/jogo.ts'
s = io.open(p, encoding='utf-8').read()

velho = s[s.index('     id: "segurou"') - 0:]
i0 = s.index('     id: "segurou"')
# recorta do id ate o fechamento do objeto (linha "  },") — âncora no fecho conhecido
i1 = s.index('   },', s.index('"Ele volta quando o documento estiver na mesa."'))
bloco_velho = s[i0:i1]

novo = u'''     id: "segurou",
     nome: "O QUE SEGUROU",
     quando: "2020–2022",
     // ESCRITO EM 16/08 sob a REGRA DO DOCUMENTO (§2.6), o caso mais difícil dela até aqui.
     // Cada afirmação abaixo é o que um documento público afirma, com número e data DENTRO da
     // frase; a fonte de cada um está em DE ONDE VEM e no NOTES.md do mesmo commit. Nenhum
     // número de mortes ou de casos entra: painel muda, e este capítulo só afirma o que está
     // fechado em norma, decisão ou ato publicado. O sujeito é quem sustenta (§2.6): a agente
     // comunitária de saúde — cargo de lei, trabalho de rua. Nenhuma pessoa de governo é
     // nomeada, e um leitor de qualquer lado não deve achar aqui um alvo: se achar, o texto
     // falhou e volta.
     emObra: false,
     arteCap: 3,
     // A pintura continua emprestada (a peça de chão que chegou não é chão — PENDENTES §12);
     // o TEXTO não espera a tinta: capítulo escrito com pintura emprestada é honesto, o
     // contrário — tinta própria sem texto — é vitrine.
     cenas: 1, lugar: "segurou", arte: [10],
     abertura: [
       "Isto é uma rua de bairro brasileiro em 2020. Ela está mais vazia do que qualquer rua que você atravessou até aqui — e o trabalho que importa é de porta em porta.",
       "Em 6 de fevereiro de 2020, antes do primeiro caso confirmado no país, a Lei nº 13.979 já escrevia o vocabulário dos meses seguintes: isolamento, quarentena, o que cada palavra ia significar.",
       "Em 20 de março, o Decreto Legislativo nº 6 reconheceu estado de calamidade pública. Em 2 de abril, a Lei nº 13.982 criou o auxílio emergencial — renda para quem o trabalho parou.",
       "E o Supremo, na ADI 6341, confirmou que cuidar de saúde é competência da União, dos estados e também dos municípios — e é no município, no bairro, que mora quem este capítulo acompanha.",
       "Ela é agente comunitária de saúde. O cargo está na Lei nº 11.350, de 2006; o trabalho está na rua: chegar na última casa — a que nenhum papel alcança sozinho."
     ],
     aberturaImg: [null, null, null, null, null],
     fecho: [
       "Fim do trecho. Em 17 de janeiro de 2021, a Anvisa autorizou o uso emergencial das primeiras vacinas no país — e a primeira dose foi aplicada no mesmo dia.",
       "O que segurou não foi uma coisa só. Foi lei com número e data, foi repartição pública — e foi gente do próprio bairro batendo na porta do fim da rua.",
       "Os documentos deste capítulo estão em DE ONDE VEM, com número e data. História recente se lê assim: com o papel na mesa."
     ]
'''
s = s[:i0] + novo + s[i1:]

# FONTES: entra depois do Panorama da Constituinte
anc = '  { t: "Câmara dos Deputados — “Panorama da Constituinte”",'
j = s.index(anc)
fim_item = s.index('},', j) + 2
fontes = u'''
  // O QUE SEGUROU (2020–2022) — escritas em 16/08, junto com o capítulo. A regra: só norma,
  // decisão ou ato PUBLICADO; nenhum painel, nenhuma contagem que ainda muda.
  { t: "Lei nº 13.979, de 6 de fevereiro de 2020",
    q: "Dispõe sobre as medidas para enfrentamento da emergência de saúde pública; o art. 2º define isolamento e quarentena. Sancionada antes do primeiro caso confirmado no país (26 de fevereiro de 2020)." },
  { t: "Decreto Legislativo nº 6, de 20 de março de 2020",
    q: "Reconhece a ocorrência do estado de calamidade pública, com efeitos até 31 de dezembro de 2020." },
  { t: "Lei nº 13.982, de 2 de abril de 2020",
    q: "Institui o auxílio emergencial de R$ 600 mensais para trabalhadores e trabalhadoras em situação de vulnerabilidade durante a emergência." },
  { t: "STF — ADI 6341, medida cautelar referendada em 15 de abril de 2020",
    q: "Confirma a competência concorrente da União, dos estados, do Distrito Federal e dos municípios em saúde pública (CF, arts. 23, II, e 24, XII), preservando as medidas locais de enfrentamento." },
  { t: "Lei nº 11.350, de 5 de outubro de 2006",
    q: "Regulamenta as atividades de Agente Comunitário de Saúde e de Agente de Combate às Endemias — o cargo de quem este capítulo acompanha." },
  { t: "Anvisa — uso emergencial das primeiras vacinas, 17 de janeiro de 2021",
    q: "A diretoria colegiada aprovou, em reunião pública extraordinária, o uso emergencial das duas primeiras vacinas contra a covid-19 no Brasil; a primeira dose foi aplicada no mesmo dia." },'''
s = s[:fim_item] + fontes + s[fim_item:]

io.open(p, 'w', encoding='utf-8').write(s)
print('O QUE SEGUROU escrito · fontes no DE ONDE VEM')
