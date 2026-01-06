// Arquivo de Migração de Clientes entre Bancos Supabase
console.log('Carregando arquivo migration.js...');

// Configurações dos bancos de dados
const BANCO_ORIGEM = {
    url: 'https://osnjsgleardkzrnddlgt.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbmpzZ2xlYXJka3pybmRkbGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMTk3MTAsImV4cCI6MjA0Mzg5NTcxMH0.vsSkmzA6PGG09Kxsj1HAuHFhz-JxwimrtPCPV3E_aLg'
};

const BANCO_DESTINO = {
    url: 'https://jplshxnojablvnxuddcg.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbHNoeG5vamFibHZueHVkZGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTI0MDksImV4cCI6MjA4MzEyODQwOX0.KbPYmb6Xx61mGO4u5ZRdsHLlE0dFPKZHGJODlSFl968',
    serviceRole: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbHNoeG5vamFibHZueHVkZGNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU1MjQwOSwiZXhwIjoyMDgzMTI4NDA5fQ.C5lObeKiYl1PRUSiw00BJ0QEhmxgK4X7695NfC9LZD4'
};

// Clientes Supabase
let supabaseOrigem = null;
let supabaseDestino = null;

// Função para inicializar os clientes Supabase
function inicializarClientesSupabase() {
    try {
        console.log('Inicializando clientes Supabase para migração...');

        // Verificar se a biblioteca Supabase está carregada (mesma lógica do supabase.js)
        let createClient = null;

        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            console.log('Usando window.supabase.createClient');
            createClient = window.supabase.createClient;
        } else if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
            console.log('Usando supabase.createClient (global)');
            createClient = supabase.createClient;
        } else if (typeof supabaseClient !== 'undefined' && typeof supabaseClient.createClient === 'function') {
            console.log('Usando supabaseClient.createClient');
            createClient = supabaseClient.createClient;
        } else {
            console.error('ERRO: Biblioteca Supabase não encontrada!');
            console.log('window.supabase:', typeof window.supabase);
            console.log('supabase (global):', typeof supabase);
            console.log('supabaseClient:', typeof supabaseClient);
            throw new Error('Biblioteca Supabase não está carregada. Por favor, recarregue a página.');
        }

        // Criar cliente para banco de origem
        supabaseOrigem = createClient(BANCO_ORIGEM.url, BANCO_ORIGEM.key);
        console.log('Cliente Supabase ORIGEM criado com sucesso');

        // Criar cliente para banco de destino
        supabaseDestino = createClient(BANCO_DESTINO.url, BANCO_DESTINO.key);
        console.log('Cliente Supabase DESTINO criado com sucesso');

        return true;
    } catch (error) {
        console.error('Erro ao inicializar clientes Supabase:', error);
        return false;
    }
}

// Função para buscar todos os clientes do banco origem
async function buscarClientesOrigem() {
    try {
        console.log('Buscando clientes do banco origem...');

        const { data, error } = await supabaseOrigem
            .from('Clientes')
            .select('NOME_CLIENTE, CNPJ, CNPJ_CONTABILIDADE')
            .order('NOME_CLIENTE', { ascending: true });

        if (error) {
            console.error('Erro ao buscar clientes da origem:', error);
            return { data: null, error };
        }

        console.log(`${data.length} clientes encontrados no banco origem`);
        return { data, error: null };
    } catch (e) {
        console.error('Erro em buscarClientesOrigem:', e);
        return { data: null, error: e };
    }
}

