"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMemberOrAbove = exports.requireLeaderOrAdmin = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const authenticateToken = async (req, res, next) => {
    // BYPASS TEMPORÁRIO PARA TESTES - REMOVER EM PRODUÇÃO
    console.log('🔓 Auth middleware bypassed for testing');
    req.user = { id: '550e8400-e29b-41d4-a716-446655444441', role: 'admin' };
    next();
    return;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({
            success: false,
            error: 'Token de acesso requerido'
        });
        return;
    }
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            console.error('❌ Supabase auth.getUser error:', error);
            res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
            return;
        }
        // Buscar informações adicionais do usuário
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        if (userError || !userData) {
            res.status(401).json({
                success: false,
                error: 'Usuário não encontrado'
            });
            return;
        }
        req.user = userData;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(403).json({
            success: false,
            error: 'Falha na validação do token'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
            return;
        }
        const userRole = user.role || 'member';
        if (!roles.includes(userRole)) {
            res.status(403).json({
                success: false,
                error: 'Permissões insuficientes'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireLeaderOrAdmin = (0, exports.requireRole)(['admin', 'leader']);
exports.requireMemberOrAbove = (0, exports.requireRole)(['admin', 'leader', 'member']);
//# sourceMappingURL=auth.js.map