// Arquivo Supabase.js
console.log('Carregando arquivo supabase.js...');

// Inicialização do cliente Supabase
const supabaseUrl = 'https://osnjsgleardkzrnddlgt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbmpzZ2xlYXJka3pybmRkbGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMTk3MTAsImV4cCI6MjA0Mzg5NTcxMH0.vsSkmzA6PGG09Kxsj1HAuHFhz-JxwimrtPCPV3E_aLg';

// Criar o cliente Supabase e exportá-lo como variável global
var supabase;

try {
    console.log('Criando cliente Supabase...');

    // Verificar se a biblioteca Supabase está carregada
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        console.log('Usando objeto global window.supabase');
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else if (typeof supabaseClient !== 'undefined') {
        console.log('Usando objeto supabaseClient');
        supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);
    } else {
        console.error('ERRO: Biblioteca Supabase não encontrada!');
        alert('Erro: Biblioteca Supabase não foi carregada corretamente. Por favor, recarregue a página.');
    }
    
    // Verificar se o cliente foi criado com sucesso
    if (supabase && typeof supabase.from === 'function') {
        console.log('Cliente Supabase criado com sucesso!');
    } else {
        console.error('ERRO: Cliente Supabase não foi criado corretamente!');
        alert('Erro: Cliente Supabase não foi criado corretamente. Por favor, recarregue a página.');
    }
} catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
    alert('Erro ao inicializar Supabase: ' + error.message);
}

// Funções para autenticação
async function loginWithEmail(email, password) {
  try {
    console.log('Função loginWithEmail chamada com:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    console.log('Resultado do login:', { data, error });
    return { data, error };
  } catch (e) {
    console.error('Erro ao fazer login:', e);
    return { data: null, error: e };
  }
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

async function getCurrentUser() {
  try {
    // Verificar se o cliente Supabase está inicializado
    if (!supabase) {
      console.error('Cliente Supabase não inicializado em getCurrentUser');
      return { data: null, error: new Error('Cliente Supabase não inicializado') };
    }
    
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  } catch (e) {
    console.error('Erro em getCurrentUser:', e);
    return { data: null, error: e };
  }
}

// Funções para Clientes
async function getClientes(cnpjContabilidade) {
  try {
    console.log('Buscando clientes...');

    // Buscar todos os clientes primeiro
    const { data: allClientes, error } = await supabase
      .from('Clientes')
      .select('*')
      .order('NOME_CLIENTE', { ascending: true });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return { data: null, error };
    }

    // Se o CNPJ da contabilidade for fornecido, filtrar manualmente com trim
    let data = allClientes;
    if (cnpjContabilidade) {
      console.log('Filtrando por CNPJ da contabilidade:', cnpjContabilidade);
      const cnpjLimpo = cnpjContabilidade.trim();

      data = allClientes.filter(cliente => {
        if (!cliente.CNPJ_CONTABILIDADE) return false;
        const cnpjClienteLimpo = cliente.CNPJ_CONTABILIDADE.trim();
        return cnpjClienteLimpo === cnpjLimpo;
      });

      console.log(`${data.length} clientes filtrados de ${allClientes.length} total`);
    }
    
    // Processar os dados para adicionar CNPJ_curto se não existir
    if (data && Array.isArray(data)) {
      data.forEach(cliente => {
        if (cliente.CNPJ && !cliente.CNPJ_curto) {
          cliente.CNPJ_curto = gerarCnpjCurto(cliente.CNPJ);
        }
      });
      
      console.log(`${data.length} clientes encontrados`);
    }
    
    return { data, error };
  } catch (e) {
    console.error('Erro em getClientes:', e);
    return { data: null, error: e };
  }
}

// Função para gerar CNPJ_curto a partir do CNPJ completo
function gerarCnpjCurto(cnpj) {
  if (!cnpj) return '';
  
  // Remover caracteres não numéricos
  const cnpjNumerico = cnpj.replace(/\D/g, '');
  
  // Pegar os 6 primeiros dígitos
  return cnpjNumerico.substring(0, 6);
}

// Função para obter os dados da contabilidade logada
async function getContabilidadeByEmail(email) {
  console.log('Função getContabilidadeByEmail chamada com:', email);
  try {
    // Verificar se o cliente Supabase está inicializado
    if (!supabase) {
      console.error('Cliente Supabase não inicializado em getContabilidadeByEmail');
      return { data: null, error: new Error('Cliente Supabase não inicializado') };
    }
    
    // Busca a contabilidade pelo email do usuário logado
    const { data, error } = await supabase
      .from('Clientes')
      .select('*')
      .eq('email', email)
      .eq('ADM', 'ADM')
      .single();
    
    console.log('Resultado getContabilidadeByEmail:', { data, error });
    
    if (error) {
      console.error('Erro ao buscar contabilidade:', error);
      // Tentar buscar sem o filtro ADM
      const { data: dataAlt, error: errorAlt } = await supabase
        .from('Clientes')
        .select('*')
        .eq('email', email)
        .single();
      
      console.log('Resultado alternativo:', { data: dataAlt, error: errorAlt });
      
      if (!errorAlt && dataAlt) {
        return { data: dataAlt, error: null };
      }
    }
    
    return { data, error };
  } catch (e) {
    console.error('Erro em getContabilidadeByEmail:', e);
    return { data: null, error: e };
  }
}

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
    
    // Garantir que o ID seja tratado corretamente
    let idProcessado = id;
    if (!isNaN(Number(id))) {
      idProcessado = Number(id);
      console.log('ID convertido para número em getClienteById:', idProcessado);
    }
    
    console.log('Executando consulta com ID processado:', idProcessado);
    
    const { data, error } = await supabase
      .from('Clientes')
      .select('*')
      .eq('id', idProcessado)
      .single();
    
    // Verificar se o ID retornado corresponde ao solicitado
    if (data && data.id != idProcessado) {
      console.error(`ID retornado (${data.id}) não corresponde ao solicitado (${idProcessado})`);
      return { 
        data: null, 
        error: new Error(`ID retornado (${data.id}) não corresponde ao solicitado (${idProcessado})`) 
      };
    }
    
    console.log('Resultado getClienteById:', { data, error });
    return { data, error };
  } catch (e) {
    console.error('Erro em getClienteById:', e);
    return { data: null, error: e };
  }
}

