console.log('Carregando clienteDetails.js (versão restaurada)...');

// Variáveis globais
let clienteId = null;
let clienteCnpj = null;
let clienteCnpjCurto = null;
let registrosEncontrados = [];

// Evento de carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando página...');
    
    // Esconder o loader após 3 segundos para garantir que a página seja visível mesmo com erro
    setTimeout(function() {
        const loader = document.querySelector('.loader-wrapper');
        if (loader) {
            console.log('Removendo loader principal após timeout');
            loader.classList.add('loader-hidden');
        }
    }, 3000);
    
    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    clienteCnpj = urlParams.get('cnpj');
    
    // Decodificar o CNPJ (para tratar o %2F e outros caracteres codificados)
    if (clienteCnpj) {
        clienteCnpj = decodeURIComponent(clienteCnpj);
        console.log('CNPJ decodificado:', clienteCnpj);
    } else {
        console.warn('CNPJ não fornecido na URL');
    }
    
    console.log('Parâmetros da URL:', { 
        cnpj: clienteCnpj
    });
    
    // Verificar se temos o CNPJ
    if (clienteCnpj) {
        // Remover caracteres não numéricos
        const cnpjNumerico = clienteCnpj.replace(/\D/g, '');
        console.log('CNPJ após remover caracteres não numéricos:', cnpjNumerico);
        
        // Pegar os 6 primeiros dígitos para CNPJ_CURTO
        clienteCnpjCurto = cnpjNumerico.substring(0, 6);
        console.log('CNPJ_CURTO gerado:', clienteCnpjCurto);
    }
    
    // Verificar se temos os parâmetros necessários
    if (!clienteCnpjCurto) {
        console.error('CNPJ_CURTO não disponível');
        mostrarErro('CNPJ_CURTO não disponível para buscar registros');
        
        // Tentar forçar a exibição da mensagem de erro
        document.getElementById('impostosLoader').style.display = 'none';
        document.getElementById('impostosError').style.display = 'block';
        document.getElementById('impostosError').querySelector('p').textContent = 'Erro: CNPJ_CURTO não disponível para buscar registros';
        return;
    }
    
    // Verificar se o objeto supabase existe globalmente
    if (typeof supabase === 'undefined') {
        console.error('Objeto global supabase não está definido!');
        console.log('Tentando criar cliente Supabase diretamente...');
        
        // Tentar forçar a exibição da mensagem de erro
        document.getElementById('impostosLoader').style.display = 'none';
        document.getElementById('impostosError').style.display = 'block';
        document.getElementById('impostosError').querySelector('p').textContent = 'Erro: Biblioteca Supabase não carregada corretamente';
        return;
    } else {
        console.log('Objeto global supabase encontrado');
    }
    
    // Exibir interface do cliente com o CNPJ
    document.getElementById('clienteLoader').style.display = 'none';
    document.getElementById('clienteHeader').style.display = 'flex';
    document.getElementById('clienteNome').textContent = 'Cliente';
    document.getElementById('clienteCnpj').textContent = formatarCNPJ(clienteCnpj) || 'CNPJ não informado';
    
    // Buscar registros na AmContabilidade pelo CNPJ_CURTO
    console.log('Iniciando busca de registros...');
    buscarRegistrosAmContabilidade();
    
    // Inicializar botão de diagnóstico
    const btnDiagnostico = document.getElementById('btnDiagnostico');
    if (btnDiagnostico) {
        btnDiagnostico.addEventListener('click', mostrarDiagnostico);
    }
    
    // Adicionar evento para fechar o alerta de erro
    const closeAlertBtn = document.querySelector('.close-alert');
    if (closeAlertBtn) {
        closeAlertBtn.addEventListener('click', function() {
            document.getElementById('errorAlert').style.display = 'none';
        });
    }

    // Inicializar botões de ação do cliente
    initClientActionButtons();

    // Inicializar botões de filtro
    initFilterButtons();
});

