import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import { validateAndSanitize, schemas } from '../middleware/validation';
import {
  getAttendance,
  getAttendanceByEventId,
  markAttendance,
  updateAttendance,
  getAttendanceStats
} from '../controllers/attendanceController';

const router = Router();

// Rotas que requerem autenticação
router.use(authenticateToken);

// Listar todas as presenças com filtros
router.get('/', 
  validateAndSanitize(schemas.pagination),
  getAttendance
);

// Buscar presenças por evento
router.get('/event/:eventId', getAttendanceByEventId);

// Estatísticas de presença
router.get('/stats', getAttendanceStats);

// Marcar presença em evento
router.post('/',
  requireMemberOrAbove,
  markAttendance
);

// Atualizar presença (leader ou admin)
router.put('/:id',
  requireLeaderOrAdmin,
  updateAttendance
);

export default router;