async function createCliente(clienteData) {
  try {
    console.log('Criando novo cliente com dados simplificados:', JSON.stringify(clienteData));
    
    // Salvar informações da sessão atual da contabilidade
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionToken = sessionData?.session?.access_token;
    console.log('Token da sessão atual salvo para posterior restauração');
    
    // Formatar o CNPJ para uso como email (adicionar @gmail.com)
    const emailCNPJ = `${clienteData.CNPJ}@gmail.com`;
    
    // Gerar a senha - 6 primeiros dígitos do CNPJ (sem pontuação)
    const senhaCNPJ = clienteData.CNPJ.replace(/\D/g, '').substring(0, 6);
    
    console.log('Criando usuário no Authentication:', { email: emailCNPJ, senha: senhaCNPJ });
    
    // 1. Criar o usuário no Authentication
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailCNPJ,
      password: senhaCNPJ,
      options: {
        data: {
          name: clienteData.NOME_CLIENTE,
          cnpj: clienteData.CNPJ
        }
      }
    });
    
    if (authError) {
      console.error('Erro ao criar usuário no Authentication:', authError);
      return { data: null, error: authError };
    }
    
    console.log('Usuário criado com sucesso no Authentication:', authData);
    console.log('ID do usuário criado:', authData.user.id);
    
    // Preparar dados essenciais para inserção na tabela Clientes
    const dadosEssenciais = {
      NOME_CLIENTE: clienteData.NOME_CLIENTE,
      CNPJ: clienteData.CNPJ,
      CNPJ_CONTABILIDADE: clienteData.CNPJ_CONTABILIDADE,
      CNPJ_curto: senhaCNPJ,
      uid: authData.user.id,
      email: emailCNPJ
    };
    
    console.log('Dados essenciais para inserção na tabela Clientes:', JSON.stringify(dadosEssenciais));
    
    // Inserir na tabela Clientes
    console.log('Iniciando inserção na tabela Clientes...');
    const insertResult = await supabase
      .from('Clientes')
      .insert([dadosEssenciais])
      .select();
    
    const { data, error } = insertResult;
    
    if (error) {
      console.error('Erro ao inserir cliente na tabela Clientes:', error);
      console.error('Detalhes do erro:', JSON.stringify(error));
      return { data: null, error };
    }
    
    console.log('Cliente criado com sucesso na tabela Clientes:', data);
    
    // Fazer logout do cliente recém-criado
    await supabase.auth.signOut();
    
    // Restaurar a sessão da contabilidade
    if (sessionToken) {
      console.log('Restaurando sessão da contabilidade...');
      await supabase.auth.setSession({
        access_token: sessionToken,
        refresh_token: sessionData.session.refresh_token
      });
    }
    
    return { data, error: null };
  } catch (e) {
    console.error('Erro ao criar cliente:', e);
    console.error('Stack trace:', e.stack);
    return { data: null, error: e };
  }
}

