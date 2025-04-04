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
                    <a href="#" class="action-icon view-action"><i class="bi bi-eye"></i></a>
                    <a href="#" class="action-icon edit-action"><i class="bi bi-pencil"></i></a>
                    <a href="#" class="action-icon delete-action"><i class="bi bi-trash"></i></a>
                </td>
            `;
            
            tableBody.appendChild(row);
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
        
        // Criar elemento para exibir o total
        const totalDiv = document.createElement('div');
        totalDiv.id = 'totalValoresContainer';
        totalDiv.className = 'valores-totais';
        totalDiv.innerHTML = `
            <p>Total: <span id="totalValores" class="total-valor">R$ 0,00</span></p>
        `;
        
        // Inserir após a tabela
        tableContainer.appendChild(totalDiv);
        totalElement = document.getElementById('totalValores');
    }
    
    // Atualizar o valor formatado
    totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
} 