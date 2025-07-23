import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import { validateAndSanitize, schemas } from '../middleware/validation';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  deactivateMember,
  getMemberStats,
  getMemberBirthdays
} from '../controllers/membersController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Estatísticas de membros (para dashboard)
router.get('/stats', requireMemberOrAbove, getMemberStats);

// Aniversariantes da semana
router.get('/birthdays', requireMemberOrAbove, getMemberBirthdays);

// Listar membros com filtros e paginação
router.get('/', 
  requireMemberOrAbove,
  validateAndSanitize(schemas.pagination),
  getMembers
);

// Buscar membro por ID
router.get('/:id', requireMemberOrAbove, getMemberById);

// Criar membro (leader ou admin)
router.post('/',
  requireLeaderOrAdmin,
  validateAndSanitize(schemas.createMember),
  createMember
);

// Atualizar membro (leader ou admin)
router.put('/:id',
  requireLeaderOrAdmin,
  validateAndSanitize(schemas.updateMember),
  updateMember
);

// Deletar membro (leader ou admin)
router.delete('/:id',
  requireLeaderOrAdmin,
  deleteMember
);

// Desativar membro (leader ou admin)
router.post('/:id/deactivate',
  requireLeaderOrAdmin,
  deactivateMember
);

export default router;