async function updateCliente(id, clienteData) {
  const { data, error } = await supabase
    .from('Clientes')
    .update(clienteData)
    .eq('id', id)
    .select();
  return { data, error };
}

async function deleteCliente(id) {
  try {
    console.log('Iniciando exclusão do cliente ID:', id);
    
    // 1. Obter os dados do cliente antes de excluir
    const { data: cliente, error: getError } = await supabase
      .from('Clientes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) {
      console.error('Erro ao obter dados do cliente para exclusão:', getError);
      return { error: getError };
    }
    
    if (!cliente) {
      console.error('Cliente não encontrado para exclusão');
      return { error: new Error('Cliente não encontrado') };
    }
    
    console.log('Dados do cliente a ser excluído:', cliente);
    
    // 2. Excluir da tabela Clientes
    console.log('Excluindo cliente da tabela Clientes...');
    const { error: deleteError } = await supabase
      .from('Clientes')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Erro ao excluir cliente da tabela Clientes:', deleteError);
      return { error: deleteError };
    }
    
    // 3. Se o cliente tiver uid, excluir do Authentication
    if (cliente.uid) {
      console.log('Excluindo usuário do Authentication, UID:', cliente.uid);
      try {
        // Tentar excluir o usuário pelo UID
        const { error: authError } = await supabase.auth.admin.deleteUser(cliente.uid);
        
        if (authError) {
          console.error('Erro ao excluir usuário do Authentication:', authError);
          console.log('A exclusão do usuário do Authentication requer permissões de administrador.');
          // Continuar mesmo se falhar a exclusão do Authentication
        } else {
          console.log('Usuário excluído com sucesso do Authentication');
        }
      } catch (e) {
        console.error('Erro ao tentar excluir usuário do Authentication:', e);
        // Continuar mesmo se falhar a exclusão do Authentication
      }
    }
    
    console.log('Cliente excluído com sucesso!');
    return { error: null, data: cliente };
  } catch (e) {
    console.error('Erro ao excluir cliente:', e);
    return { error: e };
  }
}

// Funções para Comunicados
async function getComunicados(cnpjContabilidade) {
  try {
    console.log('Buscando comunicados...');
    
    let query = supabase
      .from('Comunicados')
      .select('*');
    
    // Se o CNPJ da contabilidade for fornecido, filtra por ele
    if (cnpjContabilidade) {
      console.log('Filtrando por CNPJ da contabilidade:', cnpjContabilidade);
      query = query.eq('ContabilidadeComunicado', cnpjContabilidade);
    }
    
    // Ordenar por data (mais recentes primeiro)
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    console.log(`${data?.length || 0} comunicados encontrados`);
    
    return { data, error };
  } catch (e) {
    console.error('Erro em getComunicados:', e);
    return { data: null, error: e };
  }
}

async function getComunicadoById(id) {
  try {
    const { data, error } = await supabase
      .from('Comunicados')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  } catch (e) {
    console.error('Erro em getComunicadoById:', e);
    return { data: null, error: e };
  }
}

async function createComunicado(comunicadoData) {
  try {
    const { data, error } = await supabase
      .from('Comunicados')
      .insert([comunicadoData])
      .select();
    
    return { data, error };
  } catch (e) {
    console.error('Erro em createComunicado:', e);
    return { data: null, error: e };
  }
}

async function updateComunicado(id, comunicadoData) {
  try {
    const { data, error } = await supabase
      .from('Comunicados')
      .update(comunicadoData)
      .eq('id', id)
      .select();
    
    return { data, error };
  } catch (e) {
    console.error('Erro em updateComunicado:', e);
    return { data: null, error: e };
  }
}

