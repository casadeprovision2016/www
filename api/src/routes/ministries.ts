import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import { validateAndSanitize, schemas } from '../middleware/validation';
import {
  getMinistries,
  getMinistryById,
  createMinistry,
  updateMinistry,
  deleteMinistry,
  getMinistryMembers,
  addMinistryMember,
  removeMinistryMember,
  updateMinistryMember
} from '../controllers/ministriesController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Test endpoint (must come before /:id)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Ministries route working' });
});

// Listar ministérios
router.get('/', 
  requireMemberOrAbove,
  getMinistries
);

// Buscar ministério por ID (must come after specific routes)
router.get('/:id', requireMemberOrAbove, getMinistryById);

// Buscar membros de um ministério
router.get('/:id/members',
  requireMemberOrAbove,
  validateAndSanitize(schemas.pagination),
  getMinistryMembers
);

// Criar ministério (leader ou admin)
router.post('/',
  requireLeaderOrAdmin,
  validateAndSanitize(schemas.createMinistry),
  createMinistry
);

// Atualizar ministério (leader ou admin)
router.put('/:id',
  requireLeaderOrAdmin,
  updateMinistry
);

// Deletar ministério (leader ou admin)
router.delete('/:id',
  requireLeaderOrAdmin,
  deleteMinistry
);

// Adicionar membro ao ministério (leader ou admin)
router.post('/members',
  requireLeaderOrAdmin,
  addMinistryMember
);

// Atualizar membro do ministério (leader ou admin)
router.put('/members/:id',
  requireLeaderOrAdmin,
  updateMinistryMember
);

// Remover membro do ministério (leader ou admin)
router.delete('/members/:id',
  requireLeaderOrAdmin,
  removeMinistryMember
);

export default router;