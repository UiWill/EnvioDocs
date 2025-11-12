-- ============================================================================
-- SCRIPT DE ATUALIZAÇÃO DE SEGURANÇA - MULTI-TENANCY
-- EnvioDocs - Sistema de Gestão Documental
-- ============================================================================
-- Este script adiciona colunas e políticas de segurança para garantir
-- isolamento adequado entre contabilidades
--
-- IMPORTANTE:
-- 1. Fazer BACKUP completo do banco ANTES de executar
-- 2. Executar em ambiente de testes primeiro
-- 3. Verificar se todas as queries funcionam após a atualização
-- ============================================================================

-- ============================================================================
-- PARTE 1: ADICIONAR COLUNAS CNPJ_CONTABILIDADE (se não existirem)
-- ============================================================================

-- Verificar e adicionar coluna em 'comprovantes'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comprovantes'
        AND column_name = 'CNPJ_CONTABILIDADE'
    ) THEN
        ALTER TABLE comprovantes
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);

        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela comprovantes';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela comprovantes';
    END IF;
END $$;

-- Verificar e adicionar coluna em 'contratosSocial'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contratosSocial'
        AND column_name = 'CNPJ_CONTABILIDADE'
    ) THEN
        ALTER TABLE "contratosSocial"
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);

        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela contratosSocial';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela contratosSocial';
    END IF;
END $$;

-- Verificar e adicionar coluna em 'Comunicados'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Comunicados'
        AND column_name = 'CNPJ_CONTABILIDADE'
    ) THEN
        ALTER TABLE "Comunicados"
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);

        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela Comunicados';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela Comunicados';
    END IF;
END $$;

-- Verificar e adicionar coluna em 'comunicadosEspecificos'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comunicadosEspecificos'
        AND column_name = 'CNPJ_CONTABILIDADE'
    ) THEN
        ALTER TABLE "comunicadosEspecificos"
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);

        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela comunicadosEspecificos';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela comunicadosEspecificos';
    END IF;
END $$;

-- Verificar e adicionar coluna em 'AmContabilidade'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'AmContabilidade'
        AND column_name = 'CNPJ_CONTABILIDADE'
    ) THEN
        ALTER TABLE "AmContabilidade"
        ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);

        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela AmContabilidade';
    ELSE
        RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela AmContabilidade';
    END IF;
END $$;

-- Verificar e adicionar coluna em 'historico_documentos' (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'historico_documentos'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'historico_documentos'
            AND column_name = 'CNPJ_CONTABILIDADE'
        ) THEN
            ALTER TABLE historico_documentos
            ADD COLUMN CNPJ_CONTABILIDADE VARCHAR(18);

            RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE adicionada à tabela historico_documentos';
        ELSE
            RAISE NOTICE 'Coluna CNPJ_CONTABILIDADE já existe na tabela historico_documentos';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela historico_documentos não existe, pulando...';
    END IF;
END $$;

-- ============================================================================
-- PARTE 2: POPULAR COLUNAS CNPJ_CONTABILIDADE COM DADOS EXISTENTES
-- ============================================================================

-- Popular comprovantes com CNPJ_CONTABILIDADE baseado no CNPJ do cliente
UPDATE comprovantes comp
SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
FROM "Clientes" cli
WHERE comp.CNPJ = cli.CNPJ
AND comp.CNPJ_CONTABILIDADE IS NULL;

-- Popular contratosSocial com CNPJ_CONTABILIDADE baseado no CNPJ do cliente
UPDATE "contratosSocial" cont
SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
FROM "Clientes" cli
WHERE cont.CNPJ = cli.CNPJ
AND cont.CNPJ_CONTABILIDADE IS NULL;

-- Popular Comunicados com CNPJ_CONTABILIDADE
-- (já tem campo ContabilidadeComunicado, usar esse)
UPDATE "Comunicados"
SET CNPJ_CONTABILIDADE = "ContabilidadeComunicado"
WHERE CNPJ_CONTABILIDADE IS NULL
AND "ContabilidadeComunicado" IS NOT NULL;

-- Popular comunicadosEspecificos com CNPJ_CONTABILIDADE
-- (já tem campo CNPJ_CONT, usar esse)
UPDATE "comunicadosEspecificos"
SET CNPJ_CONTABILIDADE = "CNPJ_CONT"
WHERE CNPJ_CONTABILIDADE IS NULL
AND "CNPJ_CONT" IS NOT NULL;

-- Popular AmContabilidade usando o CNPJ_CURTO para encontrar o cliente
UPDATE "AmContabilidade" am
SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
FROM "Clientes" cli
WHERE am.CNPJ_CURTO = cli.CNPJ_curto
AND am.CNPJ_CONTABILIDADE IS NULL
AND cli.CNPJ_CONTABILIDADE IS NOT NULL;

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
            AND column_name = 'cliente_cnpj'
        ) THEN
            EXECUTE '
                UPDATE historico_documentos hist
                SET CNPJ_CONTABILIDADE = cli.CNPJ_CONTABILIDADE
                FROM "Clientes" cli
                WHERE hist.cliente_cnpj = cli.CNPJ
                AND hist.CNPJ_CONTABILIDADE IS NULL
            ';
            RAISE NOTICE 'Tabela historico_documentos atualizada';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PARTE 3: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice em Clientes.CNPJ_CONTABILIDADE (já deveria existir, mas garantir)
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj_contabilidade
ON "Clientes"(CNPJ_CONTABILIDADE)
WHERE CNPJ_CONTABILIDADE IS NOT NULL;