async function deleteComunicadoById(id) {
  try {
    const { error } = await supabase
      .from('Comunicados')
      .delete()
      .eq('id', id);
    
    return { error };
  } catch (e) {
    console.error('Erro em deleteComunicadoById:', e);
    return { error: e };
  }
}

// Funções para Comunicados Específicos
async function getComunicadosEspecificos(cnpjContabilidade, cnpjCurtoCliente) {
  try {
    console.log('Buscando comunicados específicos...');
    
    let query = supabase
      .from('comunicadosEspecificos')
      .select('*');
    
    // Se o CNPJ da contabilidade for fornecido, filtra por ele
    if (cnpjContabilidade) {
      console.log('Filtrando por CNPJ da contabilidade:', cnpjContabilidade);
      query = query.eq('CNPJ_CONT', cnpjContabilidade);
    }
    
    // Se o CNPJ curto do cliente for fornecido, filtra por ele
    if (cnpjCurtoCliente) {
      console.log('Filtrando por CNPJ curto do cliente:', cnpjCurtoCliente);
      query = query.eq('FILTRO', cnpjCurtoCliente);
    }
    
    // Ordenar por data (mais recentes primeiro)
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    console.log(`${data?.length || 0} comunicados específicos encontrados`);
    
    return { data, error };
  } catch (e) {
    console.error('Erro em getComunicadosEspecificos:', e);
    return { data: null, error: e };
  }
}

async function createComunicadoEspecifico(comunicadoData) {
  try {
    console.log('Criando comunicado específico:', comunicadoData);
    const { data, error } = await supabase
      .from('comunicadosEspecificos')
      .insert([comunicadoData])
      .select();
    
    return { data, error };
  } catch (e) {
    console.error('Erro em createComunicadoEspecifico:', e);
    return { data: null, error: e };
  }
}

async function updateComunicadoEspecifico(id, comunicadoData) {
  try {
    console.log('Atualizando comunicado específico ID:', id, comunicadoData);
    const { data, error } = await supabase
      .from('comunicadosEspecificos')
      .update(comunicadoData)
      .eq('id', id)
      .select();
    
    return { data, error };
  } catch (e) {
    console.error('Erro em updateComunicadoEspecifico:', e);
    return { data: null, error: e };
  }
}

async function deleteComunicadoEspecifico(id) {
  try {
    console.log('Deletando comunicado específico ID:', id);
    const { error } = await supabase
      .from('comunicadosEspecificos')
      .delete()
      .eq('id', id);
    
    return { error };
  } catch (e) {
    console.error('Erro em deleteComunicadoEspecifico:', e);
    return { error: e };
  }
}

// Atualizar notificação para clientes
async function atualizarNotificacaoClientes(cnpjContabilidade, valor = '1') {
  try {
    const { data, error } = await supabase
      .from('Clientes')
      .update({ NOTFICACAO: valor })
      .eq('CNPJ_CONTABILIDADE', cnpjContabilidade);
    
    return { data, error };
  } catch (e) {
    console.error('Erro em atualizarNotificacaoClientes:', e);
    return { error: e };
  }
}

// Atualizar notificação privada para cliente específico
async function atualizarNotificacaoPrivadaCliente(cnpjCurtoCliente, valor) {
  try {
    const { data, error } = await supabase
      .from('Clientes')
      .update({ NOTIFICACAOPRIV: valor })
      .eq('CNPJ_curto', cnpjCurtoCliente);
    
    return { data, error };
  } catch (e) {
    console.error('Erro em atualizarNotificacaoPrivadaCliente:', e);
    return { error: e };
  }
}

// Funções para Comprovantes
async function getComprovantes() {
  const { data, error } = await supabase
    .from('comprovantes')
    .select('*')
    .order('id', { ascending: false });
  return { data, error };
}

