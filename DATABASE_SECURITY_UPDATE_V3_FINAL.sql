-- ============================================================================
-- SCRIPT DE ATUALIZAÇÃO DE SEGURANÇA - MULTI-TENANCY (VERSÃO FINAL V3)
-- EnvioDocs - Sistema de Gestão Documental
-- ============================================================================
-- Esta versão NÃO toca em Comunicados (já têm filtro próprio)
-- Foca apenas em: comprovantes, contratosSocial, AmContabilidade
-- ============================================================================

-- ============================================================================
-- PARTE 1: ADICIONAR COLUNAS CNPJ_CONTABILIDADE
-- ============================================================================

-- Verificar e adicionar coluna em 'comprovantes'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comprovantes'
        AND LOWER(column_name) = 'cnpj_contabilidade'
    ) THEN
        ALTER TABLE comprovantes
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);
        RAISE NOTICE '✅ Coluna CNPJ_CONTABILIDADE adicionada à tabela comprovantes';
    ELSE
        RAISE NOTICE '⏭️  Coluna CNPJ_CONTABILIDADE já existe na tabela comprovantes';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Erro ao adicionar coluna em comprovantes: %', SQLERRM;
END $$;

-- Verificar e adicionar coluna em 'contratosSocial'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contratosSocial'
        AND LOWER(column_name) = 'cnpj_contabilidade'
    ) THEN
        ALTER TABLE "contratosSocial"
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);
        RAISE NOTICE '✅ Coluna CNPJ_CONTABILIDADE adicionada à tabela contratosSocial';
    ELSE
        RAISE NOTICE '⏭️  Coluna CNPJ_CONTABILIDADE já existe na tabela contratosSocial';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Erro ao adicionar coluna em contratosSocial: %', SQLERRM;
END $$;

-- Verificar e adicionar coluna em 'AmContabilidade'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'AmContabilidade'
        AND LOWER(column_name) = 'cnpj_contabilidade'
    ) THEN
        ALTER TABLE "AmContabilidade"
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);
        RAISE NOTICE '✅ Coluna CNPJ_CONTABILIDADE adicionada à tabela AmContabilidade';
    ELSE
        RAISE NOTICE '⏭️  Coluna CNPJ_CONTABILIDADE já existe na tabela AmContabilidade';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Erro ao adicionar coluna em AmContabilidade: %', SQLERRM;
END $$;

-- ============================================================================
-- PARTE 2: POPULAR COLUNAS CNPJ_CONTABILIDADE COM DADOS EXISTENTES
-- ============================================================================

-- Popular comprovantes com CNPJ_CONTABILIDADE baseado no CNPJ do cliente
DO $$
DECLARE
    registros_atualizados INTEGER;
BEGIN
    UPDATE comprovantes comp
    SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
    FROM "Clientes" cli
    WHERE comp.CNPJ = cli.CNPJ
    AND comp.CNPJ_CONTABILIDADE IS NULL
    AND cli.CNPJ_CONTABILIDADE IS NOT NULL;

    GET DIAGNOSTICS registros_atualizados = ROW_COUNT;
    RAISE NOTICE '✅ % registros atualizados em comprovantes', registros_atualizados;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Erro ao popular comprovantes: %', SQLERRM;
END $$;

-- Popular contratosSocial com CNPJ_CONTABILIDADE baseado no CNPJ do cliente
DO $$
DECLARE
    registros_atualizados INTEGER;
BEGIN
    UPDATE "contratosSocial" cont
    SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
    FROM "Clientes" cli
    WHERE cont.CNPJ = cli.CNPJ
    AND cont.CNPJ_CONTABILIDADE IS NULL
    AND cli.CNPJ_CONTABILIDADE IS NOT NULL;

    GET DIAGNOSTICS registros_atualizados = ROW_COUNT;
    RAISE NOTICE '✅ % registros atualizados em contratosSocial', registros_atualizados;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Erro ao popular contratosSocial: %', SQLERRM;
END $$;

-- Popular AmContabilidade usando o CNPJ_CURTO para encontrar o cliente
DO $$
DECLARE
    registros_atualizados INTEGER;
BEGIN
    UPDATE "AmContabilidade" am
    SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
    FROM "Clientes" cli
    WHERE am.CNPJ_CURTO = cli.CNPJ_curto
    AND am.CNPJ_CONTABILIDADE IS NULL
    AND cli.CNPJ_CONTABILIDADE IS NOT NULL;

    GET DIAGNOSTICS registros_atualizados = ROW_COUNT;
    RAISE NOTICE '✅ % registros atualizados em AmContabilidade', registros_atualizados;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Erro ao popular AmContabilidade: %', SQLERRM;
END $$;

-- ============================================================================
-- PARTE 3: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice em Clientes.CNPJ_CONTABILIDADE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_clientes_cnpj_contabilidade'
    ) THEN
        CREATE INDEX idx_clientes_cnpj_contabilidade
        ON "Clientes"(CNPJ_CONTABILIDADE)
        WHERE CNPJ_CONTABILIDADE IS NOT NULL;
        RAISE NOTICE '✅ Índice idx_clientes_cnpj_contabilidade criado';
    ELSE
        RAISE NOTICE '⏭️  Índice idx_clientes_cnpj_contabilidade já existe';
    END IF;
END $$;

-- Índice em Clientes.ADM
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_clientes_adm'
    ) THEN
        CREATE INDEX idx_clientes_adm
        ON "Clientes"(ADM)
        WHERE ADM = 'ADM';
        RAISE NOTICE '✅ Índice idx_clientes_adm criado';
    ELSE
        RAISE NOTICE '⏭️  Índice idx_clientes_adm já existe';
    END IF;
