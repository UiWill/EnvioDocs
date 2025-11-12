# 🔐 GUIA DE IMPLEMENTAÇÃO - CORREÇÕES DE SEGURANÇA MULTI-TENANCY

## EnvioDocs - Sistema de Gestão Documental

---

## ⚠️ ATENÇÃO - LEIA ANTES DE COMEÇAR

**ESTE GUIA CONTÉM ALTERAÇÕES CRÍTICAS DE SEGURANÇA**

- ✅ Fazer **BACKUP COMPLETO** do banco de dados antes de iniciar
- ✅ Testar TODAS as alterações em ambiente de desenvolvimento primeiro
- ✅ Executar os passos na ordem apresentada
- ✅ Não pular etapas
- ⚠️ Estimativa de tempo: **2-4 horas** (incluindo testes)

---

## 📋 ÍNDICE

1. [Visão Geral das Correções](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo 1: Backup](#passo-1-backup)
4. [Passo 2: Atualizar Banco de Dados](#passo-2-banco-de-dados)
5. [Passo 3: Atualizar JavaScript](#passo-3-javascript)
6. [Passo 4: Testar](#passo-4-testes)
7. [Passo 5: Habilitar RLS (Opcional)](#passo-5-rls)
8. [Resolução de Problemas](#resolução-de-problemas)

---

## 🎯 VISÃO GERAL DAS CORREÇÕES {#visão-geral}

### Problemas Corrigidos

1. **❌ Funções sem filtro de contabilidade**
   - `getComprovantes()` retornava TODOS os comprovantes
   - `getContratosSociais()` retornava TODOS os contratos
   - `getHistoricoDocumentos()` retornava TODOS os históricos

2. **❌ Falta de validação de propriedade**
   - Qualquer contabilidade podia acessar qualquer cliente pelo ID
   - Sem verificação se o cliente pertence à contabilidade logada

3. **❌ CNPJ da contabilidade não era verificado**
   - Session guard apenas verificava token do Supabase
   - Não validava se o CNPJ corresponde ao usuário logado

### Arquivos Criados

```
EnvioDocs/
├── DATABASE_SECURITY_UPDATE.sql                 # Script SQL de atualização
├── GUIA_IMPLEMENTACAO_SEGURANCA.md             # Este guia
└── CONTABILIDADE/
    └── assets/
        └── js/
            ├── supabase-security-fixes.js      # Correções JavaScript
            └── session-guard-enhanced.js        # Session guard melhorado
```

---

## ✅ PRÉ-REQUISITOS {#pré-requisitos}

Antes de começar, certifique-se de ter:

- [ ] Acesso ao painel do Supabase (dashboard)
- [ ] Editor de código (VS Code, Sublime, etc.)
- [ ] Navegador web atualizado para testes
- [ ] Acesso de administrador ao servidor (se for produção)
- [ ] Pelo menos 1 contabilidade cadastrada para testes

---

## 📦 PASSO 1: BACKUP {#passo-1-backup}

### 1.1. Backup do Banco de Dados (Supabase)

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto **EnvioDocs**
3. Vá em **Database** → **Backups**
4. Clique em **Create a new backup**
5. Aguarde a conclusão e **anote a data/hora do backup**

### 1.2. Backup dos Arquivos JavaScript

```bash
# Navegue até a pasta do projeto
cd C:\ERP_SISTEMAS\EnvioDocs

# Criar pasta de backup
mkdir backup_seguranca_$(date +%Y%m%d)

# Copiar arquivos originais
copy CONTABILIDADE\assets\js\supabase.js backup_seguranca_$(date +%Y%m%d)\
copy CONTABILIDADE\assets\js\session-guard.js backup_seguranca_$(date +%Y%m%d)\
```

**✅ CHECKPOINT:** Confirme que os backups foram criados antes de continuar.

---

## 🗄️ PASSO 2: ATUALIZAR BANCO DE DADOS {#passo-2-banco-de-dados}

### 2.1. Acessar SQL Editor do Supabase

1. Acesse o painel do Supabase
2. Vá em **SQL Editor**
3. Clique em **New query**

### 2.2. Executar Script SQL

1. Abra o arquivo `DATABASE_SECURITY_UPDATE.sql`
2. **COPIE TODO O CONTEÚDO** do arquivo
3. **COLE** no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### 2.3. Verificar Resultados

O script irá:
- ✅ Adicionar coluna `CNPJ_CONTABILIDADE` em todas as tabelas necessárias
- ✅ Popular as colunas com dados existentes
- ✅ Criar índices para melhorar performance
- ✅ Mostrar estatísticas no final

**Resultados Esperados:**

```sql
-- Você deve ver mensagens como:
INFO: Coluna CNPJ_CONTABILIDADE adicionada à tabela comprovantes
INFO: Coluna CNPJ_CONTABILIDADE adicionada à tabela contratosSocial
...
```

**Verificações Finais:**

O script mostrará automaticamente:
- Quantos clientes estão sem CNPJ_CONTABILIDADE
- Quantos comprovantes/contratos precisam de ajuste
- Lista de todas as contabilidades cadastradas
- Contagem de clientes por contabilidade

### 2.4. Corrigir Registros Órfãos (se houver)

Se a verificação mostrar registros sem `CNPJ_CONTABILIDADE`:

```sql
-- Listar registros problemáticos em comprovantes
SELECT id, CNPJ, NOME_PDF
FROM comprovantes
WHERE CNPJ_CONTABILIDADE IS NULL;

-- Corrigir manualmente (exemplo):
UPDATE comprovantes
SET CNPJ_CONTABILIDADE = '12.345.678/0001-90'  -- CNPJ da contabilidade dona
WHERE id = 123;  -- ID do comprovante
```

Repita para `contratosSocial` se necessário.

**✅ CHECKPOINT:** Todas as tabelas devem ter a coluna `CNPJ_CONTABILIDADE` e estar populadas.

---

## 💻 PASSO 3: ATUALIZAR JAVASCRIPT {#passo-3-javascript}

### 3.1. Integrar Correções no supabase.js

**IMPORTANTE:** Você tem duas opções:

#### OPÇÃO A: Substituir Funções Manualmente (RECOMENDADO)

1. Abra `CONTABILIDADE/assets/js/supabase.js` no seu editor
2. Abra `CONTABILIDADE/assets/js/supabase-security-fixes.js`
3. **Localize cada função** listada abaixo em `supabase.js`
4. **SUBSTITUA** pelo código correspondente em `supabase-security-fixes.js`

**Funções a substituir:**

- ✅ `validarPropriedadeCliente` (ADICIONAR no início, após a inicialização do Supabase)
- ✅ `obterCNPJContabilidadeLogada` (ADICIONAR no início)
- ✅ `getComprovantes()` (SUBSTITUIR)
- ✅ `getContratosSociais()` (SUBSTITUIR)
- ✅ `getHistoricoDocumentos()` (SUBSTITUIR)
- ✅ `getClienteById()` (SUBSTITUIR)
- ✅ `getComprovanteById()` (SUBSTITUIR)
- ✅ `getContratoById()` (SUBSTITUIR)
- ✅ `getHistoricoById()` (SUBSTITUIR)

#### OPÇÃO B: Incluir Como Script Adicional (RÁPIDO, mas não ideal)

1. Adicione esta linha em **TODAS as páginas** do sistema CONTABILIDADE, após o `supabase.js`:

```html
<!-- Depois desta linha: -->
<script src="assets/js/supabase.js"></script>

<!-- Adicionar: -->
<script src="assets/js/supabase-security-fixes.js"></script>
```

⚠️ **Desvantagem:** As funções serão sobrescritas, mas o código antigo ainda estará lá.

### 3.2. Atualizar Session Guard

**SUBSTITUIR completamente** o arquivo `session-guard.js`:

```bash
# Windows (PowerShell)
copy CONTABILIDADE\assets\js\session-guard-enhanced.js CONTABILIDADE\assets\js\session-guard.js

# Ou manualmente:
# 1. Deletar conteúdo de session-guard.js
# 2. Copiar todo conteúdo de session-guard-enhanced.js
# 3. Colar em session-guard.js
```

### 3.3. Atualizar Páginas que Chamam as Funções

**IMPORTANTE:** Atualizar chamadas para as funções corrigidas.

#### Exemplo 1: Dashboard

**ANTES:**
```javascript
// dashboard.js - linha ~539
buscarRelatorios(cnpjContabilidade);
```

**DEPOIS:** (já está correto, mas verificar se `cnpjContabilidade` é passado)

#### Exemplo 2: Páginas que usam getComprovantes()

**ANTES:**
```javascript
const { data, error } = await getComprovantes();
```

**DEPOIS:**
```javascript
const cnpjContabilidade = await obterCNPJContabilidadeLogada();
const { data, error } = await getComprovantes(cnpjContabilidade);
```

#### Exemplo 3: Páginas que usam getContratosSociais()

**ANTES:**
```javascript
const { data, error } = await getContratosSociais();
```

**DEPOIS:**
```javascript
const cnpjContabilidade = await obterCNPJContabilidadeLogada();
const { data, error } = await getContratosSociais(cnpjContabilidade);
```

**Arquivos que provavelmente precisam de atualização:**
- `verComprovantes.html` / `verComprovantes.js`
- `verContratos.html` / `verContratos.js`
- `contratos.js`
- `comprovantes.js`
- Qualquer arquivo que chame essas funções

**✅ CHECKPOINT:** Todos os arquivos JavaScript devem estar atualizados.

---

## 🧪 PASSO 4: TESTAR {#passo-4-testes}

### 4.1. Teste Básico de Login

1. Abra o sistema no navegador
2. Acesse `CONTABILIDADE/login.html`
3. Faça login com uma contabilidade existente
4. **Abra o Console do navegador** (F12)
5. Procure por estas mensagens:

```
✅ Cliente Supabase criado com sucesso!
🛡️ Proteção de sessão APRIMORADA ativada
📦 CNPJ da contabilidade recuperado do cache: XX.XXX.XXX/XXXX-XX
✅ Sessão inicial válida - monitoramento ativo
```

Se vir mensagens de erro, veja [Resolução de Problemas](#resolução-de-problemas).

### 4.2. Teste de Isolamento de Dados

**Setup:**
- Você precisa de pelo menos 2 contabilidades cadastradas
- Cada uma com alguns clientes

**Teste:**

1. Faça login como **Contabilidade A**
2. Vá até a lista de clientes
3. Anote os CNPJs/IDs dos clientes da Contabilidade A
4. **Abra o Console (F12)** e execute:

```javascript
// Tentar acessar cliente de outra contabilidade (deve falhar)
const { data, error } = await getClienteById(999); // ID de cliente da Contabilidade B
console.log('Resultado:', data, error);
// Esperado: error = "Acesso negado"
```

5. Execute:

```javascript
// Acessar cliente da própria contabilidade (deve funcionar)
const { data, error } = await getClienteById(123); // ID de cliente da Contabilidade A
console.log('Resultado:', data);
// Esperado: data com informações do cliente
```

6. Faça logout
7. Faça login como **Contabilidade B**
8. Repita o teste

**✅ SUCESSO se:**
- Contabilidade A só vê seus próprios clientes
- Tentativa de acessar cliente de outra contabilidade retorna "Acesso negado"
- Contabilidade B só vê seus próprios clientes

### 4.3. Teste de Comprovantes/Contratos

1. Faça login como uma contabilidade
2. Vá até a página de comprovantes
3. **Verifique que** apenas comprovantes dos clientes desta contabilidade são exibidos
4. Abra o Console e execute:

```javascript
const cnpj = await obterCNPJContabilidadeLogada();
console.log('CNPJ Atual:', cnpj);

const { data } = await getComprovantes(cnpj);
console.log('Comprovantes:', data.length);
// Deve mostrar apenas comprovantes desta contabilidade
```

5. Repita para contratos:

```javascript
const { data } = await getContratosSociais(cnpj);
console.log('Contratos:', data.length);
```

### 4.4. Checklist de Testes

Execute cada teste e marque:

- [ ] Login funciona normalmente
- [ ] Dashboard carrega sem erros
- [ ] Lista de clientes mostra apenas clientes da contabilidade logada
- [ ] Não é possível acessar cliente de outra contabilidade via console
- [ ] Comprovantes filtrados corretamente
- [ ] Contratos filtrados corretamente
- [ ] Comunicados funcionam normalmente
- [ ] Upload de documentos funciona
- [ ] Busca de relatórios funciona
- [ ] Logout funciona e limpa cache do CNPJ

**✅ CHECKPOINT:** Todos os testes devem passar antes de continuar.

---

## 🔒 PASSO 5: HABILITAR RLS (OPCIONAL - RECOMENDADO) {#passo-5-rls}

**Row Level Security (RLS)** adiciona uma camada extra de proteção no banco de dados.

⚠️ **ATENÇÃO:**
- Só habilite RLS **DEPOIS** de confirmar que todas as funções JavaScript funcionam
- RLS pode quebrar funcionalidades se as políticas estiverem incorretas
- Recomendado para produção

### 5.1. Entender o que é RLS

RLS garante que, mesmo que o código JavaScript seja burlado, o banco de dados só retornará dados que o usuário tem permissão de ver.

### 5.2. Habilitar RLS

1. Abra o arquivo `DATABASE_SECURITY_UPDATE.sql`
2. **Localize a PARTE 5** (linha ~200)
3. **Descomente** as linhas:

```sql
ALTER TABLE "Clientes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprovantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contratosSocial" ENABLE ROW LEVEL SECURITY;
-- etc...
```

4. **Localize a PARTE 6** (linha ~220)
5. **Descomente TODAS as políticas** (remova `/*` e `*/`)

6. Execute o script no SQL Editor do Supabase

### 5.3. Testar com RLS Habilitado

Repita **TODOS** os testes da seção [Passo 4](#passo-4-testes).

Se algo quebrar:
1. Desabilite RLS temporariamente:
   ```sql
   ALTER TABLE "Clientes" DISABLE ROW LEVEL SECURITY;
   ```
2. Investigue o problema
3. Corrija as políticas
4. Habilite novamente

**✅ CHECKPOINT:** Sistema funcionando 100% com RLS habilitado.

---

## 🐛 RESOLUÇÃO DE PROBLEMAS {#resolução-de-problemas}

### Problema 1: "Cliente Supabase não inicializado"

**Sintoma:** Console mostra erro ao carregar páginas

**Solução:**
```javascript
// Verificar se supabase.js está sendo carregado ANTES de outros scripts
// Ordem correta em todas as páginas HTML:
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="assets/js/supabase.js"></script>
<script src="assets/js/session-guard.js"></script>
<script src="assets/js/[outros-scripts].js"></script>
```

### Problema 2: "Acesso negado" para clientes próprios

**Sintoma:** Contabilidade não consegue acessar seus próprios clientes

**Causa possível:** `CNPJ_CONTABILIDADE` não populado corretamente

**Solução:**
```sql
-- Verificar registros da contabilidade
SELECT CNPJ, NOME_CLIENTE, ADM, CNPJ_CONTABILIDADE
FROM "Clientes"
WHERE ADM = 'ADM';

-- Verificar clientes desta contabilidade
SELECT id, NOME_CLIENTE, CNPJ, CNPJ_CONTABILIDADE
FROM "Clientes"
WHERE CNPJ_CONTABILIDADE = 'XX.XXX.XXX/XXXX-XX'; -- CNPJ da contabilidade

-- Se algum cliente estiver sem CNPJ_CONTABILIDADE, corrigir:
UPDATE "Clientes"
SET CNPJ_CONTABILIDADE = 'XX.XXX.XXX/XXXX-XX'
WHERE id = 123;
```

### Problema 3: Nenhum comprovante/contrato aparece

**Sintoma:** Lista vazia mesmo tendo registros

**Causa possível:** Função não está recebendo `cnpjContabilidade`

**Solução:**
```javascript
// Verificar no Console se o CNPJ está sendo passado:
console.log('CNPJ:', cnpjContabilidade);

// Se estiver undefined ou null, garantir que a função seja chamada assim:
const cnpjContabilidade = await obterCNPJContabilidadeLogada();
const { data } = await getComprovantes(cnpjContabilidade);
```

### Problema 4: Performance lenta após alterações

**Causa possível:** Índices não foram criados

**Solução:**
```sql
-- Verificar se os índices existem:
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('Clientes', 'comprovantes', 'contratosSocial')
AND indexname LIKE 'idx_%';

-- Se não existirem, executar PARTE 3 do DATABASE_SECURITY_UPDATE.sql
```

### Problema 5: RLS bloqueia tudo

**Sintoma:** Após habilitar RLS, nenhum dado é retornado

**Solução temporária:**
```sql
-- Desabilitar RLS enquanto investiga:
ALTER TABLE "Clientes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE comprovantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE "contratosSocial" DISABLE ROW LEVEL SECURITY;
```

**Solução definitiva:**
- Verificar se as políticas RLS estão usando `auth.jwt()->>'email'` corretamente
- Confirmar que o usuário está autenticado no Supabase
- Testar política por política

---

## ✅ CHECKLIST FINAL

Antes de considerar a implementação concluída:

### Banco de Dados
- [ ] Backup realizado
- [ ] Script SQL executado sem erros
- [ ] Todas as tabelas têm coluna `CNPJ_CONTABILIDADE`
- [ ] Registros estão populados corretamente
- [ ] Índices criados

### Código JavaScript
- [ ] `supabase.js` atualizado com correções
- [ ] `session-guard.js` substituído
- [ ] Todas as chamadas para funções corrigidas estão atualizadas
- [ ] Nenhum erro no Console ao carregar páginas

### Testes
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Isolamento de dados funcionando (contabilidade A não vê dados da B)
- [ ] Comprovantes filtrados corretamente
- [ ] Contratos filtrados corretamente
- [ ] Todos os testes da seção 4 passaram

### Segurança
- [ ] Validação de propriedade funcionando
- [ ] CNPJ da contabilidade é verificado em cada requisição
- [ ] Tentativas de acesso não autorizado são bloqueadas
- [ ] RLS habilitado (opcional, mas recomendado)

---

## 📞 SUPORTE

Se encontrar problemas não listados aqui:

1. **Verifique o Console do navegador** (F12) para mensagens de erro
2. **Verifique logs do Supabase** no painel de administração
3. **Revise cada passo deste guia** para garantir que nada foi pulado

**Dicas para depuração:**

```javascript
// Adicionar em qualquer página para debug:
console.log('=== DEBUG INFO ===');
console.log('CNPJ Contabilidade:', await obterCNPJContabilidadeLogada());
console.log('Usuário atual:', await getCurrentUser());
console.log('=================');
```

---

## 🎉 PARABÉNS!

Se você chegou até aqui e todos os testes passaram, seu sistema está **seguro para múltiplas contabilidades**!

Agora você pode:
- ✅ Adicionar novas contabilidades com segurança
- ✅ Ter certeza que os dados estão isolados
- ✅ Escalar o sistema para dezenas ou centenas de contabilidades

**Próximos Passos Recomendados:**
1. Monitorar logs de acesso por algumas semanas
2. Adicionar auditoria de acessos (registrar quem acessa o quê)
3. Implementar alertas para tentativas de acesso não autorizado
4. Revisar permissões de usuários periodicamente

---

**Versão:** 1.0
**Data:** 2025-01-13
**Autor:** Claude Code (Anthropic)
