"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const membersController_1 = require("../controllers/membersController");
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.authenticateToken);
// Estatísticas de membros (para dashboard)
router.get('/stats', auth_1.requireMemberOrAbove, membersController_1.getMemberStats);
// Aniversariantes da semana
router.get('/birthdays', auth_1.requireMemberOrAbove, membersController_1.getMemberBirthdays);
// Listar membros com filtros e paginação
router.get('/', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination), membersController_1.getMembers);
// Buscar membro por ID
router.get('/:id', auth_1.requireMemberOrAbove, membersController_1.getMemberById);
// Criar membro (leader ou admin)
router.post('/', auth_1.requireLeaderOrAdmin, (0, validation_1.validateAndSanitize)(validation_1.schemas.createMember), membersController_1.createMember);
// Atualizar membro (leader ou admin)
router.put('/:id', auth_1.requireLeaderOrAdmin, (0, validation_1.validateAndSanitize)(validation_1.schemas.updateMember), membersController_1.updateMember);
// Deletar membro (leader ou admin)
router.delete('/:id', auth_1.requireLeaderOrAdmin, membersController_1.deleteMember);
// Desativar membro (leader ou admin)
router.post('/:id/deactivate', auth_1.requireLeaderOrAdmin, membersController_1.deactivateMember);
exports.default = router;
//# sourceMappingURL=members.js.map