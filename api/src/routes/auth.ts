import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { validateAndSanitize, schemas } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authLogger } from '../utils/logger';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Login
router.post('/login', 
  validateAndSanitize(schemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const clientIP = req.ip;

    try {
      // Autenticar com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        authLogger.loginAttempt(email, clientIP, false);
        throw new AppError('Credenciais inválidas', 401);
      }

      // Buscar dados adicionais do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        authLogger.loginAttempt(email, clientIP, false);
        throw new AppError('Usuário não encontrado', 404);
      }

      authLogger.loginAttempt(email, clientIP, true);

      res.json({
        success: true,
        data: {
          user: userData,
          token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        },
        message: 'Login realizado com sucesso'
      });

    } catch (error: any) {
      authLogger.loginAttempt(email, clientIP, false);
      throw error;
    }
  })
);

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      await supabase.auth.signOut();
      
      // Log do logout se conseguirmos identificar o usuário
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        authLogger.logout(user.id, req.ip);
      }
    } catch (error) {
      // Ignorar erros de logout
    }
  }

  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new AppError('Refresh token requerido', 400);
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token
  });

  if (error || !data.session) {
    throw new AppError('Refresh token inválido', 401);
  }

  res.json({
    success: true,
    data: {
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    }
  });
}));

// Verificar token
router.get('/verify', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new AppError('Token requerido', 401);
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AppError('Token inválido', 401);
  }

  // Buscar dados completos do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new AppError('Usuário não encontrado', 404);
  }

  res.json({
    success: true,
    data: { user: userData }
  });
}));

// Esqueci a senha
router.post('/forgot-password',
  validateAndSanitize(schemas.login.pick({ email: true })),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      throw new AppError('Erro ao enviar email de recuperação', 500);
    }

    res.json({
      success: true,
      message: 'Email de recuperação enviado com sucesso'
    });
  })
);

// Resetar senha
router.post('/reset-password',
  validateAndSanitize(schemas.login),
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('Token de recuperação requerido', 400);
    }

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      throw new AppError('Erro ao resetar senha', 500);
    }

    res.json({
      success: true,
      message: 'Senha resetada com sucesso'
    });
  })
);

export default router;