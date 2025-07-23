import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import { validateAndSanitize, schemas } from '../middleware/validation';
import {
  getContributions,
  createContribution
} from '../controllers/contributionsController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar contribuições
router.get('/', 
  requireMemberOrAbove,
  validateAndSanitize(schemas.pagination),
  getContributions
);

// Criar contribuição (leader ou admin)
router.post('/',
  requireLeaderOrAdmin,
  createContribution
);

export default router;