import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import {
  getDashboardStats,
  getMonthlyReport,
  getYearlyReport,
  getCustomReport
} from '../controllers/reportsController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Estatísticas do dashboard (disponível para todos os membros)
router.get('/dashboard', requireMemberOrAbove, getDashboardStats);

// Relatório mensal (leader ou admin)
router.get('/monthly', requireLeaderOrAdmin, getMonthlyReport);

// Relatório anual (leader ou admin)
router.get('/yearly', requireLeaderOrAdmin, getYearlyReport);

// Relatório customizado (leader ou admin)
router.get('/custom', requireLeaderOrAdmin, getCustomReport);

export default router;