// Função para criar cliente no banco destino
async function criarClienteDestino(clienteData) {
    try {
        console.log('Criando cliente no banco destino:', clienteData.NOME_CLIENTE);

        // Salvar informações da sessão atual
        const { data: sessionData } = await supabaseDestino.auth.getSession();
        const sessionToken = sessionData?.session?.access_token;

        // Formatar o CNPJ para uso como email
        const emailCNPJ = `${clienteData.CNPJ}@gmail.com`;

        // Gerar a senha - 6 primeiros dígitos do CNPJ
        const cnpjNumerico = clienteData.CNPJ.replace(/\D/g, '');
        const senhaCNPJ = cnpjNumerico.substring(0, 6);

        console.log('  Email:', emailCNPJ);
        console.log('  Senha:', senhaCNPJ);

        // 1. Criar o usuário no Authentication do banco destino
        const { data: authData, error: authError } = await supabaseDestino.auth.signUp({
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
            console.error('  Erro ao criar usuário no Authentication:', authError);
            return { data: null, error: authError };
        }

        console.log('  Usuário criado no Authentication, UID:', authData.user.id);

        // 2. Preparar dados para inserção na tabela Clientes
        const dadosEssenciais = {
            NOME_CLIENTE: clienteData.NOME_CLIENTE,
            CNPJ: clienteData.CNPJ,
            CNPJ_CONTABILIDADE: clienteData.CNPJ_CONTABILIDADE,
            CNPJ_curto: senhaCNPJ,
            uid: authData.user.id,
            email: emailCNPJ
        };

        // 3. Inserir na tabela Clientes do banco destino
        const { data, error } = await supabaseDestino
            .from('Clientes')
            .insert([dadosEssenciais])
            .select();

        if (error) {
            console.error('  Erro ao inserir na tabela Clientes:', error);
            return { data: null, error };
        }

        console.log('  Cliente criado com sucesso na tabela Clientes');

        // 4. Fazer logout do cliente recém-criado
        await supabaseDestino.auth.signOut();

        // 5. Restaurar sessão se havia
        if (sessionToken) {
            await supabaseDestino.auth.setSession({
                access_token: sessionToken,
                refresh_token: sessionData.session.refresh_token
            });
        }

        return { data, error: null };
    } catch (e) {
        console.error('  Erro em criarClienteDestino:', e);
        return { data: null, error: e };
    }
}

// Função para atualizar o progresso da migração
function atualizarProgressoMigração(atual, total, nomeCliente, status, mensagemErro = '') {
    const progressBar = document.getElementById('migrationProgressBar');
    const progressText = document.getElementById('migrationProgressText');
    const progressList = document.getElementById('migrationProgressList');

    // Atualizar barra de progresso
    const percentual = Math.round((atual / total) * 100);
    if (progressBar) {
        progressBar.style.width = `${percentual}%`;
        progressBar.textContent = `${percentual}%`;
    }

    // Atualizar texto de progresso
    if (progressText) {
        progressText.textContent = `Migrando cliente ${atual}/${total}`;
    }

    // Adicionar item na lista de progresso
    if (progressList) {
        const item = document.createElement('div');
        item.className = `migration-item migration-${status}`;

        const icone = status === 'success' ? '✓' : '✗';
        const classe = status === 'success' ? 'text-success' : 'text-danger';

        item.innerHTML = `
            <span class="${classe}">${icone}</span>
            <span>${nomeCliente}</span>
            ${mensagemErro ? `<span class="text-danger small">${mensagemErro}</span>` : ''}
        `;

        progressList.appendChild(item);

        // Scroll automático para o último item
        progressList.scrollTop = progressList.scrollHeight;
    }
}

// Função principal de migração
async function executarMigração() {
    console.log('Iniciando migração de clientes...');

    try {
        // 1. Inicializar clientes Supabase
        const inicializado = inicializarClientesSupabase();
        if (!inicializado) {
            throw new Error('Falha ao inicializar conexões Supabase');
        }

        // 2. Buscar clientes do banco origem
        const { data: clientes, error: erroOrigem } = await buscarClientesOrigem();

        if (erroOrigem || !clientes) {
            throw new Error('Falha ao buscar clientes do banco origem: ' + (erroOrigem?.message || 'Erro desconhecido'));
        }

        if (clientes.length === 0) {
            throw new Error('Nenhum cliente encontrado no banco origem');
        }

        console.log(`Total de ${clientes.length} clientes para migrar`);

        // 3. Migrar cada cliente
        let sucessos = 0;
        let erros = 0;

        for (let i = 0; i < clientes.length; i++) {
            const cliente = clientes[i];
            const clienteAtual = i + 1;

            console.log(`\n[${clienteAtual}/${clientes.length}] Migrando: ${cliente.NOME_CLIENTE}`);

            // Criar cliente no banco destino
            const { data, error } = await criarClienteDestino(cliente);

            if (error) {
                erros++;
                console.error(`Erro ao migrar cliente ${cliente.NOME_CLIENTE}:`, error);
                atualizarProgressoMigração(
                    clienteAtual,
                    clientes.length,
                    cliente.NOME_CLIENTE,
                    'error',
                    error.message
                );
            } else {
                sucessos++;
                console.log(`Cliente ${cliente.NOME_CLIENTE} migrado com sucesso`);
                atualizarProgressoMigração(
                    clienteAtual,
                    clientes.length,
                    cliente.NOME_CLIENTE,
                    'success'
                );
            }

            // Pequeno delay para não sobrecarregar o servidor
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 4. Retornar resultado final
        console.log('\n=== MIGRAÇÃO CONCLUÍDA ===');
        console.log(`Sucessos: ${sucessos}`);
        console.log(`Erros: ${erros}`);
        console.log(`Total: ${clientes.length}`);

        return {
            success: true,
            total: clientes.length,
            sucessos,
            erros
        };

    } catch (e) {
        console.error('Erro fatal na migração:', e);
        return {
            success: false,
            error: e.message
        };
    }
}

// Função para abrir o modal de migração
function abrirModalMigração() {
    const modal = document.getElementById('migrationModal');
    if (modal) {
        // Resetar progresso
        const progressBar = document.getElementById('migrationProgressBar');
        const progressText = document.getElementById('migrationProgressText');
        const progressList = document.getElementById('migrationProgressList');
        const startBtn = document.getElementById('startMigrationBtn');
        const closeBtn = document.getElementById('closeMigrationBtn');

        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
        }

        if (progressText) {
            progressText.textContent = 'Aguardando início...';
        }

        if (progressList) {
            progressList.innerHTML = '';
        }

        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Iniciar Migração';
        }

        if (closeBtn) {
            closeBtn.disabled = false;
        }

        modal.style.display = 'flex';
    }
}