async function getComprovantesByCliente(clienteId) {
  console.log('Buscando comprovantes para o cliente ID:', clienteId);
  
  try {
    // Primeiro, obter o CNPJ do cliente
    const { data: clienteData, error: clienteError } = await getClienteById(clienteId);
    
    if (clienteError || !clienteData) {
      console.error('Erro ao obter CNPJ do cliente:', clienteError);
      return { data: null, error: clienteError || new Error('Cliente não encontrado') };
    }
    
    const cnpjCliente = clienteData.CNPJ;
    console.log('CNPJ do cliente obtido:', cnpjCliente);
    
    if (!cnpjCliente) {
      console.error('Cliente não possui CNPJ');
      return { data: null, error: new Error('Cliente não possui CNPJ') };
    }
    
    // Buscar comprovantes pelo CNPJ do cliente
    console.log('Buscando comprovantes pelo CNPJ:', cnpjCliente);
    const { data, error } = await supabase
      .from('comprovantes')
      .select('*')
      .eq('CNPJ', cnpjCliente)
      .order('created_at', { ascending: false });
    
    console.log('Resultado da busca de comprovantes:', { count: data?.length, error });
    return { data, error };
  } catch (e) {
    console.error('Erro em getComprovantesByCliente:', e);
    return { data: null, error: e };
  }
}

