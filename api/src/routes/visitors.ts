import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import { validateAndSanitize, schemas } from '../middleware/validation';
import {
  getAllVisitors,
  createVisitor,
  updateVisitor,
  deleteVisitor,
} from '../controllers/visitorsController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar visitantes
router.get('/', requireMemberOrAbove, getAllVisitors);

// Criar visitante
router.post('/',
  requireMemberOrAbove,
  validateAndSanitize(schemas.createVisitor),
  createVisitor
);

// Atualizar visitante
router.put('/:id',
  requireMemberOrAbove,
  validateAndSanitize(schemas.updateVisitor),
  updateVisitor
);

// Deletar visitante
router.delete('/:id',
  requireLeaderOrAdmin,
  deleteVisitor
);

export default router;
