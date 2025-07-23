"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reportsController_1 = require("../controllers/reportsController");
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.authenticateToken);
// Estatísticas do dashboard (disponível para todos os membros)
router.get('/dashboard', auth_1.requireMemberOrAbove, reportsController_1.getDashboardStats);
// Relatório mensal (leader ou admin)
router.get('/monthly', auth_1.requireLeaderOrAdmin, reportsController_1.getMonthlyReport);
// Relatório anual (leader ou admin)
router.get('/yearly', auth_1.requireLeaderOrAdmin, reportsController_1.getYearlyReport);
// Relatório customizado (leader ou admin)
router.get('/custom', auth_1.requireLeaderOrAdmin, reportsController_1.getCustomReport);
exports.default = router;
//# sourceMappingURL=reports.js.map