// Comunicados.js - Implementação das funções para gerenciamento de comunicados

// Variáveis globais para paginação e filtros
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let searchTerm = '';
let tipoFiltro = 'todos';
let comunicadosData = [];
let clientesData = [];
let currentContabilidadeCNPJ = '';

// Aguardar o carregamento do DOM
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM carregado, inicializando página de comunicados...');
    
    // Inicializar o loader
    setTimeout(function() {
        const loader = document.querySelector('.loader-wrapper');
        loader.classList.add('loader-hidden');
    }, 1000);

    // Verificar autenticação
    const autenticado = await verificarAutenticacao();
    
    if (!autenticado) {
        return; // Não continuar se não estiver autenticado
    }
    
    // Inicializar o toggle do sidebar
    initSidebarToggle();
    
    // Inicializar o botão de logout
    initLogoutButton();
    
    // Carregar lista de comunicados e clientes
    await loadClientes();
    await loadComunicados();
    
    // Inicializar eventos dos botões
    initButtons();
    
    // Inicializar eventos de busca e filtro
    initSearchAndFilter();
    
    // Configurar modal de anexos
    configurarModalAnexos();
});

// Função para verificar autenticação e redirecionar se necessário
async function verificarAutenticacao() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            // Usuário não está autenticado, redirecionar para login
            window.location.href = 'index.html';
            return false;
        }
        
        // Verificar permissões
        const email = session.user.email;
        
        if (!email) {
            window.location.href = 'index.html';
            return false;
        }
        
        // Buscar dados do usuário para exibição
        const { data: usuario, error: usuarioError } = await supabase
            .from('USUARIOS')
            .select('*')
            .eq('EMAIL', email)
            .single();
            
        if (usuarioError || !usuario) {
            console.error('Erro ao obter dados do usuário:', usuarioError);
            // Mesmo com erro, permitir continuar, mas sem dados personalizados
        } else {
            // Salvar dados do usuário na sessão para uso em outras partes do sistema
            sessionStorage.setItem('userData', JSON.stringify(usuario));
            
            // Exibir informações do usuário na sidebar
            document.getElementById('userName').textContent = usuario.NOME || email;
            document.getElementById('userRole').textContent = 'Contabilidade';
            
            // Se tiver avatar, exibir
            if (usuario.AVATAR_URL) {
                document.getElementById('userAvatar').src = usuario.AVATAR_URL;
            }
            
            console.log('Usuário autenticado com sucesso:', usuario.NOME, 'CNPJ:', usuario.CNPJ);
        }
        
        // Carregar dados completos do usuário e da contabilidade
        await loadUserData(email);
        
        return true;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = 'index.html';
        return false;
    }
}

// Função para carregar dados do usuário e da contabilidade
async function loadUserData(email) {
    try {
        console.log('Carregando dados do usuário:', email);
        
        // Buscar dados da contabilidade pelo email
        const { data, error } = await getContabilidadeByEmail(email);
        
        if (error) {
            console.error('Erro ao carregar dados da contabilidade:', error);
            return;
        }
        
        if (!data) {
            console.error('Nenhum dado de contabilidade encontrado para o email:', email);
            return;
        }
        
        console.log('Dados da contabilidade obtidos:', data);
        
        // Armazenar CNPJ da contabilidade para uso em outras funções
        currentContabilidadeCNPJ = data.CNPJ || '';
        
        // Atualizar informações do usuário na interface
        const nomeContabilidade = data.NOME_CLIENTE || 'Usuário';
        const roleUsuario = data.ADM || 'Usuário';
        
        // Atualizar nome do usuário em diferentes locais possíveis
        const userNameElements = document.querySelectorAll('#userName, .user-name');
        userNameElements.forEach(el => {
            if (el) el.textContent = nomeContabilidade;
        });
        
        // Atualizar cargo/role do usuário em diferentes locais possíveis
        const userRoleElements = document.querySelectorAll('#userRole, .user-role');
        userRoleElements.forEach(el => {
            if (el) el.textContent = roleUsuario;
        });
        
        // Verificar se temos uma URL de imagem
        let logoUrl = data.LOGO_URL;
        console.log('URL da logo obtida:', logoUrl);
        
        if (!logoUrl || logoUrl === '') {
            logoUrl = 'assets/images/avatar-placeholder.png';
            console.log('Usando imagem de placeholder');
        }
        
        // Tratamento para URLs de storage do Supabase
        if (logoUrl && logoUrl.includes('storage/v1/object')) {
            // Se já for uma URL completa do Supabase, usá-la diretamente
            console.log('Usando URL do storage do Supabase');
        } else if (logoUrl && logoUrl.startsWith('assets/')) {
            // Se for um caminho relativo, manter como está
            console.log('Usando caminho relativo local');
        } else {
            // Caso seja apenas o nome do arquivo no bucket
            logoUrl = 'assets/images/avatar-placeholder.png';
            console.log('URL não reconhecida, usando placeholder');
        }
        
        // Atualizar todas as imagens de avatar
        const userAvatarImgs = document.querySelectorAll('#userAvatar, .user-avatar img');
        console.log('Elementos de imagem encontrados:', userAvatarImgs.length);
        
        userAvatarImgs.forEach(img => {
            if (img && img.tagName === 'IMG') {
                console.log('Atualizando src da imagem:', img);
                img.src = logoUrl;
                img.alt = nomeContabilidade;
                
                // Garantir que a imagem seja carregada mesmo com cache
                img.onload = () => console.log('Imagem carregada com sucesso');
                img.onerror = (e) => console.error('Erro ao carregar imagem:', e);
                
                // Forçar recarregamento
                const timestamp = new Date().getTime();
                img.src = logoUrl + (logoUrl.includes('?') ? '&' : '?') + 't=' + timestamp;
            }
        });
        
        // Substituir ícones por imagens
        const avatarContainers = document.querySelectorAll('.user-avatar');
        console.log('Containers de avatar encontrados:', avatarContainers.length);
        
        avatarContainers.forEach(container => {
            if (container) {
                // Verificar se já tem uma imagem
                const existingImg = container.querySelector('img');
                if (!existingImg) {
                    console.log('Substituindo ícone por imagem em:', container);
                    
                    // Limpar conteúdo (remover ícones)
                    container.innerHTML = '';
                    
                    // Criar e adicionar imagem
                    const img = document.createElement('img');
                    img.src = logoUrl;
                    img.alt = nomeContabilidade;
                    img.id = 'userAvatar';
                    img.classList.add('avatar-img');
                    
                    // Garantir que a imagem seja carregada
                    img.onload = () => console.log('Imagem criada carregada com sucesso');
                    img.onerror = (e) => console.error('Erro ao carregar imagem criada:', e);
                    
                    container.appendChild(img);
                    
                    // Forçar recarregamento
                    const timestamp = new Date().getTime();
                    img.src = logoUrl + (logoUrl.includes('?') ? '&' : '?') + 't=' + timestamp;
                }
            }
        });
        
        console.log('Dados do usuário carregados com sucesso. CNPJ da contabilidade:', currentContabilidadeCNPJ);
    } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
    }
}

