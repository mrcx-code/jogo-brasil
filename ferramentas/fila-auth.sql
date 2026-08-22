-- ============================================================================
-- FILA-AUTH — fechar a escrita da mesa (ticket T3, decidido pelo dono em 21/08)
--
-- HOJE: qualquer pessoa com a URL do dashboard (ou com a chave publicavel, que esta
-- no codigo-fonte da pagina, como toda chave publicavel esta) faz INSERT em
-- public.mesa_resposta. Isso e a fila que o plantao consome e ACIONA agente: escrita
-- aberta ali nao e so lixo no painel, e execucao de trabalho por estranho.
--
-- DEPOIS: SELECT continua anonimo (os paineis sao de leitura publica); INSERT passa a
-- exigir sessao do Supabase Auth. O dashboard entra por e-mail + codigo (OTP) e guarda
-- access_token/refresh_token no aparelho — entrar uma vez basta.
--
-- ESTE ARQUIVO NAO FOI APLICADO. Quem integra aplica pelo MCP do Supabase (projeto
-- 'patinhas', hdhqziqvrthxtgyraemk). O REST anonimo nao tem DDL — nao ha como um agente
-- rodar isto por conta propria, e e de proposito.
--
-- APLIQUE BLOCO A BLOCO. NAO COLE O ARQUIVO INTEIRO DE UMA VEZ.
-- O editor SQL do Supabase (e o psql, e o MCP) roda o que voce cola como UMA TRANSACAO
-- IMPLICITA: tudo junto, ou nada. E o BLOCO 2-B levanta excecao de proposito enquanto o uuid
-- nao for editado (e a trava que faz ele falhar fechado). Colado inteiro, essa excecao
-- desfaz TAMBEM o BLOCO 2 — as policies novas somem, a policy larga some, e o que fica de pe
-- e exatamente o estado de antes: escrita anonima aberta, com a sensacao de que o script rodou.
-- Um bloco por vez, lendo a saida de cada um. Sao sete passos e eles cabem numa sentada.
--
-- ----------------------------------------------------------------------------
-- COMO APLICAR, NESTA ORDEM, E TUDO NA MESMA SENTADA
-- ----------------------------------------------------------------------------
-- A ordem importa (inverter deixa o dono de fora da propria mesa) e a SENTADA tambem: os
-- passos 5 e 6 nao sao "recomendados para depois". Ate os dois estarem feitos, a fila continua
-- aberta para qualquer pessoa que crie uma conta por e-mail em 30 segundos — a porta mudou de
-- lugar e nao fechou. Auditoria da seguranca de 21/08 (A2): comentar o 2-B e adiar o passo 6
-- era, na pratica, publicar o portao desligado. Nao pare no 4.
--
--   1. BLOCO 1 (diagnostico) — rode primeiro e GUARDE a saida. E o "antes" da medicao,
--      e e o unico jeito de saber o nome real das policies que existem hoje.
--   2. O dono entra UMA VEZ no dashboard (https://matheusferreira.cc/dashboard/) com o
--      e-mail dele, ainda no mundo aberto. Isso cria a conta em auth.users.
--      -> anote o uuid: select id, email from auth.users order by created_at;
--   3. BLOCO 2 — as politicas.
--   4. BLOCO 3 — o fecho da porta de tras (Auth config, feito no painel, nao em SQL) —
--      itens 1, 2, 3 e 5 dele.
--   5. BLOCO 2-B — prende a escrita ao uuid do passo 2. E preciso EDITAR uma linha; sem
--      editar, ele levanta excecao e nao muda nada (falha fechado, de proposito).
--   6. BLOCO 3, item 4 — "Allow new users to sign up": DESLIGADO. E este passo que impede
--      um desconhecido de virar "authenticated". Ele so pode ser feito depois do passo 2,
--      e por isso esta separado do 4 — mas e da MESMA sentada.
--   7. BLOCO 4 — a PROVA. Sem ela o portao e decoracao (EQUIPE.md 2.8).
--
-- ----------------------------------------------------------------------------
-- COMO PROVAR QUE FECHOU (rode ANTES e DEPOIS — o par e a prova)
-- ----------------------------------------------------------------------------
--   ANON (tem de virar 401 ou 403 depois de aplicar; hoje devolve 201):
--     curl -i -X POST \
--       "https://hdhqziqvrthxtgyraemk.supabase.co/rest/v1/mesa_resposta" \
--       -H "apikey: sb_publishable_kR7pCuqZrPAr24Xdr0F4Nw_t1j5YUKN" \
--       -H "Authorization: Bearer sb_publishable_kR7pCuqZrPAr24Xdr0F4Nw_t1j5YUKN" \
--       -H "Content-Type: application/json" -H "Prefer: return=minimal" \
--       -d '{"tipo":"prova","chave":"anon-tem-de-falhar","valor":"x","texto":null}'
--
--   LOGADO (tem de continuar 201). O token sai do proprio aparelho do dono:
--   no dashboard, console -> JSON.parse(localStorage["mesa-brasil-sessao1"]).access_token
--     curl -i -X POST \
--       "https://hdhqziqvrthxtgyraemk.supabase.co/rest/v1/mesa_resposta" \
--       -H "apikey: sb_publishable_kR7pCuqZrPAr24Xdr0F4Nw_t1j5YUKN" \
--       -H "Authorization: Bearer <ACCESS_TOKEN_DO_DONO>" \
--       -H "Content-Type: application/json" -H "Prefer: return=minimal" \
--       -d '{"tipo":"prova","chave":"logado-tem-de-passar","valor":"x","texto":null}'
--
--   LEITURA ANON (tem de continuar 200, com ou sem as politicas):
--     curl -s -o /dev/null -w "%{http_code}\n" \
--       "https://hdhqziqvrthxtgyraemk.supabase.co/rest/v1/mesa_item?select=chave&limit=1" \
--       -H "apikey: sb_publishable_kR7pCuqZrPAr24Xdr0F4Nw_t1j5YUKN"
--
--   E limpe as duas provas depois:
--     delete from public.mesa_resposta where tipo = 'prova';
-- ============================================================================


-- ############################################################################
-- BLOCO 1 — DIAGNOSTICO (so leitura; nada muda). Guarde a saida.
-- ############################################################################

select relname, relrowsecurity, relforcerowsecurity
  from pg_class
 where oid = 'public.mesa_resposta'::regclass;

select policyname, cmd, roles, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'mesa_resposta'
 order by cmd, policyname;

-- Serve para conferir que as tabelas de LEITURA nao sao tocadas por engano.
select tablename, policyname, cmd, roles
  from pg_policies
 where schemaname = 'public' and tablename in ('mesa_item','mesa_agente')
 order by tablename, cmd;


-- ############################################################################
-- BLOCO 2 — AS POLITICAS
-- ############################################################################

alter table public.mesa_resposta enable row level security;

-- (a) DERRUBA TODA policy de escrita que existir hoje — pelo CATALOGO, nao por chute.
--     A versao anterior era uma lista de sete nomes que o painel do Supabase "costuma gerar".
--     Auditoria da seguranca de 21/08 (A1): uma policy com qualquer outro nome sobrevivia ao
--     bloco inteiro, e a escrita anonima continuava de pe com o script rodado ate o fim, sem um
--     unico erro. Adivinhar nome de policy e a mesma classe de erro que adivinhar causa.
--     Isto varre INSERT e ALL (FOR ALL cobre insert e nao aparece como 'INSERT' em lugar
--     nenhum) e imprime o que derrubou — a saida do notice e o "antes" que faltava.
do $$
declare p record; n int := 0;
begin
  for p in select policyname
             from pg_policies
            where schemaname = 'public'
              and tablename  = 'mesa_resposta'
              and cmd in ('INSERT','ALL')
              -- A POLICY DO DONO SOBREVIVE A ESTA VARREDURA (N3 da re-auditoria). Sem esta
              -- linha, rodar o BLOCO 2 uma segunda vez — por retomada, por copiar-colar, por
              -- alguem repetindo o arquivo daqui a seis meses — derrubava o aperto do 2-B e
              -- recriava a policy LARGA logo abaixo. O script AFROUXAVA a fila silenciosamente
              -- e terminava sem um unico erro. Nada aqui pode piorar a seguranca ao repetir.
              and policyname <> 'mesa_resposta escreve so o dono'
  loop
    execute format('drop policy %I on public.mesa_resposta', p.policyname);
    raise notice 'derrubei a policy de escrita: %', p.policyname;
    n := n + 1;
  end loop;
  raise notice 'policies de escrita derrubadas: %', n;
end $$;

-- (b) QUEM ESCREVE: so sessao autenticada — E SO SE O APERTO DO 2-B AINDA NAO ESTIVER DE PE.
--     Esta e a outra metade do N3. A policy larga ("qualquer authenticated escreve") e um
--     degrau para o 2-B, nao o destino: uma vez que a escrita esta presa ao uuid do dono,
--     recriar a larga e desfazer o aperto. Entao ela so nasce se a do dono nao existir.
do $$
begin
  if exists (select 1 from pg_policies
              where schemaname = 'public' and tablename = 'mesa_resposta'
                and policyname = 'mesa_resposta escreve so o dono') then
    raise notice 'o aperto do 2-B ja esta de pe — nao recriei a policy larga (seria afrouxar)';
  else
    drop policy if exists "mesa_resposta escreve logado" on public.mesa_resposta;
    create policy "mesa_resposta escreve logado"
      on public.mesa_resposta
      for insert
      to authenticated
      with check (true);
    raise notice 'policy larga criada — ela e PROVISORIA ate o BLOCO 2-B (passo 5)';
  end if;
end $$;

-- (c) QUEM LE: continua aberto — os paineis do dashboard sao de leitura publica e a
--     pagina tem de funcionar deslogada (degradacao digna). Recriado explicitamente
--     para o SELECT nao depender de uma policy que ninguem sabe de onde veio.
drop policy if exists "mesa_resposta le todo mundo" on public.mesa_resposta;
create policy "mesa_resposta le todo mundo"
  on public.mesa_resposta
  for select
  to anon, authenticated
  using (true);

-- (d) UPDATE e DELETE continuam sem policy nenhuma para anon/authenticated: sem policy,
--     RLS nega. Nao crie nenhuma aqui — a fila e append-only por desenho, e quem apaga
--     e o plantao, pelo servidor, com a service_role que NUNCA sai de la.

-- (e) O TETO DO TAMANHO (A9 da auditoria, ampliado pelo N5 da re-auditoria). O campo do
--     dashboard tem maxlength=4000 e a pagina corta em 4000 antes de mandar — mas maxlength e
--     enfeite: um POST direto com curl nao passa por nenhum dos dois. Esta linha e a que vale,
--     e ela e do banco. O numero de `texto` e o DOBRO do limite da pagina de proposito: quem
--     chegar em 8000 nao errou de dedo.
--     E ELE NAO PODE COBRIR SO O `texto`: os outros tres campos sao texto livre tambem, e
--     10 MB entravam por `tipo`, `chave` ou `valor` com o check de 8000 no lugar e verde. Os
--     tres juntos sao rotulos curtos — tipo, uma chave de item, um valor de opcao —, entao 500
--     e larguissimo para o uso real e estreito para quem quer encher o banco.
alter table public.mesa_resposta drop constraint if exists mesa_resposta_texto_cabe;
alter table public.mesa_resposta
  add constraint mesa_resposta_texto_cabe check (
        (texto is null or length(texto) <= 8000)
    and length(coalesce(tipo,'') || coalesce(chave,'') || coalesce(valor,'')) <= 500
  );


-- ############################################################################
-- BLOCO 2-B — O APERTO (PASSO 5 DA LISTA, NAO E OPCIONAL)
-- ############################################################################
-- "authenticated" nao e "o dono". Enquanto o cadastro estiver aberto no Auth, qualquer
-- pessoa cria uma conta por e-mail em 30 segundos e volta a escrever na fila — a porta
-- muda de lugar, nao fecha. Duas defesas, e as duas juntas:
--   * BLOCO 3 item 4 fecha o cadastro no painel (defesa de configuracao);
--   * este bloco prende a escrita ao uuid do dono (defesa de dados, que sobrevive a
--     alguem reabrir o cadastro daqui a seis meses sem lembrar disto aqui).
--
-- ELE ESTAVA COMENTADO E DEIXOU DE ESTAR (A2 da auditoria, 21/08). Bloco comentado e bloco
-- que ninguem roda: o arquivo ficava verde de ponta a ponta com a defesa mais importante
-- desligada. Agora ele roda — e FALHA FECHADO. Sem editar a linha do uuid, ele levanta
-- excecao e NAO muda nada; ninguem aplica este arquivo "sem querer" pela metade.
--
-- EDITE A LINHA ABAIXO: troque COLE-AQUI-O-UUID-DO-DONO pelo id de auth.users (passo 2).
--     select id, email from auth.users order by created_at;
--
-- E-mail do dono NAO fica escrito neste arquivo de proposito: o repositorio e publico e
-- endereco de e-mail em repositorio publico e endereco de e-mail em lista de spam. O uuid
-- nao diz nada sobre ninguem — por isso e ele que entra aqui.
do $$
declare
  uuid_dono constant text := 'COLE-AQUI-O-UUID-DO-DONO';
begin
  if uuid_dono !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise exception using
      message = 'BLOCO 2-B nao aplicado: edite a linha uuid_dono com o id de auth.users.',
      hint    = 'select id, email from auth.users order by created_at;  — sem isto a fila aceita QUALQUER conta autenticada.';
  end if;
  if not exists (select 1 from auth.users where id = uuid_dono::uuid) then
    raise exception using
      message = 'BLOCO 2-B nao aplicado: nao existe auth.users com esse id.',
      hint    = 'Confira o uuid: colar o id errado tranca o dono para fora da propria mesa.';
  end if;

  execute format('drop policy if exists %I on public.mesa_resposta', 'mesa_resposta escreve logado');
  execute format('drop policy if exists %I on public.mesa_resposta', 'mesa_resposta escreve so o dono');
  execute format(
    'create policy %I on public.mesa_resposta for insert to authenticated with check ( auth.uid() = %L::uuid )',
    'mesa_resposta escreve so o dono', uuid_dono);
  raise notice 'a escrita na fila passou a ser so do uuid %', uuid_dono;
end $$;


-- ############################################################################
-- BLOCO 3 — O QUE NAO E SQL (painel do Supabase, projeto 'patinhas')
-- ############################################################################
-- 1. Authentication > Providers > Email: LIGADO. Sem "Confirm email" obrigatorio para o
--    fluxo de OTP funcionar de primeira (o proprio codigo ja e a confirmacao).
--
-- 2. Authentication > Emails > Magic Link: o template PRECISA conter {{ .Token }}.
--    O padrao so tem {{ .ConfirmationURL }} — com ele, o campo de codigo do dashboard
--    fica sem o que receber e o dono so consegue entrar tocando no link. A pagina aceita
--    os DOIS caminhos (codigo colado e link tocado, que volta com #access_token no
--    endereco), mas o codigo e o que funciona quando o e-mail e lido noutro aparelho.
--    Sugestao de linha no template:  Seu codigo: {{ .Token }}
--
-- 3. Authentication > URL Configuration:
--      Site URL:       https://matheusferreira.cc
--      Redirect URLs:  https://matheusferreira.cc/dashboard/
--                      http://localhost:8199/dashboard/     (para testar local)
--                      http://localhost:8203/               (servir.js apontado ao dashboard)
--    Sem isso o link magico volta com #error=... e a pagina mostra o erro no lugar de entrar.
--
-- 4. DEPOIS DE O DONO ENTRAR UMA VEZ: Authentication > Sign In / Providers >
--    "Allow new users to sign up": DESLIGADO. Este e o passo que impede o desconhecido de
--    virar "authenticated". Ligado, o BLOCO 2 sozinho nao fecha a fila.
--
-- 5. Rate limits (Authentication > Rate Limits): o padrao de e-mails/hora ja segura o
--    envio em massa de OTP. Nao precisa mexer; anotado para nao parecer esquecimento.


-- ############################################################################
-- BLOCO 4 — A PROVA, do lado do banco (rode depois de aplicar)
-- ############################################################################
-- A PROVA ANTIGA FICAVA VERDE COM A PORTA ABERTA, e e o achado do dia da auditoria da
-- seguranca (21/08, A1). Ela perguntava por "cmd = 'INSERT' and 'anon' = any(roles)", e
-- errava nas DUAS pontas:
--   * uma policy FOR ALL aparece no catalogo com cmd = 'ALL', nunca 'INSERT' — e FOR ALL
--     cobre o insert. Passava batido.
--   * uma policy sem clausula TO nao tem 'anon' no array: tem {public}, que INCLUI o anon.
--     Passava batido tambem.
-- Ou seja: a forma mais comum de policy aberta que o painel do Supabase gera com dois cliques
-- ("Enable insert for all users", FOR ALL TO public) devolvia zero linhas e o script dizia
-- "fechou". As tres consultas abaixo sao a correcao — e a terceira olha para um lugar que
-- ninguem estava olhando.

-- (0) A RLS ESTA LIGADA? Espera-se relrowsecurity = true. E a primeira pergunta porque com a
--     RLS DESLIGADA todas as consultas abaixo ficam VERDES e nao querem dizer nada: sem RLS o
--     Postgres nem olha as policies, e a tabela esta aberta a quem tiver a chave publicavel
--     mesmo com zero policy de escrita no catalogo. Era o N4 da re-auditoria: a prova inteira
--     descrevia um portao que podia estar desligado. E a mesma consulta do BLOCO 1, de novo,
--     porque "antes" e "depois" so provam alguma coisa quando sao a MESMA pergunta.
select relname, relrowsecurity, relforcerowsecurity
  from pg_class
 where oid = 'public.mesa_resposta'::regclass;

-- (1) O RETRATO. Espera-se: UMA policy de INSERT para {authenticated} (a do 2-B, com o uuid
--     no with_check) e UMA de SELECT com anon. Mais nada.
select policyname, cmd, roles, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'mesa_resposta'
 order by cmd, policyname;

-- (2) ESCRITA ABERTA A ANONIMO — espera-se ZERO LINHAS.
--     `cmd in ('INSERT','ALL')` pega o FOR ALL; `roles && array['anon','public']::name[]`
--     pega tanto o TO anon explicito quanto o {public} de quem nao escreveu clausula TO.
--     Qualquer linha aqui significa que a escrita anonima continua de pe.
select policyname, cmd, roles, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'mesa_resposta'
   and cmd in ('INSERT','ALL')
   and roles && array['anon','public']::name[];

-- (3) APAGAR E EDITAR — espera-se ZERO LINHAS, para qualquer papel.
--     A fila e append-only por desenho: quem apaga e o plantao, pelo servidor, com a
--     service_role. Uma policy de UPDATE ou DELETE aqui (ou um FOR ALL sobrevivente) deixa
--     alguem de fora reescrever ou sumir com resposta ja dada — e isso nao aparece em
--     nenhuma das duas consultas de cima quando o papel e 'authenticated'.
select policyname, cmd, roles, qual
  from pg_policies
 where schemaname = 'public' and tablename = 'mesa_resposta'
   and cmd in ('UPDATE','DELETE','ALL');

-- (4) O TETO DO TEXTO existe? Espera-se UMA linha, com length(texto) <= 8000.
select conname, pg_get_constraintdef(oid) as regra
  from pg_constraint
 where conrelid = 'public.mesa_resposta'::regclass and contype = 'c';

-- E entao os dois curl la de cima: anon -> 401/403, dono -> 201. O par e a prova;
-- so o 201 do dono nao prova nada.
