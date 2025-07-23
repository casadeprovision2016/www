"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const ministriesController_1 = require("../controllers/ministriesController");
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.authenticateToken);
// Listar ministérios
router.get('/', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination), ministriesController_1.getMinistries);
// Buscar ministério por ID
router.get('/:id', auth_1.requireMemberOrAbove, ministriesController_1.getMinistryById);
// Buscar membros de um ministério
router.get('/:id/members', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination), ministriesController_1.getMinistryMembers);
// Criar ministério (leader ou admin)
router.post('/', auth_1.requireLeaderOrAdmin, (0, validation_1.validateAndSanitize)(validation_1.schemas.createMinistry), ministriesController_1.createMinistry);
// Atualizar ministério (leader ou admin)
router.put('/:id', auth_1.requireLeaderOrAdmin, ministriesController_1.updateMinistry);
// Deletar ministério (leader ou admin)
router.delete('/:id', auth_1.requireLeaderOrAdmin, ministriesController_1.deleteMinistry);
// Adicionar membro ao ministério (leader ou admin)
router.post('/members', auth_1.requireLeaderOrAdmin, ministriesController_1.addMinistryMember);
// Atualizar membro do ministério (leader ou admin)
router.put('/members/:id', auth_1.requireLeaderOrAdmin, ministriesController_1.updateMinistryMember);
// Remover membro do ministério (leader ou admin)
router.delete('/members/:id', auth_1.requireLeaderOrAdmin, ministriesController_1.removeMinistryMember);
exports.default = router;
//# sourceMappingURL=ministries.js.map