// Função para fechar o modal de migração
function fecharModalMigração() {
    const modal = document.getElementById('migrationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('Configurando eventos de migração...');

    // Botão de migração
    const migrationBtn = document.getElementById('migrationBtn');
    if (migrationBtn) {
        migrationBtn.addEventListener('click', () => {
            console.log('Botão de Migração clicado');
            abrirModalMigração();
        });
    }

    // Botão de iniciar migração
    const startBtn = document.getElementById('startMigrationBtn');
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            console.log('Iniciando processo de migração...');

            // Desabilitar botões durante migração
            startBtn.disabled = true;
            startBtn.textContent = 'Migrando...';

            const closeBtn = document.getElementById('closeMigrationBtn');
            if (closeBtn) closeBtn.disabled = true;

            // Executar migração
            const resultado = await executarMigração();

            // Reabilitar botões
            startBtn.disabled = false;
            if (closeBtn) closeBtn.disabled = false;

            if (resultado.success) {
                startBtn.textContent = 'Migração Concluída';
                alert(`Migração concluída!\n\nTotal: ${resultado.total}\nSucessos: ${resultado.sucessos}\nErros: ${resultado.erros}`);
            } else {
                startBtn.textContent = 'Erro na Migração';
                alert(`Erro na migração:\n${resultado.error}`);
            }
        });
    }

    // Botão de fechar modal
    const closeBtn = document.getElementById('closeMigrationBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', fecharModalMigração);
    }

    // Fechar modal ao clicar fora
    const modal = document.getElementById('migrationModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fecharModalMigração();
            }
        });
    }
});

console.log('Arquivo migration.js carregado com sucesso!');
