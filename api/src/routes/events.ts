import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import { validateAndSanitize, schemas } from '../middleware/validation';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  registerForEvent,
  unregisterFromEvent
} from '../controllers/eventsController';

const router = Router();

// Rotas públicas (sem autenticação)
router.get('/stats', getEventStats);

// Rotas que requerem autenticação
router.use(authenticateToken);

// Listar eventos com filtros e paginação
router.get('/', 
  validateAndSanitize(schemas.pagination.merge(schemas.eventQuery)),
  getEvents
);

// Buscar evento por ID
router.get('/:id', getEventById);

// Criar evento (leader ou admin)
router.post('/',
  requireLeaderOrAdmin,
  validateAndSanitize(schemas.createEvent),
  createEvent
);

// Atualizar evento (leader ou admin)
router.put('/:id',
  requireLeaderOrAdmin,
  validateAndSanitize(schemas.updateEvent),
  updateEvent
);

// Deletar evento (leader ou admin)
router.delete('/:id',
  requireLeaderOrAdmin,
  deleteEvent
);

// Inscrever-se em evento
router.post('/:id/register',
  requireMemberOrAbove,
  registerForEvent
);

// Cancelar inscrição em evento
router.delete('/:id/register',
  requireMemberOrAbove,
  unregisterFromEvent
);

export default router;