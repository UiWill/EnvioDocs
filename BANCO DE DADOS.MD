-- Ver todas as tabelas e suas colunas
  SELECT
      table_name,
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE 'sql_%'
  ORDER BY table_name, ordinal_position;

  RESPOSTA
  [
  {
    "table_name": "AmContabilidade",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "CNPJ_CLIENTE",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "NOME_CLIENTE",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "URL_PDF",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "DATA_ARQ",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "STATUS",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "Pagamento_eft",
    "data_type": "timestamp without time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "NOME_PDF",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "VALOR_PFD",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "CNPJ_CURTO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "DATA_PAG",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "'0'::text"
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "RECEITAS",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "DATA_DECIMAL",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "HASH",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "Clientes",
    "column_name": "NOME_CLIENTE",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "CNPJ",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "GENERO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "INFO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "DATA_INICIO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "uid",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "email",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "CNPJ_CONTABILIDADE",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "CNPJ_curto",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "ADM",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "NOTFICACAO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "'0'::text"
  },
  {
    "table_name": "Clientes",
    "column_name": "NOTIFICACAOPRIV",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "'0'::text"
  },
  {
    "table_name": "Clientes",
    "column_name": "FOTO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "HONORARIOS",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "DARF",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "FGTS",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "HOLERITE",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "DAE",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "PGDAS",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Clientes",
    "column_name": "NUMERO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Comunicados",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "Comunicados",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "Comunicados",
    "column_name": "Titulo",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Comunicados",
    "column_name": "comunicado",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Comunicados",
    "column_name": "ContabilidadeComunicado",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Comunicados",
    "column_name": "filtro",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Comunicados",
    "column_name": "cnpjCurtoESP",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "Comunicados",
    "column_name": "clientes_que_leram",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "'[]'::text"
  },
  {
    "table_name": "DocumentTypes",
    "column_name": "id",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "nextval('\"DocumentTypes_id_seq\"'::regclass)"
  },
  {
    "table_name": "DocumentTypes",
    "column_name": "name",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "DocumentTypes",
    "column_name": "keywords",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "DocumentTypes",
    "column_name": "sample_text",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "DocumentTypes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "CURRENT_TIMESTAMP"
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "nextval('ai_extraction_correction_logs_id_seq'::regclass)"
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "user_id",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "document_name",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "document_url",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "ai_extracted_data",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "manually_corrected_data",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "fields_corrected",
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "correction_reason",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "correction_time_seconds",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "processing_session_id",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "column_name": "document_type",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "app_version",
    "column_name": "id",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "nextval('app_version_id_seq'::regclass)"
  },
  {
    "table_name": "app_version",
    "column_name": "version",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "app_version",
    "column_name": "force_update",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "app_version",
    "column_name": "update_message",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "app_version",
    "column_name": "update_url",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "app_version",
    "column_name": "platform",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "app_version",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "comprovantes",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "comprovantes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "comprovantes",
    "column_name": "URL_COMPROVANTE",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "comprovantes",
    "column_name": "NOME",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "comprovantes",
    "column_name": "CNPJ",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "comunicadosEspecificos",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "comunicadosEspecificos",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "comunicadosEspecificos",
    "column_name": "TITULO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "comunicadosEspecificos",
    "column_name": "COMUNICADO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "comunicadosEspecificos",
    "column_name": "CNPJ_CONT",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "comunicadosEspecificos",
    "column_name": "FILTRO",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "comunicadosEspecificos",
    "column_name": "clientes_que_leram",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "'[]'::text"
  },
  {
    "table_name": "contratosSocial",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "contratosSocial",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "contratosSocial",
    "column_name": "CNPJ",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "contratosSocial",
    "column_name": "NOME",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "contratosSocial",
    "column_name": "URL_CONT",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "historico_documentos",
    "column_name": "id",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "nextval('historico_documentos_id_seq'::regclass)"
  },
  {
    "table_name": "historico_documentos",
    "column_name": "cnpj_cliente",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historico_documentos",
    "column_name": "cnpj_contabilidade",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historico_documentos",
    "column_name": "mes_referencia",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historico_documentos",
    "column_name": "ano_referencia",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historico_documentos",
    "column_name": "tipo_documento",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historico_documentos",
    "column_name": "data_envio",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "CURRENT_TIMESTAMP"
  },
  {
    "table_name": "historico_documentos",
    "column_name": "DATA_ARQ",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null
  }
]






-- Lista simples de todas as tabelas
  SELECT
      table_name,
      (SELECT COUNT(*)
       FROM information_schema.columns c
       WHERE c.table_name = t.table_name
       AND c.table_schema = 'public') as total_colunas
  FROM information_schema.tables t
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  ORDER BY table_name;
  RESPOSTA

[
  {
    "table_name": "AmContabilidade",
    "total_colunas": 15
  },
  {
    "table_name": "Clientes",
    "total_colunas": 22
  },
  {
    "table_name": "Comunicados",
    "total_colunas": 8
  },
  {
    "table_name": "DocumentTypes",
    "total_colunas": 5
  },
  {
    "table_name": "ai_extraction_correction_logs",
    "total_colunas": 12
  },
  {
    "table_name": "app_version",
    "total_colunas": 7
  },
  {
    "table_name": "comprovantes",
    "total_colunas": 5
  },
  {
    "table_name": "comunicadosEspecificos",
    "total_colunas": 7
  },
  {
    "table_name": "contratosSocial",
    "total_colunas": 5
  },
  {
    "table_name": "historico_documentos",
    "total_colunas": 8
  }
]




-- Ver quais tabelas JÁ TÊM colunas relacionadas a CNPJ
  SELECT
      table_name,
      column_name,
      data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND (
      LOWER(column_name) LIKE '%cnpj%' OR
      LOWER(column_name) LIKE '%contabilidade%'
  )
  ORDER BY table_name, column_name;

RESPSTA
[
  {
    "table_name": "AmContabilidade",
    "column_name": "CNPJ_CLIENTE",
    "data_type": "text"
  },
  {
    "table_name": "AmContabilidade",
    "column_name": "CNPJ_CURTO",
    "data_type": "text"
  },
  {
    "table_name": "Clientes",
    "column_name": "CNPJ",
    "data_type": "text"
  },
  {
    "table_name": "Clientes",
    "column_name": "CNPJ_CONTABILIDADE",
    "data_type": "text"
  },
  {
    "table_name": "Clientes",
    "column_name": "CNPJ_curto",
    "data_type": "text"
  },
  {
    "table_name": "Comunicados",
    "column_name": "ContabilidadeComunicado",
    "data_type": "text"
  },
  {
    "table_name": "Comunicados",
    "column_name": "cnpjCurtoESP",
    "data_type": "text"
  },
  {
    "table_name": "comprovantes",
    "column_name": "CNPJ",
    "data_type": "text"
  },
  {
    "table_name": "comunicadosEspecificos",
    "column_name": "CNPJ_CONT",
    "data_type": "text"
  },
  {
    "table_name": "contratosSocial",
    "column_name": "CNPJ",
    "data_type": "text"
  },
  {
    "table_name": "historico_documentos",
    "column_name": "cnpj_cliente",
    "data_type": "text"
  },
  {
    "table_name": "historico_documentos",
    "column_name": "cnpj_contabilidade",
    "data_type": "text"
  }
]