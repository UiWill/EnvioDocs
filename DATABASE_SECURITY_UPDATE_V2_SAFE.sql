-- ============================================================================
-- SCRIPT DE ATUALIZAÇÃO DE SEGURANÇA - MULTI-TENANCY (VERSÃO SEGURA V2)
-- EnvioDocs - Sistema de Gestão Documental
-- ============================================================================
-- Esta versão IGNORA erros se as colunas já existirem
-- É SEGURA para executar múltiplas vezes
-- ============================================================================

-- ============================================================================
-- PARTE 1: ADICIONAR COLUNAS CNPJ_CONTABILIDADE (VERSÃO SEGURA)
-- ============================================================================

-- Verificar e adicionar coluna em 'comprovantes'
DO $$
BEGIN
    -- Usar LOWER() para ignorar maiúsculas/minúsculas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comprovantes'
        AND LOWER(column_name) = 'cnpj_contabilidade'
    ) THEN
        ALTER TABLE comprovantes
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela comprovantes';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela comprovantes - PULANDO';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar coluna em comprovantes (provavelmente já existe): %', SQLERRM;
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
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela contratosSocial';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela contratosSocial - PULANDO';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar coluna em contratosSocial (provavelmente já existe): %', SQLERRM;
END $$;

-- Verificar e adicionar coluna em 'Comunicados'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Comunicados'
        AND LOWER(column_name) = 'cnpj_contabilidade'
    ) THEN
        ALTER TABLE "Comunicados"
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela Comunicados';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela Comunicados - PULANDO';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar coluna em Comunicados (provavelmente já existe): %', SQLERRM;
END $$;

-- Verificar e adicionar coluna em 'comunicadosEspecificos'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comunicadosEspecificos'
        AND LOWER(column_name) = 'cnpj_contabilidade'
    ) THEN
        ALTER TABLE "comunicadosEspecificos"
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela comunicadosEspecificos';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela comunicadosEspecificos - PULANDO';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar coluna em comunicadosEspecificos (provavelmente já existe): %', SQLERRM;
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
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela AmContabilidade';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela AmContabilidade - PULANDO';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar coluna em AmContabilidade (provavelmente já existe): %', SQLERRM;
END $$;

-- Verificar e adicionar coluna em 'historico_documentos' (COM PROTEÇÃO EXTRA)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'historico_documentos'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'historico_documentos'
            AND LOWER(column_name) = 'cnpj_contabilidade'
        ) THEN
            ALTER TABLE historico_documentos
            ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);
            RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela historico_documentos';
        ELSE
            RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela historico_documentos - PULANDO';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela historico_documentos não existe - PULANDO';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar coluna em historico_documentos (provavelmente já existe): %', SQLERRM;
END $$;

-- ============================================================================
-- PARTE 2: POPULAR COLUNAS CNPJ_CONTABILIDADE COM DADOS EXISTENTES
-- ============================================================================

-- Popular comprovantes com CNPJ_CONTABILIDADE baseado no CNPJ do cliente
DO $$
BEGIN
    UPDATE comprovantes comp
    SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
    FROM "Clientes" cli
    WHERE comp.CNPJ = cli.CNPJ
    AND comp.CNPJ_CONTABILIDADE IS NULL
    AND cli.CNPJ_CONTABILIDADE IS NOT NULL;

    RAISE NOTICE '% registros atualizados em comprovantes', FOUND;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao popular comprovantes: %', SQLERRM;
END $$;

-- Popular contratosSocial com CNPJ_CONTABILIDADE baseado no CNPJ do cliente
DO $$
BEGIN
    UPDATE "contratosSocial" cont
    SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
    FROM "Clientes" cli
    WHERE cont.CNPJ = cli.CNPJ
    AND cont.CNPJ_CONTABILIDADE IS NULL
    AND cli.CNPJ_CONTABILIDADE IS NOT NULL;

    RAISE NOTICE '% registros atualizados em contratosSocial', FOUND;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao popular contratosSocial: %', SQLERRM;
END $$;

-- Popular Comunicados com CNPJ_CONTABILIDADE
DO $$
BEGIN
    UPDATE "Comunicados"
    SET CNPJ_CONTABILIDADE = "ContabilidadeComunicado"
    WHERE CNPJ_CONTABILIDADE IS NULL
    AND "ContabilidadeComunicado" IS NOT NULL;

    RAISE NOTICE '% registros atualizados em Comunicados', FOUND;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao popular Comunicados: %', SQLERRM;
END $$;

-- Popular comunicadosEspecificos com CNPJ_CONTABILIDADE
DO $$
BEGIN
    UPDATE "comunicadosEspecificos"
    SET CNPJ_CONTABILIDADE = "CNPJ_CONT"
    WHERE CNPJ_CONTABILIDADE IS NULL
    AND "CNPJ_CONT" IS NOT NULL;

    RAISE NOTICE '% registros atualizados em comunicadosEspecificos', FOUND;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao popular comunicadosEspecificos: %', SQLERRM;
END $$;

-- Popular AmContabilidade usando o CNPJ_CURTO para encontrar o cliente
DO $$
BEGIN
    UPDATE "AmContabilidade" am
    SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
    FROM "Clientes" cli
    WHERE am.CNPJ_CURTO = cli.CNPJ_curto
    AND am.CNPJ_CONTABILIDADE IS NULL
    AND cli.CNPJ_CONTABILIDADE IS NOT NULL;

    RAISE NOTICE '% registros atualizados em AmContabilidade', FOUND;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao popular AmContabilidade: %', SQLERRM;