// Função para inicializar botões de ação do cliente
function initClientActionButtons() {
    // Botão Enviar Contrato
    const btnEnviarContrato = document.getElementById('btnEnviarContrato');
    if (btnEnviarContrato) {
        btnEnviarContrato.addEventListener('click', function() {
            console.log('Clicou em Enviar Contrato');
            // Redirecionar para a página de envio de contrato com o CNPJ do cliente
            window.location.href = `enviarContrato.html?cnpj=${encodeURIComponent(clienteCnpj)}&nome=${encodeURIComponent(document.getElementById('clienteNome').textContent)}`;
        });
    }

    // Botão Ver Contratos
    const btnVerContratos = document.getElementById('btnVerContratos');
    if (btnVerContratos) {
        btnVerContratos.addEventListener('click', function() {
            console.log('Clicou em Ver Contratos');
            // Redirecionar para a página de visualização de contratos
            window.location.href = `verContratos.html?cnpj=${encodeURIComponent(clienteCnpj)}&nome=${encodeURIComponent(document.getElementById('clienteNome').textContent)}`;
        });
    }

    // Botão Ver Comprovantes
    const btnVerComprovantes = document.getElementById('btnVerComprovantes');
    if (btnVerComprovantes) {
        btnVerComprovantes.addEventListener('click', function() {
            console.log('Clicou em Ver Comprovantes');
            // Redirecionar para a página de visualização de comprovantes
            window.location.href = `verComprovantes.html?cnpj=${encodeURIComponent(clienteCnpj)}&nome=${encodeURIComponent(document.getElementById('clienteNome').textContent)}`;
        });
    }
    
    // Botão Enviar Documento
    const btnEnviarDocumento = document.getElementById('btnEnviarDocumento');
    if (btnEnviarDocumento) {
        btnEnviarDocumento.addEventListener('click', function() {
            console.log('Clicou em Enviar Documento');
            abrirModalEnvio();
        });
    }
}

// Função para inicializar botões de filtro
function initFilterButtons() {
    const filterButtons = {
        all: document.getElementById('filterAll'),
        pending: document.getElementById('filterPending'),
        paid: document.getElementById('filterPaid'),
        overdue: document.getElementById('filterOverdue')
    };

    // Verificar se os botões existem
    if (!filterButtons.all || !filterButtons.pending || !filterButtons.paid || !filterButtons.overdue) {
        console.error('Botões de filtro não encontrados');
        return;
    }

    // Função para atualizar a classe ativa
    function setActiveFilter(activeButton) {
        Object.values(filterButtons).forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    // Adicionar event listeners aos botões
    filterButtons.all.addEventListener('click', function() {
        setActiveFilter(this);
        filterRegistros('all');
    });

    filterButtons.pending.addEventListener('click', function() {
        setActiveFilter(this);
        filterRegistros('pending');
    });

    filterButtons.paid.addEventListener('click', function() {
        setActiveFilter(this);
        filterRegistros('paid');
    });

    filterButtons.overdue.addEventListener('click', function() {
        setActiveFilter(this);
        filterRegistros('overdue');
    });
}

// Função para filtrar registros
function filterRegistros(filter) {
    console.log('Aplicando filtro:', filter);
    
    if (!registrosEncontrados || registrosEncontrados.length === 0) {
        console.log('Não há registros para filtrar');
        return;
    }

    let registrosFiltrados = [];

    switch (filter) {
        case 'all':
            registrosFiltrados = registrosEncontrados;
            break;
            
        case 'pending':
            registrosFiltrados = registrosEncontrados.filter(registro => {
                const status = registro.STATUS || registro.status || '';
                const dataVencimento = registro.DATA_ARQ || registro.dataArq || registro.DATA_VENCIMENTO || '';
                
                // Verificar se é pendente (não pago)
                const isPendente = status !== 'S' && status !== 'Pago';
                
                // Se não for pendente, já retorna falso
                if (!isPendente || !dataVencimento) {
                    return isPendente && !dataVencimento; // Mostra só se for pendente e não tiver data
                }
                
                // Verificar se não está vencido (data maior ou igual a hoje)
                const parts = dataVencimento.split('/');
                if (parts.length === 3) {
                    const dataVenc = new Date(parts[2], parts[1] - 1, parts[0]); // formato DD/MM/YYYY
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0); // Ignorar horas, minutos e segundos
                    
                    // Retornar true apenas se não estiver vencido
                    return dataVenc >= hoje;
                }
                
                return isPendente; // Se não conseguir comparar a data, mostra se for pendente
            });
            break;
            
        case 'paid':
            registrosFiltrados = registrosEncontrados.filter(registro => {
                const status = registro.STATUS || registro.status || '';
                return status === 'S' || status === 'Pago';
            });
            break;
            
        case 'overdue':
            registrosFiltrados = registrosEncontrados.filter(registro => {
                const status = registro.STATUS || registro.status || '';
                const dataVencimento = registro.DATA_ARQ || registro.dataArq || registro.DATA_VENCIMENTO || '';
                
                // Verificar se o status é pendente e a data de vencimento é válida
                if ((status !== 'S' && status !== 'Pago') && dataVencimento) {
                    // Converter data de vencimento para objeto Date
                    const parts = dataVencimento.split('/');
                    if (parts.length === 3) {
                        const dataVenc = new Date(parts[2], parts[1] - 1, parts[0]); // formato DD/MM/YYYY
                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0); // Ignorar horas, minutos e segundos
                        
                        // Retornar true se a data de vencimento for menor que hoje
                        return dataVenc < hoje;
                    }
                }
                return false;
            });
            break;
            
        default:
            registrosFiltrados = registrosEncontrados;
    }

    console.log(`Filtro "${filter}" aplicado: ${registrosFiltrados.length} registros de ${registrosEncontrados.length}`);
    renderizarRegistros(registrosFiltrados);
}

