-- ============================================================================
-- mesa_agente_atualizar() -- item painel-update-silencioso, fechado em 04/09
--
-- O ACHADO (medido por nuvem-20260904T1623, PLANTAO.md 5.1): `mesa_agente` tem DUAS
-- colunas parecidas -- `nome` (chave primaria, o arquivo em .claude/agents/, ex.
-- "dev-jogo") e `papel` (o rotulo humano que aparece no painel, ex. "motor & esteira
-- do jogo"). Quem despacha um agente ve `papel` no proprio `.claude/agents/<nome>.md`
-- (o campo `description`) e digita ele por engano na hora de escrever no painel:
--
--   update mesa_agente set status=... where papel='dev-jogo' returning nome  -->  []  (0 linhas, SEM ERRO)
--   update mesa_agente set status=... where nome='dev-jogo'  returning nome  -->  1 linha
--
-- UPDATE que casa 0 linhas e SUCESSO em SQL puro -- nao ha erro para o chamador pegar.
-- Resultado: a rodada acha que reportou, o dono abre o painel no celular e ve
-- "congelado", e as duas causas (ninguem trabalhou / a escrita falhou em silencio)
-- parecem identicas de fora -- a exata doenca que PLANTAO.md 5.1 ja nomeava antes
-- deste item existir.
--
-- O CONSERTO: uma funcao e so ela escreve nesta tabela dai em diante. Ela SEMPRE
-- confere quantas linhas casaram (`if not found`) e RAISE EXCEPTION se for zero --
-- transforma o silencio em erro que a chamada de execute_sql devolve na cara.
--
-- APLICADO em 04/09 via MCP do Supabase, projeto 'brasil' (frrmiompmxjbpoxegyeb),
-- migration `mesa_agente_atualizar_guardada`. Este arquivo e so o registro -- reaplicar
-- e seguro (CREATE OR REPLACE), mas nao e preciso: ja esta no banco.
--
-- PROVADO por injecao (mordida real, nao suposta):
--   select mesa_agente_atualizar('dev-jogo-inexistente', 'trabalhando', 'x');
--     -> ERRO P0002, a mensagem cita nome/papel e a causa. Nao muda linha nenhuma.
--   select mesa_agente_atualizar('Claude', 'trabalhando', 'texto real da rodada');
--     -> 1 linha devolvida (a linha inteira, RETURNS public.mesa_agente), ativo_em atualizado.
--
-- COMO USAR DAQUI PRA FRENTE (despacho e pouso, PLANTAO.md 5.1):
--   select mesa_agente_atualizar(
--     'dev-jogo',                          -- p_nome: SEMPRE o nome do arquivo em .claude/agents/, ou 'Claude'
--     'trabalhando',                       -- p_status: opcional, null preserva o que ja estava
--     'o que esta rodada descobriu, nao "concluido"'  -- p_atividade: opcional
--     -- p_modelo, p_esforco, p_tokens_rodada, p_custo_rodada_usd, p_ultima_duracao_ms:
--     -- todos opcionais, so para quem ja mede essas colunas (ver PLANTAO.md ~L226).
--   );
-- NUNCA mais um `update mesa_agente set ... where papel=...` cru -- se a coluna estiver
-- errada, esta funcao acusa na hora, em vez de voltar [] sem dizer nada.
-- ============================================================================

create or replace function public.mesa_agente_atualizar(
  p_nome text,
  p_status text default null,
  p_atividade text default null,
  p_modelo text default null,
  p_esforco text default null,
  p_tokens_rodada integer default null,
  p_custo_rodada_usd numeric default null,
  p_ultima_duracao_ms integer default null
)
returns public.mesa_agente
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.mesa_agente;
begin
  update public.mesa_agente
     set status             = coalesce(p_status, status),
         atividade          = coalesce(p_atividade, atividade),
         modelo             = coalesce(p_modelo, modelo),
         esforco            = coalesce(p_esforco, esforco),
         tokens_rodada      = coalesce(p_tokens_rodada, tokens_rodada),
         tokens_acum        = tokens_acum + coalesce(p_tokens_rodada, 0),
         custo_rodada_usd   = coalesce(p_custo_rodada_usd, custo_rodada_usd),
         custo_acum_usd     = custo_acum_usd + coalesce(p_custo_rodada_usd, 0),
         rodadas            = rodadas + case when p_status is not null then 1 else 0 end,
         ultima_duracao_ms  = coalesce(p_ultima_duracao_ms, ultima_duracao_ms),
         ativo_em           = now()
   where nome = p_nome
  returning * into r;

  if not found then
    raise exception 'mesa_agente_atualizar: nome "%" nao existe na mesa_agente. Use o NOME do arquivo em .claude/agents/ (ou "Claude" para a sessao principal) -- nunca o `papel` (rotulo humano do painel). UPDATE ... WHERE papel=... casa 0 linhas e NAO acusa erro; esta funcao existe para curar exatamente isso.', p_nome
      using errcode = 'P0002';
  end if;

  return r;
end;
$$;

comment on function public.mesa_agente_atualizar is
  'Unica forma suportada de escrever status/atividade em mesa_agente (item painel-update-silencioso, 04/09). Recusa (RAISE EXCEPTION) quando p_nome nao casa nenhuma linha, em vez do UPDATE silencioso de 0 linhas que a coluna errada (papel) produzia.';