// Função para inicializar o toggle do sidebar
function initSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
    });
}

// Função para inicializar o botão de logout
function initLogoutButton() {
    const logoutBtn = document.getElementById('logoutButton');
    
    logoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Confirmar logout
        if (confirm('Tem certeza que deseja sair?')) {
            await signOut();
            window.location.href = 'login.html';
        }
    });
}

// Função para carregar lista de clientes
async function loadClientes() {
    try {
        console.log('Iniciando carregamento de clientes...');
        
        // Obter o CNPJ da contabilidade atual
        let cnpjContabilidade = currentContabilidadeCNPJ;
        
        // Se não tivermos o CNPJ ainda, tentar obtê-lo de outras fontes
        if (!cnpjContabilidade) {
            console.log('CNPJ da contabilidade não disponível na variável global, buscando em outras fontes...');
            
            // Verificar no sessionStorage
            const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
            if (userData && userData.CNPJ) {
                cnpjContabilidade = userData.CNPJ;
                console.log('CNPJ obtido do sessionStorage:', cnpjContabilidade);
            } else if (typeof obterCNPJUsuarioLogado === 'function') {
                // Tentar obter através da função auxiliar
                cnpjContabilidade = await obterCNPJUsuarioLogado();
                console.log('CNPJ obtido da função auxiliar:', cnpjContabilidade);
            }
        }
        
        if (!cnpjContabilidade) {
            console.warn('CNPJ da contabilidade não disponível, não será possível carregar clientes específicos');
            return;
        }
        
        console.log('Carregando clientes da contabilidade:', cnpjContabilidade);
        
        // Buscar clientes no Supabase
        const { data, error } = await getClientes(cnpjContabilidade);
        
        if (error) {
            console.error('Erro ao carregar clientes:', error);
            throw new Error(error.message);
        }
        
        // Armazenar dados para uso posterior
        clientesData = data || [];
        
        console.log(`${clientesData.length} clientes carregados`);
        
        // Preencher dropdown de clientes específicos no modal
        populateClientesDropdown();
        
        return clientesData;
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        return [];
    }
}

// Função para preencher dropdown de clientes no modal
function populateClientesDropdown() {
    console.log('Iniciando populateClientesDropdown...');
    const clienteSelect = document.getElementById('clienteEspecifico');
    
    if (!clienteSelect) {
        console.error('Elemento clienteEspecifico não encontrado');
        return;
    }
    
    console.log('Clientes disponíveis:', clientesData ? clientesData.length : 0);
    
    // Se não tiver dados de clientes ainda, tentar carregar novamente
    if (!clientesData || clientesData.length === 0) {
        console.log('Não há dados de clientes, tentando carregar novamente...');
        loadClientes().then(() => {
            // Tentar popular novamente após carregar os clientes
            setTimeout(populateClientesDropdown, 500);
        });
        return;
    }
    
    // Limpar opções existentes, mantendo apenas a primeira
    while (clienteSelect.options.length > 1) {
        clienteSelect.remove(1);
    }
    
    // Ordenar clientes pelo nome
    const sortedClientes = [...clientesData].sort((a, b) => {
        const nomeA = a.NOME_CLIENTE || '';
        const nomeB = b.NOME_CLIENTE || '';
        return nomeA.localeCompare(nomeB);
    });
    
    // Adicionar clientes ao dropdown
    sortedClientes.forEach(cliente => {
        if (cliente.NOME_CLIENTE && cliente.CNPJ) {
            const option = document.createElement('option');
            option.value = cliente.CNPJ;
            option.textContent = `${cliente.NOME_CLIENTE} (${formatCNPJ(cliente.CNPJ)})`;
            clienteSelect.appendChild(option);
        }
    });
    
    console.log(`Dropdown populado com ${clienteSelect.options.length - 1} clientes`);
}

// Função para formatar CNPJ
function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    
    // Remover caracteres não numéricos
    cnpj = cnpj.replace(/\D/g, '');
    
    // Aplicar máscara
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Função para carregar lista de comunicados
async function loadComunicados() {
    try {
        // Mostrar loader
        document.getElementById('comunicadosLoader').style.display = 'flex';
        document.getElementById('comunicadosError').style.display = 'none';
        
        console.log('Carregando comunicados...');
        
        // Buscar comunicados gerais no Supabase
        const { data: comunicadosGerais, error: errorGerais } = await getComunicados(currentContabilidadeCNPJ);
        
        if (errorGerais) {
            throw new Error(errorGerais.message);
        }
        
        // Buscar comunicados específicos no Supabase
        const { data: comunicadosEspecificos, error: errorEspecificos } = await getComunicadosEspecificos(currentContabilidadeCNPJ);
        
        if (errorEspecificos) {
            throw new Error(errorEspecificos.message);
        }
        
        // Combinar e processar os dois tipos de comunicados
        const comunicadosProcessados = [];
        
        // Processar comunicados gerais
        if (comunicadosGerais && Array.isArray(comunicadosGerais)) {
            comunicadosProcessados.push(...comunicadosGerais.map(comunicado => ({
                id: comunicado.id,
                titulo: comunicado.Titulo,
                comunicado: comunicado.comunicado,
                ContabilidadeComunicado: comunicado.ContabilidadeComunicado,
                createdAt: comunicado.created_at || comunicado.createdAt,
                tipo: 'geral',
                cnpjCurtoESP: null
            })));
        }
        
        // Processar comunicados específicos
        if (comunicadosEspecificos && Array.isArray(comunicadosEspecificos)) {
            comunicadosProcessados.push(...comunicadosEspecificos.map(comunicado => ({
                id: comunicado.id,
                titulo: comunicado.TITULO,
                comunicado: comunicado.COMUNICADO,
                ContabilidadeComunicado: comunicado.CNPJ_CONT,
                createdAt: comunicado.created_at || comunicado.createdAt,
                tipo: 'especifico',
                cnpjCurtoESP: comunicado.FILTRO
            })));
        }
        
        // Armazenar dados para uso posterior
        comunicadosData = comunicadosProcessados;
        
        console.log(`${comunicadosData.length} comunicados carregados (${comunicadosGerais?.length || 0} gerais, ${comunicadosEspecificos?.length || 0} específicos)`);
        
        // Aplicar filtros e exibir
        applyFiltersAndDisplay();
    } catch (error) {
        console.error('Erro ao carregar comunicados:', error);
        
        // Esconder loader
        document.getElementById('comunicadosLoader').style.display = 'none';
        
        // Mostrar mensagem de erro
        const errorElement = document.getElementById('comunicadosError');
        errorElement.innerHTML = `<p>Erro ao carregar comunicados: ${error.message}</p>`;
        errorElement.style.display = 'block';
    }
}

