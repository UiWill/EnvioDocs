// ============================================================================
// PATCH ADICIONAL PARA SESSION-GUARD - Validação de CNPJ
// ============================================================================
// Cole este código NO FINAL do arquivo session-guard.js (dentro da última chave "}")
// ANTES da linha final: })();
// ============================================================================

// Adicionar cache do CNPJ da contabilidade
let cnpjContabilidadeCache = null;

// Função para limpar cache do CNPJ
function limparCacheCNPJ() {
    cnpjContabilidadeCache = null;
    localStorage.removeItem('cnpjContabilidade');
    console.log('🧹 Cache do CNPJ limpo');
}

// Sobrescrever função de redirecionamento para limpar cache
const redirecionarParaLogin_ORIGINAL = redirecionarParaLogin;
redirecionarParaLogin = function(motivo) {
    limparCacheCNPJ();
    return redirecionarParaLogin_ORIGINAL(motivo);
};

// Adicionar validação de CNPJ no logout do Supabase
if (typeof supabase !== 'undefined') {
    const originalOnAuthStateChange = supabase.auth.onAuthStateChange;

    supabase.auth.onAuthStateChange = function(callback) {
        return originalOnAuthStateChange.call(this, (event, session) => {
            console.log('🔐 Auth state change:', event);

            if (event === 'SIGNED_OUT') {
                limparCacheCNPJ();
            }

            // Chamar callback original
            if (callback) callback(event, session);
        });
    };
}

console.log('✅ Patch de validação de CNPJ aplicado ao session-guard');
