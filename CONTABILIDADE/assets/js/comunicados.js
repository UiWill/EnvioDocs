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
    const { data, error } = await getCurrentUser();
    if (error || !data.user) {
        console.error('Erro de autenticação:', error);
        window.location.href = 'login.html';
        return;
    }

    // Carregar dados do usuário
    await loadUserData(data.user.email);
    
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
});

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
        if (!currentContabilidadeCNPJ) {
            console.warn('CNPJ da contabilidade não disponível, não será possível carregar clientes específicos');
            return;
        }
        
        console.log('Carregando clientes da contabilidade:', currentContabilidadeCNPJ);
        
        // Buscar clientes no Supabase
        const { data, error } = await getClientes(currentContabilidadeCNPJ);
        
        if (error) {
            throw new Error(error.message);
        }
        
        // Armazenar dados para uso posterior
        clientesData = data || [];
        
        console.log(`${clientesData.length} clientes carregados`);
        
        // Preencher dropdown de clientes específicos no modal
        populateClientesDropdown();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Função para preencher dropdown de clientes no modal
function populateClientesDropdown() {
    const clienteSelect = document.getElementById('clienteEspecifico');
    
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
}

// Função para formatar CNPJ
function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    // Remove caracteres não numéricos
    const numeros = cnpj.replace(/\D/g, '');
    // Retornar apenas os 6 primeiros dígitos se o CNPJ tiver mais de 6 dígitos
    return numeros.length > 6 ? numeros.substring(0, 6) : numeros;
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
            const clienteEspecificoGroup = document.getElementById('clienteEspecificoGroup');
            if (clienteEspecificoGroup) {
                clienteEspecificoGroup.style.display = this.value === 'especifico' ? 'block' : 'none';
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
function viewComunicado(id) {
    try {
        // Encontrar comunicado
        const comunicado = comunicadosData.find(c => c.id === id);
        
        if (!comunicado) {
            showError('Comunicado não encontrado');
            return;
        }
        
        // Preencher dados no modal
        const viewTituloElem = document.getElementById('viewTitulo');
        const viewDataElem = document.getElementById('viewData');
        const viewTipoElem = document.getElementById('viewTipo');
        const viewClienteContainerElem = document.getElementById('viewClienteContainer');
        const viewClienteElem = document.getElementById('viewCliente');
        const viewConteudoElem = document.getElementById('viewConteudo');
        const viewModal = document.getElementById('viewComunicadoModal');
        
        if (!viewTituloElem || !viewDataElem || !viewTipoElem || !viewClienteContainerElem || 
            !viewClienteElem || !viewConteudoElem || !viewModal) {
            console.error('Elementos do modal de visualização não encontrados');
            return;
        }
        
        viewTituloElem.textContent = comunicado.titulo || 'Sem título';
        
        // Formatar data
        const data = comunicado.createdAt ? new Date(comunicado.createdAt) : new Date();
        viewDataElem.textContent = data.toLocaleDateString('pt-BR');
        
        // Definir tipo
        viewTipoElem.textContent = comunicado.tipo === 'especifico' ? 'Específico' : 'Geral';
        
        // Exibir cliente específico se houver
        if (comunicado.tipo === 'especifico' && comunicado.cnpjCurtoESP) {
            // Encontrar nome do cliente
            const cliente = clientesData.find(c => c.CNPJ && c.CNPJ.includes(comunicado.cnpjCurtoESP));
            const clienteNome = cliente ? cliente.NOME_CLIENTE : `Cliente (${comunicado.cnpjCurtoESP})`;
            
            viewClienteElem.textContent = clienteNome;
            viewClienteContainerElem.style.display = 'block';
        } else {
            viewClienteContainerElem.style.display = 'none';
        }
        
        // Conteúdo do comunicado
        viewConteudoElem.textContent = comunicado.comunicado || '';
        
        // Abrir modal
        viewModal.classList.add('active');
    } catch (error) {
        console.error('Erro ao visualizar comunicado:', error);
        showError('Erro ao visualizar comunicado: ' + error.message);
    }
}

// Função para fechar modal de visualização
function closeViewComunicadoModal() {
    const modal = document.getElementById('viewComunicadoModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

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
            cnpjCurtoESP = formatCNPJ(clienteCNPJ);
        }
        
        let result;
        let comunicadoExistente = null;
        
        // Se for específico, salvar na tabela comunicadosEspecificos
        if (tipoFiltro === 'especifico' && cnpjCurtoESP) {
            console.log('Enviando comunicado específico para CNPJ curto:', cnpjCurtoESP);
            
            if (id) {
                // Atualizar comunicado específico existente (provavelmente não usado, mas mantido por consistência)
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
            
            // Atualizar a notificação do cliente específico com o próprio CNPJ curto do cliente
            try {
                await atualizarNotificacaoPrivadaCliente(cnpjCurtoESP, cnpjCurtoESP);
                console.log('Notificação privada atualizada para cliente:', cnpjCurtoESP);
            } catch (err) {
                console.warn('Erro ao atualizar notificação do cliente específico:', err);
            }
        } else {
            // Comunicado geral - salvar na tabela Comunicados
            // Preparar dados do comunicado
            const comunicadoData = {
                Titulo: titulo,
                comunicado: conteudo,
                ContabilidadeComunicado: currentContabilidadeCNPJ,
                filtro: tipoFiltro,
                cnpjCurtoESP: null // Sempre null para comunicados gerais
            };
            
            // Verificar se já existe um comunicado geral para esta contabilidade
            if (!id && Array.isArray(comunicadosData)) {
                // Filtrar comunicados gerais por ContabilidadeComunicado
                comunicadoExistente = comunicadosData.find(c => 
                    c.tipo === 'geral' && 
                    c.ContabilidadeComunicado === currentContabilidadeCNPJ
                );
            }
            
            // Salvar no Supabase
            if (id) {
                // Atualizar comunicado existente pelo ID fornecido
                console.log('Atualizando comunicado geral existente com ID:', id);
                result = await updateComunicado(id, comunicadoData);
            } else if (comunicadoExistente) {
                // Atualizar o comunicado geral existente para esta contabilidade
                console.log('Atualizando comunicado geral existente para contabilidade:', currentContabilidadeCNPJ);
                result = await updateComunicado(comunicadoExistente.id, comunicadoData);
            } else {
                // Criar novo comunicado (apenas se não existir nenhum)
                console.log('Criando novo comunicado geral para contabilidade:', currentContabilidadeCNPJ);
                result = await createComunicado(comunicadoData);
            }
            
            if (result && result.error) {
                throw new Error(result.error.message || 'Erro ao salvar comunicado');
            }
            
            // Se for um comunicado geral, atualizar a notificação de todos os clientes
            try {
                await atualizarNotificacaoClientes(currentContabilidadeCNPJ, '1');
                console.log('Notificações dos clientes atualizadas para comunicado geral');
            } catch (err) {
                console.warn('Erro ao atualizar notificações de clientes:', err);
            }
        }
        
        // Fechar modal
        closeComunicadoModal();
        
        // Mostrar mensagem de sucesso
        showSuccess(id || (comunicadoExistente ? true : false) ? 'Comunicado atualizado com sucesso!' : 'Comunicado criado com sucesso!');
        
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
