"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const streamsController_1 = require("../controllers/streamsController");
const router = (0, express_1.Router)();
// Rota pública para transmissão ao vivo
router.get('/live', streamsController_1.getLiveStream);
// Todas as outras rotas requerem autenticação
router.use(auth_1.authenticateToken);
// Listar transmissões
router.get('/', auth_1.requireMemberOrAbove, (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination), streamsController_1.getStreams);
// Buscar transmissão por ID
router.get('/:id', auth_1.requireMemberOrAbove, streamsController_1.getStreamById);
// Criar transmissão (leader ou admin)
router.post('/', auth_1.requireLeaderOrAdmin, (0, validation_1.validateAndSanitize)(validation_1.schemas.createStream), streamsController_1.createStream);
// Atualizar transmissão (leader ou admin)
router.put('/:id', auth_1.requireLeaderOrAdmin, streamsController_1.updateStream);
// Finalizar transmissão (leader ou admin)
router.post('/:id/end', auth_1.requireLeaderOrAdmin, streamsController_1.endStream);
// Deletar transmissão (leader ou admin)
router.delete('/:id', auth_1.requireLeaderOrAdmin, streamsController_1.deleteStream);
exports.default = router;
//# sourceMappingURL=streams.js.map