// Função para buscar registros na AmContabilidade
function buscarRegistrosAmContabilidade() {
    console.log('Buscando registros na AmContabilidade com CNPJ_CURTO:', clienteCnpjCurto);
    
    // Mostrar loader
    document.getElementById('impostosLoader').style.display = 'flex';
    document.getElementById('impostosTable').style.display = 'none';
    document.getElementById('impostosError').style.display = 'none';
    document.getElementById('impostosEmpty').style.display = 'none';
    
    try {
        // Verificar se temos o CNPJ_CURTO
        if (!clienteCnpjCurto) {
            throw new Error('CNPJ_CURTO não disponível para buscar registros');
        }
        
        // Buscar registros pelo CNPJ_CURTO
        supabase
            .from('AmContabilidade')
            .select('*')
            .eq('CNPJ_CURTO', clienteCnpjCurto)
            .then(({ data, error }) => {
                console.log('Resposta da consulta:', { data, error });
                
                if (error) {
                    console.error('Erro ao buscar registros:', error);
                    document.getElementById('impostosLoader').style.display = 'none';
                    document.getElementById('impostosError').style.display = 'block';
                    document.getElementById('impostosError').querySelector('p').textContent = 'Erro ao carregar registros: ' + error.message;
                    return;
                }
                
                // Verificar se encontrou registros
                if (!data || data.length === 0) {
                    console.log('Nenhum registro encontrado com CNPJ_CURTO:', clienteCnpjCurto);
                    document.getElementById('impostosLoader').style.display = 'none';
                    document.getElementById('impostosEmpty').style.display = 'block';
                    
                    // Atualizar mensagem de erro com CNPJ
                    document.getElementById('cnpjClienteEmpty').textContent = formatarCNPJ(clienteCnpj) || '-';
                    document.getElementById('cnpjCurtoClienteEmpty').textContent = clienteCnpjCurto || '-';
                    
                    return;
                }
                
                console.log(`Encontrados ${data.length} registros com CNPJ_CURTO ${clienteCnpjCurto}`);
                
                // Armazenar dados e renderizar
                registrosEncontrados = data;
                renderizarRegistros(data);
                
                // Aplicar filtro inicial (todos)
                setTimeout(() => {
                    filterRegistros('all');
                }, 100);
            })
            .catch(error => {
                console.error('Erro ao buscar registros:', error);
                document.getElementById('impostosLoader').style.display = 'none';
                document.getElementById('impostosError').style.display = 'block';
                document.getElementById('impostosError').querySelector('p').textContent = 'Erro ao carregar registros: ' + error.message;
            });
    } catch (error) {
        console.error('Erro ao executar consulta:', error);
        document.getElementById('impostosLoader').style.display = 'none';
        document.getElementById('impostosError').style.display = 'block';
        document.getElementById('impostosError').querySelector('p').textContent = 'Erro: ' + error.message;
    }
}

