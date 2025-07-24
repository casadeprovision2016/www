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

// Debug endpoint without auth (DEVELOPMENT ONLY) - Must be before auth middleware
router.get('/debug', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔍 DEBUG: Starting ministries debug endpoint...');
    const { data, error } = await supabase.from('ministries').select('*').limit(5);
    
    console.log('🔍 DEBUG: Query result - Error:', error);
    console.log('🔍 DEBUG: Query result - Data count:', data?.length);
    
    return res.json({
      success: true,
      debug: true,
      error: error,
      dataCount: data?.length,
      sampleData: data?.slice(0, 2)
    });
  } catch (err: any) {
    console.error('❌ DEBUG ERROR:', err);
    return res.json({
      success: false,
      debug: true,
      error: err.message,
      stack: err.stack
    });
  }
});

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