async function getComprovanteById(id) {
  const { data, error } = await supabase
    .from('comprovantes')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

async function createComprovante(comprovanteData) {
  const { data, error } = await supabase
    .from('comprovantes')
    .insert([comprovanteData])
    .select();
  return { data, error };
}

// Funções para Contratos Sociais
async function getContratosSociais() {
  const { data, error } = await supabase
    .from('contratosSocial')
    .select('*')
    .order('id', { ascending: false });
  return { data, error };
}

// Função para buscar comunicados com anexo (documentos da contabilidade)
async function getComunicadosComAnexo(cnpjContabilidade) {
  console.log('Buscando comunicados com anexo para CNPJ:', cnpjContabilidade);

  if (!cnpjContabilidade) {
    console.warn('CNPJ da contabilidade não fornecido');
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('contratosSocial')
      .select('*')
      .eq('CNPJ', cnpjContabilidade)
      .order('created_at', { ascending: false });

    console.log('Resultado da busca de comunicados com anexo:', { count: data?.length, error });
    return { data, error };
  } catch (e) {
    console.error('Erro em getComunicadosComAnexo:', e);
    return { data: null, error: e };
  }
}

async function getContratosByCliente(clienteId) {
  console.log('Buscando contratos para o cliente ID:', clienteId);
  
  try {
    // Primeiro, obter o CNPJ do cliente
    const { data: clienteData, error: clienteError } = await getClienteById(clienteId);
    
    if (clienteError || !clienteData) {
      console.error('Erro ao obter CNPJ do cliente:', clienteError);
      return { data: null, error: clienteError || new Error('Cliente não encontrado') };
    }
    
    const cnpjCliente = clienteData.CNPJ;
    console.log('CNPJ do cliente obtido:', cnpjCliente);
    
    if (!cnpjCliente) {
      console.error('Cliente não possui CNPJ');
      return { data: null, error: new Error('Cliente não possui CNPJ') };
    }
    
    // Buscar contratos pelo CNPJ do cliente
    console.log('Buscando contratos pelo CNPJ:', cnpjCliente);
    const { data, error } = await supabase
      .from('contratosSocial')
      .select('*')
      .eq('CNPJ', cnpjCliente)
      .order('created_at', { ascending: false });
    
    console.log('Resultado da busca de contratos:', { count: data?.length, error });
    return { data, error };
  } catch (e) {
    console.error('Erro em getContratosByCliente:', e);
    return { data: null, error: e };
  }
}

async function getContratoById(id) {
  const { data, error } = await supabase
    .from('contratosSocial')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

async function createContratoSocial(contratoData) {
  const { data, error } = await supabase
    .from('contratosSocial')
    .insert([contratoData])
    .select();
  return { data, error };
}

// Funções para Histórico de Documentos
async function getHistoricoDocumentos() {
  const { data, error } = await supabase
    .from('historico_documentos')
    .select('*')
    .order('id', { ascending: false });
  return { data, error };
}

async function getHistoricoByCliente(clienteId) {
  console.log('Buscando histórico para o cliente ID:', clienteId);
  
  try {
    // Primeiro, obter o CNPJ do cliente
    const { data: clienteData, error: clienteError } = await getClienteById(clienteId);
    
    if (clienteError || !clienteData) {
      console.error('Erro ao obter CNPJ do cliente:', clienteError);
      return { data: null, error: clienteError || new Error('Cliente não encontrado') };
    }
    
    const cnpjCliente = clienteData.CNPJ;
    console.log('CNPJ do cliente obtido:', cnpjCliente);
    
    if (!cnpjCliente) {
      console.error('Cliente não possui CNPJ');
      return { data: null, error: new Error('Cliente não possui CNPJ') };
    }
    
    // Buscar histórico pelo CNPJ do cliente
    console.log('Buscando histórico pelo CNPJ:', cnpjCliente);
    const { data, error } = await supabase
      .from('historico_documentos')
      .select('*')
      .eq('CNPJ', cnpjCliente)
      .order('created_at', { ascending: false });
    
    console.log('Resultado da busca de histórico:', { count: data?.length, error });
    return { data, error };
  } catch (e) {
    console.error('Erro em getHistoricoByCliente:', e);
    return { data: null, error: e };
  }
}

async function getHistoricoById(id) {
  const { data, error } = await supabase
    .from('historico_documentos')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

async function createHistoricoDocumento(historicoData) {
  const { data, error } = await supabase
    .from('historico_documentos')
    .insert([historicoData])
    .select();
  return { data, error };
}

// Funções para AmContabilidade
async function getAmContabilidade() {
  try {
    if (!supabase) {
      console.error('Cliente Supabase não inicializado em getAmContabilidade');
      return { data: null, error: new Error('Cliente Supabase não inicializado') };
    }
    
    const { data, error } = await supabase
      .from('AmContabilidade')
      .select('*')
      .order('id', { ascending: false });
    return { data, error };
  } catch (e) {
    console.error('Erro em getAmContabilidade:', e);
    return { data: null, error: e };
  }
}

async function getAmContabilidadeByCnpjCurto(cnpjCurto) {
  console.log('Função getAmContabilidadeByCnpjCurto chamada com CNPJ_CURTO:', cnpjCurto);
  try {
    // Verificar se o cliente Supabase está inicializado
    if (!supabase) {
      console.error('Cliente Supabase não inicializado em getAmContabilidadeByCnpjCurto');
      return { data: null, error: new Error('Cliente Supabase não inicializado') };
    }
    
    // Verificar se o CNPJ_CURTO é válido
    if (!cnpjCurto) {
      console.error('CNPJ_CURTO inválido fornecido para getAmContabilidadeByCnpjCurto:', cnpjCurto);
      return { data: null, error: new Error('CNPJ_CURTO inválido') };
    }
    
    console.log('Executando consulta com CNPJ_CURTO:', cnpjCurto);
    
    const { data, error } = await supabase
      .from('AmContabilidade')
      .select('*')
      .eq('CNPJ_CURTO', cnpjCurto);
    
    console.log('Resultado getAmContabilidadeByCnpjCurto:', { 
      registrosEncontrados: data ? data.length : 0, 
      error 
    });
    
    return { data, error };
  } catch (e) {
    console.error('Erro em getAmContabilidadeByCnpjCurto:', e);
    return { data: null, error: e };
  }
}

async function createAmContabilidade(contabilidadeData) {
  const { data, error } = await supabase
    .from('AmContabilidade')
    .insert([contabilidadeData])
    .select();
  return { data, error };
}

// Função para formatar CNPJ
function formatarCNPJ(cnpj) {
  if (!cnpj) return '';
  
  // Remover caracteres não numéricos
  cnpj = cnpj.replace(/\D/g, '');
  
  // Verificar se tem o tamanho correto
  if (cnpj.length !== 14) return cnpj;
  
  // Formatar como XX.XXX.XXX/XXXX-XX
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Funções para upload de arquivos
async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  return { data, error };
}

async function getFileUrl(bucket, path) {
  const { data } = await supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
}

// Verificar se as funções foram definidas corretamente
console.log('Verificando funções definidas em supabase.js:');
console.log('getClienteById definida:', typeof getClienteById === 'function');
console.log('getContabilidadeByEmail definida:', typeof getContabilidadeByEmail === 'function');
console.log('getClientes definida:', typeof getClientes === 'function');
console.log('getComunicadosEspecificos definida:', typeof getComunicadosEspecificos === 'function');
console.log('createComunicadoEspecifico definida:', typeof createComunicadoEspecifico === 'function');

// Exportar funções para o escopo global (para garantir que estejam acessíveis)
window.getClienteById = getClienteById;
window.getContabilidadeByEmail = getContabilidadeByEmail;
window.getClientes = getClientes;
window.loginWithEmail = loginWithEmail;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.getComprovantesByCliente = getComprovantesByCliente;
window.getContratosByCliente = getContratosByCliente;
window.getHistoricoByCliente = getHistoricoByCliente;
window.getAmContabilidade = getAmContabilidade;
window.getAmContabilidadeByCnpjCurto = getAmContabilidadeByCnpjCurto;
window.gerarCnpjCurto = gerarCnpjCurto;
window.formatarCNPJ = formatarCNPJ;

// Exportar funções de comunicados
window.getComunicados = getComunicados;
window.createComunicado = createComunicado;
window.updateComunicado = updateComunicado;
window.deleteComunicadoById = deleteComunicadoById;

// Exportar funções de comunicados específicos
window.getComunicadosEspecificos = getComunicadosEspecificos;
window.createComunicadoEspecifico = createComunicadoEspecifico;
window.updateComunicadoEspecifico = updateComunicadoEspecifico;
window.deleteComunicadoEspecifico = deleteComunicadoEspecifico;

// Exportar funções de notificação
window.atualizarNotificacaoClientes = atualizarNotificacaoClientes;
window.atualizarNotificacaoPrivadaCliente = atualizarNotificacaoPrivadaCliente;

// Função para definir uma nova senha para o usuário
async function setCustomPassword(email, novaSenha) {
  try {
    console.log('Tentando definir nova senha para usuário:', email);
    
    // No cliente não podemos usar admin.getUserByEmail - usar diretamente o resetPasswordForEmail
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html'
    });
    
    if (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      return { error };
    }
    
    // Como não podemos definir diretamente a senha, retornamos uma mensagem indicando envio do email
    return { 
      error: null, 
      message: 'Email de redefinição de senha enviado. Por favor, verifique a caixa de entrada.' 
    };
  } catch (e) {
    console.error('Erro ao definir nova senha:', e);
    return { error: e };
  }
}

// Função para resetar a senha para o padrão (redirecionando para abordagem de email)
async function resetPasswordToDefault(cnpj) {
  try {
    console.log('Solicitando redefinição de senha para CNPJ:', cnpj);
    
    // Formatar CNPJ como email
    const email = formatCNPJAsEmail(cnpj);
    
    // Usar o método resetPasswordForEmail disponível na API cliente
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html'
    });
    
    if (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      return { error };
    }
    
    // Retornar mensagem de sucesso
    return { 
      error: null, 
      message: 'Email de redefinição de senha enviado. A senha será redefinida para o padrão após confirmação.' 
    };
  } catch (e) {
    console.error('Erro ao solicitar redefinição de senha:', e);
    return { error: e };
  }
}