// Função para aplicar filtros e exibir comunicados
function applyFiltersAndDisplay() {
    try {
        // Filtrar dados
        let filteredData = [...comunicadosData];
        
        // Aplicar filtro de busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredData = filteredData.filter(comunicado => 
                (comunicado.titulo && comunicado.titulo.toLowerCase().includes(term)) || 
                (comunicado.comunicado && comunicado.comunicado.toLowerCase().includes(term))
            );
        }
        
        // Aplicar filtro de tipo
        if (tipoFiltro !== 'todos') {
            filteredData = filteredData.filter(comunicado => {
                if (tipoFiltro === 'geral') {
                    return comunicado.tipo === 'geral'; // Comunicados gerais
                } else if (tipoFiltro === 'especifico') {
                    return comunicado.tipo === 'especifico'; // Comunicados específicos
                }
                return true;
            });
        }
        
        // Calcular total de páginas
        totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
        
        // Ajustar página atual se necessário
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        
        // Calcular índices para paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Obter dados da página atual
        const currentPageData = filteredData.slice(startIndex, endIndex);
        
        // Exibir comunicados
        displayComunicados(currentPageData);
        
        // Atualizar paginação
        updatePagination();
        
        // Esconder loader
        document.getElementById('comunicadosLoader').style.display = 'none';
    } catch (error) {
        console.error('Erro ao aplicar filtros:', error);
        
        // Esconder loader
        document.getElementById('comunicadosLoader').style.display = 'none';
        
        // Mostrar mensagem de erro
        const errorElement = document.getElementById('comunicadosError');
        errorElement.innerHTML = `<p>Erro ao processar dados: ${error.message}</p>`;
        errorElement.style.display = 'block';
    }
}

// Função para exibir comunicados na tabela
function displayComunicados(comunicados) {
    const tbody = document.getElementById('comunicadosTableBody');
    if (!tbody) {
        console.error('Elemento comunicadosTableBody não encontrado');
        return;
    }
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    // Se não houver comunicados
    if (!comunicados || comunicados.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 5; // Abrange todas as colunas
        emptyCell.textContent = 'Nenhum comunicado encontrado';
        emptyCell.className = 'empty-data';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
        return;
    }
    
    // Adicionar comunicados à tabela
    comunicados.forEach(comunicado => {
        // Criar elementos de linha e células
        const row = document.createElement('tr');
        
        // Célula do título
        const titleCell = document.createElement('td');
        titleCell.textContent = comunicado.titulo || 'Sem título';
        row.appendChild(titleCell);
        
        // Célula do tipo
        const typeCell = document.createElement('td');
        typeCell.textContent = comunicado.tipo === 'especifico' ? 'Específico' : 'Geral';
        row.appendChild(typeCell);
        
        // Célula da data
        const dateCell = document.createElement('td');
        const createdAt = comunicado.createdAt || comunicado.created_at;
        const data = createdAt ? new Date(createdAt) : new Date();
        const dataFormatada = data.toLocaleDateString('pt-BR');
        dateCell.textContent = dataFormatada;
        row.appendChild(dateCell);
        
        // Célula do cliente
        const clientCell = document.createElement('td');
        let clienteTexto = 'Todos';
        if (comunicado.tipo === 'especifico' && comunicado.cnpjCurtoESP) {
            // Encontrar nome do cliente correspondente
            const cliente = clientesData.find(c => c.CNPJ && c.CNPJ.includes(comunicado.cnpjCurtoESP));
            clienteTexto = cliente ? cliente.NOME_CLIENTE : `Cliente (${comunicado.cnpjCurtoESP})`;
        }
        clientCell.textContent = clienteTexto;
        row.appendChild(clientCell);
        
        // Célula de ações
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';
        
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions-container';
        
        // Botão de visualizar
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-action';
        viewBtn.setAttribute('title', 'Visualizar');
        viewBtn.innerHTML = '<i class="bi bi-eye"></i>';
        viewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão visualizar clicado para ID:', comunicado.id);
            viewComunicado(comunicado.id);
        });
        
        // Botão de editar
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-action';
        editBtn.setAttribute('title', 'Editar');
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão editar clicado para ID:', comunicado.id);
            editComunicado(comunicado.id);
        });
        
        // Botão de excluir
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-action';
        deleteBtn.setAttribute('title', 'Excluir');
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão excluir clicado para ID:', comunicado.id);
            deleteComunicado(comunicado.id, comunicado.titulo);
        });
        
        // Adicionar botões ao container de ações
        actionsContainer.appendChild(viewBtn);
        actionsContainer.appendChild(editBtn);
        actionsContainer.appendChild(deleteBtn);
        actionsCell.appendChild(actionsContainer);
        row.appendChild(actionsCell);
        
        // Adicionar linha à tabela
        tbody.appendChild(row);
    });
}