// Função para renderizar registros na tabela
function renderizarRegistros(registros) {
    try {
        console.log('Renderizando registros:', registros.length);
        const tableBody = document.getElementById('impostosTableBody');
        if (!tableBody) {
            console.error('Elemento impostosTableBody não encontrado');
            return;
        }
        
        tableBody.innerHTML = '';
        
        // Inicializar soma total
        let somaTotal = 0;
        
        registros.forEach((registro, index) => {
            console.log(`Processando registro ${index}:`, registro);
            const row = document.createElement('tr');
            
            // Usar valores padrão se os campos não existirem
            const nome = registro.NOME_PDF || registro.nomePdf || registro.IMPOSTO || `Registro ${index + 1}`;
            const dataPagamento = registro.DATA_PAG || registro.dataPag || registro.DATA_PAGAMENTO || '-';
            const dataVencimento = registro.DATA_ARQ || registro.dataArq || registro.DATA_VENCIMENTO || '-';
            const valor = registro.VALOR_PFD || registro.valorPfd || registro.VALOR || '-';
            
            // Adicionar valor ao total (convertendo para número)
            const valorNumerico = parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.'));
            if (!isNaN(valorNumerico)) {
                somaTotal += valorNumerico;
            }
            
            // Status (padrão: pendente)
            const isPago = registro.STATUS === 'S' || registro.status === 'S' || registro.STATUS === 'Pago';
            
            // Verificar se está vencido (data menor que hoje e não pago)
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            let isVencido = false;
            
            if (!isPago && dataVencimento !== '-') {
                const parts = dataVencimento.split('/');
                if (parts.length === 3) {
                    const dataVenc = new Date(parts[2], parts[1] - 1, parts[0]);
                    isVencido = dataVenc < hoje;
                }
            }
            
            let statusClass = '';
            let statusText = '';
            
            if (isPago) {
                statusClass = 'status-active';
                statusText = 'Pago';
            } else if (isVencido) {
                statusClass = 'status-vencido';
                statusText = 'Vencido';
            } else {
                statusClass = 'status-pending';
                statusText = 'Pendente';
            }
            
            row.innerHTML = `
                <td>${nome}</td>
                <td>${dataPagamento}</td>
                <td>R$ ${valor}</td>
                <td>${dataVencimento}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td class="actions-cell">
                    <a href="${registro.URL_PDF || '#'}" target="_blank" class="action-icon view-action" title="Visualizar documento"><i class="bi bi-eye"></i></a>
                    <a href="#" class="action-icon edit-action" data-id="${registro.id}" title="Editar documento"><i class="bi bi-pencil"></i></a>
                    <a href="#" class="action-icon delete-action"><i class="bi bi-trash"></i></a>
                </td>
            `;
            
            // Adicionar a linha à tabela
            tableBody.appendChild(row);
            
            // Verificar se a URL do PDF existe e adicionar manipulador de eventos
            const viewButton = row.querySelector('.view-action');
            if (viewButton) {
                // Se não tiver URL_PDF válida, mostrar mensagem ao clicar
                if (!registro.URL_PDF) {
                    viewButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        mostrarErro('URL do documento não disponível');
                    });
                }
            }

            // Adicionar evento ao botão de edição
            const editButton = row.querySelector('.edit-action');
            if (editButton) {
                editButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    const documentoId = this.getAttribute('data-id');
                    if (documentoId) {
                        abrirModalEdicao(documentoId);
                    }
                });
            }
        });
        
        // Mostrar tabela e esconder loader
        document.getElementById('impostosLoader').style.display = 'none';
        document.getElementById('impostosTable').style.display = 'table';
        
        // Atualizar o total na interface
        atualizarTotalValores(somaTotal);
        
        console.log('Registros renderizados com sucesso');
    } catch (error) {
        console.error('Erro ao renderizar registros:', error);
        document.getElementById('impostosLoader').style.display = 'none';
        document.getElementById('impostosError').style.display = 'block';
        document.getElementById('impostosError').querySelector('p').textContent = 'Erro ao renderizar registros: ' + error.message;
    }
}

// Função para atualizar o total dos valores na interface
function atualizarTotalValores(total) {
    // Verificar se o elemento de total existe, se não, criá-lo
    let totalElement = document.getElementById('totalValores');
    if (!totalElement) {
        const tableContainer = document.querySelector('.table-container');
        if (!tableContainer) return;
        
        // Remover qualquer totalValoresContainer existente
        const existingTotalContainer = document.getElementById('totalValoresContainer');
        if (existingTotalContainer) {
            existingTotalContainer.remove();
        }
        
        // Criar elemento para exibir o total
        const totalDiv = document.createElement('div');
        totalDiv.id = 'totalValoresContainer';
        totalDiv.className = 'valores-totais';
        totalDiv.innerHTML = `
            <p>Total: <span id="totalValores" class="total-valor">R$ 0,00</span></p>
        `;
        
        // Inserir após a tabela, fora do container
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            // Inserir o total logo após o container da tabela
            tableContainer.insertAdjacentElement('afterend', totalDiv);
        } else {
            // Fallback: adicionar ao final do container da tabela
            tableContainer.appendChild(totalDiv);
        }
        
        totalElement = document.getElementById('totalValores');
    }
    
    // Atualizar o valor formatado
    totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Função para formatar CNPJ
function formatarCNPJ(cnpj) {
    if (!cnpj) return '-';
    
    // Remover caracteres não numéricos
    cnpj = cnpj.replace(/\D/g, '');
    
    // Verificar se tem o tamanho correto
    if (cnpj.length !== 14) return cnpj;
    
    // Formatar como XX.XXX.XXX/XXXX-XX
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Função para mostrar erro
function mostrarErro(mensagem) {
    console.error('ERRO:', mensagem);
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorAlert && errorMessage) {
        errorMessage.textContent = mensagem;
        errorAlert.style.display = 'block';
        
        // Esconder após 10 segundos
        setTimeout(function() {
            errorAlert.style.display = 'none';
        }, 10000);
    } else {
        console.error('Elementos de alerta não encontrados');
        alert(mensagem);
    }
}

