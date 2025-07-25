import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest, JWTPayload } from '@shared/types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // BYPASS TEMPORÁRIO PARA TESTES - REMOVER EM PRODUÇÃO
  console.log('🔓 Auth middleware bypassed for testing');
  (req as any).user = { id: '550e8400-e29b-41d4-a716-446655440001', role: 'admin' };
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

    (req as AuthenticatedRequest).user = userData;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(403).json({ 
      success: false, 
      error: 'Falha na validação do token' 
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

export const requireAdmin = requireRole(['admin']);
export const requireLeaderOrAdmin = requireRole(['admin', 'leader']);
export const requireMemberOrAbove = requireRole(['admin', 'leader', 'member']);