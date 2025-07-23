import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import { validateAndSanitize, schemas } from '../middleware/validation';
import {
  getStreams,
  getStreamById,
  getLiveStream,
  createStream,
  updateStream,
  deleteStream,
  endStream
} from '../controllers/streamsController';

const router = Router();

// Rota pública para transmissão ao vivo
router.get('/live', getLiveStream);

// Todas as outras rotas requerem autenticação
router.use(authenticateToken);

// Listar transmissões
router.get('/', 
  requireMemberOrAbove,
  validateAndSanitize(schemas.pagination),
  getStreams
);

// Buscar transmissão por ID
router.get('/:id', requireMemberOrAbove, getStreamById);

// Criar transmissão (leader ou admin)
router.post('/',
  requireLeaderOrAdmin,
  validateAndSanitize(schemas.createStream),
  createStream
);

// Atualizar transmissão (leader ou admin)
router.put('/:id',
  requireLeaderOrAdmin,
  updateStream
);

// Finalizar transmissão (leader ou admin)
router.post('/:id/end',
  requireLeaderOrAdmin,
  endStream
);

// Deletar transmissão (leader ou admin)
router.delete('/:id',
  requireLeaderOrAdmin,
  deleteStream
);

export default router;