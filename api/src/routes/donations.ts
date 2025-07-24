import { Router } from 'express';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';
import { validateAndSanitize, schemas } from '../middleware/validation';
import { uploadService } from '../services/uploadService';
import {
  getDonations,
  getDonationById,
  createDonation,
  updateDonation,
  deleteDonation,
  uploadReceipt,
  getDonationStats,
  exportDonations,
  getDonationsByUser,
  getDonationInfo,
  updateDonationInfo
} from '../controllers/donationsController';

const router = Router();

// Rotas públicas
router.get('/stats', getDonationStats);

// Todas as outras rotas requerem autenticação
router.use(authenticateToken);

// Informações de doação (dados bancários, etc.)
router.get('/info', requireMemberOrAbove, getDonationInfo);
router.put('/info', requireLeaderOrAdmin, updateDonationInfo);

// Listar doações com filtros e paginação
router.get('/', 
  requireMemberOrAbove,
  validateAndSanitize(schemas.pagination.merge(schemas.donationQuery)),
  getDonations
);

// Exportar doações (CSV/JSON)
router.get('/export',
  requireLeaderOrAdmin,
  exportDonations
);

// Buscar doação por ID
router.get('/:id', requireMemberOrAbove, getDonationById);

// Buscar doações por usuário
router.get('/user/:userId', 
  requireMemberOrAbove,
  validateAndSanitize(schemas.pagination),
  getDonationsByUser
);

// Criar doação
router.post('/',
  requireMemberOrAbove,
  validateAndSanitize(schemas.createDonation),
  createDonation
);

// Atualizar doação (leader ou admin)
router.put('/:id',
  requireLeaderOrAdmin,
  updateDonation
);

// Deletar doação (leader ou admin)
router.delete('/:id',
  requireLeaderOrAdmin,
  deleteDonation
);

// Upload de comprovante
router.post('/:id/receipt',
  requireMemberOrAbove,
  uploadService.uploadSingle('receipt'),
  uploadReceipt
);

export default router;