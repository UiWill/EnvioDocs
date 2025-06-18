// PROTEÇÃO DE SESSÃO - Detecta perda de sessão e redireciona automaticamente
(function() {
    'use strict';
    
    // Detectar contexto da página
    const isClientePage = window.location.href.includes('/CLIENTES/');
    const isContabilidadePage = window.location.href.includes('/CONTABILIDADE/');
    const isLoginPage = window.location.href.includes('login.html');
    
    // Se estiver na página de login, não fazer nada
    if (isLoginPage) return;
    
    let verificacoesFalhas = 0;
    const MAX_FALHAS = 2; // Voltar para 2 falhas para ser menos agressivo
    let ultimaVerificacao = Date.now();
    let paginaCarregando = true;
    let tempoInicioCarregamento = Date.now();
    let errosConsecutivos = 0;
    
    // Lista de erros que são normais e não indicam perda de sessão
    const errosNormais = [
        'Load failed',
        'CORS',
        'access control checks',
        'Network request failed',
        'Failed to fetch',
        'TypeError: Load failed',
        'TypeError: Network request failed'
    ];
    
    // Função para verificar se é um erro normal de API
    function isErroNormalAPI(error) {
        const errorMsg = error?.message || error?.toString() || '';
        return errosNormais.some(erro => errorMsg.includes(erro));
    }
    
    // Função para redirecionar para login
    function redirecionarParaLogin(motivo = 'Sessão expirada') {
        console.log('🔄 REDIRECIONANDO PARA LOGIN:', motivo);
        
        // Limpar dados da sessão
        if (isClientePage) {
            sessionStorage.removeItem('clienteData');
        }
        sessionStorage.clear();
        
        // Redirecionar para a página de login apropriada
        if (isClientePage) {
            window.location.href = 'login.html';
        } else if (isContabilidadePage) {
            window.location.href = 'login.html';
        }
    }
    
    // Verificar se a página está carregando há muito tempo
    function verificarCarregamentoTravado() {
        const tempoCarregando = Date.now() - tempoInicioCarregamento;
        
        if (paginaCarregando && tempoCarregando > 15000) { // Aumentar para 15 segundos
            console.log('⚠️ Página carregando há mais de 15 segundos, possível problema');
            redirecionarParaLogin('Página travada no carregamento');
            return true;
        }
        
        // Verificar loaders específicos visíveis
        const loaders = document.querySelectorAll('#clientesLoader, .loader-wrapper, .loading-data, [class*="loading"], [class*="loader"]');
        let loaderVisivel = false;
        
        loaders.forEach(loader => {
            if (loader && (loader.style.display === 'flex' || loader.style.display === 'block' || (!loader.style.display && loader.offsetParent !== null))) {
                loaderVisivel = true;
            }
        });
        
        if (loaderVisivel && tempoCarregando > 12000) { // Aumentar para 12 segundos
            console.log('⚠️ Loader visível há mais de 12 segundos');
            redirecionarParaLogin('Loader travado - possível perda de sessão');
            return true;
        }
        
        return false;
    }
    
    // Verificar estado da sessão de forma mais inteligente
    async function verificarSessao() {
        try {
            // Verificar se está travado no carregamento primeiro
            if (verificarCarregamentoTravado()) {
                return;
            }
            
            console.log('🔍 Verificando sessão...', {
                contexto: isClientePage ? 'CLIENTE' : 'CONTABILIDADE',
                falhas: verificacoesFalhas,
                carregando: paginaCarregando,
                errosConsecutivos: errosConsecutivos
            });
            
            if (isClientePage) {
                // Para páginas de CLIENTES
                const clienteData = sessionStorage.getItem('clienteData');
                const authToken = localStorage.getItem('sb-osnjsgleardkzrnddlgt-auth-token');
                
                console.log('Cliente - Estado:', {
                    clienteData: !!clienteData,
                    authToken: !!authToken
                });
                
                if (!clienteData) {
                    console.log('⚠️ clienteData perdido!');
                    verificacoesFalhas++;
                    if (verificacoesFalhas >= MAX_FALHAS) {
                        redirecionarParaLogin('Dados do cliente perdidos');
                        return;
                    }
                }
                
                if (!authToken) {
                    console.log('⚠️ Token de autenticação perdido!');
                    verificacoesFalhas++;
                    if (verificacoesFalhas >= MAX_FALHAS) {
                        redirecionarParaLogin('Token perdido');
                        return;
                    }
                }
                
                // Verificar Supabase com tratamento de erros normais
                if (typeof supabase !== 'undefined') {
                    try {
                        const { data, error } = await Promise.race([
                            supabase.auth.getSession(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout auth check')), 5000))
                        ]);
                        
                        console.log('Cliente - Supabase Session:', {
                            hasSession: !!data?.session,
                            hasUser: !!data?.session?.user,
                            error: error?.message || 'nenhum'
                        });
                        
                        if (error && !isErroNormalAPI(error)) {
                            console.log('⚠️ Erro Supabase relevante:', error.message);
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Erro de autenticação Supabase');
                                return;
                            }
                        } else if (!data?.session?.user && !error) {
                            console.log('⚠️ Sessão Supabase não encontrada');
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Sessão Supabase expirada');
                                return;
                            }
                        }
                    } catch (error) {
                        if (error.message === 'Timeout auth check') {
                            console.log('⚠️ Timeout na verificação de autenticação');
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Timeout na autenticação');
                                return;
                            }
                        } else if (!isErroNormalAPI(error)) {
                            console.log('⚠️ Erro na verificação Supabase:', error.message);
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Falha na conexão com Supabase');
                                return;
                            }
                        } else {
                            console.log('📡 Erro normal de API ignorado:', error.message);
                        }
                    }
                }
                
            } else if (isContabilidadePage) {
                // Para páginas de CONTABILIDADE
                const authToken = localStorage.getItem('sb-osnjsgleardkzrnddlgt-auth-token');
                
                console.log('Contabilidade - Estado:', {
                    authToken: !!authToken,
                    contabilidadeData: !!window.contabilidadeData,
                    currentUser: !!window.currentUser
                });
                
                if (!authToken) {
                    console.log('⚠️ Token de autenticação perdido!');
                    verificacoesFalhas++;
                    if (verificacoesFalhas >= MAX_FALHAS) {
                        redirecionarParaLogin('Token de autenticação perdido');
                        return;
                    }
                }
                
                // Verificar Supabase com tratamento de erros normais
                if (typeof supabase !== 'undefined') {
                    try {
                        const { data, error } = await Promise.race([
                            supabase.auth.getSession(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout auth check')), 5000))
                        ]);
                        
                        console.log('Contabilidade - Supabase Session:', {
                            hasSession: !!data?.session,
                            hasUser: !!data?.session?.user,
                            userEmail: data?.session?.user?.email,
                            error: error?.message || 'nenhum'
                        });
                        
                        if (error && !isErroNormalAPI(error)) {
                            console.log('⚠️ Erro Supabase relevante:', error.message);
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Erro de autenticação Supabase');
                                return;
                            }
                        } else if (!data?.session?.user && !error) {
                            console.log('⚠️ Sessão Supabase não encontrada');
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Sessão Supabase expirada');
                                return;
                            }
                        }
                    } catch (error) {
                        if (error.message === 'Timeout auth check') {
                            console.log('⚠️ Timeout na verificação de autenticação');
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Timeout na autenticação');
                                return;
                            }
                        } else if (!isErroNormalAPI(error)) {
                            console.log('⚠️ Erro na verificação Supabase:', error.message);
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Falha na conexão com Supabase');
                                return;
                            }
                        } else {
                            console.log('📡 Erro normal de API ignorado:', error.message);
                        }
                    }
                }
                
                // Teste de conectividade básica (apenas se necessário)
                if (verificacoesFalhas > 0 && typeof getCurrentUser !== 'undefined') {
                    try {
                        const userCheck = await Promise.race([
                            getCurrentUser(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout user check')), 6000))
                        ]);
                        
                        console.log('Contabilidade - getCurrentUser():', {
                            success: !userCheck.error,
                            hasUser: !!userCheck.data?.user,
                            error: userCheck.error?.message || 'nenhum'
                        });
                        
                        if (userCheck.error && !isErroNormalAPI(userCheck.error)) {
                            console.log('⚠️ getCurrentUser() falhou com erro relevante');
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Falha na verificação de usuário');
                                return;
                            }
                        }
                    } catch (error) {
                        if (error.message === 'Timeout user check') {
                            console.log('⚠️ Timeout na verificação de usuário');
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Timeout na verificação de usuário');
                                return;
                            }
                        } else if (!isErroNormalAPI(error)) {
                            console.log('⚠️ Erro na verificação de usuário:', error.message);
                            verificacoesFalhas++;
                            if (verificacoesFalhas >= MAX_FALHAS) {
                                redirecionarParaLogin('Erro na verificação de usuário');
                                return;
                            }
                        } else {
                            console.log('📡 Erro normal de API ignorado no getCurrentUser:', error.message);
                        }
                    }
                }
            }
            
            // Se chegou até aqui, a sessão está OK
            console.log('✅ Sessão válida');
            verificacoesFalhas = 0;
            errosConsecutivos = 0;
            ultimaVerificacao = Date.now();
            
            // Marcar que a página terminou de carregar se chegou até aqui
            if (paginaCarregando) {
                paginaCarregando = false;
                console.log('✅ Página carregada com sucesso');
            }
            
        } catch (error) {
            console.error('❌ Erro geral ao verificar sessão:', error);
            if (!isErroNormalAPI(error)) {
                verificacoesFalhas++;
                if (verificacoesFalhas >= MAX_FALHAS) {
                    redirecionarParaLogin('Erro geral na verificação de sessão: ' + error.message);
                }
            } else {
                console.log('📡 Erro normal de API ignorado no catch geral:', error.message);
            }
        }
    }
    
    // Monitorar navegação e eventos
    function monitorarNavegacao() {
        // Verificar sessão quando a página carrega
        window.addEventListener('load', () => {
            console.log('📄 Página carregada, verificando sessão em 3 segundos...');
            setTimeout(verificarSessao, 3000);
        });
        
        // Detectar quando elementos são carregados (indicativo de que saiu do loading)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Verificar se foram adicionados elementos que indicam carregamento completo
                    const addedElements = Array.from(mutation.addedNodes).filter(node => node.nodeType === 1);
                    if (addedElements.some(el => el.matches && (el.matches('tbody tr') || el.matches('.cliente-row') || el.matches('[data-loaded]')))) {
                        paginaCarregando = false;
                        console.log('✅ Conteúdo carregado detectado');
                    }
                }
            });
        });
        
        // Observar mudanças no DOM
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Verificar sessão quando a página fica visível novamente
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Página ficou visível, verificando sessão...');
                setTimeout(verificarSessao, 1000);
            }
        });
        
        // Interceptar navegação por links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && !link.href.includes('login.html')) {
                console.log('🔗 Link clicado, verificando sessão...', link.href);
                // Reset do estado de carregamento
                paginaCarregando = true;
                tempoInicioCarregamento = Date.now();
                setTimeout(verificarSessao, 500);
            }
        });
    }
    
    // Interceptar requests com filtragem inteligente
    const originalFetch = window.fetch;
    window.fetch = function() {
        return originalFetch.apply(this, arguments)
            .then(response => {
                if (response.status === 401) {
                    console.log('🚫 Erro 401 - Não autorizado, redirecionando para login');
                    redirecionarParaLogin('Acesso negado pelo servidor (401)');
                } else if (response.status === 403) {
                    console.log('🚫 Erro 403 - Proibido, redirecionando para login');
                    redirecionarParaLogin('Acesso proibido pelo servidor (403)');
                }
                return response;
            })
            .catch(error => {
                // Apenas redirecionar para erros específicos de autenticação
                if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
                    console.log('🚫 Erro de autenticação detectado');
                    redirecionarParaLogin('Erro de autenticação');
                } else {
                    console.log('📡 Erro normal de fetch ignorado:', error.message);
                }
                throw error;
            });
    };
    
    // Interceptar auth state changes do Supabase
    if (typeof supabase !== 'undefined') {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state change:', event, !!session);
            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
                console.log('🔄 Supabase detectou logout real, redirecionando...');
                redirecionarParaLogin('Logout detectado pelo Supabase');
            }
        });
    }
    
    // Inicializar proteção
    function iniciarProtecaoSessao() {
        console.log('🛡️ Proteção de sessão ATIVADA (MODO INTELIGENTE)');
        console.log('🔧 Configuração: MAX_FALHAS=2, Timeouts aumentados, Filtragem de erros normais');
        
        monitorarNavegacao();
        
        // Verificação moderada nos primeiros 30 segundos
        const intervaloRapido = setInterval(() => {
            console.log('⚡ Verificação inicial...');
            verificarSessao();
        }, 8000); // A cada 8 segundos (menos frequente)
        
        // Depois de 30 segundos, verificação normal
        setTimeout(() => {
            clearInterval(intervaloRapido);
            console.log('🔄 Mudando para verificação normal (15s)');
            setInterval(() => {
                console.log('⏰ Verificação periódica...');
                verificarSessao();
            }, 15000); // A cada 15 segundos
        }, 30000);
        
        // Verificação inicial
        setTimeout(() => {
            console.log('🚀 Verificação inicial da sessão...');
            verificarSessao();
        }, 2500);
    }
    
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarProtecaoSessao);
    } else {
        iniciarProtecaoSessao();
    }
    
})(); 