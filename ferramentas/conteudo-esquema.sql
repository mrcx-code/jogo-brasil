-- ============================================================================================
-- AVENIDA A, FASE 0 — O ESPELHO DE LEITURA DO GLOSSÁRIO
-- Esquema das tabelas de conteúdo no Supabase. 2026-08-21.
--
-- O QUE ISTO É, E O QUE NÃO É. A fase 0 tira uma CÓPIA DE LEITURA do glossário do jogo e a põe
-- num banco, para que a revisão (aba REVISÃO do dashboard, fase 2) e o alerta de validade
-- (`vence_em`, ligado já por decisão do dono em 21/08) tenham onde morar. A fonte continua
-- sendo o jogo: `src/jogo.ts`. Nada aqui é lido pelo navegador de quem joga.
--
-- REGRA SUPREMA DA FASE 0: o jogo não muda um byte e a CSP dele é INTOCADA. `connect-src 'self'
-- https://us.i.posthog.com` continua exatamente como está — o banco alimenta FERRAMENTA (mesa,
-- dashboard, geradores), nunca o `index.html`. Quem quiser mudar isso está saindo da fase 0.
--
-- O PORTÃO QUE TORNA A CÓPIA SEGURA é `ferramentas/conteudo-espelho.js`: ele extrai o glossário
-- do jogo, lê o export do banco e compara BYTE A BYTE, reprovando com exit 1 e nomeando o
-- primeiro verbete divergente. Duas cópias do mesmo texto sem portão é o modo de falha mais
-- caro que este repositório conhece — duas verdades que divergem em silêncio.
--
-- COMO APLICAR: via MCP do Supabase, por quem integra. O script que escreveu isto não tem MCP,
-- e é de propósito: ferramenta de agente não aplica DDL em produção.
-- A carga inicial vem depois, em `ferramentas/conteudo-carga.sql` (gerado por
-- `node ferramentas/conteudo-carga.js`).
--
-- IDEMPOTENTE por construção (`if not exists` / `drop policy if exists`): aplicar duas vezes
-- não quebra e não duplica.
-- ============================================================================================