END $$;

-- Índice em comprovantes.CNPJ_CONTABILIDADE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_comprovantes_cnpj_contabilidade'
    ) THEN
        CREATE INDEX idx_comprovantes_cnpj_contabilidade
        ON comprovantes(CNPJ_CONTABILIDADE)
        WHERE CNPJ_CONTABILIDADE IS NOT NULL;
        RAISE NOTICE '✅ Índice idx_comprovantes_cnpj_contabilidade criado';
    ELSE
        RAISE NOTICE '⏭️  Índice idx_comprovantes_cnpj_contabilidade já existe';
    END IF;
END $$;

-- Índice em contratosSocial.CNPJ_CONTABILIDADE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_contratos_cnpj_contabilidade'
    ) THEN
        CREATE INDEX idx_contratos_cnpj_contabilidade
        ON "contratosSocial"(CNPJ_CONTABILIDADE)
        WHERE CNPJ_CONTABILIDADE IS NOT NULL;
        RAISE NOTICE '✅ Índice idx_contratos_cnpj_contabilidade criado';
    ELSE
        RAISE NOTICE '⏭️  Índice idx_contratos_cnpj_contabilidade já existe';
    END IF;
END $$;

-- Índice em AmContabilidade.CNPJ_CONTABILIDADE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_amcontabilidade_cnpj_contabilidade'
    ) THEN
        CREATE INDEX idx_amcontabilidade_cnpj_contabilidade
        ON "AmContabilidade"(CNPJ_CONTABILIDADE)
        WHERE CNPJ_CONTABILIDADE IS NOT NULL;
        RAISE NOTICE '✅ Índice idx_amcontabilidade_cnpj_contabilidade criado';
    ELSE
        RAISE NOTICE '⏭️  Índice idx_amcontabilidade_cnpj_contabilidade já existe';
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: VERIFICAÇÕES FINAIS
-- ============================================================================

-- Separador visual
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '                 RELATÓRIO FINAL - RESUMO                  ';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- Listar todas as colunas CNPJ_CONTABILIDADE criadas
SELECT
    '📊 TABELAS COM CNPJ_CONTABILIDADE' as secao,
    table_name as tabela,
    column_name as coluna,
    data_type as tipo
FROM information_schema.columns
WHERE LOWER(column_name) = 'cnpj_contabilidade'
AND table_name IN ('comprovantes', 'contratosSocial', 'AmContabilidade')
ORDER BY table_name;

-- Verificar se há clientes sem CNPJ_CONTABILIDADE (exceto contabilidades)
SELECT
    '⚠️  CLIENTES SEM CONTABILIDADE' as secao,
    COUNT(*) as total,
    'Estes clientes precisam ter CNPJ_CONTABILIDADE definido' as observacao
FROM "Clientes"
WHERE CNPJ_CONTABILIDADE IS NULL
AND (ADM IS NULL OR ADM != 'ADM');

-- Verificar quantos comprovantes estão sem CNPJ_CONTABILIDADE
SELECT
    '📄 COMPROVANTES SEM CONTABILIDADE' as secao,
    COUNT(*) as total,
    CASE
        WHEN COUNT(*) > 0 THEN 'Precisam ser corrigidos manualmente'
        ELSE 'Tudo OK!'
    END as status
FROM comprovantes
WHERE CNPJ_CONTABILIDADE IS NULL;

-- Verificar quantos contratos estão sem CNPJ_CONTABILIDADE
SELECT
    '📋 CONTRATOS SEM CONTABILIDADE' as secao,
    COUNT(*) as total,
    CASE
        WHEN COUNT(*) > 0 THEN 'Precisam ser corrigidos manualmente'
        ELSE 'Tudo OK!'
    END as status
FROM "contratosSocial"
WHERE CNPJ_CONTABILIDADE IS NULL;

-- Listar todas as contabilidades cadastradas
SELECT
    '🏢 CONTABILIDADES CADASTRADAS' as secao,
    id,
    NOME_CLIENTE as nome,
    CNPJ as cnpj,
    email,
    created_at as cadastrado_em
FROM "Clientes"
WHERE ADM = 'ADM'
ORDER BY created_at DESC;

-- Contar clientes por contabilidade
SELECT
    '👥 CLIENTES POR CONTABILIDADE' as secao,
    cont.NOME_CLIENTE as contabilidade,
    cont.CNPJ as cnpj_contabilidade,
    COUNT(cli.id) as total_clientes
FROM "Clientes" cont
LEFT JOIN "Clientes" cli ON cli.CNPJ_CONTABILIDADE = cont.CNPJ
WHERE cont.ADM = 'ADM'
GROUP BY cont.NOME_CLIENTE, cont.CNPJ
ORDER BY total_clientes DESC;

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ SCRIPT EXECUTADO COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '   1. Verifique os resultados acima';
    RAISE NOTICE '   2. Corrija registros sem CNPJ_CONTABILIDADE se houver';
    RAISE NOTICE '   3. Atualize o código JavaScript (supabase.js)';
    RAISE NOTICE '   4. Teste todas as funcionalidades';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  LEMBRETE: Comunicados JÁ têm filtro próprio!';
    RAISE NOTICE '   - Comunicados gerais: campo ContabilidadeComunicado';
    RAISE NOTICE '   - Comunicados específicos: campo CNPJ_CONT';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
