"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const contributionsController_1 = require("../controllers/contributionsController");
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.authenticateToken);
// Listar contribuições
router.get('/', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination), contributionsController_1.getContributions);
// Criar contribuição (leader ou admin)
router.post('/', auth_1.requireLeaderOrAdmin, contributionsController_1.createContribution);
exports.default = router;
//# sourceMappingURL=contributions.js.map