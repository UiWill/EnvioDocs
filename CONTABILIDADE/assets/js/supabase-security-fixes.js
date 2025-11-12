// ============================================================================
// CORREÇÕES DE SEGURANÇA PARA MULTI-TENANCY - supabase.js
// ============================================================================
// Este arquivo contém as funções corrigidas que devem SUBSTITUIR as funções
// originais no arquivo supabase.js
//
// IMPORTANTE: Aplicar essas correções ANTES de adicionar novas contabilidades
// ============================================================================

// ----------------------------------------------------------------------------
// 1. MIDDLEWARE DE AUTORIZAÇÃO - Adicionar no INÍCIO do supabase.js
// ----------------------------------------------------------------------------

/**
 * Valida se o usuário logado tem permissão para acessar dados de um cliente
 * @param {string} clienteCNPJ - CNPJ do cliente que está sendo acessado
 * @param {string} contabilidadeCNPJ - CNPJ da contabilidade logada
 * @returns {boolean} true se tem permissão, lança erro se não tiver
 */
async function validarPropriedadeCliente(clienteCNPJ, contabilidadeCNPJ) {
    if (!clienteCNPJ || !contabilidadeCNPJ) {
        console.error('❌ SEGURANÇA: CNPJ inválido na validação', { clienteCNPJ, contabilidadeCNPJ });
        throw new Error('Dados inválidos para validação de propriedade');
    }

    // Buscar o cliente pelo CNPJ
    const { data: cliente, error } = await supabase
        .from('Clientes')
        .select('CNPJ_CONTABILIDADE, ADM')
        .eq('CNPJ', clienteCNPJ)
        .single();

    if (error || !cliente) {
        console.error('❌ SEGURANÇA: Cliente não encontrado', clienteCNPJ);
        throw new Error('Cliente não encontrado');
    }

    // Se for uma contabilidade (ADM='ADM'), permitir acesso aos próprios dados
    if (cliente.ADM === 'ADM' && cliente.CNPJ === contabilidadeCNPJ) {
        return true;
    }

    // Se for cliente final, verificar se pertence à contabilidade logada
    if (cliente.CNPJ_CONTABILIDADE !== contabilidadeCNPJ) {
        console.error('🚨 TENTATIVA DE ACESSO NÃO AUTORIZADO!', {
            clienteCNPJ,
            cnpjContabilidadeDoCliente: cliente.CNPJ_CONTABILIDADE,
            cnpjContabilidadeLogada: contabilidadeCNPJ
        });
        throw new Error('Acesso negado: Cliente não pertence a esta contabilidade');
    }

    return true;
}

/**
 * Obtém o CNPJ da contabilidade atualmente logada
 * @returns {Promise<string>} CNPJ da contabilidade logada
 */
async function obterCNPJContabilidadeLogada() {
    try {
        const { data: userData, error: userError } = await getCurrentUser();
        if (userError || !userData || !userData.user) {
            throw new Error('Usuário não autenticado');
        }

        const userEmail = userData.user.email;
        const { data: contabilidade, error } = await supabase
            .from('Clientes')
            .select('CNPJ')
            .eq('email', userEmail)
            .eq('ADM', 'ADM')
            .single();

        if (error || !contabilidade) {
            throw new Error('Contabilidade não encontrada para o usuário logado');
        }

        return contabilidade.CNPJ;
    } catch (e) {
        console.error('Erro ao obter CNPJ da contabilidade logada:', e);
        throw e;
    }
}

// ----------------------------------------------------------------------------
// 2. SUBSTITUIR getComprovantes() - CRÍTICO
// ----------------------------------------------------------------------------
// PROBLEMA: Busca TODOS os comprovantes sem filtro
// SOLUÇÃO: Sempre filtrar por contabilidade

async function getComprovantes(cnpjContabilidade) {
    console.log('🔒 getComprovantes com filtro de segurança:', cnpjContabilidade);

    if (!cnpjContabilidade) {
        console.error('❌ SEGURANÇA: Tentativa de buscar comprovantes sem CNPJ da contabilidade');
        return { data: null, error: new Error('CNPJ da contabilidade é obrigatório') };
    }

    try {
        // Buscar todos os clientes da contabilidade
        const { data: clientes, error: clientesError } = await supabase
            .from('Clientes')
            .select('CNPJ')
            .eq('CNPJ_CONTABILIDADE', cnpjContabilidade);

        if (clientesError) {
            console.error('Erro ao buscar clientes:', clientesError);
            return { data: null, error: clientesError };
        }

        if (!clientes || clientes.length === 0) {
            console.log('Nenhum cliente encontrado para esta contabilidade');
            return { data: [], error: null };
        }

        // Extrair CNPJs dos clientes
        const cnpjsClientes = clientes.map(c => c.CNPJ);

        // Buscar comprovantes apenas dos clientes desta contabilidade
        const { data, error } = await supabase
            .from('comprovantes')
            .select('*')
            .in('CNPJ', cnpjsClientes)
            .order('id', { ascending: false });

        console.log(`✅ ${data?.length || 0} comprovantes encontrados para contabilidade ${cnpjContabilidade}`);
        return { data, error };
    } catch (e) {
        console.error('Erro em getComprovantes:', e);
        return { data: null, error: e };
    }
}

