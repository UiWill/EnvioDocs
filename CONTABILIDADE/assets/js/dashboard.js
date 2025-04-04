// Aguardar o carregamento do DOM
document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar o loader
    setTimeout(function() {
        const loader = document.querySelector('.loader-wrapper');
        loader.classList.add('loader-hidden');
    }, 1500);

    // Verificar autenticação
    const { data, error } = await getCurrentUser();
    if (error || !data || !data.user) {
        // Redirecionar para a página de login
        window.location.href = 'login.html';
        return;
    }

    // Carregar dados do usuário
    const cnpjContabilidade = await loadUserData(data.user.id);
    
    // Inicializar a navegação dos cards
    initCardNavigation();
    
    // Inicializar a verificação de relatórios
    initVerificacaoRelatorios(cnpjContabilidade);
    
    // Inicializar o toggle do sidebar
    initSidebarToggle();
    
    // Inicializar o botão de logout
    initLogoutButton();
    
    // Buscar documentos com campos importantes faltando
    buscarDocumentosCamposFaltando();
});

// Função para carregar dados do usuário
async function loadUserData(userId) {
    try {
        // Buscar dados do usuário via email ou outro identificador
        const { data: userData, error: userError } = await getCurrentUser();
        if (userError || !userData || !userData.user) {
            console.error('Erro ao obter usuário atual:', userError);
            return;
        }
        
        const userEmail = userData.user.email;
        console.log('Carregando dados do usuário com email:', userEmail);
        
        // Buscar dados da contabilidade pelo email
        const { data, error } = await getContabilidadeByEmail(userEmail);
        
        if (error) {
            console.error('Erro ao carregar dados da contabilidade:', error);
            return;
        }
        
        if (!data) {
            console.error('Nenhum dado de contabilidade encontrado para o email:', userEmail);
            return;
        }
        
        console.log('Dados da contabilidade obtidos:', data);
        
        // Armazenar CNPJ da contabilidade para uso em outras funções
        const currentContabilidadeCNPJ = data.CNPJ || '';
        
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
        
        return currentContabilidadeCNPJ;
    } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
    }
}