END $$;

-- Popular historico_documentos (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'historico_documentos'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'historico_documentos'
            AND LOWER(column_name) = 'cliente_cnpj'
        ) THEN
            UPDATE historico_documentos hist
            SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
            FROM "Clientes" cli
            WHERE hist.cliente_cnpj = cli.CNPJ
            AND hist.CNPJ_CONTABILIDADE IS NULL
            AND cli.CNPJ_CONTABILIDADE IS NOT NULL;

            RAISE NOTICE '% registros atualizados em historico_documentos', FOUND;
        END IF;
    ELSE
        RAISE NOTICE 'Tabela historico_documentos não existe - PULANDO';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao popular historico_documentos: %', SQLERRM;
END $$;

-- ============================================================================
-- PARTE 3: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice em Clientes.CNPJ_CONTABILIDADE
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj_contabilidade
ON "Clientes"(CNPJ_CONTABILIDADE)
WHERE CNPJ_CONTABILIDADE IS NOT NULL;

-- Índice em Clientes.ADM
CREATE INDEX IF NOT EXISTS idx_clientes_adm
ON "Clientes"(ADM)
WHERE ADM = 'ADM';

-- Índice em comprovantes.CNPJ_CONTABILIDADE
CREATE INDEX IF NOT EXISTS idx_comprovantes_cnpj_contabilidade
ON comprovantes(CNPJ_CONTABILIDADE)
WHERE CNPJ_CONTABILIDADE IS NOT NULL;

-- Índice em contratosSocial.CNPJ_CONTABILIDADE
CREATE INDEX IF NOT EXISTS idx_contratos_cnpj_contabilidade
ON "contratosSocial"(CNPJ_CONTABILIDADE)
WHERE CNPJ_CONTABILIDADE IS NOT NULL;

-- Índice em Comunicados.CNPJ_CONTABILIDADE
CREATE INDEX IF NOT EXISTS idx_comunicados_cnpj_contabilidade
ON "Comunicados"(CNPJ_CONTABILIDADE)
WHERE CNPJ_CONTABILIDADE IS NOT NULL;

-- Índice em comunicadosEspecificos.CNPJ_CONTABILIDADE
CREATE INDEX IF NOT EXISTS idx_comunicadosespecificos_cnpj_contabilidade
ON "comunicadosEspecificos"(CNPJ_CONTABILIDADE)
WHERE CNPJ_CONTABILIDADE IS NOT NULL;

-- Índice em AmContabilidade.CNPJ_CONTABILIDADE
CREATE INDEX IF NOT EXISTS idx_amcontabilidade_cnpj_contabilidade
ON "AmContabilidade"(CNPJ_CONTABILIDADE)
WHERE CNPJ_CONTABILIDADE IS NOT NULL;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Índices criados com sucesso';
END $$;

-- ============================================================================
-- PARTE 4: VERIFICAÇÕES FINAIS
-- ============================================================================

-- Listar todas as tabelas com a coluna CNPJ_CONTABILIDADE
SELECT
    '✅ RESUMO DAS COLUNAS CRIADAS' as titulo,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE LOWER(column_name) = 'cnpj_contabilidade'
ORDER BY table_name;

-- Verificar se há clientes sem CNPJ_CONTABILIDADE (exceto contabilidades)
SELECT
    COUNT(*) as clientes_sem_contabilidade,
    'ATENÇÃO: Estes clientes precisam ter CNPJ_CONTABILIDADE definido' as alerta
FROM "Clientes"
WHERE CNPJ_CONTABILIDADE IS NULL
AND (ADM IS NULL OR ADM != 'ADM');

-- Verificar quantos comprovantes estão sem CNPJ_CONTABILIDADE
SELECT
    COUNT(*) as comprovantes_sem_contabilidade,
    'Comprovantes que precisam de ajuste manual' as alerta
FROM comprovantes
WHERE CNPJ_CONTABILIDADE IS NULL;

-- Verificar quantos contratos estão sem CNPJ_CONTABILIDADE
SELECT
    COUNT(*) as contratos_sem_contabilidade,
    'Contratos que precisam de ajuste manual' as alerta
FROM "contratosSocial"
WHERE CNPJ_CONTABILIDADE IS NULL;

-- Listar todas as contabilidades cadastradas
SELECT
    id,
    NOME_CLIENTE as nome_contabilidade,
    CNPJ as cnpj_contabilidade,
    email,
    created_at
FROM "Clientes"
WHERE ADM = 'ADM'
ORDER BY created_at DESC;

-- Contar clientes por contabilidade
SELECT
    cont.NOME_CLIENTE as contabilidade,
    cont.CNPJ as cnpj_contabilidade,
    COUNT(cli.id) as total_clientes
FROM "Clientes" cont
LEFT JOIN "Clientes" cli ON cli.CNPJ_CONTABILIDADE = cont.CNPJ
WHERE cont.ADM = 'ADM'
GROUP BY cont.NOME_CLIENTE, cont.CNPJ
ORDER BY total_clientes DESC;

-- ============================================================================
-- FIM DO SCRIPT - VERSÃO SEGURA V2
-- ============================================================================

-- Mensagens finais
DO $$
BEGIN
    RAISE NOTICE '✅ SCRIPT EXECUTADO COM SUCESSO!';
    RAISE NOTICE '📋 Verifique os resultados acima para garantir que tudo está correto';
    RAISE NOTICE '⚠️ NÃO ESQUEÇA: Ainda falta atualizar o código JavaScript!';
END $$;