// Função para atualizar a paginação
function updatePagination() {
    const pagination = document.getElementById('pagination');
    
    // Limpar paginação
    pagination.innerHTML = '';
    
    // Se houver apenas uma página, não exibir paginação
    if (totalPages <= 1) return;
    
    // Botão anterior
    pagination.innerHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
            ${currentPage === 1 ? 'disabled' : 'onclick="changePage(' + (currentPage - 1) + ')"'}>
            <i class="bi bi-chevron-left"></i>
        </button>
    `;
    
    // Determinar quais páginas mostrar
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Páginas
    for (let i = startPage; i <= endPage; i++) {
        pagination.innerHTML += `
            <button class="pagination-btn ${currentPage === i ? 'active' : ''}" 
                onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Botão próximo
    pagination.innerHTML += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
            ${currentPage === totalPages ? 'disabled' : 'onclick="changePage(' + (currentPage + 1) + ')"'}>
            <i class="bi bi-chevron-right"></i>
        </button>
    `;
}

// Função para mudar de página
function changePage(page) {
    currentPage = page;
    applyFiltersAndDisplay();
}

// Função para inicializar eventos de busca e filtro
function initSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const filtroSelect = document.getElementById('filtroSelect');
    
    if (!searchInput || !searchButton || !filtroSelect) {
        console.error('Elementos de busca e filtro não encontrados');
        return;
    }
    
    // Evento de busca
    searchButton.addEventListener('click', function() {
        searchTerm = searchInput.value.trim();
        currentPage = 1;
        applyFiltersAndDisplay();
    });
    
    // Evento de busca ao pressionar Enter
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchTerm = searchInput.value.trim();
            currentPage = 1;
            applyFiltersAndDisplay();
        }
    });
    
    // Evento de filtro de tipo
    filtroSelect.addEventListener('change', function() {
        tipoFiltro = this.value;
        currentPage = 1;
        applyFiltersAndDisplay();
    });
}

// Função para inicializar eventos dos botões
function initButtons() {
    // Botão de novo comunicado
    const novoComunicadoBtn = document.getElementById('novoComunicadoBtn');
    if (!novoComunicadoBtn) {
        console.error('Botão novoComunicadoBtn não encontrado');
        return;
    }
    
    novoComunicadoBtn.addEventListener('click', function() {
        openComunicadoModal();
    });
    
    // Botão de fechar modal
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            closeComunicadoModal();
        });
    }
    
    // Botão de cancelar
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeComunicadoModal();
        });
    }
    
    // Botão de salvar
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveComunicado();
        });
    }
    
    // Tipo de filtro (mostrar/esconder campo de cliente específico)
    const tipoFiltro = document.getElementById('tipoFiltro');
    if (tipoFiltro) {
        tipoFiltro.addEventListener('change', function() {
            console.log('Tipo filtro alterado para:', this.value);
            const clienteEspecificoGroup = document.getElementById('clienteEspecificoGroup');
            if (clienteEspecificoGroup) {
                // Exibir ou ocultar o campo de cliente específico com base no valor selecionado
                clienteEspecificoGroup.style.display = this.value === 'especifico' ? 'block' : 'none';
                
                // Se está exibindo o campo, garantir que o dropdown de clientes esteja populado
                if (this.value === 'especifico') {
                    console.log('Verificando se o dropdown de clientes está populado...');
                    const clienteSelect = document.getElementById('clienteEspecifico');
                    // Se há apenas a opção padrão "Selecione um cliente", popular novamente
                    if (clienteSelect && clienteSelect.options.length <= 1) {
                        console.log('Populando dropdown de clientes específicos...');
                        populateClientesDropdown();
                    }
                }
            } else {
                console.error('Elemento clienteEspecificoGroup não encontrado');
            }
        });
    }
    
    // Botões do modal de visualização
    const closeViewModal = document.getElementById('closeViewModal');
    if (closeViewModal) {
        closeViewModal.addEventListener('click', function() {
            closeViewComunicadoModal();
        });
    }
    
    const closeViewBtn = document.getElementById('closeViewBtn');
    if (closeViewBtn) {
        closeViewBtn.addEventListener('click', function() {
            closeViewComunicadoModal();
        });
    }
    
    // Botões do modal de exclusão
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', function() {
            closeDeleteComunicadoModal();
        });
    }
    
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            closeDeleteComunicadoModal();
        });
    }
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            confirmDeleteComunicado();
        });
    }
}

// Função para abrir modal de comunicado (novo ou edição)
function openComunicadoModal(comunicado = null) {
    console.log('Função openComunicadoModal chamada', comunicado);
    
    // Limpar formulário
    const form = document.getElementById('comunicadoForm');
    if (!form) {
        console.error('Formulário comunicadoForm não encontrado');
        return;
    }
    
    form.reset();
    
    // Definir título do modal
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = comunicado ? 'Editar Comunicado' : 'Novo Comunicado';
    }
    
    // Armazenar ID do comunicado (se for edição)
    const comunicadoIdInput = document.getElementById('comunicadoId');
    if (comunicadoIdInput) {
        comunicadoIdInput.value = comunicado ? comunicado.id : '';
    }
    
    // Preencher campos se for edição
    if (comunicado) {
        const tituloInput = document.getElementById('titulo');
        const conteudoInput = document.getElementById('conteudo');
        const tipoFiltroSelect = document.getElementById('tipoFiltro');
        const clienteEspecificoGroup = document.getElementById('clienteEspecificoGroup');
        
        if (tituloInput) tituloInput.value = comunicado.titulo || '';
        if (conteudoInput) conteudoInput.value = comunicado.comunicado || '';
        
        if (tipoFiltroSelect) {
            // Definir tipo baseado no tipo do comunicado
            const tipoValor = comunicado.tipo === 'especifico' ? 'especifico' : 'geral';
            tipoFiltroSelect.value = tipoValor;
            
            // Mostrar ou esconder campo de cliente específico
            if (clienteEspecificoGroup) {
                clienteEspecificoGroup.style.display = tipoValor === 'especifico' ? 'block' : 'none';
            }
        }
        
        // Selecionar cliente específico se houver
        if (comunicado.tipo === 'especifico' && comunicado.cnpjCurtoESP) {
            const clienteSelect = document.getElementById('clienteEspecifico');
            if (clienteSelect) {
                // Encontrar cliente com o CNPJ correspondente
                const cliente = clientesData.find(c => c.CNPJ && c.CNPJ.includes(comunicado.cnpjCurtoESP));
                
                if (cliente) {
                    clienteSelect.value = cliente.CNPJ;
                } else {
                    // Se não encontrar, criar uma opção temporária
                    const option = document.createElement('option');
                    option.value = comunicado.cnpjCurtoESP;
                    option.textContent = `Cliente (${comunicado.cnpjCurtoESP})`;
                    clienteSelect.appendChild(option);
                    clienteSelect.value = comunicado.cnpjCurtoESP;
                }
            }
        }
    } else {
        // Esconder campo de cliente específico para novo comunicado
        const clienteEspecificoGroup = document.getElementById('clienteEspecificoGroup');
        if (clienteEspecificoGroup) {
            clienteEspecificoGroup.style.display = 'none';
        }
    }
    
    // Abrir modal - Corrigido para garantir que o backdrop e o modal sejam exibidos corretamente
    const backdrop = document.getElementById('comunicadoModalBackdrop');
    const modal = document.getElementById('comunicadoModal');
    
    if (!backdrop || !modal) {
        console.error('Modal ou backdrop não encontrado');
        return;
    }
    
    // Garantir que o backdrop seja visível primeiro
    backdrop.style.display = 'flex';
    
    // Adicionar a classe active após um pequeno delay para garantir a animação
    setTimeout(() => {
        backdrop.classList.add('active');
    }, 10);
}

// Função para fechar modal de comunicado
function closeComunicadoModal() {
    console.log('Função closeComunicadoModal chamada');
    const backdrop = document.getElementById('comunicadoModalBackdrop');
    
    if (!backdrop) {
        console.error('Backdrop não encontrado');
        return;
    }
    
    // Primeiro, remove a classe active para iniciar a animação de fechamento
    backdrop.classList.remove('active');
    
    // Após a animação terminar, esconder o elemento completamente
    setTimeout(() => {
        backdrop.style.display = 'none';
    }, 300); // Tempo deve corresponder à duração da transição no CSS
}

// Função para abrir modal de visualização de comunicado
window.viewComunicado = async function(id) {
    try {
        console.log('Visualizando comunicado ID:', id);
        
        // Primeiro verificar se é um comunicado geral
        let comunicado = null;
        const { data: comunicadoGeral } = await supabase
            .from('Comunicados')
            .select('*')
            .eq('id', id)
            .single();
            
        if (comunicadoGeral) {
            comunicado = {
                id: comunicadoGeral.id,
                titulo: comunicadoGeral.Titulo,
                comunicado: comunicadoGeral.comunicado,
                tipo: 'geral',
                createdAt: comunicadoGeral.created_at,
                clientes_que_leram: comunicadoGeral.clientes_que_leram || []
            };
        } else {
            // Se não for geral, buscar nos específicos
            const { data: comunicadoEspecifico } = await supabase
                .from('comunicadosEspecificos')
                .select('*')
                .eq('id', id)
                .single();
                
            if (comunicadoEspecifico) {
                comunicado = {
                    id: comunicadoEspecifico.id,
                    titulo: comunicadoEspecifico.TITULO,
                    comunicado: comunicadoEspecifico.COMUNICADO,
                    tipo: 'especifico',
                    cnpjCurtoESP: comunicadoEspecifico.FILTRO,
                    createdAt: comunicadoEspecifico.created_at,
                    clientes_que_leram: comunicadoEspecifico.clientes_que_leram || []
                };
            }
        }

        if (!comunicado) {
            console.error('Comunicado não encontrado');
            showError('Comunicado não encontrado');
            return;
        }
        
        console.log('Comunicado encontrado:', comunicado);
        
        // Preencher dados do modal
        const viewTituloElem = document.getElementById('viewTitulo');
        const viewDataElem = document.getElementById('viewData');
        const viewTipoElem = document.getElementById('viewTipo');
        const viewClienteContainerElem = document.getElementById('viewClienteContainer');
        const viewClienteElem = document.getElementById('viewCliente');
        const viewConteudoElem = document.getElementById('viewConteudo');
        const viewClientesLidoSection = document.getElementById('clientesLidoSection');
        const viewClientesLidoList = document.querySelector('#viewClientesLido .clientes-list');
        const loadingClientes = document.querySelector('#viewClientesLido .loading-clientes');
        
        if (viewTituloElem) viewTituloElem.textContent = comunicado.titulo || 'Sem título';
        
        // Formatar data
        if (viewDataElem) {
            const data = comunicado.createdAt ? new Date(comunicado.createdAt) : new Date();
            viewDataElem.textContent = data.toLocaleDateString('pt-BR');
        }
        
        // Definir tipo
        if (viewTipoElem) viewTipoElem.textContent = comunicado.tipo === 'especifico' ? 'Específico' : 'Geral';
        
        // Exibir cliente específico se houver
        if (viewClienteContainerElem && viewClienteElem) {
            if (comunicado.tipo === 'especifico' && comunicado.cnpjCurtoESP) {
                // Encontrar nome do cliente
                const { data: cliente } = await supabase
                    .from('Clientes')
                    .select('NOME_CLIENTE')
                    .eq('CNPJ_curto', comunicado.cnpjCurtoESP)
                    .single();
                    
                const clienteNome = cliente ? cliente.NOME_CLIENTE : `Cliente (${comunicado.cnpjCurtoESP})`;
                
                viewClienteElem.textContent = clienteNome;
                viewClienteContainerElem.style.display = 'block';
            } else {
                viewClienteContainerElem.style.display = 'none';
            }
        }
        
        // Conteúdo do comunicado
        if (viewConteudoElem) viewConteudoElem.textContent = comunicado.comunicado || '';
        
        // Processar clientes que leram
        if (viewClientesLidoSection && viewClientesLidoList && loadingClientes) {
            // Mostrar loading
            loadingClientes.style.display = 'flex';
            viewClientesLidoList.innerHTML = '';
            
            try {
                // Garantir que clientesLeram seja um array válido
                let clientesLeram = [];
                
                // Se vier como string JSON, fazer o parse
                if (typeof comunicado.clientes_que_leram === 'string') {
                    try {
                        clientesLeram = JSON.parse(comunicado.clientes_que_leram);
                    } catch (e) {
                        console.error('Erro ao fazer parse dos clientes:', e);
                    }
                } 
                // Se já for array, usar direto
                else if (Array.isArray(comunicado.clientes_que_leram)) {
                    clientesLeram = comunicado.clientes_que_leram;
                }
                
                console.log('Clientes que leram:', clientesLeram);
                
                if (!Array.isArray(clientesLeram) || clientesLeram.length === 0) {
                    viewClientesLidoList.innerHTML = '<li>Nenhum cliente leu este comunicado ainda</li>';
                    viewClientesLidoList.classList.add('empty');
                } else {
                    viewClientesLidoList.classList.remove('empty');
                    
                    // Buscar informações dos clientes
                    const clientesPromises = clientesLeram.map(async (uid) => {
                        console.log('Buscando cliente com uid:', uid);
                        const { data: cliente } = await supabase
                            .from('Clientes')
                            .select('NOME_CLIENTE, CNPJ')
                            .eq('uid', uid)
                            .single();
                        return cliente;
                    });
                    
                    const clientes = await Promise.all(clientesPromises);
                    console.log('Dados dos clientes encontrados:', clientes);
                    
                    // Criar lista de clientes
                    const clientesHTML = clientes
                        .filter(cliente => cliente) // Remover nulls
                        .map(cliente => `
                            <li>
                                <i class="bi bi-check-circle-fill"></i>
                                ${cliente.NOME_CLIENTE || 'Cliente sem nome'} 
                                (${formatCNPJ(cliente.CNPJ)})
                            </li>
                        `)
                        .join('');
                    
                    if (clientesHTML) {
                        viewClientesLidoList.innerHTML = clientesHTML;
                    } else {
                        viewClientesLidoList.innerHTML = '<li>Erro ao carregar informações dos clientes</li>';
                        viewClientesLidoList.classList.add('empty');
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar clientes que leram:', error);
                viewClientesLidoList.innerHTML = '<li>Erro ao carregar informações dos clientes</li>';
                viewClientesLidoList.classList.add('empty');
            } finally {
                loadingClientes.style.display = 'none';
            }
        }
        
        // Abrir modal
        document.getElementById('viewComunicadoModalBackdrop').classList.add('active');
        
    } catch (error) {
        console.error('Erro ao visualizar comunicado:', error);
        showError('Erro ao visualizar comunicado');
    }
};

// Função para fechar modal de visualização
window.closeViewComunicadoModal = function() {
    document.getElementById('viewComunicadoModalBackdrop').classList.remove('active');
};

// Adicionar evento de clique para o botão de fechar
document.addEventListener('DOMContentLoaded', function() {
    const closeViewModalBtn = document.getElementById('closeViewModal');
    if (closeViewModalBtn) {
        closeViewModalBtn.addEventListener('click', closeViewComunicadoModal);
    }
    
    const closeViewBtn = document.getElementById('closeViewBtn');
    if (closeViewBtn) {
        closeViewBtn.addEventListener('click', closeViewComunicadoModal);
    }
});

// Função para editar comunicado
function editComunicado(id) {
    console.log('Chamando função editComunicado com ID:', id);
    
    // Encontrar o comunicado na lista
    if (!comunicadosData || !Array.isArray(comunicadosData)) {
        console.error('Lista de comunicados não disponível');
        showError('Erro ao editar comunicado: dados não disponíveis');
        return;
    }
    
    const comunicado = comunicadosData.find(c => c.id == id);
    if (!comunicado) {
        console.error('Comunicado não encontrado com ID:', id);
        showError('Comunicado não encontrado');
        return;
    }
    
    console.log('Comunicado encontrado:', comunicado);
    
    // Abrir modal de edição com os dados do comunicado
    openComunicadoModal(comunicado);
}

// Função para salvar comunicado
async function saveComunicado() {
    try {
        // Obter valores do formulário
        const idInput = document.getElementById('comunicadoId');
        const tituloInput = document.getElementById('titulo');
        const conteudoInput = document.getElementById('conteudo');
        const tipoFiltroSelect = document.getElementById('tipoFiltro');
        
        if (!tituloInput || !conteudoInput || !tipoFiltroSelect) {
            console.error('Campos do formulário não encontrados');
            return;
        }
        
        const id = idInput ? idInput.value : '';
        const titulo = tituloInput.value.trim();
        const conteudo = conteudoInput.value.trim();
        const tipoFiltro = tipoFiltroSelect.value;
        
        // Validar campos obrigatórios
        if (!titulo) {
            showError('O título é obrigatório');
            return;
        }
        
        if (!conteudo) {
            showError('O conteúdo é obrigatório');
            return;
        }
        
        // Se for específico, validar se foi selecionado um cliente
        let cnpjCurtoESP = null;
        if (tipoFiltro === 'especifico') {
            const clienteSelect = document.getElementById('clienteEspecifico');
            if (!clienteSelect) {
                console.error('Campo clienteEspecifico não encontrado');
                return;
            }
            
            const clienteCNPJ = clienteSelect.value;
            if (!clienteCNPJ) {
                showError('Selecione um cliente específico');
                return;
            }
            
            // Extrair os 6 primeiros dígitos do CNPJ
            cnpjCurtoESP = clienteCNPJ.replace(/\D/g, '').substring(0, 6);
            console.log('CNPJ Curto gerado:', cnpjCurtoESP);
        }
        
        let result;
        
        // Se for específico, salvar na tabela comunicadosEspecificos
        if (tipoFiltro === 'especifico' && cnpjCurtoESP) {
            console.log('Enviando comunicado específico para CNPJ curto:', cnpjCurtoESP);
            
            if (id) {
                // Atualizar comunicado específico existente
                result = await updateComunicadoEspecifico(id, {
                    TITULO: titulo,
                    COMUNICADO: conteudo,
                    CNPJ_CONT: currentContabilidadeCNPJ,
                    FILTRO: cnpjCurtoESP
                });
            } else {
                // Criar novo comunicado específico
                result = await createComunicadoEspecifico({
                    TITULO: titulo,
                    COMUNICADO: conteudo,
                    CNPJ_CONT: currentContabilidadeCNPJ,
                    FILTRO: cnpjCurtoESP
                });
            }
            
            if (result && result.error) {
                throw new Error(result.error.message || 'Erro ao salvar comunicado específico');
            }
            
            // Atualizar a notificação do cliente específico
            try {
                await atualizarNotificacaoPrivadaCliente(cnpjCurtoESP, cnpjCurtoESP);
                console.log('Notificação privada atualizada para cliente:', cnpjCurtoESP);
            } catch (err) {
                console.warn('Erro ao atualizar notificação do cliente específico:', err);
            }
        } else {
            // Comunicado geral - salvar na tabela Comunicados
            console.log('Salvando comunicado geral com CNPJ da contabilidade:', currentContabilidadeCNPJ);
            
            const comunicadoData = {
                Titulo: titulo,
                comunicado: conteudo,
                ContabilidadeComunicado: currentContabilidadeCNPJ,
                filtro: tipoFiltro,
                cnpjCurtoESP: null // Sempre null para comunicados gerais
            };
            
            // Salvar no Supabase
            if (id) {
                console.log('Atualizando comunicado geral existente com ID:', id);
                result = await updateComunicado(id, comunicadoData);
            } else {
                console.log('Criando novo comunicado geral para contabilidade:', currentContabilidadeCNPJ);
                result = await createComunicado(comunicadoData);
            }
            
            if (result && result.error) {
                throw new Error(result.error.message || 'Erro ao salvar comunicado');
            }
        }
        
        // Fechar modal
        closeComunicadoModal();
        
        // Mostrar mensagem de sucesso
        showSuccess(id ? 'Comunicado atualizado com sucesso!' : 'Comunicado criado com sucesso!');
        
        // Recarregar lista de comunicados
        await loadComunicados();
    } catch (error) {
        console.error('Erro ao salvar comunicado:', error);
        showError('Erro ao salvar comunicado: ' + error.message);
    }
}

// Função para excluir comunicado (abrir modal de confirmação)
function deleteComunicado(id, titulo) {
    // Armazenar ID do comunicado a ser excluído
    const idInput = document.getElementById('comunicadoId');
    const titleElem = document.getElementById('deleteComunicadoTitle');
    const modal = document.getElementById('deleteModal');
    
    if (!idInput || !titleElem || !modal) {
        console.error('Elementos do modal de exclusão não encontrados');
        return;
    }
    
    idInput.value = id;
    
    // Atualizar título do comunicado no modal
    titleElem.textContent = titulo;
    
    // Abrir modal de confirmação
    modal.classList.add('active');
}

// Função para fechar modal de exclusão
function closeDeleteComunicadoModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Função para confirmar exclusão de comunicado
async function confirmDeleteComunicado() {
    try {
        // Obter ID do comunicado a ser excluído
        const idInput = document.getElementById('comunicadoId');
        if (!idInput) {
            console.error('Campo comunicadoId não encontrado');
            return;
        }
        
        const id = idInput.value;
        
        if (!id) {
            showError('ID do comunicado não encontrado');
            return;
        }
        
        // Encontrar o comunicado para verificar seu tipo
        const comunicado = comunicadosData.find(c => c.id == id);
        if (!comunicado) {
            showError('Comunicado não encontrado');
            return;
        }
        
        // Excluir comunicado baseado no tipo
        let error;
        
        if (comunicado.tipo === 'especifico') {
            console.log('Excluindo comunicado específico ID:', id);
            // Verificar se a função existe
            if (typeof deleteComunicadoEspecifico !== 'function') {
                console.error('Função deleteComunicadoEspecifico não encontrada');
                throw new Error('Função deleteComunicadoEspecifico não encontrada');
            }
            
            const result = await deleteComunicadoEspecifico(id);
            error = result.error;
            
            // Resetar a notificação privada do cliente específico
            if (!error && comunicado.cnpjCurtoESP) {
                try {
                    await atualizarNotificacaoPrivadaCliente(comunicado.cnpjCurtoESP, '0');
                    console.log('Notificação privada do cliente resetada:', comunicado.cnpjCurtoESP);
                } catch (err) {
                    console.warn('Erro ao resetar notificação do cliente específico:', err);
                }
            }
        } else {
            console.log('Excluindo comunicado geral ID:', id);
            // Verificar se a função existe
            if (typeof deleteComunicadoById !== 'function') {
                console.error('Função deleteComunicadoById não encontrada');
                throw new Error('Função deleteComunicadoById não encontrada');
            }
            
            const result = await deleteComunicadoById(id);
            error = result.error;
        }
        
        if (error) {
            throw new Error(error.message || 'Erro ao excluir comunicado');
        }
        
        // Fechar modal
        closeDeleteComunicadoModal();
        
        // Mostrar mensagem de sucesso
        showSuccess('Comunicado excluído com sucesso!');
        
        // Recarregar lista de comunicados
        await loadComunicados();
    } catch (error) {
        console.error('Erro ao excluir comunicado:', error);
        showError('Erro ao excluir comunicado: ' + error.message);
    }
}

// Função para mostrar mensagem de sucesso
function showSuccess(message) {
    const successAlert = document.getElementById('successAlert');
    const successMessage = document.getElementById('successMessage');
    
    if (!successAlert || !successMessage) {
        console.error('Elementos de alerta de sucesso não encontrados');
        return;
    }
    
    successMessage.textContent = message;
    successAlert.style.display = 'block';
    
    // Esconder após 5 segundos
    setTimeout(function() {
        successAlert.style.display = 'none';
    }, 5000);
}

// Função para mostrar mensagem de erro
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!errorAlert || !errorMessage) {
        console.error('Elementos de alerta de erro não encontrados');
        return;
    }
    
    errorMessage.textContent = message;
    errorAlert.style.display = 'block';
    
    // Esconder após 5 segundos
    setTimeout(function() {
        errorAlert.style.display = 'none';
    }, 5000);
}

// Tornar funções globais para uso nos eventos inline
window.viewComunicado = viewComunicado;
window.editComunicado = editComunicado;
window.deleteComunicado = deleteComunicado;
window.changePage = changePage;

// Configuração do modal de anexos
function configurarModalAnexos() {
    console.log('Configurando modal de anexos...');
    
    // Limpar eventos anteriores para evitar duplicação
    const novoAnexoBtn = document.getElementById('novoAnexoBtn');
    const closeAnexoModal = document.getElementById('closeAnexoModal');
    const cancelAnexoBtn = document.getElementById('cancelAnexoBtn');
    const uploadAnexoBtn = document.getElementById('uploadAnexoBtn');
    
    // Limpar todos os ouvintes de eventos anteriores
    if (novoAnexoBtn) {
        const novoClone = novoAnexoBtn.cloneNode(true);
        novoAnexoBtn.parentNode.replaceChild(novoClone, novoAnexoBtn);
        novoClone.addEventListener('click', openAnexoModal);
        console.log('Evento de clique adicionado ao botão Novo Anexo (clone)');
    }
    
    if (closeAnexoModal) {
        const closeClone = closeAnexoModal.cloneNode(true);
        closeAnexoModal.parentNode.replaceChild(closeClone, closeAnexoModal);
        closeClone.addEventListener('click', closeAnexoModalFunc);
        console.log('Evento de clique adicionado ao botão Fechar Modal (clone)');
    }
    
    if (cancelAnexoBtn) {
        const cancelClone = cancelAnexoBtn.cloneNode(true);
        cancelAnexoBtn.parentNode.replaceChild(cancelClone, cancelAnexoBtn);
        cancelClone.addEventListener('click', closeAnexoModalFunc);
        console.log('Evento de clique adicionado ao botão Cancelar (clone)');
    }
    
    if (uploadAnexoBtn) {
        const uploadClone = uploadAnexoBtn.cloneNode(true);
        uploadAnexoBtn.parentNode.replaceChild(uploadClone, uploadAnexoBtn);
        uploadClone.addEventListener('click', uploadAnexo);
        console.log('Evento de clique adicionado ao botão Upload Anexo (clone)');
    }
}

// Função para abrir o modal de anexo
function openAnexoModal() {
    console.log('Abrindo modal de anexo...');
    document.getElementById('anexoForm').reset();
    document.querySelector('.upload-progress').style.display = 'none';
    document.querySelector('.progress-fill').style.width = '0%';
    document.querySelector('.progress-text').textContent = '0%';
    
    document.getElementById('anexoModalBackdrop').classList.add('active');
}

// Função para fechar o modal de anexo
function closeAnexoModalFunc() {
    console.log('Fechando modal de anexo...');
    document.getElementById('anexoModalBackdrop').classList.remove('active');
}

// Função para fazer upload do documento
async function uploadAnexo() {
    console.log('Iniciando função de upload...');
    
    // Evitar múltiplos uploads
    const uploadBtn = document.getElementById('uploadAnexoBtn');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Enviando...';
    }
    
    try {
        // Recuperar os valores do formulário
        const nomeDocumento = document.getElementById('nomeDocumento').value;
        const arquivoInput = document.getElementById('arquivoDocumento');
        const arquivo = arquivoInput.files[0];
        
        // Validar os campos
        if (!nomeDocumento) {
            showError('Informe o nome do documento');
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Enviar Documento';
            }
            return;
        }
        
        if (!arquivo) {
            showError('Selecione um arquivo para upload');
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Enviar Documento';
            }
            return;
        }
        
        console.log('Documento a ser enviado:', nomeDocumento, arquivo.name);
        
        // Mostrar progresso do upload
        const progressElement = document.querySelector('.upload-progress');
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        progressElement.style.display = 'block';
        
        // Obter CNPJ do usuário logado usando a função auxiliar
        let cnpjContabilidade = '';
        
        // Usar a função auxiliar se disponível
        if (typeof obterCNPJUsuarioLogado === 'function') {
            cnpjContabilidade = await obterCNPJUsuarioLogado();
            if (cnpjContabilidade) {
                console.log('CNPJ obtido através da função auxiliar:', cnpjContabilidade);
            }
        }
        
        // Se não conseguimos obter o CNPJ, tentar os métodos antigos
        if (!cnpjContabilidade) {
            // Método 1: Verificar se temos o CNPJ em uma variável global
            if (typeof currentContabilidadeCNPJ !== 'undefined' && currentContabilidadeCNPJ) {
                cnpjContabilidade = currentContabilidadeCNPJ;
                console.log('CNPJ recuperado de variável global:', cnpjContabilidade);
            } 
            // Método 2: Verificar sessionStorage
            else {
                const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
                if (userData && userData.CNPJ) {
                    cnpjContabilidade = userData.CNPJ;
                    console.log('CNPJ recuperado da sessão:', cnpjContabilidade);
                }
            }
        }
        
        // Se ainda não temos um CNPJ válido, usar temporário (apenas em último caso)
        if (!cnpjContabilidade) {
            cnpjContabilidade = 'temporario';
            console.log('Usando CNPJ temporário - ERRO: não foi possível determinar CNPJ do usuário');
        }
        
        // Gerar nome único para o arquivo
        const fileExt = arquivo.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${cnpjContabilidade}/${fileName}`;
        
        console.log('Iniciando upload para:', filePath);
        
        // Upload para o storage 'CONTRATOS'
        const { data, error } = await supabase.storage
            .from('CONTRATOS')
            .upload(filePath, arquivo, {
                cacheControl: '3600',
                upsert: true, // Alterado para true para substituir se existir
                onUploadProgress: (progress) => {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    progressFill.style.width = `${percent}%`;
                    progressText.textContent = `${percent}%`;
                }
            });
        
        if (error) {
            console.error('Erro no upload:', error);
            showError('Erro ao fazer upload do documento: ' + error.message);
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Enviar Documento';
            }
            return;
        }
        
        console.log('Upload concluído com sucesso');
        
        // Obter URL pública do arquivo
        const { data: urlData } = supabase.storage
            .from('CONTRATOS')
            .getPublicUrl(filePath);
            
        const fileUrl = urlData.publicUrl;
        console.log('URL do arquivo:', fileUrl);
        
        // Salvar na tabela contratosSocial
        const { data: insertData, error: insertError } = await supabase
            .from('contratosSocial')
            .insert([{
                URL_CONT: fileUrl,
                NOME: nomeDocumento,
                CNPJ: cnpjContabilidade
            }]);
            
        if (insertError) {
            console.error('Erro ao salvar dados:', insertError);
            showError('Erro ao salvar informações do documento: ' + insertError.message);
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Enviar Documento';
            }
            return;
        }
        
        // Mostrar mensagem de sucesso e fechar modal
        showSuccess('Documento enviado com sucesso!');
        closeAnexoModalFunc();
        
    } catch (error) {
        console.error('Erro ao processar upload:', error);
        showError('Ocorreu um erro ao processar o upload: ' + (error.message || 'Erro desconhecido'));
        // Reativar botão em caso de erro
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Enviar Documento';
        }
    }
}
