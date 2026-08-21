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
-- ----------------------------------------------------------------------------
-- COMO APLICAR, NESTA ORDEM (a ordem importa: inverter deixa o dono de fora da propria mesa)
-- ----------------------------------------------------------------------------
--   1. BLOCO 1 (diagnostico) — rode primeiro e GUARDE a saida. E o "antes" da medicao,
--      e e o unico jeito de saber o nome real das policies que existem hoje.
--   2. O dono entra UMA VEZ no dashboard (https://matheusferreira.cc/dashboard/) com o
--      e-mail dele, ainda no mundo aberto. Isso cria a conta em auth.users.
--      -> anote o uuid: select id, email from auth.users order by created_at;
--   3. BLOCO 2 — as politicas.
--   4. BLOCO 3 — o fecho da porta de tras (Auth config, feito no painel, nao em SQL).
--   5. BLOCO 4 — a PROVA. Sem ela o portao e decoracao (EQUIPE.md 2.8).
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

-- (a) DERRUBA a escrita anonima. Os nomes abaixo cobrem os que o painel do Supabase
--     gera por padrao; o BLOCO 1 diz o nome REAL — se aparecer outro ali, acrescente
--     uma linha igual a estas com aquele nome. "if exists" faz o bloco ser idempotente.
drop policy if exists "mesa_resposta anon insert"            on public.mesa_resposta;
drop policy if exists "Enable insert for anon users"          on public.mesa_resposta;
drop policy if exists "Enable insert for all users"           on public.mesa_resposta;
drop policy if exists "Enable insert access for all users"    on public.mesa_resposta;
drop policy if exists "mesa_resposta_insert_anon"             on public.mesa_resposta;
drop policy if exists "insert anon"                           on public.mesa_resposta;
drop policy if exists "anon pode inserir"                     on public.mesa_resposta;

-- (b) QUEM ESCREVE: so sessao autenticada.
drop policy if exists "mesa_resposta escreve logado" on public.mesa_resposta;
create policy "mesa_resposta escreve logado"
  on public.mesa_resposta
  for insert
  to authenticated
  with check (true);

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


-- ############################################################################
-- BLOCO 2-B — O APERTO (RECOMENDADO, e o motivo esta escrito)
-- ############################################################################
-- "authenticated" nao e "o dono". Enquanto o cadastro estiver aberto no Auth, qualquer
-- pessoa cria uma conta por e-mail em 30 segundos e volta a escrever na fila — a porta
-- muda de lugar, nao fecha. Duas defesas, e as duas juntas:
--   * BLOCO 3 fecha o cadastro no painel (defesa de configuracao);
--   * o bloco abaixo prende a escrita ao uuid do dono (defesa de dados, que sobrevive a
--     alguem reabrir o cadastro sem lembrar disto aqui).
-- Troque <UUID-DO-DONO> pelo id de auth.users (passo 2 do "como aplicar") e rode.
--
-- drop policy if exists "mesa_resposta escreve logado" on public.mesa_resposta;
-- create policy "mesa_resposta escreve so o dono"
--   on public.mesa_resposta
--   for insert
--   to authenticated
--   with check ( auth.uid() = '<UUID-DO-DONO>'::uuid );
--
-- E-mail do dono NAO fica escrito neste arquivo de proposito: o repositorio e publico e
-- endereco de e-mail em repositorio publico e endereco de e-mail em lista de spam. O uuid
-- nao diz nada sobre ninguem.


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
-- Espera-se: uma policy de INSERT, para {authenticated}; uma de SELECT com anon; e
-- nenhuma outra de INSERT sobrando.
select policyname, cmd, roles, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'mesa_resposta'
 order by cmd, policyname;

-- Espera-se: zero linhas. Se aparecer alguma, a escrita anonima ainda esta de pe.
select policyname
  from pg_policies
 where schemaname = 'public' and tablename = 'mesa_resposta'
   and cmd = 'INSERT' and 'anon' = any(roles);

-- E entao os dois curl la de cima: anon -> 401/403, dono -> 201. O par e a prova;
-- so o 201 do dono nao prova nada.
