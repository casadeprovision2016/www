"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const uploadService_1 = require("../services/uploadService");
const donationsController_1 = require("../controllers/donationsController");
const router = (0, express_1.Router)();
// Rotas públicas
router.get('/stats', donationsController_1.getDonationStats);
// Todas as outras rotas requerem autenticação
router.use(auth_1.authenticateToken);
// Listar doações com filtros e paginação
router.get('/', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination.merge(validation_1.schemas.donationQuery)), donationsController_1.getDonations);
// Exportar doações (CSV/JSON)
router.get('/export', auth_1.requireLeaderOrAdmin, donationsController_1.exportDonations);
// Buscar doação por ID
router.get('/:id', auth_1.requireMemberOrAbove, donationsController_1.getDonationById);
// Buscar doações por usuário
router.get('/user/:userId', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination), donationsController_1.getDonationsByUser);
// Criar doação
router.post('/', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.createDonation), donationsController_1.createDonation);
// Atualizar doação (leader ou admin)
router.put('/:id', auth_1.requireLeaderOrAdmin, donationsController_1.updateDonation);
// Deletar doação (leader ou admin)
router.delete('/:id', auth_1.requireLeaderOrAdmin, donationsController_1.deleteDonation);
// Upload de comprovante
router.post('/:id/receipt', auth_1.requireMemberOrAbove, uploadService_1.uploadService.uploadSingle('receipt'), donationsController_1.uploadReceipt);
exports.default = router;
//# sourceMappingURL=donations.js.map