// Função auxiliar para formatar CNPJ como email
function formatCNPJAsEmail(cnpj) {
  // Remover caracteres não numéricos
  const cnpjNumerico = cnpj.replace(/\D/g, '');
  return `${cnpjNumerico}@gmail.com`;
}

// Função para verificar e criar a tabela contratosSocial se necessário
async function verificarTabelaContratosSocial() {
    try {
        console.log('Verificando tabela contratosSocial...');
        
        // Tentar fazer uma consulta simples para verificar se a tabela existe
        const { data: testeData, error: testeError } = await supabase
            .from('contratosSocial')
            .select('*')
            .limit(1);
        
        // Se não der erro, a tabela existe
        if (!testeError) {
            console.log('Tabela contratosSocial já existe.');
            return;
        }
        
        // Se der erro e for porque a tabela não existe
        if (testeError && testeError.message && testeError.message.includes('does not exist')) {
            console.log('Tabela contratosSocial não existe, tentando criar...');
            
            // Criar a tabela usando SQL
            const { error: createError } = await supabase.rpc('executar_sql', {
                sql_query: `
                CREATE TABLE IF NOT EXISTS "contratosSocial" (
                    "id" SERIAL PRIMARY KEY,
                    "URL_CONT" TEXT NOT NULL,
                    "NOME" TEXT NOT NULL,
                    "CNPJ" TEXT NOT NULL,
                    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                `
            });
            
            if (createError) {
                console.error('Erro ao criar tabela contratosSocial:', createError);
                
                // Mesmo com erro, vamos tentar inserir documentos
                console.log('Usando tabela alternativa...');
            } else {
                console.log('Tabela contratosSocial criada com sucesso!');
            }
        } else {
            console.error('Erro ao verificar tabela contratosSocial:', testeError);
        }
    } catch (error) {
        console.error('Erro ao verificar/criar tabela contratosSocial:', error);
    }
}