// ----------------------------------------------------------------------------
// 3. SUBSTITUIR getContratosSociais() - CRÍTICO
// ----------------------------------------------------------------------------
// PROBLEMA: Busca TODOS os contratos sem filtro
// SOLUÇÃO: Sempre filtrar por contabilidade

async function getContratosSociais(cnpjContabilidade) {
    console.log('🔒 getContratosSociais com filtro de segurança:', cnpjContabilidade);

    if (!cnpjContabilidade) {
        console.error('❌ SEGURANÇA: Tentativa de buscar contratos sem CNPJ da contabilidade');
        return { data: null, error: new Error('CNPJ da contabilidade é obrigatório') };
    }

    try {
        // Buscar todos os clientes da contabilidade
        const { data: clientes, error: clientesError } = await supabase
            .from('Clientes')
            .select('CNPJ')
            .eq('CNPJ_CONTABILIDADE', cnpjContabilidade);

        if (clientesError) {
            console.error('Erro ao buscar clientes:', clientesError);
            return { data: null, error: clientesError };
        }

        if (!clientes || clientes.length === 0) {
            console.log('Nenhum cliente encontrado para esta contabilidade');
            return { data: [], error: null };
        }

        // Extrair CNPJs dos clientes
        const cnpjsClientes = clientes.map(c => c.CNPJ);

        // Buscar contratos apenas dos clientes desta contabilidade
        const { data, error } = await supabase
            .from('contratosSocial')
            .select('*')
            .in('CNPJ', cnpjsClientes)
            .order('id', { ascending: false });

        console.log(`✅ ${data?.length || 0} contratos encontrados para contabilidade ${cnpjContabilidade}`);
        return { data, error };
    } catch (e) {
        console.error('Erro em getContratosSociais:', e);
        return { data: null, error: e };
    }
}

// ----------------------------------------------------------------------------
// 4. SUBSTITUIR getHistoricoDocumentos() - CRÍTICO
// ----------------------------------------------------------------------------

async function getHistoricoDocumentos(cnpjContabilidade) {
    console.log('🔒 getHistoricoDocumentos com filtro de segurança:', cnpjContabilidade);

    if (!cnpjContabilidade) {
        console.error('❌ SEGURANÇA: Tentativa de buscar histórico sem CNPJ da contabilidade');
        return { data: null, error: new Error('CNPJ da contabilidade é obrigatório') };
    }

    try {
        // Buscar todos os clientes da contabilidade
        const { data: clientes, error: clientesError } = await supabase
            .from('Clientes')
            .select('CNPJ')
            .eq('CNPJ_CONTABILIDADE', cnpjContabilidade);

        if (clientesError) {
            console.error('Erro ao buscar clientes:', clientesError);
            return { data: null, error: clientesError };
        }

        if (!clientes || clientes.length === 0) {
            console.log('Nenhum cliente encontrado para esta contabilidade');
            return { data: [], error: null };
        }

        // Extrair CNPJs dos clientes
        const cnpjsClientes = clientes.map(c => c.CNPJ);

        // Buscar histórico apenas dos clientes desta contabilidade
        const { data, error } = await supabase
            .from('historico_documentos')
            .select('*')
            .in('cliente_cnpj', cnpjsClientes)
            .order('id', { ascending: false });

        console.log(`✅ ${data?.length || 0} registros de histórico encontrados para contabilidade ${cnpjContabilidade}`);
        return { data, error };
    } catch (e) {
        console.error('Erro em getHistoricoDocumentos:', e);
        return { data: null, error: e };
    }
}

// ----------------------------------------------------------------------------
// 5. ADICIONAR VALIDAÇÃO em getClienteById() - CRÍTICO
// ----------------------------------------------------------------------------