// Inicializar a navegação dos cards
function initCardNavigation() {
    const container = document.getElementById('cardsContainer');
    const cardsWrapper = document.getElementById('pendenciasCards');
    const prevBtn = document.getElementById('prevCardBtn');
    const nextBtn = document.getElementById('nextCardBtn');
    const indicatorsContainer = document.getElementById('cardIndicators');
    const scrollbarThumb = document.getElementById('scrollbarThumb');
    
    if (!container || !cardsWrapper || !prevBtn || !nextBtn || !indicatorsContainer || !scrollbarThumb) {
        console.error('Elementos de navegação dos cards não encontrados');
        return;
    }
    
    // Variáveis para controlar o arrasto
    let isDragging = false;
    let startPosition = 0;
    let startScrollLeft = 0;
    let animationId = null;
    let momentum = 0;
    let lastPosition = 0;
    let currentPosition = 0;
    
    // Variáveis para cálculos de tamanho/posição
    const cardWidth = 270; // Largura do card + gap
    const containerWidth = container.clientWidth;
    const totalWidth = cardsWrapper.scrollWidth;
    const maxScroll = totalWidth - containerWidth;
    const totalCards = cardsWrapper.children.length;
    const visibleCards = Math.floor(containerWidth / cardWidth);
    
    // Criar indicadores de página
    for (let i = 0; i < Math.ceil(totalCards / visibleCards); i++) {
        const indicator = document.createElement('div');
        indicator.className = 'card-indicator';
        if (i === 0) indicator.classList.add('active');
        
        // Adicionar evento de clique no indicador
        indicator.addEventListener('click', () => {
            const scrollTarget = (i * visibleCards * cardWidth);
            animateScroll(scrollTarget);
            updateIndicators(scrollTarget);
        });
        
        indicatorsContainer.appendChild(indicator);
    }
    
    // Atualizar a barra de rolagem
    function updateScrollbar() {
        const scrollPercent = currentPosition / maxScroll;
        const thumbWidth = Math.max(30, (containerWidth / totalWidth) * 100);
        const thumbPosition = scrollPercent * (container.clientWidth - thumbWidth);
        
        scrollbarThumb.style.width = `${thumbWidth}%`;
        scrollbarThumb.style.left = `${thumbPosition}px`;
    }
    
    // Atualizar os indicadores de página
    function updateIndicators(scrollLeft) {
        const currentCard = Math.floor(scrollLeft / cardWidth);
        const activeIndex = Math.floor(currentCard / visibleCards);
        
        const indicators = indicatorsContainer.querySelectorAll('.card-indicator');
        indicators.forEach((indicator, index) => {
            if (index === activeIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    // Atualizar estado dos botões
    function updateButtonState() {
        prevBtn.disabled = currentPosition <= 0;
        nextBtn.disabled = currentPosition >= maxScroll;
        
        // Adicionar classes visuais
        if (prevBtn.disabled) {
            prevBtn.classList.add('disabled');
        } else {
            prevBtn.classList.remove('disabled');
        }
        
        if (nextBtn.disabled) {
            nextBtn.classList.add('disabled');
        } else {
            nextBtn.classList.remove('disabled');
        }
    }
    
    // Animar o scroll para uma posição
    function animateScroll(targetPosition) {
        cancelAnimationFrame(animationId);
        const startPosition = currentPosition;
        const distance = targetPosition - startPosition;
        const duration = 500;
        let startTime = null;
        
        // Limitar o alvo à área válida
        targetPosition = Math.max(0, Math.min(targetPosition, maxScroll));
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2; // Easing
            
            currentPosition = startPosition + distance * easeProgress;
            cardsWrapper.style.transform = `translateX(-${currentPosition}px)`;
            
            updateScrollbar();
            updateButtonState();
            
            if (timeElapsed < duration) {
                animationId = requestAnimationFrame(animation);
            }
        }
        
        animationId = requestAnimationFrame(animation);
    }
    
    // Evento de mouse down / touch start
    function dragStart(e) {
        isDragging = true;
        container.classList.add('dragging');
        
        // Capturar posição inicial
        startPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        startScrollLeft = currentPosition;
        lastPosition = startPosition;
        
        // Parar qualquer animação em andamento
        cancelAnimationFrame(animationId);
        
        // Registrar eventos de movimento e término
        document.addEventListener('mousemove', dragging);
        document.addEventListener('touchmove', dragging);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
    }
    
    // Evento de mouse move / touch move
    function dragging(e) {
        if (!isDragging) return;
        
        // Prevenir comportamento padrão
        e.preventDefault();
        
        // Calcular a nova posição
        const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        const diff = startPosition - currentX;
        
        // Calcular momentum para efeito de inércia
        momentum = lastPosition - currentX;
        lastPosition = currentX;
        
        // Aplicar a nova posição com resistência nas bordas
        let newPosition = startScrollLeft + diff;
        
        // Adicionar resistência nas bordas
        if (newPosition < 0) {
            newPosition = newPosition / 3;
        } else if (newPosition > maxScroll) {
            newPosition = maxScroll + (newPosition - maxScroll) / 3;
        }
        
        currentPosition = newPosition;
        cardsWrapper.style.transform = `translateX(-${currentPosition}px)`;
        
        // Atualizar interface
        updateScrollbar();
        updateIndicators(currentPosition);
    }
    
    // Evento de mouse up / touch end
    function dragEnd() {
        isDragging = false;
        container.classList.remove('dragging');
        
        // Remover eventos
        document.removeEventListener('mousemove', dragging);
        document.removeEventListener('touchmove', dragging);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchend', dragEnd);
        
        // Aplicar efeito de inércia se o movimento foi rápido
        if (Math.abs(momentum) > 5) {
            const direction = momentum > 0 ? 1 : -1;
            applyMomentum(direction, Math.min(Math.abs(momentum) * 10, 500));
            return;
        }
        
        // Se não houve inércia, apenas ajustar para a posição válida mais próxima
        snapToNearestCard();
    }
    
    // Aplicar efeito de inércia após soltar
    function applyMomentum(direction, distance) {
        let targetPosition = currentPosition + (direction * distance);
        
        // Garantir que não ultrapasse os limites
        targetPosition = Math.max(0, Math.min(targetPosition, maxScroll));
        
        // Animar até a posição alvo
        animateScroll(targetPosition);
        
        // Após a inércia, ajustar para o card mais próximo
        setTimeout(snapToNearestCard, 500);
    }
    
    // Ajustar para o card mais próximo
    function snapToNearestCard() {
        const cardIndex = Math.round(currentPosition / cardWidth);
        const snapPosition = cardIndex * cardWidth;
        
        animateScroll(snapPosition);
        updateIndicators(snapPosition);
    }
    
    // Evento para botão "anterior"
    prevBtn.addEventListener('click', () => {
        // Mover para o grupo anterior de cards
        const cardIndex = Math.floor(currentPosition / cardWidth);
        const snapPosition = Math.max(0, (cardIndex - visibleCards) * cardWidth);
        
        animateScroll(snapPosition);
        updateIndicators(snapPosition);
    });
    
    // Evento para botão "próximo"
    nextBtn.addEventListener('click', () => {
        // Mover para o próximo grupo de cards
        const cardIndex = Math.floor(currentPosition / cardWidth);
        const snapPosition = Math.min(maxScroll, (cardIndex + visibleCards) * cardWidth);
        
        animateScroll(snapPosition);
        updateIndicators(snapPosition);
    });
    
    // Adicionar eventos de mouse/touch para arrasto
    container.addEventListener('mousedown', dragStart);
    container.addEventListener('touchstart', dragStart);
    
    // Prevenir comportamento padrão do clique
    container.addEventListener('click', (e) => {
        if (Math.abs(momentum) > 5) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    // Atualizar dimensões quando a janela for redimensionada
    window.addEventListener('resize', () => {
        // Recalcular dimensões
        const newContainerWidth = container.clientWidth;
        const newMaxScroll = cardsWrapper.scrollWidth - newContainerWidth;
        const newVisibleCards = Math.floor(newContainerWidth / cardWidth);
        
        // Ajustar posição atual proporcionalmente
        currentPosition = Math.min(currentPosition, newMaxScroll);
        cardsWrapper.style.transform = `translateX(-${currentPosition}px)`;
        
        // Atualizar interface
        updateScrollbar();
        updateButtonState();
        updateIndicators(currentPosition);
    });
    
    // Inicializar estado
    updateScrollbar();
    updateButtonState();
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
    const logoutButton = document.getElementById('logoutButton');
    
    logoutButton.addEventListener('click', async function() {
        try {
            // Fazer logout
            const { error } = await signOut();
            
            if (error) {
                throw new Error(error.message);
            }
            
            // Redirecionar para a página de login
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            alert('Erro ao fazer logout: ' + error.message);
        }
    });
} 

// Função para inicializar a verificação de relatórios
function initVerificacaoRelatorios(cnpjContabilidade) {
    console.log('Inicializando verificação de relatórios com CNPJ:', cnpjContabilidade);
    
    // Definir mês e ano atuais como padrão
    setCurrentMonth();
    
    // Adicionar evento ao botão de busca
    const buscarBtn = document.getElementById('buscarRelatoriosBtn');
    if (buscarBtn) {
        buscarBtn.addEventListener('click', function() {
            buscarRelatorios(cnpjContabilidade);
        });
    }
    
    // Ajustar altura da tabela dinamicamente
    ajustarAlturaTabela();
    
    // Atualizar altura da tabela quando a janela for redimensionada
    window.addEventListener('resize', ajustarAlturaTabela);
    
    // Executar busca inicial se tivermos o CNPJ
    if (cnpjContabilidade) {
        setTimeout(() => buscarRelatorios(cnpjContabilidade), 500);
    }
}

// Função para ajustar a altura da tabela
function ajustarAlturaTabela() {
    const container = document.querySelector('.tabela-relatorios-container');
    const header = document.querySelector('.relatorios-table thead');
    const tbody = document.querySelector('.relatorios-table tbody');
    
    if (container && header && tbody) {
        // Calcular altura disponível
        const containerHeight = container.clientHeight;
        const headerHeight = header.clientHeight;
        
        // Ajustar altura do tbody
        tbody.style.height = `${containerHeight - headerHeight}px`;
        
        // Garantir que a tabela use todo o espaço vertical disponível
        container.style.height = `calc(100vh - ${container.getBoundingClientRect().top + 40}px)`;
        
        console.log('Altura ajustada da tabela:', tbody.style.height);
        console.log('Altura do container:', container.style.height);
    }
}

// Função para definir o mês atual como padrão
function setCurrentMonth() {
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear().toString();
    
    const mesSelect = document.getElementById('mesSelect');
    const anoSelect = document.getElementById('anoSelect');
    
    if (mesSelect) {
        mesSelect.value = currentMonth;
    }
    
    if (anoSelect) {
        // Encontrar e selecionar o ano atual ou o mais próximo disponível
        const anos = Array.from(anoSelect.options).map(opt => opt.value);
        
        if (anos.includes(currentYear)) {
            anoSelect.value = currentYear;
        }
    }
}

// Função para buscar relatórios
async function buscarRelatorios(cnpjContabilidade) {
    try {
        if (!cnpjContabilidade) {
            console.error('CNPJ da contabilidade não disponível');
            mostrarErroRelatorios('CNPJ da contabilidade não disponível. Por favor, faça login novamente.');
            return;
        }
        
        const mesSelect = document.getElementById('mesSelect');
        const anoSelect = document.getElementById('anoSelect');
        
        if (!mesSelect || !anoSelect) {
            console.error('Elementos de filtro não encontrados');
            return;
        }
        
        const mes = mesSelect.value;
        const ano = anoSelect.value;
        
        console.log(`Buscando relatórios para CNPJ ${cnpjContabilidade}, mês ${mes}, ano ${ano}`);
        
        // Mostrar loader
        const loaderElement = document.getElementById('relatoriosLoader');
        if (loaderElement) {
            loaderElement.style.display = 'flex';
        }
        
        // Limpar tabela
        const tbody = document.getElementById('relatoriosTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" class="loading-data">Carregando dados...</td></tr>';
        }
        
        // 1. Buscar clientes da contabilidade
        console.log('Buscando clientes da contabilidade com CNPJ:', cnpjContabilidade);
        const { data: clientes, error: clientesError } = await getClientes(cnpjContabilidade);
        
        if (clientesError) {
            throw new Error(`Erro ao buscar clientes: ${clientesError.message}`);
        }
        
        if (!clientes || clientes.length === 0) {
            console.log('Nenhum cliente encontrado para esta contabilidade');
            mostrarErroRelatorios('Nenhum cliente encontrado para esta contabilidade.');
            return;
        }
        
        console.log(`Encontrados ${clientes.length} clientes para a contabilidade`);
        
        // Preparar resultado para exibição na tabela
        const resultadoClientes = [];
        
        // 2. Para cada cliente, processar os documentos
        for (const cliente of clientes) {
            // Verificar se o cliente tem CNPJ_curto
            if (!cliente.CNPJ_curto) {
                console.log(`Cliente ${cliente.NOME_CLIENTE} não tem CNPJ_curto`);
                cliente.CNPJ_curto = gerarCnpjCurto(cliente.CNPJ);
            }
            
            console.log(`Processando cliente: ${cliente.NOME_CLIENTE} (CNPJ_curto: ${cliente.CNPJ_curto})`);
            
            // Buscar documentos do cliente na tabela AmContabilidade
            const { data: documentos, error: docError } = await getAmContabilidadeByCnpjCurto(cliente.CNPJ_curto);
            
            if (docError) {
                console.error(`Erro ao buscar documentos para cliente ${cliente.NOME_CLIENTE}:`, docError);
                continue; // Continuar com o próximo cliente
            }
            
            // Filtrar os documentos pelo ano e mês selecionados
            const periodoFiltro = `${ano}-${mes}`;
            console.log(`Filtrando documentos para o período: ${periodoFiltro}`);

            const docsDoMes = documentos.filter(doc => {
                // Verificar se DATA_ARQ existe
                if (!doc.DATA_ARQ) {
                    console.log(`Documento sem DATA_ARQ: ${doc.id} - ${doc.NOME_PDF}`);
                    return false;
                }
                
                // Verificar diferentes formatos de data possíveis
                let dataCorresponde = false;
                
                // Formato ISO YYYY-MM-DD
                if (doc.DATA_ARQ.startsWith(periodoFiltro)) {
                    dataCorresponde = true;
                }
                
                // Formato DD/MM/YYYY
                const partesData = doc.DATA_ARQ.split('/');
                if (partesData.length === 3) {
                    const mesDoc = partesData[1].padStart(2, '0');
                    const anoDoc = partesData[2];
                    if (mesDoc === mes && anoDoc === ano) {
                        dataCorresponde = true;
                    }
                }
                
                console.log(`Avaliando documento: ID=${doc.id}, NOME=${doc.NOME_PDF}, DATA=${doc.DATA_ARQ}, Corresponde=${dataCorresponde}`);
                return dataCorresponde;
            });
            
            console.log(`${docsDoMes.length} documentos encontrados para ${cliente.NOME_CLIENTE} no período ${periodoFiltro}`);
            
            // Processar documentos para determinar status (Pendente/Data)
            const statusDocs = {
                HONORARIOS: 'Pendente',
                DARF: 'Pendente',
                FGTS: 'Pendente',
                HOLERITE: 'Pendente',
                DAE: 'Pendente',
                PGDAS: 'Pendente',
                ALVARA: 'Pendente',
                ESOCIAL: 'Pendente'
            };
            
            // Mapear documentos para os tipos correspondentes
            console.log(`Processando ${docsDoMes.length} documentos para o cliente ${cliente.NOME_CLIENTE}`);
            if (docsDoMes.length > 0) {
                docsDoMes.forEach(doc => {
                    if (!doc.NOME_PDF) {
                        console.log(`Documento sem NOME_PDF: ID=${doc.id}`);
                        return;
                    }
                    
                    // Normalizar o nome do PDF: converter para maiúsculas e remover acentos
                    const nomePDF = doc.NOME_PDF.toUpperCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
                    
                    console.log(`Verificando documento: ID=${doc.id}, Nome=${doc.NOME_PDF}, Nome normalizado=${nomePDF}, Data=${doc.DATA_ARQ}`);
                    
                    // Verificar cada tipo de documento possível usando padrões mais flexíveis
                    // Um documento pode corresponder a múltiplos tipos
                    
                    // Honorários - verificar várias possibilidades
                    if (nomePDF.includes('HONORARIO') || 
                        nomePDF.includes('HONORARIOS') || 
                        nomePDF.includes('HONORARIOSS') || 
                        nomePDF.includes('HONORÁRIO') || 
                        nomePDF.includes('HONORÁRIOS')) {
                        statusDocs.HONORARIOS = doc.DATA_ARQ || 'Pendente';
                        console.log(`✓ Documento de Honorários identificado: ${doc.NOME_PDF}, data: ${doc.DATA_ARQ}`);
                    }
                    
                    // DARF
                    if (nomePDF.includes('DARF')) {
                        statusDocs.DARF = doc.DATA_ARQ || 'Pendente';
                        console.log(`✓ Documento DARF identificado: ${doc.NOME_PDF}, data: ${doc.DATA_ARQ}`);
                    }
                    
                    // FGTS
                    if (nomePDF.includes('FGTS')) {
                        statusDocs.FGTS = doc.DATA_ARQ || 'Pendente';
                        console.log(`✓ Documento FGTS identificado: ${doc.NOME_PDF}, data: ${doc.DATA_ARQ}`);
                    }
                    
                    // Holerite
                    if (nomePDF.includes('HOLERITE') || nomePDF.includes('HOLLERITE') || nomePDF.includes('FOLHA')) {
                        statusDocs.HOLERITE = doc.DATA_ARQ || 'Pendente';
                        console.log(`✓ Documento Holerite identificado: ${doc.NOME_PDF}, data: ${doc.DATA_ARQ}`);
                    }
                    
                    // DAE
                    if (nomePDF.includes('DAE')) {
                        statusDocs.DAE = doc.DATA_ARQ || 'Pendente';
                        console.log(`✓ Documento DAE identificado: ${doc.NOME_PDF}, data: ${doc.DATA_ARQ}`);
                    }
                    
                    // PGDAS
                    if (nomePDF.includes('PGDAS') || nomePDF.includes('DAS')) {
                        statusDocs.PGDAS = doc.DATA_ARQ || 'Pendente';
                        console.log(`✓ Documento PGDAS identificado: ${doc.NOME_PDF}, data: ${doc.DATA_ARQ}`);
                    }
                    
                    // ALVARA
                    if (nomePDF.includes('ALVARA') || nomePDF.includes('ALVARÁ')) {
                        statusDocs.ALVARA = doc.DATA_ARQ || 'Pendente';
                        console.log(`✓ Documento ALVARA identificado: ${doc.NOME_PDF}, data: ${doc.DATA_ARQ}`);
                    }
                    
                    // ESOCIAL
                    if (nomePDF.includes('ESOCIAL') || nomePDF.includes('E-SOCIAL') || nomePDF.includes('E SOCIAL')) {
                        statusDocs.ESOCIAL = doc.DATA_ARQ || 'Pendente';
                        console.log(`✓ Documento ESOCIAL identificado: ${doc.NOME_PDF}, data: ${doc.DATA_ARQ}`);
                    }
                });
            } else {
                console.log(`Nenhum documento encontrado para o cliente ${cliente.NOME_CLIENTE} no período ${periodoFiltro}`);
            }
            
            // Criar objeto de resultado para este cliente
            const clienteResultado = {
                NOME_CLIENTE: cliente.NOME_CLIENTE,
                CNPJ: cliente.CNPJ,
                CNPJ_curto: cliente.CNPJ_curto,
                ...statusDocs
            };
            
            resultadoClientes.push(clienteResultado);
        }
        
        // 3. Preencher tabela com os dados processados
        preencherTabelaRelatorios(resultadoClientes);
        
        // 4. Contar e atualizar os documentos pendentes
        atualizarContadoresPendentes(resultadoClientes);
        
        // Esconder loader
        if (loaderElement) {
            loaderElement.style.display = 'none';
        }
        
        // Reajustar altura da tabela
        setTimeout(ajustarAlturaTabela, 100);
    } catch (error) {
        console.error('Erro ao buscar relatórios:', error);
        mostrarErroRelatorios('Erro ao buscar relatórios: ' + error.message);
    }
}

// Função para truncar texto
function truncateText(text, maxLength = 30) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Função para preencher tabela de relatórios
function preencherTabelaRelatorios(clientes) {
    const tbody = document.getElementById('relatoriosTableBody');
    if (!tbody) {
        console.error('Elemento relatoriosTableBody não encontrado');
        return;
    }
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    // Se não houver clientes
    if (!clientes || clientes.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.setAttribute('colspan', '9');
        cell.className = 'loading-data';
        cell.textContent = 'Nenhum dado encontrado';
        row.appendChild(cell);
        tbody.appendChild(row);
        setTimeout(ajustarAlturaTabela, 100);
        return;
    }
    
    // Adicionar clientes à tabela
    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        
        // Coluna do nome do cliente
        const nomeCliente = cliente.NOME_CLIENTE || '-';
        const tdNome = document.createElement('td');
        tdNome.setAttribute('title', nomeCliente); // Título completo para tooltip
        tdNome.textContent = nomeCliente; // Exibe o nome completo, CSS controla quantas linhas mostrar
        row.appendChild(tdNome);
        
        // Colunas de status
        const colunas = [
            { campo: 'HONORARIOS', label: 'Honorários' },
            { campo: 'DARF', label: 'DARF' },
            { campo: 'FGTS', label: 'FGTS' },
            { campo: 'HOLERITE', label: 'Holerite' },
            { campo: 'DAE', label: 'DAE' },
            { campo: 'PGDAS', label: 'PGDAS' },
            { campo: 'ALVARA', label: 'ALVARA' },
            { campo: 'ESOCIAL', label: 'ESOCIAL' }
        ];
        
        colunas.forEach(coluna => {
            const valor = cliente[coluna.campo];
            
            // Verificar valor undefined ou nulo
            const isPendente = valor === 'Pendente';
            const isUndefined = valor === 'undefined' || valor === undefined || valor === null;
            
            const td = document.createElement('td');
            const span = document.createElement('span');
            
            if (isUndefined) {
                span.className = 'pendente'; // Usar a mesma classe do pendente para undefined
                span.textContent = 'Pendente';
            } else if (isPendente) {
                span.className = 'pendente';
                span.textContent = 'Pendente';
            } else {
                // Se for uma data, formatar para exibição DD/MM/YYYY
                span.className = 'enviado';
                
                // Verificar se é uma data no formato ISO (YYYY-MM-DD)
                if (valor && typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}/)) {
                    // Extrair apenas o dia/mês da data
                    const data = new Date(valor);
                    const dia = data.getDate().toString().padStart(2, '0');
                    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
                    
                    span.textContent = `${dia}/${mes}/${data.getFullYear()}`;
                    span.setAttribute('title', `Documento enviado em ${dia}/${mes}/${data.getFullYear()}`);
                } else {
                    span.textContent = valor;
                }
            }
            
            td.appendChild(span);
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
    
    // Ajustar altura da tabela após preencher
    setTimeout(ajustarAlturaTabela, 100);
}

// Função para atualizar os contadores de documentos pendentes
function atualizarContadoresPendentes(clientes) {
    if (!clientes || clientes.length === 0) {
        console.log('Sem dados para atualizar contadores');
        return;
    }
    
    // Buscar documentos com campos importantes faltando novamente
    // para garantir que o contador esteja atualizado
    buscarDocumentosCamposFaltando();
}

// Função para mostrar erro na tabela de relatórios
function mostrarErroRelatorios(mensagem) {
    const tbody = document.getElementById('relatoriosTableBody');
    const loaderElement = document.getElementById('relatoriosLoader');
    
    if (loaderElement) {
        loaderElement.style.display = 'none';
    }
    
    if (tbody) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.setAttribute('colspan', '9');
        cell.className = 'error-data';
        cell.textContent = mensagem;
        
        row.appendChild(cell);
        tbody.innerHTML = '';
        tbody.appendChild(row);
    }
}

// Função para formatar CNPJ
function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    
    // Remover caracteres não numéricos
    let numerico = cnpj.replace(/\D/g, '');
    
    // Aplicar máscara
    if (numerico.length > 12) {
        numerico = numerico.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (numerico.length > 8) {
        numerico = numerico.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    } else if (numerico.length > 5) {
        numerico = numerico.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    } else if (numerico.length > 2) {
        numerico = numerico.replace(/(\d{2})(\d+)/, '$1.$2');
    }
    
    return numerico;
}

// Adicionar evento de redimensionamento de janela para ajuste de altura
window.addEventListener('resize', function() {
    setTimeout(ajustarAlturaTabela, 100);
});

// Função para buscar documentos com campos importantes faltando
async function buscarDocumentosCamposFaltando() {
    try {
        console.log('Buscando documentos com campos importantes faltando...');
        
        const { data, error } = await getAmContabilidade();
        
        if (error) {
            console.error('Erro ao buscar documentos:', error);
            document.getElementById('docsCamposFaltandoCount').textContent = 'Erro';
            return;
        }
        
        if (!data || !Array.isArray(data)) {
            console.log('Nenhum documento encontrado');
            document.getElementById('docsCamposFaltandoCount').textContent = '0';
            return;
        }
        
        // Contar documentos com CNPJ_CLIENTE ou DATA_ARQ nulos
        const documentosFaltando = data.filter(doc => 
            doc.CNPJ_CLIENTE === null || 
            doc.CNPJ_CLIENTE === undefined || 
            doc.CNPJ_CLIENTE === '' || 
            doc.DATA_ARQ === null || 
            doc.DATA_ARQ === undefined || 
            doc.DATA_ARQ === ''
        );
        
        const contador = documentosFaltando.length;
        console.log(`Encontrados ${contador} documentos com campos importantes faltando`);
        
        // Atualizar o contador no card
        const contadorElement = document.getElementById('docsCamposFaltandoCount');
        if (contadorElement) {
            contadorElement.textContent = contador;
            
            // Destacar o card se houver documentos com campos faltando
            const card = document.getElementById('docsCamposFaltandoCard');
            if (card) {
                if (contador > 0) {
                    card.classList.add('card-pendente');
                } else {
                    card.classList.remove('card-pendente');
                }
            }
            
            // Preencher o tooltip com os IDs dos documentos com problemas
            const tooltipContent = document.getElementById('docsCamposFaltandoList');
            if (tooltipContent) {
                // Limpar o conteúdo anterior
                tooltipContent.innerHTML = '';
                
                if (contador > 0) {
                    // Preencher com os detalhes dos documentos com problemas
                    documentosFaltando.forEach(doc => {
                        const itemElement = document.createElement('div');
                        itemElement.className = 'doc-id-item';
                        
                        const idElement = document.createElement('span');
                        idElement.className = 'doc-id';
                        idElement.textContent = `ID: ${doc.id}`;
                        
                        const problemElement = document.createElement('span');
                        problemElement.className = 'doc-problem';
                        
                        // Identificar qual campo está faltando
                        const problemas = [];
                        if (!doc.CNPJ_CLIENTE) problemas.push('CNPJ');
                        if (!doc.DATA_ARQ) problemas.push('Data');
                        
                        problemElement.textContent = problemas.join(', ');
                        
                        itemElement.appendChild(idElement);
                        itemElement.appendChild(problemElement);
                        tooltipContent.appendChild(itemElement);
                    });
                } else {
                    // Mensagem quando não há documentos com problemas
                    tooltipContent.textContent = 'Nenhum documento com campos faltando.';
                }
            }
        }
    } catch (error) {
        console.error('Erro ao processar busca de documentos:', error);
        document.getElementById('docsCamposFaltandoCount').textContent = 'Erro';
    }
} 