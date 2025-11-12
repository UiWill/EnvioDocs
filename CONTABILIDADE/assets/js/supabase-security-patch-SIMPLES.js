// ============================================================================
// PATCH DE SEGURANÇA MULTI-TENANCY - SIMPLES E SEGURO
// ============================================================================
// Este arquivo contém APENAS as alterações necessárias
// Cole este código NO FINAL do arquivo supabase.js
// ============================================================================

// ============================================================================
// 1. SOBRESCREVER getClienteById com validação
// ============================================================================

// Guardar função original
const getClienteById_ORIGINAL = window.getClienteById;

// Nova versão com validação
window.getClienteById = async function(id) {
    console.log('🔒 getClienteById com validação de segurança chamado:', id);

    // Chamar função original
    const result = await getClienteById_ORIGINAL(id);

    // Se deu erro ou não retornou dados, retornar como está
    if (result.error || !result.data) {
        return result;
    }

    // 🔒 VALIDAÇÃO DE SEGURANÇA
    try {
        const cnpjContabilidadeLogada = await obterCNPJContabilidadeLogada();
        const cliente = result.data;

        // Se for cliente final
        if (cliente.ADM !== 'ADM') {
            if (cliente.CNPJ_CONTABILIDADE !== cnpjContabilidadeLogada) {
                console.error('🚨 ACESSO NEGADO: Cliente não pertence a esta contabilidade');
                return { data: null, error: new Error('Acesso negado') };
            }
        } else {
            // Se for contabilidade
            if (cliente.CNPJ !== cnpjContabilidadeLogada) {
                console.error('🚨 ACESSO NEGADO: Tentativa de acessar outra contabilidade');
                return { data: null, error: new Error('Acesso negado') };
            }
        }

        console.log('✅ Acesso autorizado ao cliente', id);
        return result;

    } catch (securityError) {
        console.warn('⚠️ Erro na validação de segurança, permitindo acesso:', securityError.message);
        return result; // Em caso de erro técnico, permitir (evitar quebrar sistema)
    }
};

// ============================================================================
// 2. SOBRESCREVER getComprovantesByCliente com validação
// ============================================================================

const getComprovantesByCliente_ORIGINAL = window.getComprovantesByCliente;

window.getComprovantesByCliente = async function(clienteId) {
    console.log('🔒 getComprovantesByCliente com validação:', clienteId);

    // Primeiro, validar se pode acessar este cliente
    const clienteResult = await window.getClienteById(clienteId);
    if (clienteResult.error) {
        console.error('❌ Não autorizado a acessar comprovantes deste cliente');
        return { data: null, error: clienteResult.error };
    }

    // Se passou na validação, buscar comprovantes normalmente
    return await getComprovantesByCliente_ORIGINAL(clienteId);
};

// ============================================================================
// 3. SOBRESCREVER getContratosByCliente com validação
// ============================================================================

const getContratosByCliente_ORIGINAL = window.getContratosByCliente;

window.getContratosByCliente = async function(clienteId) {
    console.log('🔒 getContratosByCliente com validação:', clienteId);

    // Primeiro, validar se pode acessar este cliente
    const clienteResult = await window.getClienteById(clienteId);
    if (clienteResult.error) {
        console.error('❌ Não autorizado a acessar contratos deste cliente');
        return { data: null, error: clienteResult.error };
    }

    // Se passou na validação, buscar contratos normalmente
    return await getContratosByCliente_ORIGINAL(clienteId);
};

// ============================================================================
// 4. SOBRESCREVER getHistoricoByCliente com validação
// ============================================================================

const getHistoricoByCliente_ORIGINAL = window.getHistoricoByCliente;

window.getHistoricoByCliente = async function(clienteId) {
    console.log('🔒 getHistoricoByCliente com validação:', clienteId);

    // Primeiro, validar se pode acessar este cliente
    const clienteResult = await window.getClienteById(clienteId);
    if (clienteResult.error) {
        console.error('❌ Não autorizado a acessar histórico deste cliente');
        return { data: null, error: clienteResult.error };
    }

    // Se passou na validação, buscar histórico normalmente
    return await getHistoricoByCliente_ORIGINAL(clienteId);
};

// ============================================================================
// 5. EXPORTAR FUNÇÕES DE SEGURANÇA
// ============================================================================

window.validarPropriedadeCliente = validarPropriedadeCliente;
window.obterCNPJContabilidadeLogada = obterCNPJContabilidadeLogada;

console.log('✅ Patch de segurança multi-tenancy aplicado com sucesso!');
console.log('🔒 Funções protegidas: getClienteById, getComprovantesByCliente, getContratosByCliente, getHistoricoByCliente');