// Função para mostrar informações de diagnóstico
function mostrarDiagnostico() {
    console.log('Mostrando informações de diagnóstico...');
    
    const diagnosticoResultado = document.getElementById('diagnosticoResultado');
    const diagnosticoInfo = document.getElementById('diagnosticoInfo');
    
    if (!diagnosticoResultado || !diagnosticoInfo) {
        console.error('Elementos de diagnóstico não encontrados');
        return;
    }
    
    // Coletar informações de diagnóstico
    const info = {
        timestamp: new Date().toISOString(),
        navegador: navigator.userAgent,
        url: window.location.href,
        parametrosUrl: {
            clienteCnpj,
            clienteCnpjCurto,
            clienteCnpjDecodificado: clienteCnpj ? decodeURIComponent(clienteCnpj) : null
        },
        supabase: {
            objetoDefinido: typeof supabase !== 'undefined'
        },
        dados: {
            registrosEncontrados: registrosEncontrados ? registrosEncontrados.length : 0
        },
        elementosPresentes: {
            clienteLoader: !!document.getElementById('clienteLoader'),
            clienteHeader: !!document.getElementById('clienteHeader'),
            impostosLoader: !!document.getElementById('impostosLoader'),
            impostosTable: !!document.getElementById('impostosTable'),
            impostosError: !!document.getElementById('impostosError'),
            impostosEmpty: !!document.getElementById('impostosEmpty')
        },
        estadoElementos: {
            clienteLoader: document.getElementById('clienteLoader')?.style.display,
            clienteHeader: document.getElementById('clienteHeader')?.style.display,
            impostosLoader: document.getElementById('impostosLoader')?.style.display,
            impostosTable: document.getElementById('impostosTable')?.style.display,
            impostosError: document.getElementById('impostosError')?.style.display,
            impostosEmpty: document.getElementById('impostosEmpty')?.style.display
        }
    };
    
    // Exibir informações
    diagnosticoInfo.textContent = JSON.stringify(info, null, 2);
    
    // Mostrar/esconder o resultado
    if (diagnosticoResultado.style.display === 'none') {
        diagnosticoResultado.style.display = 'block';
    } else {
        diagnosticoResultado.style.display = 'none';
    }
}

// Função para abrir o modal de edição
function abrirModalEdicao(documentoId) {
    try {
        console.log('Abrindo modal de edição para o documento ID:', documentoId);
        
        // Encontrar o registro correspondente
        const registro = registrosEncontrados.find(r => r.id == documentoId);
        if (!registro) {
            console.error('Registro não encontrado para ID:', documentoId);
            mostrarErro('Registro não encontrado.');
            return;
        }
        
        console.log('Registro encontrado:', registro);
        
        // Preencher o formulário com os valores atuais
        document.getElementById('editDocumentoId').value = registro.id;
        document.getElementById('editNomePdf').value = registro.NOME_PDF || '';
        document.getElementById('editCnpjCliente').value = registro.CNPJ_CLIENTE || clienteCnpj || '';
        document.getElementById('editDataArq').value = registro.DATA_ARQ || '';
        document.getElementById('editValorPfd').value = registro.VALOR_PFD || '';
        
        // Exibir o modal
        const modal = document.getElementById('editDocumentoModal');
        
        // Primeiro, garantir que o backdrop seja visível
        modal.style.display = 'flex';
        
        // Forçar a opacidade do modal para 1 para evitar transparência
        const modalContent = modal.querySelector('.modal');
        if (modalContent) {
            modalContent.style.opacity = '1';
            modalContent.style.backgroundColor = '#1a2330';
            modalContent.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.5)';
            modalContent.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        }
        
        // Adicionar a classe active após um pequeno delay para garantir a animação
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Adicionar evento para fechar o modal
        document.getElementById('closeEditModal').addEventListener('click', fecharModalEdicao);
        document.getElementById('cancelEditDocumento').addEventListener('click', fecharModalEdicao);
        
        // Adicionar evento para salvar alterações
        document.getElementById('saveEditDocumento').addEventListener('click', salvarEdicaoDocumento);
        
    } catch (error) {
        console.error('Erro ao abrir modal de edição:', error);
        mostrarErro('Erro ao abrir janela de edição: ' + error.message);
    }
}

