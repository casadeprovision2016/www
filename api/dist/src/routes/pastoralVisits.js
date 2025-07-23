"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const pastoralVisitsController_1 = require("../controllers/pastoralVisitsController");
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.authenticateToken);
// Estatísticas de visitas pastorais
router.get('/stats', auth_1.requireLeaderOrAdmin, pastoralVisitsController_1.getPastoralVisitStats);
// Listar visitas pastorais
router.get('/', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination), pastoralVisitsController_1.getPastoralVisits);
// Buscar visita por ID
router.get('/:id', auth_1.requireMemberOrAbove, pastoralVisitsController_1.getPastoralVisitById);
// Buscar visitas por pastor
router.get('/pastor/:pastorId', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination), pastoralVisitsController_1.getVisitsByPastor);
// Buscar visitas por membro
router.get('/member/:memberId', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination), pastoralVisitsController_1.getVisitsByMember);
// Criar visita pastoral (leader ou admin)
router.post('/', auth_1.requireLeaderOrAdmin, (0, validation_1.validateAndSanitize)(validation_1.schemas.createPastoralVisit), pastoralVisitsController_1.createPastoralVisit);
// Atualizar visita pastoral (leader ou admin)
router.put('/:id', auth_1.requireLeaderOrAdmin, pastoralVisitsController_1.updatePastoralVisit);
// Concluir visita pastoral (leader ou admin)
router.post('/:id/complete', auth_1.requireLeaderOrAdmin, pastoralVisitsController_1.completePastoralVisit);
// Cancelar visita pastoral (leader ou admin)
router.post('/:id/cancel', auth_1.requireLeaderOrAdmin, pastoralVisitsController_1.cancelPastoralVisit);
// Deletar visita pastoral (leader ou admin)
router.delete('/:id', auth_1.requireLeaderOrAdmin, pastoralVisitsController_1.deletePastoralVisit);
exports.default = router;
//# sourceMappingURL=pastoralVisits.js.map