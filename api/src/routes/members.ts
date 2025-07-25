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
router.get('/stats', getMemberStats);

// Aniversariantes da semana
router.get('/birthdays', getMemberBirthdays);

// Teste simples primeiro  
router.get('/test', (req, res) => {
  res.json({
    success: true,
    data: {
      message: "Teste funcionando - API de membros acessível",
      timestamp: new Date().toISOString()
    }
  });
});

// Listar membros com filtros e paginação
router.get('/', getMembers);

// Buscar membro por ID
router.get('/:id', getMemberById);

// Criar membro (leader ou admin)
router.post('/',
  validateAndSanitize(schemas.createMember),
  createMember
);

// Atualizar membro (leader ou admin)
router.put('/:id',
  validateAndSanitize(schemas.updateMember),
  updateMember
);

// Deletar membro (leader ou admin)
router.delete('/:id',
  deleteMember
);

// Desativar membro (leader ou admin)
router.post('/:id/deactivate',
  deactivateMember
);

export default router;