// Função para fechar o modal de edição
function fecharModalEdicao() {
    console.log('Fechando modal de edição');
    
    const modal = document.getElementById('editDocumentoModal');
    modal.classList.remove('active');
    
    // Usar setTimeout para dar tempo à animação de transição
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    // Remover os event listeners para evitar duplicação
    document.getElementById('closeEditModal').removeEventListener('click', fecharModalEdicao);
    document.getElementById('cancelEditDocumento').removeEventListener('click', fecharModalEdicao);
    document.getElementById('saveEditDocumento').removeEventListener('click', salvarEdicaoDocumento);
}

// Função para salvar a edição do documento
async function salvarEdicaoDocumento() {
    try {
        console.log('Salvando alterações do documento...');
        
        // Obter valores do formulário
        const documentoId = document.getElementById('editDocumentoId').value;
        const nomePdf = document.getElementById('editNomePdf').value;
        const cnpjCliente = document.getElementById('editCnpjCliente').value;
        const dataArq = document.getElementById('editDataArq').value;
        const valorPfd = document.getElementById('editValorPfd').value;
        
        // Validar os campos
        if (!nomePdf || !cnpjCliente || !dataArq || !valorPfd) {
            mostrarErro('Todos os campos são obrigatórios.');
            return;
        }
        
        // Validar formato da data (DD/MM/YYYY)
        if (!validarFormatoData(dataArq)) {
            mostrarErro('Data inválida. Use o formato DD/MM/AAAA.');
            return;
        }
        
        // Gerar CNPJ_CURTO (6 primeiros dígitos do CNPJ numérico)
        const cnpjNumerico = cnpjCliente.replace(/\D/g, '');
        const cnpjCurto = cnpjNumerico.substring(0, 6);
        
        // Converter data para timestamp UNIX
        const dataDecimal = converterDataParaTimestamp(dataArq);
        
        console.log('Dados processados:', {
            id: documentoId,
            NOME_PDF: nomePdf,
            CNPJ_CLIENTE: cnpjCliente,
            DATA_ARQ: dataArq,
            VALOR_PFD: valorPfd,
            CNPJ_CURTO: cnpjCurto,
            DATA_DECIMAL: dataDecimal
        });
        
        // Atualizar no Supabase
        const { data, error } = await supabase
            .from('AmContabilidade')
            .update({
                NOME_PDF: nomePdf,
                CNPJ_CLIENTE: cnpjCliente,
                DATA_ARQ: dataArq,
                VALOR_PFD: valorPfd,
                CNPJ_CURTO: cnpjCurto,
                DATA_DECIMAL: dataDecimal
            })
            .eq('id', documentoId);
        
        if (error) {
            console.error('Erro ao atualizar documento:', error);
            mostrarErro('Erro ao salvar alterações: ' + error.message);
            return;
        }
        
        console.log('Documento atualizado com sucesso.');
        
        // Fechar o modal
        fecharModalEdicao();
        
        // Atualizar a tabela
        buscarRegistrosAmContabilidade();
        
        // Mostrar mensagem de sucesso
        mostrarSucesso('Documento atualizado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar edição do documento:', error);
        mostrarErro('Erro ao salvar alterações: ' + error.message);
    }
}

// Função para validar formato de data DD/MM/YYYY
function validarFormatoData(data) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(data)) return false;
    
    const partes = data.split('/');
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // Mês em JS começa em 0
    const ano = parseInt(partes[2], 10);
    
    // Verificar se a data é válida
    const dataObj = new Date(ano, mes, dia);
    return (
        dataObj.getDate() === dia &&
        dataObj.getMonth() === mes &&
        dataObj.getFullYear() === ano
    );
}

// Função para converter data DD/MM/YYYY para timestamp Unix
function converterDataParaTimestamp(dataString) {
    try {
        // Garantir formato consistente
        const partes = dataString.split('/');
        if (partes.length !== 3) {
            console.error('Formato de data inválido:', dataString);
            return 0;
        }

        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const ano = parseInt(partes[2], 10);
        
        // Verificação adicional
        if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
            console.error('Componentes de data inválidos:', dia, mes, ano);
            return 0;
        }
        
        // Construir a data padronizada para JavaScript (YYYY-MM-DD)
        const dataFormatada = `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}T00:00:00Z`;
        
        // Criar data usando formato ISO para evitar problemas com fusos horários
        const timestamp = Math.floor(new Date(dataFormatada).getTime() / 1000);
        
        // Debug extensivo
        console.log('----- Conversão de Data para Timestamp -----');
        console.log(`Data original: ${dataString}`);
        console.log(`Data formatada ISO: ${dataFormatada}`);
        console.log(`Timestamp gerado: ${timestamp}`);
        console.log(`Data do timestamp: ${new Date(timestamp * 1000).toUTCString()}`);
        console.log('-------------------------------------------');

        return timestamp;
    } catch (error) {
        console.error('Erro ao converter data para timestamp:', error);
        return 0;
    }
}