// Função para verificar e criar o bucket CONTRATOS se necessário
async function verificarBucketContratos() {
    try {
        console.log('Verificando bucket CONTRATOS...');
        
        // Verificar se o bucket CONTRATOS existe
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            console.error('Erro ao listar buckets:', bucketsError);
            return;
        }
        
        const existeBucket = buckets.some(bucket => bucket.name === 'CONTRATOS');
        
        if (!existeBucket) {
            // Criar o bucket se não existir
            console.log('Criando bucket CONTRATOS...');
            const { error: createError } = await supabase.storage.createBucket('CONTRATOS', {
                public: true,
                allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                fileSizeLimit: 10485760 // 10MB
            });
            
            if (createError) {
                console.error('Erro ao criar bucket CONTRATOS:', createError);
            } else {
                console.log('Bucket CONTRATOS criado com sucesso!');
                
                // Definir política para acesso público
                try {
                    console.log('Definindo política de acesso público...');
                    const { error: policyError } = await supabase
                        .storage
                        .from('CONTRATOS')
                        .createPolicy('leitura_publica', {
                            name: 'leitura_publica',
                            definition: {
                                read: true
                            }
                        });
                        
                    if (policyError) {
                        console.error('Erro ao criar política:', policyError);
                    } else {
                        console.log('Política de acesso público criada com sucesso!');
                    }
                } catch (policyErr) {
                    console.error('Erro ao tentar definir política:', policyErr);
                }
            }
        } else {
            console.log('Bucket CONTRATOS já existe.');
        }
    } catch (error) {
        console.error('Erro ao verificar/criar bucket:', error);
    }
}

// Função auxiliar para obter CNPJ da contabilidade logada
async function obterCNPJUsuarioLogado() {
    try {
        console.log('Obtendo CNPJ do usuário logado...');
        
        // Verificar se temos o CNPJ em sessionStorage
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        if (userData && userData.CNPJ) {
            console.log('CNPJ encontrado no sessionStorage:', userData.CNPJ);
            return userData.CNPJ;
        }
        
        // Obter usuário atual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user || !session.user.email) {
            console.error('Não foi possível obter o usuário logado');
            return null;
        }
        
        const userEmail = session.user.email;
        console.log('Email do usuário logado:', userEmail);
        
        // Procurar nas tabelas possíveis
        // 1. Tabela Clientes
        const { data: clienteData, error: clienteError } = await supabase
            .from('Clientes')
            .select('CNPJ')
            .eq('email', userEmail)
            .single();
            
        if (!clienteError && clienteData && clienteData.CNPJ) {
            const cnpj = clienteData.CNPJ;
            console.log('CNPJ encontrado na tabela Clientes:', cnpj);
            
            // Salvar para uso futuro
            sessionStorage.setItem('userData', JSON.stringify({
                ...userData,
                CNPJ: cnpj
            }));
            
            return cnpj;
        }
        
        // 2. Tabela USUARIOS
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('USUARIOS')
            .select('CNPJ')
            .eq('EMAIL', userEmail)
            .single();
            
        if (!usuarioError && usuarioData && usuarioData.CNPJ) {
            const cnpj = usuarioData.CNPJ;
            console.log('CNPJ encontrado na tabela USUARIOS:', cnpj);
            
            // Salvar para uso futuro
            sessionStorage.setItem('userData', JSON.stringify({
                ...userData,
                CNPJ: cnpj
            }));
            
            return cnpj;
        }
        
        console.error('Não foi possível encontrar o CNPJ do usuário logado');
        return null;
    } catch (error) {
        console.error('Erro ao obter CNPJ do usuário logado:', error);
        return null;
    }
}

// Executar verificações quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    verificarBucketContratos();
    verificarTabelaContratosSocial();
});

console.log('Arquivo supabase.js carregado com sucesso!');