-- Índice em Clientes.ADM para buscar contabilidades rapidamente
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

-- ============================================================================
-- PARTE 4: CRIAR CONSTRAINTS PARA GARANTIR INTEGRIDADE
-- ============================================================================

-- Garantir que clientes finais sempre tenham CNPJ_CONTABILIDADE
-- (contabilidades não precisam pois ADM='ADM')
DO $$
BEGIN
    -- Adicionar constraint check em Clientes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_cliente_tem_contabilidade'
    ) THEN
        ALTER TABLE "Clientes"
        ADD CONSTRAINT check_cliente_tem_contabilidade
        CHECK (
            (ADM = 'ADM') OR
            (ADM IS NULL AND CNPJ_CONTABILIDADE IS NOT NULL) OR
            (ADM != 'ADM' AND CNPJ_CONTABILIDADE IS NOT NULL)
        );
        RAISE NOTICE 'Constraint check_cliente_tem_contabilidade criada';
    END IF;
END $$;

-- ============================================================================
-- PARTE 5: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- ATENÇÃO: Só habilitar após TESTAR as queries com a aplicação
-- Comentado por padrão para segurança

-- Habilitar RLS nas tabelas principais
-- ALTER TABLE "Clientes" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comprovantes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "contratosSocial" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Comunicados" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "comunicadosEspecificos" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "AmContabilidade" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 6: CRIAR POLÍTICAS RLS (Comentadas - aplicar após testes)
-- ============================================================================

/*
-- Política para Clientes: Contabilidade só vê seus clientes
DROP POLICY IF EXISTS contabilidade_clientes_policy ON "Clientes";
CREATE POLICY contabilidade_clientes_policy ON "Clientes"
FOR ALL
USING (
    -- Contabilidade vê seus próprios dados
    (ADM = 'ADM' AND CNPJ = (
        SELECT c.CNPJ FROM "Clientes" c
        WHERE c.email = auth.jwt()->>'email'
        AND c.ADM = 'ADM'
    ))
    OR
    -- Contabilidade vê seus clientes
    (CNPJ_CONTABILIDADE = (
        SELECT c.CNPJ FROM "Clientes" c
        WHERE c.email = auth.jwt()->>'email'
        AND c.ADM = 'ADM'
    ))
);

-- Política para comprovantes
DROP POLICY IF EXISTS contabilidade_comprovantes_policy ON comprovantes;
CREATE POLICY contabilidade_comprovantes_policy ON comprovantes
FOR ALL
USING (
    CNPJ_CONTABILIDADE = (
        SELECT c.CNPJ FROM "Clientes" c
        WHERE c.email = auth.jwt()->>'email'
        AND c.ADM = 'ADM'
    )
);

-- Política para contratosSocial
DROP POLICY IF EXISTS contabilidade_contratos_policy ON "contratosSocial";
CREATE POLICY contabilidade_contratos_policy ON "contratosSocial"
FOR ALL
USING (
    CNPJ_CONTABILIDADE = (
        SELECT c.CNPJ FROM "Clientes" c
        WHERE c.email = auth.jwt()->>'email'
        AND c.ADM = 'ADM'
    )
);

-- Política para Comunicados
DROP POLICY IF EXISTS contabilidade_comunicados_policy ON "Comunicados";
CREATE POLICY contabilidade_comunicados_policy ON "Comunicados"
FOR ALL
USING (
    CNPJ_CONTABILIDADE = (
        SELECT c.CNPJ FROM "Clientes" c
        WHERE c.email = auth.jwt()->>'email'
        AND c.ADM = 'ADM'
    )
);

-- Política para comunicadosEspecificos
DROP POLICY IF EXISTS contabilidade_comunicadosesp_policy ON "comunicadosEspecificos";
CREATE POLICY contabilidade_comunicadosesp_policy ON "comunicadosEspecificos"
FOR ALL
USING (
    CNPJ_CONTABILIDADE = (
        SELECT c.CNPJ FROM "Clientes" c
        WHERE c.email = auth.jwt()->>'email'
        AND c.ADM = 'ADM'
    )
);

-- Política para AmContabilidade
DROP POLICY IF EXISTS contabilidade_am_policy ON "AmContabilidade";
CREATE POLICY contabilidade_am_policy ON "AmContabilidade"
FOR ALL
USING (
    CNPJ_CONTABILIDADE = (
        SELECT c.CNPJ FROM "Clientes" c
        WHERE c.email = auth.jwt()->>'email'
        AND c.ADM = 'ADM'
    )
);
*/

-- ============================================================================
-- PARTE 7: VERIFICAÇÕES FINAIS
-- ============================================================================

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
-- FIM DO SCRIPT
-- ============================================================================

-- PRÓXIMOS PASSOS APÓS EXECUTAR ESTE SCRIPT:
-- 1. Verificar os resultados das queries de verificação acima
-- 2. Corrigir manualmente registros sem CNPJ_CONTABILIDADE se houver
-- 3. Testar todas as funcionalidades da aplicação
-- 4. Após confirmar que tudo funciona, descomentar e aplicar as políticas RLS
-- 5. Testar novamente com RLS habilitado
-- 6. Fazer backup antes de colocar em produção