async function getClienteById(id) {
    console.log('Função getClienteById chamada com ID:', id);
    try {
        // Verificar se o cliente Supabase está inicializado
        if (!supabase) {
            console.error('Cliente Supabase não inicializado em getClienteById');
            return { data: null, error: new Error('Cliente Supabase não inicializado') };
        }

        // Verificar se o ID é válido
        if (!id) {
            console.error('ID inválido fornecido para getClienteById:', id);
            return { data: null, error: new Error('ID inválido') };
        }

        // Obter CNPJ da contabilidade logada
        let cnpjContabilidadeLogada;
        try {
            cnpjContabilidadeLogada = await obterCNPJContabilidadeLogada();
        } catch (e) {
            console.error('❌ SEGURANÇA: Não foi possível identificar contabilidade logada');
            return { data: null, error: new Error('Erro de autenticação') };
        }

        // Processar ID para garantir que seja inteiro
        let idProcessado = id;
        if (typeof id === 'string') {
            if (id.includes('.')) {
                idProcessado = id.split('.')[0];
                console.log(`ID contém ponto decimal. Usando parte inteira: ${idProcessado}`);
            }
            idProcessado = parseInt(idProcessado, 10);
        }

        if (isNaN(idProcessado)) {
            console.error('ID não é um número válido:', id);
            return { data: null, error: new Error('ID deve ser um número válido') };
        }

        console.log('Executando consulta com ID processado:', idProcessado);

        const { data, error } = await supabase
            .from('Clientes')
            .select('*')
            .eq('id', idProcessado)
            .single();

        if (error) {
            console.error('Erro ao buscar cliente:', error);
            return { data: null, error };
        }

        if (!data) {
            console.error('Cliente não encontrado com ID:', idProcessado);
            return { data: null, error: new Error('Cliente não encontrado') };
        }

        // 🔒 VALIDAÇÃO DE SEGURANÇA
        // Verificar se o cliente pertence à contabilidade logada
        if (data.ADM !== 'ADM') {
            // É um cliente final, verificar CNPJ_CONTABILIDADE
            if (data.CNPJ_CONTABILIDADE !== cnpjContabilidadeLogada) {
                console.error('🚨 TENTATIVA DE ACESSO NÃO AUTORIZADO!', {
                    clienteId: id,
                    cnpjContabilidadeDoCliente: data.CNPJ_CONTABILIDADE,
                    cnpjContabilidadeLogada
                });
                return { data: null, error: new Error('Acesso negado') };
            }
        } else {
            // É uma contabilidade, só pode acessar seus próprios dados
            if (data.CNPJ !== cnpjContabilidadeLogada) {
                console.error('🚨 TENTATIVA DE ACESSO NÃO AUTORIZADO A OUTRA CONTABILIDADE!');
                return { data: null, error: new Error('Acesso negado') };
            }
        }

        console.log('✅ Acesso autorizado ao cliente ID:', id);
        return { data, error: null };
    } catch (e) {
        console.error('Erro em getClienteById:', e);
        return { data: null, error: e };
    }
}

// ----------------------------------------------------------------------------
// 6. ADICIONAR VALIDAÇÃO em getComprovanteById() - CRÍTICO
// ----------------------------------------------------------------------------

async function getComprovanteById(id) {
    console.log('🔒 getComprovanteById com validação:', id);

    try {
        const { data, error } = await supabase
            .from('comprovantes')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return { data: null, error: error || new Error('Comprovante não encontrado') };
        }

        // 🔒 VALIDAÇÃO DE SEGURANÇA
        const cnpjContabilidadeLogada = await obterCNPJContabilidadeLogada();
        await validarPropriedadeCliente(data.CNPJ, cnpjContabilidadeLogada);

        console.log('✅ Acesso autorizado ao comprovante ID:', id);
        return { data, error: null };
    } catch (e) {
        console.error('❌ Erro ou acesso negado em getComprovanteById:', e);
        return { data: null, error: e };
    }
}

// ----------------------------------------------------------------------------
// 7. ADICIONAR VALIDAÇÃO em getContratoById() - CRÍTICO
// ----------------------------------------------------------------------------

async function getContratoById(id) {
    console.log('🔒 getContratoById com validação:', id);

    try {
        const { data, error } = await supabase
            .from('contratosSocial')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return { data: null, error: error || new Error('Contrato não encontrado') };
        }

        // 🔒 VALIDAÇÃO DE SEGURANÇA
        const cnpjContabilidadeLogada = await obterCNPJContabilidadeLogada();
        await validarPropriedadeCliente(data.CNPJ, cnpjContabilidadeLogada);

        console.log('✅ Acesso autorizado ao contrato ID:', id);
        return { data, error: null };
    } catch (e) {
        console.error('❌ Erro ou acesso negado em getContratoById:', e);
        return { data: null, error: e };
    }
}

// ----------------------------------------------------------------------------
// 8. ADICIONAR VALIDAÇÃO em getHistoricoById() - CRÍTICO
// ----------------------------------------------------------------------------

async function getHistoricoById(id) {
    console.log('🔒 getHistoricoById com validação:', id);

    try {
        const { data, error } = await supabase
            .from('historico_documentos')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return { data: null, error: error || new Error('Histórico não encontrado') };
        }

        // 🔒 VALIDAÇÃO DE SEGURANÇA
        const cnpjContabilidadeLogada = await obterCNPJContabilidadeLogada();
        await validarPropriedadeCliente(data.cliente_cnpj, cnpjContabilidadeLogada);

        console.log('✅ Acesso autorizado ao histórico ID:', id);
        return { data, error: null };
    } catch (e) {
        console.error('❌ Erro ou acesso negado em getHistoricoById:', e);
        return { data: null, error: e };
    }
}

// ----------------------------------------------------------------------------
// 9. EXPORTAR NOVAS FUNÇÕES
// ----------------------------------------------------------------------------

// Adicionar ao final do supabase.js, junto com as outras exportações:
window.validarPropriedadeCliente = validarPropriedadeCliente;
window.obterCNPJContabilidadeLogada = obterCNPJContabilidadeLogada;

console.log('✅ Correções de segurança multi-tenancy carregadas');