-- gen_random_uuid() vem daqui. No Supabase já vem instalada; o `if not exists` é para o caso
-- de alguém aplicar isto num Postgres cru.
create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------------------------
-- AS COLUNAS COMUNS ÀS TRÊS TABELAS, e por que cada uma existe.
--
--   id            uuid  — chave primária técnica. NÃO é a identidade do conteúdo; a identidade
--                         é `chave` (o próprio termo), e ela se repete entre revisões.
--   rev           int   — 1 na carga inicial; cada revisão aprovada nasce com rev+1.
--   vigente_de /  — versionamento por INTERVALO, e não por UPDATE no lugar. Revisar é fechar a
--   vigente_ate     linha velha (`vigente_ate = now()`) e inserir a nova. Assim o texto que já
--                   foi publicado nunca some, que é o mínimo para conteúdo histórico com fonte.
--                   VIGENTE = `vigente_ate is null`.
--   estado        — rascunho → revisto → aprovado → publicado. A aba REVISÃO (fase 2) move.
--   vence_em      — a data em que este texto precisa ser reconferido. É o requisito de
--                   "evolução ano a ano" do CLAUDE.md §8 virando coluna: O ACEIRO carrega
--                   número do PRODES que muda todo outubro, e hoje ninguém é avisado.
--   vence_regra   — em PALAVRAS, por que vence e onde se confere ("PRODES, consolidado em
--                   novembro"). Data sem regra vira alarme que ninguém sabe atender.
--   tag_s2        — este texto toca o §2 do CLAUDE.md (representação: povos originários,
--                   escravidão, história recente). NUNCA é adivinhado por script — quem marca
--                   é o historiador, e a carga inicial deixa tudo em false de propósito.
--   tem_numero    — a definição afirma um número. Sinal MECÂNICO (tem dígito), para triagem de
--                   o que envelhece; não é juízo sobre o conteúdo.
--   nota          — texto livre de quem trabalhou a linha.
--   revisado_por / fonte_revisao — a licença do §2 do CLAUDE.md exige que "cada corte diga de
--                   onde veio": quem revisou e com que fonte. Sem isso o corte é opinião, e
--                   opinião não corta texto histórico. Por isso são COLUNAS, não comentário.
--   aprovado_por / aprovado_em — quem deixou publicar, e quando.
-- --------------------------------------------------------------------------------------------

-- ————— 1. OS GRUPOS —————
-- `chave` é o próprio nome do grupo (`g`). Nenhum identificador inventado: inventar chave é
-- inventar dado, e os 17 nomes foram conferidos únicos antes disto ser escrito.
create table if not exists public.conteudo_glossario_grupo (
  id            uuid primary key default gen_random_uuid(),
  chave         text not null,
  g             text not null,
  curto         text not null default '',
  sub           text not null default '',
  ordem         int  not null,

  rev           int  not null default 1 check (rev >= 1),
  vigente_de    timestamptz not null default now(),
  vigente_ate   timestamptz null,
  estado        text not null default 'rascunho'
                check (estado in ('rascunho', 'revisto', 'aprovado', 'publicado')),
  vence_em      date null,
  vence_regra   text null,
  tag_s2        bool not null default false,
  tem_numero    bool not null default false,
  nota          text null,
  revisado_por  text null,
  fonte_revisao text null,
  aprovado_por  text null,
  aprovado_em   timestamptz null
);

-- ————— 2. OS VERBETES —————
-- `chave` = o TERMO (`t`), letra por letra e acento por acento — é assim que o jogo casa os
-- relacionados, e o comentário do `GLOSSARIO_REL` avisa: "INVASAO" ou "Invasão" viram link
-- morto e silencioso. `grupo_chave` aponta para o `chave` do grupo.
--
-- POR QUE NÃO HÁ FOREIGN KEY para o grupo, e é decisão, não esquecimento: as linhas são
-- VERSIONADAS, então `chave` não é único na tabela — só é único ENTRE AS VIGENTES, e um índice
-- único PARCIAL não pode sustentar uma FK no Postgres. Quem cobra a integridade referencial é
-- o portão do espelho (`conteudo-espelho.js` recusa par ou grupo órfão), que a cobra dos DOIS
-- lados de uma vez em vez de só de um.
create table if not exists public.conteudo_glossario (
  id            uuid primary key default gen_random_uuid(),
  chave         text not null,
  t             text not null,
  o             text not null default '',
  d             text not null default '',
  f             text not null default '',
  dv            bool not null default false,
  grupo_chave   text not null,
  ordem         int  not null,

  rev           int  not null default 1 check (rev >= 1),
  vigente_de    timestamptz not null default now(),
  vigente_ate   timestamptz null,
  estado        text not null default 'rascunho'
                check (estado in ('rascunho', 'revisto', 'aprovado', 'publicado')),
  vence_em      date null,
  vence_regra   text null,
  tag_s2        bool not null default false,
  tem_numero    bool not null default false,
  nota          text null,
  revisado_por  text null,
  fonte_revisao text null,
  aprovado_por  text null,
  aprovado_em   timestamptz null
);

-- ————— 3. OS RELACIONADOS —————
-- A ordem dentro de cada termo é CURADA (o antônimo de método vem primeiro, e é isso que faz o
-- glossário ensinar em vez de listar). Por isso `ordem` é dado, não enfeite — e o espelho
-- reprova se ela mudar.
create table if not exists public.conteudo_glossario_rel (
  id            uuid primary key default gen_random_uuid(),
  termo         text not null,
  relacionado   text not null,
  ordem         int  not null,

  rev           int  not null default 1 check (rev >= 1),
  vigente_de    timestamptz not null default now(),
  vigente_ate   timestamptz null,
  estado        text not null default 'rascunho'
                check (estado in ('rascunho', 'revisto', 'aprovado', 'publicado')),
  vence_em      date null,
  vence_regra   text null,
  tag_s2        bool not null default false,
  tem_numero    bool not null default false,
  nota          text null,
  revisado_por  text null,
  fonte_revisao text null,
  aprovado_por  text null,
  aprovado_em   timestamptz null
);

-- --------------------------------------------------------------------------------------------
-- ÍNDICES
-- O único parcial que importa: UMA linha vigente por chave. Sem ele, duas revisões abertas ao
-- mesmo tempo dariam dois textos "atuais" para o mesmo verbete e o espelho acusaria contagem
-- errada sem dizer por quê.
-- --------------------------------------------------------------------------------------------
create unique index if not exists conteudo_glossario_grupo_vigente
  on public.conteudo_glossario_grupo (chave) where vigente_ate is null;
create unique index if not exists conteudo_glossario_vigente
  on public.conteudo_glossario (chave) where vigente_ate is null;
create unique index if not exists conteudo_glossario_rel_vigente
  on public.conteudo_glossario_rel (termo, relacionado) where vigente_ate is null;

create index if not exists conteudo_glossario_grupo_ordem
  on public.conteudo_glossario_grupo (ordem) where vigente_ate is null;
create index if not exists conteudo_glossario_por_grupo
  on public.conteudo_glossario (grupo_chave, ordem) where vigente_ate is null;
create index if not exists conteudo_glossario_rel_termo
  on public.conteudo_glossario_rel (termo, ordem) where vigente_ate is null;

-- O índice do ALERTA. `vence_em` foi ligado pelo dono em 21/08 ("liga o alerta já"), e a
-- consulta que o alerta faz é exatamente esta: o que vigente vence até tal dia.
create index if not exists conteudo_glossario_vence
  on public.conteudo_glossario (vence_em) where vence_em is not null and vigente_ate is null;
create index if not exists conteudo_glossario_grupo_vence
  on public.conteudo_glossario_grupo (vence_em) where vence_em is not null and vigente_ate is null;

-- A fila da REVISÃO (fase 2) lê por estado.
create index if not exists conteudo_glossario_estado
  on public.conteudo_glossario (estado) where vigente_ate is null;

-- --------------------------------------------------------------------------------------------
-- PERMISSÃO — duas camadas, e as duas de propósito.
--
-- CAMADA 1, o GRANT: anon e authenticated ganham SELECT e MAIS NADA. No Supabase os papéis
-- recebem privilégio amplo em `public` por default privileges, então o `revoke` explícito é o
-- que garante que INSERT/UPDATE/DELETE nem chegam a ser avaliados. DELETE NÃO EXISTE para
-- ninguém a não ser `service_role` — conteúdo histórico com fonte não se apaga, se fecha
-- (`vigente_ate`). Um agente ou uma tela com bug não têm como perder o texto.
--
-- CAMADA 2, o RLS: mesmo com SELECT concedido, anon só enxerga o PUBLICADO VIGENTE. Rascunho
-- em revisão não é público — pode conter texto sobre §2 ainda não lido pelo historiador, e
-- publicar por acidente o que ninguém aprovou é precisamente o que a aba REVISÃO existe para
-- impedir.
--
-- A ESCRITA É DO SERVIDOR: `service_role` ignora RLS por construção e é ela que a carga e a
-- aprovação usam, do lado de lá. A chave que roda em navegador continua sendo só publicável
-- (CLAUDE.md §8) — aqui, a `anon`, que depois destes comandos só sabe ler o publicado.
-- --------------------------------------------------------------------------------------------
revoke all on public.conteudo_glossario_grupo from anon, authenticated;
revoke all on public.conteudo_glossario       from anon, authenticated;
revoke all on public.conteudo_glossario_rel   from anon, authenticated;

grant select on public.conteudo_glossario_grupo to anon, authenticated;
grant select on public.conteudo_glossario       to anon, authenticated;
grant select on public.conteudo_glossario_rel   to anon, authenticated;

alter table public.conteudo_glossario_grupo enable row level security;
alter table public.conteudo_glossario       enable row level security;
alter table public.conteudo_glossario_rel   enable row level security;

-- Força o RLS também para o dono da tabela: sem isto, quem for owner passa por cima.
alter table public.conteudo_glossario_grupo force row level security;
alter table public.conteudo_glossario       force row level security;
alter table public.conteudo_glossario_rel   force row level security;

drop policy if exists conteudo_glossario_grupo_anon_le on public.conteudo_glossario_grupo;
drop policy if exists conteudo_glossario_anon_le       on public.conteudo_glossario;
drop policy if exists conteudo_glossario_rel_anon_le   on public.conteudo_glossario_rel;

create policy conteudo_glossario_grupo_anon_le on public.conteudo_glossario_grupo
  for select to anon using (estado = 'publicado' and vigente_ate is null);
create policy conteudo_glossario_anon_le on public.conteudo_glossario
  for select to anon using (estado = 'publicado' and vigente_ate is null);
create policy conteudo_glossario_rel_anon_le on public.conteudo_glossario_rel
  for select to anon using (estado = 'publicado' and vigente_ate is null);

-- `authenticated` (hoje: só o dono, pela decisão de 21/08 que fechou a fila do dashboard com
-- Supabase Auth) enxerga TUDO — inclusive rascunho, que é o que a aba REVISÃO precisa mostrar.
-- Continua sem poder escrever: aprovar é ação de servidor, e quem decide se authenticated passa
-- a ter UPDATE é a fase 2, com a tela na mão. Abrir escrita antes de haver tela é abrir por
-- conveniência, que é como CSP relaxada começa.
drop policy if exists conteudo_glossario_grupo_auth_le on public.conteudo_glossario_grupo;
drop policy if exists conteudo_glossario_auth_le       on public.conteudo_glossario;
drop policy if exists conteudo_glossario_rel_auth_le   on public.conteudo_glossario_rel;

create policy conteudo_glossario_grupo_auth_le on public.conteudo_glossario_grupo
  for select to authenticated using (true);
create policy conteudo_glossario_auth_le on public.conteudo_glossario
  for select to authenticated using (true);
create policy conteudo_glossario_rel_auth_le on public.conteudo_glossario_rel
  for select to authenticated using (true);

-- NENHUMA policy de insert, update ou delete é criada aqui, para nenhum dos dois papéis. Com
-- RLS ligado, a ausência de policy JÁ é a proibição; o `revoke` acima é a segunda tranca.

-- --------------------------------------------------------------------------------------------
-- CONFERÊNCIA DEPOIS DE APLICAR — cole no MCP e leia o resultado, não o "ok".
--
--   select tablename, rowsecurity, forcerowsecurity from pg_tables
--    where schemaname='public' and tablename like 'conteudo_glossario%';
--   -- esperado: 3 linhas, rowsecurity=t, forcerowsecurity=t
--
--   select tablename, policyname, roles, cmd from pg_policies
--    where schemaname='public' and tablename like 'conteudo_glossario%' order by tablename;
--   -- esperado: 6 linhas, TODAS cmd=SELECT. Qualquer INSERT/UPDATE/DELETE aqui é defeito.
--
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_name='conteudo_glossario' and grantee in ('anon','authenticated');
--   -- esperado: só SELECT para os dois. DELETE nesta lista é defeito.
-- --------------------------------------------------------------------------------------------
