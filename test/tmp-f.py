import io
p = 'src/jogo.ts'
s = io.open(p, encoding='utf-8').read()

a = '''    const l = MAPA_PONTOS[mapaSel];
    linha(ficha, l.onde + " · " + l.uf, "mpNome");
    // um lugar pode carregar mais de um capítulo — o Rio carrega dois, e é isso que o mapa
    // tem a dizer sobre ele: a mesma cidade aparece em dois séculos diferentes da história.
    for (let k = 0; k < l.eps.length; k++) {
      const i = EPOCAS.findIndex(function (e) { return e.id === l.eps[k]; });
      if (i < 0) continue;
      if (mapaVisitado(l.eps[k])) {
        linha(ficha, EPOCAS[i].nome + "  ·  " + (EPOCAS[i].quando || ""), "mpOnde");
      } else {
        linha(ficha, "ainda não aberto — jogue até aqui", "mpQuando");
      }
    }'''
b = '''    const l = MAPA_PONTOS[mapaSel];
    // O TÍTULO É A CIDADE, não o endereço do primeiro capítulo. Quando um ponto carrega mais de
    // um, herdar o `onde` do primeiro rotula o Rio inteiro de "Cais do Valongo" — que é o
    // endereço de um dos dois e a cidade de nenhum.
    const muitos = l.eps.length > 1;
    linha(ficha, (muitos ? l.cidade : l.onde) + " · " + l.uf, "mpNome");
    // Um lugar pode carregar mais de um capítulo — o Rio carrega dois, e é isso que o mapa tem
    // a dizer sobre ele: a mesma cidade aparece em dois séculos diferentes da história.
    for (let k = 0; k < l.eps.length; k++) {
      const i = EPOCAS.findIndex(function (e) { return e.id === l.eps[k]; });
      if (i < 0) continue;
      const meu = MAPA_LUGARES.find(function (x) { return x.ep === l.eps[k]; });
      if (mapaVisitado(l.eps[k])) {
        linha(ficha, EPOCAS[i].nome + "  ·  " + (EPOCAS[i].quando || ""), "mpOnde");
        if (muitos && meu) linha(ficha, meu.onde, "mpQuando");
      } else {
        linha(ficha, "ainda não aberto — jogue até aqui", "mpQuando");
      }
    }'''
assert a in s, 'ficha'
s = s.replace(a, b, 1)

a2 = '''type Ponto = { uf: string; onde: string; lat: number; lon: number; eps: string[] };'''
b2 = '''type Ponto = { uf: string; onde: string; cidade: string; lat: number; lon: number; eps: string[] };'''
assert a2 in s, 'tipo'
s = s.replace(a2, b2, 1)

a3 = '''    else fora.push({ uf: l.uf, onde: l.onde, lat: l.lat, lon: l.lon, eps: [l.ep] });'''
b3 = '''    else fora.push({ uf: l.uf, onde: l.onde, cidade: l.cidade, lat: l.lat, lon: l.lon, eps: [l.ep] });'''
assert a3 in s, 'push'
s = s.replace(a3, b3, 1)

a4 = '''type Lugar = { ep: string; uf: string; onde: string; lat: number; lon: number };'''
b4 = '''type Lugar = { ep: string; uf: string; cidade: string; onde: string; lat: number; lon: number };'''
assert a4 in s, 'tipo lugar'
s = s.replace(a4, b4, 1)

pares = [
 ('{ ep: "palmares",      uf: "AL", onde: "Serra da Barriga, União dos Palmares", lat: -9.16,   lon: -36.02 }',
  '{ ep: "palmares",      uf: "AL", cidade: "União dos Palmares", onde: "Serra da Barriga",          lat: -9.16,   lon: -36.02 }'),
 ('{ ep: "cais",          uf: "RJ", onde: "Cais do Valongo, Rio de Janeiro",         lat: -22.897, lon: -43.187 }',
  '{ ep: "cais",          uf: "RJ", cidade: "Rio de Janeiro",     onde: "Cais do Valongo",           lat: -22.897, lon: -43.187 }'),
 ('{ ep: "salvador",      uf: "BA", onde: "Salvador",                                lat: -12.97,  lon: -38.51 }',
  '{ ep: "salvador",      uf: "BA", cidade: "Salvador",           onde: "Salvador",                  lat: -12.97,  lon: -38.51 }'),
 ('{ ep: "jabaquara",     uf: "SP", onde: "Morro do Jabaquara, Santos",              lat: -23.95,  lon: -46.33 }',
  '{ ep: "jabaquara",     uf: "SP", cidade: "Santos",             onde: "Morro do Jabaquara",        lat: -23.95,  lon: -46.33 }'),
 ('{ ep: "pequenaafrica", uf: "RJ", onde: "Saúde, Gamboa e Praça Onze, Rio",       lat: -22.905, lon: -43.196 }',
  '{ ep: "pequenaafrica", uf: "RJ", cidade: "Rio de Janeiro",     onde: "Saúde, Gamboa e Praça Onze", lat: -22.905, lon: -43.196 }'),
 ('{ ep: "praca",         uf: "DF", onde: "Brasília",                                lat: -15.79,  lon: -47.88 }',
  '{ ep: "praca",         uf: "DF", cidade: "Brasília",           onde: "Brasília",                  lat: -15.79,  lon: -47.88 }'),
]
for x, y in pares:
    assert x in s, x[:40]
    s = s.replace(x, y, 1)

io.open(p, 'w', encoding='utf-8').write(s)
print('cidade separada do endereco')
