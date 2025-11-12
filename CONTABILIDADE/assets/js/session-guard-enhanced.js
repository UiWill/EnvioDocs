// ============================================================================
// SESSION GUARD APRIMORADO COM VALIDAÇÃO DE CNPJ
// ============================================================================
// Este arquivo SUBSTITUI o session-guard.js original com validações adicionais
// de segurança para multi-tenancy
// ============================================================================

(function() {
    'use strict';

    // Detectar contexto da página
    const isClientePage = window.location.href.includes('/CLIENTES/');
    const isContabilidadePage = window.location.href.includes('/CONTABILIDADE/');
    const isLoginPage = window.location.href.includes('login.html');

    // Se estiver na página de login, não fazer nada
    if (isLoginPage) return;

    let verificacaoInicial = false;
    let cnpjContabilidadeAtual = null; // Cache do CNPJ da contabilidade logada

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
        localStorage.removeItem('cnpjContabilidade'); // Limpar cache do CNPJ

        // Redirecionar para a página de login apropriada
        if (isClientePage) {
            window.location.href = 'login.html';
        } else if (isContabilidadePage) {
            window.location.href = 'login.html';
        }
    }

    // 🔒 NOVA FUNÇÃO: Obter e cachear CNPJ da contabilidade logada
    async function obterCNPJContabilidade() {
        try {
            // Se já está em cache, retornar
            if (cnpjContabilidadeAtual) {
                return cnpjContabilidadeAtual;
            }

            // Tentar obter do localStorage primeiro (cache persistente)
            const cachedCNPJ = localStorage.getItem('cnpjContabilidade');
            if (cachedCNPJ) {
                cnpjContabilidadeAtual = cachedCNPJ;
                console.log('📦 CNPJ da contabilidade recuperado do cache:', cachedCNPJ);
                return cachedCNPJ;
            }

            // Se não está em cache, buscar do banco
            if (typeof supabase === 'undefined' || typeof getCurrentUser === 'undefined') {
                console.error('⚠️ Supabase ou getCurrentUser não disponível');
                return null;
            }

            const { data: userData, error: userError } = await getCurrentUser();
            if (userError || !userData || !userData.user) {
                console.error('⚠️ Erro ao obter usuário atual');
                return null;
            }

            const userEmail = userData.user.email;
            const { data, error } = await supabase
                .from('Clientes')
                .select('CNPJ')
                .eq('email', userEmail)
                .eq('ADM', 'ADM')
                .single();

            if (error || !data) {
                console.error('⚠️ Erro ao buscar CNPJ da contabilidade:', error);
                return null;
            }

            // Cachear o CNPJ
            cnpjContabilidadeAtual = data.CNPJ;
            localStorage.setItem('cnpjContabilidade', data.CNPJ);
            console.log('✅ CNPJ da contabilidade obtido e cacheado:', data.CNPJ);

            return data.CNPJ;
        } catch (e) {
            console.error('Erro ao obter CNPJ da contabilidade:', e);
            return null;
        }
    }

    // 🔒 NOVA FUNÇÃO: Validar se o CNPJ ainda corresponde ao usuário logado
    async function validarCNPJContabilidade() {
        try {
            if (!isContabilidadePage) return true;

            const cnpjCached = cnpjContabilidadeAtual || localStorage.getItem('cnpjContabilidade');
            if (!cnpjCached) {
                console.log('⚠️ Sem CNPJ em cache, obtendo...');
                await obterCNPJContabilidade();
                return true;
            }

            // Verificar se o CNPJ em cache ainda corresponde ao usuário logado
            if (typeof supabase === 'undefined' || typeof getCurrentUser === 'undefined') {
                return true; // Se não pode verificar, permitir (evitar falsos positivos)
            }

            const { data: userData } = await getCurrentUser();
            if (!userData || !userData.user) {
                return false;
            }

            const userEmail = userData.user.email;
            const { data, error } = await supabase
                .from('Clientes')
                .select('CNPJ')
                .eq('email', userEmail)
                .eq('ADM', 'ADM')
                .single();

            if (error || !data) {
                console.error('⚠️ Erro ao validar CNPJ:', error);
                return false;
            }

            if (data.CNPJ !== cnpjCached) {
                console.error('🚨 CNPJ ALTERADO! Possível troca de conta.');
                console.error('CNPJ cached:', cnpjCached);
                console.error('CNPJ atual:', data.CNPJ);

                // Limpar cache e forçar novo login
                cnpjContabilidadeAtual = null;
                localStorage.removeItem('cnpjContabilidade');
                return false;
            }

            return true;
        } catch (e) {
            console.error('Erro ao validar CNPJ:', e);
            return true; // Em caso de erro, permitir (evitar falsos positivos)
        }
    }

    // Verificar estado da sessão (apenas quando necessário)
    async function verificarSessao(contexto = 'manual') {
        try {
            console.log('🔍 Verificando sessão...', {
                contexto: contexto,
                pagina: isClientePage ? 'CLIENTE' : 'CONTABILIDADE'
            });

            if (isClientePage) {
                // Para páginas de CLIENTES
                const clienteData = sessionStorage.getItem('clienteData');
                const authToken = localStorage.getItem('sb-osnjsgleardkzrnddlgt-auth-token');

                if (!clienteData || !authToken) {
                    console.log('⚠️ Dados do cliente ou token perdidos');
                    redirecionarParaLogin('Dados de autenticação perdidos');
                    return false;
                }

                // Verificar Supabase rapidamente
                if (typeof supabase !== 'undefined') {
                    try {
                        const { data, error } = await Promise.race([
                            supabase.auth.getSession(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                        ]);

                        if (error && !isErroNormalAPI(error)) {
                            console.log('⚠️ Erro Supabase:', error.message);
                            redirecionarParaLogin('Erro de autenticação');
                            return false;
                        }

                        if (!data?.session?.user && !error) {
                            console.log('⚠️ Sessão Supabase não encontrada');
                            redirecionarParaLogin('Sessão expirada');
                            return false;
                        }
                    } catch (error) {
                        if (error.message !== 'Timeout' && !isErroNormalAPI(error)) {
                            console.log('⚠️ Falha na verificação:', error.message);
                            redirecionarParaLogin('Falha na autenticação');
                            return false;
                        }
                    }
                }

            } else if (isContabilidadePage) {
                // Para páginas de CONTABILIDADE
                const authToken = localStorage.getItem('sb-osnjsgleardkzrnddlgt-auth-token');

                if (!authToken) {
                    console.log('⚠️ Token de autenticação perdido');
                    redirecionarParaLogin('Token perdido');
                    return false;
                }

                // 🔒 NOVA VALIDAÇÃO: Verificar CNPJ da contabilidade
                const cnpjValido = await validarCNPJContabilidade();
                if (!cnpjValido) {
                    console.log('⚠️ CNPJ da contabilidade inválido ou alterado');
                    redirecionarParaLogin('Sessão inválida');
                    return false;
                }

                // Verificar Supabase rapidamente
                if (typeof supabase !== 'undefined') {
                    try {
                        const { data, error } = await Promise.race([
                            supabase.auth.getSession(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                        ]);

                        if (error && !isErroNormalAPI(error)) {
                            console.log('⚠️ Erro Supabase:', error.message);
                            redirecionarParaLogin('Erro de autenticação');
                            return false;
                        }

                        if (!data?.session?.user && !error) {
                            console.log('⚠️ Sessão Supabase não encontrada');
                            redirecionarParaLogin('Sessão expirada');
                            return false;
                        }
                    } catch (error) {
                        if (error.message !== 'Timeout' && !isErroNormalAPI(error)) {
                            console.log('⚠️ Falha na verificação:', error.message);
                            redirecionarParaLogin('Falha na autenticação');
                            return false;
                        }
                    }
                }
            }

            console.log('✅ Sessão válida');
            return true;

        } catch (error) {
            console.error('❌ Erro geral ao verificar sessão:', error);
            if (!isErroNormalAPI(error)) {
                redirecionarParaLogin('Erro na verificação: ' + error.message);
                return false;
            }
            return true; // Ignorar erros normais
        }
    }

    // Interceptar requests críticos apenas
    const originalFetch = window.fetch;
    window.fetch = function() {
        return originalFetch.apply(this, arguments)
            .then(response => {
                if (response.status === 401) {
                    console.log('🚫 Erro 401 - redirecionando');
                    redirecionarParaLogin('Acesso negado (401)');
                } else if (response.status === 403) {
                    console.log('🚫 Erro 403 - redirecionando');
                    redirecionarParaLogin('Acesso proibido (403)');
                }
                return response;
            })
            .catch(error => {
                if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
                    redirecionarParaLogin('Erro de autenticação');
                }
                throw error;
            });
    };

    // Interceptar mudanças de auth do Supabase
    if (typeof supabase !== 'undefined') {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state change:', event);
            if (event === 'SIGNED_OUT') {
                // Limpar cache do CNPJ
                cnpjContabilidadeAtual = null;
                localStorage.removeItem('cnpjContabilidade');
                redirecionarParaLogin('Logout detectado');
            }
        });
    }

    // Verificar apenas em navegações
    function monitorarNavegacao() {
        // Interceptar cliques em links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && !link.href.includes('login.html') && !link.href.includes('#')) {
                console.log('🔗 Navegação detectada, verificando sessão...');
                setTimeout(() => verificarSessao('navegacao'), 1000);
            }
        });

        // Verificar quando volta do background
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && verificacaoInicial) {
                console.log('👁️ Página voltou do background, verificando...');
                setTimeout(() => verificarSessao('visibilidade'), 500);
            }
        });
    }

    // Inicialização simples
    async function iniciarProtecao() {
        console.log('🛡️ Proteção de sessão APRIMORADA ativada');
        console.log('📋 Modo: Verificação inicial + navegações + validação CNPJ');

        monitorarNavegacao();

        // 🔒 Obter CNPJ da contabilidade logo no início
        if (isContabilidadePage) {
            await obterCNPJContabilidade();
        }

        // Verificação inicial única
        setTimeout(async () => {
            console.log('🚀 Verificação inicial da sessão...');
            const sessaoValida = await verificarSessao('inicial');
            verificacaoInicial = true;

            if (sessaoValida) {
                console.log('✅ Sessão inicial válida - monitoramento ativo');
                console.log('🔒 CNPJ da contabilidade:', cnpjContabilidadeAtual);
            }
        }, 3000);
    }

    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarProtecao);
    } else {
        iniciarProtecao();
    }

    // 🔒 Exportar função para uso em outras partes do código
    window.obterCNPJContabilidadeAtual = obterCNPJContabilidade;

})();
