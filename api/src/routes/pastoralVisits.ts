import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import { validateAndSanitize, schemas } from '../middleware/validation';
import {
  getPastoralVisits,
  getPastoralVisitById,
  createPastoralVisit,
  updatePastoralVisit,
  deletePastoralVisit,
  completePastoralVisit,
  cancelPastoralVisit,
  getPastoralVisitStats,
  getVisitsByPastor,
  getVisitsByMember
} from '../controllers/pastoralVisitsController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Estatísticas de visitas pastorais
router.get('/stats', requireLeaderOrAdmin, getPastoralVisitStats);

// Listar visitas pastorais
router.get('/', 
  requireMemberOrAbove,
  validateAndSanitize(schemas.pagination),
  getPastoralVisits
);

// Buscar visita por ID
router.get('/:id', requireMemberOrAbove, getPastoralVisitById);

// Buscar visitas por pastor
router.get('/pastor/:pastorId',
  requireMemberOrAbove,
  validateAndSanitize(schemas.pagination),
  getVisitsByPastor
);

// Buscar visitas por membro
router.get('/member/:memberId',
  requireMemberOrAbove,
  validateAndSanitize(schemas.pagination),
  getVisitsByMember
);

// Criar visita pastoral (leader ou admin)
router.post('/',
  requireLeaderOrAdmin,
  validateAndSanitize(schemas.createPastoralVisit),
  createPastoralVisit
);

// Atualizar visita pastoral (leader ou admin)
router.put('/:id',
  requireLeaderOrAdmin,
  updatePastoralVisit
);

// Concluir visita pastoral (leader ou admin)
router.post('/:id/complete',
  requireLeaderOrAdmin,
  completePastoralVisit
);

// Cancelar visita pastoral (leader ou admin)
router.post('/:id/cancel',
  requireLeaderOrAdmin,
  cancelPastoralVisit
);

// Deletar visita pastoral (leader ou admin)
router.delete('/:id',
  requireLeaderOrAdmin,
  deletePastoralVisit
);

export default router;