// Função para mostrar mensagem de sucesso
function mostrarSucesso(mensagem) {
    console.log('SUCESSO:', mensagem);
    
    // Criar uma div de alerta temporária
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-success';
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.padding = '15px 20px';
    alertDiv.style.borderRadius = '5px';
    alertDiv.style.backgroundColor = 'rgba(40, 167, 69, 0.9)';
    alertDiv.style.color = 'white';
    alertDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    
    // Adicionar ícone e mensagem
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle-fill" style="margin-right: 10px;"></i>
        <span>${mensagem}</span>
    `;
    
    // Adicionar ao corpo do documento
    document.body.appendChild(alertDiv);
    
    // Remover após 3 segundos
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transition = 'opacity 0.5s ease';
        
        // Remover do DOM após a transição
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 500);
    }, 3000);
}

// Função para abrir o modal de envio
function abrirModalEnvio() {
    try {
        console.log('Abrindo modal de envio de documento');
        
        // Preencher o CNPJ do cliente (somente leitura)
        document.getElementById('enviarCnpjCliente').value = formatarCNPJ(clienteCnpj) || '';
        
        // Limpar outros campos
        document.getElementById('enviarNomePdf').value = '';
        document.getElementById('enviarDataArq').value = '';
        document.getElementById('enviarValorPfd').value = '';
        document.getElementById('enviarPdfFile').value = '';
        document.getElementById('fileNameDisplay').textContent = 'Nenhum arquivo selecionado';
        
        // Ocultar a barra de progresso
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressText').textContent = '0%';
        
        // Exibir o modal
        const modal = document.getElementById('enviarDocumentoModal');
        
        // Primeiro, garantir que o backdrop seja visível
        modal.style.display = 'flex';
        
        // Forçar a opacidade do modal para 1 para evitar transparência
        const modalContent = modal.querySelector('.modal');
        if (modalContent) {
            modalContent.style.opacity = '1';
            modalContent.style.backgroundColor = '#1a2330';
            modalContent.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.5)';
            modalContent.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        }
        
        // Adicionar a classe active após um pequeno delay para garantir a animação
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Configurar o botão "Escolher arquivo" para acionar o input file
        document.getElementById('selectFileBtn').addEventListener('click', function() {
            document.getElementById('enviarPdfFile').click();
        });
        
        // Atualizar o nome do arquivo quando um for selecionado
        document.getElementById('enviarPdfFile').addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'Nenhum arquivo selecionado';
            document.getElementById('fileNameDisplay').textContent = fileName;
        });
        
        // Adicionar evento para fechar o modal
        document.getElementById('closeEnviarModal').addEventListener('click', fecharModalEnvio);
        document.getElementById('cancelEnviarDocumento').addEventListener('click', fecharModalEnvio);
        
        // Adicionar evento para salvar/enviar documento
        document.getElementById('saveEnviarDocumento').addEventListener('click', enviarDocumento);
        
    } catch (error) {
        console.error('Erro ao abrir modal de envio:', error);
        mostrarErro('Erro ao abrir janela de envio: ' + error.message);
    }
}

// Função para fechar o modal de envio
function fecharModalEnvio() {
    console.log('Fechando modal de envio');
    
    const modal = document.getElementById('enviarDocumentoModal');
    modal.classList.remove('active');
    
    // Usar setTimeout para dar tempo à animação de transição
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    // Remover os event listeners para evitar duplicação
    document.getElementById('closeEnviarModal').removeEventListener('click', fecharModalEnvio);
    document.getElementById('cancelEnviarDocumento').removeEventListener('click', fecharModalEnvio);
    document.getElementById('saveEnviarDocumento').removeEventListener('click', enviarDocumento);
    document.getElementById('selectFileBtn').removeEventListener('click', function() {});
    document.getElementById('enviarPdfFile').removeEventListener('change', function() {});
}

// Função para enviar o documento
async function enviarDocumento() {
    try {
        console.log('Iniciando envio de documento...');
        
        // Obter valores do formulário
        const nomePdf = document.getElementById('enviarNomePdf').value;
        const cnpjCliente = document.getElementById('enviarCnpjCliente').value;
        const dataArq = document.getElementById('enviarDataArq').value;
        const valorPfd = document.getElementById('enviarValorPfd').value;
        const pdfFile = document.getElementById('enviarPdfFile').files[0];
        
        // Validar os campos
        if (!nomePdf || !cnpjCliente || !dataArq || !valorPfd) {
            mostrarErro('Todos os campos são obrigatórios.');
            return;
        }
        
        // Validar formato da data (DD/MM/YYYY)
        if (!validarFormatoData(dataArq)) {
            mostrarErro('Data inválida. Use o formato DD/MM/AAAA.');
            return;
        }
        
        // Validar arquivo PDF
        if (!pdfFile) {
            mostrarErro('Selecione um arquivo PDF para enviar.');
            return;
        }
        
        // Verificar tipo de arquivo
        if (pdfFile.type !== 'application/pdf') {
            mostrarErro('Apenas arquivos PDF são permitidos.');
            return;
        }
        
        // Verificar tamanho do arquivo (máx. 10MB)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB em bytes
        if (pdfFile.size > MAX_SIZE) {
            mostrarErro('O arquivo é muito grande. O tamanho máximo é 10MB.');
            return;
        }
        
        // Mostrar progresso do upload
        document.getElementById('uploadProgress').style.display = 'block';
        
        // Gerar nome único para o arquivo
        const cnpjNumerico = cnpjCliente.replace(/\D/g, '');
        const cnpjCurto = cnpjNumerico.substring(0, 6);
        const timestamp = new Date().getTime();
        const fileName = `${cnpjCurto}_${timestamp}_${pdfFile.name}`;
        
        // Converter data para timestamp UNIX (DATA_DECIMAL)
        const dataDecimal = converterDataParaTimestamp(dataArq);
        
        // Upload do arquivo para o Storage do Supabase
        console.log('Iniciando upload do arquivo para o Supabase Storage...');
        
        try {
            // Fazer upload para o bucket "PDFs"
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('PDFs')
                .upload(fileName, pdfFile, {
                    cacheControl: '3600',
                    upsert: false,
                    onUploadProgress: (progress) => {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        document.getElementById('progressBar').style.width = `${percent}%`;
                        document.getElementById('progressText').textContent = `${percent}%`;
                    }
                });
            
            if (uploadError) {
                console.error('Erro no upload do arquivo:', uploadError);
                mostrarErro('Erro ao enviar o arquivo: ' + uploadError.message);
                return;
            }
            
            console.log('Arquivo enviado com sucesso:', uploadData);
            
            // Obter URL pública do arquivo
            const { data: urlData } = await supabase.storage
                .from('PDFs')
                .getPublicUrl(fileName);
            
            const pdfUrl = urlData.publicUrl;
            console.log('URL pública do PDF:', pdfUrl);
            
            // Preparar dados para salvar na tabela AmContabilidade
            const documentoData = {
                NOME_PDF: nomePdf,
                CNPJ_CLIENTE: cnpjCliente,
                DATA_ARQ: dataArq,
                VALOR_PFD: valorPfd,
                CNPJ_CURTO: cnpjCurto,
                DATA_DECIMAL: dataDecimal,
                URL_PDF: pdfUrl
            };
            
            console.log('Dados do documento para inserção:', documentoData);
            
            // Inserir registro na tabela AmContabilidade
            const { data, error } = await supabase
                .from('AmContabilidade')
                .insert([documentoData]);
            
            if (error) {
                console.error('Erro ao salvar documento:', error);
                mostrarErro('Erro ao salvar documento: ' + error.message);
                return;
            }
            
            console.log('Documento salvo com sucesso:', data);
            
            // Fechar o modal
            fecharModalEnvio();
            
            // Atualizar a tabela
            buscarRegistrosAmContabilidade();
            
            // Mostrar mensagem de sucesso
            mostrarSucesso('Documento enviado com sucesso!');
            
        } catch (uploadError) {
            console.error('Erro durante o upload:', uploadError);
            mostrarErro('Erro durante o upload do arquivo: ' + uploadError.message);
        }
        
    } catch (error) {
        console.error('Erro ao enviar documento:', error);
        mostrarErro('Erro ao enviar documento: ' + error.message);
    }
}

// Adicionar estilos CSS para o input de arquivo
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar estilos para o input de arquivo personalizado
    const style = document.createElement('style');
    style.textContent = `
        .custom-file-upload {
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 10px;
            background-color: rgba(255, 255, 255, 0.05);
            margin-bottom: 5px;
        }
        
        .custom-file-upload input[type="file"] {
            display: none;
        }
        
        .file-upload-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .progress {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            height: 10px;
            overflow: hidden;
            margin-bottom: 5px;
        }
    `;
    document.head.appendChild(style);
});

console.log('Arquivo clienteDetails.js carregado com sucesso!'); 